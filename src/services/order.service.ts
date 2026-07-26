// @vsc repo:vsc-project-39-backend file:src/services/order.service.ts task:b18-src-services-order-service-ts module:backend session:39
import mongoose, { ClientSession } from 'mongoose';
import { Cart } from '../models/cart.model';
import { Order, IOrder, IOrderItem } from '../models/order.model';
import { Transaction, ITransaction } from '../models/transaction.model';
import { VendorListing, IVendorListing } from '../models/vendor-listing.model';
import { Vendor, IVendor } from '../models/vendor.model';
import { Address } from '../models/address.model';
import { User } from '../models/user.model';
import {
  AppError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../utils/errors';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

export interface CheckoutResult {
  order: IOrder;
  transaction: ITransaction;
  gatewayRedirectUrl: string;
}

export interface PaginatedOrdersResult {
  orders: IOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Process checkout with atomic stock deduction.
 */
export async function checkout(
  userId: string,
  shippingAddressId: string,
  paymentMethod: 'online' | 'cod' = 'online'
): Promise<CheckoutResult> {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ValidationError('شناسه کاربر نامعتبر است.');
  }
  if (!mongoose.isValidObjectId(shippingAddressId)) {
    throw new ValidationError('شناسه آدرس نامعتبر است.');
  }

  const address = await Address.findOne({ _id: shippingAddressId, user: userId });
  if (!address) {
    throw new NotFoundError('آدرس ارسال یافت نشد.');
  }

  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.listing',
    populate: { path: 'vendor', model: 'Vendor' },
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new NotFoundError('سبد خرید شما خالی است.');
  }

  const session: ClientSession = await mongoose.startSession();

  try {
    session.startTransaction();

    const orderItems: IOrderItem[] = [];
    const vendorShippingMap = new Map<string, number>();
    let subtotal = 0;
    let totalTax = 0;
    let totalCommission = 0;

    // Atomic stock deduction per item
    for (const item of cart.items) {
      const listing = item.listing as IVendorListing;
      const qty = item.quantity;

      if (!listing || !listing._id) {
        throw new NotFoundError('یک یا چند محصول در سبد خرید نامعتبر است.');
      }

      const updatedListing = await VendorListing.findOneAndUpdate(
        { _id: listing._id, stockQuantity: { $gte: qty } },
        { $inc: { stockQuantity: -qty } },
        { session, new: true }
      );

      if (!updatedListing) {
        await session.abortTransaction();
        throw new ConflictError(`موجودی کافی نیست: ${listing.title || 'محصول'}`);
      }

      const vendor = listing.vendor as IVendor;
      const commissionRate = vendor?.commissionRate ?? 0;
      const taxRate = listing.taxRate ?? 0;

      const itemPrice = listing.price * qty;
      const itemCommission = (itemPrice * commissionRate) / 100;
      const itemTax = (itemPrice * taxRate) / 100;

      subtotal += itemPrice;
      totalCommission += itemCommission;
      totalTax += itemTax;

      // Track per-vendor shipping
      const vendorIdStr = vendor?._id?.toString() || 'unknown';
      if (!vendorShippingMap.has(vendorIdStr)) {
        vendorShippingMap.set(vendorIdStr, vendor?.shippingCost ?? 0);
      }

      orderItems.push({
        listing: listing._id,
        productSnapshot: {
          title: listing.title,
          price: listing.price,
          image: listing.image || '',
        },
        quantity: qty,
        price: listing.price,
        commissionRate,
        commissionAmount: itemCommission,
        taxRate,
        taxAmount: itemTax,
        vendor: vendor?._id,
      });
    }

    const totalShipping = Array.from(vendorShippingMap.values()).reduce(
      (sum, cost) => sum + cost,
      0
    );
    const grandTotal = subtotal + totalShipping + totalTax;

    // Create Order
    const orderDoc = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2 || '',
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
          },
          subtotal,
          totalShipping,
          totalTax,
          totalCommission,
          grandTotal,
          paymentMethod,
          status: 'pending_payment',
        },
      ],
      { session }
    );

    const order = orderDoc[0];

    // Create Transaction
    const transactionDoc = await Transaction.create(
      [
        {
          order: order._id,
          user: userId,
          amount: grandTotal,
          status: 'pending',
          paymentMethod,
        },
      ],
      { session }
    );

    const transaction = transactionDoc[0];

    await session.commitTransaction();

    // Clear cart items after successful commit
    cart.items = [];
    await cart.save();

    const gatewayRedirectUrl = `${BASE_URL}/api/orders/payment/callback?authority=mock_${order._id}`;

    return { order, transaction, gatewayRedirectUrl };
  } catch (error) {
    // If transaction is still active, abort it
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get a single order by ID for a specific user.
 */
export async function getOrderById(userId: string, orderId: string): Promise<IOrder> {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(orderId)) {
    throw new ValidationError('شناسه‌های ارسالی نامعتبر هستند.');
  }

  const order = await Order.findOne({ _id: orderId, user: userId })
    .populate('items.listing')
    .populate('items.vendor');

  if (!order) {
    throw new NotFoundError('سفارش مورد نظر یافت نشد.');
  }

  return order;
}

/**
 * Get paginated list of user orders.
 */
export async function getUserOrders(
  userId: string,
  page = 1,
  limit = 10
): Promise<PaginatedOrdersResult> {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ValidationError('شناسه کاربر نامعتبر است.');
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.listing')
      .populate('items.vendor'),
    Order.countDocuments({ user: userId }),
  ]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

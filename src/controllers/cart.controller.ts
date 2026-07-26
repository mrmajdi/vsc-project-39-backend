import { Request, Response, NextFunction } from 'express';
import z from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import Cart from '../models/cart.model';
import CartItem from '../models/cart-item.model';
import VendorListing from '../models/vendor-listing.model';
import Product from '../models/product.model';
import Pet from '../models/pet.model';
import Vendor from '../models/vendor.model';

// Helper to compute totals
const computeCartTotals = async (cartItems: any[]) => {
  let subtotal = 0;
  let totalShipping = 0;
  for (const item of cartItems) {
    const price = parseFloat(item.VendorListing.price) || 0;
    const shipping = parseFloat(item.VendorListing.shippingCost) || 0;
    const qty = item.quantity;
    subtotal += price * qty;
    totalShipping += shipping * qty;
  }
  const grandTotal = subtotal + totalShipping;
  return { subtotal, totalShipping, grandTotal };
};

// Populate items with needed relations
const populateCartItems = async (cartId: string) => {
  const items = await CartItem.findAll({
    where: { cartId },
    include: [
      {
        model: VendorListing,
        as: 'VendorListing',
        attributes: ['price', 'stockQuantity', 'shippingCost'],
        include: [
          {
            model: Product,
            as: 'Product',
            attributes: ['name', 'slug'],
            include: [
              {
                model: Pet,
                as: 'Pet',
                attributes: ['name', 'image'],
              },
            ],
          },
          {
            model: Vendor,
            as: 'Vendor',
            attributes: ['storeName'],
          },
        ],
      },
    ],
  });
  return items;
};

export const getCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  let cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    cart = await Cart.create({ userId });
  }
  const items = await populateCartItems(cart.id);
  const totals = await computeCartTotals(items);
  res.json({
    success: true,
    data: {
      items,
      totals,
    },
  });
});

const addToCartSchema = z.object({
  vendorListingId: z.string(),
  productId: z.string(),
  vendorId: z.string(),
  quantity: z.number().int().min(1).max(99),
  petId: z.string().optional(),
});

export const addToCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = addToCartSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'داده‌های نامعتبر' });
  }
  const { vendorListingId, productId, vendorId, quantity, petId } = parsed.data;

  const listing = await VendorListing.findByPk(vendorListingId, {
    include: [
      { model: Product, as: 'Product', where: { id: productId } },
      { model: Vendor, as: 'Vendor', where: { id: vendorId } },
    ],
  });
  if (!listing) {
    return res.status(404).json({ success: false, error: 'فروشندهListing یافت نشد' });
  }
  if (listing.StockQuantity < quantity) {
    return res.status(400).json({ success: false, error: 'موجودی کافی نیست' });
  }

  let cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (!cart) {
    cart = await Cart.create({ userId: req.user.id });
  }

  let cartItem = await CartItem.findOne({
    where: { cartId: cart.id, vendorListingId },
  });

  if (cartItem) {
    const newQty = cartItem.quantity + quantity;
    if (newQty > listing.StockQuantity) {
      return res.status(400).json({ success: false, error: 'موجودی کافی نیست' });
    }
    cartItem.quantity = newQty;
    await cartItem.save();
  } else {
    cartItem = await CartItem.create({
      cartId: cart.id,
      vendorListingId,
      quantity,
      ...(petId && { petId }),
    });
  }

  const items = await populateCartItems(cart.id);
  const totals = await computeCartTotals(items);
  res.json({ success: true, data: { items, totals } });
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { listingId } = req.params;
  if (!listingId) {
    return res.status(400).json({ success: false, error: 'listingId الزامی است' });
  }
  const parsed = updateCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'مقدار نامعتبر' });
  }
  const { quantity } = parsed.data;

  const cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (!cart) {
    return res.status(404).json({ success: false, error: 'سبد خرید یافت نشد' });
  }

  const cartItem = await CartItem.findOne({
    where: { cartId: cart.id, vendorListingId: listingId },
    include: [{ model: VendorListing, as: 'VendorListing' }],
  });
  if (!cartItem) {
    return res.status(404).json({ success: false, error: 'آیتم در سبد خرید یافت نشد' });
  }

  if (quantity === 0) {
    await cartItem.destroy();
  } else {
    if (quantity > cartItem.VendorListing.stockQuantity) {
      return res.status(400).json({ success: false, error: 'موجودی کافی نیست' });
    }
    cartItem.quantity = quantity;
    await cartItem.save();
  }

  const items = await populateCartItems(cart.id);
  const totals = await computeCartTotals(items);
  res.json({ success: true, data: { items, totals } });
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { listingId } = req.params;
  if (!listingId) {
    return res.status(400).json({ success: false, error: 'listingId الزامی است' });
  }

  const cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (!cart) {
    return res.status(404).json({ success: false, error: 'سبد خرید یافت نشد' });
  }

  const cartItem = await CartItem.findOne({
    where: { cartId: cart.id, vendorListingId: listingId },
  });
  if (!cartItem) {
    return res.status(404).json({ success: false, error: 'آیتم در سبد خرید یافت نشد' });
  }

  await cartItem.destroy();

  const items = await populateCartItems(cart.id);
  const totals = await computeCartTotals(items);
  res.json({ success: true, data: { items, totals } });
});

export const clearCart = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const cart = await Cart.findOne({ where: { userId: req.user.id } });
  if (!cart) {
    return res.json({ success: true, data: { items: [], totals: { subtotal: 0, totalShipping: 0, grandTotal: 0 } } });
  }

  await CartItem.destroy({ where: { cartId: cart.id } });

  const items = await populateCartItems(cart.id);
  const totals = await computeCartTotals(items);
  res.json({ success: true, data: { items, totals } });
});

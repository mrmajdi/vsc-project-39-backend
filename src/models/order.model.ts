import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  vendorListingId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  commissionRate: number;
  taxRate: number;
  quantity: number;
  petId?: mongoose.Types.ObjectId;
}

export interface IOrderDocument extends Document {
  userId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  totalShipping: number;
  totalTax: number;
  totalCommission: number;
  grandTotal: number;
  status: 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shippingAddressId: mongoose.Types.ObjectId;
  paymentMethod: 'online_gateway';
  trackingCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  vendorListingId: { type: Schema.Types.ObjectId, ref: 'VendorListing', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  commissionRate: { type: Number, required: true },
  taxRate: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  petId: { type: Schema.Types.ObjectId, ref: 'Pet' },
});

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, unique: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    totalShipping: { type: Number, required: true, default: 0 },
    totalTax: { type: Number, required: true, default: 0 },
    totalCommission: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending_payment',
    },
    shippingAddressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    paymentMethod: { type: String, enum: ['online_gateway'], required: true },
    trackingCode: { type: String },
  },
  { timestamps: true }
);

// پیش‌save هوک برای تولید شماره سفارش
OrderSchema.pre<IOrderDocument>('save', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 رقم تصادفی
    this.orderNumber = `ORD-${timestamp}-${randomPart}`;
  }
  next();
});

// تبدیل عددها به دو رقم اعشار در خروجی JSON
OrderSchema.set('toJSON', {
  transform: function (doc, ret) {
    const numericFields = [
      'subtotal',
      'totalShipping',
      'totalTax',
      'totalCommission',
      'grandTotal',
    ];
    numericFields.forEach((field) => {
      if (typeof ret[field] === 'number') {
        ret[field] = Math.round(ret[field] * 100) / 100;
      }
    });
    // همچنین عددها در آیتم‌ها را دو رقم اعشار کنیم
    if (Array.isArray(ret.items)) {
      ret.items.forEach((item: any) => {
        if (typeof item.price === 'number') item.price = Math.round(item.price * 100) / 100;
        if (typeof item.commissionRate === 'number')
          item.commissionRate = Math.round(item.commissionRate * 100) / 100;
        if (typeof item.taxRate === 'number')
          item.taxRate = Math.round(item.taxRate * 100) / 100;
      });
    }
    return ret;
  },
});

const OrderModel: Model<IOrderDocument> = mongoose.model<IOrderDocument>('Order', OrderSchema);

export default OrderModel;

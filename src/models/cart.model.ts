/* زبان: فارسی - جهت: RTL */
import { Schema, model, Document, Types } from 'mongoose';

// Interface for a cart item
export interface ICartItem {
  vendorListingId: Types.ObjectId; // ref 'VendorListing'
  productId: Types.ObjectId;       // ref 'Product'
  vendorId: Types.ObjectId;        // ref 'Vendor'
  quantity: number;                // min 1
  petId?: Types.ObjectId;          // optional ref 'Pet'
  addedAt: Date;
}

// Interface for the cart document
export interface ICartDocument extends Document {
  userId: Types.ObjectId;          // ref 'User', required, unique
  items: ICartItem[];

  // Instance method to calculate totals
  calculateTotals(): Promise<{
    subtotal: number;
    shippingPerVendor: Map<Types.ObjectId, number>;
    totalShipping: number;
  }>;

  // Instance method to add an item
  addItem(
    listingId: Types.ObjectId,
    productId: Types.ObjectId,
    vendorId: Types.ObjectId,
    quantity: number,
    petId?: Types.ObjectId
  ): Promise<void>;

  // Instance method to remove an item by listingId
  removeItem(listingId: Types.ObjectId): Promise<void>;
}

// Cart Item Schema
const CartItemSchema = new Schema<ICartItem>(
  {
    vendorListingId: { type: Schema.Types.ObjectId, ref: 'VendorListing', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    quantity: { type: Number, required: true, min: 1 },
    petId: { type: Schema.Types.ObjectId, ref: 'Pet' },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Cart Schema
const CartSchema = new Schema<ICartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

// Instance method: calculateTotals
CartSchema.methods.calculateTotals = async function () {
  const VendorListing = model('VendorListing');
  let subtotal = 0;
  const shippingPerVendor = new Map<Types.ObjectId, number>();
  let totalShipping = 0;

  for (const item of this.items) {
    const listing = await VendorListing.findById(item.vendorListingId).select('price shippingCost vendorId');
    if (!listing) continue;

    const itemPrice = listing.price ?? 0;
    const itemShipping = listing.shippingCost ?? 0;

    subtotal += itemPrice * item.quantity;
    totalShipping += itemShipping * item.quantity;

    const current = shippingPerVendor.get(listing.vendorId) ?? 0;
    shippingPerVendor.set(listing.vendorId, current + itemShipping * item.quantity);
  }

  return { subtotal, shippingPerVendor, totalShipping };
};

// Instance method: addItem
CartSchema.methods.addItem = async function (
  listingId: Types.ObjectId,
  productId: Types.ObjectId,
  vendorId: Types.ObjectId,
  quantity: number,
  petId?: Types.ObjectId
) {
  const existingIndex = this.items.findIndex(
    (item) => item.vendorListingId.equals(listingId)
  );

  if (existingIndex >= 0) {
    this.items[existingIndex].quantity += quantity;
  } else {
    this.items.push({
      vendorListingId: listingId,
      productId,
      vendorId,
      quantity,
      petId,
      addedAt: new Date(),
    });
  }

  await this.save();
};

// Instance method: removeItem
CartSchema.methods.removeItem = async function (listingId: Types.ObjectId) {
  this.items = this.items.filter((item) => !item.vendorListingId.equals(listingId));
  await this.save();
};

// Create and export the model
export default model<ICartDocument>('Cart', CartSchema);

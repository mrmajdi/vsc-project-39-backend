import { Schema, Model, model, Document, Types } from 'mongoose';

export interface ITransactionDocument extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  gateway: 'zarinpal' | 'mellat' | 'mock';
  authority?: string;
  referenceCode?: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  rawCallback?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gateway: { type: String, enum: ['zarinpal', 'mellat', 'mock'], required: true },
    authority: { type: String },
    referenceCode: { type: String },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    rawCallback: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

transactionSchema.statics.findByAuthority = function (authority: string) {
  return this.findOne({ authority });
};

transactionSchema.statics.findByOrderId = function (orderId: Types.ObjectId | string) {
  return this.findOne({ orderId });
};

export const Transaction: Model<ITransactionDocument> = model<ITransactionDocument>('Transaction', transactionSchema);
export default Transaction;

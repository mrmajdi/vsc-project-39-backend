import { Transaction } from '../models/transaction.model';
import { Order } from '../models/order.model';
import { VendorListing } from '../models/vendorListing.model';
import { NotFoundError } from '../utils/errors';
import { PaymentError } from '../utils/errors';

/**
 * Verify payment with the gateway (mock or real)
 * @param authority - Payment authority token
 * @param amount - Transaction amount
 * @param gateway - Gateway name (e.g., 'zarinpal', 'mock')
 * @returns Verification result
 */
export async function verifyPayment(authority: string, amount: number, gateway: string): Promise<{ success: boolean; referenceCode?: string }> {
  if (gateway === 'mock') {
    return { success: true, referenceCode: `mock-ref-${Date.now()}` };
  }
  // TODO: Implement real gateway API call (e.g., Zarinpal, Stripe, etc.)
  // Example for real gateway:
  // const response = await axios.post(`${gatewayAPI}/verify`, { authority, amount });
  // return { success: response.data.success, referenceCode: response.data.ref_id };
  throw new Error('Real gateway verification not implemented');
}

/**
 * Request payment from gateway (generate authority token)
 * @param orderId - Order ID
 * @param amount - Amount to charge
 * @param gateway - Gateway name
 * @returns Authority token
 */
export async function requestPayment(orderId: string, amount: number, gateway: string): Promise<string> {
  if (gateway === 'mock') {
    return `mock_${orderId}`;
  }
  // TODO: Implement real gateway payment request
  // Example for real gateway:
  // const response = await axios.post(`${gatewayAPI}/request`, { amount, callbackUrl: `${process.env.BASE_URL}/payment/callback` });
  // return response.data.authority;
  throw new Error('Real gateway request not implemented');
}

/**
 * Handle payment gateway callback and update order/transaction status
 * @param authority - Payment authority from gateway
 * @param status - Gateway callback status ('OK', 'success', 'NOK', etc.)
 * @param gateway - Gateway name
 * @returns Result with orderId on success
 * @throws NotFoundError if transaction not found
 * @throws PaymentError if payment fails
 */
export async function handlePaymentCallback(authority: string, status: string, gateway: string): Promise<{ success: true; orderId: string }> {
  // 1) Find transaction by authority
  const transaction = await Transaction.findByAuthority(authority);
  if (!transaction) {
    throw new NotFoundError('تراکنش یافت نشد');
  }

  // 2) If status is OK/success, verify payment
  if (status === 'OK' || status === 'success') {
    let verificationResult;
    try {
      verificationResult = await verifyPayment(authority, transaction.amount, gateway);
    } catch (err) {
      // Verification failed
      await updateTransactionAndOrderOnFailure(transaction, err);
      throw new PaymentError('پرداخت ناموفق بود');
    }

    if (verificationResult.success) {
      // 3) Update transaction and order on success
      await Transaction.update(transaction.id, {
        status: 'success',
        referenceCode: verificationResult.referenceCode,
        rawCallback: JSON.stringify({ authority, status, gateway }),
      });

      await Order.update(transaction.orderId, { status: 'processing' });

      return { success: true, orderId: transaction.orderId };
    } else {
      // Verification returned failure
      await updateTransactionAndOrderOnFailure(transaction, new Error('Verification failed'));
      throw new PaymentError('پرداخت ناموفق بود');
    }
  } else {
    // 4) Status is NOK or other failure
    await updateTransactionAndOrderOnFailure(transaction, new Error('Gateway returned failure'));
    throw new PaymentError('پرداخت ناموفق بود');
  }
}

/**
 * Helper function to update transaction and order on payment failure, and restore stock
 * @param transaction - Transaction object
 * @param error - Error that caused failure
 */
async function updateTransactionAndOrderOnFailure(transaction: any, error: any): Promise<void> {
  // Update transaction status to failed
  await Transaction.update(transaction.id, {
    status: 'failed',
    rawCallback: JSON.stringify({ authority: transaction.authority, status: 'failed', error: error.message }),
  });

  // Update order status to cancelled
  await Order.update(transaction.orderId, { status: 'cancelled' });

  // Restore stock quantities
  const order = await Order.findById(transaction.orderId);
  if (order && order.items) {
    for (const item of order.items) {
      await VendorListing.incrementStock(item.vendorListingId, item.quantity);
    }
  }
}

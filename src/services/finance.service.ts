import { getVendorOrderNet } from './order.service';
import { getVendorSettledAmount } from './settlement.service';
import { getVendorCommissionRate } from './vendor.service';

const GLOBAL_COMMISSION_RATE = 10; // percent
const TAX_RATE = 9; // percent VAT

export function calculateCommission(gross_amount: number, vendor_commission_rate: number): number {
  const gross_cents = Math.round(gross_amount * 100);
  const commission_cents = Math.round(gross_cents * vendor_commission_rate / 100);
  return commission_cents / 100;
}

export function calculateTax(amount: number, tax_rate: number = TAX_RATE): number {
  const amount_cents = Math.round(amount * 100);
  const tax_cents = Math.round(amount_cents * tax_rate / 100);
  return tax_cents / 100;
}

export function calculateVendorNet(gross_amount: number, commission_amount: number, tax_amount: number): number {
  const gross_cents = Math.round(gross_amount * 100);
  const commission_cents = Math.round(commission_amount * 100);
  const tax_cents = Math.round(tax_amount * 100);
  const net_cents = gross_cents - commission_cents - tax_cents;
  return net_cents / 100;
}

export async function calculateOrderItemFinancials(
  unit_price: number,
  quantity: number,
  vendor_id: string
): Promise<{ gross: number; commission: number; tax: number; vendor_net: number }> {
  let vendor_commission_rate: number;
  try {
    vendor_commission_rate = await getVendorCommissionRate(vendor_id);
  } catch {
    vendor_commission_rate = GLOBAL_COMMISSION_RATE;
  }
  const gross = unit_price * quantity;
  const commission = calculateCommission(gross, vendor_commission_rate);
  const tax = calculateTax(gross);
  const vendor_net = calculateVendorNet(gross, commission, tax);
  return { gross, commission, tax, vendor_net };
}

export async function calculatePlatformRevenue(order_items: Array<{ commission: number }>): Promise<number> {
  const total = order_items.reduce((sum, item) => sum + item.commission, 0);
  return Math.round(total * 100) / 100;
}

export async function calculateSettlementAmount(
  vendor_id: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const [totalVendorNet, alreadySettled] = await Promise.all([
    getVendorOrderNet(vendor_id, startDate, endDate),
    getVendorSettledAmount(vendor_id, startDate, endDate)
  ]);
  const pendingCents = Math.round(totalVendorNet * 100) - Math.round(alreadySettled * 100);
  return pendingCents / 100;
}

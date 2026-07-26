// src/types/order.types.ts
// تعریف انواع مشترک ماژول سفارشات

/**
 * وضعیت‌های ممکن یک سفارش
 */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/**
 * روش پرداخت که مشتری می‌تواند انتخاب کند
 */
export type PaymentMethod = 'online' | 'cash_on_delivery';

/door
/**
 * لقبه‌ای از آیتم سبد/سفارش که برای ذخیره در دیتابیس استفاده می‌شود
 */
export interface OrderItemSnapshot {
  vendorListingId: string;
  productId: string;
  vendorId: string;
  name: string;
  price: number;          // قیمت واحد
  commissionRate: number; // درصد کمیسیون فروشنده (مثل 0.1 برای 10%)
  taxRate: number;        // درصد مالیات (مثل 0.09 برای 9%)
  quantity: number;
  petId?: string;         // در صورت مرتبط بودن با حیوان
}

/**
 * تجمیعات مالی سبد یا سفارش
 */
export interface CartTotals {
  subtotal: number;                               // جمع قیمت کالا قبل از هزینه‌ها
  shippingByVendor: Record<string, number>;       // هزینه ارسال بر اساس فروشنده (klíđ: vendorId)
  totalShipping: number;                          // مجموع هزینه‌های ارسال
  totalTax: number;                               // مجموع مالیات
  totalCommission: number;                        // مجموع کمیسیون
  grandTotal: number;                             // مبلغ نهایی قابل پرداخت
}

/**
 * نتیجه‌ی فرآیند checkout
 */
export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  gatewayRedirectUrl: string; // URL برای هدایت به درگاه پرداخت (در صورت نیاز)
}

/**
 * پاسخ callback از درگاه پس از попытک پرداخت
 */
export interface PaymentCallbackResult {
  success: boolean;
  orderId: string;
  referenceCode?: string; // کد مرجع از درگاه (در صورت موفقیت)
}

/**
 * نتیجه‌ی تأیید پرداخت با درگاه
 */
export interface PaymentVerificationResult {
  success: boolean;
  referenceCode: string;
  rawResponse?: unknown; // پاسخ خام از درگاه (برای لاگ یا depuration)
}

/**
 * پاسخ لیست سفارشات (پایین‌سازی)
 */
export interface OrderListResponse {
  orders: Order[];
  total: number;   // تعداد کل سفارشات
  page: number;    // صفحه فعلی
  limit: number;   // تعداد آیتم در هر صفحه
  totalPages: number; // تعداد کل صفحات
}

/**
 * پاسخ دریافت سبد خرید
 */
export interface CartResponse {
  items: CartItem[];
  totals: CartTotals;
}

/**
 * نوع درگاه پرداخت پشتیبانی‌شده
 */
export type GatewayType = 'zarinpal' | 'mellat' | 'mock';

/**
 * تعریف سفارش کامل (برای استفاده در OrderListResponse)
 */
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  totals: CartTotals;
  paymentMethod: PaymentMethod;
  createdAt: string; // ISO timestamp
}

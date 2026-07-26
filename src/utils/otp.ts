import { randomInt } from 'crypto';

/-----------------------------
  تولید کد OTP
-----------------------------/
/**
 * تولید یک کد عددی OTP به صورت تصادفی و رمزنگاری‌شده
 * @param length - طول کد OTP (پیش‌فرض: 6)
 * @returns رشته‌ای شامل فقط اعداد 0-9 با طول مشخص
 */
export function generateOtp(length: number = 6): string {
  if (length <= 0) return '';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += String(randomInt(0, 10)); // عدد تصادفی بین 0 تا 9
  }
  return code;
}

/-----------------------------
  تولید کد OTP همراه با انقضا
-----------------------------/
/**
 * تولید یک کد OTP و تعیین زمان انقضای آن
 * @param length - طول کد OTP (پیش‌فرض: 6)
 * @param expiryMinutes - مدت زمان معتبر بودن کد به دقیقه (پیش‌فرض: 2)
 * @returns شیء حاوی کد و تاریخ انقضا
 */
export function generateOtpWithExpiry(
  length: number = 6,
  expiryMinutes: number = 2
): { code: string; expiresAt: Date } {
  const code = generateOtp(length);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60_000);
  return { code, expiresAt };
}

/-----------------------------
  بررسی انقضای OTP
-----------------------------/
/**
 * بررسی می‌کند که آیا زمان انقضای OTP گذشته است یا خیر
 * @param expiresAt - تاریخ انقضای OTP
 * @returns true اگر منقضی شده باشد، در غیر این صورت false
 */
export function isOtpExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

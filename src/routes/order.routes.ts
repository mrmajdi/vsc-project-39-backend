// @vsc repo:vsc-project-39-backend file:src/routes/order.routes.ts task:b18-src-routes-order-routes-ts module:backend session:39
import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireRole } from '../middleware/auth';
import orderController from '../controllers/order.controller';
import cartController from '../controllers/order.controller';

const router = Router();

// محدودسازی نرخ درخواست برای تسویه‌حساب: حداکثر ۵ درخواست در دقیقه
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تعداد درخواست‌های تسویه‌حساب بیش از حد مجاز است. لطفاً یک دقیقه بعد تلاش کنید.',
  },
});

// مسیرهای سبد خرید (نیازمند احراز هویت)
router.get('/cart', authenticate, (req: Request, res: Response, next: NextFunction) => {
  cartController.getCart(req, res).catch(next);
});

router.post('/cart', authenticate, (req: Request, res: Response, next: NextFunction) => {
  cartController.addToCart(req, res).catch(next);
});

router.put('/cart/:listingId', authenticate, (req: Request, res: Response, next: NextFunction) => {
  cartController.updateCartItem(req, res).catch(next);
});

router.delete('/cart/:listingId', authenticate, (req: Request, res: Response, next: NextFunction) => {
  cartController.removeFromCart(req, res).catch(next);
});

router.delete('/cart', authenticate, (req: Request, res: Response, next: NextFunction) => {
  cartController.clearCart(req, res).catch(next);
});

// مسیرهای سفارش
// کال‌بک درگاه پرداخت — عمومی و بدون احراز هویت
router.get('/orders/payment/callback', (req: Request, res: Response, next: NextFunction) => {
  orderController.paymentCallbackController(req, res).catch(next);
});

// تسویه‌حساب — نیازمند احراز هویت و محدودیت نرخ
router.post(
  '/orders/checkout',
  authenticate,
  checkoutLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    orderController.checkoutController(req, res).catch(next);
  }
);

// دریافت لیست سفارش‌های کاربر — نیازمند احراز هویت
router.get('/orders', authenticate, (req: Request, res: Response, next: NextFunction) => {
  orderController.getOrdersController(req, res).catch(next);
});

// دریافت جزئیات یک سفارش — نیازمند احراز هویت
router.get('/orders/:id', authenticate, (req: Request, res: Response, next: NextFunction) => {
  orderController.getOrderDetailController(req, res).catch(next);
});

export default router;

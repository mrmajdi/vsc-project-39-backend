import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { z } from 'zod';
import orderService from '../services/order.service';
import paymentService from '../services/payment.service';

const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid(),
  paymentMethod: z.enum(['online_gateway']),
});

export const checkoutController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const body = checkoutSchema.parse(req.body);
  const result = await orderService.checkout(userId, body.shippingAddressId, body.paymentMethod);
  res.status(200).json({
    success: true,
    message: 'سفارش با موفقیت ایجاد شد.',
    data: result,
  });
});

export const getOrdersController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await orderService.getUserOrders(userId, page, limit);
  res.status(200).json({
    success: true,
    message: 'سفارشات کاربر با موفقیت دریافت شد.',
    data: result,
  });
});

export const getOrderDetailController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const orderId = req.params.id;
  if (!z.string().uuid().safeParse(orderId).success) {
    return res.status(400).json({
      success: false,
      message: 'معرفی سفارش نامعتبر است.',
      data: null,
    });
  }
  const order = await orderService.getOrderById(orderId, userId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'سفارش یافت نشد.',
      data: null,
    });
  }
  res.status(200).json({
    success: true,
    message: 'جزئیات سفارش با موفقیت دریافت شد.',
    data: order,
  });
});

export const paymentCallbackController = asyncHandler(async (req: Request, res: Response) => {
  const { authority, status } = req.query;
  if (typeof authority !== 'string' || typeof status !== 'string') {
    return res.status(400).redirect(`${process.env.FRONTEND_URL}/checkout?status=failed`);
  }
  const result = await paymentService.handlePaymentCallback(authority, status);
  if (result.success) {
    res.redirect(`${process.env.FRONTEND_URL}/account/orders?status=success&order=${result.orderId}`);
  } else {
    res.redirect(`${process.env.FRONTEND_URL}/checkout?status=failed`);
  }
});

export const getCartController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const cart = await orderService.getCart(userId);
  res.status(200).json({
    success: true,
    message: 'سبد خرید با موفقیت دریافت شد.',
    data: cart,
  });
});

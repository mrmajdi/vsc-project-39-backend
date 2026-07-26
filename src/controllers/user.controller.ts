import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { orderService } from '../services/order.service';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const user = await authService.getProfile(userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const updatedUser = await userService.updateProfile(userId, req.body);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const listOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const orders = await orderService.listUserOrders(
      userId,
      Number(page),
      Number(limit)
    );
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const wishlist = await userService.getWishlist(userId);
    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};

export const createWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    await userService.addToWishlist(userId, productId);
    res.status(201).json({ success: true, message: 'محصول به لیست علایق اضافه شد' });
  } catch (error) {
    next(error);
  }
};

export const removeWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    await userService.removeFromWishlist(userId, productId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const addresses = await userService.listAddresses(userId);
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const address = await userService.createAddress(userId, req.body);
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const updatedAddress = await userService.updateAddress(
      userId,
      addressId,
      req.body
    );
    res.status(200).json({ success: true, data: updatedAddress });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    await userService.deleteAddress(userId, addressId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

export const sendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || !/^\+?[0-9]{10,15}$/.test(phone.trim())) {
      res.status(400).json({ message: 'شماره موبایل نامعتبر است' });
      return;
    }
    const result = await authService.sendOtp(phone.trim());
    res.status(200).json({ message: 'کد OTP ارسال شد', cooldown: result.cooldown });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, code } = req.body;
    if (!phone || typeof phone !== 'string' || !/^\+?[0-9]{10,15}$/.test(phone.trim())) {
      res.status(400).json({ message: 'شماره موبایل نامعتبر است' });
      return;
    }
    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      res.status(400).json({ message: 'کد OTP باید 6 رقم باشد' });
      return;
    }
    const result = await authService.verifyOtp(phone.trim(), code.trim());
    res.status(200).json({
      message: 'ورود موفقیت‌آمیز',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid OTP') {
      res.status(400).json({ message: 'کد OTP نامعتبر است' });
    } else {
      next(error);
    }
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
      res.status(400).json({ message: 'توکن refreshToken مورد نیاز است' });
      return;
    }
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({
      message: 'توکن‌ها با موفقیت refreshed شدند',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid refresh token') {
      res.status(401).json({ message: 'توکن refreshToken نامعتبر یا منقضی شده است' });
    } else {
      next(error);
    }
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'دسترسی غیرمجاز' });
      return;
    }
    const user = await authService.getProfile(userId);
    if (!user) {
      res.status(404).json({ message: 'کاربر یافت نشد' });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

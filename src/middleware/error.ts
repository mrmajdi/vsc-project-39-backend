import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'خطای اعتبارسنجی داده‌ها',
      errors: err.errors,
    });
  }
  if (err instanceof MulterError) {
    return res.status(400).json({
      success: false,
      message: 'خطای بارگذاری فایل',
    });
  }
  const status = err.statusCode || 500;
  const message =
    status === 500 === status
      ? 'خطای داخلی سرور رخ داده است' : err.message || 'خطای نامشخص';
  return res.status(status).json({
    success: false,
    message,
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'مسیر مورد نظر یافت نشد',
  });
};

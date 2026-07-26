import { Router } from 'express';
import { sendOtp, verifyOtp, refreshToken, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const sendOtpSchema = z.object({
  phone: z.string()
    .min(11, 'شماره موبایل باید 11 رقم باشد')
    .max(11, 'شماره موبایل باید 11 رقم باشد')
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
});

const verifyOtpSchema = z.object({
  phone: z.string()
    .min(11, 'شماره موبایل باید 11 رقم باشد')
    .max(11, 'شماره موبایل باید 11 رقم باشد')
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است'),
  code: z.string()
    .length(6, 'کد تأیید باید 6 رقم باشد')
    .regex(/^\d{6}$/, 'کد تأیید نامعتبر است')
});

function validate(schema: z.ZodTypeAny) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(err => err.message);
      return res.status(400).json({ errors });
    }
    req.body = result.data;
    next();
  };
}

const router = Router();

router.post('/send-otp', validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/refresh', refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;

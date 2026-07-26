import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import {
  getProfile,
  updateProfile,
  getOrders,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/user.controller';

// Zod validation schemas
const profileUpdateSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد').optional(),
  email: z.string().email('ایمیل نامعتبر است').optional(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'شماره موبایل نامعتبر است').optional(),
});

const addressSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  recipientName: z.string().min(2, 'نام گیرنده باید حداقل ۲ کاراکتر باشد'),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'شماره موبایل نامعتبر است'),
  addressLine: z.string().min(5, 'آدرس باید حداقل ۵ کاراکتر باشد'),
  city: z.string().min(2, 'شهر باید حداقل ۲ کاراکتر باشد'),
  province: z.string().min(2, 'استان باید حداقل ۲ کاراکتر باشد'),
  postalCode: z.string().regex(/^\d{5,10}$/, 'کد پستی نامعتبر است'),
  isDefault: z.boolean().optional(),
});

const wishlistAddSchema = z.object({
  productId: z.string().min(1, 'شناسه محصول الزامی است'),
});

// Validation middleware factory
const validate = (schema: z.ZodTypeAny) => {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(err => err.message).join(', ');
      return res.status(400).json({ error: errors });
    }
    next();
  };
};

const router = Router();

// Profile routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, validate(profileUpdateSchema), updateProfile);

// Orders routes
router.get('/orders', authMiddleware, getOrders);

// Wishlist routes
router.get('/wishlist', authMiddleware, getWishlist);
router.post('/wishlist', authMiddleware, validate(wishlistAddSchema), addToWishlist);
router.delete('/wishlist/:productId', authMiddleware, removeFromWishlist);

// Addresses routes
router.get('/addresses', authMiddleware, getAddresses);
router.post('/addresses', authMiddleware, validate(addressSchema), addAddress);
router.put('/addresses/:id', authMiddleware, validate(addressSchema), updateAddress);
router.delete('/addresses/:id', authMiddleware, deleteAddress);

export default router;

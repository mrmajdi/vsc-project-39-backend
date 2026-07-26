import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateJWT, authorizeRole } from '../middleware/auth';
import { z } from 'zod';

// Inline Zod validation middleware
const validateBody = (schema: z.ZodTypeAny) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.format() });
    }
    req.body = result.data;
    next();
  };
};

const router = Router();

// Protect all admin routes with JWT and admin role
router.use(authenticateJWT, authorizeRole(['admin']));

// ===== Dashboard =====
router.get('/dashboard', adminController.getDashboard);

// ===== Products CRUD =====
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  categoryId: z.string(),
  brandId: z.string(),
  suitableFor: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
});

router.get('/products', adminController.getProducts);
router.post('/products', validateBody(productSchema), adminController.createProduct);
router.put(
  '/products/:id',
  validateBody(productSchema.partial()),
  adminController.updateProduct
);
router.delete('/products/:id', adminController.deleteProduct);

// ===== Vendor Management =====
const vendorUpdateSchema = z.object({
  status: z.enum(['active', 'blocked']),
  commissionRate: z.number().min(0).max(100),
  note: z.string().optional(),
});

router.put('/vendors/:id', validateBody(vendorUpdateSchema), adminController.updateVendor);

// ===== Special Deals =====
const dealReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

router.get('/special-deals', adminController.getSpecialDeals);
router.put(
  '/special-deals/:id/review',
  validateBody(dealReviewSchema),
  adminController.reviewSpecialDeal
);

// ===== Finance =====
router.get('/finance/summary', adminController.getFinanceSummary);
router.put(
  '/finance/settlements/:id/pay',
  adminController.paySettlement
);

// ===== Banners CRUD =====
const bannerSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  priority: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
});

router.get('/banners', adminController.getBanners);
router.post('/banners', validateBody(bannerSchema), adminController.createBanner);
router.put(
  '/banners/:id',
  validateBody(bannerSchema.partial()),
  adminController.updateBanner
);
router.delete('/banners/:id', adminController.deleteBanner);

// ===== Read‑only Lists =====
router.get('/clinics', adminController.getClinics);
router.get('/categories', adminController.getCategories);
router.get('/brands', adminController.getBrands);
router.get('/users', adminController.getUsers);
router.get('/blog', adminController.getBlogPosts);
router.get('/orders', adminController.getOrders);

export default router;

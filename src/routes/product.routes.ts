// مسیرهای عمومی کاتلگ محصولات
// تمام مسیرها عمومی هستند و نیازمند احراز هویت نیستند

import express, { Router } from 'express';
import productController from '../controllers/product.controller';

const router: Router = express.Router();

// مسیرهایی که باید قبل از پارامتر :id تعریف شوند تا shadowing رخ ندهد
router.get('/categories', productController.listCategories);
router.get('/brands', productController.listBrands);
router.get('/special-deals', productController.listSpecialDeals);

// مسیرهای عمومی محصولات
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.get('/:id/listings', productController.getProductListings);
router.get('/:id/reviews', productController.getProductReviews);

export default router;

import express from 'express';
import { protect, authorize } from '../middleware/auth';
import clinicController from '../controllers/clinic.controller';
import blogController from '../controllers/blog.controller';
import bannerController from '../controllers/banner.controller';

const router = express.Router();

// Public routes
router.get('/clinics', clinicController.getAllClinics);
router.get('/clinics/:id', clinicController.getClinicById);
router.get('/blog', blogController.getAllBlogPosts);
router.get('/blog/:id', blogController.getBlogPostById);
router.get('/banners', bannerController.getAllBanners);

// Admin-protected routes
router.post('/clinics', protect, authorize('admin'), clinicController.createClinic);
router.put('/clinics/:id', protect, authorize('admin'), clinicController.updateClinic);
router.delete('/clinics/:id', protect, authorize('admin'), clinicController.deleteClinic);
router.put('/clinics/:id/working-hours', protect, authorize('admin'), clinicController.updateWorkingHours);
router.post('/clinics/:id/images', protect, authorize('admin'), clinicController.uploadClinicImage);
router.delete('/clinics/:id/images/:imageId', protect, authorize('admin'), clinicController.deleteClinicImage);
router.post('/clinics/:id/services', protect, authorize('admin'), clinicController.addClinicService);
router.delete('/clinics/:id/services/:serviceId', protect, authorize('admin'), clinicController.removeClinicService);
router.post('/blog', protect, authorize('admin'), blogController.createBlogPost);
router.put('/blog/:id', protect, authorize('admin'), blogController.updateBlogPost);
router.delete('/blog/:id', protect, authorize('admin'), blogController.deleteBlogPost);
router.post('/banners', protect, authorize('admin'), bannerController.createBanner);
router.put('/banners/:id', protect, authorize('admin'), bannerController.updateBanner);
router.delete('/banners/:id', protect, authorize('admin'), bannerController.deleteBanner);

// User-protected routes (auth required)
router.post('/clinics/:id/reviews', protect, clinicController.createClinicReview);

export default router;

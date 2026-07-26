import { Router } from 'express';
import vendorController from '../controllers/vendor.controller';

const router = Router();

router.get('/', vendorController.listVendors);
router.get('/:id', vendorController.getVendor);

export default router;

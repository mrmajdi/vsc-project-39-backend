import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as petController from '../controllers/pet.controller';
import { z } from 'zod';

const petSchema = z.object({
  name: z.string().min(2, 'نام حیوان باید حداقل ۲ کاراکتر باشد'),
  species: z.string().min(2, 'جنسیت باید حداقل ۲ کاراکتر باشد'),
  breed: z.string().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ تولد باید به فرمت YYYY-MM-DD باشد'),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'جنسیت باید male یا female باشد' })
  }),
  weight: z.number().positive('وزن باید عدد مثبت باشد').optional(),
  uniqueCode: z.string().uuid('کد یکتا باید معتبر باشد').optional(),
});

const router = Router();

// Public route
router.get('/public/:uniqueCode', petController.getPublicPet);

// Protected routes
router.use(authMiddleware);

router.get('/', petController.listPets);
router.post('/', (req, res, next) => {
  const result = petSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors.map(e => e.message).join(', ') });
  }
  req.body = result.data;
  next();
}, petController.createPet);

router.get('/:id', petController.getPet);
router.put('/:id', (req, res, next) => {
  const partial = petSchema.partial();
  const result = partial.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors.map(e => e.message).join(', ') });
  }
  req.body = result.data;
  next();
}, petController.updatePet);
router.delete('/:id', petController.deletePet);
router.get('/:id/passport', petController.getPassport);

export default router;

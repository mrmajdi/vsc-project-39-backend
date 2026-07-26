import { Request, Response, NextFunction } from 'express';
import * as clinicModel from '../models/clinic.model';
import * as blogModel from '../models/blog.model';
import * as bannerModel from '../models/banner.model';
import { z } from 'zod';

// Zod validation schemas
const clinicSchema = z.object({
  name: z.string().min(1, 'نام کلینیک الزامی است'),
  address: z.string().min(1, 'آدرس الزامی است'),
  city: z.string().min(1, 'شهر الزامی است'),
  phone: z.string().min(1, 'شماره تماس الزامی است'),
  lat: z.number().min(-90).max(90, 'عرض جغرافیایی نامعتبر است'),
  lng: z.number().min(-180).max(180, 'طول جغرافیایی نامعتبر است'),
  description: z.string().optional(),
  category: z.string().optional()
});

const workingHoursSchema = z.array(
  z.object({
    day: z.number().min(0).max(6, 'روز باید بین 0 و 6 باشد'),
    openTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'فرمت زمان باید HH:MM باشد'),
    closeTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'فرمت زمان باید HH:MM باشد'),
    isOpen: z.boolean()
  })
);

const clinicImageSchema = z.object({
  url: z.string().url('آدرس معتبر URL وارد کنید'),
  alt: z.string().min(1, 'متن جایگزین الزامی است')
});

const clinicServiceSchema = z.object({
  name: z.string().min(1, 'نام سرویس الزامی است'),
  description: z.string().optional(),
  price: z.number().positive('قیمت باید مثبت باشد')
});

const blogPostSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  slug: z.string().min(1, 'اسلاگ الزامی است'),
  excerpt: z.string().min(1, 'چکیده الزامی است'),
  content: z.string().min(1, 'محتوا الزامی است'),
  coverImage: z.string().url('آدرس تصویر معتبر وارد کنید'),
  authorId: z.string().uuid('شناسه نویسنده نامعتبر است'),
  tags: z.array(z.string()).optional()
});

const bannerSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  image: z.string().url('آدرس تصویر معتبر وارد کنید'),
  link: z.string().url('لینک معتبر وارد کنید').optional(),
  position: z.enum(['header', 'footer', 'sidebar']),
  order: z.number().int().nonnegative('ترتیب باید عدد صحیح غیر منفی باشد'),
  isActive: z.boolean()
});

const clinicReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'امتیاز باید بین 1 و 5 باشد'),
  comment: z.string().optional(),
  userId: z.string().uuid('شناسه کاربر نامعتبر است')
});

// Controller functions
export const listClinics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, category, q, page = 1, limit = 10 } = req.query;
    const filters: any = {};
    if (city) filters.city = String(city);
    if (category) filters.category = String(category);
    if (q) filters.search = String(q);
    
    const { data, total } = await clinicModel.getClinics(
      filters,
      Number(page),
      Number(limit)
    );
    
    const totalPages = Math.ceil(total / Number(limit));
    
    res.json({
      data,
      total,
      page: Number(page),
      totalPages
    });
  } catch (error) {
    next(error);
  }
};

export const getClinic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const clinic = await clinicModel.getClinicById(String(id));
    
    if (!clinic) {
      return res.status(404).json({ message: 'کلینیک یافت نشد' });
    }
    
    res.json(clinic);
  } catch (error) {
    next(error);
  }
};

export const createClinic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = clinicSchema.parse(req.body);
    const clinic = await clinicModel.createClinic(validatedData);
    res.status(201).json(clinic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const updateClinic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const partialSchema = clinicSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const clinic = await clinicModel.updateClinic(String(id), validatedData);
    
    if (!clinic) {
      return res.status(404).json({ message: 'کلینیک یافت نشد' });
    }
    
    res.json(clinic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const deleteClinic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await clinicModel.deleteClinic(String(id));
    
    if (!deleted) {
      return res.status(404).json({ message: 'کلینیک یافت نشد' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const setWorkingHours = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = workingHoursSchema.parse(req.body);
    const clinic = await clinicModel.setWorkingHours(String(id), validatedData);
    
    if (!clinic) {
      return res.status(404).json({ message: 'کلینیک یافت نشد' });
    }
    
    res.json(clinic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const addClinicImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = clinicImageSchema.parse(req.body);
    const clinic = await clinicModel.addClinicImage(String(id), validatedData);
    
    if (!clinic) {
      return res.status(404).json({ message: 'کلینیک یافت نشد' });
    }
    
    res.status(201).json(clinic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const removeClinicImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, imageId } = req.params;
    const clinic = await clinicModel.removeClinicImage(String(id), String(imageId));
    
    if (!clinic) {
      return res.status(404).json({ message: 'کلینیک یا تصویر یافت نشد' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addClinicService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = clinicServiceSchema.parse(req.body);
    const clinic = await clinicModel.addClinicService(String(id), validatedData);
    
    if (!clinic) {
      return res.status(404).json({ message: 'کلینیک یافت نشد' });
    }
    
    res.status(201).json(clinic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const removeClinicService = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, serviceId } = req.params;
    const clinic = await clinicModel.removeClinicService(String(id), String(serviceId));
    
    if (!clinic) {
      return res.status(404).json({ message: 'کلینیک یا سرویس یافت نشد' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listBlogPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const filters: any = {};
    if (q) filters.search = String(q);
    
    const { data, total } = await blogModel.getBlogPosts(
      filters,
      Number(page),
      Number(limit)
    );
    
    const totalPages = Math.ceil(total / Number(limit));
    
    res.json({
      data,
      total,
      page: Number(page),
      totalPages
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const post = await blogModel.getBlogPostById(String(id));
    
    if (!post) {
      return res.status(404).json({ message: 'مقاله یافت نشد' });
    }
    
    res.json(post);
  } catch (error) {
    next(error);
  }
};

export const createBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = blogPostSchema.parse(req.body);
    const post = await blogModel.createBlogPost(validatedData);
    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const updateBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const partialSchema = blogPostSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const post = await blogModel.updateBlogPost(String(id), validatedData);
    
    if (!post) {
      return res.status(404).json({ message: 'مقاله یافت نشد' });
    }
    
    res.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const deleteBlogPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await blogModel.deleteBlogPost(String(id));
    
    if (!deleted) {
      return res.status(404).json({ message: 'مقاله یافت نشد' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const listBanners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { position, isActive } = req.query;
    const filters: any = {};
    if (position) filters.position = String(position);
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    
    const banners = await bannerModel.getBanners(filters);
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = bannerSchema.parse(req.body);
    const banner = await bannerModel.createBanner(validatedData);
    res.status(201).json(banner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const partialSchema = bannerSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const banner = await bannerModel.updateBanner(String(id), validatedData);
    
    if (!banner) {
      return res.status(404).json({ message: 'بنر یافت نشد' });
    }
    
    res.json(banner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await bannerModel.deleteBanner(String(id));
    
    if (!deleted) {
      return res.status(404).json({ message: 'بنر یافت نشد' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addClinicReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = clinicReviewSchema.parse(req.body);
    const clinic = await clinicModel.addClinicReview(String(id), validatedData);
    
    if (!clinic) {
      return res.status(404).json({ message: 'کلینیک یافت نشد' });
    }
    
    res.status(201).json(clinic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'داده‌های ورودی نامعتبر',
        errors: error.errors 
      });
    }
    next(error);
  }
};

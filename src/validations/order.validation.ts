import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    shippingAddressId: z.string().uuid('آدرس نامعتبر است'),
    paymentMethod: z.enum(['online_gateway'], {
      errorMap: () => ({ message: 'روش پرداخت نامعتبر' })
    })
  })
});

export const addToCartSchema = z.object({
  body: z.object({
    vendorListingId: z.string().uuid('شناسه لیست فروشنده نامعتبر است'),
    productId: z.string().uuid('شناسه محصول نامعتبر است'),
    vendorId: z.string().uuid('شناسه فروشنده نامعتبر است'),
    quantity: z.number()
      .int('تعداد باید عدد صحیح باشد')
      .min(1, 'حداقل ۱ عدد')
      .max(99, 'حداکثر ۹۹ عدد'),
    petId: z.string().uuid('شناسه حیوان نامعتبر است').optional()
  })
});

export const updateCartItemSchema = z.object({
  params: z.object({
    listingId: z.string().uuid('شناسه لیست نامعتبر است')
  }),
  body: z.object({
    quantity: z.number()
      .int('تعداد باید عدد صحیح باشد')
      .min(0, 'حداقل ۰ عدد')
      .max(99, 'حداکثر ۹۹ عدد')
  })
});

export const removeCartItemSchema = z.object({
  params: z.object({
    listingId: z.string().uuid('شناسه لیست نامعتبر است')
  })
});

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('شناسه سفارش نامعتبر است')
  })
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string()
      .optional()
      .transform(Number)
      .default(1)
      .refine(val => val > 0, { message: 'شماره صفحه باید بزرگتر از صفر باشد' }),
    limit: z.string()
      .optional()
      .transform(Number)
      .default(10)
      .refine(val => val > 0 && val <= 100, { message: 'حد باید بین ۱ تا ۱۰۰ باشد' })
  })
});

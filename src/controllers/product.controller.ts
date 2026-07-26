import { Request, Response } from 'express';
import productService from '../services/product.service';

export const listProducts = async (req: Request, res: Response) => {
  try {
    const {
      species,
      category_id,
      brand_id,
      q,
      min_price,
      max_price,
      in_stock,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const parsedCategoryId = category_id ? Number(category_id) : undefined;
    const parsedBrandId = brand_id ? Number(brand_id) : undefined;
    const parsedMinPrice = min_price ? Number(min_price) : undefined;
    const parsedMaxPrice = max_price ? Number(max_price) : undefined;
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    if (
      (category_id && isNaN(parsedCategoryId)) ||
      (brand_id && isNaN(parsedBrandId)) ||
      (min_price && isNaN(parsedMinPrice)) ||
      (max_price && isNaN(parsedMaxPrice)) ||
      isNaN(parsedPage) ||
      isNaN(parsedLimit)
    ) {
      return res.status(400).json({ error: 'شناسه نامعتبر' });
    }

    const filter = {
      species: typeof species === 'string' ? species : undefined,
      category_id: parsedCategoryId,
      brand_id: parsedBrandId,
      q: typeof q === 'string' ? q : undefined,
      min_price: parsedMinPrice,
      max_price: parsedMaxPrice,
      in_stock:
        in_stock === 'true'
          ? true
          : in_stock === 'false'
          ? false
          : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      page: parsedPage,
      limit: parsedLimit,
    };

    const result = await productService.getProducts(filter);
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطای سرور' });
  }
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0 || !Number.isInteger(id)) {
      return res.status(400).json({ error: 'شناسه نامعتبر' });
    }
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'محصول یافت نشد' });
    }
    return res.status(200).json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطای سرور' });
  }
};

export const getProductListings = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.id);
    if (!productId || productId <= 0 || !Number.isInteger(productId)) {
      return res.status(400).json({ error: 'شناسه نامعتبر' });
    }
    const listings = await productService.getProductListings(productId);
    return res.status(200).json(listings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطای سرور' });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.id);
    if (!productId || productId <= 0 || !Number.isInteger(productId)) {
      return res.status(400).json({ error: 'شناسه نامعتبر' });
    }
    const reviews = await productService.getProductReviews(productId);
    return res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطای سرور' });
  }
};

export const listCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await productService.getCategories();
    return res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطای سرور' });
  }
};

export const listBrands = async (_req: Request, res: Response) => {
  try {
    const brands = await productService.getBrands();
    return res.status(200).json(brands);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطای سرور' });
  }
};

export const listSpecialDeals = async (_req: Request, res: Response) => {
  try {
    const specialDeals = await productService.getSpecialDeals();
    return res.status(200).json(specialDeals);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'خطای سرور' });
  }
};

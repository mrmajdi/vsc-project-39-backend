import { Request, Response } from 'express';
import productService from '../services/product.service';

export const listVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await productService.getVendors();
    res.status(200).json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطای سرور' });
  }
};

export const getVendor = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'شناسه نامعتبر' });
    }
    const vendor = await productService.getVendorById(id);
    if (!vendor) {
      return res.status(404).json({ error: 'فروشنده یافت نشد' });
    }
    res.status(200).json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطای سرور' });
  }
};

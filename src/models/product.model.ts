/// <reference types="better-sqlite3" />
import { Database } from 'better-sqlite3';
import { db } from '../config/db';

/**
 * اینترفیس برند
 */
export interface Brand {
  id: number;
  name: string;
  logo_url: string | null;
}

/**
 * اینترفیس دسته‌بندی
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon: string | null;
  children?: Category[];
}

/**
 * اینترفیس محصول
 */
export interface Product {
  id: number;
  name: string;
  slug: string;
  brand_id: number;
  category_id: number;
  description: string | null;
  specifications: Record<string, any> | null;
  suitable_for: string[];
  images: string[];
  created_at: Date;
}

/**
 * اینترفیس لیستینگ فروشنده
 */
export interface VendorListing {
  id: number;
  product_id: number;
  vendor_id: number;
  price: number;
  discount_percentage: number;
  stock: number;
  is_authentic: number; // 0 یا 1
  expiry_date: string | null;
  shipping_cost: number;
  shipping_days: number;
  city: string | null;
  created_at: Date;
}

/**
 * کلاس مدل برند
 */
export class BrandModel {
  /**
   * دریافت تمام برندها
   */
  static findAll(): Brand[] {
    const stmt = db.prepare('SELECT id, name, logo_url FROM brands ORDER BY name');
    return stmt.all() as Brand[];
  }

  /**
   * یافتن برند بر اساس شناسه
   */
  static findById(id: number): Brand | undefined {
    const stmt = db.prepare('SELECT id, name, logo_url FROM brands WHERE id = ?');
    const row = stmt.get(id) as Brand | undefined;
    return row;
  }
}

/**
 * کلاس مدل دسته‌بندی
 */
export class CategoryModel {
  /**
   * ساخت درخت دسته‌بندی
   */
  static findAllAsTree(): Category[] {
    const rows = db.prepare('SELECT id, name, slug, parent_id, icon FROM categories ORDER BY parent_id, name').all() as Category[];
    const map = new Map<number, Category>();
    const roots: Category[] = [];

    for const row of rows {
      map.set(row.id, { ...row, children: [] });
    }

    for const row of rows {
      const node = map.get(row.id)!;
      if (row.parent_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(row.parent_id);
        if (parent) {
          parent.children?.push(node);
        }
      }
    }

    return roots;
  }

  /**
   * یافتن دسته‌بندی بر اساس slug
   */
  static findBySlug(slug: string): Category | undefined {
    const stmt = db.prepare('SELECT id, name, slug, parent_id, icon FROM categories WHERE slug = ?');
    const row = stmt.get(slug) as Category | undefined;
    return row;
  }

  /**
   * یافتن دسته‌بندی‌های مرتبط با یک گونه (species)
   */
  static findBySpecies(species: string): Category[] {
    const stmt = db.prepare('SELECT id, name, slug, parent_id, icon FROM categories WHERE name LIKE ?');
    return stmt.all(`%${species}%`) as Category[];
  }
}

/**
 * کلاس مدل محصول
 */
export class ProductModel {
  /**
   * یافتن محصولات با فیلترها و صفحه‌بندی
   * @param filters اشیاء حاوی species, category_id, brand_id, q, min_price, max_price, sort, page, limit
   */
  static findAll(filters: {
    species?: string;
    category_id?: number;
    brand_id?: number;
    q?: string;
    min_price?: number;
    max_price?: number;
    sort?: string; // مثال: price_asc, price_desc, name_asc, name_desc
    page?: number;
    limit?: number;
  }): Product[] {
    let where = '1=1';
    const params: any[] = [];

    if (filters.species) {
      // suitable_for ذخیره شده به صورت رشته JSON، جستجوی ساده با LIKE
      where += ` AND json_extract(suitable_for, '$') LIKE ?`;
      params.push(`%${filters.species}%`);
    }
    if (filters.category_id) {
      where += ' AND category_id = ?';
      params.push(filters.category_id);
    }
    if (filters.brand_id) {
      where += ' AND brand_id = ?';
      params.push(filters.brand_id);
    }
    if (filters.q) {
      where += ' AND (name LIKE ? OR description LIKE ?)';
      const like = `%${filters.q}%`;
      params.push(like, like);
    }
    if (filters.min_price !== undefined && filters.max_price !== undefined) {
      where += ` AND EXISTS (
        SELECT 1 FROM vendor_listings vl 
        WHERE vl.product_id = p.id 
        AND vl.price >= ? AND vl.price <= ?
      )`;
      params.push(filters.min_price, filters.max_price);
    } else if (filters.min_price !== undefined) {
      where += ` AND EXISTS (
        SELECT 1 FROM vendor_listings vl 
        WHERE vl.product_id = p.id 
        AND vl.price >= ?
      )`;
      params.push(filters.min_price);
    } else if (filters.max_price !== undefined) {
      where += ` AND EXISTS (
        SELECT 1 FROM vendor_listings vl 
        WHERE vl.product_id = p.id 
        AND vl.price <= ?
      )`;
      params.push(filters.max_price);
    }

    // تعیین مرتب‌سازی
    let orderBy = 'p.created_at DESC';
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          orderBy = '(SELECT MIN(vl.price) FROM vendor_listings vl WHERE vl.product_id = p.id) ASC';
          break;
        case 'price_desc':
          orderBy = '(SELECT MAX(vl.price) FROM vendor_listings vl WHERE vl.product_id = p.id) DESC';
          break;
        case 'name_asc':
          orderBy = 'p.name ASC';
          break;
        case 'name_desc':
          orderBy = 'p.name DESC';
          break;
        case 'created_asc':
          orderBy = 'p.created_at ASC';
          break;
        case 'created_desc':
          orderBy = 'p.created_at DESC';
          break;
        default:
          orderBy = 'p.created_at DESC';
      }
    }

    const limitClause = filters.limit ? ' LIMIT ?' : '';
    const offsetClause = (filters.page && filters.limit) ? ' OFFSET ?' : '';

    if (filters.limit !== undefined) params.push(filters.limit);
    if (filters.page !== undefined && filters.limit !== undefined) {
      const offset = (filters.page - 1) * filters.limit;
      params.push(offset);
    }

    const sql = `
      SELECT DISTINCT p.id, p.name, p.slug, p.brand_id, p.category_id, 
             p.description, p.specifications, p.suitable_for, p.images, p.created_at
      FROM products p
      WHERE ${where}
      ORDER BY ${orderBy}
    ` + limitClause + offsetClause;

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as Product[];

    // تبدیل فیلدهای JSON
    return rows.map(row => ({
      ...row,
      specifications: row.specifications ? JSON.parse(row.specifications) : null,
      suitable_for: row.suitable_for ? JSON.parse(row.suitable_for) : [],
      images: row.images ? JSON.parse(row.images) : [],
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * یافتن محصول بر اساس شناسه
   */
  static findById(id: number): Product | undefined {
    const stmt = db.prepare(`
      SELECT id, name, slug, brand_id, category_id, description, specifications, 
             suitable_for, images, created_at 
      FROM products WHERE id = ?
    `);
    const row = stmt.get(id) as Product | undefined;
    if (!row) return undefined;
    return {
      ...row,
      specifications: row.specifications ? JSON.parse(row.specifications) : null,
      suitable_for: row.suitable_for ? JSON.parse(row.suitable_for) : [],
      images: row.images ? JSON.parse(row.images) : [],
      created_at: new Date(row.created_at),
    };
  }

  /**
   * یافتن محصول بر اساس slug
   */
  static findBySlug(slug: string): Product | undefined {
    const stmt = db.prepare(`
      SELECT id, name, slug, brand_id, category_id, description, specifications, 
             suitable_for, images, created_at 
      FROM products WHERE slug = ?
    `);
    const row = stmt.get(slug) as Product | undefined;
    if (!row) return undefined;
    return {
      ...row,
      specifications: row.specifications ? JSON.parse(row.specifications) : null,
      suitable_for: row.suitable_for ? JSON.parse(row.suitable_for) : [],
      images: row.images ? JSON.parse(row.images) : [],
      created_at: new Date(row.created_at),
    };
  }

  /**
   * ایجاد محصول جدید
   */
  static create(data: Omit<Product, 'id' | 'created_at'>): Product {
    const stmt = db.prepare(`
      INSERT INTO products (name, slug, brand_id, category_id, description, specifications, suitable_for, images)
      VALUES (@name, @slug, @brand_id, @category_id, @description, @specifications, @suitable_for, @images)
    `);
    const info = stmt.run({
      name: data.name,
      slug: data.slug,
      brand_id: data.brand_id,
      category_id: data.category_id,
      description: data.description ?? null,
      specifications: data.specifications ? JSON.stringify(data.specifications) : null,
      suitable_for: JSON.stringify(data.suitable_for),
      images: JSON.stringify(data.images),
    });
    const id = info.lastInsertRowid as number;
    return { ...data, id, created_at: new Date() };
  }

  /**
   * به‌روزرسانی محصول
   */
  static update(id: number, data: Partial<Omit<Product, 'id' | 'created_at'>>): Product | undefined {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
    if (data.brand_id !== undefined) { fields.push('brand_id = ?'); values.push(data.brand_id); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description ?? null); }
    if (data.specifications !== undefined) { fields.push('specifications = ?'); values.push(data.specifications ? JSON.stringify(data.specifications) : null); }
    if (data.suitable_for !== undefined) { fields.push('suitable_for = ?'); values.push(JSON.stringify(data.suitable_for)); }
    if (data.images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(data.images)); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * حذف محصول
   */
  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
}

/**
 * کلاس مدل لیستینگ فروشنده
 */
export class VendorListingModel {
  /**
   * یافتن لیستینگ‌های یک محصول
   */
  static findByProductId(productId: number): VendorListing[] {
    const stmt = db.prepare(`
      SELECT id, product_id, vendor_id, price, discount_percentage, stock, 
             is_authentic, expiry_date, shipping_cost, shipping_days, city, created_at
      FROM vendor_listings WHERE product_id = ?
    `);
    const rows = stmt.all(productId) as VendorListing[];
    return rows.map(row => ({
      ...row,
      expiry_date: row.expiry_date ?? null,
      city: row.city ?? null,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * یافتن لیستینگ‌های یک فروشنده
   */
  static findByVendorId(vendorId: number): VendorListing[] {
    const stmt = db.prepare(`
      SELECT id, product_id, vendor_id, price, discount_percentage, stock, 
             is_authentic, expiry_date, shipping_cost, shipping_days, city, created_at
      FROM vendor_listings WHERE vendor_id = ?
    `);
    const rows = stmt.all(vendorId) as VendorListing[];
    return rows.map(row => ({
      ...row,
      expiry_date: row.expiry_date ?? null,
      city: row.city ?? null,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * یافتن لیستینگ بر اساس شناسه
   */
  static findById(id: number): VendorListing | undefined {
    const stmt = db.prepare(`
      SELECT id, product_id, vendor_id, price, discount_percentage, stock, 
             is_authentic, expiry_date, shipping_cost, shipping_days, city, created_at
      FROM vendor_listings WHERE id = ?
    `);
    const row = stmt.get(id) as VendorListing | undefined;
    if (!row) return undefined;
    return {
      ...row,
      expiry_date: row.expiry_date ?? null,
      city: row.city ?? null,
      created_at: new Date(row.created_at),
    };
  }

  /**
   * ایجاد لیستینگ جدید
   */
  static create(data: Omit<VendorListing, 'id' | 'created_at'>): VendorListing {
    const stmt = db.prepare(`
      INSERT INTO vendor_listings 
      (product_id, vendor_id, price, discount_percentage, stock, is_authentic, expiry_date, shipping_cost, shipping_days, city)
      VALUES 
      (@product_id, @vendor_id, @price, @discount_percentage, @stock, @is_authentic, @expiry_date, @shipping_cost, @shipping_days, @city)
    `);
    const info = stmt.run({
      product_id: data.product_id,
      vendor_id: data.vendor_id,
      price: data.price,
      discount_percentage: data.discount_percentage,
      stock: data.stock,
      is_authentic: data.is_authentic ? 1 : 0,
      expiry_date: data.expiry_date ?? null,
      shipping_cost: data.shipping_cost,
      shipping_days: data.shipping_days,
      city: data.city ?? null,
    });
    const id = info.lastInsertRowid as number;
    return { ...data, id, created_at: new Date() };
  }

  /**
   * به‌روزرسانی لیستینگ
   */
  static update(id: number, data: Partial<Omit<VendorListing, 'id' | 'created_at'>>): VendorListing | undefined {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
    if (data.discount_percentage !== undefined) { fields.push('discount_percentage = ?'); values.push(data.discount_percentage); }
    if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }
    if (data.is_authentic !== undefined) { fields.push('is_authentic = ?'); values.push(data.is_authentic ? 1 : 0); }
    if (data.expiry_date !== undefined) { fields.push('expiry_date = ?'); values.push(data.expiry_date ?? null); }
    if (data.shipping_cost !== undefined) { fields.push('shipping_cost = ?'); values.push(data.shipping_cost); }
    if (data.shipping_days !== undefined) { fields.push('shipping_days = ?'); values.push(data.shipping_days); }
    if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city ?? null); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const stmt = db.prepare(`UPDATE vendor_listings SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    return this.findById(id);
  }

  /**
   * حذف لیستینگ
   */
  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM vendor_listings WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  /**
   * کاهش موجودی به صورت اتمیک (تراکنش)
   * @param listingId شناسه لیستینگ
   * @param qty تعداد مورد کاهش
   * @returns true اگر موجودی کافی بود و کاهش شد، false در غیر این صورت
   */
  static decrementStock(listingId: number, qty: number): boolean {
    return db.transaction(() => {
      const listingStmt = db.prepare('SELECT stock FROM vendor_listings WHERE id = ? FOR UPDATE');
      const listing = listingStmt.get(listingId) as { stock: number } | undefined;
      if (!listing) return false;
      if (listing.stock < qty) return false;

      const updateStmt = db.prepare('UPDATE vendor_listings SET stock = stock - ? WHERE id = ?');
      const info = updateStmt.run(qty, listingId);
      return info.changes > 0;
    })();
  }
}

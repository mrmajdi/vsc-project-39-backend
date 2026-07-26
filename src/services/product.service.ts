// @vsc repo:vsc-project-39-backend file:src/services/product.service.ts task:b17-src-services-product-service-ts module:backend session:39
import Database from 'better-sqlite3';
import { db } from '../config/db';

export interface ProductFilters {
  species?: string;
  category_id?: number;
  brand_id?: number;
  q?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: 'best-selling' | 'price-asc' | 'price-desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function parseJsonField<T>(value: unknown): T | null {
  if (typeof value !== 'string') {
    return (value as T) ?? null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    ...row,
    suitable_for: parseJsonField<string[]>(row.suitable_for) ?? [],
    specifications: parseJsonField<Record<string, unknown>>(row.specifications) ?? {},
  } as Product;
}

export function getProducts(filters: ProductFilters): PaginatedResult<Product> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, Math.min(100, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  const where: string[] = ['1 = 1'];
  const params: Array<string | number | boolean> = [];

  if (filters.species) {
    where.push("suitable_for LIKE ?");
    params.push(`%"${filters.species}"%`);
  }

  if (filters.category_id) {
    where.push('category_id = ?');
    params.push(filters.category_id);
  }

  if (filters.brand_id) {
    where.push('brand_id = ?');
    params.push(filters.brand_id);
  }

  if (filters.q) {
    where.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  if (typeof filters.min_price === 'number') {
    where.push('price >= ?');
    params.push(filters.min_price);
  }

  if (typeof filters.max_price === 'number') {
    where.push('price <= ?');
    params.push(filters.max_price);
  }

  if (filters.in_stock) {
    where.push('stock > 0');
  }

  let orderBy = 'created_at DESC';
  switch (filters.sort) {
    case 'best-selling':
      orderBy = 'sales_count DESC';
      break;
    case 'price-asc':
      orderBy = 'price ASC';
      break;
    case 'price-desc':
      orderBy = 'price DESC';
      break;
    case 'newest':
      orderBy = 'created_at DESC';
      break;
    default:
      orderBy = 'created_at DESC';
      break;
  }

  const whereClause = where.join(' AND ');

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM products WHERE ${whereClause}`).get(...params) as { count: number };
  const total = countRow.count;

  const dataRows = db.prepare(
    `SELECT * FROM products WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Record<string, unknown>[];

  const data = dataRows.map(mapProduct);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getProductById(id: number): Product | null {
  const row = db.prepare(
    `SELECT p.*, b.name as brand_name, c.name as category_name
     FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`
  ).get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  return mapProduct(row);
}

export function getProductListings(productId: number): VendorListing[] {
  const rows = db.prepare(
    `SELECT vl.*, v.name as vendor_name, v.slug as vendor_slug, v.rating as vendor_rating
     FROM vendor_listings vl
     INNER JOIN vendors v ON vl.vendor_id = v.id
     WHERE vl.product_id = ? AND vl.is_active = 1
     ORDER BY (vl.price - (vl.price * vl.discount / 100)) ASC`
  ).all(productId) as Record<string, unknown>[];

  return rows.map((row) => ({
    ...row,
    specifications: parseJsonField<Record<string, unknown>>(row.specifications) ?? {},
  })) as VendorListing[];
}

export function getProductReviews(productId: number): Review[] {
  const rows = db.prepare(
    `SELECT r.*, u.name as user_name
     FROM reviews r
     INNER JOIN users u ON r.user_id = u.id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`
  ).all(productId) as Record<string, unknown>[];

  return rows as Review[];
}

export function getCategories(): Category[] {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as Category[];
  return rows;
}

export function getBrands(): Brand[] {
  const rows = db.prepare('SELECT * FROM brands ORDER BY name ASC').all() as Brand[];
  return rows;
}

export function getSpecialDeals(): Array<Product & { deal_price: number; discount: number; end_date: string }> {
  const rows = db.prepare(
    `SELECT p.*, vl.discount, vl.end_date,
            (vl.price - (vl.price * vl.discount / 100)) as deal_price
     FROM special_deals sd
     INNER JOIN vendor_listings vl ON sd.listing_id = vl.id
     INNER JOIN products p ON vl.product_id = p.id
     WHERE sd.is_approved = 1 AND sd.end_date > datetime('now')
     ORDER BY sd.end_date ASC`
  ).all() as Record<string, unknown>[];

  return rows.map((row) => ({
    ...mapProduct(row),
    deal_price: Number(row.deal_price),
    discount: Number(row.discount),
    end_date: String(row.end_date),
  }));
}

export function getVendors(): Vendor[] {
  const rows = db.prepare(
    `SELECT v.*,
            (SELECT COUNT(*) FROM vendor_listings vl WHERE vl.vendor_id = v.id AND vl.is_active = 1) as product_count
     FROM vendors v
     WHERE v.is_approved = 1
     ORDER BY v.rating DESC`
  ).all() as Vendor[];

  return rows;
}

export function getVendorById(id: number): Vendor | null {
  const row = db.prepare(
    `SELECT v.*,
            (SELECT COUNT(*) FROM vendor_listings vl WHERE vl.vendor_id = v.id AND vl.is_active = 1) as product_count
     FROM vendors v
     WHERE v.id = ? AND v.is_approved = 1`
  ).get(id) as Vendor | undefined;

  return row ?? null;
}

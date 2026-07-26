import { Database } from 'better-sqlite3';

export interface Vendor {
  id: number;
  user_id: number;
  shop_name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  commission_rate: number; // percentage as float (e.g., 5.5 for 5.5%)
  is_verified: boolean;
  is_blocked: boolean;
  rating: number; // average rating 0-5
  total_sales: number; // total sales amount
  created_at: string; // ISO timestamp
}

export interface Review {
  id: number;
  reviewable_type: 'product' | 'vendor' | 'clinic';
  reviewable_id: number;
  user_id: number;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
}

export interface SpecialDeal {
  id: number;
  vendor_listing_id: number;
  discount_percentage: number; // e.g., 20 for 20%
  start_date: string; // ISO date
  end_date: string; // ISO date
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

export class VendorModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  findAll(limit: number = 20, offset: number = 0): Vendor[] {
    const stmt = this.db.prepare(`
      SELECT * FROM vendors
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as Vendor[];
  }

  findById(id: number): Vendor | undefined {
    const stmt = this.db.prepare('SELECT * FROM vendors WHERE id = ?');
    const row = stmt.get(id) as Vendor | undefined;
    return row;
  }

  findBySlug(slug: string): Vendor | undefined {
    const stmt = this.db.prepare('SELECT * FROM vendors WHERE slug = ?');
    const row = stmt.get(slug) as Vendor | undefined;
    return row;
  }

  findByUserId(userId: number): Vendor | undefined {
    const stmt = this.db.prepare('SELECT * FROM vendors WHERE user_id = ?');
    const row = stmt.get(userId) as Vendor | undefined;
    return row;
  }

  create(vendor: Omit<Vendor, 'id' | 'created_at' | 'rating' | 'total_sales'>): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO vendors (
        user_id, shop_name, slug, logo_url, banner_url, description,
        phone, address, city, commission_rate, is_verified, is_blocked,
        created_at
      ) VALUES (
        @user_id, @shop_name, @slug, @logo_url, @banner_url, @description,
        @phone, @address, @city, @commission_rate, @is_verified, @is_blocked,
        @created_at
      )
    `);
    const info = stmt.run({
      user_id: vendor.user_id,
      shop_name: vendor.shop_name,
      slug: vendor.slug,
      logo_url: vendor.logo_url ?? null,
      banner_url: vendor.banner_url ?? null,
      description: vendor.description ?? null,
      phone: vendor.phone ?? null,
      address: vendor.address ?? null,
      city: vendor.city ?? null,
      commission_rate: vendor.commission_rate,
      is_verified: vendor.is_verified ? 1 : 0,
      is_blocked: vendor.is_blocked ? 1 : 0,
      created_at: now,
    });
    return info.lastInsertRowid as number;
  }

  update(id: number, vendor: Partial<Vendor>): boolean {
    const fields: string[] = [];
    const params: any = {};
    const allowed: (keyof Vendor)[] = [
      'shop_name', 'slug', 'logo_url', 'banner_url', 'description',
      'phone', 'address', 'city', 'commission_rate', 'is_verified', 'is_blocked'
    ];
    for (const key of allowed) {
      if (vendor[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        params[key] = vendor[key];
      }
    }
    if (fields.length === 0) return false;
    params.id = id;
    const stmt = this.db.prepare(`
      UPDATE vendors SET ${fields.join(', ')} WHERE id = @id
    `);
    const info = stmt.run(params);
    return info.changes > 0;
  }

  updateCommissionRate(id: number, rate: number): boolean {
    const stmt = this.db.prepare('UPDATE vendors SET commission_rate = ? WHERE id = ?');
    const info = stmt.run(rate, id);
    return info.changes > 0;
  }

  verify(id: number, verified: boolean = true): boolean {
    const stmt = this.db.prepare('UPDATE vendors SET is_verified = ? WHERE id = ?');
    const info = stmt.run(verified ? 1 : 0, id);
    return info.changes > 0;
  }

  block(id: number, blocked: boolean = true): boolean {
    const stmt = this.db.prepare('UPDATE vendors SET is_blocked = ? WHERE id = ?');
    const info = stmt.run(blocked ? 1 : 0, id);
    return info.changes > 0;
  }

  getDashboardStats(vendorId: number): { totalSales: number; listingCount: number } {
    const salesStmt = this.db.prepare(`
      SELECT COALESCE(SUM(oi.quantity * oi.price), 0) AS total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN vendor_listings vl ON oi.vendor_listing_id = vl.id
      WHERE vl.vendor_id = ? AND o.status IN ('completed', 'shipped')
    `);
    const salesRow = salesStmt.get(vendorId) as { total: number };
    const totalSales = Number(salesRow.total) || 0;

    const listingStmt = this.db.prepare(`
      SELECT COUNT(*) AS count FROM vendor_listings WHERE vendor_id = ?
    `);
    const listingRow = listingStmt.get(vendorId) as { count: number };
    const listingCount = Number(listingRow.count) || 0;

    return { totalSales, listingCount };
  }
}

export class ReviewModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  findByProduct(productId: number, limit: number = 10, offset: number = 0): Review[] {
    const stmt = this.db.prepare(`
      SELECT * FROM reviews
      WHERE reviewable_type = 'product' AND reviewable_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(productId, limit, offset) as Review[];
  }

  findByVendor(vendorId: number, limit: number = 10, offset: number = 0): Review[] {
    const stmt = this.db.prepare(`
      SELECT * FROM reviews
      WHERE reviewable_type = 'vendor' AND reviewable_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(vendorId, limit, offset) as Review[];
  }

  findByClinic(clinicId: number, limit: number = 10, offset: number = 0): Review[] {
    const stmt = this.db.prepare(`
      SELECT * FROM reviews
      WHERE reviewable_type = 'clinic' AND reviewable_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(clinicId, limit, offset) as Review[];
  }

  create(review: Omit<Review, 'id' | 'created_at'>): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO reviews (
        reviewable_type, reviewable_id, user_id, rating, comment, created_at
      ) VALUES (
        @reviewable_type, @reviewable_id, @user_id, @rating, @comment, @created_at
      )
    `);
    const info = stmt.run({
      reviewable_type: review.reviewable_type,
      reviewable_id: review.reviewable_id,
      user_id: review.user_id,
      rating: review.rating,
      comment: review.comment ?? null,
      created_at: now,
    });
    return info.lastInsertRowid as number;
  }

  getAverageRating(reviewableType: 'product' | 'vendor' | 'clinic', reviewableId: number): number {
    const stmt = this.db.prepare(`
      SELECT COALESCE(AVG(rating), 0) AS avg
      FROM reviews
      WHERE reviewable_type = ? AND reviewable_id = ?
    `);
    const row = stmt.get(reviewableType, reviewableId) as { avg: number };
    return Number(row.avg) || 0;
  }
}

export class SpecialDealModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  findActive(now: string = new Date().toISOString().slice(0, 10)): SpecialDeal[] {
    const stmt = this.db.prepare(`
      SELECT * FROM special_deals
      WHERE status = 'approved'
        AND start_date <= ?
        AND end_date >= ?
      ORDER BY created_at DESC
    `);
    return stmt.all(now, now) as SpecialDeal[];
  }

  findAll(limit: number = 20, offset: number = 0): SpecialDeal[] {
    const stmt = this.db.prepare(`
      SELECT * FROM special_deals
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as SpecialDeal[];
  }

  findById(id: number): SpecialDeal | undefined {
    const stmt = this.db.prepare('SELECT * FROM special_deals WHERE id = ?');
    const row = stmt.get(id) as SpecialDeal | undefined;
    return row;
  }

  create(deal: Omit<SpecialDeal, 'id' | 'created_at'>): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO special_deals (
        vendor_listing_id, discount_percentage, start_date, end_date,
        status, rejection_reason, created_at
      ) VALUES (
        @vendor_listing_id, @discount_percentage, @start_date, @end_date,
        @status, @rejection_reason, @created_at
      )
    `);
    const info = stmt.run({
      vendor_listing_id: deal.vendor_listing_id,
      discount_percentage: deal.discount_percentage,
      start_date: deal.start_date,
      end_date: deal.end_date,
      status: deal.status,
      rejection_reason: deal.rejection_reason ?? null,
      created_at: now,
    });
    return info.lastInsertRowid as number;
  }

  approve(id: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE special_deals
      SET status = 'approved', rejection_reason = NULL
      WHERE id = ? AND status = 'pending'
    `);
    const info = stmt.run(id);
    return info.changes > 0;
  }

  reject(id: number, reason: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE special_deals
      SET status = 'rejected', rejection_reason = ?
      WHERE id = ? AND status = 'pending'
    `);
    const info = stmt.run(reason, id);
    return info.changes > 0;
  }

  findPending(limit: number = 20, offset: number = 0): SpecialDeal[] {
    const stmt = this.db.prepare(`
      SELECT * FROM special_deals
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as SpecialDeal[];
  }
}

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../config/db';

/**
 * GET /admin/dashboard
 * Returns key performance indicators for the admin dashboard.
 */
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Total revenue: sum of completed order amounts
    const revenueRow = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'completed'`
    ).get() as { total: number };
    const totalRevenue = Number(revenueRow.total);

    // Platform commission earned: sum of commission from completed orders
    const commissionRow = db.prepare(
      `SELECT COALESCE(SUM(commission), 0) AS commission FROM orders WHERE status = 'completed'`
    ).get() as { commission: number };
    const platformCommission = Number(commissionRow.commission);

    // Order count (all orders)
    const orderCountRow = db.prepare(
      `SELECT COUNT(*) AS count FROM orders`
    ).get() as { count: number };
    const orderCount = orderCountRow.count;

    // Vendor count (all vendors)
    const vendorCountRow = db.prepare(
      `SELECT COUNT(*) AS count FROM vendors`
    ).get() as { count: number };
    const vendorCount = vendorCountRow.count;

    // User count (all users)
    const userCountRow = db.prepare(
      `SELECT COUNT(*) AS count FROM users`
    ).get() as { count: number };
    const userCount = userCountRow.count;

    // Pet species distribution for pie chart
    const speciesRows = db.prepare(
      `SELECT species, COUNT(*) AS count FROM pets GROUP BY species`
    ).all() as Array<{ species: string; count: number }>;
    const petSpeciesDistribution = speciesRows.map(({ species, count }) => ({
      species,
      count: Number(count)
    }));

    res.json({
      message: 'داشبورد با موفقیت بارگذاری شد',
      totalRevenue,
      platformCommission,
      orderCount,
      vendorCount,
      userCount,
      petSpeciesDistribution
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/vendors/:vendor_id
 * Updates a vendor's status, commission rate, and blocked flag.
 */
export const updateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const updateVendorSchema = z.object({
      status: z.enum(['approved', 'rejected', 'blocked']),
      commission_rate: z.number().min(0).max(100),
      is_blocked: z.boolean()
    });

    const parsedBody = updateVendorSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        message: 'داده‌های ورودی نامعتبر است',
        errors: parsedBody.error.format()
      });
      return;
    }

    const { status, commission_rate, is_blocked } = parsedBody.data;
    const { vendor_id } = req.params;

    // Ensure vendor exists
    const vendorExists = db.prepare(
      `SELECT id FROM vendors WHERE id = ?`
    ).get(vendor_id);
    if (!vendorExists) {
      res.status(404).json({ message: 'فروشنده یافت نشد' });
      return;
    }

    // Update vendor
    db.prepare(
      `UPDATE vendors SET status = ?, commission_rate = ?, is_blocked = ? WHERE id = ?`
    ).run(status, commission_rate, is_blocked, vendor_id);

    // Fetch updated vendor
    const updatedVendor = db.prepare(
      `SELECT id, username, email, status, commission_rate, is_blocked, created_at FROM vendors WHERE id = ?`
    ).get(vendor_id);

    res.json({
      message: 'فروشنده با موفقیت به‌روزرسانی شد',
      vendor: updatedVendor
    });
  } catch (error) {
    next(error);
  }
};

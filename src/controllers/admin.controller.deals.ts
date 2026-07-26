// @vsc repo:vsc-project-39-backend file:src/controllers/admin.controller.deals.ts task:b19-src-controllers-admin-controller-deals-t module:backend session:39
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import database from '../config/db';

type DbRow = Record<string, unknown>;

const reviewSpecialDealSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'عملیات باید تأیید یا رد باشد' }),
  }),
  reason: z
    .string()
    .min(3, 'دلیل باید حداقل ۳ کاراکتر باشد')
    .max(500, 'دلیل نمی‌تواند بیش از ۵۰۰ کاراکتر باشد'),
});

const createBannerSchema = z.object({
  image_url: z.string().min(1, 'آدرس تصویر الزامی است'),
  link: z.string().optional().default(''),
  position: z.enum(['home_hero', 'home_sidebar', 'category_top', 'blog_top'], {
    errorMap: () => ({ message: 'موقعیت بنر نامعتبر است' }),
  }),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

const updateBannerSchema = createBannerSchema.partial();

export const reviewSpecialDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dealId = Number(req.params.deal_id);
    if (!dealId || dealId <= 0) {
      res.status(400).json({ message: 'شناسه تخفیف نامعتبر است' });
      return;
    }

    const parsed = reviewSpecialDealSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { action, reason } = parsed.data;

    const db = database;
    const deal = db
      .prepare('SELECT * FROM special_deals WHERE id = ?')
      .get(dealId) as DbRow | undefined;

    if (!deal) {
      res.status(404).json({ message: 'تخفیف مورد نظر یافت نشد' });
      return;
    }

    if (deal.status === 'approved' || deal.status === 'rejected') {
      res.status(409).json({
        message: 'این تخفیف قبلاً بررسی شده است',
      });
      return;
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updateDealTx = db.transaction(() => {
      db.prepare(
        `UPDATE special_deals SET status = ?, admin_reason = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(newStatus, reason, dealId);

      if (action === 'reject' && deal.listing_id) {
        const originalPrice = deal.original_price as number | null;
        if (originalPrice !== null && originalPrice !== undefined) {
          db.prepare(
            `UPDATE vendor_listings SET price = ?, updated_at = datetime('now') WHERE id = ?`
          ).run(originalPrice, deal.listing_id);
        }
        db.prepare(
          `UPDATE vendor_listings SET is_on_sale = 0, updated_at = datetime('now') WHERE id = ?`
        ).run(deal.listing_id);
      }

      if (action === 'approve' && deal.listing_id) {
        db.prepare(
          `UPDATE vendor_listings SET is_on_sale = 1, updated_at = datetime('now') WHERE id = ?`
        ).run(deal.listing_id);
      }
    });

    updateDealTx();

    res.status(200).json({
      message:
        action === 'approve'
          ? 'تخفیف با موفقیت تأیید شد'
          : 'تخفیف رد شد و قیمت محصول به حالت اولیه بازگشت',
      deal_id: dealId,
      status: newStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const getFinanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = database;

    const commissionRow = db
      .prepare(
        `SELECT COALESCE(SUM(platform_commission), 0) AS total_commission FROM order_items`
      )
      .get() as DbRow;
    const totalCommission = Number(commissionRow.total_commission || 0);

    const pendingSettlementsRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS pending_amount FROM vendor_settlements WHERE status = 'pending'`
      )
      .get() as DbRow;
    const pendingSettlementsAmount = Number(
      pendingSettlementsRow.pending_amount || 0
    );

    const paidSettlementsRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM vendor_settlements WHERE status = 'paid'`
      )
      .get() as DbRow;
    const paidSettlementsAmount = Number(paidSettlementsRow.paid_amount || 0);

    const pendingVendorPayoutRow = db
      .prepare(
        `SELECT COALESCE(SUM(vendor_payout), 0) AS pending_payout FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE status != 'cancelled') AND order_id NOT IN (SELECT order_id FROM vendor_settlements WHERE status = 'paid')`
      )
      .get() as DbRow;
    const pendingVendorPayoutAmount = Number(
      pendingVendorPayoutRow.pending_payout || 0
    );

    res.status(200).json({
      total_platform_commission: totalCommission,
      pending_settlements_amount: pendingSettlementsAmount,
      paid_settlements_amount: paidSettlementsAmount,
      pending_vendor_payout_amount: pendingVendorPayoutAmount,
    });
  } catch (error) {
    next(error);
  }
};

export const paySettlement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settlementId = Number(req.params.settlement_id);
    if (!settlementId || settlementId <= 0) {
      res.status(400).json({ message: 'شناسه تسویه نامعتبر است' });
      return;
    }

    const transactionRefSchema = z.object({
      transaction_reference: z
        .string()
        .min(3, 'کد تراکنش الزامی است')
        .max(100, 'کد تراکنش بسیار طولانی است'),
    });

    const parsed = transactionRefSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { transaction_reference } = parsed.data;

    const db = database;
    const settlement = db
      .prepare('SELECT * FROM vendor_settlements WHERE id = ?')
      .get(settlementId) as DbRow | undefined;

    if (!settlement) {
      res.status(404).json({ message: 'تسویه مورد نظر یافت نشد' });
      return;
    }

    if (settlement.status === 'paid') {
      res.status(409).json({ message: 'این تسویه قبلاً پرداخت شده است' });
      return;
    }

    db.prepare(
      `UPDATE vendor_settlements SET status = 'paid', paid_at = datetime('now'), transaction_reference = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(transaction_reference, settlementId);

    res.status(200).json({
      message: 'پرداخت تسویه با موفقیت ثبت شد',
      settlement_id: settlementId,
      status: 'paid',
      transaction_reference,
    });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = createBannerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { image_url, link, position, sort_order, is_active } = parsed.data;

    const db = database;
    const result = db
      .prepare(
        `INSERT INTO banners (image_url, link, position, sort_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .run(image_url, link, position, sort_order, is_active ? 1 : 0);

    res.status(201).json({
      message: 'بنر با موفقیت ایجاد شد',
      banner_id: result.lastInsertRowid,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bannerId = Number(req.params.id);
    if (!bannerId || bannerId <= 0) {
      res.status(400).json({ message: 'شناسه بنر نامعتبر است' });
      return;
    }

    const parsed = updateBannerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'اطلاعات وارد شده نامعتبر است',
        errors: parsed.error.flatten(),
      });
      return;
    }

    const db = database;
    const banner = db
      .prepare('SELECT * FROM banners WHERE id = ?')
      .get(bannerId) as DbRow | undefined;

    if (!banner) {
      res.status(404).json({ message: 'بنر مورد نظر یافت نشد' });
      return;
    }

    const fields: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (parsed.data.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(parsed.data.image_url);
    }
    if (parsed.data.link !== undefined) {
      fields.push('link = ?');
      values.push(parsed.data.link);
    }
    if (parsed.data.position !== undefined) {
      fields.push('position = ?');
      values.push(parsed.data.position);
    }
    if (parsed.data.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(parsed.data.sort_order);
    }
    if (parsed.data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(parsed.data.is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      res.status(400).json({ message: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است' });
      return;
    }

    fields.push(`updated_at = datetime('now')`);
    values.push(bannerId);

    db.prepare(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`).run(
      ...values
    );

    res.status(200).json({
      message: 'بنر با موفقیت به‌روزرسانی شد',
      banner_id: bannerId,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bannerId = Number(req.params.id);
    if (!bannerId || bannerId <= 0) {
      res.status(400).json({ message: 'شناسه بنر نامعتبر است' });
      return;
    }

    const db = database;
    const banner = db
      .prepare('SELECT * FROM banners WHERE id = ?')
      .get(bannerId) as DbRow | undefined;

    if (!banner) {
      res.status(404).json({ message: 'بنر مورد نظر یافت نشد' });
      return;
    }

    db.prepare('DELETE FROM banners WHERE id = ?').run(bannerId);

    res.status(200).json({
      message: 'بنر با موفقیت حذف شد',
      banner_id: bannerId,
    });
  } catch (error) {
    next(error);
  }
};

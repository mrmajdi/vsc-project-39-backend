import { db } from '../config/db';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
}

export interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url: string | null;
  position: 'hero' | 'sidebar' | 'middle';
  sort_order: number;
  is_active: number;
  created_at: string;
}

export class BlogModel {
  static findAll(limit: number = 10, offset: number = 0): Promise<BlogPost[]> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          SELECT id, title, slug, excerpt, content, cover_image, author, published_at, created_at
          FROM blog_posts
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `);
        const posts = stmt.all(limit, offset) as BlogPost[];
        resolve(posts);
      } catch (err) {
        reject(err);
      }
    });
  }

  static findById(id: number): Promise<BlogPost | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          SELECT id, title, slug, excerpt, content, cover_image, author, published_at, created_at
          FROM blog_posts
          WHERE id = ?
        `);
        const post = stmt.get(id) as BlogPost | undefined;
        resolve(post);
      } catch (err) {
        reject(err);
      }
    });
  }

  static findBySlug(slug: string): Promise<BlogPost | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          SELECT id, title, slug, excerpt, content, cover_image, author, published_at, created_at
          FROM blog_posts
          WHERE slug = ?
        `);
        const post = stmt.get(slug) as BlogPost | undefined;
        resolve(post);
      } catch (err) {
        reject(err);
      }
    });
  }

  static create(post: Omit<BlogPost, 'id' | 'created_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, author, published_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        const info = stmt.run(
          post.title,
          post.slug,
          post.excerpt ?? null,
          post.content ?? null,
          post.cover_image ?? null,
          post.author ?? null,
          post.published_at ?? null
        );
        resolve(info.lastInsertRowid as number);
      } catch (err) {
        reject(err);
      }
    });
  }

  static update(id: number, updates: Partial<Omit<BlogPost, 'id' | 'created_at'>>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const fields = Object.keys(updates);
        if (fields.length === 0) {
          resolve(false);
          return;
        }
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        const values = fields.map(field => updates[field]);
        const stmt = db.prepare(`
          UPDATE blog_posts
          SET ${setClause}
          WHERE id = $${fields.length + 1}
        `);
        values.push(id);
        const info = stmt.run(...values);
        resolve(info.changes > 0);
      } catch (err) {
        reject(err);
      }
    });
  }

  static delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('DELETE FROM blog_posts WHERE id = ?');
        const info = stmt.run(id);
        resolve(info.changes > 0);
      } catch (err) {
        reject(err);
      }
    });
  }

  static publish(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          UPDATE blog_posts
          SET published_at = datetime('now')
          WHERE id = ?
        `);
        const info = stmt.run(id);
        resolve(info.changes > 0);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export class BannerModel {
  static findActiveByPosition(position: 'hero' | 'sidebar' | 'middle'): Promise<Banner[]> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          SELECT id, title, image_url, link_url, position, sort_order, is_active, created_at
          FROM banners
          WHERE position = ? AND is_active = 1
          ORDER BY sort_order ASC
        `);
        const banners = stmt.all(position) as Banner[];
        resolve(banners);
      } catch (err) {
        reject(err);
      }
    });
  }

  static findAll(): Promise<Banner[]> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          SELECT id, title, image_url, link_url, position, sort_order, is_active, created_at
          FROM banners
          ORDER BY sort_order ASC
        `);
        const banners = stmt.all() as Banner[];
        resolve(banners);
      } catch (err) {
        reject(err);
      }
    });
  }

  static findById(id: number): Promise<Banner | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          SELECT id, title, image_url, link_url, position, sort_order, is_active, created_at
          FROM banners
          WHERE id = ?
        `);
        const banner = stmt.get(id) as Banner | undefined;
        resolve(banner);
      } catch (err) {
        reject(err);
      }
    });
  }

  static create(banner: Omit<Banner, 'id' | 'created_at'>): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO banners (title, image_url, link_url, position, sort_order, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        const info = stmt.run(
          banner.title,
          banner.image_url,
          banner.link_url ?? null,
          banner.position,
          banner.sort_order,
          banner.is_active ? 1 : 0
        );
        resolve(info.lastInsertRowid as number);
      } catch (err) {
        reject(err);
      }
    });
  }

  static update(id: number, updates: Partial<Omit<Banner, 'id' | 'created_at'>>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const fields = Object.keys(updates);
        if (fields.length === 0) {
          resolve(false);
          return;
        }
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        const values = fields.map(field => {
          const val = updates[field as keyof Banner];
          if (typeof val === 'boolean') return val ? 1 : 0;
          return val;
        });
        const stmt = db.prepare(`
          UPDATE banners
          SET ${setClause}
          WHERE id = $${fields.length + 1}
        `);
        values.push(id);
        const info = stmt.run(...values);
        resolve(info.changes > 0);
      } catch (err) {
        reject(err);
      }
    });
  }

  static delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare('DELETE FROM banners WHERE id = ?');
        const info = stmt.run(id);
        resolve(info.changes > 0);
      } catch (err) {
        reject(err);
      }
    });
  }

  static reorder(id: number, newSortOrder: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          UPDATE banners
          SET sort_order = ?
          WHERE id = ?
        `);
        const info = stmt.run(newSortOrder, id);
        resolve(info.changes > 0);
      } catch (err) {
        reject(err);
      }
    });
  }
}

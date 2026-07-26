import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(process.env.DB_PATH || join(__dirname, '../../data/dev.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = db.prepare('SELECT version FROM migrations ORDER BY version DESC LIMIT 1').get();
  const currentVersion = applied ? applied.version : 0;

  if (currentVersion < 1) {
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'vendor', 'admin')),
        commission_rate REAL DEFAULT 0.0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec(`
      CREATE TABLE otp_codes (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec(`
      CREATE TABLE addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        province TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE pets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        unique_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        breed TEXT,
        gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
        birth_date TEXT,
        weight REAL,
        photo_url TEXT,
        allergies TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE pet_vaccines (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        vaccine_name TEXT NOT NULL,
        date TEXT NOT NULL,
        next_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec(`
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        species TEXT NOT NULL,
        icon_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);
    db.exec(`
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        suitable_for TEXT,
        image_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE vendor_listings (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        price REAL NOT NULL,
        discount_percent REAL DEFAULT 0.0,
        stock INTEGER NOT NULL DEFAULT 0,
        is_authentic INTEGER NOT NULL DEFAULT 1,
        expiry_date TEXT,
        shipping_cost REAL DEFAULT 0.0,
        shipping_time TEXT,
        city TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE carts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE cart_items (
        id TEXT PRIMARY KEY,
        cart_id TEXT NOT NULL,
        listing_id TEXT NOT NULL,
        pet_id TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (listing_id) REFERENCES vendor_listings(id) ON DELETE CASCADE,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
      );
    `);
    db.exec(`
      CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        address_id TEXT NOT NULL,
        total_amount REAL NOT NULL,
        shipping_total REAL NOT NULL DEFAULT 0.0,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
      );
    `);
    db.exec(`
      CREATE TABLE order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        listing_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        snapshot_price REAL NOT NULL,
        snapshot_commission REAL NOT NULL,
        snapshot_tax REAL NOT NULL,
        vendor_net REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (listing_id) REFERENCES vendor_listings(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        tracking_code TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE vendor_settlements (
        id TEXT PRIMARY KEY,
        vendor_id TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
        requested_at TEXT NOT NULL DEFAULT (datetime('now')),
        paid_at TEXT,
        FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE special_deals (
        id TEXT PRIMARY KEY,
        listing_id TEXT NOT NULL,
        discount_percent REAL NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'inactive')),
        admin_note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (listing_id) REFERENCES vendor_listings(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE clinics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        province TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        description TEXT,
        logo_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec(`
      CREATE TABLE clinic_working_hours (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        open_time TEXT NOT NULL,
        close_time TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE clinic_images (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE clinic_services (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      CREATE TABLE blog_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        excerpt TEXT,
        image_url TEXT,
        published_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec(`
      CREATE TABLE banners (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        link_url TEXT,
        position TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec(`
      CREATE TABLE reviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        target_type TEXT NOT NULL CHECK (target_type IN ('product', 'vendor', 'clinic')),
        target_id TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.exec(`
      INSERT INTO migrations (version) VALUES (1);
    `);
  }

  // Future migrations would go here with version checks
}

export default db;

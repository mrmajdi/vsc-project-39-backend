import { db } from '../config/db';

interface User {
  id: number;
  phone: string;
  full_name: string;
  role: 'user' | 'vendor' | 'admin';
  avatar_url?: string | null;
  created_at: string;
}

interface OtpCode {
  id: number;
  phone: string;
  code: string;
  expires_at: string;
  used: number; // 0/1
}

interface Address {
  id: number;
  user_id: number;
  title: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  full_address: string;
  postal_code?: string | null;
  is_default: number; // 0/1
}

export class UserModel {
  /** Find user by phone number */
  static findByPhone(phone: string, dbInstance = db): User | undefined {
    const stmt = dbInstance.prepare('SELECT * FROM users WHERE phone = ?');
    return stmt.get(phone) as User | undefined;
  }

  /** Find user by ID */
  static findById(id: number, dbInstance = db): User | undefined {
    const stmt = dbInstance.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }

  /** Find users by role */
  static findByRole(role: 'user' | 'vendor' | 'admin', dbInstance = db): User[] {
    const stmt = dbInstance.prepare('SELECT * FROM users WHERE role = ?');
    return stmt.all(role) as User[];
  }

  /** Create a new user */
  static create(
    data: Omit<User, 'id' | 'created_at'>,
    dbInstance = db
  ): User {
    const stmt = dbInstance.prepare(
      'INSERT INTO users (phone, full_name, role, avatar_url) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(
      data.phone,
      data.full_name,
      data.role,
      data.avatar_url ?? null
    );
    const id = info.lastInsertRowid as number;
    return { id, ...data, created_at: new Date().toISOString() };
  }

  /** Update user by ID */
  static update(
    id: number,
    data: Partial<Omit<User, 'id' | 'created_at'>>,
    dbInstance = db
    ): boolean {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(data.full_name);
    }
    if (data.role !== undefined) {
      fields.push('role = ?');
      values.push(data.role);
    }
    if (data.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(data.avatar_url ?? null);
    }
    if (fields.length === 0) return false;
    values.push(id);
    const stmt = dbInstance.prepare(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`
    );
    const info = stmt.run(...values);
    return info.changes > 0;
  }

  /** Delete user by ID */
  static delete(id: number, dbInstance = db): boolean {
    const stmt = dbInstance.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  /** Create OTP record */
  static createOtp(
    data: Omit<OtpCode, 'id' | 'used'>,
    dbInstance = db
  ): number {
    const stmt = dbInstance.prepare(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)'
    );
    const info = stmt.run(data.phone, data.code, data.expires_at);
    return info.lastInsertRowid as number;
  }

  /** Verify OTP (returns OTP if valid and unused) */
  static verifyOtp(
    phone: string,
    code: string,
    dbInstance = db
  ): OtpCode | null {
    const stmt = dbInstance.prepare(
      `SELECT * FROM otp_codes 
       WHERE phone = ? AND code = ? AND used = 0 
         AND expires_at > datetime('now') 
       ORDER BY id DESC LIMIT 1`
    );
    const row = stmt.get(phone, code) as OtpCode | undefined;
    return row ?? null;
  }

  /** Mark OTP as used */
  static markOtpUsed(id: number, dbInstance = db): boolean {
    const stmt = dbInstance.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  /** Get all addresses for a user */
  static getAddresses(userId: number, dbInstance = db): Address[] {
    const stmt = dbInstance.prepare(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC'
    );
    return stmt.all(userId) as Address[];
  }

  /** Add a new address for a user */
  static addAddress(
    data: Omit<Address, 'id'>,
    dbInstance = db
  ): number {
    const stmt = dbInstance.prepare(
      `INSERT INTO addresses 
       (user_id, title, recipient_name, phone, province, city, full_address, postal_code, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      data.user_id,
      data.title,
      data.recipient_name,
      data.phone,
      data.province,
      data.city,
      data.full_address,
      data.postal_code ?? null,
      data.is_default ? 1 : 0
    );
    return info.lastInsertRowid as number;
  }

  /** Update address by ID (ensuring user ownership) */
  static updateAddress(
    id: number,
    userId: number,
    data: Partial<Omit<Address, 'id' | 'user_id'>>,
    dbInstance = db
  ): boolean {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.recipient_name !== undefined) {
      fields.push('recipient_name = ?');
      values.push(data.recipient_name);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.province !== undefined) {
      fields.push('province = ?');
      values.push(data.province);
    }
    if (data.city !== undefined) {
      fields.push('city = ?');
      values.push(data.city);
    }
    if (data.full_address !== undefined) {
      fields.push('full_address = ?');
      values.push(data.full_address);
    }
    if (data.postal_code !== undefined) {
      fields.push('postal_code = ?');
      values.push(data.postal_code ?? null);
    }
    if (data.is_default !== undefined) {
      fields.push('is_default = ?');
      values.push(data.is_default ? 1 : 0);
    }
    if (fields.length === 0) return false;
    values.push(id, userId);
    const stmt = dbInstance.prepare(
      `UPDATE addresses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
    );
    const info = stmt.run(...values);
    return info.changes > 0;
  }

  /** Delete address by ID (ensuring user ownership) */
  static deleteAddress(id: number, userId: number, dbInstance = db): boolean {
    const stmt = dbInstance.prepare(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?'
    );
    const info = stmt.run(id, userId);
    return info.changes > 0;
  }

  /** Set an address as default for a user (unset others) */
  static setDefaultAddress(userId: number, addressId: number, dbInstance = db): boolean {
    return dbInstance.transaction(() => {
      // Unset all defaults for this user
      const unsetStmt = dbInstance.prepare(
        'UPDATE addresses SET is_default = 0 WHERE user_id = ?'
      );
      unsetStmt.run(userId);
      // Set the selected address as default
      const setStmt = dbInstance.prepare(
        'UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?'
      );
      const info = setStmt.run(addressId, userId);
      return info.changes > 0;
    })();
  }
}

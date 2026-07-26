import { Database } from 'better-sqlite3';
import { db } from '../config/db';

export interface Clinic {
  id: number;
  name: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  created_at: string;
}

export interface ClinicWorkingHour {
  id: number;
  clinic_id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface ClinicImage {
  id: number;
  clinic_id: number;
  image_url: string;
  caption?: string | null;
}

export interface ClinicService {
  id: number;
  clinic_id: number;
  name: string;
  description?: string | null;
  price: number;
}

function getTehranTime(): { dayOfWeek: number; timeString: string } {
  const tehranOffsetMinutes = 3.5 * 60;
  const now = new Date();
  const tehranTime = new Date(now.getTime() + tehranOffsetMinutes * 60000);
  const dayOfWeek = tehranTime.getDay();
  const timeString = tehranTime.toTimeString().slice(0, 5);
  return { dayOfWeek, timeString };
}

export function calculateOpenStatus(workingHours: ClinicWorkingHour[]): boolean {
  const { dayOfWeek, timeString: currentTime } = getTehranTime();
  const todayWh = workingHours.find(wh => wh.day_of_week === dayOfWeek);
  if (!todayWh) return false;
  if (todayWh.is_closed) return false;
  return currentTime >= todayWh.open_time && currentTime <= todayWh.close_time;
}

export class ClinicModel {
  constructor(private database: Database) {}

  findAll(options: { 
    city?: string; 
    q?: string; 
    is_open_now?: boolean; 
    page?: number; 
    pageSize?: number 
  }): Clinic[] {
    const { city, q, is_open_now, page = 1, pageSize = 10 } = options;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT c.* FROM clinics c';
    const params: any[] = [];
    const conditions: string[] = [];

    if (city) {
      conditions.push('c.city = ?');
      params.push(city);
    }

    if (q) {
      conditions.push('(c.name LIKE ? OR c.description LIKE ?)');
      const likeTerm = `%${q}%`;
      params.push(likeTerm, likeTerm);
    }

    if (is_open_now) {
      const { dayOfWeek, timeString: currentTime } = getTehranTime();
      query += ' LEFT JOIN clinic_working_hours wh ON c.id = wh.clinic_id AND wh.day_of_week = ?';
      params.push(dayOfWeek);
      conditions.push(
        '(wh.is_closed = 0 AND TIME(wh.open_time) <= TIME(?) AND TIME(wh.close_time) >= TIME(?))'
      );
      params.push(currentTime, currentTime);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const stmt = this.database.prepare(query);
    return stmt.all(params) as Clinic[];
  }

  findById(id: number): Clinic | undefined {
    const stmt = this.database.prepare('SELECT * FROM clinics WHERE id = ?');
    return stmt.get(id) as Clinic | undefined;
  }

  findBySlug(slug: string): Clinic | undefined {
    const stmt = this.database.prepare('SELECT * FROM clinics WHERE slug = ?');
    return stmt.get(slug) as Clinic | undefined;
  }

  create(clinic: Omit<Clinic, 'id' | 'created_at'>): Clinic {
    const now = new Date().toISOString();
    const stmt = this.database.prepare(`
      INSERT INTO clinics (name, slug, logo_url, description, phone, address, city, province, lat, lng, rating, created_at)
      VALUES (@name, @slug, @logo_url, @description, @phone, @address, @city, @province, @lat, @lng, @rating, @created_at)
    `);
    const info = stmt.run({
      ...clinic,
      created_at: now,
      rating: clinic.rating ?? 0,
    });
    const id = info.lastInsertRowid as number;
    return { id, ...clinic, created_at: now, rating: clinic.rating ?? 0 } as Clinic;
  }

  update(id: number, clinic: Partial<Clinic>): Clinic | null {
    const fields = Object.keys(clinic).filter(key => clinic[key as keyof Clinic] !== undefined);
    if (fields.length === 0) return this.findById(id);
    const setClause = fields.map(field => `${field} = @${field}`).join(', ');
    const stmt = this.database.prepare(`
      UPDATE clinics SET ${setClause} WHERE id = @id
    `);
    const params: any = { id };
    fields.forEach(field => {
      params[field] = clinic[field as keyof Clinic];
    });
    const info = stmt.run(params);
    if (info.changes === 0) return null;
    return this.findById(id);
  }

  delete(id: number): boolean {
    const stmt = this.database.prepare('DELETE FROM clinics WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  getWorkingHours(clinicId: number): ClinicWorkingHour[] {
    const stmt = this.database.prepare('SELECT * FROM clinic_working_hours WHERE clinic_id = ? ORDER BY day_of_week');
    return stmt.all(clinicId) as ClinicWorkingHour[];
  }

  setWorkingHours(clinicId: number, workingHours: Omit<ClinicWorkingHour, 'id'>[]): void {
    this.database.prepare('DELETE FROM clinic_working_hours WHERE clinic_id = ?').run(clinicId);
    if (workingHours.length === 0) return;
    const placeholders = workingHours.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const stmt = this.database.prepare(`
      INSERT INTO clinic_working_hours (clinic_id, day_of_week, open_time, close_time, is_closed)
      VALUES ${placeholders}
    `);
    const params: any[] = [];
    workingHours.forEach(wh => {
      params.push(clinicId, wh.day_of_week, wh.open_time, wh.close_time, wh.is_closed ? 1 : 0);
    });
    stmt.run(params);
  }

  getImages(clinicId: number): ClinicImage[] {
    const stmt = this.database.prepare('SELECT * FROM clinic_images WHERE clinic_id = ?');
    return stmt.all(clinicId) as ClinicImage[];
  }

  addImage(clinicId: number, image: Omit<ClinicImage, 'id'>): ClinicImage {
    const stmt = this.database.prepare(`
      INSERT INTO clinic_images (clinic_id, image_url, caption)
      VALUES (@clinic_id, @image_url, @caption)
    `);
    const info = stmt.run({
      clinic_id: clinicId,
      image_url: image.image_url,
      caption: image.caption ?? null,
    });
    const id = info.lastInsertRowid as number;
    return { id, clinic_id: clinicId, ...image } as ClinicImage;
  }

  getServices(clinicId: number): ClinicService[] {
    const stmt = this.database.prepare('SELECT * FROM clinic_services WHERE clinic_id = ?');
    return stmt.all(clinicId) as ClinicService[];
  }

  addService(clinicId: number, service: Omit<ClinicService, 'id'>): ClinicService {
    const stmt = this.database.prepare(`
      INSERT INTO clinic_services (clinic_id, name, description, price)
      VALUES (@clinic_id, @name, @description, @price)
    `);
    const info = stmt.run({
      clinic_id: clinicId,
      name: service.name,
      description: service.description ?? null,
      price: service.price,
    });
    const id = info.lastInsertRowid as number;
    return { id, clinic_id: clinicId, ...service } as ClinicService;
  }

  isCurrentlyOpen(clinicId: number): boolean {
    const workingHours = this.getWorkingHours(clinicId);
    return calculateOpenStatus(workingHours);
  }
}

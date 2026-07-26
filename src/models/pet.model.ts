import { randomUUID } from 'crypto';
import { db } from '../config/db';

export interface Pet {
  id: number;
  user_id: number;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'hamster';
  breed: string;
  gender: string;
  birth_date: string; // ISO string
  weight: number;
  photo_url: string | null;
  unique_code: string; // UUID v4
  allergies: string | null;
  created_at: string; // ISO string
}

export interface PetVaccine {
  id: number;
  pet_id: number;
  vaccine_name: string;
  administered_date: string; // ISO string
  next_due_date: string | null; // ISO string
  vet_clinic: string | null;
}

export class PetModel {
  private constructor() {}

  static findByUserId(userId: number): Pet[] {
    const stmt = db.prepare(`
      SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(userId) as Pet[];
  }

  static findById(id: number): Pet | null {
    const stmt = db.prepare('SELECT * FROM pets WHERE id = ?');
    const row = stmt.get(id) as Pet | undefined;
    return row ?? null;
  }

  static findByUniqueCode(uniqueCode: string): Pet | null {
    const stmt = db.prepare('SELECT * FROM pets WHERE unique_code = ?');
    const row = stmt.get(uniqueCode) as Pet | undefined;
    return row ?? null;
  }

  static create(pet: Omit<Pet, 'id' | 'created_at' | 'unique_code'>): Pet {
    const unique_code = randomUUID();
    const created_at = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO pets (
        user_id, name, species, breed, gender, birth_date, weight, 
        photo_url, unique_code, allergies, unique_code, created_at, allergies
      ) VALUES (
        @user_id, @name, @species, @breed, @gender, @birth_date, @weight,
        @photo_url, @unique_code, @created_at, @allergies
      )
    `);
    const info = stmt.run({
      user_id: pet.user_id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender,
      birth_date: pet.birth_date,
      weight: pet.weight,
      photo_url: pet.photo_url ?? null,
      unique_code,
      created_at,
      allergies: pet.allergies ?? null
    });
    return {
      id: info.lastInsertRowid as number,
      ...pet,
      unique_code,
      created_at
    };
  }

  static update(id: number, pet: Partial<Pet>): boolean {
    const fields = Object.keys(pet).filter(key => pet[key as keyof Pet] !== undefined);
    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = @${field}`).join(', ');
    const stmt = db.prepare(`
      UPDATE pets SET ${setClause} WHERE id = @id
    `);
    const params: Record<string, unknown> = { id };
    fields.forEach(field => {
      params[field] = pet[field as keyof Pet];
    });
    const info = stmt.run(params);
    return info.changes > 0;
  }

  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM pets WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  static addVaccine(vaccine: Omit<PetVaccine, 'id'>): PetVaccine {
    const stmt = db.prepare(`
      INSERT INTO pet_vaccines (
        pet_id, vaccine_name, administered_date, next_due_date, vet_clinic
      ) VALUES (
        @pet_id, @vaccine_name, @administered_date, @next_due_date, @vet_clinic
      )
    `);
    const info = stmt.run({
      pet_id: vaccine.pet_id,
      vaccine_name: vaccine.vaccine_name,
      administered_date: vaccine.administered_date,
      next_due_date: vaccine.next_due_date ?? null,
      vet_clinic: vaccine.vet_clinic ?? null
    });
    return {
      id: info.lastInsertRowid as number,
      ...vaccine
    };
  }

  static getVaccines(petId: number): PetVaccine[] {
    const stmt = db.prepare('SELECT * FROM pet_vaccines WHERE pet_id = ? ORDER BY administered_date DESC');
    return stmt.all(petId) as PetVaccine[];
  }

  static updateVaccine(id: number, vaccine: Partial<PetVaccine>): boolean {
    const fields = Object.keys(vaccine).filter(key => vaccine[key as keyof PetVaccine] !== undefined);
    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = @${field}`).join(', ');
    const stmt = db.prepare(`
      UPDATE pet_vaccines SET ${setClause} WHERE id = @id
    `);
    const params: Record<string, unknown> = { id };
    fields.forEach(field => {
      params[field] = vaccine[field as keyof PetVaccine];
    });
    const info = stmt.run(params);
    return info.changes > 0;
  }

  static deleteVaccine(id: number): boolean {
    const stmt = db.prepare('DELETE FROM pet_vaccines WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  static getPublicPet(uniqueCode: string): Omit<Pet, 'user_id'> | null {
    const stmt = db.prepare(`
      SELECT id, name, species, breed, gender, birth_date, weight, photo_url, unique_code, allergies, created_at
      FROM pets WHERE unique_code = ?
    `);
    const row = stmt.get(uniqueCode) as Omit<Pet, 'user_id'> | undefined;
    return row ?? null;
  }
}

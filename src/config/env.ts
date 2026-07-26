import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

const nodeEnv = process.env.NODE_ENV ?? 'development';

if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('کلید JWT در محیط producción تعریف نشده است. لطفاً متغیر محیطی JWT_SECRET را تنظیم کنید.');
}

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DB_PATH: z.string().default('./data/petshop.db'),
  UPLOAD_DIR: z.string().default('./uploads'),
  CORS_ORIGIN: z.string().default('*'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ متغیرهای محیطی نامعتبر:', _env.error.format());
  throw new Error('متغیرهای محیطی نامعتبر هستند. لطفاً فایل .env را بررسی کنید.');
}

export const env = _env.data;

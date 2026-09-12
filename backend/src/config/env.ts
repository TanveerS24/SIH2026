import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../.env' });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().transform((v) => parseInt(v, 10)).default('4000'),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.string().transform((v) => parseInt(v, 10)).default('9000'),
  MINIO_USE_SSL: z.string().transform((v) => v === 'true').default('false'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('evidence'),
  MINIO_REGION: z.string().default('us-east-1'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  TOTP_ISSUER: z.string().default('Pramaan_NCRB'),
  WEB_URL: z.string().default('http://localhost:8081'),
  CORS_ORIGIN: z.string().default('http://localhost:8081,http://localhost:19006,http://localhost:3000'),
  SIMULATE_MALWARE_SCAN: z.string().transform((v) => v === 'true').default('true'),
  SIMULATE_OCR_AI: z.string().transform((v) => v === 'true').default('true'),
  SIMULATE_LEDGER: z.string().transform((v) => v === 'true').default('true'),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Mandatory environment configuration missing or invalid.');
  }
  return result.data;
}

export const env = parseEnv();

import process from 'node:process';
import { env } from './config/index.js';
import { storageService } from './services/index.js';
import { buildApp } from './app.js';

export async function start(): Promise<void> {
  try {
    // Ensure storage buckets exist
    await storageService.initBuckets().catch((e: any) => {
      console.warn('Note on storage init (will retry on first upload):', e.message);
    });

    const server = await buildApp();
    await server.listen({ port: env.API_PORT, host: env.API_HOST });
    console.log(`\n======================================================`);
    console.log(`🛡️  PRAMAAN EVIDENCE & CUSTODY PLATFORM API STARTED`);
    console.log(`📡 URL: http://${env.API_HOST}:${env.API_PORT}`);
    console.log(`📄 DOCS: http://localhost:${env.API_PORT}/docs`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Fatal API startup error:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}


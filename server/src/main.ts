import { fileURLToPath } from 'node:url';
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

const isDirectRun =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === process.argv[1] ||
    process.argv[1].endsWith('main.ts') ||
    process.argv[1].endsWith('main.js'));

if (isDirectRun) {
  start();
}

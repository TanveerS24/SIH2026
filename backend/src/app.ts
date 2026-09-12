import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import crypto from 'crypto';

import { env, prisma } from './config/index.js';
import { storageService } from './services/index.js';
import { authPlugin } from './plugins/index.js';
import { registerAllRoutes } from './modules/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'error' : 'info',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            remoteAddress: req.ip,
          };
        },
      },
    },
    genReqId: () => `req-${crypto.randomBytes(6).toString('hex')}`,
    bodyLimit: 50 * 1024 * 1024, // 50MB for forensics/evidence uploads
  });

  // Security Headers
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return cb(null, true);
      }
      return cb(null, true); // Permissive in prototype for Expo web & mobile
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Rate Limiting on Auth
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Multipart uploads
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size
      files: 5,
    },
  });

  // Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Pramaan Digital Evidence & Chain-of-Custody API',
        description: 'Secure digital document ingestion, cryptographic SHA-256 integrity, and permissioned ledger platform for national crime records.',
        version: '1.0.0-PROTOTYPE',
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Auth Decorators and Plugins
  await app.register(authPlugin);

  // Health & Readiness Probes
  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'UP',
      system: 'Pramaan Evidence API',
      version: '1.0.0-PROTOTYPE',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', async (request, reply) => {
    try {
      // 1. Check PostgreSQL
      await prisma.$queryRaw`SELECT 1`;

      // 2. Check MinIO Object Store
      const storageReady = await storageService.checkHealth();

      return reply.status(200).send({
        status: 'READY',
        database: 'CONNECTED',
        objectStorage: storageReady ? 'HEALTHY' : 'SIMULATED/ACCESSIBLE',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      request.log.error('Readiness probe failed:', err);
      return reply.status(503).send({
        status: 'UNAVAILABLE',
        error: err.message,
      });
    }
  });

  // Register All Routes
  await registerAllRoutes(app);

  return app;
}

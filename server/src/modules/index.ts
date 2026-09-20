import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/index.js';
import { casesRoutes } from './cases/index.js';
import { documentsRoutes } from './documents/index.js';
import { custodyRoutes } from './custody/index.js';
import { workflowRoutes } from './workflow/index.js';
import { auditRoutes } from './audit/index.js';
import { searchRoutes } from './search/index.js';
import { analyticsRoutes } from './analytics/index.js';
import { accessRoutes } from './access/index.js';
import { syncRoutes } from './sync/index.js';
import { ragRoutes } from './ai/rag.routes.js';

export async function registerAllRoutes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(casesRoutes, { prefix: '/cases' });
  await app.register(documentsRoutes, { prefix: '/documents' });
  await app.register(custodyRoutes, { prefix: '/cases' });
  await app.register(workflowRoutes, { prefix: '/cases' });
  await app.register(auditRoutes, { prefix: '/audit' });
  await app.register(searchRoutes, { prefix: '/search' });
  await app.register(analyticsRoutes, { prefix: '/analytics' });
  await app.register(accessRoutes, { prefix: '/access-requests' });
  await app.register(syncRoutes, { prefix: '/sync' });
  await app.register(ragRoutes, { prefix: '/ai/rag' });
}

export * from './auth/index.js';
export * from './cases/index.js';
export * from './documents/index.js';
export * from './custody/index.js';
export * from './workflow/index.js';
export * from './audit/index.js';
export * from './search/index.js';
export * from './analytics/index.js';
export * from './access/index.js';
export * from './sync/index.js';

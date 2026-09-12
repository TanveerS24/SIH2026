import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  badgeNumber: string;
  department: string;
  jurisdiction: string;
  role: Role;
}

/**
 * Augment @fastify/jwt's FastifyJWT interface so that request.user
 * resolves to AuthenticatedUser everywhere, without re-declaring
 * FastifyRequest.user (which is owned by @fastify/jwt).
 */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthenticatedUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // jwtVerify populates request.user with the decoded payload
      await request.jwtVerify();
      const decoded = request.user as unknown as { id?: string };
      if (!decoded || !decoded.id) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or missing JWT token payload' });
      }

      // Fetch full user record from DB and replace the decoded JWT payload
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          badgeNumber: true,
          department: true,
          jurisdiction: true,
          role: true,
        },
      });

      if (!dbUser) {
        return reply.status(401).send({ error: 'Unauthorized', message: 'User record no longer exists or is inactive' });
      }

      // Override the JWT payload with the fully-typed DB user object
      (request as any).user = dbUser;
    } catch (err: any) {
      return reply.status(401).send({ error: 'Unauthorized', message: err.message || 'Authentication required' });
    }
  });
}

export default fp(authPlugin);

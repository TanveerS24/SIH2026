import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from '../../services/notification.service.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // 1. Get personal notifications for active user only
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    const result = await notificationService.getUserNotifications(user.id);
    return reply.status(200).send(result);
  });

  // 2. Mark specific notification as read
  fastify.patch('/:id/read', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = request.user;
    const { id } = request.params;
    await notificationService.markAsRead(id, user.id);
    return reply.status(200).send({ success: true });
  });

  // 3. Mark all notifications as read
  fastify.post('/mark-all-read', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    await notificationService.markAllAsRead(user.id);
    return reply.status(200).send({ success: true });
  });
}

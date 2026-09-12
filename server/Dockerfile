# Multi-stage Dockerfile for Pramaan Fastify API
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui/package.json ./packages/ui/
COPY backend/package.json ./backend/

RUN npm install --workspaces --include-workspace-root

# Build stage
FROM dependencies AS builder
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/ui ./packages/ui
COPY backend ./backend

WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=dependencies /app/backend/node_modules ./backend/node_modules

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/package.json

WORKDIR /app/backend
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/main.js"]

# Dockerfile for Pramaan Expo Web Client
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS dependencies
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui/package.json ./packages/ui/
COPY frontend/package.json ./frontend/

RUN npm install --workspaces --include-workspace-root

# Build / Run Stage
FROM dependencies AS runner
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/ui ./packages/ui
COPY frontend ./frontend

WORKDIR /app/frontend
EXPOSE 8081

CMD ["npm", "run", "web"]

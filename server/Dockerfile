FROM node:20-alpine

WORKDIR /app

# Install system dependencies for native modules and Prisma
RUN apk add --no-cache openssl libc6-compat python3 make g++

# 1. Setup shared types dependency
WORKDIR /app/shared
COPY shared/package.json shared/tsconfig.json ./
COPY shared/src ./src
RUN npm install

# 2. Setup server
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm install

# Copy Prisma schema and generate Prisma client
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy tsconfig and source code
COPY server/tsconfig.json ./
COPY server/src ./src

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx prisma/seed.ts && npx tsx src/main.ts"]

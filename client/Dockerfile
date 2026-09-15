# Dockerfile for Pramaan Expo Web Client
FROM node:20-alpine

WORKDIR /app

# Setup shared types dependency
WORKDIR /app/shared
COPY shared/package.json shared/tsconfig.json ./
COPY shared/src ./src
RUN npm install

# Setup client
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install

# Copy source code
COPY client/tsconfig.json client/app.json* client/babel.config.js* ./
COPY client/src ./src
COPY client/app ./app
COPY client/assets ./assets

EXPOSE 8081

CMD ["npm", "run", "web"]

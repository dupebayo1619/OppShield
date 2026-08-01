FROM node:20-slim AS base

# Install openssl (no symlink hack)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
RUN npm ci
COPY . .

# Generate Prisma client (will use binaryTargets from schema.prisma)
RUN npx prisma generate

# Production stage
FROM base AS production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 opsshield

# Copy node_modules and source code
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
COPY --from=build /app/public ./public

# Fix permissions for Prisma
RUN chown -R opsshield:nodejs /app/node_modules/@prisma

# Set environment variables for Prisma
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node
ENV PRISMA_SCHEMA_ENGINE_BINARY=/app/node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x

# Switch to non-root user
USER opsshield

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]

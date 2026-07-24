FROM node:20-slim AS base

# Install openssl and create symlinks for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/lib/x86_64-linux-gnu/libssl.so.3 /usr/lib/x86_64-linux-gnu/libssl.so.1.1 \
    && ln -s /usr/lib/x86_64-linux-gnu/libcrypto.so.3 /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
RUN npm ci
COPY . .

# Generate Prisma client
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

# ✅ COPY FRONTEND BUILD FILES
COPY --from=build /app/public ./public

# Fix permissions for Prisma
RUN chown -R opsshield:nodejs /app/node_modules/@prisma

# Set environment variable for Prisma
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node

# Switch to non-root user
USER opsshield

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]

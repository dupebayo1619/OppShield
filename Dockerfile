FROM node:20-slim AS base

# Install OpenSSL and create symlinks for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/lib/x86_64-linux-gnu/libssl.so.3 /usr/lib/x86_64-linux-gnu/libssl.so.1.1 \
    && ln -s /usr/lib/x86_64-linux-gnu/libcrypto.so.3 /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

FROM base AS build

RUN npm ci
COPY . .
RUN npx prisma generate

FROM base AS production
# Now inherits FROM base, so OpenSSL is already installed!

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 opsshield

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./

# Fix permissions for Prisma
RUN chown -R opsshield:nodejs /app/node_modules/@prisma

# Set Prisma engine path
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/@prisma/engines/libquery_engine-debian-openssl-3.0.x.so.node

USER opsshield

EXPOSE 3000

CMD ["node", "src/index.js"]

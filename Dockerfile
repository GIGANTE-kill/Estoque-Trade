FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ── Dependências ──────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install

# ── Build ─────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# URL de placeholder apenas para o prisma generate (não se conecta ao DB no build)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npx prisma generate
RUN npm run build

# ── Runner ────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Pasta de uploads persistida via volume
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI + schema para migrate deploy no startup
COPY --from=builder /app/node_modules/.bin/prisma        ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma             ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma            ./node_modules/@prisma
COPY --from=builder /app/node_modules/pg                 ./node_modules/pg
COPY --from=builder /app/node_modules/pg-cloudflare      ./node_modules/pg-cloudflare
COPY --from=builder /app/node_modules/pg-pool            ./node_modules/pg-pool
COPY --from=builder /app/node_modules/pg-protocol        ./node_modules/pg-protocol
COPY --from=builder /app/node_modules/pg-types           ./node_modules/pg-types
COPY --from=builder /app/prisma                          ./prisma
COPY --from=builder /app/prisma.config.ts                ./prisma.config.ts
COPY --from=builder /app/src/generated                   ./src/generated
# Seed JS (cria usuários padrão no primeiro boot)
COPY --from=builder /app/prisma/seed.js                  ./seed.js

# Script de entrada: migrate + start
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]

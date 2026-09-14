# ==============================================================================
# DOCKERFILE MULTI-STAGE: @ptdisagro/api (NestJS + Fastify + Prisma)
# ==============================================================================

# STAGE 1: Base & Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@10.30.3
RUN apk add --no-cache libc6-compat openssl

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

RUN pnpm install --frozen-lockfile

# STAGE 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10.30.3
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

# Compilar contratos y generar cliente Prisma
RUN pnpm --filter @ptdisagro/contracts build
RUN pnpm --filter @ptdisagro/api prisma:generate
RUN pnpm --filter @ptdisagro/api build

# STAGE 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@10.30.3
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts ./packages/contracts
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

USER nestjs

EXPOSE 4000

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]

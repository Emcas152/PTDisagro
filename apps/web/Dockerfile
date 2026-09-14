# ==============================================================================
# DOCKERFILE MULTI-STAGE: @ptdisagro/web (Next.js 14 + MUI + Tailwind)
# ==============================================================================

# STAGE 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@10.30.3
RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --ignore-scripts --frozen-lockfile

# STAGE 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10.30.3

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compilar iconos, contratos y luego el frontend
RUN pnpm --filter @ptdisagro/web build:icons
RUN pnpm --filter @ptdisagro/contracts build
RUN pnpm --filter @ptdisagro/web build

# STAGE 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contracts ./packages/contracts
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

USER nextjs

EXPOSE 3000

WORKDIR /app/apps/web
CMD ["npm", "start"]

#!/bin/sh
set -e

echo "🚀 [Disagro API] Iniciando contenedor..."

# Si DATABASE_URL está configurada, sincronizar esquema y sembrar datos iniciales
if [ -n "$DATABASE_URL" ]; then
  echo "📦 [Disagro API] Sincronizando esquema de base de datos PostgreSQL con Prisma..."
  npx prisma db push --skip-generate || echo "⚠️ Advertencia: No se pudo ejecutar prisma db push automáticamente"

  echo "🌱 [Disagro API] Verificando datos iniciales (Seed)..."
  npx tsx prisma/seed.ts || echo "⚠️ Advertencia: No se pudo ejecutar el seed automáticamente"
fi

echo "🟢 [Disagro API] Levantando servidor NestJS en puerto ${PORT:-4000}..."
exec node dist/main.js

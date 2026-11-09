#!/bin/sh
set -e

echo "⏳ Esperando que la base de datos PostgreSQL esté lista..."
npx prisma generate

echo "🚀 Sincronizando esquema de base de datos..."
npx prisma db push --accept-data-loss

echo "🌱 Verificando y sembrando datos iniciales..."
npm run prisma:seed || true

echo "✨ Iniciando servidor NestJS..."
exec "$@"

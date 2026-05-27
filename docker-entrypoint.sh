#!/bin/sh
set -e

# Extrai host e porta da DATABASE_URL para o healthcheck
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_PORT=${DB_PORT:-5432}

echo "→ Aguardando PostgreSQL em $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  sleep 1
done
echo "→ PostgreSQL disponível."

echo "→ Resolvendo migrations com falha (se houver)..."
PRISMA="node node_modules/prisma/build/index.js"
# Marca todas as migrations conhecidas como rolled-back (seguro: ignora erros)
$PRISMA migrate resolve --rolled-back 20240101000000_init              2>/dev/null || true
$PRISMA migrate resolve --rolled-back 20260521000000_init              2>/dev/null || true
$PRISMA migrate resolve --rolled-back 20260521000001_seed_data         2>/dev/null || true
$PRISMA migrate resolve --rolled-back 20260526000000_dynamic_marcadores 2>/dev/null || true

echo "→ Aplicando migrations..."
$PRISMA migrate deploy

echo "→ Rodando seed (upsert — seguro repetir)..."
node seed.js || echo "⚠️  Seed falhou, continuando..."

echo "→ Iniciando aplicação..."
exec node server.js

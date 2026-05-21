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

echo "→ Aplicando migrations..."
node_modules/.bin/prisma migrate deploy

echo "→ Iniciando aplicação..."
exec node server.js

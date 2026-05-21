#!/bin/sh
set -e

# Aplica migrations pendentes (cria tabelas se o banco for novo)
echo "→ Aplicando migrations do banco..."
node_modules/.bin/prisma migrate deploy

echo "→ Iniciando aplicação..."
exec node server.js

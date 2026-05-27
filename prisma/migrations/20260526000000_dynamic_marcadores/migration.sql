-- CreateTable: marcadores (dynamic labels with custom colors)
CREATE TABLE "marcadores" (
  "id"        TEXT        NOT NULL,
  "name"      TEXT        NOT NULL,
  "color"     TEXT        NOT NULL DEFAULT '#6366f1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marcadores_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "marcadores_name_key" UNIQUE ("name")
);

-- Seed the three default marcadores with stable IDs
INSERT INTO "marcadores" ("id", "name", "color") VALUES
  ('marcador_brinde',   'Brinde Normal',          '#8b5cf6'),
  ('marcador_trade',    'Ação de Trade',           '#3b82f6'),
  ('marcador_condicao', 'Condição para Compra',    '#f59e0b');

-- Add marcadorId FK column to solicitacoes
ALTER TABLE "solicitacoes" ADD COLUMN "marcadorId" TEXT;

-- Migrate existing enum values to FK references
UPDATE "solicitacoes" SET "marcadorId" = 'marcador_brinde'   WHERE "marcador"::TEXT = 'BRINDE_NORMAL';
UPDATE "solicitacoes" SET "marcadorId" = 'marcador_trade'    WHERE "marcador"::TEXT = 'ACAO_DE_TRADE';
UPDATE "solicitacoes" SET "marcadorId" = 'marcador_condicao' WHERE "marcador"::TEXT = 'CONDICAO_PARA_COMPRA';

-- Add foreign key constraint
ALTER TABLE "solicitacoes"
  ADD CONSTRAINT "solicitacoes_marcadorId_fkey"
  FOREIGN KEY ("marcadorId") REFERENCES "marcadores"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old enum column
ALTER TABLE "solicitacoes" DROP COLUMN IF EXISTS "marcador";

-- Drop enum type (safe: only after column is dropped)
DROP TYPE IF EXISTS "SolicitacaoMarcador";

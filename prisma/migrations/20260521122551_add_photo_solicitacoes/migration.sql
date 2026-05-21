-- AlterTable
ALTER TABLE "documents" ADD COLUMN "signedDocUrl" TEXT;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "solicitacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "justificativa" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "aprovadorId" TEXT,
    "aprovadoEm" DATETIME,
    "movementId" TEXT,
    "signedDocUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "solicitacoes_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitacoes_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitacoes_aprovadorId_fkey" FOREIGN KEY ("aprovadorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

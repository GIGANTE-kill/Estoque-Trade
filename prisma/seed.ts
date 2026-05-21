// ============================================================
// AÇÃO TRADE ESTOQUE — Seed do Banco de Dados
// Popula o SQLite com dados iniciais realistas para teste
// ============================================================
import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient, Role, MatStatus, MoveType, DocStatus, SolicitacaoStatus } from "../src/generated/prisma/index.js";
import path from "path";
import crypto from "crypto";

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(password + salt).digest("hex");
  return { hash, salt };
}

const dbPath = path.resolve(process.cwd(), "dev.db").replace(/\\/g, "/");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // ─── Limpar dados existentes (ordem respeitando FK) ───
  await prisma.solicitacao.deleteMany();
  await prisma.document.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.material.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ─── Usuários ───────────────────────────────────────────
  console.log("👤 Criando usuários...");
  const adminPwd = hashPassword("admin123");
  const userPwd = hashPassword("usuario123");

  const [admin, gestor, op1, op2] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Administrador",
        email: "admin@admin.com",
        role: Role.ADMINISTRADOR,
        passwordHash: adminPwd.hash,
        passwordSalt: adminPwd.salt,
      },
    }),
    prisma.user.create({
      data: {
        name: "Marcos Costa",
        email: "marcos@acaotrade.com.br",
        role: Role.GESTOR,
        passwordHash: userPwd.hash,
        passwordSalt: userPwd.salt,
      },
    }),
    prisma.user.create({
      data: {
        name: "Ana Paula Silva",
        email: "ana.paula@acaotrade.com.br",
        role: Role.OPERADOR,
        passwordHash: userPwd.hash,
        passwordSalt: userPwd.salt,
      },
    }),
    prisma.user.create({
      data: {
        name: "Juliana Ferreira",
        email: "juliana@acaotrade.com.br",
        role: Role.OPERADOR,
        passwordHash: userPwd.hash,
        passwordSalt: userPwd.salt,
      },
    }),
  ]);

  // ─── Categorias ─────────────────────────────────────────
  console.log("🗂️  Criando categorias...");
  const [catDisplay, catPDV, catImpresso, catIluminacao] = await Promise.all([
    prisma.category.create({ data: { name: "Display" } }),
    prisma.category.create({ data: { name: "PDV" } }),
    prisma.category.create({ data: { name: "Impresso" } }),
    prisma.category.create({ data: { name: "Iluminação" } }),
  ]);

  // ─── Materiais ──────────────────────────────────────────
  console.log("📦 Criando materiais de estoque...");
  const materials = await Promise.all([
    prisma.material.create({
      data: {
        name: "Banner Retratil 60x180",
        sku: "BAN-RET-001",
        categoryId: catDisplay.id,
        quantity: 45,
        entryDate: new Date("2026-03-29"),
        status: MatStatus.DISPONIVEL,
      },
    }),
    prisma.material.create({
      data: {
        name: "Wobbler A5 Dupla Face",
        sku: "WOB-A5-001",
        categoryId: catPDV.id,
        quantity: 320,
        entryDate: new Date("2026-05-08"),
        status: MatStatus.DISPONIVEL,
      },
    }),
    prisma.material.create({
      data: {
        name: "Totem de Chão Papelão",
        sku: "TOT-PAP-001",
        categoryId: catDisplay.id,
        quantity: 18,
        entryDate: new Date("2026-04-12"),
        status: MatStatus.RESERVADO,
      },
    }),
    prisma.material.create({
      data: {
        name: "Faixa de Gôndola 90cm",
        sku: "FAI-GON-090",
        categoryId: catPDV.id,
        quantity: 0,
        entryDate: new Date("2026-03-16"),
        status: MatStatus.ESGOTADO,
      },
    }),
    prisma.material.create({
      data: {
        name: "Tablóide A4 Couchê 90g",
        sku: "TAB-A4-001",
        categoryId: catImpresso.id,
        quantity: 2800,
        entryDate: new Date("2026-05-15"),
        status: MatStatus.DISPONIVEL,
      },
    }),
    prisma.material.create({
      data: {
        name: "Stopper de Prateleira",
        sku: "STO-PRA-001",
        categoryId: catPDV.id,
        quantity: 150,
        entryDate: new Date("2026-04-06"),
        status: MatStatus.DISPONIVEL,
      },
    }),
    prisma.material.create({
      data: {
        name: "Kit Display Checkout",
        sku: "KIT-CHK-001",
        categoryId: catDisplay.id,
        quantity: 22,
        entryDate: new Date("2026-05-01"),
        status: MatStatus.DISPONIVEL,
      },
    }),
    prisma.material.create({
      data: {
        name: "Régua de Prateleira LED",
        sku: "REG-LED-001",
        categoryId: catIluminacao.id,
        quantity: 8,
        entryDate: new Date("2026-02-18"),
        status: MatStatus.RESERVADO,
      },
    }),
  ]);

  const [banner, wobbler, totem, , tabloide, stopper, kitDisplay] = materials;

  // ─── Movimentações e Documentos ─────────────────────────
  console.log("🔄 Criando movimentações e documentos...");

  const mov1 = await prisma.movement.create({
    data: {
      type: MoveType.ENTRADA,
      quantity: 3000,
      materialId: tabloide.id,
      userId: gestor.id,
      notes: "Reposição mensal de tablóides",
    },
  });
  await prisma.document.create({
    data: {
      movementId: mov1.id,
      status: DocStatus.ASSINADO,
      signedBy: "Marcos Costa",
      signedAt: new Date(),
    },
  });

  const mov2 = await prisma.movement.create({
    data: {
      type: MoveType.SAIDA,
      quantity: 10,
      materialId: banner.id,
      userId: op1.id,
      notes: "Campanha PDV Maio — Filial Centro",
    },
  });
  await prisma.document.create({
    data: {
      movementId: mov2.id,
      status: DocStatus.ASSINADO,
      signedBy: "Ana Paula Silva",
      signedAt: new Date(),
    },
  });

  const mov3 = await prisma.movement.create({
    data: {
      type: MoveType.SAIDA,
      quantity: 50,
      materialId: wobbler.id,
      userId: op2.id,
      notes: "Distribuição para promotoras",
    },
  });
  await prisma.document.create({
    data: { movementId: mov3.id, status: DocStatus.AGUARDANDO },
  });

  const mov4 = await prisma.movement.create({
    data: {
      type: MoveType.SAIDA,
      quantity: 5,
      materialId: totem.id,
      userId: admin.id,
      notes: "Evento institucional ABBC",
    },
  });
  await prisma.document.create({
    data: { movementId: mov4.id, status: DocStatus.AGUARDANDO },
  });

  const mov5 = await prisma.movement.create({
    data: {
      type: MoveType.ENTRADA,
      quantity: 200,
      materialId: stopper.id,
      userId: admin.id,
    },
  });
  await prisma.document.create({
    data: {
      movementId: mov5.id,
      status: DocStatus.ASSINADO,
      signedBy: "Carlos Administrador",
      signedAt: new Date(),
    },
  });

  const mov6 = await prisma.movement.create({
    data: {
      type: MoveType.SAIDA,
      quantity: 8,
      materialId: kitDisplay.id,
      userId: op2.id,
      notes: "Campanha Checkout Verão",
    },
  });
  await prisma.document.create({
    data: {
      movementId: mov6.id,
      status: DocStatus.ASSINADO,
      signedBy: "Juliana Ferreira",
      signedAt: new Date(),
    },
  });

  // ─── Solicitações de saída ──────────────────────────────
  console.log("📋 Criando solicitações...");
  await Promise.all([
    prisma.solicitacao.create({
      data: {
        materialId: banner.id,
        solicitanteId: op1.id,
        quantity: 5,
        justificativa: "Campanha Natal PDV Carrefour Vila Maria",
        status: SolicitacaoStatus.PENDENTE,
      },
    }),
    prisma.solicitacao.create({
      data: {
        materialId: wobbler.id,
        solicitanteId: op2.id,
        quantity: 30,
        justificativa: "Distribuição para promotoras — Região Sul SP",
        status: SolicitacaoStatus.PENDENTE,
      },
    }),
    prisma.solicitacao.create({
      data: {
        materialId: tabloide.id,
        solicitanteId: op1.id,
        quantity: 500,
        justificativa: "Ação semanal Pão de Açúcar",
        status: SolicitacaoStatus.APROVADA,
        aprovadorId: admin.id,
        aprovadoEm: new Date(),
      },
    }),
  ]);

  console.log("\n✅ Seed concluído com sucesso!");
  console.log(`   👤 Usuários criados: 4`);
  console.log(`   🗂️  Categorias criadas: 4`);
  console.log(`   📦 Materiais criados: ${materials.length}`);
  console.log(`   🔄 Movimentações criadas: 6`);
  console.log(`   📄 Documentos criados: 6`);
  console.log(`   📋 Solicitações criadas: 3`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro no seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

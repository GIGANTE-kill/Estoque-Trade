export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}

// GET — lista todas as localizações
export async function GET() {
  try {
    const localizacoes = await prisma.localizacao.findMany({
      include: {
        _count: { select: { materials: true } },
      },
    });

    localizacoes.sort((a, b) =>
      naturalCompare(a.rua, b.rua) ||
      naturalCompare(a.predio, b.predio) ||
      naturalCompare(a.andar, b.andar) ||
      naturalCompare(a.apartamento, b.apartamento)
    );

    return NextResponse.json(localizacoes);
  } catch (error: any) {
    console.error("Localizacoes load error:", error);
    return NextResponse.json({ error: "Falha ao carregar localizações" }, { status: 500 });
  }
}

// POST — cria nova localização
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rua, predio, andar, apartamento } = body;

    if (!rua || !predio || !andar || !apartamento) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios: Rua, Prédio, Andar, Apartamento" },
        { status: 400 }
      );
    }

    const localizacao = await prisma.localizacao.create({
      data: { rua, predio, andar, apartamento },
    });

    return NextResponse.json(localizacao, { status: 201 });
  } catch (error: any) {
    console.error("Localizacao create error:", error);
    return NextResponse.json({ error: error.message || "Falha ao criar localização" }, { status: 500 });
  }
}

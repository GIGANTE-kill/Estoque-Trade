export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;

    const materials = await prisma.material.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
        localizacao: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const now = new Date();
    const formattedMaterials = materials.map((m) => {
      const entryDateObj = new Date(m.entryDate);
      const diffTime = Math.abs(now.getTime() - entryDateObj.getTime());
      const daysInStock = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: m.id,
        name: m.name,
        sku: m.sku || "-",
        category: m.category.name,
        categoryId: m.categoryId,
        quantity: m.quantity,
        photoUrl: m.photoUrl || null,
        entryDate: entryDateObj.toLocaleDateString("pt-BR"),
        daysInStock,
        status: m.status,
        fornecedor: m.fornecedor || null,
        nomeAcao: m.nomeAcao || null,
        periodoAcaoInicio: m.periodoAcaoInicio ? m.periodoAcaoInicio.toISOString().split("T")[0] : null,
        periodoAcaoFim: m.periodoAcaoFim ? m.periodoAcaoFim.toISOString().split("T")[0] : null,
        localizacaoId: m.localizacaoId || null,
        localizacao: m.localizacao
          ? {
              id: m.localizacao.id,
              rua: m.localizacao.rua,
              predio: m.localizacao.predio,
              andar: m.localizacao.andar,
              apartamento: m.localizacao.apartamento,
            }
          : null,
      };
    });

    return NextResponse.json(formattedMaterials);
  } catch (error: any) {
    console.error("Materials load error:", error);
    return NextResponse.json({ error: "Failed to load materials" }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, sku, categoryName, quantity, entryDate,
      status, fornecedor, nomeAcao, periodoAcaoInicio,
      periodoAcaoFim, photoUrl, localizacaoId,
    } = body;

    if (!name || !categoryName) {
      return NextResponse.json({ error: "Nome e Categoria são obrigatórios" }, { status: 400 });
    }

    // 1. Find or create the category
    let category = await prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName },
      });
    }

    // 2. Create the material
    const newMaterial = await prisma.material.create({
      data: {
        name,
        sku: sku || null,
        categoryId: category.id,
        quantity: parseInt(quantity) || 0,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        status: status || "DISPONIVEL",
        fornecedor: fornecedor || null,
        nomeAcao: nomeAcao || null,
        periodoAcaoInicio: periodoAcaoInicio ? new Date(periodoAcaoInicio) : null,
        periodoAcaoFim: periodoAcaoFim ? new Date(periodoAcaoFim) : null,
        photoUrl: photoUrl || null,
        localizacaoId: localizacaoId || null,
      },
      include: {
        category: true,
        localizacao: true,
      },
    });

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error: any) {
    console.error("Material creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create material" }, { status: 500 });
  }
}

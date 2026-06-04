import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const STOCK_EDIT_EMAIL = "trademarketing@gruposaoroque.com";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== STOCK_EDIT_EMAIL) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const quantity = parseInt(body.quantity, 10);

    if (isNaN(quantity) || quantity < 0) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
    }

    let status = body.status as string | undefined;
    if (!status) {
      status = quantity === 0 ? "ESGOTADO" : "DISPONIVEL";
    }

    const updated = await prisma.material.update({
      where: { id },
      data: { quantity, status: status as any },
      include: { category: true, localizacao: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Material patch error:", error);
    return NextResponse.json({ error: error.message || "Falha ao atualizar estoque" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verifica se é admin
    const cookieStore = await cookies();
    const userId = cookieStore.get("session")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "ADMINISTRADOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;

    // Exclui movimentos e documentos vinculados antes de excluir o material
    const movements = await prisma.movement.findMany({ where: { materialId: id }, select: { id: true } });
    const movementIds = movements.map((m) => m.id);

    if (movementIds.length > 0) {
      await prisma.document.deleteMany({ where: { movementId: { in: movementIds } } });
      await prisma.movement.deleteMany({ where: { materialId: id } });
    }

    await prisma.solicitacao.deleteMany({ where: { materialId: id } });
    await prisma.material.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Material delete error:", error);
    return NextResponse.json({ error: error.message || "Falha ao excluir material" }, { status: 500 });
  }
}

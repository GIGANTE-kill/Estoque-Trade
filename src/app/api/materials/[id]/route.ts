import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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

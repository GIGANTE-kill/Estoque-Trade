export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pendingDocs = await prisma.document.findMany({
      where: { status: "AGUARDANDO" },
      include: {
        movement: {
          include: {
            material: true,
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const notifications = pendingDocs.map((doc) => ({
      id: doc.id,
      material: doc.movement.material.name,
      quantity: doc.movement.quantity,
      operator: doc.movement.user.name,
      createdAt: doc.createdAt.toISOString(),
      movementId: doc.movement.id,
    }));

    return NextResponse.json({ notifications, total: notifications.length });
  } catch (error: any) {
    console.error("Notifications load error:", error);
    return NextResponse.json(
      { error: "Falha ao carregar notificações" },
      { status: 500 }
    );
  }
}

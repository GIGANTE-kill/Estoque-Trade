import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Total items in stock (sum of quantity of all materials)
    const materials = await prisma.material.findMany();
    const totalItems = materials.reduce((acc, m) => acc + m.quantity, 0);

    // 2. Monthly movements (entries/exits in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyMovements = await prisma.movement.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // 3. Average days in stock
    const now = new Date();
    let totalDays = 0;
    let countWithEntryDate = 0;
    for (const m of materials) {
      if (m.entryDate) {
        const diffTime = Math.abs(now.getTime() - new Date(m.entryDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        countWithEntryDate++;
      }
    }
    const avgDaysInStock = countWithEntryDate > 0 ? Math.round(totalDays / countWithEntryDate) : 0;

    // 4. Pending signatures
    const pendingSignatures = await prisma.document.count({
      where: {
        status: "AGUARDANDO",
      },
    });

    // 5. Weekly entries vs exits (last 7 days grouped by day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMovements = await prisma.movement.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format weekly chart data
    const chartMap = new Map<string, { name: string; entradas: number; saidas: number }>();
    // Pre-fill last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      chartMap.set(label, { name: label.toUpperCase(), entradas: 0, saidas: 0 });
    }

    for (const move of recentMovements) {
      const label = new Date(move.createdAt)
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "");
      if (chartMap.has(label)) {
        const current = chartMap.get(label)!;
        if (move.type === "ENTRADA") {
          current.entradas += move.quantity;
        } else {
          current.saidas += move.quantity;
        }
      }
    }

    const chartData = Array.from(chartMap.values());

    return NextResponse.json({
      totalItems,
      monthlyMovements,
      avgDaysInStock,
      pendingSignatures,
      chartData,
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message || "Failed to load dashboard statistics" }, { status: 500 });
  }
}

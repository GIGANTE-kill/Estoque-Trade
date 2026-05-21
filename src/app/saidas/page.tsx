"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MovementsTable } from "@/components/dashboard/MovementsTable";
import { SaidaModal } from "@/components/dashboard/SaidaModal";
import { Button } from "@/components/ui/button";
import { LogOut, Download } from "lucide-react";

export default function SaidasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <AppShell>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm px-6">
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">
              Histórico de Saídas
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Registros de saída e documentos assinados</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-sm border-slate-200 text-slate-600 rounded-xl hover:border-slate-300"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="h-9 gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-200"
            >
              <LogOut className="h-4 w-4" />
              Nova Saída Direta
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          <section aria-label="Histórico de saídas de materiais">
            <MovementsTable type="SAIDA" refreshTrigger={refreshTrigger} />
          </section>
        </div>
      </div>

      <SaidaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshTrigger((p) => p + 1)}
      />
    </AppShell>
  );
}

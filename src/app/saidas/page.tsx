"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Clock, Loader2, RefreshCw,
  Trash2, FileText, AlertCircle, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { SaidaModal } from "@/components/dashboard/SaidaModal";
import Image from "next/image";

interface Saida {
  id: string;
  material: string;
  materialId: string;
  materialPhotoUrl: string | null;
  estoqueAtual: number;
  solicitante: string;
  solicitanteId: string;
  quantity: number;
  justificativa: string;
  status: "APROVADA";
  aprovador: string | null;
  aprovadoEm: string | null;
  signedDocUrl: string | null;
  notes: string | null;
  createdAt: string;
  createdAtRaw: string;
  fornecedor: string | null;
  nomeAcao: string | null;
}

function SaidaCard({
  saida,
  onRefresh,
  currentUserRole,
}: {
  saida: Saida;
  onRefresh: () => void;
  currentUserRole: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm("Excluir este registro de saída permanentemente?")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/solicitacoes/${saida.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao excluir registro.");
      }
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function handleGerarPDF() {
    const html = `
      <html><head><title>Termo de Saída</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .sub { font-size: 12px; color: #666; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        td, th { border: 1px solid #ddd; padding: 8px 12px; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; text-align: left; }
        .linha { border-top: 1px solid #333; width: 260px; margin-top: 56px; padding-top: 6px; font-size: 12px; }
      </style></head><body>
      <h1>TERMO DE RESPONSABILIDADE DE SAÍDA</h1>
      <div class="sub">CD São Roque / Promotoria — Ação Trade Estoque</div>
      <table>
        <tr><th>Campo</th><th>Valor</th></tr>
        <tr><td>Material</td><td>${saida.material}</td></tr>
        ${saida.fornecedor ? `<tr><td>Fornecedor</td><td>${saida.fornecedor}</td></tr>` : ""}
        ${saida.nomeAcao ? `<tr><td>Ação</td><td>${saida.nomeAcao}</td></tr>` : ""}
        <tr><td>Quantidade</td><td>${saida.quantity} un.</td></tr>
        <tr><td>Solicitante</td><td>${saida.solicitante}</td></tr>
        <tr><td>Justificativa</td><td>${saida.justificativa}</td></tr>
        <tr><td>Data da Solicitação</td><td>${saida.createdAt}</td></tr>
        <tr><td>Aprovado por</td><td>${saida.aprovador ?? "-"}</td></tr>
        <tr><td>Aprovado em</td><td>${saida.aprovadoEm ?? "-"}</td></tr>
        <tr><td>Nº Registro</td><td>${saida.id}</td></tr>
      </table>
      <p style="font-size:13px">
        Declaro que recebi os materiais acima listados e me responsabilizo pela guarda,
        uso adequado e devolução ou comprovação de utilização conforme as normas da empresa.
      </p>
      <div class="linha">${saida.solicitante}</div>
      <div class="linha">Assinatura</div>
      </body></html>
    `;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
            {saida.materialPhotoUrl ? (
              <Image src={saida.materialPhotoUrl} alt={saida.material} width={48} height={48} className="object-cover w-full h-full" />
            ) : (
              <span className="text-[10px] text-slate-400 font-medium text-center px-1 leading-tight">
                {saida.material.substring(0, 3).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{saida.material}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Solicitado por <span className="font-medium text-slate-600">{saida.solicitante}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="border text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700 border-emerald-100">
            Aprovada
          </Badge>
          {currentUserRole === "ADMINISTRADOR" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Excluir registro (somente admin)"
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Fornecedor / Ação */}
      {(saida.fornecedor || saida.nomeAcao) && (
        <div className="grid grid-cols-2 gap-3">
          {saida.fornecedor && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Fornecedor</p>
              <p className="text-xs font-semibold text-slate-800 truncate">{saida.fornecedor}</p>
            </div>
          )}
          {saida.nomeAcao && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Ação</p>
              <p className="text-xs font-semibold text-slate-800 truncate">{saida.nomeAcao}</p>
            </div>
          )}
        </div>
      )}

      {/* Qtd + Estoque */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Qtd. Retirada</p>
          <p className="text-base font-bold text-slate-900">{saida.quantity} <span className="text-xs font-normal text-slate-400">un.</span></p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Estoque Atual</p>
          <p className="text-base font-bold text-slate-900">{saida.estoqueAtual} <span className="text-xs font-normal text-slate-400">un.</span></p>
        </div>
      </div>

      {/* Justificativa */}
      <div className="bg-slate-50 rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Justificativa</p>
        <p className="text-xs text-slate-700 leading-relaxed">{saida.justificativa}</p>
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <Clock className="h-3 w-3" />
        <span>Solicitado em {saida.createdAt}</span>
        {saida.aprovadoEm && (
          <><span>·</span><span>Aprovado em {saida.aprovadoEm}</span></>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Documento assinado + ações */}
      <div className="pt-1 border-t border-slate-100 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Documento Assinado</p>
          {saida.signedDocUrl ? (
            <div className="relative h-28 rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50">
              <Image src={saida.signedDocUrl} alt="Doc assinado" fill className="object-cover" />
              <div className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Assinado
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic">Documento não anexado.</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400 italic">
            Aprovado por <span className="font-medium text-slate-500">{saida.aprovador ?? "Administrador"}</span>
          </p>
          <Button
            onClick={handleGerarPDF}
            variant="outline"
            size="sm"
            className="h-7 rounded-xl text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            Termo PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SaidasPage() {
  const { user } = useAuth();
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/solicitacoes?status=APROVADA")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSaidas(data as Saida[]); })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <AppShell>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-sm px-6">
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Histórico de Saídas</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Somente saídas aprovadas — {saidas.length} registro{saidas.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="h-9 gap-2 text-sm border-slate-200 text-slate-600 rounded-xl hover:border-slate-300"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            {(user?.role === "ADMINISTRADOR" || user?.role === "GESTOR") && (
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-9 gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-200"
              >
                <LogOut className="h-4 w-4" />
                Nova Saída Direta
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 p-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-72 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : saidas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-slate-400">
              <CheckCircle2 className="h-10 w-10 mb-3 text-slate-200" />
              <p className="text-sm font-medium">Nenhuma saída aprovada registrada</p>
              <p className="text-xs mt-1">As saídas aprovadas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {saidas.map((s) => (
                <SaidaCard
                  key={s.id}
                  saida={s}
                  onRefresh={() => setRefreshKey((k) => k + 1)}
                  currentUserRole={user?.role ?? ""}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <SaidaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </AppShell>
  );
}

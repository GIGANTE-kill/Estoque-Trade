"use client";

import { useState, useEffect, useRef } from "react";
import { X, AlertCircle, Send, CheckCircle2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

interface SolicitacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMaterial?: { id: string; name: string; quantity: number };
  onSuccess?: () => void;
}

export function SolicitacaoModal({
  isOpen,
  onClose,
  preselectedMaterial,
  onSuccess,
}: SolicitacaoModalProps) {
  const { user, loading: authLoading } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // busca de material
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMat, setSelectedMat] = useState<{ id: string; name: string; quantity: number; fornecedor?: string | null; nomeAcao?: string | null } | null>(
    preselectedMaterial ?? null
  );
  const searchRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [justificativa, setJustificativa] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingMaterials(true);
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) setMaterials(data);
      })
      .finally(() => setLoadingMaterials(false));
  }, [isOpen]);

  useEffect(() => {
    if (preselectedMaterial) {
      setSelectedMat(preselectedMaterial);
      setSearch(preselectedMaterial.name);
    }
  }, [preselectedMaterial]);

  // fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isOpen) return null;

  function reset() {
    setQuantity(1);
    setJustificativa("");
    setError("");
    setDone(false);
    setSearch("");
    setSelectedMat(preselectedMaterial ?? null);
  }

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectMaterial(m: any) {
    setSelectedMat({ id: m.id, name: m.name, quantity: m.quantity, fornecedor: m.fornecedor, nomeAcao: m.nomeAcao });
    setSearch(m.name);
    setDropdownOpen(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMat) { setError("Selecione um material."); return; }
    if (quantity <= 0) { setError("Quantidade deve ser maior que zero."); return; }
    if (!justificativa.trim()) { setError("Justificativa é obrigatória."); return; }
    if (!user) { setError("Sessão expirada. Faça login novamente."); return; }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selectedMat.id,
          solicitanteId: user.id,
          quantity,
          justificativa,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar solicitação.");
      }

      setDone(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              Solicitar Saída de Material
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sua solicitação será enviada para aprovação do administrador.
            </p>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── CONFIRMAÇÃO ── */}
        {done ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Solicitação enviada!</p>
                <p className="text-xs text-blue-600 mt-1">
                  Sua solicitação de <strong>{quantity} un.</strong> de{" "}
                  <strong>{selectedMat?.name}</strong> foi registrada e aguarda aprovação
                  do administrador.
                </p>
              </div>
            </div>
            <Button
              onClick={() => { reset(); onClose(); }}
              className="w-full h-9 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fechar
            </Button>
          </div>
        ) : (
          /* ── FORMULÁRIO ── */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">

            {/* Solicitante */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Solicitante
              </label>
              <div className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-700 flex items-center gap-2">
                {authLoading ? (
                  <span className="text-slate-400">Carregando...</span>
                ) : user ? (
                  <>
                    <span className="font-semibold text-slate-800">{user.name}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{user.email}</span>
                  </>
                ) : (
                  <span className="text-red-400 text-[10px]">Sessão não encontrada — faça login novamente</span>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Material com busca */}
            <div className="space-y-1.5" ref={searchRef}>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Material <span className="text-red-400">*</span>
              </label>
              {loadingMaterials ? (
                <div className="h-10 bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelectedMat(null);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="Digite para buscar um material..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  {dropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {filteredMaterials.length === 0 ? (
                        <p className="p-3 text-xs text-slate-400 text-center">Nenhum material encontrado</p>
                      ) : (
                        filteredMaterials.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            disabled={m.quantity === 0}
                            onMouseDown={() => selectMaterial(m)}
                            className="w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate">{m.name}</p>
                              {(m.fornecedor || m.nomeAcao) && (
                                <p className="text-[10px] text-slate-400 truncate">
                                  {[m.fornecedor, m.nomeAcao].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                            <span className={`shrink-0 text-[10px] font-semibold ${m.quantity === 0 ? "text-red-400" : "text-slate-400"}`}>
                              {m.quantity === 0 ? "Esgotado" : `${m.quantity} un.`}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {selectedMat && selectedMat.quantity > 0 && (
                <div className="text-[10px] text-emerald-600 font-medium space-y-0.5">
                  <p>✓ {selectedMat.name} — {selectedMat.quantity} un. disponíveis</p>
                  {(selectedMat.fornecedor || selectedMat.nomeAcao) && (
                    <p className="text-slate-400">
                      {[selectedMat.fornecedor, selectedMat.nomeAcao].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              )}
              {selectedMat && selectedMat.quantity === 0 && (
                <p className="text-[10px] text-red-500">Material esgotado</p>
              )}
            </div>

            {/* Quantidade */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Quantidade Solicitada <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedMat?.quantity ?? undefined}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Justificativa */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Justificativa <span className="text-red-400">*</span>
              </label>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={3}
                placeholder="Ex: Material para ação de Natal — PDV Carrefour SP"
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                required
              />
            </div>

            {/* Info RBAC */}
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Esta solicitação precisa ser <strong>aprovada por um administrador</strong> antes
                que o material seja baixado do estoque.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => { reset(); onClose(); }}
                disabled={submitting}
                className="h-9 px-4 rounded-xl text-xs border-slate-200 text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || !selectedMat || selectedMat.quantity === 0 || !user}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-100 flex items-center gap-1.5"
              >
                {submitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="h-3.5 w-3.5" /> Enviar Solicitação</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

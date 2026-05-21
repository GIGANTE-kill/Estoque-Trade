"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, AlertCircle, LogOut, FileText, Upload, CheckCircle2, Loader2, ImagePlus, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/upload-helper";
import { useAuth } from "@/lib/AuthContext";
import Image from "next/image";

interface SaidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMaterial?: { id: string; name: string; quantity: number };
  onSuccess?: () => void;
}

type Step = "form" | "success";

interface MovementResult {
  id: string;
  documentId?: string;
  materialName: string;
  quantity: number;
  date: string;
}

export function SaidaModal({ isOpen, onClose, preselectedMaterial, onSuccess }: SaidaModalProps) {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  const [search, setSearch] = useState(preselectedMaterial?.name ?? "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMat, setSelectedMat] = useState<any | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [justificativa, setJustificativa] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState<MovementResult | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docSaved, setDocSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingMaterials(true);
    fetch("/api/materials")
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setMaterials(data);
          if (preselectedMaterial) {
            const mat = data.find((m) => m.id === preselectedMaterial.id);
            if (mat) { setSelectedMat(mat); setSearch(mat.name); }
          }
        }
      })
      .finally(() => setLoadingMaterials(false));
  }, [isOpen, preselectedMaterial]);

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
    setStep("form");
    setSearch("");
    setSelectedMat(null);
    setQuantity(1);
    setJustificativa("");
    setError("");
    setResult(null);
    setDocFile(null);
    setDocPreview(null);
    setDocSaved(false);
    setDropdownOpen(false);
  }

  function selectMaterial(m: any) {
    setSelectedMat(m);
    setSearch(m.name);
    setDropdownOpen(false);
  }

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocPreview(URL.createObjectURL(file));
  }

  function handleGerarPDF() {
    if (!result) return;
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
        <tr><td>Solicitante</td><td>${user?.name ?? "—"}</td></tr>
        <tr><td>Material</td><td>${result.materialName}</td></tr>
        ${selectedMat?.fornecedor ? `<tr><td>Fornecedor</td><td>${selectedMat.fornecedor}</td></tr>` : ""}
        ${selectedMat?.nomeAcao ? `<tr><td>Ação</td><td>${selectedMat.nomeAcao}</td></tr>` : ""}
        <tr><td>Quantidade</td><td>${result.quantity} un.</td></tr>
        <tr><td>Justificativa</td><td>${justificativa}</td></tr>
        <tr><td>Data/Hora</td><td>${result.date}</td></tr>
        <tr><td>Nº Movimento</td><td>${result.id}</td></tr>
      </table>
      <p style="font-size:13px">
        Declaro que recebi os materiais acima listados e me responsabilizo pela guarda,
        uso adequado e devolução ou comprovação de utilização conforme as normas da empresa.
      </p>
      <div class="linha">${user?.name ?? ""}</div>
      <div class="linha">Assinatura</div>
      </body></html>
    `;
    const win = window.open("", "_blank");
    if (win) { win.document.open(); win.document.write(html); win.document.close(); win.print(); }
  }

  async function handleUploadDoc() {
    if (!docFile || !result?.documentId) return;
    setUploadingDoc(true);
    setError("");
    try {
      const url = await uploadFile(docFile, "docassinado");
      await fetch(`/api/documents/${result.documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedDocUrl: url, signedBy: user?.name, status: "ASSINADO" }),
      });
      setDocSaved(true);
    } catch (err: any) {
      setError(err.message || "Falha ao salvar documento assinado.");
    } finally {
      setUploadingDoc(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMat) { setError("Selecione um material."); return; }
    if (quantity <= 0) { setError("Quantidade deve ser maior que zero."); return; }
    if (!justificativa.trim()) { setError("Justificativa é obrigatória."); return; }
    if (!user) { setError("Sessão expirada. Faça login novamente."); return; }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selectedMat.id,
          type: "SAIDA",
          quantity,
          notes: justificativa,
          userId: user.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao registrar saída.");
      }

      const movement = await res.json();
      setResult({
        id: movement.id,
        documentId: movement.documentId ?? undefined,
        materialName: selectedMat.name,
        quantity,
        date: new Date().toLocaleString("pt-BR"),
      });

      setStep("success");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <LogOut className="h-4 w-4 text-blue-600" />
              {step === "form" ? "Registrar Saída" : "Saída Registrada"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === "form"
                ? "Registre a saída e gere o termo de responsabilidade."
                : "Gere o PDF e faça upload do documento assinado."}
            </p>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── FORM ── */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

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
                    onChange={(e) => { setSearch(e.target.value); setSelectedMat(null); setDropdownOpen(true); }}
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
              {selectedMat && (
                <div className="text-[10px] space-y-0.5">
                  <p className="text-emerald-600 font-medium">✓ {selectedMat.name} — {selectedMat.quantity} un. disponíveis</p>
                  {(selectedMat.fornecedor || selectedMat.nomeAcao) && (
                    <p className="text-slate-400">{[selectedMat.fornecedor, selectedMat.nomeAcao].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              )}
            </div>

            {/* Fornecedor e Ação (read-only, do material selecionado) */}
            {selectedMat && (selectedMat.fornecedor || selectedMat.nomeAcao) && (
              <div className="grid grid-cols-2 gap-3">
                {selectedMat.fornecedor && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fornecedor</label>
                    <div className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-700 flex items-center font-medium">
                      {selectedMat.fornecedor}
                    </div>
                  </div>
                )}
                {selectedMat.nomeAcao && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ação</label>
                    <div className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-700 flex items-center font-medium">
                      {selectedMat.nomeAcao}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantidade */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Quantidade <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedMat?.quantity ?? undefined}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
              {selectedMat && selectedMat.quantity < 10 && selectedMat.quantity > 0 && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Estoque baixo: apenas {selectedMat.quantity} un.
                </p>
              )}
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

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => { reset(); onClose(); }}
                disabled={submitting}
                className="h-9 px-4 rounded-xl text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || !selectedMat || selectedMat.quantity === 0 || !user}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-100 flex items-center gap-1.5"
              >
                {submitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Registrando...</>
                ) : (
                  <><LogOut className="h-3.5 w-3.5" /> Confirmar Saída</>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && result && (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Saída registrada com sucesso!</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {result.quantity} un. de <strong>{result.materialName}</strong> — {result.date}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                1. Gere e imprima o Termo de Responsabilidade
              </p>
              <Button
                onClick={handleGerarPDF}
                variant="outline"
                className="w-full h-10 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Gerar Termo de Responsabilidade (PDF)
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                2. Faça upload do documento assinado (foto)
              </p>
              {docSaved ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Documento assinado salvo com sucesso!
                </div>
              ) : (
                <>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all overflow-hidden group"
                  >
                    {docPreview ? (
                      <Image src={docPreview} alt="Doc assinado" fill className="object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-blue-500 transition-colors">
                        <ImagePlus className="h-6 w-6" />
                        <span className="text-xs">Foto do documento assinado</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleDocChange} />
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {error}
                    </p>
                  )}
                  <Button
                    onClick={handleUploadDoc}
                    disabled={!docFile || uploadingDoc}
                    className="w-full h-9 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-2"
                  >
                    {uploadingDoc ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...</>
                    ) : (
                      <><Upload className="h-3.5 w-3.5" /> Salvar Documento Assinado</>
                    )}
                  </Button>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Button
                onClick={() => { reset(); onClose(); }}
                variant="outline"
                className="w-full h-9 rounded-xl text-xs border-slate-200 text-slate-600"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

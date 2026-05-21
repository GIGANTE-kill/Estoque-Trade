"use client";

/**
 * MaterialModal
 *
 * Modal unificado de cadastro/edição de material de estoque.
 * Corresponde à operação de "Entrada" — adicionar um novo item ao sistema
 * já com quantidade inicial.
 *
 * Campos:
 *  - Foto do produto (upload local → /api/upload)
 *  - Nome, SKU, Categoria, Quantidade inicial, Status
 *  - Fornecedor, Nome da Ação, Período da Ação (início/fim)
 *
 * Regras de negócio:
 *  - Nome e Categoria são obrigatórios.
 *  - A foto é opcional, mas recomendada para facilitar identificação na tabela.
 *  - Upload ocorre antes do POST do material; em caso de falha no upload a
 *    criação do material é abortada com mensagem de erro.
 */

import { useState, useRef, useEffect } from "react";
import { X, Save, AlertCircle, ImagePlus, Loader2, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/upload-helper";
import Image from "next/image";

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MaterialModal({ isOpen, onClose, onSuccess }: MaterialModalProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState("DISPONIVEL");
  const [fornecedor, setFornecedor] = useState("");
  const [nomeAcao, setNomeAcao] = useState("");
  const [periodoAcaoInicio, setPeriodoAcaoInicio] = useState("");
  const [periodoAcaoFim, setPeriodoAcaoFim] = useState("");

  // Estado da foto do produto
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/categories")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setCategories(data.map((c: any) => c.name));
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );

  if (!isOpen) return null;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setName("");
    setSku("");
    setCategoryName("");
    setCategorySearch("");
    setCategoryOpen(false);
    setQuantity(0);
    setStatus("DISPONIVEL");
    setFornecedor("");
    setNomeAcao("");
    setPeriodoAcaoInicio("");
    setPeriodoAcaoFim("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setError("");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) { setError("Nome do material é obrigatório."); return; }
    if (!categoryName.trim()) { setError("Categoria é obrigatória."); return; }

    setSubmitting(true);
    setError("");

    try {
      // 1. Faz upload da foto (se houver) antes de criar o material
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadFile(photoFile, "produto");
      }

      // 2. Cria o material
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku: sku || undefined,
          categoryName,
          quantity,
          status,
          entryDate: new Date().toISOString(),
          fornecedor,
          nomeAcao,
          periodoAcaoInicio,
          periodoAcaoFim,
          photoUrl,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao criar material.");
      }

      resetForm();
      onClose();
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
            <h3 className="font-bold text-slate-900 text-base">Novo Material</h3>
            <p className="text-xs text-slate-500 mt-0.5">Cadastre um novo item no sistema de controle.</p>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form com scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Foto do Produto ─────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Foto do Produto (Opcional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all overflow-hidden group"
            >
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Preview"
                  fill
                  className="object-cover rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <ImagePlus className="h-7 w-7" />
                  <span className="text-xs font-medium">Clique para adicionar foto</span>
                  <span className="text-[10px]">JPG, PNG ou WEBP — máx. 5 MB</span>
                </div>
              )}
              {photoPreview && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Trocar foto
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* ── Nome ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Nome do Material <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Wobbler Dia das Mães"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
              required
            />
          </div>

          {/* ── SKU ───────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              SKU (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: WOB-MAE-02"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* ── Categoria ─────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Categoria <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setCategoryOpen((v) => !v); setCategorySearch(""); }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all flex items-center justify-between"
              >
                <span className={categoryName ? "text-slate-700" : "text-slate-400"}>
                  {categoryName || "Selecione uma categoria..."}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
              {categoryOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar categoria..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        autoFocus
                        className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <ul className="max-h-48 overflow-y-auto py-1">
                    {filteredCategories.length === 0 ? (
                      <li className="px-3 py-2 text-xs text-slate-400 text-center">Nenhuma categoria encontrada</li>
                    ) : (
                      filteredCategories.map((cat) => (
                        <li
                          key={cat}
                          onClick={() => { setCategoryName(cat); setCategoryOpen(false); }}
                          className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${cat === categoryName ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"}`}
                        >
                          {cat}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── Quantidade & Status ────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Qtd Inicial
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="DISPONIVEL">Disponível</option>
                <option value="RESERVADO">Reservado</option>
                <option value="ESGOTADO">Esgotado</option>
              </select>
            </div>
          </div>

          {/* ── Fornecedor ─────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Fornecedor (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Distribuidora XYZ"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* ── Nome da Ação ───────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Nome da Ação (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Promoção de Verão"
              value={nomeAcao}
              onChange={(e) => setNomeAcao(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* ── Período da Ação ───────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Início da Ação
              </label>
              <input
                type="date"
                value={periodoAcaoInicio}
                onChange={(e) => setPeriodoAcaoInicio(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Fim da Ação
              </label>
              <input
                type="date"
                value={periodoAcaoFim}
                onChange={(e) => setPeriodoAcaoFim(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* ── Botões ─────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetForm(); onClose(); }}
              disabled={submitting}
              className="h-9 px-4 rounded-xl text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-100 flex items-center gap-1.5"
            >
              {submitting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Criando...</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> Criar Material</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, Loader2, AlertCircle, CheckCircle2,
  X, ImagePlus, Tag, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  _count: { materials: number };
}

// ─── Modal de criação/edição ───────────────────────────────────────────────
function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing: Category | null;
}) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(editing?.name ?? "");
      setImageUrl(editing?.imageUrl ?? null);
      setError("");
      setDone(false);
    }
  }, [isOpen, editing]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "categoria");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload");
      setImageUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nome é obrigatório"); return; }
    setSubmitting(true);
    setError("");
    try {
      const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 900);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Tag className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {editing ? "Editar Categoria" : "Nova Categoria"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preview imagem */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "relative flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors",
                imageUrl ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-300"
              )}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              ) : imageUrl ? (
                <>
                  <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ImagePlus className="h-6 w-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <ImagePlus className="h-7 w-7" />
                  <span className="text-[11px] font-medium">Adicionar imagem</span>
                </div>
              )}
            </div>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remover imagem
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nome da categoria</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Banner, Display, Totem..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {done && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {editing ? "Categoria atualizada!" : "Categoria criada!"}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              disabled={submitting || uploading || done}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card de categoria ─────────────────────────────────────────────────────
function CategoryCard({
  category,
  onEdit,
  onDelete,
  isAdmin,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  isAdmin: boolean;
}) {
  return (
    <div className="group relative bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-blue-100 transition-all">
      {/* Imagem */}
      <div className="relative h-40 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center overflow-hidden">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <Package className="h-12 w-12" />
          </div>
        )}
        {/* Overlay com ações */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(category)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md text-slate-600 hover:text-blue-600 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(category)}
              disabled={category._count.materials > 0}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md transition-colors",
                category._count.materials > 0
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:text-red-600"
              )}
              title={category._count.materials > 0 ? `${category._count.materials} material(is) vinculado(s)` : "Excluir"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 truncate">{category.name}</p>
        <Badge className={cn(
          "shrink-0 border text-[10px] font-semibold rounded-full",
          category._count.materials > 0
            ? "bg-blue-50 text-blue-700 border-blue-100"
            : "bg-slate-50 text-slate-500 border-slate-200"
        )}>
          {category._count.materials} {category._count.materials === 1 ? "item" : "itens"}
        </Badge>
      </div>
    </div>
  );
}

// ─── Modal de confirmação de exclusão ─────────────────────────────────────
function DeleteConfirmModal({
  category,
  onClose,
  onSuccess,
}: {
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!category) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Excluir categoria</p>
            <p className="text-xs text-slate-500">Esta ação não pode ser desfeita.</p>
          </div>
        </div>
        <p className="text-sm text-slate-700">
          Tem certeza que deseja excluir <span className="font-semibold">"{category.name}"</span>?
        </p>
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export function CategoriasClient({ initialCategories = [] }: { initialCategories?: Category[] }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMINISTRADOR";

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (initialCategories.length === 0) load();
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {categories.length} categoria{categories.length !== 1 ? "s" : ""} cadastrada{categories.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova categoria
            </Button>
          )}
        </div>

        {/* Busca */}
        <div className="relative max-w-xs">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Tag className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">
              {search ? "Nenhuma categoria encontrada" : "Nenhuma categoria cadastrada"}
            </p>
            {isAdmin && !search && (
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Criar primeira categoria
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isAdmin={isAdmin}
                onEdit={(c) => { setEditing(c); setModalOpen(true); }}
                onDelete={(c) => setDeleting(c)}
              />
            ))}
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={load}
        editing={editing}
      />
      <DeleteConfirmModal
        category={deleting}
        onClose={() => setDeleting(null)}
        onSuccess={load}
      />
    </AppShell>
  );
}

"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, SlidersHorizontal, Trash2, Loader2, AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { Lightbox } from "@/components/ui/Lightbox";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    DISPONIVEL: { label: "Disponível", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    RESERVADO:  { label: "Reservado",  className: "bg-amber-50 text-amber-700 border-amber-100" },
    ESGOTADO:   { label: "Esgotado",   className: "bg-red-50 text-red-600 border-red-100" },
  };
  const { label, className } = map[status] || { label: status, className: "bg-slate-50 text-slate-600 border-slate-100" };
  return (
    <Badge className={cn("border text-[10px] font-semibold uppercase tracking-wide rounded-full", className)}>
      {label}
    </Badge>
  );
}

function DaysBadge({ days }: { days: number }) {
  const isCritical = days > 60;
  const isUrgent   = days > 30;
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border",
      isCritical ? "bg-red-50 text-red-600 border-red-100"
        : isUrgent ? "bg-amber-50 text-amber-600 border-amber-100"
        : "bg-slate-50 text-slate-600 border-slate-100"
    )}>
      {(isCritical || isUrgent) && (
        <span className={cn("h-1.5 w-1.5 rounded-full", isCritical ? "bg-red-500 animate-pulse" : "bg-amber-400")} />
      )}
      {days} dias
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Display:    "bg-blue-50 text-blue-700 border-blue-100",
    PDV:        "bg-violet-50 text-violet-700 border-violet-100",
    Impresso:   "bg-teal-50 text-teal-700 border-teal-100",
    Iluminação: "bg-orange-50 text-orange-700 border-orange-100",
  };
  return (
    <Badge className={cn("border text-[10px] font-semibold rounded-full", colors[category] || "bg-slate-50 text-slate-600 border-slate-100")}>
      {category}
    </Badge>
  );
}

function ProductThumb({ photoUrl, name, onClick }: { photoUrl?: string | null; name: string; onClick?: () => void }) {
  if (photoUrl) {
    return (
      <div 
        className="h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onClick}
      >
        <Image src={photoUrl} alt={name} width={36} height={36} className="object-cover w-full h-full" />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
      <span className="text-[10px] font-bold text-slate-400">{name.substring(0, 2).toUpperCase()}</span>
    </div>
  );
}

function DeleteModal({
  material,
  onClose,
  onSuccess,
}: {
  material: { id: string; name: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleDelete() {
    if (!material) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/materials/${material.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao excluir");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!material) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 shrink-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Excluir produto</p>
              <p className="text-xs text-slate-500">Esta ação não pode ser desfeita.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-slate-700">
          Tem certeza que deseja excluir <span className="font-semibold">"{material.name}"</span>?
          Todo o histórico de movimentações vinculado também será removido.
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
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
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

export function StockTable({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const { user }    = useAuth();
  const isAdmin     = user?.role === "ADMINISTRADOR";

  const [materials, setMaterials]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleting, setDeleting]     = useState<{ id: string; name: string } | null>(null);
  const [refresh, setRefresh]       = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: any;
    const fetchMaterials = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const res = await fetch("/api/materials");
        const data = await res.json();
        if (Array.isArray(data)) setMaterials(data);
      } catch (err) {
        console.error("Error fetching materials:", err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchMaterials();
    intervalId = setInterval(() => fetchMaterials(true), 10000); // 10s polling

    return () => clearInterval(intervalId);
  }, [refreshTrigger, refresh]);

  const filteredMaterials = materials.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      m.category.toLowerCase().includes(term) ||
      (m.sku && m.sku.toLowerCase().includes(term))
    );
  });

  return (
    <>
      <Card className="border-0 rounded-2xl shadow-sm bg-white">
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">Materiais em Estoque</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {loading ? "Carregando..." : `${filteredMaterials.length} itens encontrados`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-300 focus:bg-white transition-all"
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-slate-200 text-slate-600 rounded-lg">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="pl-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-10" />
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Material</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Categoria</TableHead>
                  <TableHead className="text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">Quantidade</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Tempo na Casa</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Status</TableHead>
                  {isAdmin && (
                    <TableHead className="pr-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 w-12" />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow
                    key={material.id}
                    className="border-slate-50 hover:bg-slate-50/80 transition-colors cursor-default group"
                  >
                    <TableCell className="pl-5">
                      <ProductThumb 
                        photoUrl={material.photoUrl} 
                        name={material.name} 
                        onClick={() => {
                          if (material.photoUrl) setLightboxImage(material.photoUrl);
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-slate-800">{material.name}</p>
                      {material.sku && material.sku !== "-" && (
                        <p className="text-[10px] font-mono text-slate-400">{material.sku}</p>
                      )}
                      <p className="text-[10px] text-slate-400">Entrada: {material.entryDate}</p>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={material.category} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn("text-sm font-bold", material.quantity === 0 ? "text-red-500" : "text-slate-900")}>
                        {material.quantity.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">un</span>
                    </TableCell>
                    <TableCell>
                      <DaysBadge days={material.daysInStock} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={material.status} />
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="pr-5">
                        <button
                          onClick={() => setDeleting({ id: material.id, name: material.name })}
                          className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          title="Excluir produto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 px-5 py-3">
            <p className="text-xs text-slate-400">
              Mostrando {filteredMaterials.length} de {materials.length} itens
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled className="h-7 text-xs border-slate-200 rounded-lg">Anterior</Button>
              <Button variant="outline" size="sm" disabled className="h-7 text-xs border-slate-200 rounded-lg">Próximo</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteModal
        material={deleting}
        onClose={() => setDeleting(null)}
        onSuccess={() => setRefresh((p) => p + 1)}
      />

      <Lightbox 
        isOpen={!!lightboxImage} 
        imageUrl={lightboxImage} 
        onClose={() => setLightboxImage(null)} 
      />
    </>
  );
}

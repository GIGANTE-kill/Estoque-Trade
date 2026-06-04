"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { Loader2, Building2, Package, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Localizacao {
  id: string;
  rua: string;
  predio: string;
  andar: string;
  apartamento: string;
  _count?: { materials: number };
}

interface TooltipState {
  loc: Localizacao;
  x: number;
  y: number;
}

function groupData(locs: Localizacao[]) {
  const ruas = new Map<string, Map<string, Map<string, Localizacao[]>>>();
  for (const loc of locs) {
    if (!ruas.has(loc.rua)) ruas.set(loc.rua, new Map());
    const p = ruas.get(loc.rua)!;
    if (!p.has(loc.predio)) p.set(loc.predio, new Map());
    const a = p.get(loc.predio)!;
    if (!a.has(loc.andar)) a.set(loc.andar, []);
    a.get(loc.andar)!.push(loc);
  }
  return ruas;
}

function SlotCell({
  loc,
  onHover,
}: {
  loc: Localizacao;
  onHover: (l: Localizacao | null, e?: React.MouseEvent) => void;
}) {
  const occupied = (loc._count?.materials ?? 0) > 0;
  return (
    <div
      onMouseEnter={(e) => onHover(loc, e)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "relative flex flex-col items-center justify-center rounded cursor-default select-none",
        "w-8 h-8 transition-all duration-150 hover:scale-110 hover:z-10",
        occupied
          ? [
              "bg-gradient-to-br from-blue-400 to-blue-600 text-white",
              "shadow-md shadow-blue-400/60",
              "border border-blue-300/40",
            ]
          : [
              "bg-white/10 text-slate-400/70",
              "border border-dashed border-slate-400/30",
            ]
      )}
    >
      <span className="text-[8px] font-extrabold leading-none">{loc.apartamento.replace(/^Apto\s+/i, "")}</span>
      {occupied && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white shadow-sm shadow-emerald-300" />
      )}
    </div>
  );
}

function ShelfUnit({
  predio,
  andares,
  isLeft,
  onHover,
}: {
  predio: string;
  andares: Map<string, Localizacao[]>;
  isLeft: boolean;
  onHover: (l: Localizacao | null, e?: React.MouseEvent) => void;
}) {
  // Ordena os andares: Picking mais próximo do corredor, Andares numéricos crescentes mais distantes
  // Se isLeft é true (prédio ímpar, à esquerda do corredor), o corredor está à DIREITA dele.
  // Portanto, a ordem dos andares (da esquerda para a direita) deve ser: Andares altos -> Andares baixos -> Picking (mais à direita, perto do corredor).
  // Se isLeft é false (prédio par, à direita do corredor), o corredor está à ESQUERDA dele.
  // Portanto, a ordem dos andares (da esquerda para a direita) deve ser: Picking (mais à esquerda, perto do corredor) -> Andares baixos -> Andares altos.
  const sortedAndarNames = [...andares.keys()].sort((a, b) => {
    const isAPicking = a.toLowerCase().includes("picking");
    const isBPicking = b.toLowerCase().includes("picking");
    if (isAPicking) return -1; // picking primeiro na ordem lógica (mais perto do corredor)
    if (isBPicking) return 1;
    // Extrai números
    const numA = parseInt(a.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  // Se estiver na esquerda do corredor, queremos o Picking à direita (no final do array visual)
  if (isLeft) {
    sortedAndarNames.reverse(); // Assim os andares mais altos ficam à esquerda e o Picking (ou andar menor) fica à direita
  }

  const totalSlots = [...andares.values()].reduce((s, sl) => s + sl.length, 0);
  const occupiedSlots = [...andares.values()].reduce(
    (s, sl) => s + sl.filter((l) => (l._count?.materials ?? 0) > 0).length,
    0
  );
  const pct = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  return (
    <div className="flex items-center">
      {/* Prédio ímpar à esquerda: rótulo à esquerda */}
      {isLeft && (
        <div
          className="relative text-center text-[9px] font-black uppercase tracking-widest py-3 px-1.5 rounded-l-lg text-white z-10 shrink-0 [writing-mode:vertical-lr] [text-orientation:mixed]"
          style={{
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #60a5fa 100%)",
            boxShadow: "-2px 0 0 #1e3a8a inset",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          {predio}
        </div>
      )}

      {/* Grid de andares/apartamentos (disposição horizontal de andares, simulando visual vertical do prédio deitado) */}
      <div
        className="relative flex gap-2 p-2"
        style={{
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "4px 4px 0 0 rgba(0,0,0,0.5)",
          borderRadius: isLeft ? "0 8px 8px 0" : "8px 0 0 8px",
        }}
      >
        {sortedAndarNames.map((andarName) => {
          const slots = andares.get(andarName) || [];
          
          // Apartamentos do andar: queremos que os apartamentos comecem de baixo (Apto 1 no canto inferior).
          // Por padrão, flex-col-reverse ou ordenar de forma decrescente para que o menor fique na base.
          const sortedSlots = [...slots].sort((a, b) => {
            const numA = parseInt(a.apartamento.replace(/\D/g, "")) || 0;
            const numB = parseInt(b.apartamento.replace(/\D/g, "")) || 0;
            return numB - numA; // Ordem decrescente, de modo que o maior fique no topo e o 1 fique na base (inferior)
          });
          
          return (
            <div key={andarName} className="flex flex-col items-center gap-1">
              {/* Slots/Apartamentos verticalmente */}
              <div
                className="flex flex-col gap-1 p-1 rounded"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 2px 0 rgba(0,0,0,0.3) inset",
                }}
              >
                {sortedSlots.map((loc) => (
                  <SlotCell key={loc.id} loc={loc} onHover={onHover} />
                ))}
              </div>

              {/* Rótulo do Andar */}
              <div
                className="text-[7px] font-bold leading-none select-none uppercase tracking-tighter"
                style={{ color: "rgba(148,163,184,0.7)" }}
              >
                {andarName.replace(/^Andar\s+/i, "A").replace(/^Picking\s+/i, "Pik")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prédio par à direita: rótulo à direita */}
      {!isLeft && (
        <div
          className="relative text-center text-[9px] font-black uppercase tracking-widest py-3 px-1.5 rounded-r-lg text-white z-10 shrink-0 [writing-mode:vertical-lr] [text-orientation:mixed]"
          style={{
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #60a5fa 100%)",
            boxShadow: "2px 0 0 #1e3a8a inset",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          {predio}
        </div>
      )}
    </div>
  );
}

function RuaSection({
  rua,
  predios,
  onHover,
}: {
  rua: string;
  predios: Map<string, Map<string, Localizacao[]>>;
  onHover: (l: Localizacao | null, e?: React.MouseEvent) => void;
}) {
  // Ordena prédios
  const sortedPredios = [...predios.entries()].sort(([a], [b]) => {
    const numA = parseInt(a.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  // Separa ímpares (esquerda) e pares (direita)
  const leftPredios = sortedPredios.filter(([name]) => {
    const num = parseInt(name.replace(/\D/g, "")) || 0;
    return num % 2 !== 0; // Ímpar
  });

  const rightPredios = sortedPredios.filter(([name]) => {
    const num = parseInt(name.replace(/\D/g, "")) || 0;
    return num % 2 === 0; // Par
  });

  // Alinha os prédios a partir do topo (fim do array), adicionando nulls no início do array mais curto
  const maxRows = Math.max(leftPredios.length, rightPredios.length);
  
  const paddedLeft = [...leftPredios];
  const paddedRight = [...rightPredios];
  
  while (paddedLeft.length < maxRows) {
    paddedLeft.unshift(null as any);
  }
  while (paddedRight.length < maxRows) {
    paddedRight.unshift(null as any);
  }

  const rows = Array.from({ length: maxRows }, (_, i) => {
    return {
      left: paddedLeft[i],
      right: paddedRight[i],
    };
  }).reverse();

  return (
    <div className="space-y-3">
      {/* Street sign */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
            boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-white/60" />
          {rua}
        </div>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.4) 0%, transparent 100%)" }} />
      </div>

      {/* Warehouse scene */}
      <div
        className="relative overflow-x-auto rounded-2xl"
        style={{
          background: "linear-gradient(180deg, #0a0f1e 0%, #0d1629 50%, #0a0f1e 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          padding: "24px 20px",
        }}
      >
        {/* Floor grid */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)",
          }}
        />

        {/* Layout com corredor vertical centralizado UNIFICADO */}
        <div className="relative grid grid-cols-[320px_56px_320px] gap-y-6 gap-x-6 items-center justify-center min-w-max">
          
          {/* Corredor central único contínuo que ocupa toda a altura do grid */}
          <div
            className="col-start-2 col-end-3 row-start-1 h-full rounded-xl flex flex-col items-center justify-center gap-4 relative overflow-hidden"
            style={{
              gridRow: `1 / span ${maxRows}`,
              background:
                "linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.04) 100%)",
              border: "1px dashed rgba(251,191,36,0.2)",
              minHeight: `${maxRows * 128}px`,
            }}
          >
            <div
              className="w-0.5 h-full rounded-full"
              style={{ background: "rgba(251,191,36,0.25)" }}
            />
            <span
              className="text-[6px] font-extrabold tracking-[0.2em] whitespace-nowrap absolute"
              style={{
                color: "rgba(251,191,36,0.4)",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              RUA CORREDOR
            </span>
          </div>

          {/* Renderiza os prédios nas colunas 1 e 3 de cada linha */}
          {rows.map((row, index) => {
            const rowIndex = index + 1;
            return (
              <Fragment key={index}>
                {/* LADO ESQUERDO (Ímpares) - Coluna 1 */}
                <div
                  className="flex justify-end"
                  style={{ gridColumn: 1, gridRow: rowIndex }}
                >
                  {row.left ? (
                    <ShelfUnit
                      predio={row.left[0]}
                      andares={row.left[1]}
                      isLeft={true}
                      onHover={onHover}
                    />
                  ) : (
                    <div className="w-1" />
                  )}
                </div>

                {/* LADO DIREITO (Pares) - Coluna 3 */}
                <div
                  className="flex justify-start"
                  style={{ gridColumn: 3, gridRow: rowIndex }}
                >
                  {row.right ? (
                    <ShelfUnit
                      predio={row.right[0]}
                      andares={row.right[1]}
                      isLeft={false}
                      onHover={onHover}
                    />
                  ) : (
                    <div className="w-1" />
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function WarehouseMap({ refreshKey }: { refreshKey?: number }) {
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/localizacoes", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLocalizacoes(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const grouped = useMemo(() => groupData(localizacoes), [localizacoes]);

  const totalSlots = localizacoes.length;
  const occupiedSlots = localizacoes.filter((l) => (l._count?.materials ?? 0) > 0).length;
  const freeSlots = totalSlots - occupiedSlots;

  function handleHover(loc: Localizacao | null, e?: React.MouseEvent) {
    if (!loc || !e) {
      setTooltip(null);
      return;
    }
    setTooltip({ loc, x: e.clientX, y: e.clientY });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Carregando mapa do estoque...</span>
      </div>
    );
  }

  if (localizacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Building2 className="h-8 w-8 text-slate-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-slate-500">Nenhum endereço cadastrado</p>
          <p className="text-xs text-slate-400">
            Cadastre endereços na aba <strong>Endereços</strong> para visualizar o mapa 3D
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend / Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm shadow-blue-300" />
          <span className="text-xs font-semibold text-blue-700">
            {occupiedSlots} Ocupado{occupiedSlots !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
          <div className="w-3 h-3 rounded border-2 border-dashed border-slate-300" />
          <span className="text-xs font-semibold text-slate-600">
            {freeSlots} Livre{freeSlots !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
          <Package className="h-3 w-3 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">{totalSlots} posições no total</span>
        </div>

        {/* Global bar */}
        {totalSlots > 0 && (
          <div className="ml-auto flex items-center gap-2 min-w-[160px]">
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round((occupiedSlots / totalSlots) * 100)}%`,
                  background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
                }}
              />
            </div>
            <span className="text-xs font-bold text-slate-500 w-10 text-right">
              {Math.round((occupiedSlots / totalSlots) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Ruas */}
      <div className="space-y-8">
        {[...grouped.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([rua, predios]) => (
            <RuaSection key={rua} rua={rua} predios={predios} onHover={handleHover} />
          ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 72 }}
        >
          <div
            className="rounded-xl px-3 py-2.5 text-xs space-y-1 min-w-[160px]"
            style={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
              backdropFilter: "blur(8px)",
            }}
          >
            <p className="font-extrabold text-blue-300 text-[10px] uppercase tracking-wider">
              {tooltip.loc.rua}
            </p>
            <p className="text-slate-200 font-semibold">{tooltip.loc.predio}</p>
            <p className="text-slate-400">
              {tooltip.loc.andar} · Apto <strong className="text-slate-300">{tooltip.loc.apartamento}</strong>
            </p>
            {(tooltip.loc._count?.materials ?? 0) > 0 ? (
              <p className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="h-3 w-3" />
                {tooltip.loc._count!.materials} produto{tooltip.loc._count!.materials !== 1 ? "s" : ""}
              </p>
            ) : (
              <p className="flex items-center gap-1 text-slate-400">
                <Circle className="h-3 w-3" />
                Livre
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

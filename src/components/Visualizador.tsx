"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Focus, RotateCcw } from "lucide-react";
import type { Cena3DProps, Comando, Vista } from "./Cena3D";
import { cx } from "./ui";

export const Cena3D = dynamic(() => import("./Cena3D"), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center text-sm text-suave">Preparando o laboratório 3D…</div>,
});

export const VISTAS: { id: Vista; rotulo: string }[] = [
  { id: "anterior", rotulo: "Anterior" },
  { id: "posterior", rotulo: "Posterior" },
  { id: "direita", rotulo: "Lateral D" },
  { id: "esquerda", rotulo: "Lateral E" },
  { id: "superior", rotulo: "Superior" },
  { id: "inferior", rotulo: "Inferior" },
];

export function useComandos() {
  const [comando, setComando] = useState<Comando | null>(null);
  return {
    comando,
    vista: (vista: Vista) => setComando((c) => ({ tipo: "vista", vista, n: (c?.n ?? 0) + 1 })),
    focar: (ids: string[] | null) => setComando((c) => ({ tipo: "focar", ids, n: (c?.n ?? 0) + 1 })),
  };
}

const CURTO: Record<Vista, string> = { anterior: "Ant.", posterior: "Post.", direita: "Lat. D", esquerda: "Lat. E", superior: "Sup.", inferior: "Inf." };

export function BarraVistas({ aoEscolher, className, compacto }: { aoEscolher: (v: Vista) => void; className?: string; compacto?: boolean }) {
  return (
    <div className={cx("flex flex-wrap gap-1", className)} role="group" aria-label="Vistas da câmera">
      {VISTAS.map((v) => (
        <button
          key={v.id}
          onClick={() => aoEscolher(v.id)}
          aria-label={`Vista ${v.rotulo.toLowerCase()}`}
          className="rounded-lg border border-linha bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-tinta-2 backdrop-blur transition-colors hover:bg-lilas hover:text-roxo-forte"
        >
          {compacto ? CURTO[v.id] : v.rotulo}
        </button>
      ))}
    </div>
  );
}

/** Visualizador compacto usado nas páginas de conteúdo e nos exercícios. */
export function MiniVisualizador({ altura = "h-[340px] sm:h-[420px]", legenda, ...props }: Omit<Cena3DProps, "comando" | "className"> & { altura?: string; legenda?: string }) {
  const cmd = useComandos();
  return (
    <div className={cx("relative overflow-hidden rounded-2xl border border-linha bg-gradient-to-b from-white to-fundo-2", altura)}>
      <Cena3D {...props} comando={cmd.comando} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
        <BarraVistas aoEscolher={cmd.vista} className="pointer-events-auto" compacto />
        <div className="pointer-events-auto flex gap-1">
          <button onClick={() => cmd.focar(props.focoInicial ?? null)} aria-label="Centralizar no destaque" title="Centralizar" className="grid size-8 place-items-center rounded-lg border border-linha bg-white/90 text-tinta-2 hover:bg-lilas">
            <Focus size={15} />
          </button>
          <button onClick={() => cmd.focar(null)} aria-label="Ver o modelo inteiro" title="Modelo inteiro" className="grid size-8 place-items-center rounded-lg border border-linha bg-white/90 text-tinta-2 hover:bg-lilas">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      {legenda && <p className="pointer-events-none absolute left-3 top-3 max-w-[80%] rounded-lg bg-white/85 px-2.5 py-1.5 text-xs font-medium text-tinta-2 backdrop-blur">{legenda}</p>}
    </div>
  );
}

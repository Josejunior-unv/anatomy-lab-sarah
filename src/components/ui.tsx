"use client";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Cartao({ className, children, ...p }: ComponentProps<"div">) {
  return (
    <div className={cx("cartao p-5 sm:p-6", className)} {...p}>
      {children}
    </div>
  );
}

type Variante = "primario" | "secundario" | "fantasma" | "petroleo" | "perigo";
const variantes: Record<Variante, string> = {
  primario: "bg-roxo text-white hover:bg-roxo-forte shadow-[0_6px_16px_-8px_rgba(95,67,184,0.8)]",
  petroleo: "bg-petroleo text-white hover:bg-petroleo-forte",
  secundario: "bg-lilas text-roxo-forte hover:bg-lilas-2",
  fantasma: "bg-transparent text-tinta-2 hover:bg-fundo-2 border border-linha",
  perigo: "bg-erro-fundo text-erro hover:bg-[#f6d3dc]",
};
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-45 min-h-[42px]";

export function Botao({ variante = "primario", className, ...p }: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={cx(base, variantes[variante], className)} {...p} />;
}

export function BotaoLink({ variante = "primario", className, ...p }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={cx(base, variantes[variante], className)} {...p} />;
}

export function Cabecalho({ sobre, titulo, descricao, acoes }: { sobre?: string; titulo: string; descricao?: string; acoes?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {sobre && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-roxo">{sobre}</p>}
        <h1 className="text-2xl font-extrabold text-tinta sm:text-[28px]">{titulo}</h1>
        {descricao && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-suave">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </header>
  );
}

export function Barra({ valor, cor = "var(--color-roxo)", className, rotulo }: { valor: number; cor?: string; className?: string; rotulo?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, valor)) * 100);
  return (
    <div
      className={cx("h-2 w-full overflow-hidden rounded-full bg-fundo-2", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
    >
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

export function Anel({ valor, tamanho = 120, espessura = 10, cor = "var(--color-roxo)", children }: { valor: number; tamanho?: number; espessura?: number; cor?: string; children?: ReactNode }) {
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, valor));
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90" aria-hidden>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--color-fundo-2)" strokeWidth={espessura} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Etiqueta({ children, tom = "lilas", className }: { children: ReactNode; tom?: "lilas" | "agua" | "ok" | "erro" | "alerta" | "neutro"; className?: string }) {
  const tons = {
    lilas: "bg-lilas text-roxo-forte",
    agua: "bg-agua text-petroleo-forte",
    ok: "bg-ok-fundo text-ok",
    erro: "bg-erro-fundo text-erro",
    alerta: "bg-alerta-fundo text-alerta",
    neutro: "bg-fundo-2 text-tinta-2",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tons[tom], className)}>{children}</span>;
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-lilas-2 bg-white/60 px-5 py-8 text-center">
      <p className="font-display text-base font-bold text-tinta">{titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-suave">{texto}</p>
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

export const nivelDominio = (v: number): { rotulo: string; tom: "neutro" | "alerta" | "lilas" | "ok" } =>
  v >= 0.8 ? { rotulo: "Dominado", tom: "ok" } : v >= 0.45 ? { rotulo: "Em progresso", tom: "lilas" } : v > 0 ? { rotulo: "Iniciado", tom: "alerta" } : { rotulo: "Não iniciado", tom: "neutro" };

export function Dominio({ valor, cor }: { valor: number; cor?: string }) {
  const n = nivelDominio(valor);
  return (
    <div className="flex items-center gap-3">
      <Barra valor={valor} cor={cor} rotulo={`Domínio: ${Math.round(valor * 100)}%`} />
      <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-tinta-2">{Math.round(valor * 100)}%</span>
      <span className="sr-only">{n.rotulo}</span>
    </div>
  );
}

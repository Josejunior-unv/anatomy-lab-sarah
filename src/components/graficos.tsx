"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { CORES } from "@/data";

export interface PontoTempo {
  rotulo: string;
  neuro: number;
  ossea: number;
  geral: number;
}
export interface PontoAcerto {
  rotulo: string;
  acerto: number | null;
  questoes: number;
}

const COR_GERAL = "#a9a5bd";
const eixo = { fontSize: 11, fill: "#7a768f" };
const series = [
  { k: "neuro", nome: "Neuroanatomia", cor: CORES.neuro },
  { k: "ossea", nome: "Anatomia óssea", cor: CORES.ossea },
  { k: "geral", nome: "Flashcards, simulados e outros", cor: COR_GERAL },
] as const;

function Dica({ active, payload, label, sufixo }: TooltipProps<number, string> & { sufixo: string; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-linha bg-white px-3 py-2 text-xs shadow-flutuante">
      <p className="mb-1 font-bold text-tinta">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-tinta-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <strong className="tabular-nums text-tinta">{p.value ?? "—"}{p.value != null ? sufixo : ""}</strong>
        </p>
      ))}
    </div>
  );
}

export function Legenda() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-2">
      {series.map((s) => (
        <li key={s.k} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: s.cor }} />
          {s.nome}
        </li>
      ))}
    </ul>
  );
}

/** Minutos de estudo por período, empilhados por disciplina. */
export function GraficoTempo({ dados, altura = 240 }: { dados: PontoTempo[]; altura?: number }) {
  return (
    <div style={{ height: altura }} role="img" aria-label="Gráfico de minutos de estudo por período e por disciplina">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#ece9f5" />
          <XAxis dataKey="rotulo" tick={eixo} tickLine={false} axisLine={{ stroke: "#e6e3f0" }} interval="preserveStartEnd" />
          <YAxis tick={eixo} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: "rgba(124,92,214,0.07)" }} content={<Dica sufixo=" min" />} />
          {series.map((s, i) => (
            <Bar key={s.k} dataKey={s.k} name={s.nome} stackId="t" fill={s.cor} stroke="#fff" strokeWidth={1.5} radius={i === series.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={34} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Taxa de acertos (%) por período. */
export function GraficoAcertos({ dados, altura = 220 }: { dados: PontoAcerto[]; altura?: number }) {
  return (
    <div style={{ height: altura }} role="img" aria-label="Gráfico da taxa de acertos por período">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#ece9f5" />
          <XAxis dataKey="rotulo" tick={eixo} tickLine={false} axisLine={{ stroke: "#e6e3f0" }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={eixo} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ stroke: "#dcd3f8" }} content={<Dica sufixo="%" />} />
          <Line type="monotone" dataKey="acerto" name="Taxa de acertos" stroke={CORES.neuro} strokeWidth={2} connectNulls dot={{ r: 4, fill: CORES.neuro, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

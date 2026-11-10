import type { PontoAcerto, PontoTempo } from "@/components/graficos";
import type { Dados, Dia } from "@/store/progresso";
import { chaveDia, deChave, diaCurto, diaSemana, inicioSemana, somaDias, ultimosDias } from "./datas";

export type Periodo = "diaria" | "semanal" | "mensal";

interface Balde {
  rotulo: string;
  dias: Dia[];
}

function baldes(dias: Dados["dias"], periodo: Periodo): Balde[] {
  if (periodo === "diaria")
    return ultimosDias(14).map((k) => ({ rotulo: `${diaSemana(k)} ${diaCurto(k).slice(0, 2)}`, dias: dias[k] ? [dias[k]] : [] }));
  if (periodo === "semanal") {
    const ini = inicioSemana();
    return Array.from({ length: 8 }, (_, i) => {
      const comeco = somaDias(ini, (i - 7) * 7);
      const ks = Array.from({ length: 7 }, (_, d) => chaveDia(somaDias(comeco, d)));
      return { rotulo: diaCurto(ks[0]), dias: ks.map((k) => dias[k]).filter(Boolean) };
    });
  }
  const hoje = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const m = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    const prefixo = chaveDia(m).slice(0, 7);
    return {
      rotulo: m.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      dias: Object.entries(dias).filter(([k]) => k.startsWith(prefixo)).map(([, d]) => d),
    };
  });
}

export function serieTempo(dias: Dados["dias"], periodo: Periodo): PontoTempo[] {
  const min = (s: number) => Math.round(s / 60);
  return baldes(dias, periodo).map((b) => ({
    rotulo: b.rotulo,
    neuro: min(b.dias.reduce((a, d) => a + d.seg.neuro, 0)),
    ossea: min(b.dias.reduce((a, d) => a + d.seg.ossea, 0)),
    geral: min(b.dias.reduce((a, d) => a + d.seg.geral, 0)),
  }));
}

export function serieAcertos(dias: Dados["dias"], periodo: Periodo): PontoAcerto[] {
  return baldes(dias, periodo).map((b) => {
    const q = b.dias.reduce((a, d) => a + d.questoes, 0);
    const c = b.dias.reduce((a, d) => a + d.acertos, 0);
    return { rotulo: b.rotulo, questoes: q, acerto: q ? Math.round((c / q) * 100) : null };
  });
}

export const rotuloPeriodo: Record<Periodo, string> = { diaria: "Diária", semanal: "Semanal", mensal: "Mensal" };
export const descricaoPeriodo: Record<Periodo, string> = { diaria: "últimos 14 dias", semanal: "últimas 8 semanas", mensal: "últimos 6 meses" };
export { deChave };

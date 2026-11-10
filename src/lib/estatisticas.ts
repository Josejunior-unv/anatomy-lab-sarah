import { cardsDoTopico, flashcards, questoes, questoesDoTopico, topicos } from "@/data";
import type { Disciplina, Topico } from "@/data/tipos";
import type { Dados, Dia } from "@/store/progresso";
import { chaveDia, diasDaSemana, somaDias } from "./datas";
import { ehDificil, statusDe, venceu } from "./srs";

export const segDia = (d?: Dia) => (d ? d.seg.neuro + d.seg.ossea + d.seg.geral : 0);
const ativo = (d?: Dia) => !!d && (d.cards > 0 || d.questoes > 0 || d.topicos > 0 || segDia(d) >= 60);

export function sequencia(dias: Dados["dias"]): number {
  let n = 0;
  let d = new Date();
  if (!ativo(dias[chaveDia(d)])) d = somaDias(d, -1);
  while (ativo(dias[chaveDia(d)])) {
    n++;
    d = somaDias(d, -1);
  }
  return n;
}

export const tempoTotal = (dias: Dados["dias"]) => Object.values(dias).reduce((a, d) => a + segDia(d), 0);
export const cardsRevisados = (dias: Dados["dias"]) => Object.values(dias).reduce((a, d) => a + d.cards, 0);

export function taxaSimulados(s: Dados["simulados"]): number | null {
  const t = s.reduce((a, r) => a + r.total, 0);
  return t ? s.reduce((a, r) => a + r.acertos, 0) / t : null;
}

/** Domínio de um conteúdo (0–1): leitura, questões e maturidade dos flashcards. */
export function dominio(t: Topico, s: Pick<Dados, "topicos" | "questoes" | "cards">): number {
  const partes: [number, number][] = [[s.topicos[t.id]?.lido ? 1 : 0, 0.2]];
  const qs = questoesDoTopico(t.id);
  if (qs.length) {
    let tent = 0, cert = 0, feitas = 0;
    for (const q of qs) {
      const r = s.questoes[q.id];
      if (r) { tent += r.t; cert += r.c; feitas++; }
    }
    partes.push([tent ? (cert / tent) * (feitas / qs.length) : 0, 0.4]);
  }
  const cs = cardsDoTopico(t.id);
  if (cs.length) {
    const m = cs.reduce((a, c) => a + Math.min(1, (s.cards[c.id]?.intervalo ?? 0) / 21), 0) / cs.length;
    partes.push([m, 0.4]);
  }
  const peso = partes.reduce((a, [, p]) => a + p, 0);
  return partes.reduce((a, [v, p]) => a + v * p, 0) / peso;
}

export function dominioDisciplina(d: Disciplina, s: Pick<Dados, "topicos" | "questoes" | "cards">): number {
  const ts = topicos.filter((t) => t.disciplina === d);
  return ts.reduce((a, t) => a + dominio(t, s), 0) / ts.length;
}

export const progressoGeral = (s: Pick<Dados, "topicos" | "questoes" | "cards">) =>
  topicos.reduce((a, t) => a + dominio(t, s), 0) / topicos.length;

export function resumoCards(cards: Dados["cards"], filtro?: (id: string) => boolean) {
  const r = { total: 0, novos: 0, aprendendo: 0, revisao: 0, dominados: 0, vencidos: 0, dificeis: 0 };
  for (const c of flashcards) {
    if (filtro && !filtro(c.id)) continue;
    r.total++;
    const e = cards[c.id];
    const st = statusDe(e);
    if (st === "novo") r.novos++;
    else if (st === "aprendendo") r.aprendendo++;
    else if (st === "revisao") r.revisao++;
    else r.dominados++;
    if (venceu(e)) r.vencidos++;
    if (ehDificil(e)) r.dificeis++;
  }
  return r;
}

export function acertoPorDisciplina(s: Pick<Dados, "questoes" | "ident">, d: Disciplina): { t: number; c: number } {
  let t = s.ident[d].t, c = s.ident[d].c;
  for (const q of questoes) {
    if (q.d !== d) continue;
    const r = s.questoes[q.id];
    if (r) { t += r.t; c += r.c; }
  }
  return { t, c };
}

export function semana(s: Pick<Dados, "dias" | "simulados">) {
  const ks = diasDaSemana();
  const ini = new Date(ks[0] + "T00:00:00").getTime();
  return {
    cards: ks.reduce((a, k) => a + (s.dias[k]?.cards ?? 0), 0),
    minutos: Math.round(ks.reduce((a, k) => a + segDia(s.dias[k]), 0) / 60),
    topicos: ks.reduce((a, k) => a + (s.dias[k]?.topicos ?? 0), 0),
    simulados: s.simulados.filter((r) => r.data >= ini).length,
  };
}

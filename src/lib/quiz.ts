import { questoes } from "@/data";
import type { Questao } from "@/data/tipos";
import { embaralhar } from "./datas";

/** Uma questão preparada para exibição (opções já embaralhadas). */
export interface Item {
  q: Questao;
  opcoes: string[];
}

export type Resposta = string | boolean | Record<string, string> | undefined;

export function preparar(q: Questao): Item {
  if (q.tipo === "mc") return { q, opcoes: embaralhar(q.op.map((o) => o[0])) };
  if (q.tipo === "assoc") return { q, opcoes: embaralhar(q.pares.map((p) => p[1])) };
  if (q.tipo === "ident") return { q, opcoes: q.op };
  return { q, opcoes: [] };
}

export function respondida(q: Questao, r: Resposta): boolean {
  if (r === undefined) return false;
  if (q.tipo === "assoc") return q.pares.every((p) => !!(r as Record<string, string>)[p[0]]);
  return true;
}

export function correta(q: Questao, r: Resposta): boolean {
  if (r === undefined) return false;
  if (q.tipo === "mc") return r === q.op[0][0];
  if (q.tipo === "vf") return r === q.r;
  if (q.tipo === "ident") return r === q.correta;
  return q.pares.every((p) => (r as Record<string, string>)[p[0]] === p[1]);
}

export const nomeTipo: Record<Questao["tipo"], string> = {
  mc: "Múltipla escolha",
  vf: "Verdadeiro ou falso",
  assoc: "Associação",
  ident: "Identificação no modelo 3D",
};

export const bancoPor = (filtro: (q: Questao) => boolean) => questoes.filter(filtro);

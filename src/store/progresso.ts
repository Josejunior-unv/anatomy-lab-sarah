"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Disciplina } from "@/data/tipos";
import { chaveDia } from "@/lib/datas";
import { avaliar, type EstadoCard, type Nota } from "@/lib/srs";

export interface Dia {
  cards: number;
  questoes: number;
  acertos: number;
  topicos: number;
  seg: { neuro: number; ossea: number; geral: number };
}

export interface ResultadoSimulado {
  id: string;
  data: number;
  titulo: string;
  disciplina: Disciplina | "geral";
  total: number;
  acertos: number;
  segundos: number;
  porTopico: Record<string, { t: number; c: number }>;
}

export interface Recente {
  tipo: "topico" | "lab" | "flashcards" | "simulado" | "identificacao";
  id: string;
  titulo: string;
  href: string;
  ts: number;
}

export interface Metas {
  cards: number;
  minutos: number;
  simulados: number;
  topicos: number;
}

export interface Dados {
  perfil: { nome: string; curso: string; instituicao: string };
  metas: Metas;
  cards: Record<string, EstadoCard>;
  topicos: Record<string, { lido: boolean; visitas: number; ultimo: number }>;
  questoes: Record<string, { t: number; c: number }>;
  simulados: ResultadoSimulado[];
  ident: Record<Disciplina, { t: number; c: number }>;
  dias: Record<string, Dia>;
  recentes: Recente[];
  atualizadoEm: number;
}

interface Acoes {
  avaliarCard: (id: string, nota: Nota) => void;
  responder: (questaoId: string, correta: boolean) => void;
  salvarSimulado: (r: ResultadoSimulado) => void;
  registrarIdent: (d: Disciplina, correta: boolean) => void;
  marcarLido: (id: string, lido: boolean) => void;
  visitar: (r: Omit<Recente, "ts">) => void;
  addTempo: (onde: "neuro" | "ossea" | "geral", seg: number) => void;
  setMetas: (m: Partial<Metas>) => void;
  setPerfil: (p: Partial<Dados["perfil"]>) => void;
  substituir: (d: Dados) => void;
  resetar: () => void;
}

export const dadosIniciais = (): Dados => ({
  perfil: { nome: "Sarah", curso: "", instituicao: "" },
  metas: { cards: 100, minutos: 300, simulados: 2, topicos: 5 },
  cards: {},
  topicos: {},
  questoes: {},
  simulados: [],
  ident: { neuro: { t: 0, c: 0 }, ossea: { t: 0, c: 0 } },
  dias: {},
  recentes: [],
  atualizadoEm: 0,
});

const diaVazio = (): Dia => ({ cards: 0, questoes: 0, acertos: 0, topicos: 0, seg: { neuro: 0, ossea: 0, geral: 0 } });

const comDia = (s: Dados, f: (d: Dia) => Dia): Record<string, Dia> => {
  const k = chaveDia();
  return { ...s.dias, [k]: f(s.dias[k] ?? diaVazio()) };
};

export const CHAVE_LOCAL = "anatomy-lab-sarah-v1";

export const useProgresso = create<Dados & Acoes>()(
  persist(
    (set) => ({
      ...dadosIniciais(),
      avaliarCard: (id, nota) =>
        set((s) => ({
          cards: { ...s.cards, [id]: avaliar(s.cards[id], nota) },
          dias: comDia(s, (d) => ({ ...d, cards: d.cards + 1 })),
          atualizadoEm: Date.now(),
        })),
      responder: (qid, correta) =>
        set((s) => {
          const a = s.questoes[qid] ?? { t: 0, c: 0 };
          return {
            questoes: { ...s.questoes, [qid]: { t: a.t + 1, c: a.c + (correta ? 1 : 0) } },
            dias: comDia(s, (d) => ({ ...d, questoes: d.questoes + 1, acertos: d.acertos + (correta ? 1 : 0) })),
            atualizadoEm: Date.now(),
          };
        }),
      salvarSimulado: (r) => set((s) => ({ simulados: [r, ...s.simulados].slice(0, 100), atualizadoEm: Date.now() })),
      registrarIdent: (disc, correta) =>
        set((s) => ({
          ident: { ...s.ident, [disc]: { t: s.ident[disc].t + 1, c: s.ident[disc].c + (correta ? 1 : 0) } },
          dias: comDia(s, (d) => ({ ...d, questoes: d.questoes + 1, acertos: d.acertos + (correta ? 1 : 0) })),
          atualizadoEm: Date.now(),
        })),
      marcarLido: (id, lido) =>
        set((s) => {
          const a = s.topicos[id] ?? { lido: false, visitas: 0, ultimo: 0 };
          const novo = lido && !a.lido;
          return {
            topicos: { ...s.topicos, [id]: { ...a, lido, ultimo: Date.now() } },
            dias: novo ? comDia(s, (d) => ({ ...d, topicos: d.topicos + 1 })) : s.dias,
            atualizadoEm: Date.now(),
          };
        }),
      visitar: (r) =>
        set((s) => {
          const topicos =
            r.tipo === "topico"
              ? { ...s.topicos, [r.id]: { lido: s.topicos[r.id]?.lido ?? false, visitas: (s.topicos[r.id]?.visitas ?? 0) + 1, ultimo: Date.now() } }
              : s.topicos;
          return {
            topicos,
            recentes: [{ ...r, ts: Date.now() }, ...s.recentes.filter((x) => x.href !== r.href)].slice(0, 12),
            atualizadoEm: Date.now(),
          };
        }),
      addTempo: (onde, seg) =>
        set((s) => ({ dias: comDia(s, (d) => ({ ...d, seg: { ...d.seg, [onde]: d.seg[onde] + seg } })), atualizadoEm: Date.now() })),
      setMetas: (m) => set((s) => ({ metas: { ...s.metas, ...m }, atualizadoEm: Date.now() })),
      setPerfil: (p) => set((s) => ({ perfil: { ...s.perfil, ...p }, atualizadoEm: Date.now() })),
      substituir: (d) => set(() => ({ ...dadosIniciais(), ...d })),
      resetar: () => set(() => ({ ...dadosIniciais(), atualizadoEm: Date.now() })),
    }),
    { name: CHAVE_LOCAL, version: 1 },
  ),
);

/** Extrai apenas os dados (sem as funções) para backup e sincronização. */
export const extrairDados = (s: Dados): Dados => ({
  perfil: s.perfil, metas: s.metas, cards: s.cards, topicos: s.topicos, questoes: s.questoes,
  simulados: s.simulados, ident: s.ident, dias: s.dias, recentes: s.recentes, atualizadoEm: s.atualizadoEm,
});

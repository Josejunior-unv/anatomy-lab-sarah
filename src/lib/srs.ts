import { chaveDia, somaDias } from "./datas";

/** Estado de repetição espaçada de um cartão (variação do SM-2). */
export interface EstadoCard {
  facil: number; // fator de facilidade
  intervalo: number; // dias
  vence: string; // AAAA-MM-DD
  reps: number;
  lapsos: number;
  hist: [number, Nota][]; // [timestamp, nota]
}

export type Nota = 1 | 2 | 3 | 4;
export const rotulosNota: Record<Nota, string> = { 1: "Errei", 2: "Difícil", 3: "Bom", 4: "Fácil" };

export const novoEstado = (): EstadoCard => ({ facil: 2.5, intervalo: 0, vence: chaveDia(), reps: 0, lapsos: 0, hist: [] });

export function proximoIntervalo(e: EstadoCard, nota: Nota): number {
  if (nota === 1) return 0;
  if (nota === 2) return e.reps === 0 ? 1 : Math.max(1, Math.round(e.intervalo * 1.2));
  if (nota === 3) return e.reps === 0 ? 1 : e.reps === 1 ? 3 : Math.max(2, Math.round(e.intervalo * e.facil));
  return e.reps === 0 ? 3 : Math.max(4, Math.round(e.intervalo * e.facil * 1.3));
}

export function avaliar(anterior: EstadoCard | undefined, nota: Nota): EstadoCard {
  const e = anterior ?? novoEstado();
  const intervalo = proximoIntervalo(e, nota);
  const delta = nota === 1 ? -0.2 : nota === 2 ? -0.15 : nota === 4 ? 0.15 : 0;
  return {
    facil: Math.min(3, Math.max(1.3, +(e.facil + delta).toFixed(2))),
    intervalo,
    vence: chaveDia(somaDias(new Date(), intervalo)),
    reps: nota === 1 ? 0 : e.reps + 1,
    lapsos: e.lapsos + (nota === 1 ? 1 : 0),
    hist: [...e.hist, [Date.now(), nota] as [number, Nota]].slice(-40),
  };
}

export type StatusCard = "novo" | "aprendendo" | "revisao" | "dominado";

export const statusDe = (e: EstadoCard | undefined): StatusCard =>
  !e ? "novo" : e.intervalo >= 21 ? "dominado" : e.intervalo >= 7 ? "revisao" : "aprendendo";

export const ehDificil = (e: EstadoCard | undefined): boolean => !!e && (e.lapsos >= 2 || e.facil < 2.1);

export const venceu = (e: EstadoCard | undefined, hoje = chaveDia()): boolean => !!e && e.vence <= hoje;

export const textoIntervalo = (dias: number): string =>
  dias === 0 ? "agora" : dias === 1 ? "1 dia" : dias < 30 ? `${dias} dias` : dias < 365 ? `${Math.round(dias / 30)} mês(es)` : `${(dias / 365).toFixed(1)} ano(s)`;

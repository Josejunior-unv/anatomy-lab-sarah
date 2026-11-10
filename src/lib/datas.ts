export const chaveDia = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
};

export const deChave = (k: string): Date => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const somaDias = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

/** Últimos n dias (do mais antigo para hoje). */
export const ultimosDias = (n: number): string[] => {
  const hoje = new Date();
  return Array.from({ length: n }, (_, i) => chaveDia(somaDias(hoje, i - n + 1)));
};

/** Segunda-feira da semana de uma data. */
export const inicioSemana = (d: Date = new Date()): Date => {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7;
  return somaDias(r, -dow);
};

export const diasDaSemana = (): string[] => {
  const ini = inicioSemana();
  return Array.from({ length: 7 }, (_, i) => chaveDia(somaDias(ini, i)));
};

export const formatarTempo = (seg: number): string => {
  const min = Math.round(seg / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

export const relogio = (seg: number): string => {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const diaCurto = (k: string): string =>
  deChave(k).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export const diaSemana = (k: string): string =>
  deChave(k).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");

export const dataLonga = (ts: number): string =>
  new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const embaralhar = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

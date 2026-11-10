export type Disciplina = "neuro" | "ossea";
export type LabId = "esqueleto" | "encefalo";

export interface Estrutura {
  nome: string;
  funcao: string;
}

export interface Tabela {
  titulo: string;
  colunas: string[];
  linhas: string[][];
}

/** Como um conteúdo se liga às malhas do modelo 3D. */
export interface Visual {
  lab: LabId;
  /** Tópicos do manifesto cujas malhas devem ser destacadas (padrão: o próprio id). */
  topicos?: string[];
  /** Grupos inteiros do manifesto. */
  grupos?: string[];
  /** Filtro adicional pelo nome da malha. */
  nome?: string;
}

export interface Topico {
  id: string;
  disciplina: Disciplina;
  grupo: string;
  titulo: string;
  resumo: string;
  texto: string[];
  /** Neuro: estruturas e funções. Óssea: acidentes anatômicos. */
  estruturas: Estrutura[];
  relacoes: string[];
  localizacao?: string;
  articulacoes?: string[];
  tabela?: Tabela;
  visual?: Visual;
}

export type BaralhoId = "neuro" | "cranio" | "axial" | "apendicular" | "acidentes";

export interface Flashcard {
  id: string;
  baralho: BaralhoId;
  topico: string;
  frente: string;
  verso: string;
}

interface QBase {
  id: string;
  d: Disciplina;
  topico: string;
  p: string;
}
/** Múltipla escolha: a primeira opção é a correta; cada opção traz sua explicação. */
export interface QMc extends QBase {
  tipo: "mc";
  op: [string, string][];
}
export interface QVf extends QBase {
  tipo: "vf";
  r: boolean;
  e: string;
}
export interface QAssoc extends QBase {
  tipo: "assoc";
  pares: [string, string][];
  e: string;
}
/** Identificação no modelo 3D: gerada a partir do manifesto. */
export interface QIdent extends QBase {
  tipo: "ident";
  lab: LabId;
  parte: string;
  op: string[];
  correta: string;
  e: string;
}
export type Questao = QMc | QVf | QAssoc | QIdent;

export interface Parte {
  id: string;
  nome: string;
  grupo: string;
  topico: string | null;
  lado: "D" | "E" | null;
  sub?: string | null;
  desc?: string;
  c: [number, number, number];
  s: [number, number, number];
}

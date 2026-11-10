import esqueletoJson from "./modelos/esqueleto.json";
import encefaloJson from "./modelos/encefalo.json";
import { flashcards } from "./flashcards";
import { gruposNeuro, topicosNeuro } from "./neuro";
import { gruposOssea, topicosOssea } from "./ossea";
import { questoes } from "./questoes";
import type { Disciplina, LabId, Parte, QIdent, Topico } from "./tipos";
import { embaralhar } from "@/lib/datas";

export * from "./tipos";
export { flashcards, baralhos } from "./flashcards";
export { questoes } from "./questoes";
export { gruposNeuro, gruposOssea, topicosNeuro, topicosOssea };

export const CORES = { neuro: "#7c5cd6", ossea: "#0a9a94" } as const;
export const nomeDisciplina: Record<Disciplina, string> = { neuro: "Neuroanatomia", ossea: "Anatomia óssea" };
export const rotaDisciplina: Record<Disciplina, string> = { neuro: "/neuroanatomia", ossea: "/anatomia-ossea" };

export const topicos: Topico[] = [...topicosNeuro, ...topicosOssea];
const mapaTopicos = new Map(topicos.map((t) => [t.id, t]));
export const topicoPorId = (id: string | null | undefined) => (id ? mapaTopicos.get(id) : undefined);
export const hrefTopico = (t: Topico) => `${rotaDisciplina[t.disciplina]}/${t.id}`;

export interface GrupoModelo {
  id: string;
  titulo: string;
  cor: string;
}

export interface Modelo {
  id: LabId;
  titulo: string;
  subtitulo: string;
  disciplina: Disciplina;
  arquivo: string;
  partes: Parte[];
  grupos: GrupoModelo[];
  /** Cor natural usada quando a coloração por região está desligada. */
  corBase: string;
}

/**
 * Registro dos modelos 3D. Para acrescentar um modelo novo:
 * 1. coloque o arquivo .glb em public/modelos/ (uma malha nomeada por estrutura);
 * 2. crie o manifesto em src/data/modelos/<id>.json (id da malha → nome, grupo, tópico);
 * 3. registre-o aqui. Veja o README para o passo a passo.
 */
export const modelos: Record<LabId, Modelo> = {
  esqueleto: {
    id: "esqueleto",
    titulo: "Laboratório do esqueleto",
    subtitulo: "Esqueleto humano completo · 221 estruturas selecionáveis",
    disciplina: "ossea",
    arquivo: "/modelos/esqueleto.glb",
    partes: esqueletoJson as Parte[],
    corBase: "#ece5d3",
    grupos: [
      { id: "cranio", titulo: "Crânio", cor: "#b39ddb" },
      { id: "coluna", titulo: "Coluna vertebral", cor: "#f0b56a" },
      { id: "torax", titulo: "Caixa torácica", cor: "#7fc8c2" },
      { id: "membro-superior", titulo: "Membros superiores", cor: "#8fb4e8" },
      { id: "membro-inferior", titulo: "Membros inferiores", cor: "#e79aa9" },
    ],
  },
  encefalo: {
    id: "encefalo",
    titulo: "Laboratório do sistema nervoso",
    subtitulo: "Encéfalo humano · 95 estruturas selecionáveis",
    disciplina: "neuro",
    arquivo: "/modelos/encefalo.glb",
    partes: encefaloJson as Parte[],
    corBase: "#e6c8c2",
    grupos: [
      { id: "cortex", titulo: "Córtex (giros e lobos)", cor: "#e7bdb6" },
      { id: "substancia-branca", titulo: "Substância branca e comissuras", cor: "#f3eee4" },
      { id: "nucleos", titulo: "Núcleos da base", cor: "#86aee6" },
      { id: "diencefalo", titulo: "Diencéfalo", cor: "#f1c173" },
      { id: "limbico", titulo: "Sistema límbico", cor: "#8fd0a2" },
      { id: "tronco", titulo: "Tronco encefálico", cor: "#c4acec" },
      { id: "cerebelo", titulo: "Cerebelo", cor: "#e59f93" },
      { id: "ventriculos", titulo: "Ventrículos e plexos", cor: "#73cfe0" },
      { id: "vias-opticas", titulo: "Via óptica", cor: "#ecd25e" },
    ],
  },
};

/** Modelos previstos, ainda sem arquivo de qualidade científica com licença aberta. */
export const modelosPendentes = [
  {
    titulo: "Medula espinal e nervos espinais",
    motivo:
      "O conjunto BodyParts3D 3.0 não traz a medula espinal como malha isolada. A estrutura do laboratório já aceita um arquivo GLB/GLTF: basta adicioná-lo em public/modelos e registrar o manifesto.",
  },
  {
    titulo: "Meninges e seios da dura-máter",
    motivo: "Sem modelo aberto de qualidade científica no momento; o encaixe para GLB/GLTF está pronto.",
  },
];

export const CREDITO_MODELOS =
  "BodyParts3D, © The Database Center for Life Science, licenciado sob CC Atribuição-CompartilhaIgual 2.1 Japão";

const semLado = (n: string) => n.replace(/ (direit[oa]|esquerd[oa])$/, "");
export const nomeSemLado = semLado;
const mapaPartes: Record<LabId, Map<string, Parte>> = {
  esqueleto: new Map(modelos.esqueleto.partes.map((p) => [p.id, p])),
  encefalo: new Map(modelos.encefalo.partes.map((p) => [p.id, p])),
};
export const partePorId = (lab: LabId, id: string | null | undefined) => (id ? mapaPartes[lab].get(id) : undefined);
export const grupoDe = (lab: LabId, id: string) => modelos[lab].grupos.find((g) => g.id === id);

/** Malhas do modelo 3D ligadas a um conteúdo. */
export function partesDoTopico(t: Topico): { lab: LabId; ids: string[] } | null {
  const v = t.visual;
  if (!v) return null;
  const alvo = v.topicos ?? (v.grupos ? [] : [t.id]);
  const re = v.nome ? new RegExp(v.nome) : null;
  const ids = modelos[v.lab].partes
    .filter((p) => (p.topico && alvo.includes(p.topico)) || v.grupos?.includes(p.grupo))
    .filter((p) => !re || re.test(p.nome))
    .map((p) => p.id);
  return ids.length ? { lab: v.lab, ids } : null;
}

export const cardsDoTopico = (id: string) => flashcards.filter((c) => c.topico === id);
export const questoesDoTopico = (id: string) => questoes.filter((q) => q.topico === id);

// ───────── Questões de identificação no modelo 3D ─────────

export type ModoIdent = "estrutura" | "regiao" | "acidente";

const TOPICOS_ACIDENTE = [
  "frontal", "temporais", "occipital", "esfenoide", "etmoide", "maxila", "mandibula", "atlas-axis", "sacro", "esterno",
  "clavicula", "escapula", "umero", "radio", "ulna", "femur", "tibia", "fibula",
];
const GENERICOS = /^(Base|Cabeça|Corpo|Ápice|Face anterior|Face articular|Margem anterior|Margem posterior)$/;
const contagemAcidentes = new Map<string, number>();
for (const t of topicosOssea) for (const e of t.estruturas) contagemAcidentes.set(e.nome, (contagemAcidentes.get(e.nome) ?? 0) + 1);
const acidentesUnicos = (t: Topico) => t.estruturas.filter((e) => contagemAcidentes.get(e.nome) === 1 && !GENERICOS.test(e.nome));
const escolher = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

let seq = 0;
export function gerarIdent(lab: LabId, modo: ModoIdent, excluir: Set<string> = new Set()): QIdent | null {
  const m = modelos[lab];
  const d = m.disciplina;
  const id = `ident-${lab}-${modo}-${Date.now()}-${seq++}`;

  if (modo === "acidente") {
    if (lab !== "esqueleto") return null;
    const candidatos = TOPICOS_ACIDENTE.filter((t) => !excluir.has(t));
    const t = topicoPorId(escolher(candidatos.length ? candidatos : TOPICOS_ACIDENTE))!;
    const certo = escolher(acidentesUnicos(t));
    const nomesDoTopico = new Set(t.estruturas.map((e) => e.nome));
    const outros = embaralhar(
      TOPICOS_ACIDENTE.filter((x) => x !== t.id).flatMap((x) => acidentesUnicos(topicoPorId(x)!).map((e) => e.nome)),
    ).filter((n) => !nomesDoTopico.has(n));
    const partes = partesDoTopico(t)!.ids;
    return {
      id, tipo: "ident", d, lab, topico: t.id, parte: partes.join(","),
      p: "Qual destes acidentes anatômicos pertence ao osso destacado?",
      correta: certo.nome,
      op: embaralhar([certo.nome, ...outros.slice(0, 3)]),
      e: `O osso destacado é ${t.titulo.toLowerCase().startsWith("osso") ? "o " + t.titulo.toLowerCase() : t.titulo}. ${certo.nome}: ${certo.funcao}`,
    };
  }

  const pool = m.partes.filter((p) => !excluir.has(semLado(p.nome)) && !/Dentes|sesamoides|Cartilage/.test(p.nome));
  const p = escolher(pool.length ? pool : m.partes);
  const t = topicoPorId(p.topico);
  const explica = p.desc ?? t?.resumo ?? "";

  if (modo === "regiao") {
    const usaLobo = lab === "encefalo" && p.grupo === "cortex" && p.sub;
    if (usaLobo) {
      const lobos = ["frontal", "parietal", "temporal", "occipital", "insular"];
      return {
        id, tipo: "ident", d, lab, topico: p.topico ?? "lobos-cerebrais", parte: p.id,
        p: "A qual lobo cerebral pertence a região destacada?",
        correta: `Lobo ${p.sub}`,
        op: embaralhar([p.sub!, ...embaralhar(lobos.filter((l) => l !== p.sub)).slice(0, 3)]).map((l) => `Lobo ${l}`),
        e: `${semLado(p.nome)} — lobo ${p.sub}. ${explica}`,
      };
    }
    const g = grupoDe(lab, p.grupo)!;
    return {
      id, tipo: "ident", d, lab, topico: p.topico ?? "", parte: p.id,
      p: lab === "esqueleto" ? "A qual região do esqueleto pertence o osso destacado?" : "A qual divisão do encéfalo pertence a estrutura destacada?",
      correta: g.titulo,
      op: embaralhar([g.titulo, ...embaralhar(m.grupos.filter((x) => x.id !== g.id)).slice(0, 3).map((x) => x.titulo)]),
      e: `${semLado(p.nome)} — ${g.titulo}. ${explica}`,
    };
  }

  const certo = semLado(p.nome);
  const nomes = (lista: Parte[]) => [...new Set(lista.map((x) => semLado(x.nome)))].filter((n) => n !== certo);
  const mesmoGrupo = embaralhar(nomes(m.partes.filter((x) => x.grupo === p.grupo && x.topico !== p.topico)));
  const mesmoTopico = embaralhar(nomes(m.partes.filter((x) => x.topico === p.topico)));
  const resto = embaralhar(nomes(m.partes));
  const distratores = [...new Set([...mesmoTopico.slice(0, 1), ...mesmoGrupo, ...resto])].slice(0, 3);
  return {
    id, tipo: "ident", d, lab, topico: p.topico ?? "", parte: p.id,
    p: lab === "esqueleto" ? "Qual é o osso destacado no modelo?" : "Qual é a estrutura destacada no modelo?",
    correta: certo,
    op: embaralhar([certo, ...distratores]),
    e: `${certo}. ${explica}`,
  };
}

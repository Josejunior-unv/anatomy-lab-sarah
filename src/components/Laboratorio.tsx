"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, Eye, EyeOff, Focus, Layers3, MapPin, Palette, RotateCcw, ScanEye, Search, X } from "lucide-react";
import { CREDITO_MODELOS, grupoDe, hrefTopico, modelos, modelosPendentes, partePorId, partesDoTopico, topicoPorId, type LabId, type Parte } from "@/data";
import { useProgresso } from "@/store/progresso";
import { BarraVistas, Cena3D, useComandos } from "./Visualizador";
import { Botao, Cabecalho, Cartao, Etiqueta, cx } from "./ui";

const MARCOS: Record<LabId, string[]> = {
  esqueleto: [
    "Osso frontal", "Mandíbula", "Vértebra cervical C7", "Corpo do esterno", "Clavícula esquerda", "Escápula esquerda", "Úmero esquerdo",
    "Rádio esquerdo", "Ulna esquerda", "Vértebra lombar L3", "Sacro e cóccix", "Osso do quadril esquerdo", "Fêmur esquerdo", "Patela esquerda",
    "Tíbia esquerda", "Fíbula esquerda", "Calcâneo esquerdo", "7ª costela esquerda",
  ],
  encefalo: [
    "Giro pré-central esquerdo", "Giro pós-central esquerdo", "Giro frontal superior esquerdo", "Giro temporal médio esquerdo",
    "Lobo occipital esquerdo", "Cerebelo", "Ponte", "Bulbo (medula oblonga)", "Giro angular esquerdo",
  ],
};
const RAIO_X: string[] = ["cortex", "substancia-branca"];

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Alternador({ ativo, aoClicar, icone: Icone, children }: { ativo: boolean; aoClicar: () => void; icone: typeof Eye; children: React.ReactNode }) {
  return (
    <button
      onClick={aoClicar}
      aria-pressed={ativo}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold backdrop-blur transition-colors",
        ativo ? "border-roxo bg-roxo text-white" : "border-linha bg-white/90 text-tinta-2 hover:bg-lilas",
      )}
    >
      <Icone size={14} /> {children}
    </button>
  );
}

export function Laboratorio() {
  const params = useSearchParams();
  const router = useRouter();
  const lab: LabId = params.get("modelo") === "encefalo" ? "encefalo" : "esqueleto";
  const topicoParam = topicoPorId(params.get("topico"));
  const modelo = modelos[lab];
  const visitar = useProgresso((s) => s.visitar);
  const cmd = useComandos();

  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const [colorir, setColorir] = useState(lab === "encefalo");
  const [marcadores, setMarcadores] = useState(false);
  const [raioX, setRaioX] = useState(false);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [destaque, setDestaque] = useState<string[] | null>(null);

  // Reinicia o estado ao trocar de modelo ou de conteúdo destacado.
  useEffect(() => {
    const alvo = topicoParam ? partesDoTopico(topicoParam) : null;
    const ids = alvo && alvo.lab === lab ? alvo.ids : null;
    setDestaque(ids);
    setSelecionada(params.get("parte") && partePorId(lab, params.get("parte")) ? params.get("parte") : null);
    setOcultas(new Set());
    setColorir(lab === "encefalo");
    setRaioX(false);
    setBusca("");
    setAberto(null);
    visitar({ tipo: "lab", id: lab, titulo: modelo.titulo, href: `/laboratorio?modelo=${lab}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lab, topicoParam?.id]);

  const parte = partePorId(lab, selecionada);
  const topico = topicoPorId(parte?.topico);
  const grupo = parte ? grupoDe(lab, parte.grupo) : undefined;

  const translucidas = useMemo(() => {
    const s = new Set<string>();
    if (!raioX) return s;
    const dest = new Set(destaque ?? []);
    for (const p of modelo.partes) if (RAIO_X.includes(p.grupo) && !dest.has(p.id)) s.add(p.id);
    return s;
  }, [raioX, modelo, destaque]);

  const idsMarcadores = useMemo(() => {
    if (!marcadores) return [];
    if (aberto) {
      const vistos = new Set<string>();
      return modelo.partes
        .filter((p) => p.grupo === aberto && p.lado !== "D" && !ocultas.has(p.id))
        .filter((p) => (vistos.has(p.topico + p.nome) ? false : (vistos.add(p.topico + p.nome), true)))
        .slice(0, 28)
        .map((p) => p.id);
    }
    return MARCOS[lab].map((n) => modelo.partes.find((p) => p.nome === n)?.id).filter((x): x is string => !!x && !ocultas.has(x));
  }, [marcadores, aberto, modelo, lab, ocultas]);

  const filtradas = useMemo(() => {
    const b = normalizar(busca.trim());
    return b ? modelo.partes.filter((p) => normalizar(p.nome).includes(b)) : null;
  }, [busca, modelo]);

  const alternar = (ids: string[], ocultar: boolean) =>
    setOcultas((o) => {
      const n = new Set(o);
      ids.forEach((id) => (ocultar ? n.add(id) : n.delete(id)));
      return n;
    });
  const selecionar = (id: string | null, focar = false) => {
    setSelecionada(id);
    if (id && ocultas.has(id)) alternar([id], false);
    if (id && focar) cmd.focar([id]);
  };
  const isolar = (ids: string[]) => {
    const manter = new Set(ids);
    setOcultas(new Set(modelo.partes.filter((p) => !manter.has(p.id)).map((p) => p.id)));
    cmd.focar(ids);
  };
  const trocar = (id: LabId) => router.replace(`/laboratorio?modelo=${id}`, { scroll: false });

  const Linha = ({ p }: { p: Parte }) => {
    const oculta = ocultas.has(p.id);
    return (
      <li className="flex items-center gap-1">
        <button
          onClick={() => selecionar(p.id, true)}
          className={cx("min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors", p.id === selecionada ? "bg-lilas font-semibold text-roxo-forte" : "text-tinta-2 hover:bg-fundo-2", oculta && "opacity-50")}
        >
          {p.nome}
        </button>
        <button onClick={() => alternar([p.id], !oculta)} aria-label={`${oculta ? "Exibir" : "Ocultar"} ${p.nome}`} aria-pressed={oculta} className="grid size-8 shrink-0 place-items-center rounded-lg text-suave hover:bg-fundo-2">
          {oculta ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </li>
    );
  };

  return (
    <>
      <Cabecalho
        sobre="Laboratório 3D"
        titulo={modelo.titulo}
        descricao={`${modelo.subtitulo}. Arraste para girar, use a roda do mouse ou o gesto de pinça para aproximar, e arraste com dois dedos (ou o botão direito) para mover a câmera.`}
      />
      <div className="mb-4 inline-flex rounded-2xl border border-linha bg-white p-1" role="tablist" aria-label="Ambiente do laboratório">
        {(Object.keys(modelos) as LabId[]).map((id) => (
          <button key={id} role="tab" aria-selected={lab === id} onClick={() => trocar(id)} className={cx("rounded-xl px-4 py-2 text-sm font-semibold transition-colors", lab === id ? "bg-roxo text-white" : "text-tinta-2 hover:bg-fundo-2")}>
            {id === "esqueleto" ? "Esqueleto" : "Sistema nervoso"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative h-[62dvh] min-h-[420px] overflow-hidden rounded-3xl border border-linha bg-gradient-to-b from-white via-white to-fundo-2 shadow-cartao lg:h-[calc(100dvh-250px)]">
          <Cena3D
            key={lab}
            lab={lab}
            className="h-full w-full"
            selecionada={selecionada}
            aoSelecionar={(id) => selecionar(id)}
            ocultas={ocultas}
            destaque={destaque}
            translucidas={translucidas}
            colorir={colorir}
            marcadores={idsMarcadores}
            comando={cmd.comando}
            focoInicial={destaque}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
            <div className="pointer-events-auto flex flex-wrap gap-1">
              <Alternador ativo={colorir} aoClicar={() => setColorir((v) => !v)} icone={Palette}>Cores por região</Alternador>
              <Alternador ativo={marcadores} aoClicar={() => setMarcadores((v) => !v)} icone={MapPin}>Marcadores</Alternador>
              {lab === "encefalo" && <Alternador ativo={raioX} aoClicar={() => setRaioX((v) => !v)} icone={ScanEye}>Raio-X do córtex</Alternador>}
            </div>
            {destaque && topicoParam && (
              <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg bg-petroleo px-2.5 py-1.5 text-xs font-semibold text-white">
                Em destaque: {topicoParam.titulo}
                <button onClick={() => setDestaque(null)} aria-label="Remover destaque" className="rounded p-0.5 hover:bg-white/20"><X size={13} /></button>
              </span>
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
            <BarraVistas aoEscolher={cmd.vista} className="pointer-events-auto" />
            <div className="pointer-events-auto flex flex-wrap gap-1">
              {ocultas.size > 0 && (
                <button onClick={() => setOcultas(new Set())} className="inline-flex items-center gap-1.5 rounded-lg border border-linha bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-tinta-2 hover:bg-lilas">
                  <Eye size={14} /> Exibir tudo ({ocultas.size})
                </button>
              )}
              <button onClick={() => { cmd.focar(null); }} className="inline-flex items-center gap-1.5 rounded-lg border border-linha bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-tinta-2 hover:bg-lilas">
                <RotateCcw size={14} /> Enquadrar tudo
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4 lg:h-[calc(100dvh-250px)]">
          <Cartao className="!p-4" aria-live="polite">
            {parte ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Etiqueta tom="lilas"><span className="size-2 rounded-full" style={{ background: grupo?.cor }} />{grupo?.titulo}</Etiqueta>
                    <h2 className="mt-2 text-lg font-extrabold leading-snug text-tinta">{parte.nome}</h2>
                  </div>
                  <button onClick={() => setSelecionada(null)} aria-label="Fechar detalhes" className="grid size-8 shrink-0 place-items-center rounded-lg text-suave hover:bg-fundo-2"><X size={16} /></button>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-tinta-2">{parte.desc ?? topico?.resumo ?? "Estrutura do modelo anatômico."}</p>
                {!parte.desc && topico?.localizacao && <p className="mt-2 text-[13px] leading-relaxed text-tinta-2"><strong className="text-tinta">Localização:</strong> {topico.localizacao}</p>}
                {topico && !parte.desc && topico.estruturas.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-suave">Principais acidentes</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-tinta-2">{topico.estruturas.slice(0, 5).map((e) => e.nome).join(" · ")}</p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Botao variante="secundario" className="!min-h-9 !px-3 !py-1.5 !text-xs" onClick={() => cmd.focar([parte.id])}><Focus size={14} /> Focar</Botao>
                  <Botao variante="secundario" className="!min-h-9 !px-3 !py-1.5 !text-xs" onClick={() => isolar([parte.id])}><Layers3 size={14} /> Isolar</Botao>
                  <Botao variante="secundario" className="!min-h-9 !px-3 !py-1.5 !text-xs" onClick={() => { alternar([parte.id], true); setSelecionada(null); }}><EyeOff size={14} /> Ocultar</Botao>
                  {topico && (
                    <Link href={hrefTopico(topico)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-roxo px-3 py-1.5 text-xs font-semibold text-white hover:bg-roxo-forte">
                      <BookOpen size={14} /> Ver conteúdo
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-suave">
                <strong className="text-tinta">Clique em uma estrutura</strong> do modelo ou da lista para ver nome, descrição e função.
              </p>
            )}
          </Cartao>

          <Cartao className="flex min-h-[320px] flex-1 flex-col !p-4">
            <label className="relative block">
              <span className="sr-only">Buscar estrutura</span>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-suave" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar estrutura…" className="w-full rounded-xl border border-linha bg-fundo py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-suave focus:border-roxo" />
            </label>
            <div className="rolagem-fina mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              {filtradas ? (
                filtradas.length ? <ul>{filtradas.map((p) => <Linha key={p.id} p={p} />)}</ul> : <p className="px-2 py-4 text-sm text-suave">Nenhuma estrutura encontrada.</p>
              ) : (
                modelo.grupos.map((g) => {
                  const ps = modelo.partes.filter((p) => p.grupo === g.id);
                  const todasOcultas = ps.every((p) => ocultas.has(p.id));
                  const expandido = aberto === g.id;
                  return (
                    <div key={g.id} className="mb-1">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setAberto(expandido ? null : g.id)} aria-expanded={expandido} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-tinta hover:bg-fundo-2">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ background: g.cor }} />
                          <span className="min-w-0 flex-1 truncate">{g.titulo}</span>
                          <span className="text-xs font-medium text-suave">{ps.length}</span>
                          <ChevronDown size={15} className={cx("text-suave transition-transform", expandido && "rotate-180")} />
                        </button>
                        <button onClick={() => isolar(ps.map((p) => p.id))} aria-label={`Isolar ${g.titulo}`} title="Isolar grupo" className="grid size-8 shrink-0 place-items-center rounded-lg text-suave hover:bg-fundo-2"><Layers3 size={15} /></button>
                        <button onClick={() => alternar(ps.map((p) => p.id), !todasOcultas)} aria-label={`${todasOcultas ? "Exibir" : "Ocultar"} ${g.titulo}`} aria-pressed={todasOcultas} className="grid size-8 shrink-0 place-items-center rounded-lg text-suave hover:bg-fundo-2">
                          {todasOcultas ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {expandido && <ul className="ml-3 border-l border-linha pl-2">{ps.map((p) => <Linha key={p.id} p={p} />)}</ul>}
                    </div>
                  );
                })
              )}
            </div>
          </Cartao>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Cartao>
          <h2 className="text-base font-bold text-tinta">Sobre os modelos</h2>
          <p className="mt-2 text-sm leading-relaxed text-tinta-2">
            As malhas vêm do <strong>BodyParts3D</strong> (versão 3.0), banco de estruturas anatômicas tridimensionais do Database Center for Life Science, no Japão, segmentado a partir de um corpo masculino adulto. Os modelos foram simplificados para carregar rápido no navegador, o que suaviza detalhes finos de relevo.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-suave">{CREDITO_MODELOS}.</p>
        </Cartao>
        <Cartao>
          <h2 className="text-base font-bold text-tinta">Modelos previstos</h2>
          <ul className="mt-2 space-y-3">
            {modelosPendentes.map((m) => (
              <li key={m.titulo} className="text-sm leading-relaxed text-tinta-2">
                <span className="flex items-center gap-2 font-semibold text-tinta"><Etiqueta tom="alerta">Aguardando arquivo</Etiqueta>{m.titulo}</span>
                <span className="mt-1 block text-[13px]">{m.motivo}</span>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, ChevronDown, ChevronLeft, ChevronRight, Clock, Flag, Play, RotateCw } from "lucide-react";
import { gerarIdent, hrefTopico, nomeDisciplina, questoes, topicoPorId, topicos, type Disciplina, type Questao } from "@/data";
import { dataLonga, embaralhar, formatarTempo, relogio } from "@/lib/datas";
import { correta, nomeTipo, preparar, respondida, type Item, type Resposta } from "@/lib/quiz";
import { useProgresso, type ResultadoSimulado } from "@/store/progresso";
import { QuestaoView } from "./QuestaoView";
import { Anel, Barra, Botao, BotaoLink, Cabecalho, Cartao, Etiqueta, cx } from "./ui";

type Escopo = Disciplina | "geral";
type Tipo = Questao["tipo"];
interface Config {
  escopo: Escopo;
  topico: string;
  tipos: Tipo[];
  n: number;
  tempo: number; // segundos por questão; 0 = sem limite
}

function montar(c: Config): Item[] {
  const base = questoes.filter((q) => (c.escopo === "geral" || q.d === c.escopo) && (!c.topico || q.topico === c.topico) && c.tipos.includes(q.tipo));
  let ident: Questao[] = [];
  if (c.tipos.includes("ident") && !c.topico) {
    const quantos = base.length ? Math.max(1, Math.round(c.n * 0.25)) : c.n;
    const vistos = new Set<string>();
    for (let i = 0; i < quantos; i++) {
      const d: Disciplina = c.escopo === "geral" ? (i % 2 ? "neuro" : "ossea") : c.escopo;
      const q = gerarIdent(d === "neuro" ? "encefalo" : "esqueleto", "estrutura", vistos);
      if (q) {
        vistos.add(q.correta);
        ident.push(q);
      }
    }
  }
  const escolhidas = embaralhar(base).slice(0, Math.max(0, c.n - ident.length));
  ident = ident.slice(0, c.n - escolhidas.length);
  return embaralhar([...escolhidas, ...ident]).map(preparar);
}

const tituloDe = (c: Config) => (c.topico ? (topicoPorId(c.topico)?.titulo ?? "Assunto") : c.escopo === "geral" ? "Simulado geral" : nomeDisciplina[c.escopo]);

function Chip({ ativo, aoClicar, children }: { ativo: boolean; aoClicar: () => void; children: React.ReactNode }) {
  return (
    <button onClick={aoClicar} aria-pressed={ativo} className={cx("rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors", ativo ? "border-roxo bg-lilas text-roxo-forte" : "border-linha bg-white text-tinta-2 hover:bg-fundo")}>
      {children}
    </button>
  );
}

export function Simulados() {
  const params = useSearchParams();
  const topicoInicial = topicoPorId(params.get("topico"));
  const historico = useProgresso((s) => s.simulados);
  const [config, setConfig] = useState<Config>({
    escopo: topicoInicial?.disciplina ?? "geral",
    topico: topicoInicial?.id ?? "",
    tipos: ["mc", "vf", "assoc", "ident"],
    n: 10,
    tempo: 90,
  });
  const [prova, setProva] = useState<{ itens: Item[]; config: Config } | null>(null);
  const [resultado, setResultado] = useState<{ itens: Item[]; respostas: Resposta[]; r: ResultadoSimulado } | null>(null);

  if (resultado) return <Resultado {...resultado} aoRefazer={() => setResultado(null)} />;
  if (prova)
    return (
      <Prova
        {...prova}
        aoFinalizar={(respostas, segundos) => {
          const { itens, config: c } = prova;
          const st = useProgresso.getState();
          const porTopico: ResultadoSimulado["porTopico"] = {};
          let acertos = 0;
          itens.forEach((it, i) => {
            const ok = correta(it.q, respostas[i]);
            if (ok) acertos++;
            if (it.q.tipo === "ident") st.registrarIdent(it.q.d, ok);
            else st.responder(it.q.id, ok);
            if (it.q.topico) {
              const a = (porTopico[it.q.topico] ??= { t: 0, c: 0 });
              a.t++;
              if (ok) a.c++;
            }
          });
          const r: ResultadoSimulado = { id: `sim-${Date.now()}`, data: Date.now(), titulo: tituloDe(c), disciplina: c.escopo, total: itens.length, acertos, segundos, porTopico };
          st.salvarSimulado(r);
          st.visitar({ tipo: "simulado", id: r.id, titulo: `Simulado · ${r.titulo}`, href: "/simulados" });
          setProva(null);
          setResultado({ itens, respostas, r });
          window.scrollTo({ top: 0 });
        }}
      />
    );

  const assuntos = topicos.filter((t) => (config.escopo === "geral" || t.disciplina === config.escopo) && questoes.some((q) => q.topico === t.id));
  const disponiveis = questoes.filter((q) => (config.escopo === "geral" || q.d === config.escopo) && (!config.topico || q.topico === config.topico) && config.tipos.includes(q.tipo)).length;
  const comIdent = config.tipos.includes("ident") && !config.topico;
  const maximo = comIdent ? 30 : disponiveis;
  const n = Math.min(config.n, maximo);
  const alternarTipo = (t: Tipo) => setConfig((c) => ({ ...c, tipos: c.tipos.includes(t) ? c.tipos.filter((x) => x !== t) : [...c.tipos, t] }));

  return (
    <>
      <Cabecalho sobre="Simulados" titulo="Monte seu simulado" descricao="Escolha disciplina, assunto, tipos de questão e tempo. Ao final você recebe a nota, a explicação de cada alternativa e sugestões de revisão." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Cartao className="space-y-6">
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-tinta">Disciplina</legend>
            <div className="flex flex-wrap gap-2">
              {(["geral", "neuro", "ossea"] as Escopo[]).map((e) => (
                <Chip key={e} ativo={config.escopo === e} aoClicar={() => setConfig((c) => ({ ...c, escopo: e, topico: "" }))}>
                  {e === "geral" ? "Geral (as duas)" : nomeDisciplina[e]}
                </Chip>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-bold text-tinta">
            Assunto
            <select value={config.topico} onChange={(e) => setConfig((c) => ({ ...c, topico: e.target.value }))} className="mt-2 block w-full rounded-xl border border-linha bg-white px-3 py-3 text-sm font-normal sm:max-w-md">
              <option value="">Todos os assuntos</option>
              {assuntos.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-tinta">Tipos de questão</legend>
            <div className="flex flex-wrap gap-2">
              {(["mc", "vf", "assoc", "ident"] as Tipo[]).map((t) => (
                <Chip key={t} ativo={config.tipos.includes(t) && !(t === "ident" && !!config.topico)} aoClicar={() => alternarTipo(t)}>
                  {nomeTipo[t]}
                </Chip>
              ))}
            </div>
            {config.topico && <p className="mt-2 text-xs text-suave">A identificação no modelo 3D entra apenas em simulados por disciplina ou gerais.</p>}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-tinta">Número de questões</legend>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20].map((v) => (
                <Chip key={v} ativo={config.n === v} aoClicar={() => setConfig((c) => ({ ...c, n: v }))}>{v}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-tinta">Cronômetro</legend>
            <div className="flex flex-wrap gap-2">
              {[[0, "Sem limite"], [60, "1 min por questão"], [90, "1 min 30 s por questão"], [120, "2 min por questão"]].map(([v, r]) => (
                <Chip key={v} ativo={config.tempo === v} aoClicar={() => setConfig((c) => ({ ...c, tempo: v as number }))}>{r}</Chip>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3 border-t border-linha pt-5">
            <Botao disabled={n < 1} onClick={() => setProva({ itens: montar({ ...config, n }), config: { ...config, n } })}>
              <Play size={16} /> Iniciar simulado
            </Botao>
            <p className="text-sm text-suave">
              {n < 1 ? "Nenhuma questão disponível com esses filtros." : `${n} ${n === 1 ? "questão" : "questões"}${n < config.n ? " (todas as disponíveis)" : ""} · ${config.tempo ? `tempo total de ${formatarTempo(n * config.tempo)}` : "sem limite de tempo"}`}
            </p>
          </div>
        </Cartao>

        <Cartao className="self-start">
          <h2 className="text-lg font-bold">Histórico de simulados</h2>
          {historico.length ? (
            <ul className="mt-3 divide-y divide-linha">
              {historico.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-tinta">{r.titulo}</p>
                    <p className="text-xs text-suave">{dataLonga(r.data)} · {r.total} questões · {formatarTempo(r.segundos)}</p>
                  </div>
                  <Etiqueta tom={r.acertos / r.total >= 0.7 ? "ok" : r.acertos / r.total >= 0.5 ? "alerta" : "erro"}>{Math.round((r.acertos / r.total) * 100)}%</Etiqueta>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-suave">Você ainda não fez nenhum simulado.</p>
          )}
        </Cartao>
      </div>
    </>
  );
}

function Prova({ itens, config, aoFinalizar }: { itens: Item[]; config: Config; aoFinalizar: (r: Resposta[], segundos: number) => void }) {
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>(() => itens.map(() => undefined));
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const [seg, setSeg] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const limite = config.tempo * itens.length;
  const ref = useRef({ respostas });
  useEffect(() => {
    ref.current = { respostas };
  }, [respostas]);

  useEffect(() => {
    const id = window.setInterval(() => setSeg((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (limite && seg >= limite) aoFinalizar(ref.current.respostas, limite);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg, limite]);

  const item = itens[i];
  const feitas = itens.filter((it, k) => respondida(it.q, respostas[k])).length;
  const restante = limite ? Math.max(0, limite - seg) : seg;
  const pouco = !!limite && restante <= 60;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-[61px] z-20 -mx-4 mb-5 border-b border-linha bg-fundo/90 px-4 py-3 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3">
          <h1 className="min-w-0 flex-1 truncate font-display text-lg font-extrabold">{tituloDe(config)}</h1>
          <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums", pouco ? "bg-erro-fundo text-erro" : "bg-white text-tinta")} role="timer" aria-label={limite ? "Tempo restante" : "Tempo decorrido"}>
            <Clock size={15} /> {relogio(restante)}
          </span>
          <Botao variante="petroleo" className="!min-h-9 !py-1.5" onClick={() => (feitas < itens.length ? setConfirmar(true) : aoFinalizar(respostas, seg))}>
            <Flag size={15} /> Finalizar
          </Botao>
        </div>
        <Barra valor={feitas / itens.length} className="mt-3" rotulo="Questões respondidas" />
      </div>

      {confirmar && (
        <Cartao className="mb-5 border-alerta/40 bg-alerta-fundo" role="alertdialog" aria-label="Confirmar finalização">
          <p className="text-sm font-semibold text-tinta">
            Faltam {itens.length - feitas} {itens.length - feitas === 1 ? "questão" : "questões"} sem resposta. Finalizar mesmo assim?
          </p>
          <div className="mt-3 flex gap-2">
            <Botao variante="petroleo" onClick={() => aoFinalizar(respostas, seg)}>Finalizar agora</Botao>
            <Botao variante="fantasma" className="bg-white" onClick={() => setConfirmar(false)}>Continuar respondendo</Botao>
          </div>
        </Cartao>
      )}

      <Cartao>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Etiqueta tom="lilas">Questão {i + 1} de {itens.length}</Etiqueta>
          <Etiqueta tom="neutro">{nomeTipo[item.q.tipo]}</Etiqueta>
          {topicoPorId(item.q.topico) && <Etiqueta tom="agua">{topicoPorId(item.q.topico)!.titulo}</Etiqueta>}
          <button
            onClick={() => setMarcadas((m) => { const n = new Set(m); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
            aria-pressed={marcadas.has(i)}
            className={cx("ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold", marcadas.has(i) ? "bg-alerta-fundo text-alerta" : "text-suave hover:bg-fundo-2")}
          >
            {marcadas.has(i) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {marcadas.has(i) ? "Marcada para revisão" : "Marcar para revisão"}
          </button>
        </div>
        <QuestaoView key={item.q.id} item={item} resposta={respostas[i]} aoResponder={(r) => setRespostas((a) => a.map((x, k) => (k === i ? r : x)))} revelado={false} />
        <div className="mt-6 flex justify-between gap-2">
          <Botao variante="fantasma" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft size={16} /> Anterior</Botao>
          {i < itens.length - 1 ? (
            <Botao onClick={() => setI(i + 1)}>Próxima <ChevronRight size={16} /></Botao>
          ) : (
            <Botao variante="petroleo" onClick={() => (feitas < itens.length ? setConfirmar(true) : aoFinalizar(respostas, seg))}><Flag size={16} /> Finalizar</Botao>
          )}
        </div>
      </Cartao>

      <nav className="mt-5" aria-label="Navegação entre questões">
        <div className="flex flex-wrap gap-1.5">
          {itens.map((it, k) => {
            const ok = respondida(it.q, respostas[k]);
            return (
              <button
                key={k}
                onClick={() => setI(k)}
                aria-current={k === i ? "step" : undefined}
                aria-label={`Questão ${k + 1}${ok ? ", respondida" : ", sem resposta"}${marcadas.has(k) ? ", marcada para revisão" : ""}`}
                className={cx(
                  "relative grid size-10 place-items-center rounded-xl border text-sm font-bold tabular-nums",
                  k === i ? "border-roxo bg-roxo text-white" : ok ? "border-lilas-2 bg-lilas text-roxo-forte" : "border-linha bg-white text-suave",
                )}
              >
                {k + 1}
                {marcadas.has(k) && <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-[#e0a23a]" />}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-suave">Lilás: respondida · ponto âmbar: marcada para revisão.</p>
      </nav>
    </div>
  );
}

function Resultado({ itens, respostas, r, aoRefazer }: { itens: Item[]; respostas: Resposta[]; r: ResultadoSimulado; aoRefazer: () => void }) {
  const pct = r.total ? r.acertos / r.total : 0;
  const [abertas, setAbertas] = useState<Set<number>>(() => new Set(itens.map((_, k) => k).filter((k) => !correta(itens[k].q, respostas[k]))));
  const [filtro, setFiltro] = useState<"todas" | "erradas" | "certas">("todas");
  const porTopico = useMemo(
    () => Object.entries(r.porTopico).map(([id, v]) => ({ topico: topicoPorId(id)!, ...v, pct: v.c / v.t })).filter((x) => x.topico).sort((a, b) => a.pct - b.pct || b.t - a.t),
    [r],
  );
  const fracos = porTopico.filter((x) => x.pct < 0.7);
  const mensagem = pct >= 0.9 ? "Excelente desempenho!" : pct >= 0.7 ? "Bom resultado — faltam poucos ajustes." : pct >= 0.5 ? "Você está no caminho. Revise os assuntos abaixo." : "Hora de reforçar a base: comece pelos assuntos sugeridos.";

  return (
    <div className="mx-auto max-w-4xl">
      <Cabecalho sobre="Resultado do simulado" titulo={r.titulo} acoes={<Botao variante="secundario" onClick={aoRefazer}><RotateCw size={16} /> Novo simulado</Botao>} />
      <Cartao className="flex flex-wrap items-center gap-6">
        <Anel valor={pct} tamanho={132} espessura={12} cor={pct >= 0.7 ? "var(--color-ok)" : pct >= 0.5 ? "#e0a23a" : "var(--color-erro)"}>
          <span>
            <span className="block font-display text-3xl font-extrabold tabular-nums">{(pct * 10).toFixed(1).replace(".", ",")}</span>
            <span className="block text-xs font-semibold text-suave">nota</span>
          </span>
        </Anel>
        <div className="min-w-0 flex-1 basis-60">
          <p className="font-display text-xl font-bold text-tinta">{mensagem}</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Acertos", `${Math.round(pct * 100)}%`], ["Corretas", r.acertos], ["Incorretas", r.total - r.acertos], ["Tempo", formatarTempo(r.segundos)]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-fundo px-3 py-2.5">
                <dt className="text-xs font-semibold text-suave">{k}</dt>
                <dd className="font-display text-lg font-extrabold tabular-nums text-tinta">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Cartao>

      {porTopico.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Cartao>
            <h2 className="text-lg font-bold">Desempenho por assunto</h2>
            <ul className="mt-3 space-y-3">
              {porTopico.map((x) => (
                <li key={x.topico.id}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-tinta">{x.topico.titulo}</span>
                    <span className="shrink-0 tabular-nums text-suave">{x.c}/{x.t}</span>
                  </div>
                  <Barra valor={x.pct} cor={x.pct >= 0.7 ? "var(--color-ok)" : x.pct >= 0.5 ? "#e0a23a" : "var(--color-erro)"} rotulo={`Acertos em ${x.topico.titulo}`} />
                </li>
              ))}
            </ul>
          </Cartao>
          <Cartao>
            <h2 className="text-lg font-bold">Sugestões de revisão</h2>
            {fracos.length ? (
              <ul className="mt-3 space-y-3">
                {fracos.slice(0, 5).map((x) => (
                  <li key={x.topico.id} className="rounded-xl border border-linha p-3">
                    <p className="text-sm font-bold text-tinta">{x.topico.titulo}</p>
                    <p className="mt-0.5 text-xs text-suave">Você acertou {x.c} de {x.t} — vale reler o conteúdo e reforçar com flashcards.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href={hrefTopico(x.topico)} className="rounded-lg bg-lilas px-2.5 py-1.5 text-xs font-semibold text-roxo-forte hover:bg-lilas-2">Reler conteúdo</Link>
                      <Link href={`/flashcards/estudar?topico=${x.topico.id}`} className="rounded-lg bg-agua px-2.5 py-1.5 text-xs font-semibold text-petroleo-forte">Flashcards do assunto</Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-suave">Nenhum assunto ficou abaixo de 70%. Para manter o nível, faça a revisão do dia nos flashcards ou tente um simulado mais longo.</p>
            )}
          </Cartao>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Correção comentada</h2>
        <div className="flex gap-1.5" role="group" aria-label="Filtrar questões">
          {(["todas", "erradas", "certas"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)} aria-pressed={filtro === f} className={cx("rounded-full px-3 py-1.5 text-xs font-semibold capitalize", filtro === f ? "bg-roxo text-white" : "bg-white text-tinta-2 hover:bg-lilas")}>{f}</button>
          ))}
        </div>
      </div>
      <div className="mt-3 space-y-3">
        {itens.map((it, k) => {
          const ok = correta(it.q, respostas[k]);
          if ((filtro === "erradas" && ok) || (filtro === "certas" && !ok)) return null;
          const aberta = abertas.has(k);
          return (
            <Cartao key={k} className="!p-0">
              <button
                onClick={() => setAbertas((a) => { const n = new Set(a); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
                aria-expanded={aberta}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className={cx("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", ok ? "bg-ok-fundo text-ok" : "bg-erro-fundo text-erro")}>{k + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-tinta">{it.q.p}</span>
                <Etiqueta tom={ok ? "ok" : "erro"}>{ok ? "Correta" : "Incorreta"}</Etiqueta>
                <ChevronDown size={16} className={cx("shrink-0 text-suave transition-transform", aberta && "rotate-180")} />
              </button>
              {aberta && (
                <div className="border-t border-linha px-5 py-5">
                  <QuestaoView item={it} resposta={respostas[k]} aoResponder={() => {}} revelado />
                </div>
              )}
            </Cartao>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        <Botao onClick={aoRefazer}><RotateCw size={16} /> Novo simulado</Botao>
        <BotaoLink href="/desempenho" variante="secundario">Ver meu desempenho</BotaoLink>
      </div>
    </div>
  );
}


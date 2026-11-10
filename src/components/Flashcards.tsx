"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Flame, Layers, RotateCw, Sparkles } from "lucide-react";
import { CORES, baralhos, flashcards, topicoPorId, type BaralhoId, type Flashcard } from "@/data";
import { dataLonga, embaralhar } from "@/lib/datas";
import { resumoCards } from "@/lib/estatisticas";
import { ehDificil, novoEstado, proximoIntervalo, rotulosNota, statusDe, textoIntervalo, venceu, type Nota, type StatusCard } from "@/lib/srs";
import { useProgresso } from "@/store/progresso";
import { Barra, Botao, BotaoLink, Cabecalho, Cartao, Etiqueta, Vazio, cx } from "./ui";

const NOVOS_POR_SESSAO = 15;
const rotuloStatus: Record<StatusCard, { t: string; tom: "neutro" | "alerta" | "lilas" | "ok" }> = {
  novo: { t: "Novo", tom: "neutro" },
  aprendendo: { t: "Aprendendo", tom: "alerta" },
  revisao: { t: "Em revisão", tom: "lilas" },
  dominado: { t: "Dominado", tom: "ok" },
};

export function PainelFlashcards() {
  const cards = useProgresso((s) => s.cards);
  const [aba, setAba] = useState<BaralhoId>("neuro");
  const [assunto, setAssunto] = useState("");
  const geral = resumoCards(cards);

  const { total, bons } = useMemo(() => {
    let total = 0, bons = 0;
    for (const e of Object.values(cards)) for (const [, n] of e.hist) { total++; if (n >= 3) bons++; }
    return { total, bons };
  }, [cards]);

  const historico = useMemo(
    () =>
      flashcards
        .flatMap((c) => (cards[c.id]?.hist ?? []).map(([ts, nota]) => ({ c, ts, nota })))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 12),
    [cards],
  );

  const doBaralho = flashcards.filter((c) => c.baralho === aba);
  const assuntos = [...new Set(doBaralho.map((c) => c.topico))];
  const lista = doBaralho.filter((c) => !assunto || c.topico === assunto);

  return (
    <>
      <Cabecalho
        sobre="Flashcards"
        titulo="Repetição espaçada"
        descricao="Os cartões voltam no momento certo: os que você erra reaparecem logo, os que domina se espaçam por semanas. Cartões difíceis têm prioridade na fila."
        acoes={
          <>
            <BotaoLink href="/flashcards/estudar"><Sparkles size={16} /> Revisão do dia ({geral.vencidos + Math.min(geral.novos, NOVOS_POR_SESSAO)})</BotaoLink>
            {geral.dificeis > 0 && <BotaoLink href="/flashcards/estudar?modo=dificeis" variante="secundario"><Flame size={16} /> Cartões difíceis ({geral.dificeis})</BotaoLink>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Para revisar hoje", geral.vencidos, "text-roxo-forte"],
          ["Dominados", geral.dominados, "text-ok"],
          ["Difíceis", geral.dificeis, "text-erro"],
          ["Taxa de acertos", total ? `${Math.round((bons / total) * 100)}%` : "—", "text-petroleo-forte"],
        ].map(([r, v, c]) => (
          <Cartao key={r as string} className="!p-4">
            <p className="text-xs font-semibold text-suave">{r}</p>
            <p className={cx("mt-1 font-display text-2xl font-extrabold tabular-nums", c as string)}>{v}</p>
          </Cartao>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Baralhos</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {baralhos.map((b) => {
          const r = resumoCards(cards, (id) => id.startsWith(b.id + "-"));
          const fila = r.vencidos + Math.min(r.novos, NOVOS_POR_SESSAO);
          return (
            <Cartao key={b.id} className="flex flex-col !p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: CORES[b.disciplina] }}><Layers size={18} /></span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-tinta">{b.titulo}</h3>
                  <p className="text-[13px] text-suave">{b.descricao}</p>
                </div>
              </div>
              <div className="mt-4 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-fundo-2" role="img" aria-label={`${r.dominados} dominados, ${r.revisao} em revisão, ${r.aprendendo} aprendendo, ${r.novos} novos`}>
                <span style={{ width: `${(r.dominados / r.total) * 100}%` }} className="bg-ok" />
                <span style={{ width: `${(r.revisao / r.total) * 100}%` }} className="bg-roxo" />
                <span style={{ width: `${(r.aprendendo / r.total) * 100}%` }} className="bg-[#e0a23a]" />
              </div>
              <p className="mt-2 flex-1 text-xs text-suave">
                {r.total} cartões · {r.dominados} dominados · {r.revisao + r.aprendendo} em andamento · {r.novos} novos
              </p>
              <BotaoLink href={`/flashcards/estudar?baralho=${b.id}`} className="mt-4 w-full" variante={fila ? "primario" : "secundario"}>
                {fila ? `Estudar ${fila} ${fila === 1 ? "cartão" : "cartões"}` : "Revisão livre"}
              </BotaoLink>
            </Cartao>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Cartao>
          <h2 className="text-lg font-bold">Todos os cartões</h2>
          <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Baralho">
            {baralhos.map((b) => (
              <button key={b.id} role="tab" aria-selected={aba === b.id} onClick={() => { setAba(b.id); setAssunto(""); }} className={cx("rounded-full px-3 py-1.5 text-xs font-semibold", aba === b.id ? "bg-roxo text-white" : "bg-fundo-2 text-tinta-2 hover:bg-lilas")}>
                {b.titulo}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs font-semibold text-suave">
            Assunto
            <select value={assunto} onChange={(e) => setAssunto(e.target.value)} className="mt-1 block w-full rounded-xl border border-linha bg-white px-3 py-2.5 text-sm font-normal text-tinta sm:w-72">
              <option value="">Todos os assuntos</option>
              {assuntos.map((a) => <option key={a} value={a}>{topicoPorId(a)?.titulo ?? a}</option>)}
            </select>
          </label>
          <ul className="mt-4 divide-y divide-linha">
            {lista.map((c) => {
              const e = cards[c.id];
              const st = rotuloStatus[statusDe(e)];
              return (
                <li key={c.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="text-sm font-semibold text-tinta">{c.frente}</p>
                    <p className="mt-0.5 text-[13px] text-suave">{c.verso}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {ehDificil(e) && <Etiqueta tom="erro">Difícil</Etiqueta>}
                    <Etiqueta tom={st.tom}>{st.t}</Etiqueta>
                  </div>
                </li>
              );
            })}
          </ul>
        </Cartao>
        <Cartao className="self-start">
          <h2 className="text-lg font-bold">Histórico de revisão</h2>
          {historico.length ? (
            <ul className="mt-3 space-y-3">
              {historico.map((h, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-tinta">{h.c.frente}</p>
                    <p className="text-xs text-suave">{dataLonga(h.ts)}</p>
                  </div>
                  <Etiqueta tom={h.nota === 1 ? "erro" : h.nota === 2 ? "alerta" : h.nota === 3 ? "lilas" : "ok"}>{rotulosNota[h.nota]}</Etiqueta>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-suave">Suas revisões aparecerão aqui.</p>
          )}
        </Cartao>
      </div>
    </>
  );
}

const coresNota: Record<Nota, string> = {
  1: "border-erro/40 bg-erro-fundo text-erro hover:bg-[#f6d3dc]",
  2: "border-alerta/40 bg-alerta-fundo text-alerta hover:bg-[#f6e6c2]",
  3: "border-roxo/30 bg-lilas text-roxo-forte hover:bg-lilas-2",
  4: "border-ok/40 bg-ok-fundo text-ok hover:bg-[#cfeedd]",
};

export function SessaoFlashcards() {
  const params = useSearchParams();
  const baralho = params.get("baralho");
  const topico = params.get("topico");
  const dificeis = params.get("modo") === "dificeis";
  const avaliarCard = useProgresso((s) => s.avaliarCard);
  const visitar = useProgresso((s) => s.visitar);
  const estados = useProgresso((s) => s.cards);

  const pool = useMemo(
    () => flashcards.filter((c) => (!baralho || c.baralho === baralho) && (!topico || c.topico === topico)),
    [baralho, topico],
  );
  const titulo = dificeis ? "Cartões difíceis" : topico ? (topicoPorId(topico)?.titulo ?? "Assunto") : baralho ? (baralhos.find((b) => b.id === baralho)?.titulo ?? "Baralho") : "Revisão do dia";

  const montar = useCallback(
    (livre: boolean): Flashcard[] => {
      const e = useProgresso.getState().cards;
      if (dificeis) return pool.filter((c) => ehDificil(e[c.id])).sort((a, b) => e[a.id].facil - e[b.id].facil);
      if (livre) return embaralhar(pool);
      const vencidos = pool.filter((c) => venceu(e[c.id])).sort((a, b) => e[a.id].facil - e[b.id].facil || e[b.id].lapsos - e[a.id].lapsos);
      const novos = pool.filter((c) => !e[c.id]).slice(0, topico ? pool.length : NOVOS_POR_SESSAO);
      return [...vencidos, ...novos];
    },
    [pool, dificeis, topico],
  );

  const [fila, setFila] = useState<Flashcard[]>([]);
  const [inicial, setInicial] = useState(0);
  const [virado, setVirado] = useState(false);
  const [notas, setNotas] = useState<Record<Nota, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [pronto, setPronto] = useState(false);

  const iniciar = useCallback(
    (livre = false) => {
      const f = montar(livre);
      setFila(f);
      setInicial(f.length);
      setVirado(false);
      setNotas({ 1: 0, 2: 0, 3: 0, 4: 0 });
      setPronto(true);
    },
    [montar],
  );
  useEffect(() => {
    iniciar();
    const qs = params.toString();
    visitar({ tipo: "flashcards", id: qs || "dia", titulo: `Flashcards · ${titulo}`, href: `/flashcards/estudar${qs ? "?" + qs : ""}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baralho, topico, dificeis]);

  const atual = fila[0];
  const feitos = notas[1] + notas[2] + notas[3] + notas[4];

  const avaliar = useCallback(
    (nota: Nota) => {
      if (!atual) return;
      avaliarCard(atual.id, nota);
      setNotas((n) => ({ ...n, [nota]: n[nota] + 1 }));
      setFila(([c, ...resto]) => {
        if (nota !== 1) return resto;
        const pos = Math.min(3, resto.length);
        return [...resto.slice(0, pos), c, ...resto.slice(pos)];
      });
      setVirado(false);
    },
    [atual, avaliarCard],
  );

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,select,textarea,a")) return;
      if (e.key === " " || e.key === "Enter") {
        if ((e.target as HTMLElement).closest("button")) return;
        e.preventDefault();
        setVirado((v) => !v);
      } else if (virado && ["1", "2", "3", "4"].includes(e.key)) avaliar(Number(e.key) as Nota);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [virado, avaliar]);

  const voltar = (
    <Link href="/flashcards" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-suave hover:text-roxo-forte">
      <ArrowLeft size={15} /> Flashcards
    </Link>
  );
  if (!pronto) return null;

  if (!atual) {
    const acertos = notas[3] + notas[4];
    return (
      <>
        {voltar}
        <Cabecalho sobre="Flashcards" titulo={titulo} />
        {feitos > 0 ? (
          <Cartao className="mx-auto max-w-xl text-center">
            <p className="font-display text-2xl font-extrabold text-tinta">Sessão concluída</p>
            <p className="mt-1 text-sm text-suave">{feitos} avaliações · {Math.round((acertos / feitos) * 100)}% marcadas como “Bom” ou “Fácil”</p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {([1, 2, 3, 4] as Nota[]).map((n) => (
                <div key={n} className={cx("rounded-xl border px-2 py-3", coresNota[n])}>
                  <p className="font-display text-xl font-extrabold tabular-nums">{notas[n]}</p>
                  <p className="text-xs font-semibold">{rotulosNota[n]}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Botao variante="secundario" onClick={() => iniciar(true)}><RotateCw size={16} /> Revisão livre</Botao>
              <BotaoLink href="/flashcards">Voltar aos baralhos</BotaoLink>
            </div>
          </Cartao>
        ) : (
          <Vazio
            titulo={dificeis ? "Nenhum cartão difícil no momento" : "Tudo em dia por aqui"}
            texto={dificeis ? "Cartões entram nesta lista quando você erra duas ou mais vezes ou os marca repetidamente como difíceis." : "Não há cartões vencidos nem novos neste conjunto. Você pode fazer uma revisão livre, que também atualiza o agendamento."}
            acao={!dificeis && pool.length > 0 ? <Botao onClick={() => iniciar(true)}><RotateCw size={16} /> Revisão livre ({pool.length})</Botao> : <BotaoLink href="/flashcards">Voltar aos baralhos</BotaoLink>}
          />
        )}
      </>
    );
  }

  const estado = estados[atual.id];
  const st = rotuloStatus[statusDe(estado)];
  const base = estado ?? novoEstado();
  return (
    <>
      {voltar}
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="min-w-0 flex-1 truncate font-display text-xl font-extrabold">{titulo}</h1>
          <span className="text-xs font-semibold tabular-nums text-suave">{fila.length} na fila</span>
        </div>
        <Barra valor={inicial ? 1 - fila.length / Math.max(inicial, fila.length) : 0} rotulo="Andamento da sessão" />

        <AnimatePresence mode="wait">
          <motion.div key={atual.id + feitos} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="mt-5">
            <button onClick={() => setVirado((v) => !v)} className="vira block w-full text-left" aria-label={virado ? "Ver a pergunta" : "Virar o cartão para ver a resposta"}>
              <div className={cx("vira-interno relative h-[320px] sm:h-[360px]", virado && "virado")}>
                <div className="vira-face cartao absolute inset-0 flex flex-col p-6 sm:p-8" aria-hidden={virado}>
                  <div className="flex items-center gap-2">
                    <Etiqueta tom="lilas">{topicoPorId(atual.topico)?.titulo}</Etiqueta>
                    <Etiqueta tom={st.tom}>{st.t}</Etiqueta>
                    {ehDificil(estado) && <Etiqueta tom="erro">Difícil</Etiqueta>}
                  </div>
                  <p className="my-auto text-center font-display text-xl font-bold leading-snug text-tinta sm:text-2xl">{atual.frente}</p>
                  <p className="text-center text-xs font-medium text-suave">Toque para ver a resposta · espaço</p>
                </div>
                <div className="vira-face vira-verso absolute inset-0 flex flex-col rounded-[20px] border border-lilas-2 bg-gradient-to-br from-lilas to-white p-6 shadow-cartao sm:p-8" aria-hidden={!virado}>
                  <p className="text-xs font-bold uppercase tracking-wider text-roxo">Resposta</p>
                  <p className="my-auto text-center text-lg font-semibold leading-relaxed text-tinta sm:text-xl">{atual.verso}</p>
                  <p className="text-center text-xs text-suave">{atual.frente}</p>
                </div>
              </div>
            </button>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 min-h-[92px]">
          {virado ? (
            <div>
              <p className="mb-2 text-center text-xs font-semibold text-suave">Como foi lembrar desta resposta?</p>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as Nota[]).map((n) => (
                  <button key={n} onClick={() => avaliar(n)} className={cx("rounded-xl border px-1 py-2.5 text-center transition-colors", coresNota[n])}>
                    <span className="block text-sm font-bold">{rotulosNota[n]}</span>
                    <span className="block text-[11px] font-medium opacity-80">{textoIntervalo(proximoIntervalo(base, n))}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Botao className="w-full" onClick={() => setVirado(true)}>Mostrar resposta</Botao>
          )}
        </div>
      </div>
    </>
  );
}

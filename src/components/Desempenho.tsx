"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CORES, hrefTopico, nomeDisciplina, questoesDoTopico, topicos, type Disciplina } from "@/data";
import { dataLonga, formatarTempo } from "@/lib/datas";
import { acertoPorDisciplina, dominio, dominioDisciplina, resumoCards, sequencia, tempoTotal } from "@/lib/estatisticas";
import { descricaoPeriodo, rotuloPeriodo, serieAcertos, serieTempo, type Periodo } from "@/lib/series";
import { useProgresso } from "@/store/progresso";
import { GraficoAcertos, GraficoTempo, Legenda } from "./graficos";
import { Anel, BotaoLink, Cabecalho, Cartao, Dominio, Etiqueta, cx, nivelDominio } from "./ui";

export function Desempenho() {
  const s = useProgresso();
  const [periodo, setPeriodo] = useState<Periodo>("diaria");
  const [filtro, setFiltro] = useState<Disciplina | "todas">("todas");
  const [ordem, setOrdem] = useState<"menor" | "maior" | "conteudo">("menor");
  const [tabela, setTabela] = useState(false);

  const tempo = useMemo(() => serieTempo(s.dias, periodo), [s.dias, periodo]);
  const acertos = useMemo(() => serieAcertos(s.dias, periodo), [s.dias, periodo]);
  const cards = resumoCards(s.cards);
  const segPor = (k: "neuro" | "ossea" | "geral") => Object.values(s.dias).reduce((a, d) => a + d.seg[k], 0);

  const linhas = useMemo(() => {
    const l = topicos
      .filter((t) => filtro === "todas" || t.disciplina === filtro)
      .map((t) => {
        let tent = 0, cert = 0;
        for (const q of questoesDoTopico(t.id)) {
          const r = s.questoes[q.id];
          if (r) { tent += r.t; cert += r.c; }
        }
        return { t, d: dominio(t, s), tent, cert };
      });
    if (ordem !== "conteudo") l.sort((a, b) => (ordem === "menor" ? a.d - b.d : b.d - a.d));
    return l;
  }, [s, filtro, ordem]);

  const seletor = (
    <div className="inline-flex rounded-xl border border-linha bg-white p-1" role="group" aria-label="Período">
      {(Object.keys(rotuloPeriodo) as Periodo[]).map((p) => (
        <button key={p} onClick={() => setPeriodo(p)} aria-pressed={periodo === p} className={cx("rounded-lg px-3 py-1.5 text-xs font-semibold", periodo === p ? "bg-roxo text-white" : "text-tinta-2 hover:bg-fundo-2")}>
          {rotuloPeriodo[p]}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Cabecalho sobre="Estatísticas" titulo="Meu desempenho" descricao="Acompanhe sua evolução, descubra os assuntos que pedem reforço e veja quanto já está dominado." acoes={seletor} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Tempo de estudo", formatarTempo(tempoTotal(s.dias)), `Neuro ${formatarTempo(segPor("neuro"))} · Óssea ${formatarTempo(segPor("ossea"))}`],
          ["Sequência atual", `${sequencia(s.dias)} dias`, `${Object.keys(s.dias).length} dias com atividade`],
          ["Flashcards dominados", `${cards.dominados}/${cards.total}`, `${cards.revisao + cards.aprendendo} em andamento`],
          ["Precisam de revisão", String(cards.vencidos), `${cards.dificeis} marcados como difíceis`],
        ].map(([r, v, d]) => (
          <Cartao key={r} className="!p-4">
            <p className="text-xs font-semibold text-suave">{r}</p>
            <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-tinta">{v}</p>
            <p className="mt-0.5 text-xs text-suave">{d}</p>
          </Cartao>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Cartao>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Tempo de estudo</h2>
              <p className="text-xs text-suave">Minutos por disciplina · {descricaoPeriodo[periodo]}</p>
            </div>
            <button onClick={() => setTabela((v) => !v)} aria-pressed={tabela} className="rounded-lg border border-linha px-2.5 py-1.5 text-xs font-semibold text-tinta-2 hover:bg-fundo-2">
              {tabela ? "Ver gráficos" : "Ver em tabela"}
            </button>
          </div>
          {tabela ? (
            <div className="rolagem-fina mt-3 max-h-[300px] overflow-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="sticky top-0 bg-white text-xs text-suave">
                  <tr><th className="py-2 font-semibold">Período</th><th className="font-semibold">Neuro</th><th className="font-semibold">Óssea</th><th className="font-semibold">Outros</th><th className="font-semibold">Questões</th><th className="font-semibold">Acertos</th></tr>
                </thead>
                <tbody className="tabular-nums text-tinta-2">
                  {tempo.map((p, i) => (
                    <tr key={i} className="border-t border-linha">
                      <td className="py-2 font-medium text-tinta">{p.rotulo}</td><td>{p.neuro} min</td><td>{p.ossea} min</td><td>{p.geral} min</td><td>{acertos[i].questoes}</td><td>{acertos[i].acerto === null ? "—" : `${acertos[i].acerto}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="mt-3"><Legenda /></div>
              <div className="mt-2"><GraficoTempo dados={tempo} altura={260} /></div>
            </>
          )}
        </Cartao>
        <Cartao>
          <h2 className="text-lg font-bold">Taxa de acertos</h2>
          <p className="text-xs text-suave">Questões de fixação, simulados e identificação · {descricaoPeriodo[periodo]}</p>
          {acertos.some((a) => a.acerto !== null) ? (
            <div className="mt-4"><GraficoAcertos dados={acertos} altura={280} /></div>
          ) : (
            <p className="mt-6 rounded-xl bg-fundo px-4 py-8 text-center text-sm text-suave">Responda questões para ver sua taxa de acertos ao longo do tempo.</p>
          )}
        </Cartao>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Desempenho por disciplina</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {(["neuro", "ossea"] as Disciplina[]).map((d) => {
          const dom = dominioDisciplina(d, s);
          const ac = acertoPorDisciplina(s, d);
          const ts = topicos.filter((t) => t.disciplina === d);
          const lidos = ts.filter((t) => s.topicos[t.id]?.lido).length;
          const c = resumoCards(s.cards, (id) => (d === "neuro" ? id.startsWith("neuro-") : !id.startsWith("neuro-")));
          return (
            <Cartao key={d} className="flex flex-wrap items-center gap-5">
              <Anel valor={dom} tamanho={104} espessura={10} cor={CORES[d]}>
                <span className="font-display text-xl font-extrabold tabular-nums">{Math.round(dom * 100)}%</span>
              </Anel>
              <div className="min-w-0 flex-1 basis-48">
                <h3 className="font-display text-base font-bold">{nomeDisciplina[d]}</h3>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-suave">Conteúdos estudados</dt><dd className="font-semibold tabular-nums">{lidos}/{ts.length}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-suave">Acertos em questões</dt><dd className="font-semibold tabular-nums">{ac.t ? `${Math.round((ac.c / ac.t) * 100)}% (${ac.c}/${ac.t})` : "—"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-suave">Flashcards dominados</dt><dd className="font-semibold tabular-nums">{c.dominados}/{c.total}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-suave">Identificação no 3D</dt><dd className="font-semibold tabular-nums">{s.ident[d].t ? `${s.ident[d].c}/${s.ident[d].t}` : "—"}</dd></div>
                </dl>
              </div>
            </Cartao>
          );
        })}
      </div>

      <Cartao className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Domínio por assunto</h2>
            <p className="text-xs text-suave">Combina leitura (20%), acertos nas questões (40%) e maturidade dos flashcards (40%).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)} aria-label="Filtrar por disciplina" className="rounded-xl border border-linha bg-white px-3 py-2 text-sm">
              <option value="todas">Todas as disciplinas</option>
              <option value="neuro">Neuroanatomia</option>
              <option value="ossea">Anatomia óssea</option>
            </select>
            <select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)} aria-label="Ordenar" className="rounded-xl border border-linha bg-white px-3 py-2 text-sm">
              <option value="menor">Menor domínio primeiro</option>
              <option value="maior">Maior domínio primeiro</option>
              <option value="conteudo">Ordem do conteúdo</option>
            </select>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-linha">
          {linhas.map(({ t, d, tent, cert }) => (
            <li key={t.id} className="grid items-center gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
              <Link href={hrefTopico(t)} className="flex min-w-0 items-center gap-2 text-sm font-semibold text-tinta hover:text-roxo-forte">
                <span className="size-2 shrink-0 rounded-full" style={{ background: CORES[t.disciplina] }} />
                <span className="truncate">{t.titulo}</span>
              </Link>
              <Dominio valor={d} cor={CORES[t.disciplina]} />
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="text-xs tabular-nums text-suave">{tent ? `${cert}/${tent} acertos` : "sem questões"}</span>
                <Etiqueta tom={nivelDominio(d).tom}>{nivelDominio(d).rotulo}</Etiqueta>
              </div>
            </li>
          ))}
        </ul>
      </Cartao>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Cartao>
          <h2 className="text-lg font-bold">Flashcards</h2>
          <div className="mt-4 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-fundo-2" role="img" aria-label={`${cards.dominados} dominados, ${cards.revisao} em revisão, ${cards.aprendendo} aprendendo, ${cards.novos} novos`}>
            <span className="bg-ok" style={{ width: `${(cards.dominados / cards.total) * 100}%` }} />
            <span className="bg-roxo" style={{ width: `${(cards.revisao / cards.total) * 100}%` }} />
            <span className="bg-[#e0a23a]" style={{ width: `${(cards.aprendendo / cards.total) * 100}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Dominados", cards.dominados, "bg-ok"], ["Em revisão", cards.revisao, "bg-roxo"], ["Aprendendo", cards.aprendendo, "bg-[#e0a23a]"], ["Novos", cards.novos, "bg-lilas-2"]].map(([r, v, c]) => (
              <div key={r as string}>
                <dt className="flex items-center gap-1.5 text-xs text-suave"><span className={cx("size-2 rounded-full", c as string)} />{r}</dt>
                <dd className="font-display text-xl font-extrabold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-tinta-2">
            <strong>{cards.vencidos}</strong> {cards.vencidos === 1 ? "cartão precisa" : "cartões precisam"} de revisão hoje e <strong>{cards.dificeis}</strong> {cards.dificeis === 1 ? "está marcado" : "estão marcados"} como difíceis.
          </p>
          <BotaoLink href="/flashcards/estudar" className="mt-4" variante="secundario">Revisar agora</BotaoLink>
        </Cartao>
        <Cartao>
          <h2 className="text-lg font-bold">Histórico de simulados</h2>
          {s.simulados.length ? (
            <ul className="mt-3 divide-y divide-linha">
              {s.simulados.slice(0, 10).map((r) => {
                const p = r.acertos / r.total;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-tinta">{r.titulo}</p>
                      <p className="text-xs text-suave">{dataLonga(r.data)} · {r.acertos}/{r.total} · {formatarTempo(r.segundos)}</p>
                    </div>
                    <Etiqueta tom={p >= 0.7 ? "ok" : p >= 0.5 ? "alerta" : "erro"}>Nota {(p * 10).toFixed(1).replace(".", ",")}</Etiqueta>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-suave">Nenhum simulado concluído ainda.</p>
          )}
          <BotaoLink href="/simulados" className="mt-4" variante="secundario">Fazer um simulado</BotaoLink>
        </Cartao>
      </div>
    </>
  );
}

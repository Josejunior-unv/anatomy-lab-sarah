"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, Box, Check, ClipboardCheck, Layers } from "lucide-react";
import {
  CORES, cardsDoTopico, gruposNeuro, gruposOssea, hrefTopico, modelos, nomeDisciplina, partesDoTopico, questoesDoTopico,
  rotaDisciplina, topicoPorId, topicos, type Disciplina, type Topico,
} from "@/data";
import { dominio, dominioDisciplina } from "@/lib/estatisticas";
import { useProgresso } from "@/store/progresso";
import { Fixacao } from "./Fixacao";
import { MiniVisualizador } from "./Visualizador";
import { Anel, BotaoLink, Botao, Cabecalho, Cartao, Dominio, Etiqueta, cx, nivelDominio } from "./ui";

const gruposDe = (d: Disciplina) => (d === "neuro" ? gruposNeuro : gruposOssea);

export function ListaTopicos({ disciplina }: { disciplina: Disciplina }) {
  const s = useProgresso();
  const cor = CORES[disciplina];
  const lista = topicos.filter((t) => t.disciplina === disciplina);
  const geral = dominioDisciplina(disciplina, s);
  const lidos = lista.filter((t) => s.topicos[t.id]?.lido).length;
  const lab = disciplina === "neuro" ? "encefalo" : "esqueleto";

  return (
    <>
      <Cabecalho
        sobre="Conteúdos"
        titulo={nomeDisciplina[disciplina]}
        descricao={
          disciplina === "neuro"
            ? "Do sistema nervoso central às grandes vias: cada conteúdo traz explicação, estruturas, relações anatômicas, modelo 3D, questões e flashcards."
            : "Biblioteca do esqueleto humano: descrição, localização, acidentes anatômicos, articulações e identificação visual de cada osso."
        }
        acoes={
          <BotaoLink href={`/laboratorio?modelo=${lab}`} variante="secundario">
            <Box size={16} /> Abrir laboratório 3D
          </BotaoLink>
        }
      />
      <Cartao className="mb-8 flex flex-wrap items-center gap-5">
        <Anel valor={geral} tamanho={84} espessura={9} cor={cor}>
          <span className="font-display text-lg font-extrabold">{Math.round(geral * 100)}%</span>
        </Anel>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold">Domínio em {nomeDisciplina[disciplina].toLowerCase()}</p>
          <p className="mt-0.5 text-sm text-suave">
            {lidos} de {lista.length} conteúdos estudados · o domínio combina leitura, acertos nas questões e maturidade dos flashcards.
          </p>
        </div>
      </Cartao>

      {gruposDe(disciplina).map((g) => (
        <section key={g.id} className="mb-9" aria-labelledby={`g-${g.id}`}>
          <h2 id={`g-${g.id}`} className="mb-3 text-lg font-bold text-tinta">{g.titulo}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lista.filter((t) => t.grupo === g.id).map((t) => {
              const d = dominio(t, s);
              const n = nivelDominio(d);
              return (
                <Link key={t.id} href={hrefTopico(t)} className="cartao group flex flex-col p-4 transition-all hover:-translate-y-0.5 hover:shadow-flutuante">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-[15px] font-bold leading-snug text-tinta group-hover:text-roxo-forte">{t.titulo}</h3>
                    {s.topicos[t.id]?.lido && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ok-fundo text-ok" title="Estudado">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-suave">{t.resumo}</p>
                  <div className="mt-3">
                    <Dominio valor={d} cor={cor} />
                    <div className="mt-2 flex items-center justify-between text-xs text-suave">
                      <span>{n.rotulo}</span>
                      <span>{cardsDoTopico(t.id).length} cartões · {questoesDoTopico(t.id).length} questões</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 first:mt-0">
      <h2 className="mb-3 text-lg font-bold text-tinta">{titulo}</h2>
      {children}
    </section>
  );
}

function CartaoPrevia({ frente, verso }: { frente: string; verso: string }) {
  const [virado, setVirado] = useState(false);
  return (
    <button onClick={() => setVirado((v) => !v)} aria-pressed={virado} className="vira block w-full text-left" aria-label={virado ? `Resposta: ${verso}` : `Pergunta: ${frente}. Toque para ver a resposta.`}>
      <div className={cx("vira-interno relative min-h-[112px]", virado && "virado")}>
        <div className="vira-face absolute inset-0 flex items-center rounded-xl border border-linha bg-white p-4 text-sm font-medium text-tinta">{frente}</div>
        <div className="vira-face vira-verso absolute inset-0 flex items-center rounded-xl border border-lilas-2 bg-lilas p-4 text-sm text-tinta">{verso}</div>
      </div>
    </button>
  );
}

export function DetalheTopico({ id }: { id: string }) {
  const t = topicoPorId(id) as Topico;
  const s = useProgresso();
  const visitar = useProgresso((x) => x.visitar);
  const marcarLido = useProgresso((x) => x.marcarLido);
  const cor = CORES[t.disciplina];
  const ossea = t.disciplina === "ossea";
  const visual = partesDoTopico(t);
  const cards = cardsDoTopico(t.id);
  const qs = questoesDoTopico(t.id);
  const lido = !!s.topicos[t.id]?.lido;
  const d = dominio(t, s);
  const mesma = topicos.filter((x) => x.disciplina === t.disciplina);
  const idx = mesma.findIndex((x) => x.id === t.id);
  const anterior = mesma[idx - 1];
  const proximo = mesma[idx + 1];
  const grupo = gruposDe(t.disciplina).find((g) => g.id === t.grupo);

  useEffect(() => {
    visitar({ tipo: "topico", id: t.id, titulo: t.titulo, href: hrefTopico(t) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id]);

  return (
    <article>
      <Link href={rotaDisciplina[t.disciplina]} className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-suave hover:text-roxo-forte">
        <ArrowLeft size={15} /> {nomeDisciplina[t.disciplina]}
      </Link>
      <Cabecalho sobre={grupo?.titulo} titulo={t.titulo} descricao={t.resumo} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="order-2 min-w-0 lg:order-1">
          <Cartao>
            <Secao titulo={ossea ? "Descrição" : "Explicação"}>
              <div className="space-y-3 text-[15px] leading-[1.75] text-tinta-2">
                {t.texto.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </Secao>
            {t.localizacao && (
              <Secao titulo="Localização">
                <p className="text-[15px] leading-relaxed text-tinta-2">{t.localizacao}</p>
              </Secao>
            )}
            <Secao titulo={ossea ? "Acidentes anatômicos" : "Estruturas e funções"}>
              <dl className="grid gap-2 sm:grid-cols-2">
                {t.estruturas.map((e) => (
                  <div key={e.nome} className="rounded-xl border border-linha bg-fundo/60 p-3.5">
                    <dt className="flex items-center gap-2 text-sm font-bold text-tinta">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: cor }} />
                      {e.nome}
                    </dt>
                    <dd className="mt-1 text-[13px] leading-relaxed text-tinta-2">{e.funcao}</dd>
                  </div>
                ))}
              </dl>
            </Secao>
            {t.articulacoes && (
              <Secao titulo="Articulações">
                <ul className="flex flex-wrap gap-2">
                  {t.articulacoes.map((a) => (
                    <li key={a} className="rounded-full bg-agua px-3 py-1.5 text-[13px] font-medium text-petroleo-forte">{a}</li>
                  ))}
                </ul>
              </Secao>
            )}
            <Secao titulo={ossea ? "Relações e correlações clínicas" : "Relações anatômicas"}>
              <ul className="space-y-2 text-[15px] leading-relaxed text-tinta-2">
                {t.relacoes.map((r) => (
                  <li key={r} className="flex gap-2.5">
                    <ArrowRight size={15} className="mt-1 shrink-0 text-roxo" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Secao>
            {t.tabela && (
              <Secao titulo={t.tabela.titulo}>
                <div className="rolagem-fina -mx-1 overflow-x-auto px-1">
                  <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-[13px]">
                    <thead>
                      <tr>
                        {t.tabela.colunas.map((c) => (
                          <th key={c} scope="col" className="border-b border-linha bg-fundo px-3 py-2.5 font-semibold text-tinta first:rounded-tl-xl last:rounded-tr-xl">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {t.tabela.linhas.map((l, i) => (
                        <tr key={i}>
                          {l.map((c, j) => (
                            <td key={j} className={cx("border-b border-linha px-3 py-2.5 align-top text-tinta-2", j === 0 && "font-semibold text-tinta")}>{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Secao>
            )}
          </Cartao>

          {qs.length > 0 && (
            <Cartao className="mt-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-tinta">
                <ClipboardCheck size={18} className="text-roxo" /> Questões para fixação
              </h2>
              <Fixacao questoes={qs} />
            </Cartao>
          )}

          {cards.length > 0 && (
            <Cartao className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-tinta">
                  <Layers size={18} className="text-roxo" /> Flashcards deste conteúdo
                </h2>
                <BotaoLink href={`/flashcards/estudar?topico=${t.id}`} variante="secundario">Estudar com repetição espaçada</BotaoLink>
              </div>
              <p className="mb-3 text-sm text-suave">Toque em um cartão para virar.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {cards.map((c) => <CartaoPrevia key={c.id} frente={c.frente} verso={c.verso} />)}
              </div>
            </Cartao>
          )}
        </div>

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
          {visual ? (
            <div>
              <MiniVisualizador
                lab={visual.lab}
                destaque={visual.ids}
                fantasma
                focoInicial={visual.ids}
                interativo={false}
                legenda={`${ossea ? "Identificação visual" : "Imagem ilustrativa"} · em verde: ${visual.ids.length === 1 ? "a estrutura" : "as estruturas"} deste conteúdo`}
              />
              <BotaoLink href={`/laboratorio?modelo=${visual.lab}&topico=${t.id}`} variante="fantasma" className="mt-2 w-full bg-white">
                <Box size={16} /> Explorar no {modelos[visual.lab].titulo.toLowerCase()}
              </BotaoLink>
            </div>
          ) : (
            <Cartao className="text-sm leading-relaxed text-suave">
              <p className="font-semibold text-tinta">Sem modelo 3D para este conteúdo</p>
              <p className="mt-1">
                Ainda não há um modelo aberto de qualidade científica para estas estruturas. O laboratório já está preparado para receber um arquivo GLB/GLTF quando houver.
              </p>
            </Cartao>
          )}
          <Cartao className="flex items-center gap-4">
            <Anel valor={d} tamanho={72} espessura={8} cor={cor}>
              <span className="font-display text-sm font-extrabold">{Math.round(d * 100)}%</span>
            </Anel>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-tinta">Domínio do conteúdo</p>
              <Etiqueta tom={nivelDominio(d).tom} className="mt-1">{nivelDominio(d).rotulo}</Etiqueta>
            </div>
          </Cartao>
          <Botao variante={lido ? "secundario" : "primario"} className="w-full" onClick={() => marcarLido(t.id, !lido)} aria-pressed={lido}>
            {lido ? <Check size={16} /> : <BookOpenCheck size={16} />}
            {lido ? "Conteúdo estudado — desmarcar" : "Marcar como estudado"}
          </Botao>
          {qs.length > 0 && (
            <BotaoLink href={`/simulados?topico=${t.id}`} variante="fantasma" className="w-full bg-white">
              <ClipboardCheck size={16} /> Simulado deste assunto
            </BotaoLink>
          )}
        </aside>
      </div>

      <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Conteúdo anterior e próximo">
        {anterior ? (
          <Link href={hrefTopico(anterior)} className="cartao flex items-center gap-3 p-4 hover:shadow-flutuante">
            <ArrowLeft size={18} className="text-suave" />
            <span><span className="block text-xs text-suave">Anterior</span><span className="font-semibold text-tinta">{anterior.titulo}</span></span>
          </Link>
        ) : <span />}
        {proximo && (
          <Link href={hrefTopico(proximo)} className="cartao flex items-center justify-end gap-3 p-4 text-right hover:shadow-flutuante">
            <span><span className="block text-xs text-suave">Próximo</span><span className="font-semibold text-tinta">{proximo.titulo}</span></span>
            <ArrowRight size={18} className="text-suave" />
          </Link>
        )}
      </nav>
    </article>
  );
}

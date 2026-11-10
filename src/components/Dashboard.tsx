"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, Bone, Box, Brain, ClipboardCheck, Clock, Crosshair, Flame, Layers, Target } from "lucide-react";
import { CORES, nomeDisciplina, rotaDisciplina, topicos, type Disciplina } from "@/data";
import { dataLonga, formatarTempo } from "@/lib/datas";
import { acertoPorDisciplina, cardsRevisados, dominioDisciplina, progressoGeral, resumoCards, semana, sequencia, taxaSimulados, tempoTotal } from "@/lib/estatisticas";
import { serieTempo } from "@/lib/series";
import { useProgresso, type Recente } from "@/store/progresso";
import { GraficoTempo, Legenda } from "./graficos";
import { Anel, Barra, BotaoLink, Cartao, cx } from "./ui";

const icones: Record<Recente["tipo"], typeof Brain> = { topico: BookOpen, lab: Box, flashcards: Layers, simulado: ClipboardCheck, identificacao: Crosshair };

function Indicador({ icone: Icone, rotulo, valor, detalhe, cor }: { icone: typeof Brain; rotulo: string; valor: string; detalhe: string; cor: string }) {
  return (
    <Cartao className="!p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-suave">
        <span className="grid size-7 place-items-center rounded-lg" style={{ background: cor + "1c", color: cor }}><Icone size={15} /></span>
        {rotulo}
      </div>
      <p className="mt-2.5 font-display text-2xl font-extrabold tabular-nums text-tinta">{valor}</p>
      <p className="mt-0.5 text-xs text-suave">{detalhe}</p>
    </Cartao>
  );
}

export function Dashboard() {
  const s = useProgresso();
  const geral = progressoGeral(s);
  const seq = sequencia(s.dias);
  const taxa = taxaSimulados(s.simulados);
  const revisados = cardsRevisados(s.dias);
  const cards = resumoCards(s.cards);
  const sem = semana(s);
  const ultimo = s.recentes[0];
  const hora = new Date().getHours();
  const periodo = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const proximoNaoLido = topicos.find((t) => !s.topicos[t.id]?.lido);
  const metas = [
    { r: "Flashcards revisados", v: sem.cards, m: s.metas.cards, u: "" },
    { r: "Tempo de estudo", v: sem.minutos, m: s.metas.minutos, u: " min" },
    { r: "Conteúdos estudados", v: sem.topicos, m: s.metas.topicos, u: "" },
    { r: "Simulados concluídos", v: sem.simulados, m: s.metas.simulados, u: "" },
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-[#6d4fd0] via-[#7c5cd6] to-[#0a9a94] p-6 text-white shadow-flutuante sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-[#b6f0ea]/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-0 flex-1 basis-72">
            <p className="text-sm font-medium text-white/80">{periodo} · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Olá, {s.perfil.nome || "Sarah"}! Vamos estudar?</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              {cards.vencidos > 0
                ? `Você tem ${cards.vencidos} ${cards.vencidos === 1 ? "flashcard" : "flashcards"} para revisar hoje.`
                : ultimo ? "Seus flashcards estão em dia. Que tal avançar em um conteúdo novo?" : "Seu laboratório digital de anatomia está pronto: comece por um conteúdo ou explore os modelos 3D."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={ultimo?.href ?? "/neuroanatomia/snc"} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-roxo-forte shadow-lg transition-transform hover:-translate-y-0.5">
                {ultimo ? "Continuar de onde parou" : "Começar a estudar"} <ArrowRight size={16} />
              </Link>
              <Link href="/laboratorio" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/25">
                <Box size={16} /> Laboratório 3D
              </Link>
            </div>
            {ultimo && <p className="mt-3 truncate text-xs text-white/75">Último acesso: {ultimo.titulo}</p>}
          </div>
          <div className="flex items-center gap-4 rounded-3xl bg-white/12 p-4 ring-1 ring-white/25 backdrop-blur">
            <Anel valor={geral} tamanho={112} espessura={11} cor="#ffffff">
              <span>
                <span className="block font-display text-2xl font-extrabold">{Math.round(geral * 100)}%</span>
              </span>
            </Anel>
            <div>
              <p className="text-sm font-bold">Progresso geral</p>
              <p className="mt-0.5 max-w-[150px] text-xs leading-snug text-white/80">Média do domínio dos {topicos.length} conteúdos</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador icone={Layers} rotulo="Flashcards revisados" valor={String(revisados)} detalhe={`${cards.dominados} dominados de ${cards.total}`} cor={CORES.neuro} />
        <Indicador icone={Target} rotulo="Acertos nos simulados" valor={taxa === null ? "—" : `${Math.round(taxa * 100)}%`} detalhe={s.simulados.length ? `${s.simulados.length} ${s.simulados.length === 1 ? "simulado feito" : "simulados feitos"}` : "Nenhum simulado ainda"} cor={CORES.ossea} />
        <Indicador icone={Flame} rotulo="Sequência de estudos" valor={`${seq} ${seq === 1 ? "dia" : "dias"}`} detalhe={seq ? "Continue assim!" : "Estude hoje para começar"} cor="#d9822b" />
        <Indicador icone={Clock} rotulo="Tempo total de estudo" valor={formatarTempo(tempoTotal(s.dias))} detalhe={`${sem.minutos} min nesta semana`} cor="#5b7fd6" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Cartao>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Evolução por disciplina</h2>
              <p className="text-xs text-suave">Minutos de estudo nos últimos 14 dias</p>
            </div>
            <Link href="/desempenho" className="text-sm font-semibold text-roxo hover:text-roxo-forte">Ver desempenho completo</Link>
          </div>
          <div className="mt-3"><Legenda /></div>
          <div className="mt-2"><GraficoTempo dados={serieTempo(s.dias, "diaria")} /></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["neuro", "ossea"] as Disciplina[]).map((d) => {
              const dom = dominioDisciplina(d, s);
              const ac = acertoPorDisciplina(s, d);
              const Icone = d === "neuro" ? Brain : Bone;
              return (
                <Link key={d} href={rotaDisciplina[d]} className="group rounded-2xl border border-linha p-4 transition-colors hover:bg-fundo">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg text-white" style={{ background: CORES[d] }}><Icone size={16} /></span>
                    <span className="flex-1 text-sm font-bold text-tinta">{nomeDisciplina[d]}</span>
                    <span className="font-display text-base font-extrabold tabular-nums">{Math.round(dom * 100)}%</span>
                  </div>
                  <Barra valor={dom} cor={CORES[d]} className="mt-3" rotulo={`Domínio em ${nomeDisciplina[d]}`} />
                  <p className="mt-2 text-xs text-suave">{ac.t ? `${Math.round((ac.c / ac.t) * 100)}% de acertos em ${ac.t} questões` : "Nenhuma questão respondida ainda"}</p>
                </Link>
              );
            })}
          </div>
        </Cartao>

        <div className="space-y-5">
          <Cartao>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Metas da semana</h2>
              <Link href="/perfil#metas" className="text-sm font-semibold text-roxo hover:text-roxo-forte">Ajustar</Link>
            </div>
            <ul className="mt-4 space-y-4">
              {metas.map((m) => {
                const feito = m.v >= m.m;
                return (
                  <li key={m.r}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-tinta">{m.r}</span>
                      <span className={cx("tabular-nums", feito ? "font-bold text-ok" : "text-suave")}>{m.v}{m.u} / {m.m}{m.u}</span>
                    </div>
                    <Barra valor={m.m ? m.v / m.m : 0} cor={feito ? "var(--color-ok)" : "var(--color-roxo)"} rotulo={m.r} />
                  </li>
                );
              })}
            </ul>
          </Cartao>
          <Cartao>
            <h2 className="text-lg font-bold">Próximos passos</h2>
            <div className="mt-3 grid gap-2">
              <BotaoLink href="/flashcards/estudar" variante={cards.vencidos ? "primario" : "secundario"} className="justify-between">
                <span className="flex items-center gap-2"><Layers size={16} /> Revisão do dia</span>
                <span className="tabular-nums">{cards.vencidos + Math.min(cards.novos, 15)}</span>
              </BotaoLink>
              {proximoNaoLido && (
                <BotaoLink href={`${rotaDisciplina[proximoNaoLido.disciplina]}/${proximoNaoLido.id}`} variante="fantasma" className="justify-between bg-white">
                  <span className="flex min-w-0 items-center gap-2"><BookOpen size={16} className="shrink-0" /> <span className="truncate">Estudar: {proximoNaoLido.titulo}</span></span>
                  <ArrowRight size={16} className="shrink-0" />
                </BotaoLink>
              )}
              <BotaoLink href="/identificacao" variante="fantasma" className="justify-between bg-white">
                <span className="flex items-center gap-2"><Crosshair size={16} /> Treino de identificação</span>
                <ArrowRight size={16} />
              </BotaoLink>
            </div>
          </Cartao>
        </div>
      </div>

      <Cartao className="mt-5">
        <h2 className="text-lg font-bold">Estudados recentemente</h2>
        {s.recentes.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {s.recentes.slice(0, 6).map((r) => {
              const Icone = icones[r.tipo];
              return (
                <li key={r.href}>
                  <Link href={r.href} className="flex items-center gap-3 rounded-xl border border-linha p-3 transition-colors hover:bg-fundo">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lilas text-roxo"><Icone size={17} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-tinta">{r.titulo}</span>
                      <span className="block text-xs text-suave">{dataLonga(r.ts)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-suave">Os conteúdos, sessões e simulados que você abrir aparecerão aqui.</p>
        )}
      </Cartao>
    </>
  );
}

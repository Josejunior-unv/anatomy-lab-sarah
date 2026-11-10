"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Bone, Box, Brain, ClipboardCheck, Cloud, CloudOff, Crosshair, LayoutDashboard, Layers, Menu, UserRound, X } from "lucide-react";
import { useProgresso } from "@/store/progresso";
import { enviar, reconciliar, supabase, supabaseConfigurado, type EstadoSync } from "@/lib/supabase";
import { cx } from "./ui";

export const menu = [
  { href: "/", rotulo: "Dashboard", icone: LayoutDashboard },
  { href: "/neuroanatomia", rotulo: "Neuroanatomia", icone: Brain },
  { href: "/anatomia-ossea", rotulo: "Anatomia óssea", icone: Bone },
  { href: "/laboratorio", rotulo: "Laboratório 3D", icone: Box },
  { href: "/flashcards", rotulo: "Flashcards", icone: Layers },
  { href: "/simulados", rotulo: "Simulados", icone: ClipboardCheck },
  { href: "/identificacao", rotulo: "Identificação anatômica", icone: Crosshair },
  { href: "/desempenho", rotulo: "Meu desempenho", icone: Activity },
  { href: "/perfil", rotulo: "Meu perfil", icone: UserRound },
];

const ativo = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

/** Conta o tempo de estudo enquanto a aba está visível e houve interação recente. */
function useCronometroDeEstudo() {
  const addTempo = useProgresso((s) => s.addTempo);
  const ultimo = useRef(0);
  useEffect(() => {
    ultimo.current = Date.now();
    const toque = () => (ultimo.current = Date.now());
    const eventos = ["pointerdown", "keydown", "wheel", "touchstart", "pointermove"] as const;
    eventos.forEach((e) => window.addEventListener(e, toque, { passive: true }));
    const PASSO = 15;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible" || Date.now() - ultimo.current > 120_000) return;
      const p = window.location.pathname;
      const q = window.location.search;
      const onde = p.startsWith("/neuroanatomia") || q.includes("encefalo") || q.includes("neuro")
        ? "neuro"
        : p.startsWith("/anatomia-ossea") || (p.startsWith("/laboratorio") && !q.includes("encefalo")) || q.includes("ossea")
          ? "ossea"
          : "geral";
      addTempo(onde, PASSO);
    }, PASSO * 1000);
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, toque));
      window.clearInterval(id);
    };
  }, [addTempo]);
}

/** Sincroniza o progresso com o Supabase quando há sessão ativa. */
function useSincronizacao(): EstadoSync {
  const [estado, setEstado] = useState<EstadoSync>(supabaseConfigurado ? "deslogado" : "local");
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let userId: string | null = null;
    let timer: number | undefined;
    const aoEntrar = async (id: string | null) => {
      userId = id;
      if (!id) return setEstado("deslogado");
      setEstado("sincronizando");
      setEstado((await reconciliar(id)) ? "sincronizado" : "erro");
    };
    sb.auth.getSession().then(({ data }) => aoEntrar(data.session?.user.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, sessao) => {
      const id = sessao?.user.id ?? null;
      if (id !== userId) aoEntrar(id);
    });
    const cancelar = useProgresso.subscribe((s, ant) => {
      if (!userId || s.atualizadoEm === ant.atualizadoEm) return;
      window.clearTimeout(timer);
      setEstado("sincronizando");
      timer = window.setTimeout(async () => setEstado((await enviar(userId!)) ? "sincronizado" : "erro"), 2500);
    });
    return () => {
      sub.subscription.unsubscribe();
      cancelar();
      window.clearTimeout(timer);
    };
  }, []);
  return estado;
}

const textoSync: Record<EstadoSync, string> = {
  local: "Progresso salvo neste navegador",
  deslogado: "Entre em Meu perfil para salvar na nuvem",
  sincronizando: "Sincronizando…",
  sincronizado: "Progresso salvo na nuvem",
  erro: "Falha ao sincronizar — salvo localmente",
};

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-xl px-2 py-1">
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-roxo to-petroleo text-white shadow-[0_8px_18px_-8px_rgba(95,67,184,0.9)]">
        <Brain size={20} strokeWidth={2.2} />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-extrabold text-tinta">Anatomy Lab</span>
        <span className="block text-xs font-medium text-suave">Sarah</span>
      </span>
    </Link>
  );
}

function Navegacao({ pathname, aoClicar }: { pathname: string; aoClicar?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1">
      {menu.map(({ href, rotulo, icone: Icone }) => {
        const a = ativo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={aoClicar}
            aria-current={a ? "page" : undefined}
            className={cx(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              a ? "bg-lilas text-roxo-forte" : "text-tinta-2 hover:bg-fundo-2",
            )}
          >
            <Icone size={18} strokeWidth={a ? 2.4 : 2} className={a ? "text-roxo" : "text-suave group-hover:text-tinta-2"} />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

export function Casca({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [montado, setMontado] = useState(false);
  const [aberto, setAberto] = useState(false);
  useEffect(() => setMontado(true), []);
  useEffect(() => setAberto(false), [pathname]);
  useCronometroDeEstudo();
  const sync = useSincronizacao();
  const IconeSync = sync === "sincronizado" || sync === "sincronizando" ? Cloud : CloudOff;

  const rodape = (
    <p className="flex items-start gap-2 rounded-xl bg-fundo px-3 py-2.5 text-xs leading-snug text-suave">
      <IconeSync size={14} className="mt-0.5 shrink-0" />
      {textoSync[sync]}
    </p>
  );

  return (
    <div className="min-h-dvh lg:pl-[264px]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm">
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col gap-6 border-r border-linha bg-white/80 px-4 py-5 backdrop-blur-xl lg:flex">
        <Marca />
        <div className="rolagem-fina flex-1 overflow-y-auto">
          <Navegacao pathname={pathname} />
        </div>
        {rodape}
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-linha bg-white/85 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <Marca />
        <button
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="grid size-11 place-items-center rounded-xl border border-linha bg-white text-tinta-2"
        >
          <Menu size={20} />
        </button>
      </div>

      <AnimatePresence>
        {aberto && (
          <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button aria-label="Fechar menu" className="absolute inset-0 bg-tinta/30 backdrop-blur-[2px]" onClick={() => setAberto(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 flex w-[284px] max-w-[86vw] flex-col gap-5 bg-white px-4 py-5 shadow-flutuante"
            >
              <div className="flex items-center justify-between">
                <Marca />
                <button onClick={() => setAberto(false)} aria-label="Fechar menu" className="grid size-10 place-items-center rounded-xl text-suave hover:bg-fundo-2">
                  <X size={20} />
                </button>
              </div>
              <div className="rolagem-fina flex-1 overflow-y-auto">
                <Navegacao pathname={pathname} aoClicar={() => setAberto(false)} />
              </div>
              {rodape}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="conteudo" className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-9">
        {montado ? (
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}>
            {children}
          </motion.div>
        ) : (
          <div className="space-y-4" aria-busy="true" aria-label="Carregando">
            <div className="h-9 w-64 animate-pulse rounded-xl bg-fundo-2" />
            <div className="h-40 animate-pulse rounded-3xl bg-white/70" />
            <div className="h-64 animate-pulse rounded-3xl bg-white/70" />
          </div>
        )}
      </main>
    </div>
  );
}

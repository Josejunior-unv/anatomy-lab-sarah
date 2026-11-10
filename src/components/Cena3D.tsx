"use client";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { modelos, nomeSemLado, type LabId, type Parte } from "@/data";

export type Vista = "anterior" | "posterior" | "direita" | "esquerda" | "superior" | "inferior";
export type Comando = { n: number } & ({ tipo: "vista"; vista: Vista } | { tipo: "focar"; ids: string[] | null });

export interface Cena3DProps {
  lab: LabId;
  selecionada?: string | null;
  aoSelecionar?: (id: string | null) => void;
  ocultas?: Set<string>;
  /** Estruturas realçadas com a cor de destaque. */
  destaque?: string[] | null;
  /** Deixa translúcido tudo o que não está em destaque. */
  fantasma?: boolean;
  /** Estruturas translúcidas (não clicáveis), para ver o que está por dentro. */
  translucidas?: Set<string>;
  colorir?: boolean;
  /** Estruturas que recebem um marcador com o nome. */
  marcadores?: string[];
  /** Mostra o nome no marcador da estrutura selecionada (desligue em modos de quiz). */
  nomeNaSelecao?: boolean;
  comando?: Comando | null;
  focoInicial?: string[] | null;
  interativo?: boolean;
  className?: string;
}

const COR_SELECAO = "#6a4bd0";
const COR_DESTAQUE = "#0a9a94";
const COR_FANTASMA = "#b9b4cf";
const DIRECOES: Record<Vista, [number, number, number]> = {
  anterior: [0, 0, 1],
  posterior: [0, 0, -1],
  direita: [-1, 0, 0],
  esquerda: [1, 0, 0],
  superior: [0, 1, 0.0001],
  inferior: [0, -1, 0.0001],
};

function caixaDe(partes: Parte[]): THREE.Box3 {
  const b = new THREE.Box3();
  for (const p of partes) {
    b.expandByPoint(new THREE.Vector3(p.c[0] - p.s[0] / 2, p.c[1] - p.s[1] / 2, p.c[2] - p.s[2] / 2));
    b.expandByPoint(new THREE.Vector3(p.c[0] + p.s[0] / 2, p.c[1] + p.s[1] / 2, p.c[2] + p.s[2] / 2));
  }
  return b;
}

function Modelo({ lab, selecionada, aoSelecionar, ocultas, destaque, fantasma, translucidas, colorir, interativo }: Cena3DProps) {
  const modelo = modelos[lab];
  const { scene } = useGLTF(modelo.arquivo, false, true);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const [hover, setHover] = useState<string | null>(null);

  const { cena, malhas } = useMemo(() => {
    const cena = scene.clone(true);
    const malhas = new Map<string, THREE.Mesh>();
    cena.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.02 });
      malhas.set(m.name || m.parent?.name || "", m);
    });
    return { cena, malhas };
  }, [scene]);

  const corGrupo = useMemo(() => new Map(modelo.grupos.map((g) => [g.id, g.cor])), [modelo]);
  const partes = useMemo(() => new Map(modelo.partes.map((p) => [p.id, p])), [modelo]);
  const setDestaque = useMemo(() => (destaque ? new Set(destaque) : null), [destaque]);

  useEffect(() => {
    for (const [id, mesh] of malhas) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const parte = partes.get(id);
      mesh.visible = !ocultas?.has(id);
      let cor = colorir && parte ? (corGrupo.get(parte.grupo) ?? modelo.corBase) : modelo.corBase;
      let op = 1;
      const emDestaque = setDestaque?.has(id) ?? false;
      if (setDestaque) {
        if (emDestaque) cor = COR_DESTAQUE;
        else if (fantasma) {
          cor = COR_FANTASMA;
          op = 0.12;
        }
      }
      if (translucidas?.has(id) && !emDestaque && id !== selecionada) op = Math.min(op, 0.14);
      if (id === selecionada) {
        cor = COR_SELECAO;
        op = 1;
      }
      mat.color.set(cor);
      mat.emissive.set(id === hover && id !== selecionada ? "#3a2a7a" : "#000000");
      mat.emissiveIntensity = 0.55;
      mat.opacity = op;
      mat.transparent = op < 1;
      mat.depthWrite = op >= 1;
      mesh.renderOrder = op < 1 ? 2 : 0;
      mesh.userData.clicavel = op >= 1;
      mat.needsUpdate = true;
    }
    invalidate();
  }, [malhas, partes, corGrupo, modelo, ocultas, setDestaque, fantasma, translucidas, colorir, selecionada, hover, invalidate]);

  useEffect(() => () => void (gl.domElement.style.cursor = ""), [gl]);

  const alvo = (e: ThreeEvent<PointerEvent | MouseEvent>): string | null => {
    const hit = e.intersections.find((i) => i.object.visible && i.object.userData.clicavel);
    return hit ? hit.object.name || hit.object.parent?.name || null : null;
  };

  if (!interativo) return <primitive object={cena} />;
  return (
    <primitive
      object={cena}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (e.pointerType === "touch") return;
        const id = alvo(e);
        if (id !== hover) {
          setHover(id);
          gl.domElement.style.cursor = id ? "pointer" : "";
        }
      }}
      onPointerOut={() => {
        setHover(null);
        gl.domElement.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta > 5) return;
        aoSelecionar?.(alvo(e));
      }}
    />
  );
}

function Camera({ lab, comando, focoInicial }: Pick<Cena3DProps, "lab" | "comando" | "focoInicial">) {
  const controles = useRef<OrbitControlsImpl>(null);
  const { camera, invalidate, size } = useThree();
  const modelo = modelos[lab];
  const caixaModelo = useMemo(() => caixaDe(modelo.partes), [modelo]);
  const meta = useRef<{ pos: THREE.Vector3; alvo: THREE.Vector3 } | null>(null);
  const foco = useRef<THREE.Box3>(caixaModelo);
  const direcao = useRef(new THREE.Vector3(0, 0, 1));

  const enquadrar = (caixa: THREE.Box3, dir: THREE.Vector3, imediato = false) => {
    const centro = caixa.getCenter(new THREE.Vector3());
    const tam = caixa.getSize(new THREE.Vector3());
    const diagModelo = caixaModelo.getSize(new THREE.Vector3()).length();
    const raio = Math.max(tam.length() / 2, diagModelo * 0.05);
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const aspecto = size.width / Math.max(1, size.height);
    const fovEfetivo = aspecto < 1 ? 2 * Math.atan(Math.tan(fov / 2) * aspecto) : fov;
    const dist = (raio / Math.sin(fovEfetivo / 2)) * 1.08;
    const pos = centro.clone().add(dir.clone().normalize().multiplyScalar(dist));
    if (imediato) {
      camera.position.copy(pos);
      controles.current?.target.copy(centro);
      controles.current?.update();
      meta.current = null;
    } else meta.current = { pos, alvo: centro };
    invalidate();
  };

  const caixaDosIds = (ids: string[] | null | undefined) => {
    if (!ids?.length) return caixaModelo;
    const set = new Set(ids);
    const ps = modelo.partes.filter((p) => set.has(p.id));
    return ps.length ? caixaDe(ps) : caixaModelo;
  };

  // Enquadramento inicial e quando o foco inicial muda.
  const chaveFoco = focoInicial?.join(",") ?? "";
  const primeira = useRef(true);
  useEffect(() => {
    foco.current = caixaDosIds(focoInicial);
    enquadrar(foco.current, direcao.current, primeira.current);
    primeira.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveFoco, lab, size.width, size.height]);

  useEffect(() => {
    if (!comando) return;
    if (comando.tipo === "vista") direcao.current.set(...DIRECOES[comando.vista]);
    else {
      foco.current = caixaDosIds(comando.ids);
      if (controles.current) direcao.current.copy(camera.position).sub(controles.current.target).normalize();
    }
    enquadrar(foco.current, direcao.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comando?.n]);

  useFrame((_, dt) => {
    const m = meta.current;
    const c = controles.current;
    if (!m || !c) return;
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 7);
    camera.position.lerp(m.pos, k);
    c.target.lerp(m.alvo, k);
    c.update();
    if (camera.position.distanceTo(m.pos) < 0.0015) {
      camera.position.copy(m.pos);
      c.target.copy(m.alvo);
      c.update();
      meta.current = null;
    }
    invalidate();
  });

  const diag = caixaModelo.getSize(new THREE.Vector3()).length();
  return (
    <OrbitControls
      ref={controles}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      rotateSpeed={0.9}
      zoomSpeed={0.9}
      panSpeed={0.9}
      minDistance={diag * 0.02}
      maxDistance={diag * 4}
      onStart={() => (meta.current = null)}
    />
  );
}

/** Luz principal presa à câmera, para que a estrutura esteja sempre bem iluminada. */
function Farol() {
  const luz = useRef<THREE.DirectionalLight>(null);
  useFrame(({ camera }) => {
    if (!luz.current) return;
    luz.current.position.copy(camera.position);
    luz.current.position.add(new THREE.Vector3(0.3, 0.5, 0).applyQuaternion(camera.quaternion));
  });
  return <directionalLight ref={luz} intensity={1.9} />;
}

function Marcadores({ lab, ids, selecionada, nomeNaSelecao = true, aoSelecionar }: { lab: LabId; ids: string[]; selecionada?: string | null; nomeNaSelecao?: boolean; aoSelecionar?: (id: string) => void }) {
  const partes = useMemo(() => new Map(modelos[lab].partes.map((p) => [p.id, p])), [lab]);
  const lista = [...new Set([...(selecionada ? [selecionada] : []), ...ids])];
  return (
    <>
      {lista.map((id) => {
        const p = partes.get(id);
        if (!p) return null;
        const sel = id === selecionada;
        if (sel && !nomeNaSelecao) return null;
        return (
          <Html key={id} position={p.c} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <button
              type="button"
              onClick={() => aoSelecionar?.(id)}
              style={{ pointerEvents: aoSelecionar ? "auto" : "none" }}
              className={`flex -translate-y-4 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-semibold shadow-md backdrop-blur ${
                sel ? "border-roxo bg-roxo text-white" : "border-white/70 bg-white/90 text-tinta hover:bg-white"
              }`}
            >
              <span className={`size-1.5 rounded-full ${sel ? "bg-white" : "bg-petroleo"}`} />
              {sel ? p.nome : nomeSemLado(p.nome)}
            </button>
          </Html>
        );
      })}
    </>
  );
}

function Carregando() {
  const { active, progress } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="rounded-2xl bg-white/90 px-5 py-4 text-center shadow-cartao backdrop-blur">
        <p className="text-sm font-semibold text-tinta">Carregando modelo 3D…</p>
        <div className="mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-fundo-2">
          <div className="h-full rounded-full bg-roxo transition-[width]" style={{ width: `${Math.max(6, progress)}%` }} />
        </div>
      </div>
    </div>
  );
}

const temWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

export default function Cena3D(props: Cena3DProps) {
  const { lab, className, comando, focoInicial, marcadores, selecionada, aoSelecionar, interativo = true, nomeNaSelecao } = props;
  const [webgl] = useState(temWebGL);
  if (!webgl)
    return (
      <div className={`grid place-items-center p-6 text-center text-sm text-suave ${className ?? ""}`}>
        Seu navegador não conseguiu iniciar o WebGL, necessário para os modelos 3D. Ative a aceleração gráfica ou tente outro navegador.
      </div>
    );
  return (
    <div className={`relative touch-none select-none ${className ?? ""}`}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: 32, near: 0.005, far: 50, position: [0, 0.8, 4] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={() => interativo && aoSelecionar?.(null)}
        aria-label={`Modelo 3D: ${modelos[lab].titulo}`}
        role="img"
      >
        <ambientLight intensity={0.85} />
        <hemisphereLight args={["#ffffff", "#b9b2d8", 0.7]} />
        <Farol />
        <Suspense fallback={null}>
          <Modelo {...props} interativo={interativo} />
          <Marcadores lab={lab} ids={marcadores ?? []} selecionada={selecionada} nomeNaSelecao={nomeNaSelecao} aoSelecionar={interativo ? (id) => aoSelecionar?.(id) : undefined} />
        </Suspense>
        <Camera lab={lab} comando={comando} focoInicial={focoInicial} />
      </Canvas>
      <Carregando />
    </div>
  );
}


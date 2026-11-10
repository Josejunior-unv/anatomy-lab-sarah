# Anatomy Lab — Sarah

Plataforma de estudos de **neuroanatomia** e **anatomia óssea**: conteúdos, laboratório 3D com
modelos anatômicos reais, flashcards com repetição espaçada, simulados, treino de identificação
e acompanhamento de desempenho. Toda a interface está em português brasileiro.

Feito com Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Three.js /
React Three Fiber, Zustand, Recharts e Supabase (opcional).

## Rodando

Precisa do Node 20.9 ou mais novo.

```bash

npm install
npm run dev      # http://localhost:3000
npm run build    # versão de produção
npm run lint
```

Para publicar na Vercel, importe este repositório em vercel.com/new e clique em Deploy —
nenhuma configuração extra é necessária.

## Onde o progresso fica salvo

- **Sem configuração**: no navegador (`localStorage`), preservado entre sessões. Em
  *Meu perfil* dá para baixar e restaurar um backup em JSON.
- **Com Supabase** (login por e-mail e senha, sincronização entre aparelhos):
  1. crie um projeto em supabase.com;
  2. rode `supabase/schema.sql` no SQL Editor (cria a tabela `progresso` com RLS e o bucket `modelos`);
  3. copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` (na Vercel, cadastre as duas em Environment Variables);
  4. entre em *Meu perfil → Conta e sincronização*.

  O progresso é guardado como um documento JSON por usuária; ao entrar, vale a versão mais
  recente entre o navegador e a nuvem.

## Onde mudar cada coisa

| O que | Arquivo |
| --- | --- |
| Conteúdos de neuroanatomia | `src/data/neuro.ts` |
| Biblioteca de ossos | `src/data/ossea.ts` |
| Flashcards e baralhos | `src/data/flashcards.ts` |
| Questões (múltipla escolha, V/F, associação) | `src/data/questoes.ts` |
| Registro dos modelos 3D e questões de identificação | `src/data/index.ts` |
| Regras da repetição espaçada | `src/lib/srs.ts` |
| Cálculo de domínio, sequência e metas | `src/lib/estatisticas.ts` |
| Cores, fontes e sombras | `src/app/globals.css` (bloco `@theme`) |
| Visualizador 3D | `src/components/Cena3D.tsx` |

Novos flashcards e questões devem ser acrescentados **no fim** de cada lista: o progresso é
guardado pelo identificador, que depende da posição.

## Modelos 3D

Os arquivos `public/modelos/esqueleto.glb` (221 estruturas) e `public/modelos/encefalo.glb`
(95 estruturas) foram gerados a partir do **BodyParts3D 3.0** — malhas segmentadas de um corpo
masculino adulto —, simplificados para cerca de 15% dos triângulos e comprimidos com meshopt.

> BodyParts3D, © The Database Center for Life Science, licenciado sob
> CC Atribuição-CompartilhaIgual 2.1 Japão. Os arquivos derivados desta pasta seguem a mesma licença.

Limitações conhecidas do conjunto de dados: não há malha isolada da medula espinal nem das
meninges; sacro e cóccix formam uma única peça; o giro frontal inferior vem rotulado no original
como “accessory short gyrus”.

### Refazer os modelos

```bash
cd scripts/modelos
npm init -y && npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
node baixar.mjs lista-de-ids.txt bp3d/stl          # baixa os STL (um FMA id por linha)
BP3D_DIR=bp3d node construir.mjs skeleton 0.13 saida/esqueleto.glb
BP3D_DIR=bp3d node construir.mjs brain 0.16 saida/encefalo.glb
node manifesto.mjs saida ../../src/data/modelos   # nomes em português, grupos e tópicos
```

`construir.mjs` espera em `bp3d/` um `have.txt` com linhas `id:nome em inglês`.

### Acrescentar um modelo novo (GLB/GLTF)

1. Exporte um `.glb` com **uma malha nomeada por estrutura** e coloque em `public/modelos/`.
2. Crie `src/data/modelos/<id>.json` com, para cada malha: `id`, `nome`, `grupo`, `topico`
   (id do conteúdo relacionado ou `null`), `lado`, `c` (centro) e `s` (tamanho da caixa).
3. Registre o modelo em `modelos`, em `src/data/index.ts`, e acrescente o id ao tipo `LabId`.

Seleção, ocultar/exibir, marcadores, vistas e questões de identificação passam a funcionar
automaticamente.

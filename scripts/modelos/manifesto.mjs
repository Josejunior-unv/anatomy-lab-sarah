// Gera os manifestos (nomes em português, grupos e vínculo com os conteúdos)
// a partir dos .raw.json produzidos por construir.mjs.
// Uso: node manifesto.mjs <pasta com esqueleto.raw.json e encefalo.raw.json> <pasta de saída>
import fs from 'node:fs';
const [,, inDir, outDir] = process.argv;
const ord = { first:1, second:2, third:3, fourth:4, fifth:5, sixth:6, seventh:7, eighth:8, ninth:9, tenth:10, eleventh:11, twelfth:12 };
const ordRe = Object.keys(ord).join('|');
const lado = (en, c) => {
  const m = en.match(/\b(right|left)\b/); if (!m) return null;
  const byPos = Math.abs(c[0]) > 0.004 ? (c[0] < 0 ? 'D' : 'E') : null;
  return byPos ?? (m[1] === 'right' ? 'D' : 'E');
};
const sfx = (l, fem) => l === 'D' ? (fem ? ' direita' : ' direito') : l === 'E' ? (fem ? ' esquerda' : ' esquerdo') : '';
const dedosMao = { thumb:'polegar', 'index finger':'indicador', 'middle finger':'dedo médio', 'ring finger':'dedo anular', 'little finger':'dedo mínimo' };
const dedosPe = { 'big toe':'hálux', 'second toe':'2º dedo do pé', 'third toe':'3º dedo do pé', 'fourth toe':'4º dedo do pé', 'little toe':'5º dedo do pé' };
const simples = {
  'frontal bone':['Osso frontal','cranio','frontal'], 'occipital bone':['Osso occipital','cranio','occipital'], 'sphenoid bone':['Esfenoide','cranio','esfenoide'],
  'ethmoid':['Etmoide','cranio','etmoide'], 'mandible':['Mandíbula','cranio','mandibula',1], 'vomer':['Vômer','cranio','vomer'], 'hyoid bone':['Osso hioide','cranio',null],
  'temporal bone':['Osso temporal','cranio','temporais'], 'parietal bone':['Osso parietal','cranio','parietais'], 'zygomatic bone':['Osso zigomático','cranio','zigomaticos'],
  'lacrimal bone':['Osso lacrimal','cranio','lacrimais'], 'nasal bone':['Osso nasal','cranio','nasais'], 'maxilla':['Maxila','cranio','maxila',1],
  'palatine bone':['Osso palatino','cranio','palatinos'], 'inferior nasal concha':['Concha nasal inferior','cranio','conchas-nasais-inferiores',1],
  'upper teeth':['Dentes superiores','cranio','maxila'], 'lower teeth':['Dentes inferiores','cranio','mandibula'],
  'atlas':['Atlas (C1)','coluna','atlas-axis'], 'axis':['Áxis (C2)','coluna','atlas-axis'], 'sacrum':['Sacro e cóccix','coluna','sacro'],
  'manubrium':['Manúbrio do esterno','torax','esterno'], 'body of sternum':['Corpo do esterno','torax','esterno'], 'xiphoid process':['Processo xifoide','torax','esterno'],
  'clavicle':['Clavícula','membro-superior','clavicula',1], 'scapula':['Escápula','membro-superior','escapula',1], 'humerus':['Úmero','membro-superior','umero'],
  'radius':['Rádio','membro-superior','radio'], 'ulna':['Ulna','membro-superior','ulna',1],
  'scaphoid':['Escafoide','membro-superior','carpo'], 'lunate':['Semilunar','membro-superior','carpo'], 'triquetral':['Piramidal','membro-superior','carpo'],
  'pisiform':['Pisiforme','membro-superior','carpo'], 'trapezium':['Trapézio','membro-superior','carpo'], 'trapezoid':['Trapezoide','membro-superior','carpo'],
  'capitate':['Capitato','membro-superior','carpo'], 'hamate':['Hamato','membro-superior','carpo'],
  'hip bone':['Osso do quadril','membro-inferior','quadril'], 'femur':['Fêmur','membro-inferior','femur'], 'patella':['Patela','membro-inferior','patela',1],
  'tibia':['Tíbia','membro-inferior','tibia',1], 'fibula':['Fíbula','membro-inferior','fibula',1], 'talus':['Tálus','membro-inferior','tarso'],
  'calcaneus':['Calcâneo','membro-inferior','tarso'], 'medial cuneiform bone':['Cuneiforme medial','membro-inferior','tarso'],
  'intermediate cuneiform bone':['Cuneiforme intermédio','membro-inferior','tarso'], 'lateral cuneiform bone':['Cuneiforme lateral','membro-inferior','tarso'],
  'cuboid bone':['Cuboide','membro-inferior','tarso'],
};
function osso(p) {
  const en = p.en, l = lado(en, p.c); let m;
  const base = en.replace(/\b(right|left) /, '');
  if ((m = en.match(new RegExp(`^(${ordRe}) (cervical|thoracic|lumbar) vertebra`)))) {
    const n = ord[m[1]], t = { cervical:['C','cervical','vertebras-cervicais'], thoracic:['T','torácica','vertebras-toracicas'], lumbar:['L','lombar','vertebras-lombares'] }[m[2]];
    return [`Vértebra ${t[1]} ${t[0]}${n}`, 'coluna', t[2]];
  }
  if ((m = en.match(new RegExp(`(${ordRe}) rib`)))) { const n = ord[m[1]]; return [`${n}ª costela${sfx(l, 1)}`, 'torax', n <= 7 ? 'costelas-verdadeiras' : n <= 10 ? 'costelas-falsas' : 'costelas-flutuantes']; }
  if ((m = en.match(new RegExp(`(${ordRe}) costal cartilage`)))) return [`Cartilagem costal da ${ord[m[1]]}ª costela${sfx(l, 1)}`, 'torax', 'costelas-verdadeiras'];
  if (/costal cartilage/.test(en)) return [`Cartilagens costais do arco costal${sfx(l)}`, 'torax', 'costelas-falsas'];
  if ((m = en.match(new RegExp(`(${ordRe}) metacarpal`)))) return [`${ord[m[1]]}º metacarpal${sfx(l)}`, 'membro-superior', 'metacarpos'];
  if ((m = en.match(new RegExp(`(${ordRe}) metatarsal`)))) return [`${ord[m[1]]}º metatarsal${sfx(l)}`, 'membro-inferior', 'metatarsos'];
  if ((m = en.match(/^(proximal|middle|distal) phalanx of (right|left) (.+)$/))) {
    const tipo = { proximal:'proximal', middle:'média', distal:'distal' }[m[1]];
    if (dedosMao[m[3]]) return [`Falange ${tipo} do ${dedosMao[m[3]]}${sfx(l)}`, 'membro-superior', 'falanges-mao'];
    return [`Falange ${tipo} do ${dedosPe[m[3]]}${sfx(l)}`, 'membro-inferior', 'falanges-pe'];
  }
  if ((m = en.match(/navicular bone of (right|left) foot/))) return [`Navicular${sfx(l)}`, 'membro-inferior', 'tarso'];
  if (/sesamoid/.test(en)) return [`Ossos sesamoides do pé${sfx(l)}`, 'membro-inferior', 'metatarsos'];
  const s = simples[base]; if (!s) throw new Error('sem tradução: ' + en);
  return [s[0] + sfx(l, s[3]), s[1], s[2]];
}
// Encéfalo: [nome, feminino, grupo, tópico, lobo/sub, descrição]
const enc = {
  'superior frontal gyrus':['Giro frontal superior',0,'cortex','lobos-cerebrais','frontal','Giro da face superolateral e medial do lobo frontal; contém a área motora suplementar e participa do planejamento motor e de funções executivas.'],
  'middle frontal gyrus':['Giro frontal médio',0,'cortex','lobos-cerebrais','frontal','Giro da face lateral do lobo frontal; abriga parte do córtex pré-frontal dorsolateral e o campo ocular frontal.'],
  'precentral gyrus':['Giro pré-central',0,'cortex','lobos-cerebrais','frontal','Situado imediatamente à frente do sulco central; corresponde ao córtex motor primário (área 4 de Brodmann), com representação somatotópica do corpo.'],
  'orbital gyri straight gyrus':['Giros orbitais e giro reto',0,'cortex','lobos-cerebrais','frontal','Face inferior (orbital) do lobo frontal, apoiada sobre o teto da órbita; relaciona-se com comportamento, tomada de decisão e olfação (o giro reto ladeia o sulco olfatório).'],
  'accessory short gyrus':['Giro frontal inferior',0,'cortex','lobos-cerebrais','frontal','Giro da parte inferior da face lateral do lobo frontal. No hemisfério dominante contém a área de Broca (partes opercular e triangular), ligada à expressão da linguagem. Observação: no conjunto BodyParts3D esta malha está rotulada como “accessory short gyrus”.'],
  'postcentral gyrus':['Giro pós-central',0,'cortex','lobos-cerebrais','parietal','Situado atrás do sulco central; corresponde ao córtex somatossensorial primário (áreas 3, 1 e 2 de Brodmann).'],
  'supramarginal gyrus':['Giro supramarginal',0,'cortex','lobos-cerebrais','parietal','Parte do lóbulo parietal inferior que contorna a extremidade posterior do sulco lateral; participa da integração sensorial e do processamento fonológico.'],
  'angular gyrus':['Giro angular',0,'cortex','lobos-cerebrais','parietal','Parte do lóbulo parietal inferior que contorna a extremidade do sulco temporal superior; relaciona-se com leitura, escrita e cálculo.'],
  'superior parietal lobule precuneus':['Lóbulo parietal superior e pré-cúneo',0,'cortex','lobos-cerebrais','parietal','Porção superior do lobo parietal (face lateral) e sua continuação na face medial (pré-cúneo); integra informações somatossensoriais e visuoespaciais.'],
  'superior temporal gyrus':['Giro temporal superior',0,'cortex','lobos-cerebrais','temporal','Giro situado abaixo do sulco lateral; contém o córtex auditivo primário (giros temporais transversos) e, na parte posterior do hemisfério dominante, a área de Wernicke.'],
  'middle temporal gyrus':['Giro temporal médio',0,'cortex','lobos-cerebrais','temporal','Giro da face lateral do lobo temporal, entre os sulcos temporais superior e inferior; participa de processamento visual associativo e semântico.'],
  'inferior temporal gyrus':['Giro temporal inferior',0,'cortex','lobos-cerebrais','temporal','Giro mais inferior da face lateral do lobo temporal; participa do reconhecimento visual de objetos.'],
  'fusiform gyrus':['Giro fusiforme (occipitotemporal lateral)',0,'cortex','lobos-cerebrais','temporal','Giro da face inferior dos lobos temporal e occipital; envolvido no reconhecimento de faces e de formas visuais complexas.'],
  'occipital lobe':['Lobo occipital',0,'cortex','lobos-cerebrais','occipital','Polo posterior do hemisfério cerebral; contém o córtex visual primário (área 17) nas margens do sulco calcarino.'],
  'insula':['Ínsula',1,'cortex','lobos-cerebrais','insular','Lobo situado na profundidade do sulco lateral, recoberto pelos opérculos frontal, parietal e temporal; relaciona-se com gustação, sensibilidade visceral e emoção.'],
  'cingulate gyrus':['Giro do cíngulo',0,'limbico','sistema-limbico','límbico','Giro da face medial que contorna o corpo caloso; componente do lobo límbico, ligado a emoção, motivação e atenção.'],
  'parahippocampal gyrus':['Giro para-hipocampal',0,'limbico','sistema-limbico','límbico','Giro da face inferomedial do lobo temporal; contém o córtex entorrinal, principal porta de entrada de informações para o hipocampo.'],
  'hippocampus':['Hipocampo',0,'limbico','sistema-limbico',null,'Elevação curva no assoalho do corno inferior (temporal) do ventrículo lateral; essencial para a consolidação da memória declarativa.'],
  'amygdala':['Corpo amigdaloide (amígdala)',0,'limbico','sistema-limbico',null,'Complexo nuclear situado no polo temporal, à frente do hipocampo; processa emoções, especialmente medo, e a memória emocional.'],
  'fornix of forebrain':['Fórnice',0,'limbico','sistema-limbico',null,'Feixe de fibras que parte do hipocampo, arqueia-se sob o corpo caloso e termina principalmente nos corpos mamilares; principal via eferente do hipocampo.'],
  'commissure of fornix of forebrain':['Comissura do fórnice',1,'limbico','sistema-limbico',null,'Fibras que cruzam a linha mediana entre os dois pilares do fórnice, conectando as formações hipocampais dos dois hemisférios.'],
  'stria terminalis':['Estria terminal',1,'limbico','sistema-limbico',null,'Feixe de fibras que acompanha o núcleo caudado, no sulco entre ele e o tálamo; conecta o corpo amigdaloide ao hipotálamo e à área septal.'],
  'mammillary body':['Corpos mamilares',0,'diencefalo','talamo-hipotalamo',null,'Par de eminências arredondadas do hipotálamo posterior, visíveis na base do encéfalo; recebem o fórnice e projetam-se para o tálamo anterior (circuito de Papez).'],
  'white matter structure of cerebral hemisphere':['Substância branca dos hemisférios cerebrais',1,'substancia-branca','telencefalo',null,'Centro branco medular: fibras mielínicas de associação, comissurais e de projeção (incluindo a cápsula interna) que conectam o córtex a outras regiões.'],
  'corpus callosum':['Corpo caloso',0,'substancia-branca','telencefalo',null,'Maior comissura do encéfalo; conecta áreas corticais correspondentes dos dois hemisférios cerebrais. Divide-se em rostro, joelho, tronco e esplênio.'],
  'anterior commissure':['Comissura anterior',1,'substancia-branca','telencefalo',null,'Feixe que cruza a linha mediana à frente das colunas do fórnice; conecta principalmente os lobos temporais e estruturas olfatórias.'],
  'posterior commissure':['Comissura posterior',1,'diencefalo','diencefalo',null,'Feixe que cruza a linha mediana na transição entre diencéfalo e mesencéfalo, acima da abertura do aqueduto; participa do reflexo fotomotor consensual.'],
  'lamina terminalis':['Lâmina terminal',1,'diencefalo','diencefalo',null,'Lâmina delgada que forma a parede anterior do terceiro ventrículo, entre a comissura anterior e o quiasma óptico.'],
  'caudate nucleus':['Núcleo caudado',0,'nucleos','ganglios-da-base',null,'Núcleo em forma de C (cabeça, corpo e cauda) que acompanha o ventrículo lateral; com o putame forma o estriado, principal porta de entrada dos núcleos da base.'],
  'putamen':['Putame',0,'nucleos','ganglios-da-base',null,'Parte lateral do núcleo lentiforme; com o núcleo caudado forma o estriado e recebe aferências do córtex cerebral e da substância negra.'],
  'globus pallidus':['Globo pálido',0,'nucleos','ganglios-da-base',null,'Parte medial do núcleo lentiforme, com segmentos externo e interno; o segmento interno é uma das principais vias de saída dos núcleos da base para o tálamo.'],
  'thalamus':['Tálamo',0,'diencefalo','talamo-hipotalamo',null,'Massa ovoide de substância cinzenta que forma a parede lateral do terceiro ventrículo; estação de retransmissão de quase todas as vias sensitivas (exceto a olfatória) e de circuitos motores para o córtex.'],
  'hypothalamus, nsn':['Hipotálamo',0,'diencefalo','talamo-hipotalamo',null,'Região do diencéfalo abaixo do sulco hipotalâmico, no assoalho e na parte inferior das paredes do terceiro ventrículo; controla o sistema nervoso autônomo, o sistema endócrino (via hipófise) e a homeostase.'],
  'tuber cinereum':['Túber cinéreo',0,'diencefalo','talamo-hipotalamo',null,'Área de substância cinzenta do hipotálamo entre o quiasma óptico e os corpos mamilares; dele parte o infundíbulo, que sustenta a hipófise.'],
  'pituitary gland':['Hipófise',1,'diencefalo','talamo-hipotalamo',null,'Glândula endócrina alojada na sela turca do esfenoide e presa ao hipotálamo pelo infundíbulo; possui adeno-hipófise e neuro-hipófise.'],
  'pineal body':['Glândula pineal',1,'diencefalo','diencefalo',null,'Glândula endócrina do epitálamo, na linha mediana, acima dos colículos superiores; secreta melatonina e participa da regulação do ritmo circadiano.'],
  'habenula':['Habênula',1,'diencefalo','diencefalo',null,'Pequeno conjunto de núcleos do epitálamo, junto à glândula pineal; integra circuitos límbicos com o tronco encefálico.'],
  'stria medullaris of thalamus':['Estria medular do tálamo',1,'diencefalo','diencefalo',null,'Feixe de fibras na face medial do tálamo que leva aferências da área septal e do hipotálamo aos núcleos da habênula.'],
  'lateral geniculate body':['Corpo geniculado lateral',0,'diencefalo','talamo-hipotalamo',null,'Núcleo do metatálamo que recebe o trato óptico e projeta-se, pela radiação óptica, para o córtex visual primário.'],
  'medial geniculate body':['Corpo geniculado medial',0,'diencefalo','talamo-hipotalamo',null,'Núcleo do metatálamo que recebe o braço do colículo inferior e projeta-se para o córtex auditivo primário.'],
  'optic nerve':['Nervo óptico (NC II)',0,'vias-opticas','nervos-cranianos',null,'Segundo nervo craniano, puramente sensitivo; conduz os axônios das células ganglionares da retina até o quiasma óptico, atravessando o canal óptico.'],
  'optic chiasm':['Quiasma óptico',0,'vias-opticas','nervos-cranianos',null,'Local de cruzamento parcial das fibras dos nervos ópticos: cruzam as fibras provenientes das metades nasais das retinas.'],
  'optic tract':['Trato óptico',0,'vias-opticas','nervos-cranianos',null,'Continuação da via óptica após o quiasma; contorna o pedúnculo cerebral e termina principalmente no corpo geniculado lateral.'],
  'midbrain, nsn':['Mesencéfalo (tegmento e teto)',0,'tronco','mesencefalo',null,'Parte do tronco encefálico entre a ponte e o diencéfalo, atravessada pelo aqueduto do mesencéfalo. O tegmento contém o núcleo rubro, a substância negra e os núcleos dos nervos oculomotor e troclear.'],
  'peduncle of midbrain':['Pedúnculos cerebrais',0,'tronco','mesencefalo',null,'Porção anterior do mesencéfalo; suas bases contêm as fibras descendentes corticospinais, corticonucleares e corticopontinas. Entre eles está a fossa interpeduncular.'],
  'interpeduncular fossa':['Fossa interpeduncular',1,'tronco','mesencefalo',null,'Depressão mediana entre os pedúnculos cerebrais, na face anterior do mesencéfalo; por ela emerge o nervo oculomotor (NC III).'],
  'superior colliculus':['Colículo superior',0,'tronco','mesencefalo',null,'Eminência do teto do mesencéfalo relacionada a reflexos visuais e à coordenação dos movimentos dos olhos e da cabeça.'],
  'inferior colliculus':['Colículo inferior',0,'tronco','mesencefalo',null,'Eminência do teto do mesencéfalo que funciona como estação da via auditiva; projeta-se ao corpo geniculado medial.'],
  'brachium of superior colliculus':['Braço do colículo superior',0,'tronco','mesencefalo',null,'Feixe que liga o colículo superior ao corpo geniculado lateral e ao trato óptico.'],
  'brachium of inferior colliculus':['Braço do colículo inferior',0,'tronco','mesencefalo',null,'Feixe da via auditiva que liga o colículo inferior ao corpo geniculado medial.'],
  'pons':['Ponte',1,'tronco','ponte',null,'Parte média do tronco encefálico, entre o mesencéfalo e o bulbo, à frente do cerebelo. Sua base contém os núcleos pontinos e fibras transversais que formam os pedúnculos cerebelares médios.'],
  'medulla oblongata':['Bulbo (medula oblonga)',0,'tronco','bulbo',null,'Parte inferior do tronco encefálico, contínua com a medula espinal no forame magno. Contém as pirâmides, as olivas e centros vitais respiratório e cardiovascular.'],
  'central canal of spinal cord':['Canal central (bulbo e início da medula espinal)',0,'ventriculos','medula-espinal',null,'Canal estreito revestido por epêndima que continua o quarto ventrículo inferiormente, percorrendo a parte fechada do bulbo e a medula espinal.'],
  'cerebellum':['Cerebelo',0,'cerebelo','cerebelo',null,'Situado na fossa posterior do crânio, atrás do tronco encefálico e abaixo do tentório do cerebelo. Formado pelo verme e por dois hemisférios; coordena movimentos, equilíbrio e tônus muscular.'],
  'lateral ventricle':['Ventrículo lateral',0,'ventriculos','ventriculos',null,'Cavidade de cada hemisfério cerebral, com corno frontal, parte central, corno occipital e corno temporal; comunica-se com o terceiro ventrículo pelo forame interventricular.'],
  'third ventricle':['Terceiro ventrículo',0,'ventriculos','ventriculos',null,'Cavidade mediana e estreita do diencéfalo, entre os dois tálamos; comunica-se com o quarto ventrículo pelo aqueduto do mesencéfalo.'],
  'fourth ventricle':['Quarto ventrículo',0,'ventriculos','ventriculos',null,'Cavidade situada entre a ponte e o bulbo (à frente) e o cerebelo (atrás); abre-se no espaço subaracnóideo pelas aberturas mediana e laterais.'],
  'choroid plexus of cerebral hemisphere':['Plexo corióideo do ventrículo lateral',0,'ventriculos','lcs',null,'Estrutura vascular revestida por epêndima modificado, no interior do ventrículo lateral; principal local de produção do líquido cerebrospinal.'],
};
function neuro(p) {
  const l = lado(p.en, p.c);
  const base = p.en.replace(/\b(right|left) /, '').replace(/^(anterior|posterior) part of /, (m, a) => { p._parte = a === 'anterior' ? 'parte anterior' : 'parte posterior'; return ''; });
  const e = enc[base]; if (!e) throw new Error('sem tradução: ' + p.en);
  const nome = e[0] + (p._parte ? ` (${p._parte})` : '') + sfx(l, e[1]);
  return { nome, grupo: e[2], topico: e[3], sub: e[4], desc: e[5] };
}
const sk = JSON.parse(fs.readFileSync(inDir + '/esqueleto.raw.json', 'utf8')).map((p) => { const [nome, grupo, topico] = osso(p); return { id: p.id, nome, grupo, topico, lado: lado(p.en, p.c), c: p.c, s: p.s }; });
const br = JSON.parse(fs.readFileSync(inDir + '/encefalo.raw.json', 'utf8')).map((p) => ({ id: p.id, ...neuro(p), lado: lado(p.en, p.c), c: p.c, s: p.s }));
fs.writeFileSync(outDir + '/esqueleto.json', JSON.stringify(sk));
fs.writeFileSync(outDir + '/encefalo.json', JSON.stringify(br));
console.log('esqueleto', sk.length, 'encefalo', br.length);
const dup = (a) => a.map((x) => x.nome).filter((n, i, arr) => arr.indexOf(n) !== i);
console.log('duplicados', dup(sk), dup(br));

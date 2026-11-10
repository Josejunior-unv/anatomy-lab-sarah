import fs from 'node:fs';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { weld, simplify, normals, reorder, quantize, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
const [,, which, ratioArg, outPath] = process.argv;
const dir = (process.env.BP3D_DIR || './bp3d') + '/';
const have = fs.readFileSync(dir+'have.txt','utf8').trim().split('\n').map(l=>{const [id,name]=l.split(':');return {id,name};});
const boneRe = /bone|vertebra|\brib\b|phalanx|scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|talus|calcaneus|femur|tibia$|fibula$|patella|humerus|radius|ulna$|clavicle|scapula|sternum|manubrium|xiphoid|sacrum|atlas|axis$|mandible|maxilla|vomer|ethmoid|concha|costal cart|tooth/;
const notNeuro = /lung|coccyg|disk|subscapularis|levator/;
let parts;
if (which==='skeleton') {
  parts = have.filter(p=>boneRe.test(p.name) && !/disk|subscapularis|levator/.test(p.name));
  const teeth = parts.filter(p=>/tooth/.test(p.name)); parts = parts.filter(p=>!/tooth/.test(p.name));
  parts.push({id:'DENTES_SUP',name:'upper teeth',src:teeth.filter(t=>/upper/.test(t.name)).map(t=>t.id)});
  parts.push({id:'DENTES_INF',name:'lower teeth',src:teeth.filter(t=>/lower/.test(t.name)).map(t=>t.id)});
} else parts = have.filter(p=>!boneRe.test(p.name) && !notNeuro.test(p.name));
function readStl(id){ const b=fs.readFileSync(`${dir}stl/${id}.stl`); const n=b.readUInt32LE(80); const pos=new Float32Array(n*9);
  for(let i=0;i<n;i++){const o=84+i*50+12; for(let v=0;v<3;v++){const x=b.readFloatLE(o+v*12),y=b.readFloatLE(o+v*12+4),z=b.readFloatLE(o+v*12+8);
    pos[i*9+v*3]=x*0.001; pos[i*9+v*3+1]=z*0.001; pos[i*9+v*3+2]=-y*0.001;}} return pos; }
const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene('root');
const mat = doc.createMaterial('base').setBaseColorFactor([0.9,0.88,0.82,1]).setRoughnessFactor(0.7).setMetallicFactor(0);
let total=0, after=0; const manifest=[]; await MeshoptSimplifier.ready; await MeshoptEncoder.ready; const ratio=parseFloat(ratioArg);
for (const p of parts) {
  const arrs=(p.src||[p.id]).map(readStl); const len=arrs.reduce((a,b)=>a+b.length,0); const pos=new Float32Array(len); let o=0; for(const a of arrs){pos.set(a,o);o+=a.length;}
  total+=len/9;
  const min=[1e9,1e9,1e9],max=[-1e9,-1e9,-1e9]; for(let i=0;i<pos.length;i+=3) for(let k=0;k<3;k++){min[k]=Math.min(min[k],pos[i+k]);max[k]=Math.max(max[k],pos[i+k]);}
  manifest.push({id:p.id,en:p.name,tris:len/9,c:min.map((m,k)=>+((m+max[k])/2).toFixed(4)),s:min.map((m,k)=>+(max[k]-m).toFixed(4))});
    // weld
  const map=new Map(); const vp=[]; const idx=new Uint32Array(len/3);
  for(let i=0;i<len/3;i++){const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2];const k=Math.round(x*1e5)+','+Math.round(y*1e5)+','+Math.round(z*1e5);let v=map.get(k);if(v===undefined){v=vp.length/3;map.set(k,v);vp.push(x,y,z);}idx[i]=v;}
  let P=new Float32Array(vp); const tris=idx.length/3; const r=Math.min(1,Math.max(ratio,600/tris));
  let I=idx; if(r<1){ I=MeshoptSimplifier.simplify(idx,P,3,Math.floor(tris*r)*3,0.02)[0]; }
  // drop degenerate, compact
  const remap=new Int32Array(P.length/3).fill(-1); const np=[]; const ni=[];
  for(let i=0;i<I.length;i+=3){const a=I[i],b=I[i+1],c=I[i+2]; if(a===b||b===c||a===c)continue; for(const v of [a,b,c]){if(remap[v]<0){remap[v]=np.length/3;np.push(P[v*3],P[v*3+1],P[v*3+2]);}ni.push(remap[v]);}}
  P=new Float32Array(np); I=new Uint32Array(ni); const N=new Float32Array(P.length);
  for(let i=0;i<I.length;i+=3){const a=I[i]*3,b=I[i+1]*3,c=I[i+2]*3;const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(const v of [a,b,c]){N[v]+=nx;N[v+1]+=ny;N[v+2]+=nz;}}
  for(let i=0;i<N.length;i+=3){const l=Math.hypot(N[i],N[i+1],N[i+2])||1;N[i]/=l;N[i+1]/=l;N[i+2]/=l;}
  after+=I.length/3;
  const prim=doc.createPrimitive().setIndices(doc.createAccessor().setType('SCALAR').setArray(I).setBuffer(buf)).setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(P).setBuffer(buf)).setAttribute('NORMAL',doc.createAccessor().setType('VEC3').setArray(N).setBuffer(buf)).setMaterial(mat);
  const mesh=doc.createMesh(p.id).addPrimitive(prim);
  scene.addChild(doc.createNode(p.id).setMesh(mesh));
}
console.log(which,'parts',parts.length,'tris',total);
await doc.transform(reorder({encoder:MeshoptEncoder}), quantize({quantizePosition:14,quantizeNormal:8}));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});

const io=new NodeIO().registerExtensions([EXTMeshoptCompression,KHRMeshQuantization]).registerDependencies({'meshopt.encoder':MeshoptEncoder});
await io.write(outPath,doc);
fs.writeFileSync(outPath.replace(/\.glb$/,'.raw.json'),JSON.stringify(manifest));
console.log('after tris',after,'size',(fs.statSync(outPath).size/1e6).toFixed(2)+'MB');

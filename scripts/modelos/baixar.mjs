import fs from 'node:fs';
import { execFile } from 'node:child_process';
const [,, list, out] = process.argv;
const ids = fs.readFileSync(list,'utf8').split('\n').filter(Boolean);
const B='https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/assets/BodyParts3D_data/stl/';
let i=0, ok=0, miss=[];
const run = () => new Promise(res=>{
  const next=()=>{ if(i>=ids.length) return res(); const id=ids[i++]; const f=`${out}/${id}.stl`;
    if (fs.existsSync(f)) { ok++; return next(); }
    execFile('curl',['-sS','-m','180','--retry','3','-o',f+'.part','-w','%{http_code}',B+id+'.stl'],(e,so)=>{
      if(so.trim()==='200'){fs.renameSync(f+'.part',f);ok++;} else {try{fs.unlinkSync(f+'.part')}catch{} miss.push(id+' '+so.trim());}
      next(); }); };
  next(); });
await Promise.all(Array.from({length:12},run));
fs.writeFileSync(out+'/../miss.txt',miss.join('\n'));
console.log('ok',ok,'miss',miss.length);

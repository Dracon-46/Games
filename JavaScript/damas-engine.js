// Motor de damas (regras brasileiras): 'w'/'W' sobem o tabuleiro, 'b'/'B' descem. Maiúscula = dama.
const Damas=(()=>{
const D=[[-1,-1],[-1,1],[1,-1],[1,1]],side=p=>p?p.toLowerCase():'',inb=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
function start(){const b=Array(64).fill('');for(let i=0;i<64;i++){const r=i>>3;if(((r+(i&7))&1)){if(r<3)b[i]='b';else if(r>4)b[i]='w'}}return b}
function caps(b,from,r,c,p,taken,path,out){let found=false;const me=side(p),free=q=>!b[q]||q===from;
 for(const[dr,dc]of D){
  if(p===me){const r2=r+2*dr,c2=c+2*dc;if(!inb(r2,c2))continue;const m=(r+dr)*8+c+dc,l=r2*8+c2;
   if(b[m]&&side(b[m])!==me&&!taken.includes(m)&&free(l)){found=true;caps(b,from,r2,c2,p,taken.concat(m),path.concat(l),out)}}
  else{let rr=r+dr,cc=c+dc;while(inb(rr,cc)&&free(rr*8+cc)){rr+=dr;cc+=dc}
   if(!inb(rr,cc))continue;const m=rr*8+cc;if(side(b[m])===me||taken.includes(m))continue;rr+=dr;cc+=dc;
   while(inb(rr,cc)&&free(rr*8+cc)){found=true;caps(b,from,rr,cc,p,taken.concat(m),path.concat(rr*8+cc),out);rr+=dr;cc+=dc}}}
 if(!found&&taken.length)out.push({path,caps:taken})}
function moves(b,t){let out=[];for(let i=0;i<64;i++)if(side(b[i])===t)caps(b,i,i>>3,i&7,b[i],[],[i],out);
 if(out.length){const mx=Math.max(...out.map(m=>m.caps.length));return out.filter(m=>m.caps.length===mx)}
 for(let i=0;i<64;i++){const p=b[i];if(side(p)!==t)continue;const r=i>>3,c=i&7;
  for(const[dr,dc]of D){if(p===t){if(dr!==(t==='w'?-1:1))continue;const rr=r+dr,cc=c+dc;if(inb(rr,cc)&&!b[rr*8+cc])out.push({path:[i,rr*8+cc],caps:[]})}
   else{let rr=r+dr,cc=c+dc;while(inb(rr,cc)&&!b[rr*8+cc]){out.push({path:[i,rr*8+cc],caps:[]});rr+=dr;cc+=dc}}}}
 return out}
function apply(b,m){const n=b.slice(),f=m.path[0],to=m.path[m.path.length-1];let p=n[f];n[f]='';for(const q of m.caps)n[q]='';
 if(p==='w'&&to<8)p='W';if(p==='b'&&to>55)p='B';n[to]=p;return n}
function ev(b){let v=0;for(let i=0;i<64;i++){const p=b[i];if(!p)continue;const r=i>>3;v+=p==='b'?10+r*.4:p==='B'?32:p==='w'?-10-(7-r)*.4:-32}return v}
function search(b,t,d,a,be){const ms=moves(b,t);if(!ms.length)return-1e5-d;if(d<=0&&!ms[0].caps.length)return(t==='b'?1:-1)*ev(b);
 for(const m of ms){const v=-search(apply(b,m),t==='w'?'b':'w',d-1,-be,-a);if(v>a){a=v;if(a>=be)break}}return a}
function best(b,t,depth){const ms=moves(b,t).sort(()=>Math.random()-.5);let bm=null,a=-Infinity;
 for(const m of ms){const v=-search(apply(b,m),t==='w'?'b':'w',depth-1,-Infinity,-a);if(v>a){a=v;bm=m}}return bm}
return{start,moves,apply,best}})();
if(typeof module!=='undefined')module.exports=Damas;

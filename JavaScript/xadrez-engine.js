// Motor de xadrez: tabuleiro de 64 casas (0 = a8), maiúsculas = brancas.
// Estado: b (casas), t (vez), c (direitos de roque), ep, h (meio-lances sem captura/peão),
// v (variante: c clássico, 9 Chess960, k rei da colina, 3 três xeques), rs (casas iniciais das torres), cw/cb (xeques dados).
const Chess=(()=>{
const ND=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],BD=[[-1,-1],[-1,1],[1,-1],[1,1]],RD=[[-1,0],[1,0],[0,-1],[0,1]],KD=BD.concat(RD);
const isW=p=>p>='A'&&p<='Z',own=(p,t)=>p!==' '&&(isW(p)?'w':'b')===t,opp=t=>t==='w'?'b':'w';
function backRank(v){if(v!=='9')return'rnbqkbnr';const r=Array(8).fill(''),free=()=>r.map((x,i)=>x?-1:i).filter(i=>i>=0),pick=a=>a[Math.random()*a.length|0];
 r[pick([0,2,4,6])]='b';r[pick([1,3,5,7])]='b';r[pick(free())]='q';r[pick(free())]='n';r[pick(free())]='n';const f=free();r[f[0]]='r';r[f[1]]='k';r[f[2]]='r';return r.join('')}
function start(v='c'){const br=backRank(v),b=(br+'pppppppp'+' '.repeat(32)+'PPPPPPPP'+br.toUpperCase()).split(''),q=br.indexOf('r'),k=br.lastIndexOf('r');
 return{b,t:'w',c:'KQkq',ep:-1,h:0,v,rs:{K:56+k,Q:56+q,k,q},cw:0,cb:0}}
function attacked(b,sq,by){const r=sq>>3,c=sq&7,w=by==='w',pr=r+(w?1:-1),P=w?'P':'p',N=w?'N':'n',K=w?'K':'k',B=w?'B':'b',R=w?'R':'r',Q=w?'Q':'q';
 if(pr>=0&&pr<8&&((c>0&&b[pr*8+c-1]===P)||(c<7&&b[pr*8+c+1]===P)))return true;
 for(const[dr,dc]of ND){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===N)return true}
 for(const[dr,dc]of KD){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===K)return true}
 for(let k=0;k<8;k++){const[dr,dc]=KD[k],S=k<4?B:R;let rr=r+dr,cc=c+dc;
  while(rr>=0&&rr<8&&cc>=0&&cc<8){const p=b[rr*8+cc];if(p!==' '){if(p===S||p===Q)return true;break}rr+=dr;cc+=dc}}
 return false}
const inCheck=(s,t)=>attacked(s.b,s.b.indexOf(t==='w'?'K':'k'),opp(t));
function gen(s){const b=s.b,t=s.t,ms=[];
 for(let i=0;i<64;i++){const p=b[i];if(!own(p,t))continue;const r=i>>3,c=i&7,k=p.toUpperCase();
  if(k==='P'){const d=t==='w'?-1:1,nr=r+d,last=t==='w'?0:7;if(nr<0||nr>7)continue;
   const push=to=>{if(nr===last)for(const x of'QRBN')ms.push({f:i,t:to,pr:t==='w'?x:x.toLowerCase()});else ms.push({f:i,t:to})};
   if(b[nr*8+c]===' '){push(nr*8+c);if(r===(t==='w'?6:1)&&b[(r+2*d)*8+c]===' ')ms.push({f:i,t:(r+2*d)*8+c,dp:1})}
   for(const dc of[-1,1]){const nc=c+dc;if(nc<0||nc>7)continue;const to=nr*8+nc;if(b[to]!==' '){if(!own(b[to],t))push(to)}else if(to===s.ep)ms.push({f:i,t:to,ep:1})}
  }else if(k==='N'||k==='K'){for(const[dr,dc]of k==='N'?ND:KD){const rr=r+dr,cc=c+dc;if(rr<0||rr>7||cc<0||cc>7)continue;const to=rr*8+cc;if(!own(b[to],t))ms.push({f:i,t:to})}
   if(k==='K'&&s.c){const o=opp(t),home=t==='w'?56:0,rk=t==='w'?'R':'r';
    for(const sd of t==='w'?'KQ':'kq'){if(!s.c.includes(sd))continue;const rf=s.rs[sd],ksd=sd==='K'||sd==='k',kt=home+(ksd?6:2),rt=home+(ksd?5:3);
     if(b[rf]!==rk||(i>>3)!==(home>>3))continue;let ok=true;
     for(let q=Math.min(i,rf,kt,rt);q<=Math.max(i,rf,kt,rt)&&ok;q++)if(q!==i&&q!==rf&&b[q]!==' ')ok=false;
     for(let q=Math.min(i,kt);q<=Math.max(i,kt)&&ok;q++)if(attacked(b,q,o))ok=false;
     if(ok)ms.push({f:i,t:kt,cs:1,rf,rt})}}
  }else{for(const[dr,dc]of k==='B'?BD:k==='R'?RD:KD){let rr=r+dr,cc=c+dc;
    while(rr>=0&&rr<8&&cc>=0&&cc<8){const to=rr*8+cc;if(b[to]===' ')ms.push({f:i,t:to});else{if(!own(b[to],t))ms.push({f:i,t:to});break}rr+=dr;cc+=dc}}}}
 return ms}
function make(s,m){const b=s.b.slice(),p=b[m.f];let c=s.c;const cap=b[m.t]!==' '&&!m.cs;
 if(m.cs){const rk=b[m.rf];b[m.f]=' ';b[m.rf]=' ';b[m.t]=p;b[m.rt]=rk}else{b[m.t]=m.pr||p;b[m.f]=' '}
 if(m.ep)b[m.t+(s.t==='w'?8:-8)]=' ';
 if(c){if(p==='K')c=c.replace(/[KQ]/g,'');if(p==='k')c=c.replace(/[kq]/g,'');
  for(const q of[m.f,m.t])for(const x of'KQkq')if(q===s.rs[x]&&!(m.cs))c=c.replace(x,'')}
 const n={b,t:opp(s.t),c,ep:m.dp?(m.f+m.t)/2:-1,h:cap||m.ep||p==='P'||p==='p'?0:s.h+1,v:s.v,rs:s.rs,cw:s.cw,cb:s.cb};
 if(s.v==='3'&&inCheck(n,n.t)){if(s.t==='w')n.cw++;else n.cb++}
 return n}
// Vitória por regra da variante, avaliada logo após o lance (quem acabou de jogar pode ter vencido).
function varWinner(s){const mv=opp(s.t);if(s.v==='k'){const k=s.b.indexOf(mv==='w'?'K':'k');if(k===27||k===28||k===35||k===36)return mv}
 if(s.v==='3'&&(mv==='w'?s.cw:s.cb)>=3)return mv;return null}
const legal=s=>gen(s).filter(m=>!inCheck(make(s,m),s.t));
const key=s=>s.b.join('')+s.t+s.c+s.ep+(s.v==='3'?s.cw+''+s.cb:'');
function insufficient(b){const p=b.filter(x=>x!==' '&&x!=='K'&&x!=='k');if(!p.length)return true;if(p.length===1)return'NnBb'.includes(p[0]);
 if(p.every(x=>x==='B'||x==='b')){const cs=new Set;b.forEach((x,i)=>{if(x==='B'||x==='b')cs.add(((i>>3)+(i&7))&1)});return cs.size===1}return false}
const SQ=i=>'abcdefgh'[i&7]+(8-(i>>3)),LT={K:'R',Q:'D',R:'T',B:'B',N:'C'};
function san(s,m){let o;const p=s.b[m.f].toUpperCase();
 if(m.cs)o=(m.t&7)===6?'O-O':'O-O-O';else{const cap=s.b[m.t]!==' '||m.ep;
  if(p==='P')o=(cap?'abcdefgh'[m.f&7]+'x':'')+SQ(m.t)+(m.pr?'='+LT[m.pr.toUpperCase()]:'');
  else{const oth=legal(s).filter(x=>x.t===m.t&&x.f!==m.f&&s.b[x.f]===s.b[m.f]&&!x.cs);let d='';
   if(oth.length)d=!oth.some(x=>(x.f&7)===(m.f&7))?'abcdefgh'[m.f&7]:!oth.some(x=>(x.f>>3)===(m.f>>3))?8-(m.f>>3):SQ(m.f);
   o=LT[p]+d+(cap?'x':'')+SQ(m.t)}}
 const n=make(s,m);if(varWinner(n))return o+'#';if(inCheck(n,n.t))o+=legal(n).length?'+':'#';return o}
// ---- Busca ----
const VAL={P:100,N:320,B:330,R:500,Q:900,K:0};
function evalW(s){const b=s.b;let v=0,bw=0,bb=0;for(let i=0;i<64;i++){const p=b[i];if(p===' ')continue;const w=isW(p),k=p.toUpperCase(),r=i>>3,c=i&7,ctr=7-Math.abs(r-3.5)-Math.abs(c-3.5);
  let x=VAL[k];if(k==='P')x+=(w?6-r:r-1)*(w?6-r:r-1)*1.5+(c>2&&c<5?ctr*4:0);else if(k==='N')x+=ctr*7;else if(k==='B'){x+=ctr*4;w?bw++:bb++}else if(k==='R')x+=(w?r===1:r===6)?20:0;else if(k==='Q')x+=ctr*2;
  else x+=s.v==='k'?ctr*25:-ctr*5;v+=w?x:-x}
 if(bw>1)v+=30;if(bb>1)v-=30;if(s.v==='3')v+=(s.cw-s.cb)*250;return v}
let nodes,deadline,abort;
const ord=(s,m)=>(s.b[m.t]!==' '&&!m.cs?10*VAL[s.b[m.t].toUpperCase()]-VAL[s.b[m.f].toUpperCase()]/10+1000:0)+(m.pr?VAL[m.pr.toUpperCase()]:0);
function sorted(s,ms){for(const m of ms)m.o=ord(s,m);return ms.sort((x,y)=>y.o-x.o)}
function quies(s,a,be,d){const st=(s.t==='w'?1:-1)*evalW(s);if(st>=be)return st;if(st>a)a=st;if(!d)return a;
 const ms=sorted(s,gen(s).filter(m=>(s.b[m.t]!==' '&&!m.cs)||m.ep||m.pr==='Q'||m.pr==='q'));
 for(const m of ms){const n=make(s,m);if(inCheck(n,s.t))continue;const v=-quies(n,-be,-a,d-1);if(v>a){a=v;if(a>=be)break}}return a}
function search(s,d,a,be,ply){if((++nodes&1023)===0&&Date.now()>deadline)abort=true;if(abort)return 0;
 if(s.v!=='c'&&s.v!=='9'&&varWinner(s))return-1e6+ply;if(s.h>=100)return 0;
 const chk=inCheck(s,s.t);if(chk&&d<=2)d++;if(d<=0)return quies(s,a,be,4);
 let n=0;for(const m of sorted(s,gen(s))){const x=make(s,m);if(inCheck(x,s.t))continue;n++;const v=-search(x,d-1,-be,-a,ply+1);if(v>a){a=v;if(a>=be)break}}
 return n?a:chk?-1e6+ply:0}
// o: {depth, time (ms), rand (0..1 chance de lance aleatório)}
function best(s,o={}){const ms=legal(s);if(!ms.length)return null;if(o.rand&&Math.random()<o.rand)return ms[Math.random()*ms.length|0];
 ms.sort(()=>Math.random()-.5);sorted(s,ms);nodes=0;abort=false;deadline=Date.now()+(o.time||1e9);let bm=ms[0];
 for(let d=1;d<=(o.depth||3);d++){let a=-Infinity,cur=null;
  for(const m of ms){const v=-search(make(s,m),d-1,-Infinity,-a,1);if(abort)break;if(v>a){a=v;cur=m}}
  if(cur){bm=cur;ms.splice(ms.indexOf(cur),1);ms.unshift(cur)}if(abort||a>9e5)break}
 return bm}
return{start,legal,make,inCheck,best,gen,san,key,insufficient,varWinner}})();
if(typeof module!=='undefined')module.exports=Chess;

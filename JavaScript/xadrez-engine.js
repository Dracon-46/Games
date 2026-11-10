// Motor de xadrez: tabuleiro de 64 casas (0 = a8), maiúsculas = brancas.
const Chess=(()=>{
const ND=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],BD=[[-1,-1],[-1,1],[1,-1],[1,1]],RD=[[-1,0],[1,0],[0,-1],[0,1]],KD=BD.concat(RD);
const isW=p=>p>='A'&&p<='Z',own=(p,t)=>p!==' '&&(isW(p)?'w':'b')===t,opp=t=>t==='w'?'b':'w';
const start=()=>({b:('rnbqkbnrpppppppp'+' '.repeat(32)+'PPPPPPPPRNBQKBNR').split(''),t:'w',c:'KQkq',ep:-1});
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
   const push=to=>ms.push(nr===last?{f:i,t:to,pr:t==='w'?'Q':'q'}:{f:i,t:to});
   if(b[nr*8+c]===' '){push(nr*8+c);if(r===(t==='w'?6:1)&&b[(r+2*d)*8+c]===' ')ms.push({f:i,t:(r+2*d)*8+c,dp:1})}
   for(const dc of[-1,1]){const nc=c+dc;if(nc<0||nc>7)continue;const to=nr*8+nc;if(b[to]!==' '){if(!own(b[to],t))push(to)}else if(to===s.ep)ms.push({f:i,t:to,ep:1})}
  }else if(k==='N'||k==='K'){for(const[dr,dc]of k==='N'?ND:KD){const rr=r+dr,cc=c+dc;if(rr<0||rr>7||cc<0||cc>7)continue;const to=rr*8+cc;if(!own(b[to],t))ms.push({f:i,t:to})}
   if(k==='K'){const o=opp(t),h=t==='w'?60:4,[ks,qs,rk]=t==='w'?['K','Q','R']:['k','q','r'];
    if(i===h&&!attacked(b,h,o)){
     if(s.c.includes(ks)&&b[h+1]===' '&&b[h+2]===' '&&b[h+3]===rk&&!attacked(b,h+1,o)&&!attacked(b,h+2,o))ms.push({f:i,t:h+2,cs:1});
     if(s.c.includes(qs)&&b[h-1]===' '&&b[h-2]===' '&&b[h-3]===' '&&b[h-4]===rk&&!attacked(b,h-1,o)&&!attacked(b,h-2,o))ms.push({f:i,t:h-2,cs:1})}}
  }else{for(const[dr,dc]of k==='B'?BD:k==='R'?RD:KD){let rr=r+dr,cc=c+dc;
    while(rr>=0&&rr<8&&cc>=0&&cc<8){const to=rr*8+cc;if(b[to]===' ')ms.push({f:i,t:to});else{if(!own(b[to],t))ms.push({f:i,t:to});break}rr+=dr;cc+=dc}}}}
 return ms}
function make(s,m){const b=s.b.slice(),p=b[m.f];let c=s.c;b[m.t]=m.pr||p;b[m.f]=' ';
 if(m.ep)b[m.t+(s.t==='w'?8:-8)]=' ';
 if(m.cs){if(m.t>m.f){b[m.t-1]=b[m.t+1];b[m.t+1]=' '}else{b[m.t+1]=b[m.t-2];b[m.t-2]=' '}}
 if(c){if(p==='K')c=c.replace(/[KQ]/g,'');if(p==='k')c=c.replace(/[kq]/g,'');
  for(const q of[m.f,m.t])c=q===63?c.replace('K',''):q===56?c.replace('Q',''):q===7?c.replace('k',''):q===0?c.replace('q',''):c}
 return{b,t:opp(s.t),c,ep:m.dp?(m.f+m.t)/2:-1}}
const legal=s=>gen(s).filter(m=>!inCheck(make(s,m),s.t));
const VAL={P:100,N:320,B:330,R:500,Q:900,K:0};
function evalW(b){let v=0;for(let i=0;i<64;i++){const p=b[i];if(p===' ')continue;const w=isW(p),k=p.toUpperCase(),r=i>>3,c=i&7,ctr=7-Math.abs(r-3.5)-Math.abs(c-3.5);
  let x=VAL[k];if(k==='P')x+=(w?6-r:r-1)*6+(c>2&&c<5?ctr*3:0);else if(k==='N'||k==='B')x+=ctr*6;else if(k==='Q')x+=ctr*2;else if(k==='K')x-=ctr*4;v+=w?x:-x}return v}
function search(s,d,a,be){const ms=legal(s);if(!ms.length)return inCheck(s,s.t)?-1e6-d:0;if(d===0)return(s.t==='w'?1:-1)*evalW(s.b);
 ms.sort((x,y)=>(s.b[y.t]!==' ')-(s.b[x.t]!==' '));
 for(const m of ms){const v=-search(make(s,m),d-1,-be,-a);if(v>a){a=v;if(a>=be)break}}return a}
function best(s,depth){const ms=legal(s);if(!ms.length)return null;ms.sort(()=>Math.random()-.5).sort((x,y)=>(s.b[y.t]!==' ')-(s.b[x.t]!==' '));
 let bm=ms[0],a=-Infinity;for(const m of ms){const v=-search(make(s,m),depth-1,-Infinity,-a);if(v>a){a=v;bm=m}}return bm}
return{start,legal,make,inCheck,best,gen}})();
if(typeof module!=='undefined')module.exports=Chess;

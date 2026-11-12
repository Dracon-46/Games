// Testes dos motores de regras (rodar com: npm run test:unit)
const test=require('node:test'),assert=require('node:assert');
const Chess=require('../../JavaScript/xadrez-engine.js'),Damas=require('../../JavaScript/damas-engine.js');
const perft=(s,d)=>d?Chess.legal(s).reduce((n,m)=>n+perft(Chess.make(s,m),d-1),0):1;
const fen=(f,t,c,rs,v='c')=>({b:f.split('/').map(r=>r.replace(/\d/g,n=>' '.repeat(n))).join('').split(''),t,c,ep:-1,h:0,v,rs:rs||{K:63,Q:56,k:7,q:0},cw:0,cb:0});

test('xadrez: perft da posição inicial',()=>{assert.deepStrictEqual([1,2,3,4].map(d=>perft(Chess.start(),d)),[20,400,8902,197281])});
test('xadrez: perft com roques, en passant e promoções',()=>{
 assert.deepStrictEqual([1,2,3].map(d=>perft(fen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R','w','KQkq'),d)),[48,2039,97862]);
 assert.deepStrictEqual([1,2,3].map(d=>perft(fen('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R','w','KQ'),d)),[44,1486,62379])});
test('xadrez: perft em Chess960',()=>{
 assert.deepStrictEqual([1,2,3].map(d=>perft(fen('bqnb1rkr/pp3ppp/3ppn2/2p5/5P2/P2P4/NPP1P1PP/BQ1BNRKR','w','KQkq',{K:63,Q:61,k:7,q:5},'9'),d)),[21,528,12189]);
 assert.deepStrictEqual([1,2,3].map(d=>perft(fen('2nnrbkr/p1qppppp/8/1ppb4/6PP/3PP3/PPP2P2/BQNNRBKR','w','KQkq',{K:63,Q:60,k:7,q:4},'9'),d)),[21,807,18002])});
test('xadrez: posições Chess960 sorteadas são válidas',()=>{for(let i=0;i<300;i++){const r=Chess.start('9').b.slice(0,8).join(''),bs=[...r].flatMap((x,i)=>x==='b'?[i]:[]);
 assert.strictEqual((bs[0]+bs[1])%2,1);assert.ok(r.indexOf('r')<r.indexOf('k')&&r.indexOf('k')<r.lastIndexOf('r'))}});
test('xadrez: a IA acha mate em 1 e a notação marca #',()=>{const s=fen('6k1/5ppp/8/8/8/8/8/R3K3','w','');assert.strictEqual(Chess.san(s,Chess.best(s,{depth:3})),'Ta8#')});
test('xadrez: material insuficiente',()=>{assert.ok(Chess.insufficient(fen('8/8/4k3/8/8/3KN3/8/8','w','').b));assert.ok(!Chess.insufficient(fen('8/8/4k3/8/8/3KR3/8/8','w','').b))});
test('xadrez: variantes terminam com vencedor declarado',()=>{
 const k=fen('8/8/8/8/3K4/8/8/7k','b','',null,'k');assert.strictEqual(Chess.varWinner(k),'w');
 let s=fen('4k3/8/8/8/8/8/8/R3K3','w','',null,'3');s.cw=2;s=Chess.make(s,Chess.legal(s).find(m=>m.f===56&&m.t===0));assert.strictEqual(Chess.varWinner(s),'w')});
test('damas: abertura tem 7 lances e captura é obrigatória',()=>{assert.strictEqual(Damas.moves(Damas.start(),'w').length,7);
 const b=Array(64).fill('');b[44]='w';b[35]='b';b[62]='w';const ms=Damas.moves(b,'w');assert.ok(ms.length&&ms.every(m=>m.caps.length===1))});
test('damas: vale a captura que toma mais peças',()=>{const b=Array(64).fill('');b[44]='w';b[35]='b';b[17]='b';b[46]='w';b[37]='b';
 const ms=Damas.moves(b,'w');assert.ok(ms.every(m=>m.caps.length===2))});
test('damas: partida completa termina sem erro',()=>{let b=Damas.start(),t='w',n=0;while(n<300){const m=Damas.best(b,t,3);if(!m)break;b=Damas.apply(b,m);t=t==='w'?'b':'w';n++}assert.ok(n>10)});

importScripts('xadrez-engine.js');
onmessage=e=>postMessage({id:e.data.id,m:Chess.best(e.data.s,e.data.o)});

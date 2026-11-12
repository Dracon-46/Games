// Lê o catálogo de jogos direto da home (JavaScript/index.html), para os testes não repetirem a lista.
const fs = require('node:fs');
const path = require('node:path');
const SITE = path.join(__dirname, '..', '..', 'JavaScript');
const home = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const bloco = home.slice(home.indexOf('const G=['), home.indexOf('].map(g=>'));
const jogos = [...bloco.matchAll(/^\['([a-z-]+)','([^']+)','([^']+)','([a-z]+)',\[([^\]]*)\](?:,'([a-z]+)')?\]/gm)]
  .map((m) => ({ slug: m[1], nome: m[2], desc: m[3], cat: m[4], tags: m[5].split(',').map((t) => t.replace(/'/g, '')), icone: m[6] || m[1] }));
const paginas = fs.readdirSync(SITE).filter((f) => f.endsWith('.html')).sort();
const WEBGL = ['enxame', 'nucleo', 'tunel'];
module.exports = { SITE, jogos, paginas, WEBGL, home };

// A documentação acompanha o código: catálogo, totais, links entre documentos e arquivos citados.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { jogos } = require('../helpers/catalogo');
const RAIZ = path.join(__dirname, '..', '..');
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const docs = ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'CLAUDE.md', ...fs.readdirSync(path.join(RAIZ, 'docs')).map((f) => 'docs/' + f)];

test('README: cita todos os jogos e o total certo', () => {
  const s = ler('README.md');
  for (const j of jogos) assert.ok(s.includes(`**${j.nome}**`), 'README sem ' + j.nome);
  assert.ok(s.includes(`${jogos.length} jogos`), 'total de jogos no README');
});

test('docs/jogos.md: uma linha por jogo, com o arquivo certo, e nenhum jogo a mais', () => {
  const s = ler('docs/jogos.md');
  for (const j of jogos) assert.match(s, new RegExp(`^\\| ${j.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| \`${j.slug}\` \\|`, 'm'), j.slug);
  const citados = [...s.matchAll(/^\| [^|]+ \| `([a-z-]+)` \|/gm)].map((m) => m[1]);
  assert.deepStrictEqual(citados.sort(), jogos.map((j) => j.slug).sort());
});

test('docs/jogos.md: a marca "Ranking" bate com os jogos que enviam pontuação', () => {
  const s = ler('docs/jogos.md');
  for (const j of jogos) {
    const envia = /Conta\.submit\(/.test(ler('JavaScript/' + j.slug + '.html'));
    const linha = s.split('\n').find((l) => l.includes('| `' + j.slug + '` |'));
    assert.strictEqual(/Ranking/.test(linha.split('|')[4]), envia, j.slug);
  }
});

test('CHANGELOG: tem a versão do package.json no topo e cita todos os jogos', () => {
  const s = ler('CHANGELOG.md'), v = JSON.parse(ler('package.json')).version;
  assert.strictEqual((s.match(/^## \[([\d.]+)\]/m) || [])[1], v, 'a versão mais recente do histórico é a do package.json');
  for (const j of jogos) assert.ok(s.includes(j.nome), 'CHANGELOG sem ' + j.nome);
});

test('documentos: todo link relativo e todo arquivo citado existe', () => {
  for (const d of docs) {
    const s = ler(d), base = path.dirname(path.join(RAIZ, d));
    for (const m of s.matchAll(/\]\((?!https?:|#|mailto:)([^)#]+)(?:#[^)]*)?\)/g)) assert.ok(fs.existsSync(path.join(base, m[1])), `${d}: link quebrado para ${m[1]}`);
    for (const m of s.matchAll(/`((?:JavaScript|tests|supabase|docs|\.github)\/[A-Za-z0-9_./-]+\.[a-z]+)`/g)) assert.ok(fs.existsSync(path.join(RAIZ, m[1])), `${d}: arquivo inexistente ${m[1]}`);
  }
});

test('docs/README.md lista todos os documentos da pasta', () => {
  const s = ler('docs/README.md');
  for (const f of fs.readdirSync(path.join(RAIZ, 'docs'))) if (f !== 'README.md') assert.ok(s.includes(`(${f})`), 'índice sem ' + f);
});

test('docs/online.md e docs/xadrez.md descrevem as funções que existem', () => {
  const schema = ler('supabase/schema.sql'), online = ler('docs/online.md');
  for (const m of schema.matchAll(/create function public\.([a-z_]+)\(/g)) if (m[1] !== 'handle_new_user') assert.ok(online.includes('`' + m[1]), 'docs/online.md sem ' + m[1]);
  const motor = ler('JavaScript/xadrez-engine.js'), xadrez = ler('docs/xadrez.md');
  const api = motor.match(/return\{([a-zA-Z,]+)\}\}\)\(\);/)[1].split(',');
  for (const f of api) assert.ok(xadrez.includes('`' + f), 'docs/xadrez.md sem ' + f);
});

test('docs/testes.md cita todos os arquivos de teste', () => {
  const s = ler('docs/testes.md');
  for (const dir of ['unit', 'db', 'e2e']) for (const f of fs.readdirSync(path.join(RAIZ, 'tests', dir)).filter((x) => x.endsWith('.test.js'))) assert.ok(s.includes(`${dir}/${f}`), 'docs/testes.md sem ' + dir + '/' + f);
});

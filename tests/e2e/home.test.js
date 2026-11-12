// A home: catálogo, abas, busca, destaques e botão de jogo aleatório.
const test = require('node:test');
const assert = require('node:assert');
const { start } = require('../helpers/server');
const { open, close } = require('../helpers/browser');
const { jogos } = require('../helpers/catalogo');
let srv, page;
const cards = () => page.$$eval('#grid .card', (c) => c.map((a) => a.getAttribute('href').replace('.html', '')));
test.before(async () => { srv = await start(); page = await open(); await page.goto(srv.url); await page.waitForTimeout(1600); });
test.after(async () => { await page.done(); await close(); await srv.close(); });

test('mostra todos os jogos do catálogo, na ordem', async () => {
  assert.deepStrictEqual(await cards(), jogos.map((j) => j.slug));
  assert.strictEqual(await page.textContent('#nGames'), String(jogos.length));
});

test('cada aba filtra pela categoria e mostra a contagem certa', async () => {
  for (const [aba, cat] of [['vitrine', 'vitrine'], ['tabuleiro', 'tabuleiro'], ['arcade', 'arcade'], ['puzzle', 'puzzle'], ['todos', null]]) {
    await page.click(`#tabs [data-k=${aba}]`);
    const esperado = jogos.filter((j) => !cat || j.cat === cat).map((j) => j.slug);
    assert.deepStrictEqual(await cards(), esperado, aba);
    assert.strictEqual(await page.getAttribute(`#tabs [data-k=${aba}]`, 'aria-selected'), 'true');
    assert.strictEqual(parseInt(await page.textContent(`#tabs [data-k=${aba}] span`), 10), esperado.length);
    assert.match(await page.textContent('#cnt'), new RegExp('^0*' + esperado.length + ' jogo'));
  }
});

test('a aba fica no endereço e é restaurada ao abrir o link', async () => {
  await page.click('#tabs [data-k=arcade]');
  assert.match(page.url(), /#arcade$/);
  await page.goto(srv.url + 'index.html#puzzle'); await page.reload();
  assert.strictEqual(await page.getAttribute('#tabs [data-k=puzzle]', 'aria-selected'), 'true');
  await page.click('#tabs [data-k=todos]');
});

test('a busca ignora acentos e maiúsculas, e avisa quando não acha nada', async () => {
  await page.fill('#q', 'ORBITA');
  assert.deepStrictEqual(await cards(), ['orbita']);
  await page.fill('#q', 'hanoi');
  assert.deepStrictEqual(await cards(), ['hanoi']);
  await page.fill('#q', 'zzzz');
  assert.deepStrictEqual(await cards(), []);
  assert.match(await page.textContent('#grid'), /Nenhum jogo encontrado/);
  await page.fill('#q', '');
  assert.strictEqual((await cards()).length, jogos.length);
});

test('destaques e órbita apontam para jogos existentes; o botão aleatório abre um jogo', async () => {
  const links = await page.$$eval('#feat a, .ring a', (a) => a.map((x) => x.getAttribute('href').replace('.html', '')));
  assert.ok(links.length >= 10);
  for (const l of links) assert.ok(jogos.some((j) => j.slug === l), l);
  await page.click('#rand');
  await page.waitForURL(/\/[a-z-]+\.html$/);
  assert.ok(jogos.some((j) => page.url().endsWith('/' + j.slug + '.html')));
  await page.goto(srv.url);
});

test('a órbita de ícones da abertura tem tamanho e fica dentro da tela', async () => {
  const r = await page.$eval('.orb', (e) => { const b = e.getBoundingClientRect(); return { w: b.width, h: b.height, dentro: b.left >= 0 && b.right <= innerWidth }; });
  assert.ok(r.w > 200 && r.h > 200 && r.dentro, JSON.stringify(r));
  assert.ok(await page.$eval('.hero h1', (e) => e.getBoundingClientRect().height > 150), 'o título quebra em linhas');
});

test('as seções entram na tela ao rolar', async () => {
  const alt = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= alt; y += 400) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.waitForFunction(() => [...document.querySelectorAll('.rv')].every((e) => e.classList.contains('on')), null, { timeout: 5000 });
  assert.strictEqual(page.errors.length, 0, page.errors.join('\n'));
});

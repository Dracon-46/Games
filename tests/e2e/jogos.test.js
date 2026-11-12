// Jogabilidade: cada jogo é exercitado com cliques e teclas reais até o estado mudar como esperado.
const test = require('node:test');
const assert = require('node:assert');
const { start } = require('../helpers/server');
const { open, close } = require('../helpers/browser');
const { jogos } = require('../helpers/catalogo');
let srv;
test.before(async () => { srv = await start(); });
test.after(async () => { await close(); await srv.close(); });
const T = { timeout: 120000 };
async function jogo(slug, fn, opts) {
  const page = await open(opts);
  try { await page.goto(srv.url + slug + '.html'); await fn(page); assert.deepStrictEqual(page.errors, [], slug); } finally { await page.done(); }
}
const msg = (p) => p.textContent('#msg');

// ---------------------------------------------------------------- xadrez
const casa = (n, virado) => { let i = (8 - +n[1]) * 8 + n.charCodeAt(0) - 97; if (virado) i = 63 - i; return `#bd .sq:nth-child(${i + 2})`; };
const lance = async (p, a, b) => { await p.click(casa(a)); await p.click(casa(b)); };
const semPensar = (p) => p.waitForFunction(() => !document.getElementById('msg').textContent.includes('pensando'), null, { timeout: 20000 });

test('xadrez: o computador responde, a dica aparece e desfazer volta o lance', T, () => jogo('xadrez', async (p) => {
  await lance(p, 'e2', 'e4'); await semPensar(p);
  assert.match(await p.textContent('#mv'), /^1\. e4\S+/);
  await p.click('#hintb'); await p.waitForSelector('.sq.hn', { timeout: 10000 });
  await p.click('#undo');
  assert.strictEqual(await p.textContent('#mv'), '');
}));

test('xadrez: mate do louco em dois jogadores, com notação e relógio com incremento', T, () => jogo('xadrez', async (p) => {
  await p.selectOption('#mode', '2p'); await p.selectOption('#tc', '3,2'); await p.click('#new');
  await lance(p, 'f2', 'f3'); await lance(p, 'e7', 'e5'); await lance(p, 'g2', 'g4'); await lance(p, 'd8', 'h4');
  assert.strictEqual(await msg(p), 'Xeque-mate! Pretas vencem.');
  assert.strictEqual(await p.textContent('#mv'), '1. f3e52. g4Dh4#');
  // 3:00 + dois incrementos de 2 s, menos o tempo gasto pensando
  for (const c of await p.$$eval('.ck', (e) => e.map((x) => x.textContent))) assert.match(c, /^3:0[234]$/);
  await lance(p, 'a2', 'a3');
  assert.strictEqual(await p.textContent('#mv'), '1. f3e52. g4Dh4#', 'partida encerrada não aceita lance');
}));

test('xadrez: escolha da promoção e roque', T, () => jogo('xadrez', async (p) => {
  await p.selectOption('#mode', '2p'); await p.click('#new');
  await p.evaluate(() => { s.b = ('    k   ' + 'P       ' + ' '.repeat(40) + 'R   K  R').split(''); s.c = 'KQ'; lm = null; draw(); });
  await lance(p, 'a7', 'a8');
  assert.strictEqual(await p.$$eval('#promo button', (b) => b.length), 4);
  await p.click('#promo button:nth-child(4)');
  assert.strictEqual(await p.textContent('#mv'), '1. a8=C');
  await p.evaluate(() => { s.t = 'w'; lm = null; draw(); });
  await lance(p, 'e1', 'g1');
  assert.match(await p.textContent('#mv'), /O-O$/);
  assert.strictEqual(await p.evaluate(() => s.b.slice(60).join('')), ' RK ');
}));

test('xadrez: Chess960 roca clicando na torre', T, () => jogo('xadrez', async (p) => {
  await p.selectOption('#mode', '2p'); await p.selectOption('#var', '9'); await p.click('#new');
  const r = await p.evaluate(() => { const k = s.b.indexOf('K'); for (let i = 48; i < 64; i++) if (i !== k && i !== s.rs.K && i !== s.rs.Q) s.b[i] = ' '; lm = null; draw(); return { k, rk: s.rs.K }; });
  await p.click(`#bd .sq:nth-child(${r.k + 2})`); await p.click(`#bd .sq:nth-child(${r.rk + 2})`);
  assert.strictEqual(await p.textContent('#mv'), '1. O-O');
  assert.deepStrictEqual(await p.evaluate(() => [s.b[62], s.b[61]]), ['K', 'R']);
}));

for (const [v, fim] of [['k', /rei na colina|Xeque-mate|Empate/], ['3', /três xeques|Xeque-mate|Empate/]]) {
  test(`xadrez: computador × computador termina na variante ${v}`, { timeout: 240000 }, () => jogo('xadrez', async (p) => {
    await p.selectOption('#var', v); await p.selectOption('#mode', 'cvc'); await p.selectOption('#lv', '2'); await p.click('#new');
    await p.waitForFunction(() => over, null, { timeout: 200000 });
    assert.match(await msg(p), fim);
  }));
}

test('xadrez: jogar de pretas vira o tabuleiro e a bandeira cai no tempo', T, () => jogo('xadrez', async (p) => {
  await p.selectOption('#side', 'b'); await p.selectOption('#tc', '1,0'); await p.selectOption('#lv', '1'); await p.click('#new');
  await p.waitForFunction(() => hist.length === 1, null, { timeout: 15000 });
  assert.strictEqual(await p.evaluate(() => flip), true);
  await p.evaluate(() => { clk.b = 150; });
  await p.waitForFunction(() => over, null, { timeout: 5000 });
  assert.strictEqual(await msg(p), 'Tempo esgotado! Brancas vencem.');
}));

test('xadrez: desistir encerra a partida; sem configuração o modo online só avisa', T, () => jogo('xadrez', async (p) => {
  await p.click('#resign');
  assert.strictEqual(await msg(p), 'Brancas desistiram. Pretas vencem.');
  await p.selectOption('#mode', 'on');
  assert.match(await p.textContent('#lobby'), /ainda não foi ativado/);
}));

// ---------------------------------------------------------------- tabuleiro
test('damas: lance do jogador e resposta do computador', T, () => jogo('damas', async (p) => {
  await p.click('#bd div:nth-child(41)'); await p.click('#bd div:nth-child(34)');
  await p.waitForFunction(() => /^Sua vez/.test(document.getElementById('msg').textContent) && last.length, null, { timeout: 15000 });
  assert.strictEqual(await p.evaluate(() => b.filter((x) => x).length), 24);
  assert.strictEqual(await p.evaluate(() => b[40]), '');
}));

test('jogo da velha: o nível impossível nunca perde', T, () => jogo('velha', async (p) => {
  for (let partida = 0; partida < 8; partida++) {
    await p.click('#new');
    for (let n = 0; n < 5; n++) {
      const livres = await p.$$eval('#bd div', (d) => d.map((x, i) => (x.textContent ? -1 : i)).filter((i) => i >= 0));
      if (!livres.length || (await p.evaluate(() => done))) break;
      await p.click(`#bd div:nth-child(${livres[Math.floor(Math.random() * livres.length)] + 1})`);
      await p.waitForFunction(() => done || turn === 'X', null, { timeout: 5000 });
    }
    assert.doesNotMatch(await msg(p), /X venceu/);
  }
}));

// ---------------------------------------------------------------- arcade
test('cobrinha: come, cresce, pausa, morre na parede e atravessa no modo sem paredes', T, () => jogo('cobrinha', async (p) => {
  await p.click('#go'); await p.waitForFunction(() => __cobra.st === 'play', null, { timeout: 6000 });
  const tecla = { '1,0': 'ArrowRight', '-1,0': 'ArrowLeft', '0,1': 'ArrowDown', '0,-1': 'ArrowUp' };
  for (let i = 0; i < 300; i++) {
    const g = await p.evaluate(() => ({ st: __cobra.st, h: __cobra.snake[0], f: __cobra.food, d: __cobra.dir, sc: __cobra.score }));
    if (g.st !== 'play' || g.sc >= 2) break;
    let q = g.f.x !== g.h.x ? [Math.sign(g.f.x - g.h.x), 0] : [0, Math.sign(g.f.y - g.h.y)];
    if (q[0] === -g.d.x && q[1] === -g.d.y) q = g.d.x ? [0, 1] : [1, 0];
    await p.keyboard.press(tecla[q.join()]); await p.waitForTimeout(50);
  }
  assert.ok((await p.evaluate(() => __cobra.score)) >= 1, 'comeu ao menos uma fruta');
  assert.strictEqual(await p.evaluate(() => __cobra.snake.length - 3), parseInt(await p.textContent('#sc'), 10));
  if ((await p.evaluate(() => __cobra.st)) === 'play') {
    await p.keyboard.press(' '); assert.strictEqual(await p.evaluate(() => __cobra.st), 'pause');
    await p.keyboard.press(' '); assert.strictEqual(await p.evaluate(() => __cobra.st), 'play');
    for (let i = 0; i < 80 && (await p.evaluate(() => __cobra.st)) === 'play'; i++) { await p.keyboard.press('ArrowUp'); await p.waitForTimeout(50); }
  }
  assert.strictEqual(await p.evaluate(() => __cobra.st), 'dead');
  await p.waitForFunction(() => !document.getElementById('ov').classList.contains('hide') && /Fim de jogo/.test(document.getElementById('ot').textContent), null, { timeout: 5000 });
  await p.selectOption('#mode', 'w'); await p.waitForFunction(() => __cobra.st === 'play', null, { timeout: 6000 });
  await p.waitForTimeout(3500);
  assert.strictEqual(await p.evaluate(() => __cobra.st), 'play', 'sem paredes a cobra atravessa a borda');
}));

test('blocos: as peças caem, pontuam e o jogo pausa', T, () => jogo('blocos', async (p) => {
  await p.click('#go');
  await p.keyboard.press('p');
  assert.strictEqual(await p.textContent('#pa'), 'Continuar');
  await p.keyboard.press('p');
  for (let i = 0; i < 6; i++) { await p.keyboard.press('ArrowLeft'); await p.keyboard.press(' '); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowUp'); await p.keyboard.press(' '); }
  assert.ok(parseInt(await p.textContent('#sc'), 10) > 0);
}));

test('duelo: a luta começa, golpes tiram vida e o tempo encerra o round', T, () => jogo('duelo', async (p) => {
  await p.click('#chars button:nth-child(3)'); await p.click('#go');
  await p.waitForFunction(() => __duelo.st === 'fight', null, { timeout: 8000 });
  assert.strictEqual(await p.evaluate(() => __duelo.P[0].ch.n), 'Vento');
  for (let i = 0; i < 150; i++) {
    const g = await p.evaluate(() => ({ st: __duelo.st, d: Math.abs(__duelo.P[0].x - __duelo.P[1].x), hp: __duelo.P[1].hp, max: __duelo.P[1].ch.hp }));
    if (g.st !== 'fight' || g.hp < g.max) break;
    if (g.d > 80) { await p.keyboard.down('d'); await p.waitForTimeout(80); await p.keyboard.up('d'); } else await p.keyboard.press(i % 2 ? 'f' : 'g');
    await p.waitForTimeout(60);
  }
  assert.ok(await p.evaluate(() => __duelo.P[1].hp < __duelo.P[1].ch.hp), 'o adversário levou dano');
  await p.keyboard.press('p'); const t = await p.evaluate(() => __duelo.timer); await p.waitForTimeout(400);
  assert.strictEqual(await p.evaluate(() => __duelo.timer), t, 'pausado, o relógio para'); await p.keyboard.press('p');
  await p.evaluate(() => { __duelo.timer = 0.1; });
  await p.waitForFunction(() => __duelo.st === 'ko' || __duelo.st === 'intro' || __duelo.st === 'end', null, { timeout: 6000 });
}));

for (const [slug, api] of [['enxame', '__enxame'], ['nucleo', '__nucleo'], ['tunel', '__tunel']]) {
  test(`${slug}: WebGL desenha e a partida começa`, T, () => jogo(slug, async (p) => {
    await p.waitForTimeout(800);
    assert.ok(await p.evaluate(() => { const c = document.querySelector('canvas'); const g = c.getContext('webgl2') || c.getContext('webgl'); const px = new Uint8Array(4 * 64 * 64); g.readPixels((c.width >> 1) - 32, (c.height >> 1) - 32, 64, 64, g.RGBA, g.UNSIGNED_BYTE, px); return c.width > 0 && !!g; }), 'contexto WebGL');
    await p.click('#go');
    await p.waitForFunction((a) => window[a].state === 'play', api, { timeout: 8000 });
    const box = await p.locator('canvas').first().boundingBox();
    for (let i = 0; i < 12; i++) { await p.mouse.move(box.x + box.width * (0.3 + 0.4 * Math.random()), box.y + box.height * (0.3 + 0.4 * Math.random())); await p.waitForTimeout(120); }
    assert.ok(['play', 'over'].includes(await p.evaluate((a) => window[a].state, api)));
  }));
}

// ---------------------------------------------------------------- quebra-cabeça
test('palpite: avaliação com letras repetidas', T, () => jogo('palpite', async (p) => {
  const r = await p.evaluate(() => [['TERMO', 'TEMPO'], ['SALAS', 'CASAL'], ['AAAAA', 'CASAL'], ['LLAMA', 'CASAL']].map(([g, s]) => __palpite.score(g, s).join('')));
  assert.deepStrictEqual(r, ['ggxyg', 'ygygx', 'xgxgx', 'yxyxy']);
}));

test('palpite: valida a entrada, vence, guarda a palavra do dia e conta estatísticas', T, () => jogo('palpite', async (p) => {
  const tenta = async (w) => { await p.keyboard.type(w); await p.keyboard.press('Enter'); await p.waitForTimeout(1100); };
  await p.keyboard.type('ABC'); await p.keyboard.press('Enter');
  assert.strictEqual(await msg(p), 'Faltam letras.');
  for (let i = 0; i < 3; i++) await p.keyboard.press('Backspace');
  const sol = await p.evaluate(() => __palpite.sol);
  const outra = sol[0] === 'AUDIO' ? 'TERMO' : 'AUDIO';
  await tenta(outra); await p.keyboard.type(outra); await p.keyboard.press('Enter');
  assert.strictEqual(await msg(p), 'Você já tentou essa palavra.');
  for (let i = 0; i < 5; i++) await p.keyboard.press('Backspace');
  await tenta(sol[0]);
  assert.strictEqual(await msg(p), 'Você acertou em 2 tentativas!');
  await p.reload();
  assert.strictEqual(await msg(p), 'Você acertou em 2 tentativas!', 'a palavra do dia é restaurada');
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('palpite-st-1')).p), 1, 'recarregar não conta outra partida');
}));

test('palpite: quatro palavras ao mesmo tempo, vitória e derrota', T, () => jogo('palpite', async (p) => {
  const tenta = async (w) => { await p.keyboard.type(w); await p.keyboard.press('Enter'); await p.waitForTimeout(1100); };
  await p.selectOption('#n', '4'); await p.selectOption('#kind', 'r');
  assert.strictEqual(await p.$$eval('#boards .bd', (b) => b.length), 4);
  for (const w of await p.evaluate(() => __palpite.sol)) await tenta(w);
  assert.strictEqual(await msg(p), 'Você acertou em 4 tentativas!');
  await p.click('#new');
  const sol = await p.evaluate(() => __palpite.sol), erradas = ['AUDIO', 'TERMO', 'PRAIA', 'FELIZ', 'NUVEM', 'GRUPO', 'BICHO', 'SALDO', 'JOVEM', 'LIMPO', 'CARTA'].filter((w) => !sol.includes(w)).slice(0, 9);
  for (const w of erradas) await tenta(w);
  assert.match(await msg(p), /^As palavras eram /);
}));

test('sudoku: preencher a solução resolve; número errado fica marcado', T, () => jogo('sudoku', async (p) => {
  const i = await p.evaluate(() => given.indexOf(false));
  await p.click(`#bd div:nth-child(${i + 1})`);
  const errado = await p.evaluate((k) => (sol[k] % 9) + 1, i);
  await p.keyboard.press(String(errado));
  assert.ok(await p.$eval(`#bd div:nth-child(${i + 1})`, (d) => d.classList.contains('bad')));
  await p.evaluate(() => { for (let k = 0; k < 81; k++) if (!given[k]) { sel = k; put(sol[k]); } });
  assert.match(await msg(p), /resolvido/);
}));

test('campo minado: o primeiro clique é seguro e a bandeira conta', T, () => jogo('campo-minado', async (p) => {
  for (let n = 0; n < 5; n++) {
    await p.click('#new'); await p.click('#bd div:nth-child(40)');
    assert.strictEqual(await p.$$eval('#bd .x', (d) => d.length), 0);
    assert.ok((await p.$$eval('#bd .o', (d) => d.length)) >= 9, 'abre a vizinhança');
  }
  const antes = parseInt(await p.textContent('#fl'), 10);
  const fechada = await p.evaluate(() => cells.findIndex((c) => !c.o));
  await p.click(`#bd div:nth-child(${fechada + 1})`, { button: 'right' });
  assert.strictEqual(parseInt(await p.textContent('#fl'), 10), antes - 1);
}));

test('memória: achar todos os pares termina o jogo', T, () => jogo('memoria', async (p) => {
  const cartas = await p.$$eval('#bd div', (d) => d.map((x) => x.innerHTML));
  const vistos = new Set();
  for (let i = 0; i < cartas.length; i++) {
    if (vistos.has(i)) continue;
    const j = cartas.findIndex((c, k) => k > i && c === cartas[i]);
    vistos.add(i); vistos.add(j);
    await p.click(`#bd div:nth-child(${i + 1})`); await p.click(`#bd div:nth-child(${j + 1})`);
  }
  assert.match(await msg(p), /completou em 8 jogadas/);
}));

test('forca: acertar todas as letras vence; seis erros perdem', T, () => jogo('forca', async (p) => {
  for (const l of new Set((await p.evaluate(() => word)).replace(/-/g, ''))) await p.keyboard.press(l);
  assert.match(await msg(p), /acertou/);
  await p.click('#new');
  const w = await p.evaluate(() => word);
  for (const l of [...'QWXZKYJVHF'].filter((c) => !w.includes(c)).slice(0, 6)) await p.keyboard.press(l);
  assert.match(await msg(p), /perdeu/);
  assert.strictEqual(await p.textContent('#word'), w);
}));

test('jokempô: cada rodada soma exatamente um ponto ao placar', T, () => jogo('jokempo', async (p) => {
  for (let i = 0; i < 4; i++) { await p.click(`[data-i="${i % 3}"]`); await p.waitForTimeout(600); }
  const soma = await p.evaluate(() => ['w', 'd', 'l'].reduce((t, k) => t + +document.getElementById(k).textContent, 0));
  assert.strictEqual(soma, 4);
}));

// ---------------------------------------------------------------- todos os demais: reagem a clique e teclado
const comTesteProprio = ['xadrez', 'damas', 'velha', 'cobrinha', 'blocos', 'duelo', 'enxame', 'nucleo', 'tunel', 'palpite', 'sudoku', 'campo-minado', 'memoria', 'forca', 'jokempo'];
for (const j of jogos.filter((x) => !comTesteProprio.includes(x.slug))) {
  test(`${j.slug}: reage a cliques e teclas sem erro`, T, () => jogo(j.slug, async (p) => {
    const retrato = () => p.evaluate(() => {
      const m = document.querySelector('main'); let h = m.innerHTML.length + '|' + m.innerText;
      for (const c of document.querySelectorAll('canvas')) { try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 997) s = (s * 31 + d[i]) >>> 0; h += '|' + s; } catch (e) {} }
      return h;
    });
    await p.waitForTimeout(300);
    const antes = await retrato();
    if (j.slug === 'naval') { await p.getByText('Posicionar automaticamente').click(); await p.getByText('Começar batalha').click(); }
    if (['sequencia', 'pingue', 'tijolos', 'orbita', 'desvio', 'palavras'].includes(j.slug)) { const b = p.getByRole('button', { name: /Novo jogo|Jogar/ }).first(); if (await b.count()) await b.click(); await p.keyboard.press(' '); }
    const alvo = await p.$('main canvas, main .board, main .g, main svg, main #bd, main #g, main #board');
    const box = alvo && (await alvo.boundingBox());
    if (box) for (const [fx, fy] of [[0.5, 0.5], [0.3, 0.6], [0.7, 0.3], [0.52, 0.2]]) { await p.mouse.click(box.x + box.width * fx, box.y + box.height * fy); await p.waitForTimeout(350); }
    for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'Enter', '1']) await p.keyboard.press(k);
    await p.waitForTimeout(900);
    assert.notStrictEqual(await retrato(), antes, 'o jogo não reagiu');
    assert.ok(await p.getByRole('button', { name: /Novo jogo|Jogar|Nova/ }).count(), 'tem botão para recomeçar');
  }));
}

// Camada online de ponta a ponta: cadastro, login, ranking e xadrez entre dois navegadores.
// Usa o Postgres de teste e um servidor que imita as rotas do Supabase; pulado sem banco (veja docs/testes.md).
const test = require('node:test');
const assert = require('node:assert');
const pg = require('../helpers/pg');
const { start } = require('../helpers/server');
const { open, close } = require('../helpers/browser');
const skip = !pg.available() && 'sem Postgres de teste';
const T = { timeout: 120000, skip };
let srv, A, B;
const init = () => { window.FK_CONFIG = { url: location.origin, key: 'teste' }; };
const casa = (n, virado) => { let i = (8 - +n[1]) * 8 + n.charCodeAt(0) - 97; if (virado) i = 63 - i; return `#bd .sq:nth-child(${i + 2})`; };
const lance = async (p, virado, a, b) => { await p.click(casa(a, virado)); await p.click(casa(b, virado)); };
const vez = (p) => p.waitForFunction(() => /sua vez|vence|Empate/.test(document.getElementById('msg').textContent), null, { timeout: 10000 });
const msg = (p) => p.textContent('#msg');
const erro = async (p) => { await p.waitForFunction(() => document.querySelector('.fk-err').textContent); return p.textContent('.fk-err'); };
async function cadastra(p, nome, email) {
  await p.click('#fk-conta'); await p.click('[data-m=up]');
  await p.fill('#fk-n', nome); await p.fill('#fk-e', email); await p.fill('#fk-p', 'segredo1'); await p.click('.fk-go');
  await p.waitForSelector('.fk-ov', { state: 'detached' });
}

test.before(async () => {
  if (skip) return;
  pg.reset();
  pg.admin(`insert into auth.users(email, pass, raw_user_meta_data) values('ana@x.com', 'segredo1', '{"username":"Ana"}')`);
  srv = await start({ supabase: true });
  A = await open({ init }); B = await open({ init });
});
test.after(async () => { if (A) await A.done(); if (B) await B.done(); await close(); if (srv) await srv.close(); });

test('cadastro: valida o nome, recusa nome em uso (mesmo com outra caixa) e entra', T, async () => {
  await A.goto(srv.url + 'xadrez.html?online=1');
  await A.waitForSelector('#lg');
  await A.click('#fk-conta'); await A.click('[data-m=up]');
  await A.fill('#fk-n', 'x'); await A.fill('#fk-e', 'teo@x.com'); await A.fill('#fk-p', 'segredo1'); await A.click('.fk-go');
  assert.match(await erro(A), /3 a 16/);
  await A.fill('#fk-n', 'ANA'); await A.click('.fk-go');
  assert.strictEqual(await erro(A), 'Esse nome de jogador já está em uso.');
  await A.fill('#fk-n', 'Teo'); await A.fill('#fk-p', '123'); await A.click('.fk-go');
  assert.match(await erro(A), /pelo menos 6/);
  await A.fill('#fk-p', 'segredo1'); await A.click('.fk-go');
  await A.waitForSelector('.fk-ov', { state: 'detached' });
  assert.strictEqual(await A.textContent('#fk-conta'), 'Teo');
});

test('login: senha errada, e-mail repetido, sair e entrar de novo; a sessão vale em todas as páginas', T, async () => {
  await B.goto(srv.url + 'index.html');
  await cadastra(B, 'Lia', 'lia@x.com');
  assert.strictEqual(await B.textContent('#fk-conta'), 'Lia');
  await B.click('#fk-conta'); await B.click('.fk-go');           // sair
  assert.strictEqual(await B.textContent('#fk-conta'), 'Entrar');
  await B.click('#fk-conta'); await B.click('[data-m=up]');
  await B.fill('#fk-n', 'Lia2'); await B.fill('#fk-e', 'lia@x.com'); await B.fill('#fk-p', 'segredo1'); await B.click('.fk-go');
  assert.strictEqual(await erro(B), 'Este e-mail já tem uma conta.');
  await B.click('[data-m=in]'); await B.fill('#fk-e', 'lia@x.com'); await B.fill('#fk-p', 'errada'); await B.click('.fk-go');
  assert.strictEqual(await erro(B), 'E-mail ou senha incorretos.');
  await B.fill('#fk-p', 'segredo1'); await B.click('.fk-go');
  await B.waitForSelector('.fk-ov', { state: 'detached' });
  await B.goto(srv.url + 'cobrinha.html');
  assert.strictEqual(await B.textContent('#fk-conta'), 'Lia');
});

test('xadrez online: sala por código, vez de cada um e xeque-mate visto pelos dois', T, async () => {
  await A.waitForSelector('#mk'); await A.click('#mk');
  await A.waitForSelector('#lobby .code');
  const code = await A.textContent('#lobby .code');
  assert.match(code, /^[0-9A-F]{6}$/);
  assert.match(await msg(A), /aguardando adversário/);
  await B.goto(srv.url + 'xadrez.html?online=1');
  await B.waitForSelector('#rooms [data-c]');
  assert.match(await B.textContent('#rooms'), /Teo · 1200 · você joga de pretas/);
  await B.fill('#cd', code.toLowerCase()); await B.click('#jn');
  await vez(A);
  assert.match(await A.textContent('#pB'), /Teo \(1200\) · Brancas · você/);
  assert.match(await A.textContent('#pT'), /Lia \(1200\) · Pretas/);
  assert.strictEqual(await B.evaluate(() => flip), true, 'quem joga de pretas vê o tabuleiro virado');
  await lance(B, true, 'e7', 'e5');
  assert.strictEqual(await B.textContent('#mv'), '', 'fora da vez nada acontece');
  await lance(A, false, 'f2', 'f3'); await vez(B);
  await lance(B, true, 'e7', 'e5'); await vez(A);
  await lance(A, false, 'g2', 'g4'); await vez(B);
  await lance(B, true, 'd8', 'h4');
  await A.waitForFunction(() => /Xeque-mate/.test(document.getElementById('msg').textContent), null, { timeout: 10000 });
  assert.strictEqual(await msg(A), 'Xeque-mate! Pretas vencem. Você perdeu.');
  assert.strictEqual(await msg(B), 'Xeque-mate! Pretas vencem. Você venceu!');
  assert.strictEqual(await A.textContent('#mv'), '1. f3e52. g4Dh4#');
  assert.strictEqual(await A.isDisabled('#undo'), true); assert.strictEqual(await A.isDisabled('#hintb'), true);
});

test('xadrez online: link direto, Chess960 igual para os dois e desistência', T, async () => {
  await A.click('#new'); await A.waitForSelector('#mk');
  await A.selectOption('#var', '9'); await A.click('#mk');
  await A.waitForSelector('#lobby .code');
  await B.goto(srv.url + 'xadrez.html?sala=' + (await A.textContent('#lobby .code')));
  await vez(A);
  assert.strictEqual(await A.evaluate(() => s.b.join('')), await B.evaluate(() => s.b.join('')));
  await B.waitForFunction(() => !document.getElementById('resign').disabled);
  await B.click('#resign');
  await A.waitForFunction(() => /desistiram/.test(document.getElementById('msg').textContent), null, { timeout: 10000 });
  assert.strictEqual(await msg(A), 'Pretas desistiram. Brancas vencem. Você venceu!');
  assert.strictEqual(await msg(B), 'Pretas desistiram. Brancas vencem. Você perdeu.');
});

test('xadrez online: cancelar a sala de espera', T, async () => {
  await A.click('#new'); await A.waitForSelector('#mk'); await A.click('#mk');
  await A.waitForSelector('#cx'); await A.click('#cx');
  await A.waitForSelector('#mk');
  assert.strictEqual(pg.admin(`select count(*) from chess_games where status = 'waiting'`), '0');
});

test('ranking: pontuação enviada pelo jogo aparece nas abas, com o jogador destacado', T, async () => {
  assert.strictEqual(await A.evaluate(() => Conta.submit('cobrinha', 77)), 1);
  assert.strictEqual(await B.evaluate(() => Conta.submit('cobrinha', 12)), 2);
  assert.strictEqual(await B.evaluate(() => Conta.submit('cobrinha', 999999)), null, 'pontuação absurda é recusada');
  await A.goto(srv.url + 'ranking.html');
  await A.waitForSelector('#tb tr');
  const linhas = () => A.$$eval('#tb tr', (r) => r.map((x) => x.innerText.replace(/\s+/g, ' ').trim() + (x.classList.contains('me') ? ' <eu>' : '')));
  assert.deepStrictEqual(await linhas(), ['1 Teo 100 1 <eu>', '2 Lia 99 1']);
  await A.click('[data-k=cobrinha]');
  await A.waitForFunction(() => /Pontuação/.test(document.getElementById('th').textContent) && document.querySelector('#tb tr'));
  assert.deepStrictEqual(await linhas(), ['1 Teo 77 <eu>', '2 Lia 12']);
  await A.click('[data-k=xadrez]');
  await A.waitForFunction(() => /Rating/.test(document.getElementById('th').textContent) && document.querySelector('#tb tr'));
  assert.strictEqual((await linhas()).length, 2);
  await A.click('[data-k=tunel]');
  await A.waitForFunction(() => /Ninguém pontuou/.test(document.getElementById('empty').textContent));
  assert.deepStrictEqual([...A.errors, ...B.errors], []);
});

test('jogo real envia a pontuação ao morrer (Cobrinha) e avisa quem não está logado', T, async () => {
  await B.goto(srv.url + 'cobrinha.html');
  await B.click('#go'); await B.waitForFunction(() => __cobra.st === 'play', null, { timeout: 6000 });
  await B.evaluate(() => { __cobra.food = { x: __cobra.snake[0].x + 2, y: __cobra.snake[0].y }; });
  await B.waitForFunction(() => __cobra.score >= 1, null, { timeout: 5000 });
  for (let i = 0; i < 80 && (await B.evaluate(() => __cobra.st)) === 'play'; i++) { await B.keyboard.press('ArrowUp'); await B.waitForTimeout(50); }
  await B.waitForSelector('.fk-toast', { timeout: 8000 });
  assert.match(await B.textContent('.fk-toast'), /Ranking global: \dº lugar/);
  const anon = await open({ init });
  await anon.goto(srv.url + 'cobrinha.html');
  assert.strictEqual(await anon.evaluate(() => Conta.submit('cobrinha', 5)), null);
  assert.match(await anon.textContent('.fk-toast'), /Entre para aparecer no ranking/);
  await anon.done();
});

// Toda página, em tela de computador e de celular: sem erros, sem rolagem lateral, com cabeçalho, ícones, conta e fundo.
const test = require('node:test');
const assert = require('node:assert');
const { start } = require('../helpers/server');
const { open, close, EMOJI } = require('../helpers/browser');
const { paginas, WEBGL } = require('../helpers/catalogo');
let srv;
test.before(async () => { srv = await start(); });
test.after(async () => { await close(); await srv.close(); });

for (const [nome, width, touch] of [['computador', 1100, false], ['celular', 375, true]]) {
  test(`todas as páginas carregam limpas no ${nome}`, { timeout: 240000 }, async () => {
    const page = await open({ width, touch });
    const falhas = [];
    for (const p of paginas) {
      page.errors.length = 0;
      await page.goto(srv.url + p);
      const gl = WEBGL.includes(p.replace('.html', ''));
      await page.waitForTimeout(gl ? 1200 : 350);
      const o = await page.evaluate(() => ({
        rola: document.documentElement.scrollWidth > innerWidth,
        voltar: location.pathname.endsWith('index.html') || !!document.querySelector('header a.back svg'),
        conta: !!document.getElementById('fk-conta'),
        vazios: [...document.querySelectorAll('i[data-ic]')].filter((e) => !e.firstChild).map((e) => e.dataset.ic),
        fundo: !!window.__fxActive,
        texto: document.body.innerText,
        titulo: document.title,
      }));
      const erro = [];
      if (page.errors.length) erro.push(...page.errors.slice(0, 3));
      if (o.rola) erro.push('rolagem horizontal');
      if (!o.voltar) erro.push('sem botão de voltar');
      if (!o.conta) erro.push('sem botão de conta');
      if (o.vazios.length) erro.push('ícones vazios: ' + o.vazios);
      if (o.fundo === gl) erro.push(gl ? 'fundo ligado num jogo WebGL' : 'fundo animado desligado');
      if (EMOJI.test(o.texto)) erro.push('emoji no texto');
      if (!o.titulo) erro.push('sem título');
      if (erro.length) falhas.push(p + ': ' + erro.join('; '));
    }
    await page.done();
    assert.deepStrictEqual(falhas, []);
  });
}

test('os testes são herméticos: nenhuma página chama um servidor externo', { timeout: 120000 }, async () => {
  const page = await open();
  const fora = [];
  page.on('request', (r) => { if (!r.url().startsWith(srv.url) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) fora.push(r.url()); });
  for (const p of paginas) { await page.goto(srv.url + p); await page.waitForTimeout(150); }
  await page.done();
  assert.deepStrictEqual(fora, []);
});

test('prefers-reduced-motion: a home aparece inteira, sem depender de animação', async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch(), ctx = await b.newContext({ reducedMotion: 'reduce' }), page = await ctx.newPage();
  await ctx.addInitScript(() => { window.FK_CONFIG = { url: '', key: '' }; });
  await page.goto(srv.url);
  const ocultos = await page.evaluate(() => [...document.querySelectorAll('.rv')].filter((e) => getComputedStyle(e).opacity !== '1').length);
  await b.close();
  assert.strictEqual(ocultos, 0);
});

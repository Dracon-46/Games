// Navegador compartilhado pelos testes de ponta a ponta (Chromium via Playwright).
const { chromium } = require('playwright');
const ARGS = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
let browser;
async function launch() { return (browser ||= await chromium.launch({ args: ARGS })); }
async function close() { if (browser) { await browser.close(); browser = null; } }

/** Abre uma página que acumula erros de script, de console e de rede em page.errors. */
async function open(opts = {}) {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: opts.width || 1100, height: opts.height || 850 }, hasTouch: !!opts.touch });
  // Os testes nunca falam com o Supabase de produção: sem opts.init, a camada online fica desligada.
  await ctx.addInitScript(opts.init || (() => { window.FK_CONFIG = { url: '', key: '' }; }));
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push('script: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => page.errors.push('rede: ' + r.url()));
  page.on('response', (r) => { if (r.status() === 404) page.errors.push('404: ' + r.url()); });
  page.done = () => ctx.close();
  return page;
}
/** Emoji em texto renderizado. Símbolos tipográficos (setas, peças de xadrez) não contam. */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2653}\u{2660}-\u{2664}\u{2666}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
module.exports = { open, close, EMOJI };

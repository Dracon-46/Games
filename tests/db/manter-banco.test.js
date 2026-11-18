// scripts/manter-banco.js: a rotina que evita a pausa do Supabase faz de fato uma inserção pela API.
// Roda contra o servidor que imita o Supabase sobre o Postgres de teste; pulado sem banco.
const test = require('node:test');
const assert = require('node:assert');
const pg = require('../helpers/pg');
const { start } = require('../helpers/server');
const { config, ping } = require('../../scripts/manter-banco');
const skip = !pg.available() && 'sem Postgres de teste';
let srv;
test.before(async () => { if (!skip) { pg.reset(); srv = await start({ supabase: true }); } });
test.after(async () => { if (srv) await srv.close(); });

test('lê a URL e a chave de config.js, e FK_URL/FK_KEY têm prioridade', () => {
  const c = config();
  assert.match(c.url, /^https:\/\/[a-z0-9]+\.supabase\.co$/);
  assert.match(c.key, /^sb_publishable_/);
  process.env.FK_URL = 'http://exemplo.test/'; process.env.FK_KEY = 'k';
  try { assert.deepStrictEqual(config(), { url: 'http://exemplo.test', key: 'k' }); } finally { delete process.env.FK_URL; delete process.env.FK_KEY; }
});

test('faz uma inserção pela API, sem login, e repetir na mesma hora não duplica', { skip }, async () => {
  const alvo = { url: srv.url.replace(/\/$/, ''), key: 'publica' };
  const quando = await ping(alvo, 1, 0);
  assert.ok(!Number.isNaN(Date.parse(quando)), 'devolve a data da inserção');
  assert.strictEqual(pg.admin('select count(*) from heartbeat'), '1');
  assert.strictEqual(await ping(alvo, 1, 0), quando);
  assert.strictEqual(pg.admin('select count(*) from heartbeat'), '1');
});

test('tenta de novo e, se o banco não responder, falha com a causa', { skip }, async () => {
  let chamadas = 0;
  const original = global.fetch;
  global.fetch = async (...a) => { if (++chamadas < 3) throw new Error('fora do ar'); return original(...a); };
  try {
    await ping({ url: srv.url.replace(/\/$/, ''), key: 'publica' }, 3, 0);
    assert.strictEqual(chamadas, 3, 'funcionou na terceira tentativa');
  } finally { global.fetch = original; }
  await assert.rejects(ping({ url: srv.url + 'nao-existe', key: 'publica' }, 2, 0), /HTTP 404/);
});

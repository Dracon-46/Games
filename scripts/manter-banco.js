#!/usr/bin/env node
// Faz uma inserção no banco (função heartbeat) para o Supabase não pausar o projeto por inatividade.
// Usa a URL e a chave publicável de JavaScript/config.js; FK_URL e FK_KEY substituem os dois.
// Tenta de novo algumas vezes, porque um projeto parado pode demorar para responder.
const fs = require('node:fs');
const path = require('node:path');

function config() {
  const s = fs.readFileSync(path.join(__dirname, '..', 'JavaScript', 'config.js'), 'utf8');
  const url = process.env.FK_URL || (s.match(/url: '([^']*)'/) || [])[1];
  const key = process.env.FK_KEY || (s.match(/key: '([^']*)'/) || [])[1];
  if (!url || !key) throw new Error('config.js sem url ou key: a camada online está desligada.');
  return { url: url.replace(/\/$/, ''), key };
}

async function ping({ url, key }, tentativas = 4, espera = 15000) {
  for (let t = 1; ; t++) {
    try {
      const r = await fetch(url + '/rest/v1/rpc/heartbeat', {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: '{}',
      });
      const texto = await r.text();
      if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + texto.slice(0, 200));
      return JSON.parse(texto);
    } catch (e) {
      if (t >= tentativas) throw e;
      console.log(`Tentativa ${t} falhou (${e.message}); nova tentativa em ${espera / 1000} s.`);
      await new Promise((ok) => setTimeout(ok, espera));
    }
  }
}

module.exports = { config, ping };
if (require.main === module) {
  ping(config(), +process.env.FK_TENTATIVAS || 4, +process.env.FK_ESPERA || 15000)
    .then((quando) => console.log('Banco ativo. Última inserção: ' + quando))
    .catch((e) => { console.error('Falhou: ' + e.message); process.exit(1); });
}

// Rotina que mantém o Supabase ativo: agenda, intervalo máximo e o que ela executa.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const RAIZ = path.join(__dirname, '..', '..');
const wf = fs.readFileSync(path.join(RAIZ, '.github', 'workflows', 'manter-banco.yml'), 'utf8');

test('a rotina roda pelo agendamento e à mão, e executa o script de manutenção', () => {
  assert.match(wf, /workflow_dispatch:/);
  assert.match(wf, /run: node scripts\/manter-banco\.js/);
  assert.ok(fs.existsSync(path.join(RAIZ, 'scripts', 'manter-banco.js')));
  assert.match(wf, /actions\/workflows\/manter-banco\.yml\/enable/, 'reativa a si mesma para o GitHub não desligá-la');
  assert.match(wf, /actions: write/);
});

test('o agendamento nunca deixa mais de 6 dias entre duas inserções (o Supabase pausa com 7)', () => {
  const cron = wf.match(/cron: "([^"]+)"/)[1].split(' ');
  assert.strictEqual(cron.length, 5);
  const [min, hora, dia, mes, semana] = cron;
  assert.deepStrictEqual([mes, semana], ['*', '*']);
  const passo = +dia.split('/')[1], dias = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => (d - 1) % passo === 0);
  const execucoes = [];
  for (let ano = 2026; ano <= 2029; ano++) for (let m = 0; m < 12; m++) {
    const n = new Date(Date.UTC(ano, m + 1, 0)).getUTCDate();
    for (const d of dias(n)) execucoes.push(Date.UTC(ano, m, d, +hora, +min));
  }
  const maior = Math.max(...execucoes.slice(1).map((t, i) => (t - execucoes[i]) / 864e5));
  assert.ok(maior <= 6, `intervalo máximo de ${maior} dias`);
});

test('a função chamada existe no banco e é liberada para a chave pública', () => {
  const schema = fs.readFileSync(path.join(RAIZ, 'supabase', 'schema.sql'), 'utf8');
  assert.match(schema, /create function public\.heartbeat\(\)/);
  assert.match(schema, /grant execute on function [^;]*public\.heartbeat\(\)[^;]*to anon, authenticated;/);
  assert.match(fs.readFileSync(path.join(RAIZ, 'scripts', 'manter-banco.js'), 'utf8'), /\/rest\/v1\/rpc\/heartbeat/);
});

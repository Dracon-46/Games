// Acesso ao Postgres de teste por linha de comando (psql).
// FK_PSQL: comando do psql (padrão "psql"; em máquinas locais pode ser "runuser -u postgres -- psql").
// FK_DB:   banco de teste (padrão "fk_test"). As variáveis PGHOST/PGUSER/PGPASSWORD valem normalmente.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const CMD = (process.env.FK_PSQL || 'psql').split(' ');
const DB = process.env.FK_DB || 'fk_test';
const ROOT = path.join(__dirname, '..', '..');

function run(db, args, input) {
  return execFileSync(CMD[0], [...CMD.slice(1), '-d', db, '-AtX', '-q', '-v', 'ON_ERROR_STOP=1', ...args],
    { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}
/** O Postgres de teste está acessível? */
function available() {
  if (!process.env.FK_PSQL && !process.env.PGHOST) return false;
  try { run('postgres', ['-c', 'select 1']); return true; } catch { return false; }
}
/** Recria o banco de teste com o que o Supabase traz pronto (stub) e o esquema do projeto. */
function reset() {
  const fs = require('node:fs');
  run('postgres', ['-c', `drop database if exists ${DB}`]);
  run('postgres', ['-c', `create database ${DB}`]);
  run(DB, [], fs.readFileSync(path.join(__dirname, '..', 'db', 'stub.sql'), 'utf8'));
  run(DB, [], fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8'));
}
const lit = (s) => "'" + String(s).replace(/'/g, "''") + "'";
/** Executa SQL como um usuário (uuid) ou como anônimo (null). Devolve a saída do psql. */
function as(uid, sql) {
  const pre = `set role ${uid ? 'authenticated' : 'anon'}; set request.jwt.claims=${lit(JSON.stringify(uid ? { sub: uid } : {}))}; `;
  return run(DB, ['-c', pre + sql]);
}
/** Como `as`, mas devolve a mensagem de erro do banco (ou null se não falhou). */
function fails(uid, sql) {
  try { as(uid, sql); return null; } catch (e) { return ((e.stderr || '').match(/ERROR:\s+(.*)/) || [, 'erro'])[1]; }
}
const admin = (sql) => run(DB, ['-c', sql]);
module.exports = { available, reset, as, fails, admin, lit, run, DB };

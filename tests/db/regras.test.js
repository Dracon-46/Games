// Regras do banco (supabase/schema.sql) num Postgres real: contas, ranking, xadrez online e permissões.
// Pulado quando não há Postgres de teste (defina FK_PSQL ou PGHOST; veja docs/testes.md).
const test = require('node:test');
const assert = require('node:assert');
const pg = require('../helpers/pg');
const skip = !pg.available() && 'sem Postgres de teste';
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b', C = '00000000-0000-0000-0000-00000000000c';
const vazio = `json_build_object('t','w','v','c','b',(select json_agg(' '::text) from generate_series(1,64)))::jsonb`;
const pos = (t) => `json_build_object('t','${t}','v','c','b',(select json_agg(' '::text) from generate_series(1,64)))::jsonb`;
const novo = (id, nome) => pg.admin(`insert into auth.users(id, email, raw_user_meta_data) values('${id}', '${nome}@x', '{"username":"${nome}"}')`);

test.before(() => { if (!skip) { pg.reset(); novo(A, 'Ana'); novo(B, 'Bia_2'); novo(C, 'Caio'); } });

test('perfil nasce com o usuário; nome inválido ou repetido impede o cadastro', { skip }, () => {
  assert.strictEqual(pg.admin('select count(*) from public.profiles'), '3');
  assert.throws(() => pg.admin(`insert into auth.users(email, raw_user_meta_data) values('d@x', '{"username":"ana"}')`), 'repetido, sem diferenciar maiúsculas');
  for (const ruim of ['x', 'nome com espaco', 'abcdefghijklmnopq', 'ana!', '']) assert.throws(() => pg.admin(`insert into auth.users(email, raw_user_meta_data) values('e@x', '{"username":"${ruim}"}')`), ruim);
  assert.strictEqual(pg.as(null, `select username_available('ANA')`), 'f');
  assert.strictEqual(pg.as(null, `select username_available('Novo_1')`), 't');
  assert.strictEqual(pg.as(null, `select username_available('a b')`), 'f');
});

test('pontuação: exige login, recusa valores inválidos e guarda só a melhor', { skip }, () => {
  assert.match(pg.fails(null, `select submit_score('cobrinha', 10)`), /permission denied/);
  assert.strictEqual(pg.as(A, `select submit_score('cobrinha', 50)`), '1');
  assert.strictEqual(pg.as(A, `select submit_score('cobrinha', 30)`), '1', 'pontuação pior não substitui');
  assert.strictEqual(pg.admin(`select score from public.scores where game='cobrinha' and user_id='${A}'`), '50');
  assert.strictEqual(pg.as(B, `select submit_score('cobrinha', 80)`), '1');
  assert.strictEqual(pg.as(C, `select submit_score('cobrinha', 10)`), '3');
  for (const ruim of [`'cobrinha', 0`, `'cobrinha', -5`, `'cobrinha', 999999`, `'inexistente', 5`, `'cobrinha', null`]) assert.match(pg.fails(A, `select submit_score(${ruim})`), /inválida/, ruim);
});

test('ranking: por jogo, geral (100 pontos ao 1º) e leitura pública', { skip }, () => {
  pg.as(A, `select submit_score('tunel', 900)`);
  assert.deepStrictEqual(JSON.parse(pg.as(null, `select json_agg(t) from top_scores('cobrinha') t`)), [{ pos: 1, username: 'Bia_2', score: 80 }, { pos: 2, username: 'Ana', score: 50 }, { pos: 3, username: 'Caio', score: 10 }]);
  assert.deepStrictEqual(JSON.parse(pg.as(null, `select json_agg(t) from overall_ranking() t`)), [{ pos: 1, username: 'Ana', points: 199, games: 2 }, { pos: 2, username: 'Bia_2', points: 100, games: 1 }, { pos: 3, username: 'Caio', points: 98, games: 1 }]);
  assert.strictEqual(JSON.parse(pg.as(null, `select json_agg(t) from top_scores('cobrinha', 2) t`)).length, 2, 'limite respeitado');
});

test('tabelas: ninguém grava direto, e as partidas de xadrez não são legíveis fora das funções', { skip }, () => {
  assert.match(pg.fails(A, `insert into scores values('cobrinha', '${A}', 4000)`), /permission denied|row-level security/);
  assert.match(pg.fails(A, `update scores set score = 4000`) || 'row-level security', /permission denied|row-level security/);
  assert.match(pg.fails(A, `update profiles set rating = 3000 where id = '${A}'`) || 'row-level security', /permission denied|row-level security/);
  assert.strictEqual(pg.admin(`select rating from profiles where id = '${A}'`), '1200');
  assert.match(pg.fails(A, `delete from profiles`) || 'row-level security', /permission denied|row-level security/);
  assert.strictEqual(pg.admin('select count(*) from profiles'), '3');
  assert.strictEqual(pg.as(A, `select count(*) from chess_games`), '0');
  for (const f of ['_chess_finish(gen_random_uuid(), \'w\', \'x\')', 'handle_new_user()']) assert.match(pg.fails(A, `select ${f}`), /permission denied|trigger/);
});

test('xadrez online: sala, entrada, vez, ordem dos lances, resultado e rating', { skip }, () => {
  assert.match(pg.fails(null, `select chess_create(${vazio})`), /permission denied/);
  assert.match(pg.fails(A, `select chess_create('{"t":"w","b":[]}'::jsonb)`), /posição inválida/);
  const g = JSON.parse(pg.as(A, `select chess_create(${vazio})`));
  assert.match(g.code, /^[0-9A-F]{6}$/); assert.strictEqual(g.status, 'waiting'); assert.strictEqual(g.me, 'w');
  const aberto = JSON.parse(pg.as(B, 'select chess_lobby()'));
  assert.deepStrictEqual(aberto.open.map((o) => [o.code, o.host, o.seat]), [[g.code, 'Ana', 'b']]);
  assert.deepStrictEqual(JSON.parse(pg.as(A, 'select chess_lobby()')).open, [], 'a própria sala não aparece como aberta');
  assert.match(pg.fails(B, `select chess_join('ZZZZZZ')`), /não encontrada/);
  const j = JSON.parse(pg.as(B, `select chess_join('${g.code.toLowerCase()}')`));
  assert.strictEqual(j.me, 'b'); assert.strictEqual(j.status, 'playing');
  assert.match(pg.fails(C, `select chess_join('${g.code}')`), /já começou/);
  const mv = (uid, ply, t, san, extra = '') => `select chess_move('${g.id}', ${ply}, ${pos(t)}, '{"san":"${san}"}'::jsonb${extra})`;
  assert.match(pg.fails(B, mv(B, 0, 'b', 'e5')), /não é a sua vez/);
  assert.match(pg.fails(C, mv(C, 0, 'b', 'e4')), /não é a sua vez/);
  assert.match(pg.fails(A, mv(A, 0, 'w', 'e4')), /posição inválida/, 'a vez precisa passar');
  assert.strictEqual(JSON.parse(pg.as(A, mv(A, 0, 'b', 'e4'))).moves.length, 1);
  assert.match(pg.fails(A, mv(A, 1, 'w', 'd4')), /não é a sua vez/);
  assert.match(pg.fails(B, mv(B, 0, 'w', 'e5')), /fora de ordem/);
  assert.match(pg.fails(B, mv(B, 1, 'w', 'e5', `, 'w'`)), /resultado inválido/, 'não se declara a vitória do adversário');
  const fim = JSON.parse(pg.as(B, mv(B, 1, 'w', 'Dh4#', `, 'b', 'Xeque-mate! Pretas vencem.'`)));
  assert.strictEqual(fim.status, 'done'); assert.strictEqual(fim.result, 'b');
  assert.deepStrictEqual([fim.white.rating, fim.black.rating], [1188, 1212]);
  assert.match(pg.fails(A, mv(A, 2, 'b', 'e4')), /não está em andamento/);
  assert.deepStrictEqual(JSON.parse(pg.as(null, `select json_agg(t) from chess_ranking() t`)).map((r) => [r.username, r.rating, r.games]), [['Bia_2', 1212, 1], ['Ana', 1188, 1]]);
});

test('xadrez online: desistência, cancelar sala, cor escolhida e uma sala de espera por jogador', { skip }, () => {
  const g = JSON.parse(pg.as(C, `select chess_create(${vazio}, 'b')`));
  assert.strictEqual(g.me, 'b');
  const g2 = JSON.parse(pg.as(C, `select chess_create(${vazio})`));
  assert.strictEqual(pg.admin(`select count(*) from chess_games where status = 'waiting'`), '1', 'a sala anterior é substituída');
  assert.strictEqual(pg.as(C, `select chess_resign('${g2.id}')`), '', 'cancelar a sala de espera a apaga');
  const g3 = JSON.parse(pg.as(C, `select chess_create(${vazio})`));
  pg.as(A, `select chess_join('${g3.code}')`);
  assert.match(pg.fails(B, `select chess_resign('${g3.id}')`), /não encontrada/, 'quem não joga não desiste pelos outros');
  const r = JSON.parse(pg.as(A, `select chess_resign('${g3.id}')`));
  assert.deepStrictEqual([r.status, r.result, r.reason], ['done', 'w', 'desistência']);
  assert.strictEqual(JSON.parse(pg.as(A, `select chess_get('${g3.id}')`)).me, 'b');
  assert.strictEqual(pg.as(A, `select chess_get(gen_random_uuid())`), '');
});

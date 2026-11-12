// Integridade estática do site: catálogo, convenções de página, ícones, links e ausência de emoji.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { SITE, jogos, paginas, WEBGL, home } = require('../helpers/catalogo');
const ler = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2653}\u{2660}-\u{2664}\u{2666}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

// icons.js só precisa de um "document" mínimo para carregar fora do navegador
const win = { document: { readyState: 'complete', querySelectorAll: () => [] } };
new Function('window', 'document', ler('icons.js'))(win, win.document);
const icones = new Set(win.icons);

test('catálogo: a home lista todos os jogos e cada um tem a sua página', () => {
  assert.ok(jogos.length >= 32, 'catálogo lido da home');
  for (const j of jogos) assert.ok(paginas.includes(j.slug + '.html'), 'falta a página de ' + j.slug);
  const extras = paginas.map((p) => p.replace('.html', '')).filter((p) => !['index', 'ranking', 'privacidade', 'termos'].includes(p) && !jogos.some((j) => j.slug === p));
  assert.deepStrictEqual(extras, [], 'página de jogo fora do catálogo');
  assert.strictEqual(new Set(jogos.map((j) => j.slug)).size, jogos.length, 'jogo repetido');
});

test('catálogo: categorias válidas, descrições e ícones existentes', () => {
  for (const j of jogos) {
    assert.ok(['vitrine', 'tabuleiro', 'arcade', 'puzzle'].includes(j.cat), j.slug + ': categoria ' + j.cat);
    assert.ok(j.desc.length >= 10 && j.desc.length <= 60, j.slug + ': descrição fora do tamanho');
    assert.ok(icones.has(j.icone), j.slug + ': ícone inexistente ' + j.icone);
  }
});

test('catálogo: os números da abertura batem com o catálogo', () => {
  const ia = jogos.filter((j) => j.tags.includes('IA')).length;
  assert.match(home, new RegExp(`<b data-n="${ia}">0</b><small class="lbl">com IA`), 'contador "com IA"');
  assert.match(home, new RegExp(`<b data-n="${WEBGL.length}">0</b><small class="lbl">em WebGL`));
  assert.match(home, new RegExp(`${jogos.length} jogos`), 'meta description com o total');
});

for (const p of paginas) {
  test(`página ${p}: convenções`, () => {
    const s = ler(p);
    assert.match(s, /^<!doctype html><html lang="pt-BR">/, 'doctype e idioma');
    assert.match(s, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
    assert.match(s, /<title>[^<]+<\/title>/);
    assert.match(s, /<link rel="icon" href="falkyria\.svg">/);
    for (const dep of ['style.css', 'icons.js', 'config.js', 'conta.js', 'fx.js']) assert.ok(s.includes(dep), 'falta ' + dep);
    assert.ok(s.indexOf('config.js') < s.indexOf('conta.js'), 'config.js vem antes de conta.js');
    if (p !== 'index.html') {
      assert.ok(s.includes('<a class="back" href="index.html"><i data-ic="voltar"></i><span>Jogos</span></a>'), 'botão de voltar');
      assert.match(s, /<h1><i data-ic="[a-z]+"><\/i> [^<]+<\/h1>/, 'título com ícone');
      assert.ok(s.includes('class="brand"'), 'marca no cabeçalho');
    }
    assert.ok(!EMOJI.test(s), 'emoji no código da página');
    const off = /<body data-fx="off">/.test(s);
    assert.strictEqual(off, WEBGL.includes(p.replace('.html', '')), 'fundo animado ligado só fora dos jogos WebGL');
  });

  test(`página ${p}: ícones e arquivos referenciados existem`, () => {
    const s = ler(p);
    for (const m of s.matchAll(/data-ic="([a-z]+)"/g)) assert.ok(icones.has(m[1]), 'ícone inexistente: ' + m[1]);
    for (const m of s.matchAll(/icon\('([a-z]+)'/g)) assert.ok(icones.has(m[1]), 'ícone inexistente: ' + m[1]);
    for (const m of s.matchAll(/(?:src|href)="([^"#?:$'+]+\.(?:js|css|svg|html))"/g)) assert.ok(fs.existsSync(path.join(SITE, m[1])), 'arquivo inexistente: ' + m[1]);
  });
}

test('legal: Termos e Privacidade existem, estão ligados na home, no ranking e no cadastro, e citam a LGPD', () => {
  const priv = ler('privacidade.html'), termos = ler('termos.html'), conta = ler('conta.js');
  for (const f of ['index.html', 'ranking.html', 'conta.js']) for (const l of ['termos.html', 'privacidade.html']) assert.ok(ler(f).includes(`href="${l}"`), f + ' sem link para ' + l);
  for (const t of ['LGPD', '13.709', 'controlador', 'encarregado', 'art. 18', 'ANPD', 'Baixar meus dados', 'Excluir minha conta', 'Supabase', 'Vercel', 'mailto:']) assert.ok(priv.includes(t), 'privacidade.html sem ' + t);
  assert.ok(termos.includes('privacidade.html') && priv.includes('termos.html'));
  // a versão aceita no cadastro é a data que aparece nas duas páginas
  const v = conta.match(/TERMOS='(\d{4})-(\d{2})-(\d{2})'/);
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const data = `${+v[3]} de ${meses[+v[2] - 1]} de ${v[1]}`;
  assert.ok(priv.includes(data) && termos.includes(data), 'data da versão: ' + data);
});

test('segurança: cabeçalhos da produção e CSP restrita ao próprio site e ao projeto Supabase', () => {
  const h = Object.fromEntries(JSON.parse(ler('vercel.json')).headers[0].headers.map((x) => [x.key, x.value]));
  for (const k of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']) assert.ok(h[k], 'falta ' + k);
  const csp = h['Content-Security-Policy'];
  for (const d of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) assert.ok(csp.includes(d), d);
  const url = (ler('config.js').match(/url: '([^']*)'/) || [])[1];
  assert.deepStrictEqual([...csp.matchAll(/https?:\/\/[^\s;]+/g)].map((m) => m[0]), url ? [url] : [], 'a CSP só libera o projeto de config.js');
  assert.ok(!/\beval\(|new Function\(|document\.write\(/.test(paginas.map(ler).join('')), 'sem eval nem document.write nas páginas');
});

test('scripts compartilhados: sem emoji e com sintaxe válida', () => {
  for (const f of fs.readdirSync(SITE).filter((x) => x.endsWith('.js'))) {
    const s = ler(f);
    assert.ok(!EMOJI.test(s), f + ': emoji');
    if (f !== 'xadrez-worker.js') assert.doesNotThrow(() => new Function(s), f + ': sintaxe');
  }
});

test('scripts embutidos nas páginas têm sintaxe válida', () => {
  for (const p of paginas) for (const m of ler(p).matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => new Function(m[1]), p);
});

test('palavras do Palpite: cinco letras maiúsculas, sem repetição', () => {
  const w = require(path.join(SITE, 'palavras5.js'));
  assert.ok(w.length >= 500);
  assert.ok(w.every((x) => /^[A-Z]{5}$/.test(x)));
  assert.strictEqual(new Set(w).size, w.length);
});

test('ranking: todo jogo que envia pontuação existe no banco e na página de ranking', () => {
  const schema = fs.readFileSync(path.join(SITE, '..', 'supabase', 'schema.sql'), 'utf8');
  const noBanco = new Set([...schema.slice(schema.indexOf('insert into public.games'), schema.indexOf('alter table public.games')).matchAll(/\('([a-z]+)',/g)].map((m) => m[1]));
  const ranking = ler('ranking.html');
  const enviam = paginas.flatMap((p) => [...ler(p).matchAll(/Conta\.submit\('([a-z]+)'/g)].map((m) => m[1]));
  assert.ok(enviam.length >= 10);
  for (const g of enviam) { assert.ok(noBanco.has(g), g + ' fora de public.games'); assert.ok(ranking.includes(`['${g}',`), g + ' fora de ranking.html'); }
  assert.deepStrictEqual([...noBanco].sort(), [...new Set(enviam)].sort(), 'banco e jogos listam os mesmos jogos');
});

test('config.js: só URL de projeto Supabase e chave publicável (nunca a service_role)', () => {
  assert.match(ler('config.js'), /url: '(https:\/\/[a-z0-9]+\.supabase\.co)?', key: '(sb_publishable_[A-Za-z0-9_-]+)?'/);
  assert.doesNotMatch(ler('config.js'), /service_role|sb_secret_|eyJ/);
});

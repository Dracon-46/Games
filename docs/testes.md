# Testes

Três camadas, todas com o executor de testes do próprio Node (`node --test`). A única dependência é o Playwright, para controlar o navegador.

| Camada | Pasta | O que cobre | Precisa de |
|---|---|---|---|
| Unidade | `tests/unit/` | Regras dos motores de xadrez e damas; integridade do site (catálogo, convenções de página, ícones, links, ausência de emoji, palavras do Palpite, jogos do ranking, documentação em dia). | Node |
| Banco | `tests/db/` | Cada regra de `supabase/schema.sql`: cadastro, pontuação, rankings, permissões, xadrez online e rating. | Postgres |
| Navegador | `tests/e2e/` | Todas as páginas em tela de computador e de celular; a home (abas, busca, links); a jogabilidade de cada jogo; a camada online entre dois navegadores. | Chromium (+ Postgres para a parte online) |

## Como rodar

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
npm test
```

Ou uma camada de cada vez: `npm run test:unit`, `npm run test:db`, `npm run test:e2e`.

### Postgres de teste

Os testes de banco e a parte online dos testes de navegador são **pulados** quando não há Postgres. Para rodá-los, aponte para um servidor em que você possa criar bancos:

```bash
PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres npm test
```

Variáveis aceitas:

| Variável | Padrão | Uso |
|---|---|---|
| `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGPORT` | — | Conexão, como em qualquer cliente Postgres. |
| `FK_PSQL` | `psql` | Comando do `psql`, quando ele precisa de prefixo (ex.: `runuser -u postgres -- psql`). |
| `FK_DB` | `fk_test` | Banco de teste. **É apagado e recriado a cada execução.** |

## O que cada arquivo testa

| Arquivo | Conteúdo |
|---|---|
| `unit/motores.test.js` | *Perft* do xadrez (clássico e Chess960), mate em 1, material insuficiente, variantes; captura obrigatória e lei da maioria nas damas. |
| `unit/site.test.js` | O catálogo da home bate com as páginas; cada página segue o esqueleto; todo ícone e arquivo referenciado existe; nenhum emoji; sintaxe de todos os scripts; jogos do ranking iguais no banco, nas páginas e em `ranking.html`. |
| `unit/docs.test.js` | README, `docs/jogos.md` e CHANGELOG citam todos os jogos e o total certo; os links entre documentos existem. |
| `db/regras.test.js` | As regras do banco, incluindo tentativas de burlar permissões. |
| `e2e/paginas.test.js` | Cada página carrega sem erro de script, de console ou de rede, sem rolagem lateral, com cabeçalho, ícones, botão de conta e fundo animado, em 1100 px e 375 px. |
| `e2e/home.test.js` | Catálogo, abas, endereço com a aba, busca, destaques, botão aleatório, layout da abertura, animações de entrada. |
| `e2e/jogos.test.js` | Um teste dedicado para os jogos com mais regra (xadrez em vários cenários, damas, velha, cobrinha, blocos, duelo, os três de WebGL, palpite, sudoku, campo minado, memória, forca, jokempô) e um teste de reação a cliques e teclas para cada um dos demais. |
| `e2e/online.test.js` | Cadastro com erros, login, sessão entre páginas, sala de xadrez, partida até o mate, Chess960 online, desistência, cancelamento, ranking e envio de pontuação por um jogo real. |

## Integração contínua

`.github/workflows/testes.yml` roda a cada push e a cada pull request, em dois trabalhos: **Unidade** (só Node) e **Navegador e banco** (Chromium do Playwright e um serviço Postgres 16).

## Como escrever um teste novo

- **Jogo novo:** ele já entra sozinho em `paginas.test.js` e no teste de reação de `jogos.test.js`. Se o jogo tem regra que pode quebrar (vitória, pontuação, IA), acrescente um teste dedicado e inclua o jogo em `comTesteProprio`.
- **Para o teste enxergar o jogo**, exponha um objeto de leitura (`window.__nome = { get estado(){…} }`) ou use variáveis de topo do script, que o Playwright alcança com `page.evaluate`.
- **Use `jogo(slug, async (p) => { … })`**: abre a página, roda o teste e falha se a página registrar qualquer erro.
- **Evite esperas fixas**; prefira `page.waitForFunction` sobre o estado do jogo.
- **Regra nova no banco:** acrescente o caso em `db/regras.test.js`, incluindo a tentativa de burlar.

Os auxiliares ficam em `tests/helpers/`: `server.js` (servidor estático e imitação do Supabase), `browser.js` (página com coleta de erros), `pg.js` (Postgres de teste) e `catalogo.js` (lê o catálogo da home).

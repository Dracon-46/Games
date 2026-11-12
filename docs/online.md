# Contas, ranking global e xadrez online

A camada online usa um projeto [Supabase](https://supabase.com) (Postgres + Auth). O site fala com ele por `fetch`, sem biblioteca: `/auth/v1/*` para cadastro e login e `/rest/v1/rpc/<função>` para todo o resto.

O site em produção usa o projeto `falkyria-games` (organização Falkyria, região `sa-east-1`). Com `url` e `key` vazios em `JavaScript/config.js`, `Conta.on` é falso: o site funciona normalmente e os pontos de entrada online só mostram um aviso. Os testes rodam sempre assim ou contra um banco local, nunca contra a produção.

## Como ativar num projeto novo

1. Crie um projeto no Supabase.
2. No SQL Editor, rode `supabase/schema.sql` inteiro.
3. Em **Authentication → URL Configuration**, defina o **Site URL** com o endereço do site. É para lá que o link de confirmação de e-mail leva.
4. Em **Authentication → Sign In / Providers**, decida se o cadastro exige confirmação por e-mail. O site trata os dois casos. O serviço de e-mail embutido do Supabase envia poucas mensagens por hora; para uso real, configure um SMTP próprio ou desligue a confirmação.
5. Preencha `JavaScript/config.js` com a URL do projeto e a chave publicável (`sb_publishable_…`). Essa chave é feita para ficar no navegador; nunca use a chave `service_role` aqui.
6. Publique o site.

## Cliente (`JavaScript/conta.js`)

| Membro | O que faz |
|---|---|
| `Conta.on` | O modo online está configurado? |
| `Conta.user` | `{ id, name, email }` ou `null`. |
| `Conta.open(depois)` | Abre a janela de entrar/criar conta, ou o menu da conta. |
| `Conta.rpc(fn, args)` | Chama uma função do banco. Rejeita com `Error` em português. |
| `Conta.submit(jogo, pontos)` | Envia a pontuação se houver login; devolve a posição ou `null`. Sem login, convida a entrar (uma vez por visita). |
| `Conta.onChange(fn)` | Avisa quando alguém entra ou sai. |
| `Conta.logout()` / `Conta.toast(html)` | Sair / aviso flutuante. |

O menu da conta também oferece **Baixar meus dados** (`my_data`) e **Excluir minha conta** (`delete_account`, com confirmação pelo nome de jogador). O cadastro só segue com a caixa de aceite dos Termos e da Política marcada.

A sessão fica no `localStorage` (`fk-sessao`) e é renovada sozinha quando o token está para vencer. O botão de conta é inserido no cabeçalho de todas as páginas.

## Banco (`supabase/schema.sql`)

| Tabela | Conteúdo | Leitura | Escrita |
|---|---|---|---|
| `profiles` | nome de jogador (único, sem diferenciar maiúsculas), rating, partidas de xadrez e a versão dos termos aceita | pública | só por gatilho e funções |
| `games` | jogos que têm ranking e o teto de pontuação aceito | pública | só por migração |
| `scores` | melhor pontuação de cada jogador em cada jogo | pública | só por `submit_score` |
| `chess_games` | partidas de xadrez online | só pelas funções | só pelas funções |

O perfil nasce junto com o usuário: o nome e a versão dos termos aceita vêm nos metadados do cadastro, e o gatilho `on_auth_user_created` recusa o cadastro sem nome válido (3 a 16 letras, números ou `_`) ou sem o aceite.

### Funções

| Função | Quem chama | O que faz |
|---|---|---|
| `username_available(nome)` | qualquer um | O nome está livre e é válido? |
| `top_scores(jogo, limite)` | qualquer um | Ranking de um jogo. |
| `overall_ranking(limite)` | qualquer um | Ranking geral: em cada jogo o 1º vale 100 pontos, o 2º 99, e assim por diante. |
| `chess_ranking(limite)` | qualquer um | Ranking de xadrez por rating. |
| `submit_score(jogo, pontos)` | logado | Guarda a pontuação se for a melhor do jogador; devolve a posição. |
| `chess_create(estado, cor)` | logado | Abre uma sala (uma por jogador) e devolve o código. |
| `chess_join(código)` | logado | Entra na sala; quem já está na partida apenas a reabre. |
| `chess_move(id, ply, estado, lance, resultado, motivo)` | jogador da vez | Grava o lance e, se houver resultado, encerra a partida. |
| `chess_resign(id)` | jogador da partida | Desiste, ou cancela a sala ainda vazia. |
| `chess_get(id)` | logado | Estado atual da partida. |
| `chess_lobby()` | logado | Salas abertas e partidas em andamento de quem chama. |
| `my_data()` | logado | Tudo o que o site guarda sobre quem chama (acesso e portabilidade, LGPD art. 18). |
| `delete_account()` | logado | Elimina a conta: usuário, perfil e pontuações; partidas em andamento contam como desistência. |

`_chess_view` e `_chess_finish` são internas e não podem ser chamadas de fora.

## Modelo de segurança

- **Row Level Security** em todas as tabelas, sem nenhuma política de escrita. Tudo que grava passa por funções `security definer` com `search_path` vazio.
- **Permissões explícitas.** O Supabase concede `EXECUTE` em toda função nova a `anon` e `authenticated`; o esquema revoga tudo e concede função por função.
- **O que o banco garante:** quem está logado, um perfil por usuário, nome único, teto de pontuação por jogo, só a melhor pontuação fica, de quem é a vez no xadrez, a ordem dos lances e que ninguém declara a vitória do adversário.
- **O que o banco não garante:** que a pontuação foi obtida jogando, nem que um lance de xadrez é legal. Essas contas são feitas no navegador. O ranking, portanto, não é à prova de trapaça; o teto de pontuação só barra valores absurdos.

Para fechar essa lacuna seria preciso validar no servidor (por exemplo, uma Edge Function que rode `xadrez-engine.js` antes de gravar o lance).

## Testes

`tests/db/regras.test.js` carrega o esquema num Postgres comum (com `tests/db/stub.sql` fazendo o papel do Supabase) e exercita cada regra acima. `tests/e2e/online.test.js` sobe um servidor que imita as rotas do Supabase e joga uma partida inteira entre dois navegadores. Detalhes em [testes.md](testes.md). Privacidade, termos e cabeçalhos de segurança estão em [privacidade-e-seguranca.md](privacidade-e-seguranca.md).

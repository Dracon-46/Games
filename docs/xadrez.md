# Xadrez

## Motor (`JavaScript/xadrez-engine.js`)

O motor é um módulo único (`Chess`) que roda no navegador, no Web Worker e no Node.

**Estado.** Um objeto simples, que pode virar JSON sem perda (é ele que trafega no modo online):

| Campo | Significado |
|---|---|
| `b` | 64 casas; índice 0 é a8, 63 é h1. Maiúsculas são brancas, minúsculas pretas, espaço é casa vazia. |
| `t` | De quem é a vez: `'w'` ou `'b'`. |
| `c` | Direitos de roque que restam, subconjunto de `KQkq`. |
| `ep` | Casa de captura en passant, ou `-1`. |
| `h` | Meio-lances desde a última captura ou lance de peão (regra dos 50 lances). |
| `v` | Variante: `c` clássico, `9` Chess960, `k` Rei da Colina, `3` Três Xeques. |
| `rs` | Casas iniciais das torres (`K`, `Q`, `k`, `q`), usadas no roque do Chess960. |
| `cw`, `cb` | Xeques já dados por brancas e pretas (Três Xeques). |

**Funções.**

| Função | O que faz |
|---|---|
| `start(v)` | Posição inicial da variante; no Chess960 a fileira é sorteada. |
| `gen(s)` / `legal(s)` | Lances pseudolegais / legais. Um lance é `{ f, t }` mais `pr` (promoção), `ep`, `dp` (peão duplo) ou `cs`, `rf`, `rt` (roque). |
| `make(s, m)` | Devolve um estado novo; não altera o original. |
| `inCheck(s, t)` | O rei de `t` está em xeque? |
| `varWinner(s)` | Vencedor pela regra da variante logo após o lance, ou `null`. |
| `insufficient(b)` | Material insuficiente para dar mate. |
| `key(s)` | Chave da posição, para a tripla repetição. |
| `san(s, m)` | Notação algébrica em português (R, D, T, B, C). |
| `best(s, { depth, time, rand })` | Lance escolhido pela IA. |

**Roque.** É generalizado: o rei vai para a coluna g ou c e a torre para f ou d, saindo de qualquer coluna. Vale para o clássico e para o Chess960 com o mesmo código.

**IA.** Busca alfa-beta com aprofundamento iterativo, ordenação de capturas (vítima mais valiosa primeiro), busca de quiescência e extensão em xeque. `time` limita o tempo; ao estourar, vale o resultado da última profundidade completa. `rand` é a chance de um lance aleatório, usada nos níveis fáceis.

| Nível | Profundidade | Tempo | Aleatório |
|---|---|---|---|
| Iniciante | 1 | — | 40% |
| Fácil | 2 | — | 8% |
| Médio | 3 | — | — |
| Difícil | 5 | 1,5 s | — |
| Mestre | 40 | 4 s | — |

Com relógio, o tempo de busca é limitado a 1/25 do tempo restante do computador.

**Validação.** `tests/unit/motores.test.js` compara a contagem de lances (*perft*) com os números de referência na posição inicial, em posições com roque, en passant e promoção, e em duas posições de Chess960.

## Página (`JavaScript/xadrez.html`)

- **Modos:** contra o computador, 2 jogadores, computador × computador e online.
- **IA em Web Worker** (`xadrez-worker.js`): o relógio e a tela não travam enquanto ela pensa. Sem suporte a Worker, a IA roda na própria página.
- **Fim de jogo:** xeque-mate, afogamento, tripla repetição, 50 lances, material insuficiente, vitória por variante, tempo esgotado e desistência.
- **Chess960:** para rocar, clique no rei e depois na torre.
- **Extras:** escolha da peça na promoção, lista de lances, peças capturadas, dica, desfazer, virar o tabuleiro.

## Modo online

O estado da partida fica no banco e cada navegador consulta a partida a cada 1,5 s. Um lance segue este caminho:

1. O jogador faz o lance; a página atualiza a tela na hora.
2. A página chama `chess_move` com o número de lances que conhece (`p_ply`), o novo estado e o lance (`{ f, t, san, k }`).
3. O banco confere que é a vez de quem chamou e que `p_ply` bate; grava e devolve a partida.
4. O adversário recebe o novo estado na próxima consulta.

Quando o lance encerra a partida, a página manda também o resultado, e o banco só aceita a vitória de quem jogou ou empate. O rating dos dois é atualizado por Elo (K = 24).

Salas são criadas com a cor e a variante escolhidas; o adversário entra pelo código de seis caracteres, pelo link `xadrez.html?sala=CÓDIGO` ou pela lista de salas abertas. No modo online não há relógio, dica nem desfazer.

**Limite conhecido:** o banco não sabe as regras do xadrez. A legalidade de cada lance é conferida pelo navegador de quem joga, então um cliente adulterado consegue gravar uma posição ilegal. Veja [online.md](online.md).

# Catálogo de jogos

A lista oficial fica no vetor `G` de `JavaScript/index.html`; a home, as abas e os testes leem de lá. Cada jogo é a página `JavaScript/<arquivo>.html`.

Legenda: **IA** = joga contra o computador · **2J** = dois jogadores no mesmo aparelho · **Ranking** = envia pontuação ao ranking global.

## Vitrine gráfica (WebGL)

| Jogo | Arquivo | Como se joga | Extras |
|---|---|---|---|
| Enxame | `enxame` | Guie o enxame de partículas com o ponteiro (ou setas/WASD) pelos orbes de energia e longe dos vazios. | Ranking |
| Núcleo | `nucleo` | Gire o escudo (ponteiro, setas ou A/D) para rebater os projéteis antes que atinjam a esfera. | Ranking |
| Túnel | `tunel` | Pilote por dentro do túnel (ponteiro, arrastar ou setas) passando pelas aberturas das barreiras. | Ranking |

## Tabuleiro

| Jogo | Arquivo | Como se joga | Extras |
|---|---|---|---|
| Xadrez | `xadrez` | Clique na peça e no destino. Cinco níveis, variantes Chess960, Rei da Colina e Três Xeques, relógio, dica e desfazer. Detalhes em [xadrez.md](xadrez.md). | IA, 2J, online |
| Damas | `damas` | Regras brasileiras: captura obrigatória, lei da maioria, peças comuns capturam para trás, dama voadora. | IA |
| Reversi | `reversi` | Cerque as peças do adversário para virá-las; as jogadas possíveis ficam marcadas. | IA, 2J |
| Quatro em Linha | `quatro` | Solte discos nas colunas (clique ou teclas 1–7) e alinhe quatro. | IA, 2J |
| Gomoku | `gomoku` | Tabuleiro 15×15; vence quem alinhar cinco pedras. | IA, 2J |
| Batalha Naval | `naval` | Posicione a frota 5-4-3-3-2 (ou automaticamente) e alterne tiros com o computador. | IA |
| Mancala | `mancala` | Regras Kalah: 6 casas com 4 sementes, jogada extra ao terminar no depósito, captura na casa vazia. | IA, 2J |
| Pontinhos | `pontinhos` | Trace linhas entre pontos; quem fecha um quadrado pontua e joga de novo. | IA, 2J |
| Jogo da Velha | `velha` | Três em linha. No nível impossível a máquina usa minimax e nunca perde. | IA, 2J |

## Arcade

| Jogo | Arquivo | Como se joga | Extras |
|---|---|---|---|
| Cobrinha | `cobrinha` | Setas, WASD ou deslizar. Modos clássico, sem paredes e obstáculos; estrela bônus vale 5. | Ranking |
| Blocos | `blocos` | Peças de 2 a 5 blocos caem; setas movem e giram, Espaço solta, P pausa. | Ranking |
| Quebra-Tijolos | `tijolos` | Rebata a bola com a raquete; fases geradas por código e bônus que caem. | Ranking |
| Pingue-Pongue | `pingue` | Tênis de mesa até 7 pontos, com três níveis. | IA, 2J |
| Duelo | `duelo` | Luta em melhor de três rounds: soco, chute, defesa, pulo e especial quando a energia enche. Três lutadores. | IA, 2J |
| Órbita | `orbita` | Toque ou Espaço troca de anel; colete gemas e desvie dos perigos. | Ranking |
| Desvio | `desvio` | Mova a nave para os lados e sobreviva aos meteoros; escudos ajudam. | Ranking |
| Chuva de Palavras | `palavras` | Digite as palavras antes que cheguem ao chão. | Ranking |

## Quebra-cabeça e raciocínio

| Jogo | Arquivo | Como se joga | Extras |
|---|---|---|---|
| Palpite | `palpite` | Descubra 1, 2 ou 4 palavras de cinco letras ao mesmo tempo, com palavra do dia e estatísticas. | |
| Sudoku | `sudoku` | Três níveis, sempre com solução única; erros ficam marcados. | |
| Campo Minado | `campo-minado` | Três tamanhos; o primeiro clique é seguro; botão direito ou toque longo marca bandeira. | |
| Quinze | `quinze` | Deslize as peças (3×3, 4×4 ou 5×5) até ordenar; embaralhamento sempre solúvel. | |
| Tubos | `tubos` | Gire as peças até a rede inteira ficar ligada à fonte. | |
| Labirinto | `labirinto` | Labirintos gerados na hora em três tamanhos, com tempo e passos. | |
| Torre de Hanói | `hanoi` | De 3 a 7 discos, com contagem contra o mínimo de movimentos. | |
| Código Secreto | `codigo` | Deduza quatro cores em dez tentativas pelas pistas de cada palpite. | |
| Sequência | `sequencia` | Repita a sequência de luzes e sons, que cresce a cada nível. | Ranking |
| Memória | `memoria` | Ache os oito pares no menor número de jogadas. | |
| Forca | `forca` | Adivinhe a palavra pela categoria antes de seis erros. | |
| Jokempô | `jokempo` | Pedra, papel e tesoura contra a máquina. | |

## O que cada jogo guarda no navegador

Recordes e estatísticas ficam no `localStorage`, com chaves prefixadas pelo nome do jogo (por exemplo `cobrinha-hi-c112`, `palpite-st-1`, `duelo-wins`). Nada disso sai do navegador. Só os jogos marcados com **Ranking** enviam a pontuação final ao banco, e apenas se o jogador estiver logado.

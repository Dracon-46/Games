<div align="center">

<img src="JavaScript/falkyria.svg" width="72" alt="Falkyria" />

# Falkyria Games

**Um fliperama inteiro no navegador: 30 jogos, zero dependências.**

[![Jogar agora](https://img.shields.io/badge/Jogar%20agora-jogos--navegador.vercel.app-ff7a8f?style=for-the-badge&logo=vercel&logoColor=white)](https://jogos-navegador.vercel.app)

[![Testes](https://github.com/Dracon-46/Games/actions/workflows/testes.yml/badge.svg)](https://github.com/Dracon-46/Games/actions/workflows/testes.yml)
![JavaScript](https://img.shields.io/badge/JavaScript-puro-f7df1e?logo=javascript&logoColor=black)
![WebGL](https://img.shields.io/badge/WebGL-GLSL%20pr%C3%B3prio-990000?logo=webgl&logoColor=white)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-6ee7b7)

</div>

Parte da [Falkyria](https://dracon-46.github.io/Portifolio/). Tudo aqui é HTML, CSS e JavaScript escritos à mão: sem framework, sem engine, sem etapa de build. Cada jogo é uma página que abre num clique, no computador ou no celular.

## Jogos

### Vitrine gráfica (WebGL)

| Jogo | O que é |
|---|---|
| **Enxame** | Dezenas de milhares de partículas na GPU seguem o cursor; guie o enxame pelos orbes e fuja dos vazios. |
| **Núcleo** | Uma esfera 3D viva no centro; gire o escudo para desviar projéteis de fogo. |
| **Túnel** | Voo em primeira pessoa por um túnel neon infinito, desviando de barreiras giratórias. |

### Tabuleiro e estratégia

| Jogo | O que é |
|---|---|
| **Xadrez** | Contra o computador (5 níveis), 2 jogadores, computador × computador ou **online contra outra pessoa**. Variantes Chess960, Rei da Colina e Três Xeques, relógio com incremento, dica, desfazer e notação. |
| **Damas** | Regras brasileiras, com captura obrigatória e lei da maioria, contra o computador. |
| **Reversi** | Contra o computador (3 níveis) ou 2 jogadores. |
| **Quatro em Linha** | Contra o computador (3 níveis) ou 2 jogadores. |
| **Gomoku** | Cinco em linha num tabuleiro 15×15, contra o computador ou 2 jogadores. |
| **Batalha Naval** | Posicione a frota e afunde a do computador. |
| **Mancala** | Regras Kalah, contra o computador ou 2 jogadores. |
| **Pontinhos** | Feche mais quadrados que o rival. |
| **Jogo da Velha** | Máquina imbatível (minimax), fácil ou 2 jogadores. |

### Arcade

| Jogo | O que é |
|---|---|
| **Cobrinha** | Movimento suave, três modos (clássico, sem paredes, obstáculos) e estrela bônus. |
| **Blocos** | Peças de 2 a 5 blocos caem; complete linhas. |
| **Quebra-Tijolos** | Fases geradas por código, tijolos resistentes e bônus que caem. |
| **Pingue-Pongue** | Tênis de mesa contra o computador ou a dois no mesmo teclado. |
| **Órbita** | Salte entre anéis, colete gemas e fuja dos perigos. |
| **Desvio** | Pilote a nave e sobreviva à chuva de meteoros. |
| **Chuva de Palavras** | Digite as palavras antes que caiam. |

### Quebra-cabeça e raciocínio

| Jogo | O que é |
|---|---|
| **Sudoku** | Três níveis, sempre com solução única. |
| **Campo Minado** | Três tamanhos; o primeiro clique é sempre seguro. |
| **Quinze** | Deslize as peças até ordenar, em 3×3, 4×4 ou 5×5. |
| **Tubos** | Gire as peças até ligar toda a rede. |
| **Labirinto** | Labirintos gerados na hora, em três tamanhos. |
| **Torre de Hanói** | De 3 a 7 discos, com contagem contra o mínimo. |
| **Código Secreto** | Descubra a combinação de cores em 10 tentativas. |
| **Sequência** | Repita a sequência de luzes e sons que cresce. |
| **Memória** | Ache os pares. |
| **Forca** | Palavras em português, com dica de categoria. |
| **Jokempô** | Pedra, papel e tesoura. |

## Como foi feito

- **Motor de xadrez próprio** (`JavaScript/xadrez-engine.js`): geração de lances validada por *perft* contra os números de referência (inclusive em Chess960), busca alfa-beta com aprofundamento iterativo, busca de quiescência e limite de tempo. A IA roda num **Web Worker**, então o relógio nunca trava.
- **Motor de damas próprio** (`JavaScript/damas-engine.js`): sequências de captura completas, lei da maioria e dama voadora.
- **Gráficos na GPU**: os jogos da vitrine usam WebGL direto, com shaders GLSL escritos à mão.
- **Ícones próprios**: todos os ícones são SVG desenhados em `icons.js`; não há emoji nem fonte de ícones.
- **Acessível em qualquer tela**: teclado, mouse e toque; respeita `prefers-reduced-motion`.

## Contas, ranking global e xadrez online

A parte online usa o [Supabase](https://supabase.com) (Postgres + Auth) e fala com ele direto por `fetch`, sem biblioteca:

- **Cadastro e login** com e-mail, senha e nome de jogador (`JavaScript/conta.js`).
- **Ranking global** dos jogos de pontuação e ranking geral (`JavaScript/ranking.html`).
- **Xadrez online** com salas por código ou link e rating Elo.

Para ativar num projeto Supabase:

1. Rode `supabase/schema.sql` no SQL Editor do projeto.
2. Preencha `JavaScript/config.js` com a URL do projeto e a chave publicável.

Enquanto `config.js` estiver vazio, o site funciona normalmente, só sem a parte online. Toda escrita no banco passa por funções que conferem quem está logado, de quem é a vez e a ordem dos lances. A legalidade de cada lance de xadrez e as pontuações são conferidas no navegador de quem joga, então o ranking não é à prova de trapaça.

## Rodando localmente

```bash
git clone https://github.com/Dracon-46/Games.git
```

```bash
cd Games/JavaScript && python3 -m http.server 8000
```

Depois abra `http://localhost:8000`. Um servidor local é necessário só por causa do Web Worker do xadrez; os outros jogos abrem direto pelo arquivo.

## Testes

```bash
node --test tests/motores.test.js
```

Os testes cobrem as regras dos motores de xadrez e damas e rodam a cada push no GitHub Actions.

## Estrutura

```text
JavaScript/        o site: uma página por jogo, estilos, ícones e motores
supabase/          esquema do banco para contas, ranking e xadrez online
tests/             testes dos motores de regras
.github/workflows/ integração contínua
```

## Licença

[MIT](LICENSE) © Arthur Gaspare Camzano · Falkyria

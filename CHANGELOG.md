# Histórico de mudanças

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). As versões são as do `package.json`.

## [2.1.0] - 2026-11-12

### Adicionado
- **Palpite**: jogo de palavras de cinco letras com 1, 2 ou 4 palavras ao mesmo tempo, palavra do dia e estatísticas.
- **Duelo**: jogo de luta em melhor de três rounds, com três lutadores, especial, contra o computador ou a dois.
- Suíte de testes em três camadas (unidade, banco e navegador) cobrindo todas as páginas, a jogabilidade de cada jogo e a camada online; pipeline no GitHub Actions com Chromium e Postgres.
- Documentação completa em `docs/`, `CONTRIBUTING.md`, este histórico e modelo de pull request.

### Alterado
- Fundo animado religado em todas as páginas, na paleta nova.
- Total de jogos: 32.

### Corrigido
- Banco: a verificação de nome de jogador disponível diferenciava maiúsculas de minúsculas.
- Banco: funções internas do xadrez online podiam ser chamadas por qualquer usuário logado.
- Home: a órbita de ícones da abertura sumia em telas largas.
- Home: o contador "com IA" não batia com o catálogo.

## [2.0.0] - 2026-11-12

### Adicionado
- Home nova com abas por categoria, busca, destaques e animações de entrada.
- Ícones SVG próprios no lugar de todos os emojis; botão de voltar e cabeçalho fixo.
- Nove jogos: Quatro em Linha, Gomoku, Batalha Naval, Mancala, Pontinhos, Quinze, Sequência, Pingue-Pongue e Quebra-Tijolos.
- Contas, ranking global e xadrez online sobre Supabase.

### Alterado
- Cobrinha refeita: movimento suave, três modos, estrela bônus, pausa e som.
- Enxame: segue melhor o ponteiro; vazios maiores, mais numerosos e que não se aglomeram.
- Visual sem degradês, em tema neutro com destaque âmbar.

## [1.1.0] - 2026-11-10

### Adicionado
- Xadrez completo: cinco níveis de IA em Web Worker, 2 jogadores, computador × computador, Chess960, Rei da Colina, Três Xeques, relógio, promoção à escolha e todos os empates.
- Oito jogos: Órbita, Desvio, Labirinto, Tubos, Reversi, Torre de Hanói, Código Secreto e Chuva de Palavras.
- Vitrine WebGL: Enxame, Núcleo e Túnel, e o fundo animado.
- Marca Falkyria, testes dos motores e licença MIT.

## [1.0.0] - 2026-11-10

### Adicionado
- Primeira versão: Cobrinha, Blocos, Xadrez, Damas, Jokempô, Jogo da Velha, Memória, Campo Minado, Forca e Sudoku.

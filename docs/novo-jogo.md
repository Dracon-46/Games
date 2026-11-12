# Como adicionar um jogo

1. **Página.** Crie `JavaScript/<slug>.html` a partir do esqueleto de [arquitetura.md](arquitetura.md). O `slug` usa só minúsculas e hífen.
2. **Ícone.** Acrescente um ícone 24×24 em `JavaScript/icons.js` com o mesmo nome do `slug` (ou informe outro nome no catálogo).
3. **Catálogo.** Inclua uma linha no vetor `G` de `JavaScript/index.html`:
   `['slug','Nome','Descrição de 10 a 60 caracteres','categoria',['Etiqueta']]`.
   Categorias: `vitrine`, `tabuleiro`, `arcade`, `puzzle`. A etiqueta `IA` entra na contagem "com IA" da abertura; ajuste esse número.
4. **Ranking (opcional).** Se o jogo tem pontuação em que mais é melhor:
   - chame `window.Conta&&Conta.submit('slug', pontos)` no fim da partida;
   - acrescente o jogo e o teto de pontuação em `public.games`, em `supabase/schema.sql` (e rode o `insert` no projeto Supabase);
   - acrescente a aba em `T`, em `JavaScript/ranking.html`.
5. **Testes.** O jogo entra sozinho nos testes de página e de reação. Se tiver regra que pode quebrar, escreva um teste dedicado em `tests/e2e/jogos.test.js`.
6. **Documentação.** Acrescente o jogo em `docs/jogos.md`, na tabela do `README.md` e no `CHANGELOG.md`, e atualize o total de jogos onde ele aparece.
7. **Confira.** `npm test` precisa passar inteiro. Os testes de unidade apontam o que ficou faltando nos passos 2 a 6.

Requisitos de todo jogo: sem emoji, texto em português, mouse + teclado + toque, sem rolagem lateral em 375 px, botão para recomeçar, mensagem clara de vitória ou derrota, nenhuma requisição externa e nada que recrie um jogo comercial específico (nome, personagens, fases ou visual).

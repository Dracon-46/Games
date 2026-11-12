# Publicação

O site está em **https://jogos-navegador.vercel.app**, no projeto `jogos-navegador` da Vercel.

| Configuração | Valor |
|---|---|
| Repositório | `Dracon-46/Games` |
| Pasta raiz | `JavaScript` |
| Framework | nenhum (arquivos estáticos, sem build) |
| Ramo de produção | `main` |

## Fluxo

1. O trabalho acontece num ramo e vira pull request para a `main`.
2. O GitHub Actions roda a suíte inteira no pull request.
3. Com os testes verdes, o pull request é mesclado.
4. A produção é publicada a partir da `main`.

Não existe etapa de build: o que está em `JavaScript/` é servido como está. O `index.html` da raiz do repositório só redireciona para `JavaScript/`, para quem abrir o repositório pelo GitHub Pages.

## Depois de publicar

- Abra a home e um jogo de cada categoria.
- Se `config.js` mudou, entre com uma conta e confira o ranking.
- Se `supabase/schema.sql` mudou, aplique a mudança no projeto Supabase **antes** de publicar o site que depende dela.

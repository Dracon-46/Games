# Arquitetura

O Falkyria Games é um site estático: HTML, CSS e JavaScript escritos à mão, sem framework, sem engine e sem etapa de build. O que está em `JavaScript/` é exatamente o que vai para o ar.

## Pastas

```text
JavaScript/         o site
  index.html        home: catálogo, abas, busca e destaques
  ranking.html      ranking global
  privacidade.html  política de privacidade (LGPD)
  termos.html       termos de uso
  vercel.json       cabeçalhos de segurança da produção
  <jogo>.html       uma página por jogo, com o código do jogo embutido
  style.css         estilos compartilhados (tema, cabeçalho, botões, tabuleiros)
  icons.js          ícones SVG do site
  fx.js             fundo animado (WebGL)
  gfx.js            utilitários WebGL dos jogos da vitrine
  config.js         endereço e chave do Supabase (vazio = modo online desligado)
  conta.js          cadastro, login e envio de pontuação
  xadrez-engine.js  motor de xadrez
  xadrez-worker.js  roda a IA do xadrez fora da tela
  damas-engine.js   motor de damas
  palavras5.js      palavras do jogo Palpite
supabase/schema.sql banco da camada online
tests/              testes de unidade, de navegador e de banco
docs/               esta documentação
```

## Módulos compartilhados

| Arquivo | O que expõe | Quem usa |
|---|---|---|
| `icons.js` | `icon(nome)` devolve o SVG; `<i data-ic="nome"></i>` é preenchido sozinho; `icons` lista os nomes | todas as páginas |
| `fx.js` | fundo animado; `<body data-fx="off">` desliga e `data-fx="dim"` suaviza | todas as páginas (desligado nos jogos WebGL) |
| `gfx.js` | `GFX`: contexto WebGL, compilação de shaders, laço de animação, qualidade adaptativa | Enxame, Núcleo e Túnel |
| `config.js` | `FK_CONFIG = { url, key }` | `conta.js` |
| `conta.js` | `Conta`: `on`, `user`, `rpc()`, `open()`, `submit()`, `onChange()` | todas as páginas |
| `xadrez-engine.js` | `Chess`: regras, variantes, notação e IA | `xadrez.html`, `xadrez-worker.js`, testes |
| `damas-engine.js` | `Damas`: regras brasileiras e IA | `damas.html`, testes |

Os dois motores também funcionam no Node (`module.exports`), e é assim que os testes de unidade os carregam.

## Convenções de página

Toda página de jogo segue o mesmo esqueleto, e `tests/unit/site.test.js` confere cada item:

```html
<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nome</title><link rel="icon" href="falkyria.svg"><link rel="stylesheet" href="style.css"><script src="icons.js"></script>
<style>/* estilos só deste jogo */</style></head><body>
<header><a class="back" href="index.html"><i data-ic="voltar"></i><span>Jogos</span></a><h1><i data-ic="icone"></i> Nome</h1><a class="brand" href="index.html" title="Falkyria Games"><img src="falkyria.svg" alt="Falkyria"></a></header><main>
  <!-- .bar com opções e placar (.stat), .msg para o estado, o jogo, .hint com as instruções -->
</main><script>/* o jogo */</script><script src="config.js"></script><script src="conta.js"></script><script src="fx.js" defer></script></body></html>
```

Regras que valem para o site inteiro:

- **Sem emoji.** Ícones vêm de `icons.js`; peças e marcadores são desenhados com CSS, canvas ou SVG.
- **Português do Brasil** em todo texto visível.
- **Mouse, teclado e toque** em todos os jogos, sem rolagem lateral em 375 px de largura.
- **`localStorage` sempre dentro de `try/catch`**, e o jogo precisa funcionar sem ele.
- **Nenhuma requisição externa**: nada de fontes, bibliotecas ou CDNs.
- **`prefers-reduced-motion`** respeitado nas animações de interface.

## Visual

Tema escuro neutro com um único destaque âmbar, definido nas variáveis de `style.css` (`--bg`, `--card`, `--line`, `--fg`, `--mut`, `--acc`). A home e o ranking usam títulos em serifa e rótulos em fonte monoespaçada, com linhas finas no lugar de cartões e sem degradês. As páginas de jogo usam os componentes de `style.css`.

## Estado e armazenamento

Cada jogo guarda o que precisa no `localStorage` do navegador (recordes, estatísticas, palavra do dia). Só a camada online grava fora do navegador; veja [online.md](online.md).

# Falkyria Games — instruções do projeto

Site estático de jogos para navegador. Leia `docs/arquitetura.md` antes de mexer.

## Regras permanentes (pedidas pelo dono do projeto)

1. **Testes sempre.** Toda mudança mantém a suíte cobrindo tudo: regra nova ganha teste, defeito corrigido ganha teste que o reproduz, jogo novo ganha teste dedicado quando tem regra que pode quebrar. Rode `npm test` (as três camadas) antes de concluir; não entregue com teste falhando nem pulado sem dizer.
2. **Documentação sempre em dia.** Toda mudança atualiza `docs/`, `README.md` e `CHANGELOG.md` no mesmo commit. `tests/unit/docs.test.js` falha quando o catálogo e a documentação divergem.
3. **Repositório impecável.** Nada de arquivo solto, vazio ou de teste manual; sem código morto; mensagens de commit claras.
4. **Sem emoji** em nenhum lugar do site: ícones vêm de `JavaScript/icons.js`.
5. **Sem degradês e sem "cara de site gerado"**: tema neutro, um destaque âmbar, tipografia forte, linhas finas.
6. **Sem dependências em tempo de execução** e sem requisições externas. O Playwright é só para testes.
7. **Texto em português do Brasil.**
8. **Não recriar jogos comerciais específicos** (nome, personagens, fases, visual). Gêneros e jogos tradicionais, sim.

## Comandos

- `npm start` — site em http://127.0.0.1:8000
- `npm run test:unit` — motores, integridade do site e documentação
- `npm run test:db` — regras do banco (precisa de Postgres; veja `docs/testes.md`)
- `npm run test:e2e` — navegador (Chromium)

## Onde fica o quê

- Catálogo de jogos: vetor `G` em `JavaScript/index.html` (fonte única; testes e home leem de lá).
- Passo a passo de jogo novo: `docs/novo-jogo.md`.
- Camada online: `supabase/schema.sql`, `JavaScript/conta.js`, `docs/online.md`.
- Publicação: Vercel, projeto `jogos-navegador`, pasta raiz `JavaScript`, a partir da `main` (`docs/publicacao.md`).

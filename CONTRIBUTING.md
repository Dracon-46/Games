# Contribuindo

Obrigado pelo interesse. O projeto é pequeno de propósito: arquivos estáticos, sem build e sem dependências em tempo de execução.

## Preparar

```bash
git clone https://github.com/Dracon-46/Games.git
```

```bash
cd Games && npm install && npx playwright install chromium
```

```bash
npm start
```

O site abre em `http://127.0.0.1:8000`.

## Regras

- Leia [docs/arquitetura.md](docs/arquitetura.md) antes de mexer; para um jogo novo, siga [docs/novo-jogo.md](docs/novo-jogo.md).
- **Toda mudança vem com teste.** Regra nova, teste novo; defeito corrigido, teste que o reproduz.
- **Toda mudança atualiza a documentação** que ela torna desatualizada, e ganha uma linha no [CHANGELOG.md](CHANGELOG.md).
- `npm test` precisa passar inteiro antes do pull request.
- Sem emoji, sem bibliotecas, sem requisições externas, texto em português do Brasil.
- Nada que recrie um jogo comercial específico: mecânicas de gênero e jogos tradicionais são bem-vindos; nomes, personagens, fases e visual de terceiros, não.

## Commits e pull requests

Mensagens de commit curtas, no imperativo, dizendo o que muda e por quê. O pull request segue o modelo do repositório e descreve como a mudança foi verificada.

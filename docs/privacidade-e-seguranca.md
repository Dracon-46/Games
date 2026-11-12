# Privacidade (LGPD), termos e segurança

## O que o site publica

| Página | Conteúdo |
|---|---|
| `JavaScript/privacidade.html` | Política de Privacidade: controlador e encarregado, dados tratados e base legal de cada um, operadores (Supabase e Vercel), transferência internacional, retenção, direitos do titular, crianças e adolescentes, segurança. |
| `JavaScript/termos.html` | Termos de Uso: conta, jogo limpo, propriedade intelectual, disponibilidade e foro. |

As duas estão ligadas no rodapé da home, na página de ranking e na janela de conta.

## Como cada exigência da LGPD é atendida

| Exigência | Onde está |
|---|---|
| Transparência (art. 9º) | `privacidade.html`, em linguagem direta, com tabela de dado, finalidade e base legal. |
| Minimização (art. 6º, III) | A conta pede só e-mail, senha e nome de jogador. Jogar não exige cadastro e, sem conta, nada sai do navegador. |
| Aceite registrado | O cadastro só segue com a caixa de aceite marcada; a versão aceita (`TERMOS` em `conta.js`) vai nos metadados e o banco grava `terms_version` e `terms_accepted_at`. Sem ela, o gatilho recusa o cadastro. |
| Acesso e portabilidade (art. 18, II e V) | Menu da conta → **Baixar meus dados** chama `my_data()` e baixa um JSON com conta, perfil, pontuações e partidas. |
| Eliminação (art. 18, VI) | Menu da conta → **Excluir minha conta** chama `delete_account()`: apaga usuário, perfil e pontuações na hora; partidas em andamento viram desistência; partidas encerradas ficam com o adversário, sem o nome de quem saiu. |
| Correção e demais pedidos | Pelo e-mail do encarregado, informado na política. |
| Crianças e adolescentes (art. 14) | Conta só a partir de 12 anos, com autorização do responsável para adolescentes; declarado no aceite. |
| Cookies | Não há cookies nem rastreadores. O `localStorage` guarda só o necessário (recordes, preferências e a sessão), por isso não há aviso de cookies. |

Ao mudar os textos de forma relevante: atualize a data nas duas páginas e a constante `TERMOS` em `conta.js` (um teste confere que as três batem).

## Segurança

**No navegador** (`JavaScript/vercel.json`, aplicado pela Vercel em todas as respostas):

| Cabeçalho | Efeito |
|---|---|
| `Content-Security-Policy` | Só carrega recursos do próprio site; conexões apenas com o site e com o projeto Supabase de `config.js`; sem plugins; não pode ser embutido em outra página. Scripts e estilos embutidos são permitidos porque cada jogo é uma página única. |
| `Strict-Transport-Security` | Sempre HTTPS. |
| `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` | Sem adivinhação de tipo, sem moldura, referência mínima e sem câmera, microfone, localização ou pagamento. |

O servidor de testes entrega os mesmos cabeçalhos, então a suíte inteira roda sob a mesma política.

**No banco** (`supabase/schema.sql`): Row Level Security em todas as tabelas, nenhuma escrita direta, funções `security definer` com `search_path` vazio e permissão concedida função por função. Detalhes e limites em [online.md](online.md).

**Na conta**: senha de 8 caracteres ou mais, guardada como *hash* pelo Supabase Auth; sessão no `localStorage`, renovada sozinha e apagada ao sair; mensagens de erro que não revelam se um e-mail tem conta além do que o próprio cadastro revela.

**No repositório**: `config.js` só pode conter a URL do projeto e a chave publicável (um teste barra qualquer chave secreta); falhas de segurança são relatadas conforme [SECURITY.md](../SECURITY.md).

## Limites conhecidos

- Os textos legais foram escritos para refletir o que o sistema faz, mas **não foram revisados por um advogado**.
- O ranking não é à prova de trapaça (veja [online.md](online.md)).
- Não há moderação automática de nomes de jogador; nomes ofensivos são removidos sob denúncia.
- O e-mail de confirmação usa o serviço embutido do Supabase, com limite baixo de envios por hora.

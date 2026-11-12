# Segurança

## Como relatar uma falha

Se você encontrou uma falha de segurança no Falkyria Games, **não abra uma issue pública**. Use uma destas vias privadas:

- [Relato privado de vulnerabilidade](https://github.com/Dracon-46/Games/security/advisories/new) no GitHub; ou
- e-mail para arthurgaspare@gmail.com, com o assunto "Segurança — Falkyria Games".

Diga o que encontrou, como reproduzir e qual o impacto. Você recebe uma resposta em até 7 dias, e a correção é publicada o quanto antes, com o crédito a quem relatou, se quiser.

## O que está no escopo

- O site em https://jogos-navegador.vercel.app e o código deste repositório.
- As regras do banco em `supabase/schema.sql` (acesso a dados de outros jogadores, escrita indevida, escalada de permissão).

## O que já é conhecido

O ranking e a legalidade dos lances de xadrez online são conferidos no navegador de quem joga; pontuações forjadas e posições ilegais gravadas por um cliente adulterado são um limite documentado em [docs/online.md](docs/online.md), não uma falha nova.

## Como o projeto se protege

Veja [docs/privacidade-e-seguranca.md](docs/privacidade-e-seguranca.md).

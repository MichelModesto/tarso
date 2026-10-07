# Camisas Sem Nome — votação

Site de votação das 20 propostas de camisa do Sem Nome F.C., com placar público e limite de um voto por IP.

## Arquitetura

- Frontend estático em `public/`
- API em Cloudflare Pages Functions
- Cloudflare D1 para persistir votos
- O IP nunca é salvo diretamente: a API grava somente um HMAC SHA-256 com segredo privado
- Índice único no hash impede mais de um voto por IP

## Publicação pelo GitHub + Cloudflare Pages

1. Crie no GitHub um repositório chamado `camisas-sem-nome` e envie esta pasta.
2. No Cloudflare, crie um banco D1 chamado `camisas-sem-nome-votes`.
3. Troque `REPLACE_AFTER_CREATING_D1_DATABASE` em `wrangler.toml` pelo ID do banco.
4. Aplique `migrations/0001_create_votes.sql` ao banco.
5. Crie um projeto Pages conectado ao repositório GitHub:
   - diretório raiz: `camisas-sem-nome`
   - comando de build: vazio
   - diretório de saída: `public`
6. Adicione o binding D1 `DB` e a variável secreta `IP_HASH_SALT` com um valor longo e aleatório.

## Desenvolvimento local

```bash
npm install
npm run db:migrate:local
npm run dev
```

> O bloqueio por IP reduz votos repetidos, mas redes compartilhadas (empresa, escola ou operadora móvel) podem fazer várias pessoas aparecerem com o mesmo IP.

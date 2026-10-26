# 0003 — BFF no próprio Angular SSR + Express

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

A página é pública e a Spotify Web API exige autenticação. O fluxo adequado (Client Credentials) usa um
**Client Secret**, que não pode existir em código enviado ao navegador. Precisamos de um intermediário no servidor.

## Decisão

Expor rotas `/api` no servidor Express que o Angular SSR já gera (`src/server.ts`), com a lógica em `src/bff/`.
O token de acesso e as chamadas ao Spotify ficam só no servidor; o browser consome `/api/tracks`.

## Alternativas consideradas

- **Angular estático + Vercel Functions** — simples, mas acopla a um provedor e separa dois deploys.
- **Cloudflare Pages + Functions** — idem; runtime diferente do Node usado nos testes.
- **Secret no frontend** — inaceitável: qualquer visitante o extrairia.
- **Spotify Authorization Code/PKCE no browser** — exigiria login do usuário final, contrariando "página pública".

## Consequências

- Positivas: um único artefato/deploy (imagem Docker); segredo isolado; cache e controle de rate limit no servidor; SSR do shell.
- Negativas: o app deixa de ser puramente estático (precisa de runtime Node); testes do servidor ficam num ambiente
  Vitest separado do jsdom do frontend.

## Atualização (24/10/2026)

O SSR deixou de entregar só o esqueleto: o servidor busca as faixas no próprio BFF, renderiza a lista no HTML e a passa ao
navegador por `TransferState` ([ADR 0025](0025-ssr-renderiza-as-faixas-e-store-com-rxresource.md)). O cache do BFF dura horas e serve a
resposta antiga se o Spotify falhar ([ADR 0024](0024-cache-longo-com-resposta-antiga-e-saude-do-spotify.md)).

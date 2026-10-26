# OneRPM Challenge — consulta de faixas por ISRC (SPA, branch `main-spa`)

Aplicação Angular 21 (LTS) **estática** (sem SSR, sem servidor) que consulta a Spotify Web API por ISRC direto do
navegador e mostra as faixas num painel de catálogo (design "B · Catálogo"). A versão SSR entregue vive na branch `main`
e **não deve ser alterada a partir daqui** (nem o deploy da Vercel).

## Stack

- Angular 21 (standalone, zoneless, signals, OnPush). UI própria + Angular CDK (Dialog, Menu, Clipboard, Layout).
  Transloco para i18n (seis idiomas).
- Spotify: credenciais em `src/environments` → `SPOTIFY_CREDENTIALS`; `SpotifyTokenService` pede o token de app;
  `spotifyAuthInterceptor` põe o `Bearer` nas chamadas a `api.spotify.com` (e renova após 401). ADR 0002.
- Vitest (`npm test`), Playwright + axe (`npm run e2e`), angular-eslint, Prettier.
- Node `^22.12 || >=24` e npm >= 11.6 (o npm 10/11.4 falha com `edgesOut`).

## Comandos

- `npm start` — `ng serve` com `environment.local.ts` (copie de `environment.local.example.ts`).
- `npm run build` — build de produção com `environment.ts` (sem credenciais no Git).
- Deploy: GitHub Pages, só manual (Actions → "Deploy to GitHub Pages" na `main-spa`); credenciais pelos secrets
  `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`. ADR 0006.
- Antes de abrir PR: `npm run lint && npm run format:check && npm run typecheck && npm run test:ci && npm run build && npm run e2e`.

## Convenções

- **Nomes clássicos do Angular (ADR 0004):** `xxx.component.ts|html|scss|spec.ts`, `xxx.service.ts`,
  `xxx.interceptor.ts`, classes com sufixo (`HeaderComponent`, `I18nService`). Gere com `ng generate` (o
  `angular.json` já está configurado). **Nunca** template ou estilo inline. Todo component, service, store e
  interceptor tem `.spec.ts`.
- **Camadas (ESLint):** `src/app/api/` é o único lugar que faz requisição para fora (e o único com `HttpClient`);
  `src/app/services/` usa a `api/` e entrega ao app; `features`, `layout`, `shared` e `core` nunca importam `api/`.
  Dentro da feature: `pages → components → store → domain`. `models/` não depende de nada do app.
- **Commits**: Conventional Commits; escopos em `commitlint.config.js`. Husky roda commitlint + lint-staged.
- **Branches/PRs**: uma branch por etapa, PR pequeno **para `main-spa`** (o CI só roda para ela).
- **ADRs**: decisão técnica relevante ganha um registro em `docs/adr/` no mesmo PR e entra no índice. Ao mudar uma
  decisão, atualize o resumo no `README.md`.
- **Segredos**: credenciais reais só em `environment.local.ts` (ignorado) e no pipeline de deploy; nunca no Git.
- Código: sem `any`; funções puras no domínio; mappers isolam o formato do Spotify. Propriedades privadas com `_`,
  modificador de acesso explícito, enums em `UPPER_SNAKE_CASE` (lint).

## Front

- **Estado**: `TracksStore` (signals + `rxResource`): ordem (`sortResults`, localidade fixa `en`), filtro de texto
  (`filterResults`), filtro por situação (`filterByStatus`), resumo (`summarizeResults`) e a faixa em foco
  (`linkedSignal`). ISRCs sem faixa ficam na lista, depois das faixas. Nos testes, espere com `TestBed.tick()` + timers,
  nunca `whenStable()` com a requisição pendente.
- **Tema**: tokens CSS em `src/styles.scss`, claro e escuro por `data-theme` no `<html>`. `public/theme-init.js` aplica
  o tema salvo (`orp.theme`) antes da pintura; mantenha a chave igual a `THEME_STORAGE_KEY`. Não use cores fora dos tokens.
- **i18n**: toda chave nova entra nos seis arquivos de `core/i18n/translations` (o teste de paridade falha se faltar).
  O idioma escolhido fica no `localStorage` (`orp.language`). Datas via `formatReleaseDate` (UTC).
- **Detalhe e prévia**: `TrackDetailComponent` mostra a faixa em foco; no desktop é um painel, abaixo de 64rem uma _bottom sheet_
  (`DetailSheetComponent`, CDK Dialog). O player do Spotify (`SpotifyPreviewComponent`, via `SpotifyPlayerService`/`SpotifyEmbedPlayer`) só é criado
  após o clique; trocar de faixa ou fechar a sheet para a prévia. URLs do embed só saem de `buildEmbedUrl`/`buildTrackUri`.
- **Datas de lançamento**: `Track.releaseDate` é a mais antiga; `Track.releaseDates` traz todas as datas distintas
  que o Spotify retornou para o ISRC (mercado BR, tocáveis ou não). Com mais de uma, o detalhe mostra o aviso
  `ReleaseDatesComponent` ("x datas encontradas"), que abre um popover (CDK Overlay) com as datas, a exibida marcada.
- **CSP-friendly**: nenhum `<script>` em linha no `index.html` (o tema é `public/theme-init.js`) e `inlineCritical`
  desligado, para que a hospedagem possa usar `script-src 'self'` + Spotify.
- **Acessibilidade**: WCAG AA e axe limpo (e2e em claro, escuro e celular). Botões só com ícone têm `aria-label`; o nome
  acessível deve conter o texto visível.

## Angular — regras do projeto

- Standalone (não setar `standalone: true`), `input()`/`output()`, `inject()`, `computed()`, `OnPush`.
- `@if/@for/@switch`; sem `ngClass`/`ngStyle`; host bindings no objeto `host`.
- Siga `.claude/skills/angular-developer` e `.claude/skills/angular-new-app`.

## Spotify (2026)

- `available_markets` removido: disponibilidade no Brasil via `market=BR` + `is_playable`/`restrictions`.
- `/search` aceita `limit` <= 10; endpoints batch removidos. `preview_url` é frequentemente `null` → embed oficial.

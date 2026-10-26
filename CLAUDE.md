# OneRPM Challenge — consulta de faixas por ISRC

Página pública (Angular 21 LTS + SSR/Express) que consulta a Spotify Web API por ISRC e exibe as faixas
ordenadas por título. Sem persistência. O enunciado original está no `README.md`.

## Stack

- Angular 21 (standalone, zoneless, signals, OnPush) + SSR com Express; PrimeNG 21 para UI; Transloco para i18n.
- BFF em `src/bff/` (rotas `/api`, montadas em `src/server.ts`): o Client Secret do Spotify **nunca** vai ao browser.
- Testes com Vitest (`npm test`); lint com angular-eslint; Prettier.
- Node `^22.12 || >=24` (o que o Angular 21 exige; lint-staged 17 e ESLint 10 pedem 22.22.1+ e só avisam em versões menores); use npm >= 11.6 (o npm 11.4 falha com `edgesOut` ao resolver peers).

## Convenções

- **Commits**: Conventional Commits (`feat(bff): ...`). Escopos em `commitlint.config.js`. Husky roda commitlint + lint-staged.
- **Branches/PRs**: uma branch por etapa (`feat/...`, `chore/...`, `ci/...`), PR pequeno para `main`, integrado com _merge commit_ (preserva os commits semânticos de cada etapa; `main` protegida exige `CI OK` e `PR title`).
- **ADRs**: toda decisão técnica relevante ganha um registro em `docs/adr/` (template em `0000-template.md`), no mesmo PR que a introduz, e entra no índice do `docs/adr/README.md`.
- Segredos só em `.env` (ignorado) e secrets do GitHub. Use `.env.example` como referência.
- Código: sem `any`; funções puras no domínio; mappers isolam o formato do Spotify (anti-corruption layer).
- **Organização do código (ADR 0027, que revisa o 0008)**: declarações moram junto do código que as usa; vão para `<domínio>.interfaces|types|enums|constants.ts` só quando compartilhadas por 2+ arquivos ou volumosas (o ESLint não impõe mais isso). Conjuntos fechados que cruzam uma fronteira (contrato, JSON, `switch` em vários arquivos) são `enum` (membros em `UPPER_SNAKE_CASE`, imposto pelo lint); um conjunto local a um arquivo pode ser _string literal union_. `src/contract` não depende do BFF nem do Angular.
- **Pastas por responsabilidade (ADR 0023, imposto pelo ESLint)**: `features/tracks/` = `api/` (BFF), `store/` (signals), `domain/` (funções puras), `spotify/` (embed e iFrame API), `components/`, `pages/`, `testing/`. Dependências só para baixo: `pages → components → store → api/domain`, `components → spotify`. `core/i18n` = `language/` + `translations/`; BFF = `api → tracks (finder, mapping) → spotify → shared`, com `config/`. Pasta nova entra no `forbid`/`layerRule` do `eslint.config.js`.
- **Classes**: propriedades privadas com prefixo `_` (`private readonly _fetchFn`); modificador de acesso sempre explícito (`public`/`private`/`protected`, exceto no `constructor`); laço infinito com `while (true)`.
- **CI** (`.github/workflows/ci.yml` e `pr-title.yml`, ADR 0009): em PRs para `main` roda commitlint (commits e título), lint, Prettier, typecheck, testes com cobertura mínima e build. Antes de abrir PR, rode `npm run lint && npm run format:check && npm run typecheck && npm run test:ci && npm run build && npm run e2e`.
- **Front (ADR 0010)**: a lista é ordenada com `sortResults` (localidade fixa `en`, nunca `und`; ignora acento e pontuação); duração via `formatDuration` (`mm:ss`); estado em `TracksStore` (signals + `rxResource`, ADR 0025: a busca começa sozinha, roda também no servidor e o resultado vai ao navegador por `TransferState`; testes esperam com `TestBed.tick()` + timers, nunca `whenStable()` com a requisição pendente). ISRCs sem faixa continuam na lista, depois das faixas.
- **i18n (ADR 0011)**: Transloco, seis idiomas (`en pt es ru fr tr`) em `src/app/core/i18n/translations/`. Toda chave nova entra nos seis arquivos (o teste de paridade falha se faltar) e sem plural dependente de idioma. Idioma: escolha salva (cookie `orp.language`, lido também pelo servidor, ADR 0026) → navegador (`Accept-Language` no servidor) → inglês; nos testes, `saveLanguage`/`savedLanguage` (`src/app/testing`) e o `test-setup` limpa o cookie a cada teste. Datas via `formatReleaseDate` (UTC).
- **Tema e layout (ADR 0012)**: PrimeNG 21 com preset em `src/app/core/theme`; cores só em `theme.constants.ts` (paleta própria, não oficial da ONErpm); modo escuro pela classe `app-dark`, aplicada antes da pintura pelo script do `index.html` (mantenha-o igual às constantes). Contraste AA é testado. Componentes de UI em `src/app/layout` e `src/app/features/*`.
- **Cartões e player (ADR 0013)**: cada faixa é um `TrackCard`; ISRC sem faixa é um `IsrcCard`. O player do Spotify é carregado só ao clicar (ADR 0016); o endereço que ele toca vem de `buildTrackUri` e o iframe de contingência só recebe a URL de `buildEmbedUrl` (origem fixa + id validado + idioma como tag validada; o embed da iFrame API recebe o idioma por `SpotifyIframeConfig.locale`, ADR 0016) — nunca monte essas URLs à mão. O selo do Brasil fica no corpo do cartão (nunca sobre a capa) e sempre com ícone e texto.
- **E2E e acessibilidade (ADR 0014)**: `npm run e2e` (Playwright + axe, em `e2e/`) roda contra o build de produção com a API simulada por dados reais gravados; o alerta de indisponibilidade usa o BFF real sem credenciais. Instale o navegador uma vez com `npm run e2e:install`. Espere as faixas aparecerem antes de interagir (hidratação) e **todo componente PrimeNG com foco precisa de `autofocus` desligado explicitamente** (`[autofocus]="false"` no select, `[buttonProps]="{ autofocus: false }"` nos botões).
- **Acabamento da interface (ADR 0015)**: os cartões de uma linha compartilham as mesmas 8 linhas da grade com `subgrid` (hosts `display: contents`: meça o `<article>`, não o host, nos testes); o título da aba é o nome do produto traduzido e o ícone é o mesmo logo do cabeçalho; o rodapé (`AppFooter`) leva ao portfólio do autor; ações do cartão usam `ActionButton` (ícone `ActionIcon` + rótulo; `pressed` ou `href`). O aviso de falha parcial abre um modal com os ISRCs afetados (`TracksStore.failedIsrcs`); o player reserva seu lugar e mostra o carregamento até o embed ficar pronto.
- **Barra de reprodução (ADR 0016)**: o player vive numa barra fixa (`PlayerBar`, `position: sticky` depois do rodapé), não nos cartões; `NowPlaying` guarda a faixa tocando e o `TrackPlayer` do cartão é só o botão ("Tocando agora" com equalizador animado). O início automático usa a iFrame API oficial do Spotify (`SpotifyIframeApi`), carregada só no primeiro clique, conduzida por `SpotifyEmbedPlayer` (máquina de estados `IDLE→STARTING→READY|FAILED`, em `spotify/`; o `PlayerBar` só monta); sem ela, cai no embed simples. Sobre a capa há um botão de play (atalho do mouse, `aria-hidden`, sem tab stop); volume não existe na API do embed. O ponto de montagem recorta o embed em 12 px (o iframe tem canto branco opaco no tema escuro). Nos e2e, `isolateSpotify` serve um `iframe-api` falso que registra em `window.__spotify`.
- **Grade e cartão compacto (ADR 0017)**: a página tem 80rem e colunas de no mínimo 16,5rem (4 no desktop); a grade é um _size container_ e, em uma coluna (`@container (width < 34.25rem)`), o `TrackCard` vira um cartão compacto (capa pequena ao lado do texto). Mexa nesses limites juntos (grade, `tracks-page.scss`, `track-card.scss`).
- **Filtro, cópia e ISRCs ausentes (ADR 0018)**: `filterResults` (função pura: título ou ISRC, sem maiúsculas/acentos/separadores) alimenta a lista da página; `CopyButton` (em `shared/`) copia pelo `Clipboard` do CDK; `IsrcListDialog` é a lista em modal (copiar um, copiar todos, "tentar novamente" opcional) usada para os ISRCs que **falharam** e para os que **não constam**. Chaves novas em `list.*` e `copy.*` nos seis idiomas. Nos e2e, conceda as permissões `clipboard-read/write` e normalize `\r\n`.
- **Servidor e ordem (ADR 0019)**: `src/server.ts` desliga `x-powered-by`, comprime (`compression`) e aplica `securityHeaders` (`src/bff/http`): a CSP dos arquivos e da API é a base; a do HTML tem `script-src` com um nonce por resposta (ADR 0028: `createNonce`, `buildContentSecurityPolicy`, `trustedInlineScripts`/`addNonceToTrustedScripts` (o nonce só vai a scripts idênticos aos do template); `CSP_NONCE` no servidor; nunca coloque um `<script>` em linha no `index.html` sem pensar nisso; o e2e `csp` não pode ter violações). A ordem por título é `TracksStore.direction` (`SortDirection`, `toggleDirection()`); os ISRCs sem faixa ficam sempre depois; nada é guardado..
- **Imagem e deploy (ADR 0020)**: o `Dockerfile` leva só o _build_ (sem `node_modules`), roda sem _root_ e tem `HEALTHCHECK` em `GET /api/health`. O CI tem o job `Docker image` (exigido pelo `CI OK`). O workflow `Release` só implanta na Vercel e publica a imagem no GHCR quando **uma release é publicada** no GitHub (criada à mão, ADR 0022: Releases → nova tag `vX.Y.Z` na `main` → Publish), construindo a partir da **tag**; merge comum na `main`, rascunho e _pre-release_ não implantam. Não há release-please nem `RELEASE_PLEASE_TOKEN`.
- **Vercel (ADR 0021)**: o site é o servidor SSR/BFF como uma função (`api/index.mjs` reexporta `reqHandler`; `vercel.json` manda tudo o que não é estático para ela e repete os cabeçalhos de segurança, travados por `src/vercel-config.spec.ts`). `git.deploymentEnabled: false`: só o job `Deploy to Vercel` do workflow `Release` implanta, da tag. Segredos: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`; no projeto da Vercel: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `NG_ALLOWED_HOSTS`, Node 24.
- **README**: resume cada decisão (por quê, o que se ganha e o que se paga) e aponta para o ADR; ao mudar uma decisão, atualize o resumo no `README.md` junto com o ADR. O enunciado original fica em `<details>` no fim, sem alterações.
- Siga `.claude/skills/angular-developer` e `.claude/skills/angular-new-app` (instaladas de https://github.com/angular/skills).

## Angular — regras do projeto

- Standalone (não setar `standalone: true`), `input()`/`output()`, `inject()`, `computed()`, `ChangeDetectionStrategy.OnPush`.
- `@if/@for/@switch`; sem `ngClass`/`ngStyle`; host bindings no objeto `host`.
- Acessibilidade: WCAG AA e AXE limpos.

## PrimeNG

- MCP configurado em `.mcp.json` (`@primeng/mcp@21`). Não instale também o plugin PrimeNG — duplicaria o servidor.
- Docs para LLM: https://primeng.dev/llms/llms.txt, https://primeng.dev/llms/llms-full.txt (adicione `.md` a uma página para obter Markdown).

## Spotify (2026) — pontos que mudaram

- `available_markets` removido: disponibilidade no Brasil via `market=BR` + `is_playable`/`restrictions`.
- `/search` aceita `limit` <= 10; endpoints batch removidos. `preview_url` é frequentemente `null` → fallback para embed oficial.

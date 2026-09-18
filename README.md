# ONErpm · Faixas por ISRC

Página pública que resolve códigos ISRC na Spotify Web API e exibe os dados de cada
faixa, ordenados alfabeticamente por título.

O enunciado original do desafio está em [`docs/README.md`](docs/README.md).

## Stack

| Camada     | Escolha                                                           |
| ---------- | ----------------------------------------------------------------- |
| Framework  | Angular 21 (LTS), standalone, zoneless, change detection `OnPush` |
| Linguagem  | TypeScript strict                                                 |
| Assíncrono | RxJS 7                                                            |
| Estilo     | Tailwind CSS v4 (via PostCSS)                                     |
| Testes     | Vitest (unitários e de integração) + `HttpTestingController`      |
| Backend    | Cloudflare Pages Function (apenas para o token do Spotify)        |

## Por que existe um backend

O fluxo _Client Credentials_ do Spotify exige um `client_secret`, e o enunciado pede
uma página **pública**. Colocar o segredo no bundle o tornaria público junto com ela.

Por isso a troca de credenciais acontece em `functions/api/spotify-token.ts`, que roda
no servidor e devolve ao navegador apenas o `access_token`. O código em `src/` nunca vê
o segredo.

## Pré-requisitos

- Node `^20.19 || ^22.12 || >=24`
- npm `>= 11` (o npm 10 não resolve a árvore de dependências do Vitest 4; para apenas
  instalar a partir do lockfile, `npm ci` funciona em ambas as versões)
- Uma app registrada em [developer.spotify.com](https://developer.spotify.com/dashboard)

## Configuração

```bash
npm ci
cp .dev.vars.example .dev.vars   # preencha SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET
```

`.dev.vars` é ignorado pelo git. Em produção, use
`wrangler pages secret put SPOTIFY_CLIENT_ID` (e o mesmo para o secret) ou o painel do
Cloudflare Pages.

## Desenvolvimento

São dois processos: a função serverless e o dev server do Angular, que faz proxy de
`/api` para ela (`proxy.conf.json`).

```bash
npm run dev:api   # http://localhost:8788  (wrangler pages dev)
npm start         # http://localhost:4200
```

## Scripts

| Comando              | O que faz                          |
| -------------------- | ---------------------------------- |
| `npm start`          | Dev server com proxy para `/api`   |
| `npm run dev:api`    | Pages Function local (wrangler)    |
| `npm run build`      | Build de produção                  |
| `npm test`           | Suíte de testes                    |
| `npm run test:watch` | Testes em watch mode               |
| `npm run test:cov`   | Testes com relatório de cobertura  |
| `npm run lint`       | ESLint (`src/` e `functions/`)     |
| `npm run format`     | Prettier                           |
| `npm run deploy`     | Build + deploy no Cloudflare Pages |

## Arquitetura

Dependências apontam em uma única direção: `features → shared → core`. O ESLint
reprova qualquer import que contrarie isso, então a regra não depende de disciplina.

```
src/app/
├── core/       # singletons da aplicação: config, HTTP, token, erros
├── shared/     # apresentacional e reutilizável, sem conhecer o domínio
└── features/
    └── tracks/
        ├── domain/   # Track, contrato do repositório, regras (ordenação)
        ├── data/     # DTOs do Spotify, mapper, implementação HTTP
        └── ui/       # container + componentes de apresentação
```

O ponto central é `TrackRepository`, uma classe abstrata que serve de token de DI. A
página injeta o contrato, nunca a implementação: trocar o Spotify por outro provedor é
adicionar uma classe, e testar a página é fornecer um fake — sem tocar no componente.

RxJS cuida do assíncrono (token, fan-out das buscas, retry com backoff, erros); signals
cuidam do estado de view. A conversão acontece uma única vez, com `toSignal()`, na
fronteira do container.

## Testes

```bash
npm test
```

Cobrem o mapper e a ordenação (unitários puros), o repositório e os interceptors
(integração com `HttpTestingController`) e a página (integração contra um
`FakeTrackRepository`).

## Convenções de commit

[Conventional Commits](https://www.conventionalcommits.org/), validados por commitlint
em um hook do husky. O hook de pre-commit roda ESLint e Prettier nos arquivos em stage.

```
feat(tracks): exibe disponibilidade no mercado BR
```

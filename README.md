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

## Atendimento ao enunciado

Todos os itens pedidos em [`docs/README.md`](docs/README.md) foram entregues. Dois
deles não são mais possíveis da forma descrita, porque a API do Spotify deixou de
retornar os campos correspondentes. Abaixo, o que foi verificado contra a API real e
qual foi a substituição.

| Item do enunciado                    | Situação       |
| ------------------------------------ | -------------- |
| Thumb do álbum                       | ✅ direto      |
| Data de lançamento                   | ✅ direto      |
| Título da faixa                      | ✅ direto      |
| Lista dos artistas                   | ✅ direto      |
| Duração em `mm:ss`                   | ✅ direto      |
| Link para a página no Spotify        | ✅ direto      |
| Player com prévia do áudio           | ⚠️ substituído |
| Sinalização de disponibilidade no BR | ⚠️ substituído |

### Player com prévia do áudio

**Não é possível como descrito.** O campo `preview_url`, que expõe o arquivo de
prévia de 30s, foi removido das respostas da API para aplicações criadas a partir de
nov/2024. Nas 10 faixas do enunciado ele vem **ausente** — não nulo, o campo não
existe. Sem arquivo, não há como alimentar um elemento `<audio>` próprio.

**Substituído por** o player de incorporação oficial do Spotify
(`open.spotify.com/embed/track/{id}`), que continua reproduzindo a prévia. O
requisito — ouvir a prévia na própria página — é cumprido; o que muda é quem desenha
o controle.

O componente `TrackPlayer` ainda usa um `<audio>` nativo quando `preview_url` existe,
então a decisão fica isolada em um arquivo e volta sozinha se o Spotify reverter.

### Sinalização de disponibilidade no Brasil

**Não é possível como descrito.** O array `available_markets`, a forma documentada de
saber em quais países a faixa está licenciada, também não vem mais nas respostas —
nem na busca, nem em `GET /v1/tracks/{id}`.

**Substituído por** `is_playable`, que o Spotify retorna **apenas quando a requisição
envia o parâmetro `market`**. A busca por ISRC passa `market=BR`, e o valor de
`is_playable` vira a sinalização exibida no card.

Vale registrar a armadilha: a documentação diz que enviar `market` _remove_
`available_markets`, o que sugere não enviá-lo. Hoje isso está invertido — o array
não vem de qualquer forma, e omitir `market` apenas descarta também o `is_playable`,
marcando silenciosamente todas as faixas como indisponíveis.

### Outras observações

- **A página é pública, mas o fluxo Client Credentials exige um `client_secret`.**
  Publicá-lo no bundle exporia a credencial, então a troca acontece em uma função
  serverless (`functions/api/spotify-token.ts`) que devolve apenas o access token. O
  código em `src/` continua sendo Angular puro e nunca vê o segredo.
- **Não existe endpoint de busca em lote por ISRC**, e `GET /v1/tracks?ids=` responde
  403 nesta camada de aplicação. A busca é feita uma por código, com concorrência
  limitada.
- **A API exige que o dono da aplicação tenha Spotify Premium ativo.** Sem isso todos
  os endpoints respondem 403, independentemente das credenciais.

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

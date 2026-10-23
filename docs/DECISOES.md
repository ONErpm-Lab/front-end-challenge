# Registro de decisões

Decisões técnicas do projeto: o contexto, a escolha feita, as alternativas descartadas e como verificar. A estrutura atual do código está descrita em [ARQUITETURA.md](ARQUITETURA.md).

| # | Tema |
|---|---|
| 1 | [Limitações da Spotify Web API](#1-limitações-da-spotify-web-api) |
| 2 | [Stack e estrutura do repositório](#2-stack-e-estrutura-do-repositório) |
| 3 | [API intermediária (BFF)](#3-api-intermediária-bff) |
| 4 | [Requisitos de tela e estados](#4-requisitos-de-tela-e-estados) |
| 5 | [Arquitetura do frontend](#5-arquitetura-do-frontend) |
| 6 | [Value Object Isrc](#6-value-object-isrc) |
| 7 | [TypeScript estrito e convenções](#7-typescript-estrito-e-convenções) |
| 8 | [Fronteiras de arquitetura verificadas por lint](#8-fronteiras-de-arquitetura-verificadas-por-lint) |
| 9 | [Testes e cobertura](#9-testes-e-cobertura) |
| 10 | [Modo de demonstração](#10-modo-de-demonstração) |
| 11 | [Integração contínua](#11-integração-contínua) |
| 12 | [Deploy na Vercel](#12-deploy-na-vercel) |
| 13 | [Uso de IA](#13-uso-de-ia) |

---

## 1. Limitações da Spotify Web API

Antes da implementação, a documentação atual da Spotify Web API foi conferida. Cinco pontos afetam o enunciado:

| Limitação | Fonte | Decisão |
|---|---|---|
| `available_markets` removido em *Development Mode* (fev/2026) | [Guia de migração](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide) | Disponibilidade no BR via busca com `market=BR` + `is_playable`; se a faixa não aparecer no BR, busca sem mercado para distinguir "indisponível" de "não encontrada" |
| `preview_url` nulo para apps criados após nov/2024 | Comunicado do Spotify | Com URL, player próprio; sem ela, o player incorporado do Spotify (seção 4) |
| Endpoint em lote `GET /tracks` removido em *Development Mode* | Guia de migração | Uma busca por ISRC, em paralelo |
| *Development Mode* exige Premium na conta dona do app | Guia de migração | Modo de demonstração quando não há credenciais (seção 10) |
| O fluxo *Client Credentials* usa o Client Secret | Documentação de autorização | O segredo fica num servidor intermediário, nunca no navegador (seção 3) |

---

## 2. Stack e estrutura do repositório

- **Dois projetos lado a lado** (`api/` e `frontend/`), sem ferramenta de monorepo: o escopo não justifica Nx nem workspaces.
- **Angular 21**: a versão LTS vigente (suporte até 2027-06, [cronograma oficial](https://angular.dev/reference/releases)). A 22 está em suporte ativo, não em LTS.
- **Standalone, signals e zoneless**, os padrões atuais do framework.
- **SCSS próprio, sem biblioteca de componentes:** visual autoral e bundle de ~59 kB transferidos.
- **Fontes empacotadas** (`@fontsource`): o build não depende de rede e a página não carrega fontes de terceiros.
- **`.npmrc` com `legacy-peer-deps=true`:** contorna um defeito do npm 10.9 na resolução de dependências do Vitest 4.
- **Git:** commits atômicos em [Conventional Commits](https://www.conventionalcommits.org/).

---

## 3. API intermediária (BFF)

**Por quê.** O token do Spotify exige o Client Secret, que não pode ir para uma página pública.

**Responsabilidades**, cada uma em seu módulo:

| Módulo | Responsabilidade |
|---|---|
| `spotify/token.service.js` | Obtém o token, reaproveita até expirar (margem de 60 s) e compartilha a mesma requisição entre pedidos simultâneos |
| `spotify/spotify.client.js` | Busca por ISRC, com timeout de 5 s |
| `tracks/brazil-availability.js` | Regra de disponibilidade no BR, como função pura |
| `tracks/track.service.js` | Orquestra: busca no BR e, se preciso, sem mercado |
| `tracks/track.mapper.js` | Devolve só os campos que a tela usa |
| `tracks/track.routes.js` | HTTP: `200`, `400` (ISRC inválido), `404` (não encontrado), `503` (Spotify indisponível) |
| `compose.js` | Composição: escolhe entre o cliente real e o de demonstração |

- **Injeção por fábrica** (`createTokenService(config, fetchFn)`): os testes trocam só o `fetch`, sem bibliotecas de mock.
- **Em produção, um processo só:** a API também serve o build do Angular (mesma origem, sem CORS).

**Escopo do BFF: segurança, não agregação.** O BFF nasceu para proteger o segredo do Spotify. Por isso expõe uma faixa por requisição (`GET /api/tracks/:isrc`), e o frontend faz as 10 consultas em paralelo e monta o resultado. É uma escolha de demonstração, adequada a uma lista fixa e pequena:

| Aspecto | Hoje | Com uma lista dinâmica ou grande |
|---|---|---|
| Origem dos ISRCs | Constante validada no frontend (`CONTRACT_ISRCS`) | Catálogo ou contrato no servidor |
| Consultas | 10 requisições do navegador, em paralelo | 1 requisição a um endpoint em lote no BFF, com limite de tamanho, deduplicação e controle de concorrência |
| Falha de integração | Falha isolada: exibe as demais faixas, com aviso. Todas falhando: alerta de integração indisponível | Mesma regra, decidida no servidor |

**Falha parcial em vez de tudo ou nada.** Cada consulta termina em encontrada, não encontrada (404) ou falha (outro erro). Uma falha isolada, típica de instabilidade ou limite de requisições, não esconde as faixas que chegaram: a página as exibe e avisa quais ISRCs ficaram sem resposta. O alerta de integração indisponível fica para quando todas as consultas falham. "Tentar de novo" repete a lista inteira, o que mantém o store simples e evita combinar resultados de cargas diferentes.

A lista vazia já é tratada: `forkJoin([])` completa sem emitir, então o serviço responde de imediato sem requisições e a página mostra um estado vazio.

---

## 4. Requisitos de tela e estados

| Requisito | Implementação |
|---|---|
| Ordem alfabética por título | `Intl.Collator('pt-BR')`: ignora acentos e caixa |
| Data de lançamento | Respeita a precisão informada pelo Spotify (ano, mês ou dia) |
| Duração `mm:ss` | `DurationPipe` em `shared/pipes` |
| Prévia de áudio | Com `preview_url`, um único `<audio>` para a página. Sem ela, o botão abre o player incorporado do Spotify da faixa (`open.spotify.com/embed/track/{id}`). Só um player fica ativo: abrir um fecha o outro |
| Disponibilidade no BR | Selo por faixa |
| Alerta se a integração cair | Caixa com "Tentar de novo" |

**Player incorporado do Spotify para faixas sem prévia.** O Spotify não envia `preview_url` para apps novos (na captura, nenhuma das 10 faixas tem). O player incorporado usa só o ID da faixa, então o requisito de ouvir a prévia vale para todas. Custos aceitos:

- O iframe é de terceiros (scripts e cookies do Spotify). Por isso só é carregado quando a pessoa pede, um por vez, e nunca na carga inicial da página.
- A aparência do iframe não é controlável, e os testes só verificam o endereço, não o conteúdo.
- A URL só é montada a partir de um ID com o formato do Spotify (22 caracteres base62), validado por uma função pura antes de ser marcada como confiável no iframe.

**O player ocupa o próprio card.** Uma primeira versão abria o player numa faixa abaixo da capa; no card estreito, o layout compacto do Spotify cortava o botão de play. Agora a capa da faixa, desfocada, cobre o card num círculo que nasce no botão tocado (`clip-path`), e o player entra por cima quando o círculo termina: o de 352 px (com capa) no card vertical e o compacto no card horizontal do celular. Alternativas descartadas:

| Alternativa | Por que não |
|---|---|
| Barra fixa no rodapé | Tapa conteúdo no celular e afasta o player da faixa |
| Card que gira em 3D | Iframes dentro de transformações 3D têm falhas conhecidas (cliques, cintilação) |
| Card que cresce para duas colunas | Desloca a grade |

O iframe nunca fica dentro de uma animação: só é montado depois da revelação e é removido antes do fechamento. A grade não se move, o foco vai para "fechar" ao abrir e volta ao botão da faixa ao fechar, e Esc fecha.

**Peso visual proporcional à importância de cada mensagem.**

| Mensagem | Tratamento |
|---|---|
| Integração indisponível (todas as consultas falharam) | Caixa de erro (`role="alert"`), com ação de repetir |
| Integração instável (parte das consultas falhou) | Caixa de aviso (`role="status"`) acima da grade, com ação de repetir a lista inteira; cada ISRC sem resposta vira cartão "Não foi possível consultar" |
| Modo de demonstração | Chip ao lado do título; a explicação abre sob demanda |
| Prévias indisponíveis | Chip no resumo explicando a limitação; o botão de cada faixa oferece o player do Spotify |
| ISRC não encontrado | Cartão na própria grade, com o ISRC na forma de leitura; o resumo mostra "9 de 10" |

**Movimento**, sempre desligado com `prefers-reduced-motion`:

| Movimento | Técnica |
|---|---|
| Entrada dos cartões em cascata | `animation-delay` por índice |
| Reordenação A–Z ↔ Z–A | View Transitions API: os cartões deslizam até a nova posição |
| Progresso da prévia | `transform: scaleX` |
| Abertura do player do Spotify | Círculo (`clip-path`) a partir do botão tocado; com movimento reduzido, fade curto |

**Acessibilidade:** regras de acessibilidade de template no lint e auditoria AXE (WCAG 2.1 AA) nos testes E2E, com zero violações em desktop e mobile.

---

## 5. Arquitetura do frontend

**Estilo.** *Vertical slices* (uma pasta por funcionalidade) com *ports & adapters* em cada uma.

```
TracksPageComponent ──inject(TRACKS_STORE)──▶ TracksSignalStore ──inject(TRACKS_REPOSITORY)──▶ TrackApiService
     providers: [provideTracksFeature()]   ← único ponto que conhece as implementações
```

- **Estado com NgRx Signal Store:** `withState`, `withComputed` e `withMethods`. O carregamento usa `rxMethod` com `switchMap`, então um novo carregamento cancela o anterior. O estado só muda por `patchState`, dentro das ações.
- **Inversão de dependência por `InjectionToken`:**

| Porta | Quem injeta | Implementação |
|---|---|---|
| `TRACKS_STORE` (`TracksStorePort`) | página | `TracksSignalStore` |
| `TRACKS_REPOSITORY` (`TracksRepository`) | store | `TrackApiService` |

- **Por que `InjectionToken` e não uma classe abstrata:** o contrato fica como tipo puro, e a implementação o cumpre por estrutura, sem herança. O `useFactory` tipado em `provideTracksFeature()` faz o compilador conferir a implementação.
- **Estado com o ciclo de vida da tela:** o store é provido na página, não em `root`.
- **Aliases de import** (`@shared`, `@features`, `@testing`) para cruzar fronteiras; caminhos relativos dentro da mesma feature.

A relação com cada princípio SOLID, com a evidência de cada um, está em [ARQUITETURA.md, seção 3](ARQUITETURA.md#3-princípios-solid-e-camadas).

---

## 6. Value Object Isrc

O ISRC é o identificador central do domínio. `models/isrc.value-object.ts`:

- Construtor privado: só nasce por `Isrc.create()`, que normaliza (caixa, hífens, espaços) e valida o formato ISO 3901.
- Imutável, com igualdade por valor.
- Expõe país, registrante, ano e designação, além de `format()` na forma de leitura (`BR-1SP-12-00071`).

Os ISRCs do contrato são validados ao carregar o módulo: um código inválido falha de imediato, não numa requisição. O tipo `Track` mantém `isrc: string`, porque é o contrato JSON do BFF.

---

## 7. TypeScript estrito e convenções

| Opção | Efeito |
|---|---|
| `noUncheckedIndexedAccess` | `array[0]` passa a ser `T \| undefined` |
| `exactOptionalPropertyTypes` | "Propriedade ausente" e "`undefined` explícito" deixam de ser equivalentes |
| `verbatimModuleSyntax` | Imports de tipo viram `import type` e saem do bundle |

- **Modelos `readonly`:** o compilador impede alterar o estado fora das ações do store.
- **Nomes com sufixo de tipo** (`*.component.ts`, `*.service.ts`), configurados nos *schematics* do `angular.json`, para que `ng generate` siga o mesmo padrão.

---

## 8. Fronteiras de arquitetura verificadas por lint

Cada camada tem uma lista de imports proibidos (`no-restricted-imports`). Uma violação quebra `npm run lint`.

| Camada | Não pode importar |
|---|---|
| `pages/`, `components/` | `store/` (implementação), `*-api.service`, `HttpClient` |
| `store/` | `components/`, `pages/`, `*-api.service`, `HttpClient` |
| `ports/` | qualquer implementação |
| `services/` | `store/`, `components/`, `pages/` |
| `models/`, `utils/` | `@angular/*`, `rxjs` |
| `shared/` | qualquer feature |

`npm run lint:boundaries` simula um import proibido para cada fronteira e falha se algum passar (10 casos).

**ESLint e não Sheriff, por enquanto.** O Sheriff trabalha sobre o grafo de imports resolvidos, com *tags* por módulo, e verifica encapsulamento. Com uma única feature, as regras do ESLint cobrem todas as fronteiras existentes com menos configuração. A limitação aceita é que a regra "componente não acessa serviço HTTP" depende do sufixo `-api.service`. A migração para o Sheriff fica indicada para quando surgir uma segunda feature.

---

## 9. Testes e cobertura

| Nível | Ferramenta | O que cobre |
|---|---|---|
| Unitário | Vitest | Funções puras, Value Object, store (pela porta), pipe, componentes compartilhados |
| Integração | Vitest + `HttpTestingController` / supertest | Página com HTTP simulado; API com só o `fetch` simulado |
| Ponta a ponta | Playwright, desktop e mobile | Os requisitos do enunciado no navegador, contra a API em modo de demonstração, com auditoria AXE |

- **Cobertura mínima de 90% por arquivo** na lógica pura e no store, no frontend e na API. As telas são cobertas pelos testes de integração e E2E.
- **Medição de acessibilidade com a tela estável:** o teste espera o fim das animações de entrada antes de medir o contraste, porque uma medição durante o *fade-in* gera falsos positivos.
- **Estabilidade do E2E:** 18 cenários (9 × 2 dispositivos), estáveis em execuções repetidas com servidores novos.

---

## 10. Modo de demonstração

Sem credenciais do Spotify, a API usa um cliente simulado **com o mesmo contrato do cliente real** (`findTrackByIsrc`). O serviço, a regra do BR, o mapeamento e o frontend rodam iguais nos dois modos.

- Troca por variável de ambiente: `SPOTIFY_MODE=mock|live`. Sem credenciais, o padrão é `mock`.
- **Nunca silencioso:** cabeçalho `X-Data-Source`, campo em `/api/health`, aviso no log e chip na tela.
- **Metadados reais, estados simulados:** título, artistas, álbum, data, duração e ID de cada faixa foram capturados da Spotify Web API. Na captura, as 10 faixas existem, estão disponíveis no BR e vêm sem prévia. Para cobrir todos os estados da tela, alguns são simulados e marcados no catálogo (`simulated`): prévia de áudio, `is_playable: false`, ausência no mercado BR, ISRC não encontrado e datas com precisão de ano ou mês.
- Capas (SVG) e prévias de áudio (WAV) geradas pela própria API, sem arquivos binários no repositório.
- `SPOTIFY_MOCK_SCENARIO=down` simula o Spotify fora do ar; `SPOTIFY_MOCK_SCENARIO=partial` faz um único ISRC falhar.

---

## 11. Integração contínua

`.github/workflows/ci.yml`, em cada push e pull request:

| Job | Passos |
|---|---|
| Frontend | Fronteiras → lint → testes com cobertura → build |
| API | Testes com cobertura |
| E2E | Playwright em desktop e mobile, só depois dos dois anteriores |

- As fronteiras rodam num passo separado do lint, para distinguir "violou a arquitetura" de "erro de estilo".
- `npm ci` com lockfile, cache por projeto e permissões somente de leitura.
- Relatórios de cobertura e, em caso de falha, o relatório do Playwright ficam como artefatos.
- Não usa segredos: os testes simulam só a borda com o Spotify.

---

## 12. Deploy na Vercel

Projeto com *Root Directory* `api` e preset Express. O `api/vercel.json` compila o Angular e copia o resultado para `api/public`, servido pela CDN. Cada push na branch principal gera um novo deploy.

A plataforma executa a API como função, não como processo com `listen`. Duas adaptações foram necessárias:

| Sintoma | Causa | Correção |
|---|---|---|
| `FUNCTION_INVOCATION_FAILED` | A Vercel escolhe a entrada pelo nome (`app` → `index` → `server`) | A fábrica `createApp` foi para `create-app.js` |
| "No entrypoint found which imports express" | A entrada precisa importar o `express` e exportar a aplicação | Entrada `src/index.js` para a Vercel; `src/server.js` para uso local; composição comum em `compose.js` |

---

## 13. Uso de IA

O projeto define como agentes de IA devem trabalhar nele, e as regras críticas são verificadas por ferramentas, não pelo texto das instruções. Detalhes em [GOVERNANCA-IA.md](GOVERNANCA-IA.md).

- `AGENTS.md`: regras do projeto. `frontend/AGENTS.md`: boas práticas oficiais do Angular 21, geradas pelo CLI.
- Servidor MCP do Angular CLI em modo somente leitura, fixado na versão 21.
- **Guia validada na prática:** um agente sem contexto criou uma feature completa usando só `AGENTS.md` e a guia de arquitetura. Na primeira rodada, o código passou no lint, mas não seguiu os padrões do projeto. As lacunas encontradas foram incorporadas à guia, e na segunda rodada o código seguiu os padrões.

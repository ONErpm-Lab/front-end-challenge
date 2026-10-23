# Faixas por ISRC · Spotify

Página que consulta **10 ISRCs** na Spotify Web API e mostra, **em ordem alfabética por título**:
capa do álbum, data de lançamento, título, artistas, duração (mm:ss), prévia de áudio, link para o Spotify e se a faixa **está disponível no Brasil**.
Se a integração cair, a página avisa e oferece **"Tentar de novo"**; se só parte das consultas falhar, mostra as faixas que chegaram e avisa quais ficaram de fora.

**Demo pública (dados reais do Spotify):** https://isrc-spotify-challenge.vercel.app

> Localmente, sem credenciais, o projeto roda em **modo demonstração**: metadados reais dos ISRCs, com alguns estados simulados para mostrar todos os casos da tela, e aviso visível. Testar com dados reais exige credenciais de um app do Spotify cuja conta dona seja **Premium**: veja [Dados reais](#dados-reais-spotify).

---

## Rodar o projeto

**Pré-requisito:** [Node.js](https://nodejs.org) **22.9 ou superior** (`node -v`). Não precisa de credenciais nem de `.env`.

### Opção 1 — Ver a aplicação (um terminal)

```bash
cd frontend
npm ci
npm run build

cd ../api
npm ci
npm start
```

Abra **http://localhost:3000**. A API serve a página e os dados no mesmo endereço.

### Opção 2 — Desenvolver (dois terminais, com recarga automática)

```bash
# terminal 1
cd api
npm ci
npm start
```

```bash
# terminal 2
cd frontend
npm ci
npm start
```

Abra **http://localhost:4200**. O Angular repassa `/api` para a porta 3000.

### Testes

| O que | Onde | Comando |
|---|---|---|
| Unitários + integração | `api/` e `frontend/` | `npm test` |
| Cobertura (mínimo de 90% na lógica) | `api/` e `frontend/` | `npm run test:coverage` |
| Regras de arquitetura | `frontend/` | `npm run lint:boundaries` e `npm run lint` |
| Ponta a ponta (navegador) | `frontend/` | `npx playwright install chromium` (uma vez), depois `npm run e2e` |

O `npm run e2e` sobe a API e o Angular sozinho nas portas 3000 e 4200: **feche antes os servidores das opções 1 e 2** (Ctrl+C).

O mesmo roda no CI a cada push ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

---

## Arquitetura em resumo

- **`frontend/`:** Angular 21 (LTS), com uma pasta por funcionalidade e estado em NgRx Signal Store.
- **`api/`:** um servidor intermediário (BFF) em Express. Guarda o segredo do Spotify, que nunca vai para o navegador.
- **Organização:** vertical slices com ports & adapters. O ESLint barra imports entre camadas que não devem se conhecer, e os princípios SOLID são verificados por lint e testes ([princípio a princípio](docs/ARQUITETURA.md#3-princípios-solid-e-camadas)).

## Documentação de apoio

| Quero… | Leia |
|---|---|
| **Entender a arquitetura** e saber onde colocar código novo | [docs/ARQUITETURA.md](docs/ARQUITETURA.md) |
| Saber **por que** cada decisão foi tomada | [docs/DECISOES.md](docs/DECISOES.md) |
| Ver como a **IA** é usada e controlada no projeto | [docs/GOVERNANCA-IA.md](docs/GOVERNANCA-IA.md) |
| Dar instruções a um **agente de IA** | [AGENTS.md](AGENTS.md) |
| Ver o **resumo da entrega** e os próximos passos | [PULL_REQUEST.md](PULL_REQUEST.md) |
| Ler o **enunciado original** do desafio | [docs/DESAFIO.md](docs/DESAFIO.md) |

## Dados reais (Spotify)

Desde fevereiro de 2026, apps novas do Spotify em *Development Mode* exigem **Premium** na conta dona da app ([guia oficial](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)). Sem credenciais, o padrão é o modo demonstração. Para usar dados reais, crie `api/.env`:

```
SPOTIFY_MODE=live
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

…e reinicie a API. O frontend não muda. Outras opções (como simular o Spotify fora do ar) estão em [`api/.env.example`](api/.env.example).

**Limites atuais da API do Spotify** (detalhes em [DECISOES.md](docs/DECISOES.md#1-limitações-da-spotify-web-api)):
- a lista de países disponíveis foi removida, então a disponibilidade no BR vem de `market=BR` + `is_playable`;
- o link da prévia de áudio (`preview_url`) vem vazio para apps novas; nesse caso, o botão da faixa abre o player incorporado do Spotify;
- não há busca em lote, então é uma busca por ISRC, em paralelo.

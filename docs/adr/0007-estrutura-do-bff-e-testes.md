# 0007 — Estrutura do BFF e estratégia de testes do servidor

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

O BFF (ADR 0003) concentra regras importantes: autenticação, tratamento de limites do Spotify, regra de disponibilidade
no Brasil e escolha entre faixas duplicadas (ADR 0005). Essas regras precisam ser testáveis sem rede e fáceis de trocar.

## Decisão

Camadas pequenas, cada uma com uma responsabilidade e dependências injetadas:

| Peça                                     | Papel                                                             | Padrão                    |
| ---------------------------------------- | ----------------------------------------------------------------- | ------------------------- |
| `SpotifyTokenProvider`                   | token Client Credentials, cache e _single-flight_                 | Proxy de cache            |
| `SpotifyClient` (`TrackSearch`)          | HTTP do `/search`, paginação, 401 → renova token, cooldown de 429 | Port & Adapter            |
| `LimitedTrackSearch`                     | todas as buscas passam por um limitador compartilhado             | Decorator                 |
| `toTrack` (`track-mapper`)               | converte o payload do Spotify no contrato `Track`                 | Anti-corruption layer     |
| `SpotifyTrackFinder` (`TrackFinder`)     | regra de BR + escolha da faixa original                           | Strategy/regra de domínio |
| `CachingTrackFinder`                     | cache em memória com TTL, sem persistência, sem cachear falhas    | Decorator                 |
| `TracksService`                          | vários ISRCs com falha isolada por item                           | Application service       |
| `createTracksRouter` / `createApiRouter` | HTTP (validação, códigos, `Cache-Control`) e _composition root_   | Facade                    |

- O contrato entre BFF e Angular vive em `src/contract/` (apenas tipos + validação de ISRC), evitando divergência.
- Rede, relógio e _sleep_ são injetáveis (`fetchFn`, `now`, `sleep`): testes rodam sem rede e sem esperar.
- Sem credenciais configuradas, o servidor sobe normalmente e `/api/tracks` responde **503 `integration_unavailable`**;
  o front exibe o alerta exigido pelo enunciado.
- Se **todas** as consultas falham, a resposta é 503; se só algumas, 200 com `status: "error"` nos itens afetados.

## Testes

- **Unitários** por peça (Vitest, ambiente `node` via `// @vitest-environment node`), incluindo tabelas de casos de borda.
- **Integração** (`tracks-api.integration.spec.ts`): Express real + `fetch` falso do Spotify, usando as **respostas reais
  gravadas** dos 10 ISRCs (`src/bff/testing/fixtures/`). Cobre sucesso, duplicatas, não encontrado, indisponível no BR,
  falha parcial, Spotify fora do ar, credenciais ausentes, cache e validação.

## Alternativas consideradas

- **Chamar o Spotify direto de um único serviço grande** — mistura HTTP, regra e cache; difícil de testar.
- **Mocks de módulo (`vi.mock`)** — acoplam o teste à estrutura de arquivos; preferimos injeção por construtor.
- **`supertest`/`msw`** — dependências a mais; `fetch` nativo + `app.listen(0)` bastam.

## Consequências

- Positivas: regras de negócio isoladas e rápidas de testar; fácil trocar Spotify por outra fonte atrás de `TrackSearch`.
- Negativas: mais arquivos do que um único serviço; o cache em memória é por instância (aceitável: só protege o rate limit).

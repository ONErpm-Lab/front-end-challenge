# 0005 — Regras de consulta ao Spotify em 2026

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

A Spotify Web API mudou em fev/2026 ([migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)):
`available_markets` foi removido, `/search` aceita `limit` até 10 e os endpoints batch deixaram de existir.
Fizemos um **spike** (Client Credentials, os 10 ISRCs do enunciado, 2026-10-23) para validar o comportamento real.

Resultados do spike:

- `GET /search?q=isrc:{ISRC}&type=track&market=BR&limit=10` encontrou **todos** os 10 ISRCs, com `external_ids.isrc`.
- Com `market=BR` a resposta traz `is_playable`; todos vieram `true`, sem `restrictions`.
- O campo **`preview_url` não existe** na resposta (nem como `null`).
- 4 ISRCs retornaram **duas faixas** (álbum + single, ou dois singles).
- `album.images` vem em 640/300/64 px; `release_date_precision` foi `day` em todos.

## Decisão

1. **Disponibilidade no Brasil** = existe resultado com `market=BR` e `is_playable === true`. Se só houver resultado
   sem `market`, a faixa é marcada como **indisponível no BR**; sem resultado nenhum, `not_found`.
2. **Várias faixas por ISRC:** entre as tocáveis, escolher a de **menor `release_date`** (lançamento original);
   empate resolvido pela ordem retornada pelo Spotify. Determinístico e testável.
3. **Player de prévia:** usar o **embed oficial** do Spotify (`open.spotify.com/embed/track/{id}`), já que
   `preview_url` não é fornecido. Sem fontes de áudio de terceiros.
4. **Thumb:** imagem de ~300 px. **Data de lançamento** formatada conforme a precisão (ano, mês ou dia) e o idioma.
5. **Paginação:** cada busca traz no máximo 10 faixas; o cliente segue `next` (até 5 páginas, sempre com `limit=10`)
   antes de escolher a faixa, para não perder o lançamento original ou a versão tocável no BR que esteja numa página posterior.
6. **Validação na borda:** cada item é checado antes do mapeamento (campos usados, `release_date_precision` conhecido);
   payload inválido vira `search_response_malformed`, em vez de `internal_error` ou de uma faixa incompleta em cache.
7. **Resiliência:**
   - **Concorrência global:** um único limitador (5 buscas simultâneas) envolve todas as chamadas ao Spotify, somando
     todos os visitantes — não só os ISRCs de uma requisição.
   - **429:** o `Retry-After` vira um _cooldown_ compartilhado pelo cliente. Cooldown curto (≤ 5 s) é aguardado antes da
     próxima chamada; longo falha localmente com `rate_limited`, sem tocar no Spotify. Sem `Retry-After`, assume 1 s.
   - **401:** um retry com novo token.
   - **Cache HTTP:** respostas com qualquer falha saem com `Cache-Control: no-store`, para o navegador não repetir um erro transitório.
8. **Falha geral:** se todas as consultas de uma requisição falham, a API responde `503 integration_unavailable`
   (código estável) e o front exibe o alerta; falhas parciais seguem como itens `error` dentro de um `200`.

## Alternativas consideradas

- **Deezer por ISRC para a prévia** — dá `<audio>`, mas introduz fonte de dados fora do enunciado.
- **`GET /tracks/{id}?market=BR`** por faixa — uma chamada extra por ISRC sem ganho, pois o search já retorna `is_playable`.
- **Escolher a primeira faixa retornada** — não determinístico quando há duplicatas.

## Consequências

- Positivas: regras verificadas com dados reais; os JSONs do spike viram fixtures dos testes de integração.
- Negativas: o embed é um iframe de terceiro (peso e requisitos de CSP); a prévia depende do Spotify.
- Risco: Spotify pode alterar os campos de novo — o mapper (anti-corruption layer) concentra esse impacto.

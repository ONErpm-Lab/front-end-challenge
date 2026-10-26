# 0024 — Cache longo com resposta antiga em caso de falha, e saúde do Spotify

- **Status:** Aceito
- **Data:** 2026-10-24

## Contexto

Uma revisão encontrou a demo no ar respondendo `503` em `/api/tracks`, com `/api/health` em `200`. Diagnóstico (24/10/2026): as
credenciais estavam corretas (o token era emitido), mas a busca do Spotify respondia **`429` com `Retry-After` de ~57 minutos**.
O BFF tratava isso como devia (falha rápida, sem segurar a requisição), porém:

- o cache de resultados valia só 5 minutos e **nunca** servia uma resposta vencida: durante um bloqueio longo do Spotify a página
  ficava indisponível mesmo já tendo mostrado as mesmas faixas minutos antes;
- o log dizia `search_failed (HTTP 429)` sem dizer por quanto tempo, e `/api/health` não distinguia "sem credenciais" de
  "Spotify limitando" (o segundo aparece só em `/api/tracks`).

Os dados de uma faixa (título, artistas, duração, capa) praticamente não mudam; o que muda é a cota do Spotify, que um app em
modo de desenvolvimento divide entre visitas, testes e2e e desenvolvimento local.

## Decisão

- **Cache fresco por 6 horas** (`TRACK_CACHE_TTL_MS`) e **resposta vencida servida por até 24 horas a mais** quando perguntar de
  novo ao Spotify falha (`staleIfErrorMs` em `CachingTrackFinder`, o padrão _stale-if-error_). A resposta antiga é mantida para a
  próxima tentativa, que volta a perguntar ao Spotify; falhas continuam sem ser guardadas.
- **`SpotifyUnavailableError` carrega `retryAfterMs`** (do `Retry-After` ou do _cooldown_ em curso) e o inclui na mensagem, que já
  vai para o log de cada ISRC: o motivo do 503 fica legível em `vercel logs`.
- **`GET /api/health` informa `spotify: "configured" | "missing_credentials"`** (nunca os valores). Continua sem chamar o
  Spotify e sempre `200`, para o `HEALTHCHECK` e a plataforma não reiniciarem um servidor que funciona; um monitor externo
  consulta também `/api/tracks`.

## Alternativas consideradas

- **Manter 5 minutos** — é o que causou a página fora do ar durante o bloqueio.
- **Cache compartilhado (Redis/KV)** — resolveria o "por instância", mas adiciona infraestrutura e estado, contra "sem
  armazenamento"; a camada de CDN com `s-maxage` ([ADR 0003](0003-bff-no-angular-ssr.md), evolução) dá parte do ganho sem isso.
- **Fazer o `/api/health` consultar o Spotify** — faria a plataforma reiniciar o servidor por causa de um problema externo.

## Consequências

- Positivas: um bloqueio do Spotify deixa de derrubar a página para quem já consultou; o motivo do 503 aparece no log; o
  `health` separa configuração faltando de indisponibilidade.
- Negativas / dívidas assumidas: o cache continua **por instância** (uma instância fria durante o bloqueio ainda responde `503`);
  uma faixa nova ou alterada no Spotify só aparece após o TTL (6 h); `not_found` também fica 6 h guardado.

**Atualização (24/10/2026):** o cache em memória passou a ser LRU e as respostas completas ganharam `s-maxage` para a CDN dividi-las
entre as instâncias ([ADR 0028](0028-csp-com-nonce-e-cache-compartilhado.md)).

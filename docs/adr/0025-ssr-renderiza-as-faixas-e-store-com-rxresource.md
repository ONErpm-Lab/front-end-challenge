# 0025 — O servidor renderiza as faixas; o store usa `rxResource`

- **Status:** Aceito
- **Data:** 2026-10-24

## Contexto

Uma revisão apontou que o SSR só entregava o esqueleto: `TracksPage` buscava as faixas em `afterNextRender`, ou seja, só no
navegador, e o ganho do SSR ficava restrito ao idioma, ao custo de função na Vercel, `NG_ALLOWED_HOSTS` e `Vary`. A mesma
revisão notou que o `TracksStore` guardava uma `Subscription` à mão em vez de usar um _resource_ do Angular 21.

## Decisão

- **O `TracksStore` usa `rxResource`** sobre `TracksApi.lookup` (que mantém o `timeout` e o `TracksUnavailableError`). A
  busca começa sozinha, sem `afterNextRender`, e "tentar novamente" é `reload()`; o _resource_ cancela a requisição anterior,
  então somem a `Subscription` e o `DestroyRef`. O estado público (`TracksLoadStatus`) é derivado do estado do _resource_.
- **No servidor a busca também roda**: o _resource_ é uma tarefa pendente, então a renderização espera, e o HTML sai com as
  faixas na ordem. A chamada vai ao próprio `/api/tracks` (o Angular resolve a URL relativa contra o pedido; o host já é
  validado por `NG_ALLOWED_HOSTS`) e o cache do BFF a torna barata. No servidor o `timeout` é de 6 s (`TRACKS_SERVER_REQUEST_TIMEOUT_MS`).
- **O navegador parte do que o servidor viu**: o resultado vai por `TransferState` (`TRACKS_TRANSFER_KEY`) e o store começa
  `READY` com ele, **sem pedir de novo** e hidratando exatamente a lista desenhada. Por isso o cache de transferência do
  `HttpClient` foi desligado (`withNoHttpTransferCache`): levaria a mesma resposta duas vezes no HTML. Se o visitante tentar de novo, o
  resultado novo substitui o do servidor.
- **Falha no servidor não vira alerta**: se o servidor não consegue (Spotify fora, `429`, tempo esgotado), ele desenha os
  _placeholders_ (estado `LOADING`) e não entrega semente; o navegador faz a busca e decide entre a lista e o alerta. Assim os
  dois começam da mesma árvore (outra estrutura não hidrataria) e o servidor nunca cacheia uma indisponibilidade em HTML.

## Alternativas consideradas

- **Remover o SSR** — simplificaria (some `NG_ALLOWED_HOSTS`, o `Vary` e a função), mas jogaria fora o HTML já traduzido e a
  primeira pintura com conteúdo; escolheu-se dar ao SSR um ganho real.
- **Só o cache de transferência do `HttpClient`** — o _resource_ começa depois da primeira passada, então o navegador
  desenharia os _placeholders_ sobre uma lista do servidor (hidratação divergente); a semente evita isso.
- **O servidor chamar o BFF em processo** (sem HTTP, via `REQUEST_CONTEXT`) — evita o salto de rede, mas acopla o front ao BFF;
  fica como melhoria se o salto pesar.
- **`httpResource`** — não permite o `timeout` nem o erro tipado de `TracksApi`; `rxResource` os preserva.

## Consequências

- Positivas: HTML com as faixas na primeira resposta (verificado pelo e2e `ssr-data`, com o Spotify gravado), sem segunda
  chamada no navegador; store menor e sem assinatura manual.
- Negativas / dívidas assumidas: a primeira resposta espera o BFF (até 6 s) e, atrás dela, o Spotify; `rxResource` ainda é
  experimental no Angular 21; `reload()` com uma busca em andamento a mantém (não a reinicia); o servidor faz uma chamada HTTP a si mesmo.

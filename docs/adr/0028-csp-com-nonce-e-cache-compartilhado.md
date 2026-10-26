# 0028 — CSP com `script-src` e nonce por resposta; cache LRU e compartilhado

- **Status:** Aceito
- **Data:** 2026-10-24

## Contexto

Uma revisão apontou três limites que o projeto já reconhecia: a **CSP era parcial** (sem `script-src`, ADR 0019), o **cache era
FIFO** (a posição de uma entrada só mudava ao escrever, não ao ler) e o **cache e o limitador valem por instância** da função
(ADR 0021). A CSP parcial deixava o ponto mais útil de uma CSP, impedir _script_ injetado, em aberto.

## Decisão

### CSP da página, com um nonce por resposta

- Cada HTML renderizado ganha um **nonce** novo (`createNonce`, 16 bytes aleatórios) e o cabeçalho
  `Content-Security-Policy` com `script-src 'self' 'nonce-<nonce>' https://open.spotify.com https://embed-cdn.spotifycdn.com` além
  das diretivas de base (`base-uri`, `object-src 'none'`, `form-action`, `frame-ancestors`). Sem `'unsafe-inline'` nem
  `'unsafe-eval'`. Os dois _hosts_ do Spotify são os da iFrame API (o `open.spotify.com` entrega o _script_, que carrega o código de
  `embed-cdn.spotifycdn.com`).
- O servidor passa o nonce ao renderizador por `REQUEST_CONTEXT` (`angularApp.handle(req, { nonce })`) e `app.config.server.ts` o
  entrega como `CSP_NONCE`, que o Angular usa nos _scripts_ que escreve. Os _scripts_ em linha que vêm do `index.html` (o do
  tema, que roda antes da primeira pintura, e o do _event replay_ que o _build_ acrescenta) ganham o nonce no servidor, **só se o
  código for idêntico ao do _template_** (`trustedInlineScripts` lê o `index.server.html` do _build_ ao iniciar;
  `addNonceToTrustedScripts`): um _script_ que entre no HTML por outro caminho, por exemplo por conteúdo injetado, não recebe o nonce
  e o navegador o recusa. Sem o _template_ (`ng serve`) a página mantém só a política de base. O estado da página (`application/json`) é dado, não código: o navegador não o executa.
- **Estilos não são restritos**: os componentes e o PrimeNG escrevem os seus em linha; restringir `style-src` exigiria o nonce
  do PrimeNG em tudo e rende pouco perto do risco de _script_.
- **`optimization.styles.inlineCritical` desligado**: o Angular carregava o CSS com `media="print" onload="this.media='all'"`,
  um manipulador em linha que a CSP recusaria (`script-src-attr`); permitir por _hash_ (`'unsafe-hashes'`) deixaria a página sem
  estilo em navegadores antigos. Com ele desligado o CSS é um `<link>` comum (3,4 kB comprimidos); o bundle inicial não mudou.
- **Arquivos e API** continuam com a política de base (sem `script-src`): não são documentos. O `/index.csr.html` (o _shell_ de
  contingência que o renderizador lê do disco) não é entregue como documento: o servidor redireciona para `/`. O `vercel.json` **deixou de enviar a
  CSP** (a CDN não sabe o nonce e poderia sobrescrever a da função); os demais cabeçalhos seguem iguais.
- Prova: o e2e `csp` confere o cabeçalho, que cada _script_ em linha carrega o nonce da resposta, que cada resposta tem o seu, que
  a página (inclusive tocar uma faixa pela iFrame API) roda **sem nenhuma violação**, e que um _script_ injetado é recusado.

### Cache

- **LRU de verdade**: ler uma entrada do `CachingTrackFinder` a torna a mais nova; sai a que ninguém consulta.
- **Compartilhado entre instâncias pela CDN**: as respostas completas de `/api/tracks` levam
  `Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400`. A CDN da Vercel guarda
  uma hora, serve a antiga por um dia enquanto pede de novo e também quando o servidor erra; assim as instâncias da função
  dividem uma resposta, coisa que o cache em memória de cada uma não faz. **Respostas parciais ou de erro continuam
  `no-store`** (uma falha transitória nunca é repetida).
- O **limitador de concorrência** segue por instância: cada instância respeita o limite do Spotify, mas várias somam. Com o cache
  da CDN e o cache longo do BFF ([ADR 0024](0024-cache-longo-com-resposta-antiga-e-saude-do-spotify.md)) o número de buscas ao Spotify
  cai muito, mas não é um limite global.

## Alternativas consideradas

- **CSP por _hash_ dos _scripts_ em linha** — sem nonce por requisição, mas o _script_ do _event replay_ muda com o _build_ e
  exigiria um passo de _build_ para calcular os _hashes_.
- **Mover o _script_ do tema para um arquivo** — evitaria tocar no HTML, mas o servidor serve `public/` com cache de um ano e sem
  _hash_ no nome, e um _script_ síncrono extra no `<head>` atrasa a primeira pintura.
- **`autoCsp` do Angular CLI** (experimental) — gera _hashes_ no _build_; não cobre a resposta renderizada por requisição.
- **Cache compartilhado (Redis/KV)** — resolveria o limitador também, mas é infraestrutura e estado novos, contra "sem armazenamento".

## Consequências

- Positivas: um _script_ injetado (XSS) não executa; as instâncias dividem o cache da CDN; a ordem de saída do cache faz sentido.
- Negativas / dívidas assumidas: o HTML é lido por inteiro e reescrito antes de ser enviado (~160 kB); um _script_ em linha novo
  no `index.html` passa a valer (é do _template_), então ele merece revisão como código; o limitador continua por
  instância; `style-src` livre.

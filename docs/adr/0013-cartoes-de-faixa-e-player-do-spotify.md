# 0013 — Cartões de faixa e player de prévia do Spotify

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

Cada faixa precisa mostrar capa, data de lançamento, título, artistas, duração (`mm:ss`), um **player com prévia do
áudio**, o link da faixa no Spotify e se está **disponível no Brasil**. O Spotify não entrega `preview_url` (ADR 0005), então
o player é o **embed oficial**. Dez embeds carregando junto com a página seriam lentos e enviariam dados a terceiros antes
de o visitante querer ouvir qualquer coisa.

## Decisão

- **Um cartão por faixa** (`TrackCard`, `<article>` nomeado pelo seu `<h2>`): capa, selo de disponibilidade, título,
  artistas, lista de fatos (lançamento, duração, álbum, ISRC), player e link. As datas seguem o idioma da página
  (`formatReleaseDate`), a duração é `mm:ss` (`formatDuration`).
- **Selo de disponibilidade no corpo do cartão, nunca sobre a capa**: as cores translúcidas do `p-tag` ficavam
  ilegíveis sobre artes coloridas (visto no navegador). Verde/vermelho **nunca sozinhos**: ícone (check/cruz) e texto
  ("Disponível/Indisponível no Brasil") acompanham.
- **Player em duas etapas (fachada)**: primeiro um botão "Ouvir uma prévia"; o iframe do Spotify só é criado quando o
  visitante pede. Resultado: nenhuma requisição ao Spotify por faixa no carregamento, só o player escolhido. O iframe é
  compacto (152 px) (o `lazy` e o player dentro do cartão saíram nos ADRs 0015 e 0016: o player agora vive numa barra fixa), com `allow="encrypted-media"` e `title` traduzido ("Player do Spotify para …"). Usa o
  tema escuro do Spotify quando a página está escura.
- **Segurança do iframe**: o Angular exige uma URL "confiável" para `<iframe src>`. Ela só é gerada por `buildEmbedUrl`, que
  usa uma **origem fixa** (`open.spotify.com/embed/track`) e **valida o id** (22 caracteres base 62). Qualquer outra coisa
  (vazio, URL, `../`, `?`, `#`, marcação, quebra de linha) resulta em `null`, e então o cartão simplesmente não oferece player.
  Testes cobrem essas entradas hostis.
- **Link para o Spotify** abre em nova aba com `rel="noopener noreferrer"`, e um texto só para leitores de tela avisa
  "abre em uma nova aba" (traduzido).
- **Capa**: `<img>` com `width`/`height` (reserva o espaço, sem salto de layout), `loading="lazy"`, `decoding="async"` e
  `alt` descritivo traduzido. Sem capa, ou se a imagem falhar, aparece um espaço reservado rotulado. Não usamos
  `NgOptimizedImage`: as capas vêm do CDN do Spotify, em tamanhos que ele escolhe, e não há loader a configurar.
- **ISRC sem faixa** (`IsrcCard`): não encontrada ou com falha continuam na lista, em cartão tracejado próprio, com ícone
  diferente e a mensagem, para o produtor ver exatamente quais códigos não voltaram.
- **Grade responsiva** sem _media queries_: `repeat(auto-fill, minmax(min(100%, 19rem), 1fr))` — uma coluna no celular
  (343 px em 375 px de tela), duas em tablets, três em telas largas; lista semântica (`ul > li`) e os cartões da linha
  têm a mesma altura. Enquanto carrega, três esqueletos ocupam o mesmo espaço da grade.
- Texto novo nos seis idiomas (`tracks.listen`, `tracks.playerTitle`, `tracks.newTab`); a chave `tracks.artists`, sem
  uso, foi removida (os artistas aparecem sem rótulo).

## Alternativas consideradas

- **Iframes de todos os cartões já no carregamento** — 10 players do Spotify, centenas de KB e rastreamento de terceiros
  antes de qualquer interação.
- **`<audio>` com `preview_url`** — o campo não existe na API atual (ADR 0005).
- **Selo sobre a capa** — descartado após ver o contraste real no navegador.
- **Tabela em vez de cartões** — não comunica bem a capa e o player, e é pior no celular.

## Consequências

- Positivas: página leve; só carrega o que o visitante pede; entradas inválidas nunca viram URL de iframe; leitura clara
  em qualquer largura.
- Negativas: ouvir exige um clique extra; o embed do Spotify é de terceiros e não é estilizável; o iframe recarrega se o
  tema mudar enquanto está aberto.

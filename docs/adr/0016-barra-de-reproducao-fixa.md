# 0016 — Barra de reprodução fixa, com início automático

- **Status:** Aceito (atualiza os ADRs 0013 e 0015 no que diz respeito ao player)
- **Data:** 2026-10-23

## Contexto

O player do Spotify abria dentro do cartão: ao rolar a lista para ouvir outra faixa, era preciso voltar ao cartão certo para
pausar, o cartão crescia (e a linha toda com ele) e cada clique em "Ouvir uma prévia" exigia ainda um segundo clique no play do
embed. A revisão pediu algo como a barra do próprio Spotify: um player que acompanha o visitante e que já comece a tocar.

## Decisão

- **Uma barra fixa na base da janela** (`PlayerBar`) com o embed do Spotify de 80 px (capa, título, artista, play/pausa e
  progresso já vêm nele) e um botão de fechar. Ela é `position: sticky; bottom: 0` e fica **depois do rodapé** no fluxo da
  página: acompanha a rolagem, mas no fim da página fica abaixo do rodapé em vez de cobri-lo. Sem faixa escolhida, não existe
  (nenhum espaço, nenhum pedido ao Spotify).
- **Um player só.** O serviço `NowPlaying` guarda a faixa tocando; os cartões pedem, a barra toca. Escolher outra faixa troca
  a música no mesmo player (`loadUri`); fechar a barra para a música e devolve o foco ao botão do cartão.
- **O cartão não carrega mais nada do Spotify.** `TrackPlayer` virou só o botão: o da faixa que toca vira "Tocando agora"
  (`aria-current`, anel na cor de destaque e um **equalizador animado**, parado para quem pede menos movimento). Como o player
  saiu dos cartões, abrir uma prévia **não muda mais a altura de nenhuma linha** (testado).
- **Início automático pela iFrame API oficial do Spotify.** Uma URL de embed não aceita _autoplay_; só o controlador da
  `iframe-api/v1` permite `play()` por código. O `SpotifyIframeApi` injeta esse _script_ **só no primeiro "Ouvir"**, só do
  endereço do Spotify, e o endereço tocado (`spotify:track:<id>`) só é montado por `buildTrackUri` com o id validado, como no
  ADR 0013. Verificado no navegador real: após o clique a posição avança sem ação adicional.
- **Se o início por código não acontecer**, a barra usa o embed simples da faixa (`buildEmbedUrl`): o visitante aperta o
  play nele. A funcionalidade nunca fica indisponível. Isso vale para _script_ bloqueado ou sem rede e também para **qualquer
  etapa que trave**: um prazo de 15 s cobre o _script_, a criação do embed e o "pronto" dele; vencido o prazo, o que ficou
  pela metade é desfeito e qualquer resposta tardia é descartada (cada tentativa é numerada). Uma falha que chega depois de a
  barra ser fechada não conta: a próxima faixa tenta o _script_ de novo. O embed de contingência também mostra o indicador de
  carregamento (com o quadro invisível e fora do foco até o `load`) e o mostra de novo quando a faixa ou o tema o recarregam.
- **Limite conhecido**: no embed de contingência não há prazo para o `load` do quadro; se esse evento nunca vier (rede
  caída), o indicador fica até o visitante fechar a barra.
- **Carregamento sem "buraco"**: a barra reserva os 80 px e mostra o indicador "Carregando o player…" até o `ready` do embed;
  o embed carrega por baixo, invisível.
- **Bordas brancas**: o _iframe_ tem um fundo branco opaco quando a página é escura, que aparecia nos cantos arredondados do
  player. O ponto de montagem recorta o embed no mesmo raio de 12 px do Spotify (`overflow: hidden`), e nos dois temas só o
  player aparece (reproduzido e conferido com capturas).

### Botão de play sobre a capa

Como no Spotify, ao apontar o mouse para um cartão sobe, no canto da capa, um botão redondo verde de play que toca aquela
faixa (as cores estão em `PLAY_BUTTON_COLORS`, com contraste testado). Em telas de toque, que não têm _hover_
(`@media (hover: none)`), ele fica sempre visível. É um **atalho para o mouse**: tem `aria-hidden` e `tabindex="-1"`, e o
botão "Ouvir uma prévia" continua sendo o controle acessível (e é para ele que o foco volta ao fechar a barra). Some enquanto
a faixa do cartão é a que está tocando. Não cobre o selo do Brasil, que continua no corpo do cartão.

### Volume: não é possível com o embed

O controlador da iFrame API só oferece `play`, `pause`, `resume`, `togglePlay`, `seek`, `restart` e `loadUri` (conferido no
objeto real); não há volume, e o navegador não deixa uma página controlar o som de um iframe de outra origem. O volume fica
com o sistema e a aba. Só seria possível tocando áudio próprio (`preview_url`), que o Spotify não devolve (ADR 0005).

## Alternativas consideradas

- **Manter o embed em cada cartão** — é o que causava o problema; vários players também competiam entre si.
- **Controlar o embed por `postMessage` à mão** — protocolo não documentado; a iFrame API é o caminho suportado.
- **Cobrir o rodapé com a barra e reservar espaço com _padding_** — mais frágil do que posicionar a barra no fluxo.
- **Sem início automático** — mais simples e sem _script_ de terceiros, mas pede um segundo clique em cada faixa.

## Consequências

- Positivas: pausar/trocar/fechar sem sair do ponto da lista; cartões estáveis; uma só instância do Spotify na página;
  funciona mesmo sem o _script_ (com um clique a mais).
- Negativas: um _script_ de terceiros (oficial, sob demanda) passa a existir na página após o primeiro clique; o tema escuro
  do embed (`?theme=0`) só vale no modo de contingência, pois a iFrame API não o expõe; o início automático depende da
  política de _autoplay_ do navegador (o clique do visitante é o gesto que a libera).

## Atualização (24/10/2026): a orquestração saiu do componente

O `PlayerBar` tinha cerca de 220 linhas e controlava o início do player com um contador de tentativas, _flags_
(`_creating`, `_wantedUri`), um prazo e _effects_ que mexiam no DOM: funcionava e tinha testes, mas era difícil de manter. A
orquestração foi para `SpotifyEmbedPlayer` (`features/tracks/spotify/`), uma pequena máquina de estados explícita
(`SpotifyPlayerState`: `IDLE → STARTING → READY`, ou `FAILED`), e o componente ficou com o template, o ponto de montagem e o
embed de contingência (cerca de 100 linhas).

- O que o visitante quer é só "este URI neste ponto de montagem": pedir outra faixa enquanto o script ou o embed ainda
  carregam apenas troca o URI, e **vence a mais nova**; um embed que chega depois de um `stop()` ou do prazo é destruído.
- Toda resposta que pode chegar tarde (script, embed, "ready") leva o número da execução a que pertence; `stop()` e a falha
  o trocam, e o que vem de uma execução antiga é ignorado. Há um só prazo, que o "ready" cancela.
- O comportamento da barra não mudou: o `player-bar.spec.ts` inteiro passou sem alterações, e o novo
  `spotify-embed-player.spec.ts` cobre cada transição e as corridas (trocar de faixa durante o carregamento do script,
  fechar e reabrir com outro ponto de montagem, falha depois do `stop()`).

## Atualização (24/10/2026): o player abre no idioma da página

O player do Spotify abria no idioma **do navegador** (quem escolhia espanhol numa página em português ouvia a interface do
Spotify em português), porque o embed segue o `Accept-Language` do navegador. Verificado em `open.spotify.com`: o embed aceita
`?locale=<tag>` (`en`, `es`, `ru`, `fr`, `tr`, `pt-BR`; um `pt` sozinho não é reconhecido e cai em inglês), e o script da iFrame
API lê `window.SpotifyIframeConfig.locale` e o repassa ao iframe.

- `SpotifyEmbedPlayer.setLocale` grava o idioma em `SpotifyIframeConfig.locale` **antes de criar o embed**; o embed de contingência usa
  `buildEmbedUrl(id, dark, locale)`, que só aceita uma tag de idioma (`SPOTIFY_LOCALE_PATTERN`) e a deixa de fora se for outra
  coisa. A tag é `I18n.locale()` (`pt-BR`, `es`…).
- O embed de contingência segue o idioma ao vivo (o iframe recarrega, como já fazia com o tema). **O embed da iFrame API não:**
  ele guarda o idioma de quando foi criado; se o visitante trocar o idioma com a música tocando, a interface do Spotify só muda
  no próximo embed (fechar e tocar de novo), para não interromper a música.

# 0015 — Acabamento da interface: alinhamento dos cartões, identidade da aba, rodapé e ações

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

Com a página no ar, a revisão visual apontou quatro coisas: (1) os cartões de uma mesma linha não tinham as seções
alinhadas (um título ou uma data que quebra em duas linhas empurrava o resto, e a "sanfona" de alturas destoava); (2) a aba
do navegador mostrava o título genérico e o ícone padrão; (3) faltava um rodapé com o crédito do autor; (4) os dois botões de
ação do cartão ("Ouvir uma prévia" e "Abrir no Spotify") tinham estilos diferentes.

## Decisão

### Seções alinhadas entre cartões: CSS _subgrid_

A grade da página define as linhas e cada cartão **ocupa as mesmas 8 linhas** (capa, selo, título, artistas, dois pares de
dados, player, ação) com `grid-template-rows: subgrid`. Assim a linha de cartões tem a altura do maior conteúdo de cada seção
e **cada seção começa à mesma altura em todos os cartões**, em 1, 2 ou 3 colunas, em qualquer idioma e quando um player é
aberto (a linha inteira cresce). Os host dos componentes usam `display: contents` para que o `<article>` participe da grade
da página. Navegadores sem _subgrid_ (`@supports`) mantêm o layout em _flex_ com altura igual por linha, que já existia.

Alternativas: alturas fixas (cortam texto e quebram em idiomas longos, como o russo); `min-height` por seção (números mágicos);
JavaScript medindo e igualando (frágil, pisca na hidratação). O _subgrid_ é suportado em todos os navegadores atuais.

### Identidade da aba

- **Título** = nome do produto, **traduzido** (`app.eyebrow`: "Consulta de ISRC" em pt/es, "ISRC lookup" em en, e assim por
  diante), atualizado pelo serviço `I18n` junto com `<html lang>`. O `<title>` estático de `index.html` é o do inglês.
- **Ícone** = **as mesmas quatro barras do logo do cabeçalho**: `favicon.svg` (nítido em qualquer tamanho), `favicon.ico`
  32×32 e `apple-touch-icon.png` 180×180 como alternativas. Um teste compara a geometria das barras do SVG com o cabeçalho.

### Rodapé

`AppFooter` (landmark `contentinfo`): crédito do autor com link para o **portfólio** (`alyssonmascarenhas.github.io/portfolio`),
"desenvolvido para o desafio técnico de front-end da ONErpm", link para o código-fonte e a atribuição dos dados ao Spotify.
Textos nos seis idiomas (o nome do autor não é traduzido); links externos abrem em nova aba com `rel="noopener noreferrer"` e
aviso para leitores de tela. A raiz é uma coluna _flex_, então o rodapé fica no fim da janela mesmo com pouco conteúdo. O
cabeçalho passa a `display: contents` para continuar fixo (`sticky`) em relação à página inteira.

### Botão de ação compartilhado

`ActionButton` (`src/app/shared/action-button`): recebe **ícone** (enum `ActionIcon`: `Play`, `Spotify`) e **rótulo**; sem
`href` é um `<button>` que emite o _output_ `pressed`, com `href` é um `<a>` para outro site (nova aba, com `newTabLabel` para
leitores de tela). É uma pílula de largura total, **preta no tema claro e branca no escuro**, ao estilo dos selos "Listen on
Spotify"; a marca do Spotify fica verde sobre preto e preta sobre branco. "Ouvir uma prévia" e "Abrir no Spotify" usam o
mesmo componente, então têm o mesmo tamanho, raio, foco e comportamento. As cores ficam em `ACTION_COLORS`
(`theme.constants.ts`, como manda o ADR 0012) e o preset as expõe como `--p-action-*`, trocadas pela mesma classe `app-dark`
que troca os demais _tokens_; o contraste (AA) é testado. Não baixamos nem redistribuímos os selos oficiais: o botão usa texto traduzido e o glifo do Spotify em SVG.

### Player: o lugar dele é reservado na hora (hoje na barra fixa, ADR 0016)

Ao clicar em "Ouvir uma prévia" o embed do Spotify leva um instante para abrir e, antes, a área ficava vazia ("buraco").
Agora o palco do player já nasce com a altura do embed (152 px) mostrando um indicador de carregamento (`role="status"`,
traduzido) e o iframe carrega por trás, invisível, até disparar o `load` do endereço do Spotify. Resultado: nada pula quando
o player chega e a linha de cartões não muda de altura. O iframe deixou de ser `lazy` (o visitante acabou de pedir).
**Reprodução automática não foi adotada**: o embed simples não aceita um parâmetro de _autoplay_ e os navegadores bloqueiam o
som iniciado dentro de um iframe de terceiros; só a _iFrame API_ do Spotify (um _script_ de terceiros a mais) permitiria um
`play()` programático. Mantemos a regra do ADR 0013 (iframe só com a URL de `buildEmbedUrl`).

### Aviso de falha parcial: lista de ISRCs afetados em um modal

O aviso só dizia quantos ISRCs falharam, e os cartões deles ficam no fim da lista: com N ISRCs, achá-los pedia rolar a página
inteira. Agora o aviso tem o botão **"Ver ISRCs afetados"**, que abre um `p-dialog` modal com a lista (só os que **falharam**,
não os "sem faixa", que são um resultado esperado). A lista rola dentro do modal (altura máxima) e recebe foco por teclado;
Esc fecha e devolve o foco ao botão; o modal tem "Tentar novamente", que refaz a consulta de todos. Textos nos seis idiomas
(inclusive o rótulo de "Fechar", que o PrimeNG deixaria em inglês) e axe limpo nos dois temas. O aviso também ganhou
espaço abaixo, para não colar nos cartões. Alternativas: ancorar/rolar até o primeiro cartão com falha (não mostra a lista
inteira nem funciona bem com muitos) e listar tudo dentro do próprio aviso (o aviso cresceria sem limite).

### Integração indisponível: painel centrado, não barra

- **Um painel centrado, e não uma barra de largura total.** Quando o Spotify não responde, a página mostra um
  painel (`role="alert"`) com ícone, título, texto e o botão "Tentar novamente", centrado e com no máximo 30 rem de largura; no
  celular o painel ocupa a largura útil e o botão preenche o painel (tamanho grande, fácil de tocar). A primeira versão era um
  `p-message` de largura total com o botão ao lado, que ficava largo demais no desktop e quebrava de forma estranha em telas
  estreitas. O botão é o `p-button` com `fluid`, dimensionado pelo seu elemento hospedeiro (sem `::ng-deep`). Os textos são os mesmos
  nos seis idiomas. Um e2e mede o painel a 1280 px (centrado, ≤ 30 rem) e a 320 px (sem rolagem lateral, botão cheio), e o axe
  já cobria esse estado.

## Consequências

- Positivas: visual coerente e alinhado em qualquer largura e idioma; um só lugar para o estilo das ações; identidade da aba
  igual à do cabeçalho; tudo coberto por testes (unitários e e2e que **medem** as posições; sem _subgrid_ eles falham).
- Negativas: `display: contents` nos hosts exige medir o `<article>` (e não o host) nos testes; o glifo do Spotify está
  embutido no código e precisa seguir as diretrizes de marca da Spotify se for ampliado.

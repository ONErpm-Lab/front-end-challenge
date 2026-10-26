# 0003 — Design "Catálogo" com componentes próprios e Angular CDK

- **Status:** Aceito
- **Data:** 2026-10-25

## Contexto

O design foi escolhido no Claude Design entre duas direções (Estúdio/DAW e Catálogo). A escolhida, **B · Catálogo**, é
um painel para produtores: cartões de resumo, tabela com filtros por situação e o detalhe da faixa com a prévia; no
celular o detalhe vira uma _bottom sheet_.

## Decisão

- **Componentes próprios** com **Angular CDK** onde o comportamento é difícil de acertar sozinho: `Dialog` (lista de
  ISRCs e _bottom sheet_: foco preso, Escape, foco devolvido), `Menu` (idioma), `Clipboard` e `BreakpointObserver`.
- **Tokens em CSS** (`src/styles.scss`) para claro e escuro, aplicados por `data-theme`; o tema salvo é aplicado antes
  da primeira pintura por `public/theme-init.js`.
- **Tabela nativa** (`<table>`); no celular as colunas de ISRC e data saem (estão no detalhe).
- **Prévia** com o player oficial do Spotify (iFrame API), criado só depois do clique.

## Alternativas consideradas

- **PrimeNG com tema novo** — o visual B exigiria sobrescrever boa parte dos estilos.
- **Tailwind** — mais uma ferramenta para poucos componentes.

## Consequências

- Positivas: bundle inicial ~396 kB brutos (~106 kB transferidos); acessibilidade verificada pelo axe.
- Negativas: os componentes (chips, _sheet_, menu) são nossos para manter.

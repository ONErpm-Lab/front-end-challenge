# 0005 — Testes unitários, e2e e acessibilidade

- **Status:** Aceito
- **Data:** 2026-10-25

## Contexto

O desafio pede testes unitários e de integração como diferencial; a interface nova precisa provar que funciona no
desktop e no celular, nos dois temas, e que continua acessível.

## Decisão

- **Vitest** (`ng test`) para domínio, store, componentes, i18n, `api/` e `services/`, com cobertura mínima no
  `angular.json` (90% linhas/funções/instruções, 85% ramos). Testes de página esperam com `TestBed.tick()` + timers,
  nunca `whenStable()` com uma requisição pendente.
- **Playwright** contra um build de produção com credenciais falsas (`ng serve --configuration e2e`), em dois
  projetos (desktop e Pixel 7). O Spotify (token e Web API) é respondido com as **respostas reais gravadas**
  (`src/app/api/spotify-web/testing/fixtures`); a indisponibilidade é simulada recusando as credenciais. O player é um
  script falso do Spotify.
- **axe** (WCAG 2.0/2.1 A e AA) em cada estado: lista, carregando, indisponível, detalhe e menu de idioma, claro e escuro.

## Alternativas consideradas

- **Karma/Jasmine** — o Angular 21 já usa Vitest.
- **Só testes unitários** — não provariam o layout responsivo, a CSP nem a acessibilidade renderizada.

## Consequências

- Positivas: o CI barra regressões de comportamento, de contraste e de acessibilidade.
- Negativas: o e2e é o job mais lento; o axe não substitui um teste com leitor de tela.

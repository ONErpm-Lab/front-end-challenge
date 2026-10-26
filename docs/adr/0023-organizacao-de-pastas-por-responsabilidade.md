# 0023 — Organização de pastas por responsabilidade e camada

- **Status:** Aceito
- **Data:** 2026-10-24

## Contexto

O ADR 0008 organiza o código por _domínio_ e por _tipo de declaração_, mas dizia só que "cada feature do Angular" seria
um domínio. Na prática `src/app/features/tracks/` chegou a 24 arquivos soltos na raiz, misturando funções puras
(`sort-results`, `format-*`), estado (`tracks-store`, `now-playing`), acesso à API (`tracks-api`) e integração com o
Spotify (`spotify-embed`, `spotify-iframe-api`), com um único `tracks.constants.ts` para tudo. Difícil de navegar e sem
como saber quem pode depender de quem. `core/i18n` e `src/bff` tinham o mesmo problema em escala menor.

## Decisão

Cada domínio vira **subpastas por responsabilidade**, cada uma com seus próprios `<pasta>.constants|enums|interfaces|types.ts`
(mesma regra de nomes do ADR 0008, que o lint já cobre pelo sufixo).

- **Front, `features/tracks/`:** `api/` (BFF), `store/` (signals), `domain/` (funções puras de ordenar, filtrar e
  formatar), `spotify/` (URLs do embed e iFrame API), `components/`, `pages/`, `testing/`.
  Direção: `pages → components → store → api / domain`; `components → spotify`.
- **`core/i18n/`:** `language/` (detecção e armazenamento do idioma), `translations/` (loader e JSON); a raiz guarda o
  serviço `I18n`, `provide-i18n` e as declarações compartilhadas.
- **BFF:** `config/`; relógio/`sleep`/`fetch` genéricos em `shared/`; `tracks/` em `finder/` (busca e cache) e `mapping/`
  (escolha e conversão, puras). Direção: `api → tracks → spotify → shared`.
- **Imposto pelo ESLint** (`no-restricted-imports` em `eslint.config.js`, fora de _specs_ e `testing/`): uma camada não
  importa as de cima.
- Uma declaração usada por mais de uma pasta fica na pasta mais baixa que a possui (ex.: `SortDirection` em `domain/`,
  usado por `store/` e `pages/`).

## Alternativas consideradas

- **Só documentar** — sem o lint, a direção das dependências se perde (mesmo raciocínio do ADR 0008).
- **Uma feature por pasta de camada (`src/app/components`, `src/app/services`…)** — espalha o que muda junto.
- **`eslint-plugin-boundaries`/`import`** — dependência nova para o que `no-restricted-imports` já resolve.
- **Subpastas também em `bff/spotify` e `bff/api`** — já são coesas; dividir só adicionaria caminho.

## Consequências

- Positivas: dá para saber onde fica cada coisa e o que ela pode usar; constantes e enums ficam perto de quem os usa;
  `git mv` preservou o histórico dos arquivos.
- Negativas: caminhos de import mais longos (`../../domain/...`); novas pastas pedem decidir a camada certa.

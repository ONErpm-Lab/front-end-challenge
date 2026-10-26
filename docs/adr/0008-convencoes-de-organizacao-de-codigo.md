# 0008 — Convenções de organização e estilo de código

- **Status:** Aceito; a parte de organização por tipo de declaração foi substituída pelo [ADR 0027](0027-convencoes-de-codigo-menos-rigidas.md)
- **Data:** 2026-10-23

## Contexto

Na revisão do PR #2 foram pedidas regras para: onde declarar constantes, interfaces, types e enums; como nomear
propriedades privadas; modificadores de acesso explícitos; e como escrever laços infinitos. Convenções só
documentadas se perdem; queremos que o **lint** as imponha.

## Decisão

### Organização por domínio e por tipo de declaração

"Domínio" é a pasta de uma responsabilidade (subdividida por camada no ADR 0023) (`src/contract`, `src/bff/spotify`, `src/bff/tracks`, `src/bff/api`, e
futuramente cada feature do Angular). Dentro dela, cada tipo de declaração tem **um arquivo próprio**, com nome no
plural no padrão `<domínio>.<tipo>.ts`:

| Declaração                             | Arquivo                   | Exemplo                                                 |
| -------------------------------------- | ------------------------- | ------------------------------------------------------- |
| `interface` (contratos, DTOs, portas)  | `<domínio>.interfaces.ts` | `Track`, `ApiError`, `TrackSearch`, `SpotifyTrack`      |
| `type` (uniões, aliases)               | `<domínio>.types.ts`      | `TrackLookupResult`, `IsrcQuery`, `FetchFn`             |
| `enum` (conjuntos fechados de valores) | `<domínio>.enums.ts`      | `LookupStatus`, `ApiErrorCode`, `SpotifyFailureReason`  |
| constantes `UPPER_SNAKE_CASE`          | `<domínio>.constants.ts`  | `SEARCH_LIMIT`, `BRAZIL_MARKET`, `CACHE_CONTROL_PUBLIC` |

- **Escopo:** a constante/interface mora no domínio que a _possui_. Quem precisa dela importa; se mais de um domínio
  usa, ela sobe para o domínio compartilhado (`contract` ou `shared`) em vez de ser duplicada.
- **Classificação de interfaces:** contrato entre BFF e Angular e DTOs ficam em `contract/`; o formato do Spotify, em
  `spotify/spotify.interfaces.ts`; opções de uso interno, no `.interfaces.ts` do próprio domínio.
- **Valores fechados são `enum`** (membros em `UPPER_SNAKE_CASE`, `@typescript-eslint/naming-convention`; string enum, para serializar em JSON sem mudança): status, códigos de erro, motivos
  de falha, tipo de consulta. Nada de _string literals_ espalhadas. Valores dinâmicos viram campo à parte
  (ex.: `SpotifyUnavailableError.status` em vez de `search_failed_401`).
- Exceções: arquivos `*.spec.ts` e `testing/` (dados de teste podem declarar o que precisarem) e funções/objetos em
  `camelCase` (ex.: `systemClock`), que não são constantes de configuração.

### Classes

- **Propriedades privadas** (inclusive _parameter properties_) começam com `_`: `private readonly _fetchFn`.
- **Modificadores de acesso sempre explícitos** (`public`, `private`, `protected`) em métodos e propriedades; só o
  `constructor` omite `public`.
- Laço infinito com saída explícita usa `while (true)`.

### Enforcement

`eslint.config.js` aplica essas regras em `src/**/*.ts` (fora de specs e `testing/`):
`no-restricted-syntax` (bloqueia `interface`/`type`/`enum`/constantes fora dos arquivos certos),
`@typescript-eslint/explicit-member-accessibility` e `@typescript-eslint/naming-convention`.
O `pre-commit` (lint-staged) e o CI barram violações.

## Alternativas consideradas

- **Só documentar no CLAUDE.md** — sem enforcement, a convenção desvia.
- **Um arquivo `types.ts` único por domínio** — mistura interfaces, aliases e enums; o pedido foi separar por natureza.
- **`#privado` do JavaScript** — não aparece nas convenções pedidas e complica _mocks_ em testes; usamos `private` + `_`.
- **`union` de _string literals_ em vez de `enum`** — permite valores mágicos soltos; o enum centraliza e dá autocomplete.

## Consequências

- Positivas: onde achar cada coisa é previsível; valores mágicos eliminados; estilo uniforme verificado por máquina.
- Negativas: mais arquivos pequenos por domínio; importar de arquivos distintos exige um pouco mais de cerimônia.

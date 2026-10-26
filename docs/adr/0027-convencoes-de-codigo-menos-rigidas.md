# 0027 — Convenções de código menos rígidas (revisa o ADR 0008)

- **Status:** Aceito (substitui a parte de organização por tipo de declaração do [ADR 0008](0008-convencoes-de-organizacao-de-codigo.md))
- **Data:** 2026-10-24

## Contexto

O ADR 0008 fazia o ESLint impor **um arquivo por tipo de declaração** em cada domínio (`*.interfaces.ts`, `*.types.ts`,
`*.enums.ts`, `*.constants.ts`) e proibia constantes, tipos e enums em qualquer outro lugar. Na prática isso gerou arquivos de
uma ou duas linhas (`finder.constants.ts`, `mapping.constants.ts`, `config.constants.ts`, `isrc.constants.ts`,
`copy-button.constants.ts`), obrigava a abrir outro arquivo para entender uma constante usada em um só lugar e tornava
_string literals_ de uso local mais penosas que enums. Também havia uma contradição: `contract/tracks.interfaces.ts` se
dizia "só tipos", mas depende de enums, que existem em tempo de execução. A revisão apontou a convenção como rígida demais.

## Decisão

- **Declarações moram junto do código que as usa.** Uma constante, interface, tipo ou enum usado por **um só arquivo** fica nesse
  arquivo. Quando for **compartilhado por dois ou mais arquivos** do domínio, ou tiver volume, vai para
  `<domínio>.constants.ts` / `.interfaces.ts` / `.types.ts` / `.enums.ts` (os nomes continuam sendo o padrão para isso). O
  ESLint **não** impõe mais onde cada declaração mora: é decisão de revisão.
- **Conjuntos fechados de valores**: continuam sendo `enum` (membros em `UPPER_SNAKE_CASE`, imposto pelo lint) quando
  **cruzam uma fronteira** (contrato BFF↔Angular, JSON, log, valor iterado ou usado em `switch` por vários arquivos). Para um
  conjunto **local a um arquivo**, uma _string literal union_ é aceita.
- **Constantes de configuração** seguem em `UPPER_SNAKE_CASE`; funções e objetos de comportamento em `camelCase`.
- **Mantém-se, imposto pelo lint:** sem `any`; propriedades privadas com `_`; modificador de acesso sempre explícito (só o
  `constructor` omite `public`); membros de enum em `UPPER_SNAKE_CASE`; camadas de pasta do [ADR 0023](0023-organizacao-de-pastas-por-responsabilidade.md)
  (dependências só para baixo).
- **`src/contract`** não depende de nada do BFF nem do Angular; os enums dele são valores de execução, não "só tipos"
  (o comentário de `tracks.interfaces.ts` foi corrigido).
- Os arquivos de uma ou duas linhas foram incorporados a quem os usa: `config.constants.ts`, `finder.constants.ts`,
  `mapping.constants.ts`, `isrc.constants.ts` e `copy-button.constants.ts`.
- **`engines.node`** passa de `^22.22.1 || >=24` para `^22.12.0 || >=24` (o que o Angular 21 exige): o `lint-staged` 17 e o
  ESLint 10 pedem 22.22.1 ou mais, mas só emitem aviso em versões menores. O `.nvmrc` continua em 24.

## Alternativas consideradas

- **Manter o 0008** — previsível, mas é o que a revisão apontou, e o custo (arquivos minúsculos, saltos entre arquivos) aparece
  a cada mudança.
- **Remover qualquer convenção** — perderia o que ajuda de verdade (nomes, acesso explícito, camadas).
- **Impor "compartilhado por 2+ arquivos" no lint** — exigiria uma regra própria; o custo supera o benefício.

## Consequências

- Positivas: menos arquivos pequenos; a constante fica ao lado do uso; menos atrito para escrever código novo.
- Negativas / dívidas assumidas: a organização passa a depender da revisão (mais variação entre pastas); os arquivos
  `*.constants.ts`, `*.enums.ts` etc. que já existem continuam como estão, até alguém mexer neles.

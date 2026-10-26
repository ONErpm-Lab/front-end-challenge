# 0004 — Commits semânticos, commitlint e fluxo de PRs

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

Boas práticas de versionamento são critério de avaliação. Queremos histórico legível, changelog/versão
automatizáveis e revisão em partes pequenas.

## Decisão

- **Conventional Commits** validados por `commitlint` (`@commitlint/config-conventional`) com **escopos fechados**
  (`bootstrap`, `ci`, `deps`, `docs`, `bff`, `tracks`, `i18n`, `theme`, `ui`, `e2e`, `docker`, `release`).
- **Husky**: hook `commit-msg` (commitlint) e `pre-commit` (lint-staged: ESLint + Prettier nos arquivos staged).
- **Uma branch por etapa** (`chore/`, `feat/`, `ci/`, `test/`) e um PR pequeno para `main`, integrado com **merge commit** (mantém o histórico granular de commits semânticos; squash só serviria a PRs de um único commit). A `main` é protegida: exige os checks `CI OK` e `PR title`.
- O mesmo commitlint roda no CI, para pegar quem pular os hooks.

## Alternativas consideradas

- **Convenção apenas documentada** — sem enforcement, desvia rápido.
- **Um PR único gigante** — difícil de revisar e de reverter.

## Consequências

- Positivas: histórico padronizado; `release-please` poderá gerar versões e CHANGELOG; revisão focada.
- Negativas: fricção inicial para escrever mensagens no formato; lista de escopos precisa ser mantida.

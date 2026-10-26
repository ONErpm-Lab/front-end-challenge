# 0001 — Registrar decisões de arquitetura

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

O desafio avalia padrões de projeto, clean code e comunicação. Decisões como "por que um BFF?" ou "por que não
`preview_url`?" não são deduzíveis só lendo o código, e quem revisa o PR precisa entender o raciocínio.

## Decisão

Registrar cada decisão técnica relevante como um ADR curto em `docs/adr/`, no mesmo PR que a introduz.

## Alternativas consideradas

- **Só README/wiki** — envelhece e se separa do código; não há revisão por PR.
- **Só mensagens de commit** — difíceis de achar e sem contexto de alternativas.

## Consequências

- Positivas: revisão do "porquê" no próprio PR; histórico auditável; onboarding mais rápido.
- Negativas: pequeno custo de escrita a cada decisão (mitigado pelo template curto).

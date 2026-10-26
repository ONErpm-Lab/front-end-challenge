# 0001 — Registrar decisões de arquitetura

- **Status:** Aceito
- **Data:** 2026-10-25

## Contexto

Esta branch (`main-spa`) recomeça o projeto como uma SPA estática, ao lado da versão SSR que já foi entregue na `main`.
As decisões da versão SSR estão nos ADRs da `main`; aqui elas só valem quando repetidas.

## Decisão

Toda decisão técnica relevante desta branch vira um ADR curto em `docs/adr/` (modelo em `0000-template.md`), no mesmo
PR que a introduz, com numeração própria a partir de 0001 e entrada no índice `docs/adr/README.md`.

## Alternativas consideradas

- **Continuar a numeração da `main`** — misturaria decisões de dois produtos que não convivem na mesma branch.
- **Só o README** — perde o contexto e as alternativas de cada escolha.

## Consequências

- Positivas: o porquê de cada escolha fica junto do código; quem lê a `main-spa` não precisa da `main`.
- Negativas: algumas decisões aparecem nos dois históricos (por exemplo, as regras de consulta ao Spotify).

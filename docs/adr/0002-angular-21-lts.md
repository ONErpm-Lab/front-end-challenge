# 0002 — Angular 21 (LTS) em vez do 22

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

O enunciado exige "Angular versão LTS". Segundo [angular.dev/reference/releases](https://angular.dev/reference/releases),
em out/2026 a v22 está em suporte **Active**, enquanto v21 e v20 estão em **LTS** (v21 até 2027-06).
Além disso, o Angular CLI 22 exige Node `^22.22.3 || ^24.15.0 || >=26`; o ambiente de desenvolvimento tem Node 24.3.0
e a CLI 22 recusa rodar.

## Decisão

Usar **Angular 21** (stack: standalone, zoneless, signals, Vitest) com PrimeNG 21 e angular-eslint 21.

## Alternativas consideradas

- **Angular 22** — mais novo, mas não é "LTS" literalmente e exigiria trocar o Node global da máquina.
- **Angular 20** — LTS, porém sai de suporte em 2026-11 (poucas semanas).

## Consequências

- Positivas: aderência literal ao requisito; funciona no Node do ambiente; suporte até 2027-06.
- Negativas: migração para 22 será necessária depois; `engines` no `package.json` exige Node `^22.12 || >=24` (era `^22.22.1`, ver ADR 0027) (o piso vem do lint-staged 17 e do ESLint 10, não do Angular 21, que aceita `>=22.12`).
- Observação: o npm 11.4.2 falha com `Cannot read properties of null (reading 'edgesOut')` ao resolver peers;
  o projeto exige npm >= 11.6 (`engines` e `packageManager`).

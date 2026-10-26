# 0010 — Domínio de faixas no front: ordenação, duração e estado

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

A página precisa listar as faixas **ordenadas por título (A→Z)**, mostrar a **duração em `mm:ss`** e avisar quando a
integração estiver fora. Os títulos reais misturam português (`...É pra Você`), inglês e cirílico, o que expõe
decisões que não são óbvias: como ordenar, como arredondar e onde ficam as ISRCs que não viraram faixa.

## Decisão

Código da feature em `src/app/features/tracks/`, sem componentes ainda (a UI vem em PR próprio), seguindo o ADR 0008.

- **Ordenação (`sortResults`)** com `Intl.Collator` e sensibilidade `base`: ignora caixa, acentos **e pontuação**
  (`...É pra Você` fica entre `D` e `L`, não antes de `A`) e compara números por valor (`Track 2` < `Track 10`).
  Empates mantêm a ordem de entrada. A localidade é **fixa e explícita: `en`** (sem _tailoring_, equivale à ordem raiz do CLDR), nem o idioma da
  interface nem o padrão do runtime: trocar de idioma, ou renderizar no servidor e no navegador, não pode reordenar a
  lista (latinos antes de cirílicos). **`und` não serve**: não é uma localidade suportada e o `Intl.Collator` cai
  silenciosamente no padrão do runtime (com `ru` o cirílico viria primeiro; com `sv`, `Ä` depois de `Z`). Testes
  simulam runtimes com padrão `ru`, `sv`, `tr` e `pt-BR` e garantem que `en` é uma localidade realmente suportada.
  A função aceita outra localidade se isso mudar.
- **Quem não tem título** (ISRC não encontrada ou com falha) **não some**: vai depois das faixas — não encontradas
  primeiro, depois as com falha — ordenadas por ISRC. Assim o produtor vê quais das 10 ISRCs não vieram.
- **Duração (`formatDuration`)** em `mm:ss`, **arredondada ao segundo mais próximo**; os minutos não passam por `59`
  (`83:45`), pois não há campo de hora. Valor inválido (`NaN`, infinito, negativo) vira `00:00` em vez de quebrar o layout.
- **Cliente do BFF (`TracksApi`)**: um único `GET /api/tracks?isrc=a,b,...`. Qualquer falha (HTTP, rede ou
  _timeout_ de 20 s) vira `TracksUnavailableError`, com o erro original em `cause`. Lista vazia não chama o servidor.
- **Estado (`TracksStore`)**, _signals_ no lugar de um estado global:
  - `status`: `idle → loading → ready | unavailable`.
  - `items` (ordenados), `isLoading`, `isUnavailable` e `failedCount` (ISRCs que falharam enquanto as outras
    carregaram: aviso, não bloqueio).
  - `load()` cancela a requisição anterior (útil para "tentar novamente") e mantém os itens antigos visíveis
    durante o recarregamento; ao destruir o store, a requisição pendente é cancelada.
- **`CHALLENGE_ISRCS`** (as 10 do enunciado) fica em `store/store.constants.ts` (pastas: ADR 0023); `load()` as usa por padrão.

## Alternativas consideradas

- **Ordenar com `localeCompare` simples** — pontuação e acentos mudam a posição (`...É pra Você` iria para o topo).
- **Ordenar conforme o idioma da interface** — a ordem mudaria ao trocar de idioma; surpreende o usuário.
- **Colação `und` (raiz)** — parece neutra, mas depende do padrão do runtime (ver acima); descoberto na revisão do PR #4.
- **Truncar a duração (`floor`)** — `2:57` para 177,6 s; o arredondamento é mais fiel ao valor real.
- **`rxResource`/`resource` do Angular** — ainda experimentais na v21 e escondem os estados de falha parcial que a UI precisa.
- **NgRx/estado global** — peso e cerimônia desnecessários para uma tela.

## Consequências

- Positivas: regras de apresentação puras e testadas isoladamente; a UI só liga dados a componentes.
- Negativas: a ordem "A→Z" segue a colação universal, não o alfabeto de um idioma específico; o _timeout_ de 20 s é uma
  escolha fixa (constante em `api/api.constants.ts`).

# 0004 — Convenções do Angular e camadas `api` / `services`

- **Status:** Aceito
- **Data:** 2026-10-25

## Contexto

O Angular 20+ gera arquivos sem sufixo (`header.ts`) e aceita template e estilo dentro do `.ts`. Este projeto segue a
convenção clássica, mais explícita. Toda comunicação externa deve ficar num lugar só.

## Decisão

- **Nomes clássicos:** `xxx.component.ts|html|scss|spec.ts`, `xxx.service.ts`, `xxx.interceptor.ts`, classes com
  sufixo (`HeaderComponent`, `I18nService`). O CLI está configurado para gerar assim (`type`/`typeSeparator` em
  `angular.json`) e o lint exige o sufixo das classes. Nenhum componente tem template ou estilo inline, e todo
  component, service, store e interceptor tem `.spec.ts`.
- **`src/app/api/`:** só quem faz requisição para fora — `spotify-accounts/` (token), `spotify-web/` (busca) e
  `spotify-player/` (script da iFrame API). Cada cliente faz uma chamada, valida a resposta e devolve tipos do provedor
  ou um erro tipado.
- **`src/app/services/`:** nossos serviços, que usam a `api/` e entregam ao app — `spotify-auth/` (token + interceptor),
  `track-lookup/` (regras: `market=BR`, a versão mais antiga, _mapper_, até 4 buscas ao mesmo tempo, espera curta após
  429, falha isolada por ISRC) e `spotify-player/`.
- **`src/app/models/`:** o modelo do app (`Track`, `TrackLookupResult`), sem o formato do Spotify.
- **Regras no ESLint:** `features`, `layout`, `shared` e `core` não importam `api/`; `HttpClient` só em `api/`.

## Consequências

- Positivas: dá para saber o papel de cada arquivo pelo nome e onde fica cada integração; o lint impede atalhos.
- Negativas: mais arquivos por componente.

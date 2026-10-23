# AGENTS.md

Instruções para agentes de IA (e pessoas) que trabalham neste repositório.
Boas práticas gerais de Angular: [`frontend/AGENTS.md`](frontend/AGENTS.md), gerado pelo Angular CLI (`ng g ai-config`). Não edite esse arquivo à mão.

## Comandos

```bash
# API (BFF) — api/
npm ci
npm test                  # unitários + integração HTTP
npm run test:coverage     # exige 90% por arquivo na regra de negócio
npm start                 # api/.env a partir de .env.example; SPOTIFY_MODE=mock dispensa credenciais

# Frontend — frontend/
npm ci
npm run lint:boundaries   # rode antes do lint: prova as fronteiras de arquitetura
npm run lint              # = ng lint
npm run test:coverage     # exige 90% por arquivo em utils/models/store/shared
npm run build
npm run e2e               # Playwright: sobe API (mock) + ng serve; precisa de npm ci em api/
npm start                 # http://localhost:4200, proxy /api → :3000
```

Antes de concluir qualquer mudança, rode a mesma sequência do CI (`.github/workflows/ci.yml`).

## Arquitetura

**Antes de escrever código, leia [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)**: camadas, tabela "onde coloco isto?" e a receita de uma feature nova com esqueletos.

- `api/`: BFF em Express. É o único lugar com as credenciais do Spotify.
- `frontend/`: Angular 21 (LTS), standalone, zoneless, signals, SCSS puro.
- Vertical slice: `frontend/src/app/features/<feature>/{pages,components,ports,store,services,models,utils}` + `<feature>.providers.ts`, e `shared/`.
- Fluxo: `página → porta do store → Signal Store → porta de dados → *-api.service → /api`.
- Estado com **NgRx Signal Store** (`@ngrx/signals`). Injete sempre a **porta** (`ports/`, `InjectionToken`), nunca a classe; o vínculo porta → implementação fica só em `<feature>.providers.ts`.
- Conceito com regra (validação, formato) = Value Object em `models/` (ex.: `isrc.value-object.ts`).
- As fronteiras são verificadas pelo ESLint (`frontend/eslint.config.js`): se o lint barrar um import, a correção é mudar o código de camada, nunca a regra.

## Decisões do projeto que diferem do padrão

- O store da feature é provido na página (`providers: [provideTracksFeature()]`), **não** com `providedIn: 'root'`: o estado vive e morre com a tela.
- O serviço de requisições termina em `-api.service.ts`. A regra de fronteira depende desse sufixo.
- Não há rotas: a aplicação é uma página só, então "lazy loading de rotas" não se aplica.
- Disponibilidade no BR: busca com `market=BR` + `is_playable` (`available_markets` não existe em Dev Mode).
- Modo mock (`api/src/mock/`): implementa o mesmo contrato do cliente real (`findTrackByIsrc`). Novos cenários entram no catálogo de demonstração, nunca como `if (mock)` no serviço, na regra ou no frontend.

## Proibido

- Expor credenciais do Spotify no frontend, ou commitar `.env`.
- Criar exceções nas regras de fronteira do ESLint para "fazer passar". Mova o código para a camada certa.
- Adicionar dependências sem pedir.
- Baixar os limites de cobertura ou pular passos do CI.
- Editar `frontend/AGENTS.md`: regenere com `npx ng g ai-config --tool=agents`.

## Antes de concluir uma tarefa

- [ ] Teste no nível certo de cada camada alterada (seção 6 de `docs/ARQUITETURA.md`).
- [ ] `npm run lint:boundaries && npm run lint && npm run test:coverage && npm run build` em `frontend/`; `npm run test:coverage` em `api/`; `npm run e2e` se a tela mudou.
- [ ] Decisão nova → seção em `docs/DECISOES.md`; estrutura nova → `docs/ARQUITETURA.md`.

## Convenções

- Nomes com sufixo de tipo: `track-card.component.ts` (`TrackCardComponent`), `track-api.service.ts`, `duration.pipe.ts`. Use `ng generate`: o `angular.json` já está configurado para esse estilo.
- O projeto é Angular **21**: não use APIs da v22 (`@Service()`, Signal Forms). As skills `angular/skills` não estão instaladas por isso.
- Commits em Conventional Commits, em português: `feat(frontend): ...`, `test(api): ...`.
- Código e nomes técnicos em inglês; textos da interface, documentação e commits em português.
- Toda decisão relevante entra em `docs/DECISOES.md`: contexto, decisão, o que foi descartado e como verificar.

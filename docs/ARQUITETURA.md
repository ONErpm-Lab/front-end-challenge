# Arquitetura

Como o projeto está organizado **hoje** e como acrescentar código sem quebrar as regras. É a primeira leitura de quem chega, pessoa ou agente de IA. O porquê de cada decisão está em [DECISOES.md](DECISOES.md).

---

## 1. Visão geral

```
Navegador ──▶ Angular (frontend/) ──/api──▶ BFF Express (api/) ──▶ Spotify Web API
                                                   └─ modo mock: catálogo de demonstração
```

| Peça | Responsabilidade | Não faz |
|---|---|---|
| `frontend/` | Tela, estado da tela, chamadas a `/api` | Não conhece o Spotify nem credenciais |
| `api/` | Token do Spotify, busca por ISRC, mapeamento, modo mock; em produção, também serve o build do Angular | Não guarda dados |

---

## 2. Frontend: uma feature por pasta (vertical slice)

```
src/app/
├── features/<feature>/          tudo de uma funcionalidade junto (nome no plural: tracks, artists)
│   ├── pages/                   tela: lê a porta do store e repassa ações
│   ├── components/              peças de UI: input()/output(), sem dados próprios
│   ├── ports/                   CONTRATOS: interfaces + InjectionToken
│   ├── store/                   estado da feature (NgRx Signal Store) — implementa a porta do store
│   ├── services/                requisições HTTP — implementam a porta de dados
│   ├── models/                  tipos e Value Objects (TypeScript puro)
│   ├── utils/                   funções puras (formatar, ordenar, dados fixos)
│   └── <feature>.providers.ts   raiz de composição: liga cada porta à sua implementação
├── shared/                      vocabulário comum, sem conhecer nenhuma feature
│   ├── components/  (alert)     icons/   pipes/ (duration)   utils/   models/ (LoadStatus)
├── testing/  → src/testing/     fábricas de dados para testes (build<Entidade>())
└── app.component.ts             monta a página (ainda sem router)
```

### Quem pode depender de quem

```
                 ┌──────────────── <feature>.providers.ts ────────────────┐
                 │  (único lugar que conhece as implementações)           │
                 ▼                                                        ▼
pages / components ──▶ ports/ ◀── store/ ──▶ ports/ ◀── services/ ──▶ HTTP
        │                (porta do store)        (porta de dados)
        └──────────────▶ models/ · utils/ · shared/  (puros, sem framework)
```

| Camada | Pode importar | **Não** pode importar (o lint bloqueia) |
|---|---|---|
| `pages/`, `components/` | `ports/`, `models/`, `utils/`, `@shared/*`, `<feature>.providers.ts` (só a página) | `store/`, `*-api.service`, `HttpClient` |
| `store/` | `ports/`, `models/`, `utils/`, `@shared/*` | `components/`, `pages/`, `*-api.service`, `HttpClient` |
| `ports/` | `models/`, `@shared/models`, `@angular/core` (InjectionToken), tipos do RxJS | `store/`, `services/`, `components/`, `pages/` |
| `services/` | `ports/`, `models/`, `utils/`, `HttpClient` | `store/`, `components/`, `pages/` |
| `models/`, `utils/`, `shared/models`, `shared/utils` | outros arquivos puros | `@angular/*`, `rxjs`, `components/`, `pages/` |
| `shared/` | `shared/` | qualquer `@features/*` |
| qualquer arquivo de feature | alias `@shared/*`, `@features/*`, `@testing/*` | `../../../` ou mais fundo |

`npm run lint:boundaries` simula uma violação de cada linha da tabela e falha se alguma passar. As regras valem automaticamente para qualquer pasta `features/<nome>/`: não é preciso mexer no ESLint.

### O fluxo de dados (feature `tracks`)

```
TracksPageComponent ──inject(TRACKS_STORE)──▶ TracksSignalStore ──inject(TRACKS_REPOSITORY)──▶ TrackApiService ──▶ /api
     providers: [provideTracksFeature()]
```

1. A página declara `providers: [provideTracksFeature()]`: o estado nasce e morre com a tela.
2. A página injeta a **porta** `TRACKS_STORE`, nunca a classe do store.
3. O store injeta a **porta** `TRACKS_REPOSITORY`, nunca o serviço HTTP.
4. `tracks.providers.ts` é o único arquivo que importa `TracksSignalStore` e `TrackApiService`.

---

## 3. Princípios: SOLID e camadas

**Estilo:** *vertical slices* (uma pasta por funcionalidade) com **ports & adapters** dentro de cada uma. Cada princípio abaixo aponta para onde está no código e como é verificado.

| Princípio | Onde está | Como é verificado |
|---|---|---|
| **S** — responsabilidade única | Página = apresentação · Signal Store = estado · `*-api.service` = HTTP · `utils/` e `models/` = regras puras | ESLint: cada camada é proibida de importar as outras |
| **O** — aberto/fechado | Trocar o Spotify real pelo mock **não altera** o serviço, a regra do BR nem o frontend: entra outra implementação do mesmo cliente | `SPOTIFY_MODE=mock\|live` |
| **L** — substituição de Liskov | O cliente mock substitui o real com o mesmo contrato (`findTrackByIsrc`); o Signal Store cumpre a interface `TracksStorePort` | Os testes do mock passam pelo mesmo serviço; o compilador confere a interface (`useFactory` tipado) |
| **I** — segregação de interfaces | Interfaces mínimas: a de dados tem um método; a do store expõe só o que a página usa | Revisão de código |
| **D** — inversão de dependência | A página depende de `TRACKS_STORE` e o store de `TRACKS_REPOSITORY` (`InjectionToken`); só `provideTracksFeature()` conhece as classes | ESLint + `npm run lint:boundaries` |

**Equivalência com as camadas clássicas** (os nomes das pastas mudam, as responsabilidades não):

| Camada clássica | Aqui |
|---|---|
| Domínio | `models/` (inclui o Value Object `Isrc`) e `utils/`: TypeScript puro, sem Angular nem RxJS |
| Aplicação | `store/` |
| Portas | `ports/` |
| Infraestrutura (adaptadores) | `services/` e o BFF `api/` |
| Apresentação | `pages/` e `components/` |

**Sobre DDD:** usamos apenas o que o problema pede: um **Value Object** para o ISRC, a regra de negócio como função pura e o BFF como camada que traduz o modelo do Spotify para o nosso. Por ser uma tela de leitura, não há entidades com comportamento nem agregados.

---

## 4. Onde coloco isto?

### Nomes: feature no plural, entidade no singular

| Peça | Usa | Exemplo (feature `artists`, entidade `Artist`) |
|---|---|---|
| Pasta, store, portas, providers, página | **plural** (a feature) | `artists.store.ts` · `ArtistsSignalStore` · `artists-store.port.ts` · `ARTISTS_STORE` · `artists-repository.port.ts` · `provideArtistsFeature()` · `artists-page.component.ts` |
| Modelo, serviço HTTP, componente de um item | **singular** (a entidade) | `artist.model.ts` · `Artist` · `artist-api.service.ts` · `ArtistApiService` · `artist-card.component.ts` |

### Tabela de decisão

| Vou criar… | Vai em | Regras |
|---|---|---|
| Uma tela | `pages/<feature>-page/` | Injeta só a porta; provê `provide<Feature>Feature()` |
| Uma peça visual da feature | `components/<entidade>-<papel>/` | `input()`/`output()`, `OnPush`; sem HTTP nem store |
| Uma peça visual genérica | `@shared/components/` | Não conhece nenhuma feature |
| Estado ou ação | `store/` + o contrato em `ports/<feature>-store.port.ts` | Padrão de status abaixo; `patchState` só dentro das ações |
| Uma chamada HTTP | `services/<entidade>-api.service.ts` + o contrato em `ports/<feature>-repository.port.ts` | O sufixo `-api.service` é obrigatório (o lint depende dele) |
| Um valor com regra | `models/<nome>.value-object.ts` | Veja "Value Object ou string?" |
| Um tipo de dados | `models/<entidade>.model.ts` | Propriedades `readonly` |
| Uma função pura (formatar, ordenar) | `utils/` ou `@shared/utils/` | Sem Angular, sem RxJS |
| Um pipe genérico | `@shared/pipes/` | A lógica numa função exportada e testável |
| Dados fixos do domínio | `utils/` | Valide com o Value Object ao carregar o módulo |
| Fábrica de dados para teste | `src/testing/<entidade>.fixture.ts` | `build<Entidade>(overrides)` (ex.: `buildTrack`) |

### Padrões que valem para toda feature

- **Status de carregamento:** o store tem `status: LoadStatus` (`@shared/models/load-status`: `'idle' | 'loading' | 'ready' | 'error'`), nunca `loading: boolean` + `error` soltos. A página faz `@switch (store.status())`.
- **Derivados no store, não na tela:** ordenação, filtros e contagens são `withComputed`, e a porta expõe **o derivado**: a página lê `store.artists()` já ordenado. A ordenação em si é uma função pura em `utils/`, com `Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })`.
- **Mensagens na tela: cada uma com o peso que merece.**
  - **Erro que exige ação** → `<app-alert>` de `@shared/components/alert` (`role="alert"`), com `actionLabel="Tentar de novo" (action)="retry()"`. É a única caixa da página.
  - **Contexto ou limitação** (modo demonstração, recurso indisponível) → `<app-info-chip>` de `@shared/components/info-chip`: rótulo curto sempre visível e explicação num balão sob demanda (`label`, `heading`, `tone="warn" | "muted"`, conteúdo projetado).
  - **Ausência dentro de uma lista** (item não encontrado) → um cartão "fantasma" no próprio lugar da lista (ex.: `app-track-not-found`), mais o total no resumo ("9 de 10").
- **Value Object ou string?** Use VO quando o valor tem **formato ou invariante a validar** (código ISRC, código ISO de país, e-mail, faixa de valores). Texto livre (nome, título) fica `string`. Molde de VO:

```ts
export class CountryCode {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }
  static create(raw: string): CountryCode {
    const value = raw.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(value)) throw new Error(`Código de país inválido: "${raw}"`);
    return new CountryCode(value);
  }
  equals(other: CountryCode): boolean {
    return this.value === other.value;
  }
}
```

O exemplo completo é `features/tracks/models/isrc.value-object.ts`. O VO vale **dentro do frontend**; o que vem da API fica como tipo simples no `*.model.ts`. A conversão acontece numa função pura de `utils/` ou num `computed` (do store ou do componente), **nunca no template**. Exemplo: `isrcLabel = computed(() => Isrc.create(track().isrc).format())`.

---

## 5. Receita: criar uma feature nova

Exemplo com a feature `artists` (entidade `Artist`). Troque pelos seus nomes, seguindo a regra plural/singular acima.

**Passo 0. Backend primeiro.** Se o endpoint `/api/<feature>` ainda não existe, crie-o no BFF (`api/src/<feature>/`) **com o cenário no mock** (`api/src/mock/`). O frontend nunca simula dados no próprio código; ele sempre fala com `/api`, real ou em modo mock.

**Passo 1. Gere os arquivos com o CLI.** O `angular.json` já aplica os sufixos e o SCSS.

```bash
cd frontend
npx ng g c features/artists/pages/artists-page   # gera .ts, .html, .scss e .spec.ts
npx ng g s features/artists/services/artist-api   # gera artist-api.service.ts e o .spec.ts
```

Apague o `.scss` se a tela não tiver estilo próprio, e tire `styleUrl` do componente. Os `.spec.ts` gerados só testam "should create": **substitua-os** pelos moldes da seção 6. Os demais arquivos (modelo, portas, store, providers) são criados à mão.

**Passo 2. Modelo** (`models/artist.model.ts`):

```ts
export interface Artist {
  readonly id: string;
  readonly name: string;
}
```

**Passo 3. Portas.**

```ts
// ports/artists-repository.port.ts
import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Artist } from '../models/artist.model';

export interface ArtistsRepository {
  getArtists(): Observable<readonly Artist[]>;
}
export const ARTISTS_REPOSITORY = new InjectionToken<ArtistsRepository>('ArtistsRepository');
```

```ts
// ports/artists-store.port.ts
import { InjectionToken, type Signal } from '@angular/core';
import type { LoadStatus } from '@shared/models/load-status';
import type { Artist } from '../models/artist.model';

export interface ArtistsStorePort {
  readonly status: Signal<LoadStatus>;
  readonly artists: Signal<readonly Artist[]>; // já ordenado (derivado)
  load(): void;
}
export const ARTISTS_STORE = new InjectionToken<ArtistsStorePort>('ArtistsStore');
```

**Passo 4. Serviço HTTP** (`services/artist-api.service.ts`):

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Artist } from '../models/artist.model';
import type { ArtistsRepository } from '../ports/artists-repository.port';

@Injectable({ providedIn: 'root' })
export class ArtistApiService implements ArtistsRepository {
  private readonly http = inject(HttpClient);

  getArtists(): Observable<readonly Artist[]> {
    return this.http.get<Artist[]>('/api/artists');
  }
}
```

**Passo 5. Store** (`store/artists.store.ts`):

```ts
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import type { LoadStatus } from '@shared/models/load-status';
import { pipe, switchMap, tap } from 'rxjs';
import type { Artist } from '../models/artist.model';
import { ARTISTS_REPOSITORY } from '../ports/artists-repository.port';
import { sortArtistsByName } from '../utils/sort-artists';

interface ArtistsState {
  status: LoadStatus;
  items: readonly Artist[];
}

export const ArtistsSignalStore = signalStore(
  withState<ArtistsState>({ status: 'idle', items: [] }),
  withComputed(({ items }) => ({
    artists: computed(() => sortArtistsByName(items())),
  })),
  withMethods((store, repository = inject(ARTISTS_REPOSITORY)) => ({
    /** switchMap: um novo load cancela o anterior. */
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap(() =>
          repository.getArtists().pipe(
            tapResponse({
              next: (items) => patchState(store, { status: 'ready', items }),
              error: () => patchState(store, { status: 'error', items: [] }),
            }),
          ),
        ),
      ),
    ),
  })),
  // Carrega ao nascer: provido na página, o store vive e morre com a tela.
  withHooks({ onInit: (store) => store.load() }),
);
```

**Passo 6. Raiz de composição** (`artists.providers.ts`):

```ts
import { inject, type Provider } from '@angular/core';
import { ARTISTS_REPOSITORY } from './ports/artists-repository.port';
import { ARTISTS_STORE, type ArtistsStorePort } from './ports/artists-store.port';
import { ArtistApiService } from './services/artist-api.service';
import { ArtistsSignalStore } from './store/artists.store';

export function provideArtistsFeature(): Provider[] {
  return [
    ArtistsSignalStore,
    // o tipo de retorno faz o compilador conferir que o store cumpre a porta
    { provide: ARTISTS_STORE, useFactory: (): ArtistsStorePort => inject(ArtistsSignalStore) },
    { provide: ARTISTS_REPOSITORY, useExisting: ArtistApiService },
  ];
}
```

**Passo 7. Página** (`pages/artists-page/`):

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { provideArtistsFeature } from '../../artists.providers';
import { ARTISTS_STORE } from '../../ports/artists-store.port';

@Component({
  selector: 'app-artists-page',
  imports: [AlertComponent],
  providers: [provideArtistsFeature()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './artists-page.component.html',
})
export class ArtistsPageComponent {
  protected readonly store = inject(ARTISTS_STORE);

  protected retry(): void {
    this.store.load();
  }
}
```

```html
@switch (store.status()) {
  @case ('loading') { <p aria-busy="true">Carregando…</p> }
  @case ('error') {
    <app-alert heading="Não foi possível carregar os artistas" actionLabel="Tentar de novo" (action)="retry()">
      Tente novamente em instantes.
    </app-alert>
  }
  @case ('ready') {
    <ul>
      @for (artist of store.artists(); track artist.id) {
        <li>{{ artist.name }}</li>
      } @empty {
        <li>Nenhum artista encontrado.</li>
      }
    </ul>
  }
}
```

A página não decide quando carregar: o `withHooks` do store dispara o `load()` ao ser criado, junto com a página. O estado `idle` (antes desse primeiro `load()`) não renderiza nada de propósito. Sem rotas, não há resolver: ele também bloquearia a pintura até os dados chegarem, sem esqueletos de carregamento.

**Passo 8. Montagem.** Hoje `app.component.ts` monta uma única página, sem router. Com uma segunda tela, introduza o router com rotas *lazy* (`loadComponent`) e monte cada página na sua rota.

**Passo 9. Testes** (seção 6) e **verificação** com a mesma sequência do CI:

```bash
npm run lint:boundaries && npm run lint && npm run test:coverage && npm run build && npm run e2e
```

---

## 6. Testes

**Ferramenta:** Vitest pelo builder do Angular (`ng test`). `describe`, `it`, `expect` e `vi` são **globais** (sem import). Os testes ficam ao lado do arquivo (`*.spec.ts`); os E2E ficam em `frontend/e2e/*.e2e.ts` (Playwright).

**TypeScript estrito:** `noUncheckedIndexedAccess` está ligado, então `lista[0]` é `T | undefined`. Nos testes use `lista[0]?.nome`; no código, trate o `undefined`.

**Cobertura:** `npm run test:coverage` exige **90% por arquivo** em `features/*/{store,models,utils}`, `shared/pipes` e `shared/utils`. Páginas, componentes e serviços não entram na métrica: são cobertos pelos testes de integração e E2E. O limite conta **ramos**: um `??` ou `if` defensivo que nenhum teste exercita reprova o arquivo. Teste o ramo, ou remova-o se ele for impossível.

| Camada | Como testar |
|---|---|
| `models/`, `utils/` | Chamada direta, sem TestBed |
| `services/` | `provideHttpClient()` + `provideHttpClientTesting()` e `HttpTestingController` |
| `store/` | A composição real + a porta de dados trocada por um dublê; injete a **porta** do store |
| `pages/` | Integração: página + componentes + HTTP simulado |
| Fluxo completo | Playwright com o Page Object de `e2e/` |

**Molde de teste do store** (o provider declarado **depois** substitui o de `provideArtistsFeature()`):

```ts
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { buildArtist } from '@testing/artist.fixture';
import { ARTISTS_REPOSITORY } from '../ports/artists-repository.port';
import { ARTISTS_STORE } from '../ports/artists-store.port';
import { provideArtistsFeature } from '../artists.providers';

describe('ArtistsSignalStore (via porta ARTISTS_STORE)', () => {
  it('fica ready com os artistas ordenados', () => {
    const getArtists = vi.fn().mockReturnValue(of([buildArtist({ name: 'Zé' }), buildArtist({ name: 'Ana' })]));
    TestBed.configureTestingModule({
      providers: [provideArtistsFeature(), { provide: ARTISTS_REPOSITORY, useValue: { getArtists } }],
    });
    const store = TestBed.inject(ARTISTS_STORE);

    store.load();

    expect(store.status()).toBe('ready');
    expect(store.artists().map((a) => a.name)).toEqual(['Ana', 'Zé']);
  });
});
```

**Molde de teste de página** (a aplicação é *zoneless*: espere com `whenStable()`, não com `detectChanges()`):

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ArtistsPageComponent } from './artists-page.component';

describe('ArtistsPageComponent (integração)', () => {
  it('mostra o alerta quando a API falha', async () => {
    TestBed.configureTestingModule({
      imports: [ArtistsPageComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ArtistsPageComponent);
    await fixture.whenStable();

    TestBed.inject(HttpTestingController).expectOne('/api/artists').flush({}, { status: 503, statusText: 'x' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
```

**Fábrica de dados** (`src/testing/artist.fixture.ts`), uma por entidade, usada pelos testes de todas as camadas:

```ts
import type { Artist } from '@features/artists/models/artist.model';

export function buildArtist(overrides: Partial<Artist> = {}): Artist {
  return { id: '1', name: 'Artista', ...overrides };
}
```

---

## 7. Convenções rápidas

- **Angular 21 (LTS):** standalone, zoneless, signals, `input()`/`output()`, control flow `@if`/`@for`, `OnPush`. Não use APIs da v22 (`@Service()`, Signal Forms).
- **Sufixos:** `*.component.ts`, `*.service.ts`, `*.pipe.ts`, `*.store.ts`, `*.port.ts`, `*.value-object.ts`, `*.model.ts`, `*.fixture.ts`.
- **Imports de tipo** com `import type` (`verbatimModuleSyntax`).
- **Idiomas:** código em inglês; interface, documentação e commits em português.
- **Commits:** Conventional Commits (`feat(frontend): …`).
- **Decisão nova** → uma seção em [DECISOES.md](DECISOES.md); **estrutura nova** → esta guia; **regra nova** → `AGENTS.md` e, se der, uma regra no ESLint.

## 8. API (BFF)

| Pasta | Responsabilidade |
|---|---|
| `src/spotify/` | Token (com cache e pedido compartilhado) e busca no Spotify, com timeout |
| `src/tracks/` | Regra de disponibilidade no BR (função pura), mapeamento e rotas HTTP |
| `src/mock/` | Cliente simulado com o **mesmo contrato** do real + capas e prévias geradas |
| `src/create-app.js` | Monta o Express (testável sem abrir porta); serve o build em produção |
| `src/compose.js` | Composição: escolhe entre real e mock (`SPOTIFY_MODE`) |
| `src/server.js` / `src/index.js` | Entradas: `npm start` (local) / Vercel (exporta a app; a Vercel exige que importe o `express`) |

Um cenário novo do mock entra no catálogo (`src/mock/mock-catalog.js`), nunca como `if (mock)` no código.

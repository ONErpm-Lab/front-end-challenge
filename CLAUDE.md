You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

# Project: ONErpm ISRC challenge

Public page that resolves ISRC codes against the Spotify Web API. The challenge brief
is `docs/README.md` — it is the source of truth for requirements and must not be edited.

## Stack

Angular 21 (LTS) · TypeScript strict · RxJS 7 · Tailwind CSS v4 · Vitest ·
Cloudflare Pages Function for the token exchange.

Angular 21 specifics that apply here: standalone (no NgModules), zoneless change
detection, `OnPush` everywhere, native control flow, `input()`/`output()`, `inject()`.

## Two runtimes live in this repo

- `src/` — Angular, runs in the browser.
- `functions/` — Cloudflare Workers runtime. Web standards only: **no `process`, no
  Node built-ins, no Angular imports**. Config arrives via `context.env`.

Never share code across that boundary except plain types. ESLint enforces both halves.

## Layering

`features → shared → core`, one direction only:

- `core/` — app-wide singletons (config token, HTTP interceptors, token store, error
  model). Must not import from `features/`.
- `shared/` — presentational components and pure pipes. Domain-agnostic: if it knows
  what a track is, it does not belong here.
- `features/<name>/` — `domain/` (models, contracts, rules), `data/` (DTOs, mapper,
  HTTP), `ui/` (container + presentational).

`no-restricted-imports` in `eslint.config.js` fails the build on violations. If a rule
is in the way, the design is wrong — do not weaken the rule.

## The seam that matters

`TrackRepository` is an abstract class used as a DI token. Containers inject the
contract; `SpotifyTrackRepository` is bound in `tracks.routes.ts`. Consequences to
preserve:

- A component must never inject `SpotifyTrackRepository`, `HttpClient`, or touch a DTO.
- Adding a provider means adding an implementation, not editing the consumer.
- Container tests use `FakeTrackRepository`, never HTTP.

## RxJS vs signals

RxJS owns async: token caching, request fan-out, `retryBackoff`, `catchError`.
Signals own view state. Convert once, at the container boundary, with `toSignal()`.
Do not wrap signals back into observables to keep a pipeline going.

## Errors

`core/http/http-error.interceptor.ts` is the **only** place that maps
`HttpErrorResponse` to `AppError`. Nothing above it may reference HTTP status codes.

Distinguish missing data from an outage: an unresolvable ISRC drops out of the batch,
but a provider failure must propagate — the spec requires a visible alert when the
integration is unavailable. Do not add a `catchError` that swallows both.

## Styling

Tailwind utilities in templates. No SCSS, and **no `@apply`** — component stylesheets
sit outside the Tailwind context, so it silently fails there. If a utility string
repeats, extract a component, not a CSS class.

Responsive is a requirement, not a nice-to-have: mobile-first, verify at 375px.

## Secrets

Never in `src/` — everything there is compiled into a public bundle. `SPOTIFY_CLIENT_ID`
and `SPOTIFY_CLIENT_SECRET` are read only by `functions/api/spotify-token.ts`. The
function returns the access token and nothing else, and never echoes upstream error
bodies to the browser.

## Testing

Colocated `*.spec.ts`. Vitest with jsdom, zoneless (`provideZonelessChangeDetection()`
in `TestBed`, and `await fixture.whenStable()` instead of `detectChanges()`).

- Pure logic (mapper, pipe, sorter) — plain unit tests, no TestBed.
- Repositories and interceptors — `HttpTestingController`, always with
  `afterEach(() => httpMock.verify())`.
- Containers — `FakeTrackRepository`.

Set `maxRetries: 1` in test configs; real backoff timers make suites slow and flaky.

## Spotify API constraints (verified against the live API)

These are settled, not open questions. Re-deriving them from the docs will mislead
you — the documented fields are not what the API actually returns for a recently
created app:

1. **`preview_url` is absent**, not null — the field is gone from every response.
   There is no audio file to hand an `<audio>` element, so `TrackPlayer` falls back
   to Spotify's embed iframe, which must be **152px tall or it renders blank**. The
   `<audio>` branch is kept only for tokens that still receive the field.
2. **`available_markets` is absent too**, including from `GET /v1/tracks/{id}`. BR
   availability comes from **`is_playable`, which Spotify returns only when the
   request sends a `market` parameter**. So `market` is required, not forbidden —
   dropping it silently marks every track unavailable.
3. **No usable batch endpoint.** `GET /v1/tracks?ids=` answers 403 for this app tier,
   so lookups fan out one search per ISRC with bounded concurrency.
4. **Web API access requires the app owner to hold active Spotify Premium.** Without
   it every endpoint answers 403, whatever the credentials.

## Tooling notes

- npm **11+** is required to resolve the dependency tree (npm 10 crashes on the Vitest
  peer graph). `npm ci` works on either, since it installs straight from the lockfile.
- Install scripts are allow-listed in `package.json` under `allowScripts`.

## Commits

Conventional Commits, enforced by commitlint. Scopes: `core`, `shared`, `tracks`,
`api`, `config`, `deps`, `docs`, `test`, `ci`.

**Never commit or push unless explicitly asked.** Report what changed and leave files
unstaged.

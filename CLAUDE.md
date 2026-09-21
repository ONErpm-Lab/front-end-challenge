# Engineering notes — ONErpm ISRC challenge

Conventions, constraints and decisions that are not obvious from reading the code.
The challenge brief is [`docs/README.md`](docs/README.md) — it is the source of truth
for requirements and must not be edited.

## Stack

Angular 21 (LTS) · TypeScript strict · RxJS 7 · Tailwind CSS v4 · Vitest ·
Cloudflare Pages Function for the token exchange.

Zoneless change detection, standalone components, no NgModules.

## Conventions

TypeScript is strict; `any` is not used, `unknown` is. Components are standalone with
`OnPush`, `input()`/`output()` over decorators, `inject()` over constructor injection,
`computed()` for derived state, and native control flow (`@if`, `@for`, `@switch`).
`ngClass` and `ngStyle` are not used — bind `class` and `style` directly. Album art
goes through `NgOptimizedImage`. Templates stay declarative: logic belongs in the
component.

Accessibility is checked, not just intended: `angular-eslint`'s template-accessibility
rules run as part of `npm run lint`, and the target is WCAG AA.

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

Two suites, because there are two runtimes. `npm test` runs both.

- **App** — `ng test`, Vitest with jsdom, zoneless: use
  `provideZonelessChangeDetection()` in `TestBed` and `await fixture.whenStable()`
  rather than `detectChanges()`. Specs sit beside the code.
  - Pure logic (mapper, pipes, sorter) — plain unit tests, no TestBed.
  - Repositories and interceptors — `HttpTestingController`, always with
    `afterEach(() => httpMock.verify())`.
  - Containers — `FakeTrackRepository`, never HTTP.
- **Functions** — `npm run test:functions`, Vitest in a node environment with `fetch`
  mocked. These specs live in `tests/functions/`, _not_ beside the code, because
  Cloudflare Pages routes every file under `functions/` and test files must never be
  published.

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

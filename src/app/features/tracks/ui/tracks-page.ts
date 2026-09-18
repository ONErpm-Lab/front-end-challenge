import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, type Observable } from 'rxjs';
import { appError, isAppError, type AppError } from '../../../core/errors/app-error';
import { Alert } from '../../../shared/ui/alert/alert';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { REQUESTED_ISRCS } from '../domain/isrc-catalog';
import { sortByTitle } from '../domain/sort-tracks';
import type { Track } from '../domain/track';
import { TrackRepository } from '../domain/track-repository';
import { TrackCard } from './track-card';

/** What the template needs to know, and nothing more. */
type TracksView =
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly tracks: readonly Track[] }
  | { readonly status: 'failed'; readonly error: AppError };

/**
 * Container component: owns the async work, hands plain data to presentational
 * children, and never touches HTTP itself.
 *
 * This is where the RxJS/signals boundary sits — RxJS runs the request, `toSignal`
 * converts the result once, and the template reads signals from there down.
 */
@Component({
  selector: 'onerpm-tracks-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Alert, Spinner, TrackCard],
  template: `
    <section class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Faixas</h1>
        <p class="mt-1 text-sm text-slate-600">
          Dados obtidos a partir dos códigos ISRC informados no contrato.
        </p>
      </header>

      @switch (view().status) {
        @case ('loading') {
          <onerpm-spinner label="Buscando faixas..." />
        }

        @case ('failed') {
          <onerpm-alert
            title="Não foi possível carregar as faixas"
            [message]="failure()?.message ?? ''"
            tone="error"
          />
        }

        @case ('loaded') {
          @if (tracks().length) {
            @if (missingCount(); as missing) {
              <!-- Partial success is not failure, but hiding it would be dishonest. -->
              <div class="mb-4">
                <onerpm-alert
                  title="Algumas faixas não foram encontradas"
                  [message]="
                    missing +
                    ' dos ' +
                    requestedCount +
                    ' códigos ISRC não retornaram resultado no Spotify.'
                  "
                  tone="warning"
                />
              </div>
            }

            <ul class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              @for (track of tracks(); track track.isrc; let i = $index) {
                <li class="h-full">
                  <!-- The first row is above the fold, so its cover is the LCP candidate. -->
                  <onerpm-track-card [track]="track" [priority]="i < 3" />
                </li>
              }
            </ul>
          } @else {
            <onerpm-alert
              title="Nenhuma faixa encontrada"
              message="Nenhum dos códigos ISRC informados retornou resultado no Spotify."
              tone="info"
            />
          }
        }
      }
    </section>
  `,
})
export class TracksPage {
  private readonly repository = inject(TrackRepository);

  protected readonly requestedCount = REQUESTED_ISRCS.length;

  protected readonly view = toSignal(this.loadTracks(), {
    initialValue: { status: 'loading' } as TracksView,
  });

  protected readonly tracks = computed<readonly Track[]>(() => {
    const current = this.view();
    return current.status === 'loaded' ? current.tracks : [];
  });

  protected readonly failure = computed<AppError | null>(() => {
    const current = this.view();
    return current.status === 'failed' ? current.error : null;
  });

  /** Zero is falsy, which is exactly the "say nothing" case for the `@if` above. */
  protected readonly missingCount = computed(() => this.requestedCount - this.tracks().length);

  private loadTracks(): Observable<TracksView> {
    return this.repository.findByIsrcs(REQUESTED_ISRCS).pipe(
      // Sorting is a domain rule, applied once, away from both HTTP and the template.
      map((tracks) => ({ status: 'loaded', tracks: sortByTitle(tracks) }) as TracksView),
      startWith({ status: 'loading' } as TracksView),
      catchError((raw: unknown) => {
        const error = isAppError(raw)
          ? raw
          : appError('unknown', 'Ocorreu um erro inesperado.', raw);
        return of({ status: 'failed', error } as TracksView);
      }),
    );
  }
}

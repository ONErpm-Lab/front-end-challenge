import { TestBed } from '@angular/core/testing';
import { buildTrack } from '@testing/track.fixture';
import { NEVER, type Observable, of, Subject, throwError } from 'rxjs';
import { Isrc } from '../models/isrc.value-object';
import type { TracksResult } from '../models/track.model';
import { TRACKS_REPOSITORY } from '../ports/tracks-repository.port';
import { TRACKS_STORE, type TracksStorePort } from '../ports/tracks-store.port';
import { IntegrationUnavailableError } from '../services/track-api.service';
import { provideTracksFeature } from '../tracks.providers';

describe('TracksSignalStore (via porta TRACKS_STORE)', () => {
  let getTracks: ReturnType<typeof vi.fn<(isrcs: readonly Isrc[]) => Observable<TracksResult>>>;
  let store: TracksStorePort;

  beforeEach(() => {
    // O store carrega ao nascer; NEVER deixa essa primeira carga pendente até cada teste definir a resposta.
    getTracks = vi.fn(() => NEVER);
    TestBed.configureTestingModule({
      // A mesma composição da app; só a porta de dados é trocada por um dublê.
      providers: [provideTracksFeature(), { provide: TRACKS_REPOSITORY, useValue: { getTracks } }],
    });
    store = TestBed.inject(TRACKS_STORE);
  });

  it('carrega sozinho ao ser criado, com os ISRCs do contrato', () => {
    expect(getTracks).toHaveBeenCalledTimes(1);
    expect(getTracks).toHaveBeenCalledWith(store.isrcs);
    expect(store.status()).toBe('loading');
  });

  it('expõe as faixas ordenadas e os contadores após carregar', () => {
    getTracks.mockReturnValue(
      of({
        tracks: [
          buildTrack({ isrc: 'B', title: 'Zebra', availableInBrazil: false }),
          buildTrack({ isrc: 'A', title: 'Água' }),
        ],
        notFound: [Isrc.create('QZNJX2078148')],
        failed: [Isrc.create('BRC310600002')],
        source: 'mock',
      }),
    );

    store.load();

    expect(store.status()).toBe('ready');
    expect(store.tracks().map((t) => t.title)).toEqual(['Água', 'Zebra']);
    expect(store.availableInBrazil()).toBe(1);
    expect(store.notFound().map(String)).toEqual(['QZNJX2078148']);
    expect(store.failed().map(String)).toEqual(['BRC310600002']);
    expect(store.hasNoPreviews()).toBe(true);
    expect(store.source()).toBe('mock');
  });

  it('fica em loading enquanto a requisição não termina', () => {
    getTracks.mockReturnValue(new Subject<TracksResult>());

    store.load();

    expect(store.status()).toBe('loading');
  });

  it('vai para error quando a integração está indisponível', () => {
    getTracks.mockReturnValue(throwError(() => new IntegrationUnavailableError()));

    store.load();

    expect(store.status()).toBe('error');
    expect(store.tracks()).toEqual([]);
  });

  it('inverte a ordenação', () => {
    getTracks.mockReturnValue(
      of({
        tracks: [
          buildTrack({ isrc: 'A', title: 'Água' }),
          buildTrack({ isrc: 'B', title: 'Zebra' }),
        ],
        notFound: [],
        failed: [],
        source: 'spotify',
      }),
    );
    store.load();

    store.toggleDirection();

    expect(store.direction()).toBe('desc');
    expect(store.tracks()[0]?.title).toBe('Zebra');

    store.toggleDirection();
    expect(store.direction()).toBe('asc');
  });

  it('um novo load cancela a requisição anterior (switchMap)', () => {
    const first = new Subject<TracksResult>();
    getTracks.mockReturnValueOnce(first).mockReturnValueOnce(
      of({
        tracks: [buildTrack({ title: 'Nova' })],
        notFound: [],
        failed: [],
        source: 'spotify',
      }),
    );

    store.load();
    store.load();
    first.next({
      tracks: [buildTrack({ title: 'Antiga' })],
      notFound: [],
      failed: [],
      source: 'spotify',
    });

    expect(store.tracks().map((t) => t.title)).toEqual(['Nova']);
    expect(first.observed).toBe(false);
  });
});

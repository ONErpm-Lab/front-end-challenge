import { Isrc } from '../models/isrc.value-object';
import type { TracksResult } from '../models/track.model';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { buildTrack } from '@testing/track.fixture';
import { IntegrationUnavailableError, TrackApiService } from './track-api.service';

describe('TrackApiService', () => {
  let service: TrackApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TrackApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('separa faixas encontradas dos ISRCs inexistentes (404)', () => {
    let result: unknown;
    service
      .getTracks([Isrc.create('AAAAA0000001'), Isrc.create('AAAAA0000002')])
      .subscribe((r) => (result = r));

    http.expectOne('/api/tracks/AAAAA0000001').flush(buildTrack({ isrc: 'AAAAA0000001' }));
    http.expectOne('/api/tracks/AAAAA0000002').flush({}, { status: 404, statusText: 'Not Found' });

    expect(result).toEqual({
      tracks: [buildTrack({ isrc: 'AAAAA0000001' })],
      notFound: [Isrc.create('AAAAA0000002')],
      failed: [],
      source: 'spotify',
    });
  });

  it('com a lista vazia, responde sem requisições em vez de nunca emitir', () => {
    let result: unknown;
    service.getTracks([]).subscribe((r) => (result = r));

    http.expectNone(() => true);
    expect(result).toEqual({ tracks: [], notFound: [], failed: [], source: null });
  });

  it('mantém as faixas carregadas quando só parte das consultas falha', () => {
    let result: TracksResult | undefined;
    service
      .getTracks([Isrc.create('AAAAA0000001'), Isrc.create('AAAAA0000002')])
      .subscribe((r) => (result = r));

    http.expectOne('/api/tracks/AAAAA0000001').flush(buildTrack({ isrc: 'AAAAA0000001' }));
    http
      .expectOne('/api/tracks/AAAAA0000002')
      .flush({}, { status: 503, statusText: 'Unavailable' });

    expect(result?.tracks.map((t) => t.isrc)).toEqual(['AAAAA0000001']);
    expect(result?.failed).toEqual([Isrc.create('AAAAA0000002')]);
    expect(result?.notFound).toEqual([]);
  });

  it('sinaliza integração indisponível quando todas as consultas falham', () => {
    let error: unknown;
    service
      .getTracks([Isrc.create('AAAAA0000001'), Isrc.create('AAAAA0000002')])
      .subscribe({ error: (e) => (error = e) });

    http
      .expectOne('/api/tracks/AAAAA0000001')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    http.expectOne('/api/tracks/AAAAA0000002').error(new ProgressEvent('error'));

    expect(error).toBeInstanceOf(IntegrationUnavailableError);
  });

  it('identifica o modo mock pelo cabeçalho X-Data-Source', () => {
    let result: TracksResult | undefined;
    service.getTracks([Isrc.create('AAAAA0000001')]).subscribe((r) => (result = r));

    http
      .expectOne('/api/tracks/AAAAA0000001')
      .flush(buildTrack({ isrc: 'AAAAA0000001' }), { headers: { 'X-Data-Source': 'mock' } });

    expect(result?.source).toBe('mock');
  });
});

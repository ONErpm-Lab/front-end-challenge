import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TracksResponse } from '../../../../contract/tracks.interfaces';
import { TracksApi } from './tracks-api';
import { TracksUnavailableError } from './tracks-unavailable-error';
import { TRACKS_REQUEST_TIMEOUT_MS, TRACKS_SERVER_REQUEST_TIMEOUT_MS } from './api.constants';
import { errorResult, foundResult, notFoundResult } from '../testing/builders';

function setup(platform: 'browser' | 'server' = 'browser') {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: PLATFORM_ID, useValue: platform },
    ],
  });
  return { api: TestBed.inject(TracksApi), http: TestBed.inject(HttpTestingController) };
}

/** Subscribes and captures the outcome, so assertions can run after the response is flushed. */
function capture<T>(source: { subscribe: (observer: object) => unknown }) {
  const outcome: { value?: T; error?: unknown; completed: boolean } = { completed: false };
  source.subscribe({
    next: (value: T) => (outcome.value = value),
    error: (error: unknown) => (outcome.error = error),
    complete: () => (outcome.completed = true),
  });
  return outcome;
}

describe('TracksApi', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.useRealTimers();
  });

  it('requests the BFF with the ISRCs as one comma-separated parameter', () => {
    const { api, http } = setup();

    api.lookup(['BR1SP1200071', 'BRC310600002']).subscribe();

    const request = http.expectOne((req) => req.url === '/api/tracks');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('isrc')).toBe('BR1SP1200071,BRC310600002');
    request.flush({ results: [] });
  });

  it('emits the results of the response', () => {
    const { api, http } = setup();
    const results = [
      foundResult('Louca'),
      notFoundResult('BR1SP1200070'),
      errorResult('BR1SP1200071'),
    ];

    const outcome = capture(api.lookup(['A']));
    http.expectOne((req) => req.url === '/api/tracks').flush({ results } satisfies TracksResponse);

    expect(outcome.value).toEqual(results);
    expect(outcome.completed).toBe(true);
  });

  it('does not call the server when there is nothing to look up', () => {
    const { api, http } = setup();

    const outcome = capture(api.lookup([]));

    expect(outcome.value).toEqual([]);
    http.expectNone('/api/tracks');
  });

  describe('failures become TracksUnavailableError, keeping the original error as the cause', () => {
    it.each([
      ['503 from the BFF (integration down)', 503],
      ['500 from the BFF', 500],
      ['400 from the BFF', 400],
      ['404 (no BFF behind the page)', 404],
    ])('%s', (_label, status) => {
      const { api, http } = setup();

      const outcome = capture(api.lookup(['A']));
      http
        .expectOne((req) => req.url === '/api/tracks')
        .flush({ code: 'integration_unavailable' }, { status, statusText: 'error' });

      expect(outcome.error).toBeInstanceOf(TracksUnavailableError);
      expect((outcome.error as TracksUnavailableError).cause).toMatchObject({ status });
    });

    it('a network error', () => {
      const { api, http } = setup();

      const outcome = capture(api.lookup(['A']));
      http.expectOne((req) => req.url === '/api/tracks').error(new ProgressEvent('error'));

      expect(outcome.error).toBeInstanceOf(TracksUnavailableError);
    });

    it('a BFF that never answers', () => {
      vi.useFakeTimers();
      const { api, http } = setup();

      const outcome = capture(api.lookup(['A']));
      const request = http.expectOne((req) => req.url === '/api/tracks');
      vi.advanceTimersByTime(TRACKS_REQUEST_TIMEOUT_MS + 1);

      expect(outcome.error).toBeInstanceOf(TracksUnavailableError);
      expect(request.cancelled).toBe(true);
    });

    it('gives up sooner on the server, where the page waits for the answer', () => {
      vi.useFakeTimers();
      const { api, http } = setup('server');

      const outcome = capture(api.lookup(['A']));
      http.expectOne((req) => req.url === '/api/tracks');
      vi.advanceTimersByTime(TRACKS_SERVER_REQUEST_TIMEOUT_MS + 1);

      expect(TRACKS_SERVER_REQUEST_TIMEOUT_MS).toBeLessThan(TRACKS_REQUEST_TIMEOUT_MS);
      expect(outcome.error).toBeInstanceOf(TracksUnavailableError);
    });

    it('does not time out a response that arrives in time', () => {
      vi.useFakeTimers();
      const { api, http } = setup();

      const outcome = capture(api.lookup(['A']));
      const request = http.expectOne((req) => req.url === '/api/tracks');
      vi.advanceTimersByTime(TRACKS_REQUEST_TIMEOUT_MS - 1);
      request.flush({ results: [] });

      expect(outcome.error).toBeUndefined();
      expect(outcome.value).toEqual([]);
    });
  });
});

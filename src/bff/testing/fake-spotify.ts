import { FetchFn } from '../shared/shared.types';
import { SpotifyTrack } from '../spotify/spotify.interfaces';

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

export interface SearchQuery {
  readonly isrc: string;
  readonly market: string | null;
  readonly offset: number;
}

export type SearchAnswer = readonly SpotifyTrack[] | Response;

export interface FakeSpotifyOptions {
  /**
   * Answer for each search. A list of tracks is paginated like the real API (honoring `limit` and
   * `offset`); a ready-made `Response` simulates failures. May be asynchronous.
   */
  readonly search: (query: SearchQuery) => SearchAnswer | Promise<SearchAnswer>;
  /** Status of the token endpoint; anything but 200 simulates the auth service failing. */
  readonly tokenStatus?: number;
}

export interface FakeSpotify {
  readonly fetchFn: FetchFn;
  readonly tokenRequests: () => number;
  readonly searches: SearchQuery[];
  /** Highest number of searches that were in flight at the same time. */
  readonly peakConcurrentSearches: () => number;
}

/** In-memory stand-in for accounts.spotify.com and api.spotify.com, routed by URL. */
export function createFakeSpotify(options: FakeSpotifyOptions): FakeSpotify {
  let tokenRequests = 0;
  let inFlight = 0;
  let peak = 0;
  const searches: SearchQuery[] = [];

  const handleSearch = async (url: URL): Promise<Response> => {
    const limit = Number(url.searchParams.get('limit') ?? 5);
    const query: SearchQuery = {
      isrc: (url.searchParams.get('q') ?? '').replace('isrc:', ''),
      market: url.searchParams.get('market'),
      offset: Number(url.searchParams.get('offset') ?? 0),
    };
    searches.push(query);

    inFlight++;
    peak = Math.max(peak, inFlight);
    try {
      const answer = await options.search(query);
      if (answer instanceof Response) {
        return answer;
      }
      const hasNext = query.offset + limit < answer.length;
      return jsonResponse({
        tracks: {
          items: answer.slice(query.offset, query.offset + limit),
          total: answer.length,
          next: hasNext ? `${url.origin}${url.pathname}?offset=${query.offset + limit}` : null,
        },
      });
    } finally {
      inFlight--;
    }
  };

  const fetchFn: FetchFn = (input) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    );

    if (url.hostname === 'accounts.spotify.com') {
      tokenRequests++;
      const status = options.tokenStatus ?? 200;
      return Promise.resolve(
        status === 200
          ? jsonResponse({ access_token: `token-${tokenRequests}`, expires_in: 3600 })
          : jsonResponse({ error: 'server_error' }, { status }),
      );
    }
    return handleSearch(url);
  };

  return {
    fetchFn,
    tokenRequests: () => tokenRequests,
    searches,
    peakConcurrentSearches: () => peak,
  };
}

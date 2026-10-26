import { Router } from 'express';
import { readSpotifyCredentials } from '../config/config';
import { Logger } from '../shared/shared.interfaces';
import { ConcurrencyLimiter } from '../shared/concurrency-limiter';
import { LimitedTrackSearch } from '../spotify/limited-track-search';
import { SpotifyClient } from '../spotify/spotify-client';
import { SpotifyUnavailableError } from '../spotify/spotify-errors';
import { MAX_CONCURRENT_SEARCHES } from '../spotify/spotify.constants';
import { SpotifyFailureReason } from '../spotify/spotify.enums';
import { SpotifyTokenProvider } from '../spotify/token-provider';
import { CachingTrackFinder } from '../tracks/finder/caching-track-finder';
import { SpotifyTrackFinder } from '../tracks/finder/track-finder';
import { TrackFinder } from '../tracks/finder/finder.interfaces';
import { TracksService } from '../tracks/tracks-service';
import {
  TRACK_CACHE_MAX_ENTRIES,
  TRACK_CACHE_STALE_IF_ERROR_MS,
  TRACK_CACHE_TTL_MS,
} from './api.constants';
import { ApiRouterOptions } from './api.interfaces';
import { createHealthRouter } from './health-router';
import { apiNotFound, createApiErrorHandler, createTracksRouter } from './tracks-router';

/** Composition root of the BFF: wires config → Spotify adapters → finder → service → HTTP routes. */
export function createApiRouter(options: ApiRouterOptions): Router {
  const logger = options.logger ?? console;
  const service = new TracksService(createTrackFinder(options, logger), logger);

  const router = Router();
  router.use(createHealthRouter(readSpotifyCredentials(options.env) !== null));
  router.use(createTracksRouter(service));
  router.use(apiNotFound);
  router.use(createApiErrorHandler(logger));
  return router;
}

function createTrackFinder(options: ApiRouterOptions, logger: Logger): TrackFinder {
  const credentials = readSpotifyCredentials(options.env);
  if (!credentials) {
    logger.warn(
      'SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are not set; /api/tracks will answer 503.',
    );
    return {
      findByIsrc: () =>
        Promise.reject(new SpotifyUnavailableError(SpotifyFailureReason.MISSING_CREDENTIALS)),
    };
  }

  const tokens = new SpotifyTokenProvider(credentials, {
    fetchFn: options.fetchFn,
    now: options.now,
  });
  const client = new SpotifyClient(tokens, {
    fetchFn: options.fetchFn,
    sleep: options.sleep,
    now: options.now,
  });
  // One limiter for the whole process: concurrent visitors share Spotify's quota.
  const search = new LimitedTrackSearch(client, new ConcurrencyLimiter(MAX_CONCURRENT_SEARCHES));
  return new CachingTrackFinder(new SpotifyTrackFinder(search), {
    ttlMs: TRACK_CACHE_TTL_MS,
    staleIfErrorMs: TRACK_CACHE_STALE_IF_ERROR_MS,
    maxEntries: TRACK_CACHE_MAX_ENTRIES,
    now: options.now,
  });
}

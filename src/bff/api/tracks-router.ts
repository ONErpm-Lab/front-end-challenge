import { ErrorRequestHandler, RequestHandler, Response, Router } from 'express';
import { ApiError, TracksResponse } from '../../contract/tracks.interfaces';
import { ApiErrorCode, LookupStatus } from '../../contract/tracks.enums';
import { Logger } from '../shared/shared.interfaces';
import { TracksService } from '../tracks/tracks-service';
import {
  CACHE_CONTROL_NO_STORE,
  CACHE_CONTROL_PUBLIC,
  MAX_ISRCS_PER_REQUEST,
} from './api.constants';
import { IsrcQueryKind } from './api.enums';
import { parseIsrcQuery } from './parse-isrc-query';

export function createTracksRouter(service: TracksService): Router {
  const router = Router();

  router.get('/tracks', async (req, res) => {
    const query = parseIsrcQuery(req.query['isrc']);

    if (query.kind === IsrcQueryKind.INVALID) {
      return sendError(res, 400, {
        code: ApiErrorCode.INVALID_ISRC,
        message: 'Provide one or more valid ISRCs in the "isrc" query parameter.',
        invalid: query.invalid,
      });
    }
    if (query.kind === IsrcQueryKind.TOO_MANY) {
      return sendError(res, 400, {
        code: ApiErrorCode.TOO_MANY_ISRCS,
        message: `At most ${MAX_ISRCS_PER_REQUEST} ISRCs per request.`,
      });
    }

    const results = await service.lookup(query.isrcs);

    // Every lookup failed: the integration itself is down, so say so instead of "200 with nothing".
    if (results.every((result) => result.status === LookupStatus.ERROR)) {
      return sendError(res, 503, {
        code: ApiErrorCode.INTEGRATION_UNAVAILABLE,
        message: 'The music data provider is currently unavailable.',
      });
    }

    // A partial failure is transient: it must never be replayed from a browser or shared cache.
    const hasFailures = results.some((result) => result.status === LookupStatus.ERROR);
    const body: TracksResponse = { results };
    res
      .set('Cache-Control', hasFailures ? CACHE_CONTROL_NO_STORE : CACHE_CONTROL_PUBLIC)
      .json(body);
  });

  return router;
}

/** Unknown `/api/*` paths must answer JSON, not fall through to the SSR HTML renderer. */
export const apiNotFound: RequestHandler = (_req, res) => {
  sendError(res, 404, { code: ApiErrorCode.NOT_FOUND, message: 'Unknown API route.' });
};

export function createApiErrorHandler(logger: Logger): ErrorRequestHandler {
  // Express recognizes error handlers by their 4-argument signature, so `_next` must stay.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (error, _req, res, _next) => {
    logger.error('Unhandled API error', error);
    sendError(res, 500, { code: ApiErrorCode.INTERNAL_ERROR, message: 'Unexpected error.' });
  };
}

function sendError(res: Response, status: number, body: ApiError): void {
  res.status(status).set('Cache-Control', CACHE_CONTROL_NO_STORE).json(body);
}

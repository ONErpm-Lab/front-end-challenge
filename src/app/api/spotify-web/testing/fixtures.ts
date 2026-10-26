import { SpotifySearchResponse, SpotifyTrack } from '../spotify-web.interfaces';
import BR1SP1200070 from './fixtures/BR1SP1200070.market-br.json';
import BR1SP1200071 from './fixtures/BR1SP1200071.market-br.json';
import BR1SP1500002 from './fixtures/BR1SP1500002.market-br.json';
import BRC310600002 from './fixtures/BRC310600002.market-br.json';
import BXKZM1900338 from './fixtures/BXKZM1900338.market-br.json';
import BXKZM1900345 from './fixtures/BXKZM1900345.market-br.json';
import NO1R42509310 from './fixtures/NO1R42509310.market-br.json';
import NO1R42511410 from './fixtures/NO1R42511410.market-br.json';
import QZNJX2078148 from './fixtures/QZNJX2078148.market-br.json';
import QZNJX2081700 from './fixtures/QZNJX2081700.market-br.json';

/**
 * Real `GET /search?q=isrc:…&market=BR` responses for the 10 ISRCs of the challenge,
 * captured on 2026-10-23 (see ADR 0005).
 */
const RECORDED: Record<string, unknown> = {
  BR1SP1200070,
  BR1SP1200071,
  BR1SP1500002,
  BRC310600002,
  BXKZM1900338,
  BXKZM1900345,
  NO1R42509310,
  NO1R42511410,
  QZNJX2078148,
  QZNJX2081700,
};

export const CHALLENGE_ISRCS = Object.keys(RECORDED);

export function recordedTracks(isrc: string): readonly SpotifyTrack[] {
  const recorded = RECORDED[isrc] as SpotifySearchResponse | undefined;
  if (!recorded) {
    throw new Error(`No recorded fixture for ${isrc}`);
  }
  return recorded.tracks.items;
}

import { Track } from '../../../contract/tracks.interfaces';
import { TrackSearch } from '../../spotify/spotify.interfaces';
import { selectBestTrack } from '../mapping/select-best-track';
import { toTrack } from '../mapping/track-mapper';
import { TrackFinder } from './finder.interfaces';

/** Availability is judged for Brazil only (see ADR 0005). */
const BRAZIL_MARKET = 'BR';

/**
 * Availability in Brazil comes from searching with `market=BR`: Spotify then flags each
 * result with `is_playable` (`available_markets` no longer exists). See ADR 0005.
 */
export class SpotifyTrackFinder implements TrackFinder {
  constructor(private readonly _search: TrackSearch) {}

  public async findByIsrc(isrc: string): Promise<Track | null> {
    const inBrazil = await this._search.searchByIsrc(isrc, { market: BRAZIL_MARKET });

    const playable = selectBestTrack(inBrazil.filter((track) => track.is_playable === true));
    if (playable) {
      return toTrack(playable, { isrc, availableInBR: true });
    }

    // Not playable in BR: still show what we know, flagged as unavailable.
    const elsewhere = inBrazil.length > 0 ? inBrazil : await this._search.searchByIsrc(isrc);
    const known = selectBestTrack(elsewhere);
    return known ? toTrack(known, { isrc, availableInBR: false }) : null;
  }
}

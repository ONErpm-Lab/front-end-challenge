import { Track } from '../../models/tracks.interfaces';
import { selectBestTrack } from './mapping/select-best-track';
import { toTrack } from './mapping/track-mapper';
import { BRAZIL_MARKET } from './track-lookup.constants';
import { TrackSearch } from './track-lookup.interfaces';

/**
 * Availability in Brazil comes from searching with `market=BR`: Spotify then flags each
 * result with `is_playable` (`available_markets` no longer exists).
 */
export class SpotifyTrackFinder {
  constructor(private readonly _search: TrackSearch) {}

  public async findByIsrc(isrc: string): Promise<Track | null> {
    const inBrazil = await this._search.searchByIsrc(isrc, { market: BRAZIL_MARKET });

    const playable = selectBestTrack(inBrazil.filter((track) => track.is_playable === true));
    if (playable) {
      return toTrack(playable, { isrc, availableInBR: true, releases: inBrazil });
    }

    // Not playable in BR: still show what we know, flagged as unavailable.
    const elsewhere = inBrazil.length > 0 ? inBrazil : await this._search.searchByIsrc(isrc);
    const known = selectBestTrack(elsewhere);
    return known ? toTrack(known, { isrc, availableInBR: false, releases: elsewhere }) : null;
  }
}

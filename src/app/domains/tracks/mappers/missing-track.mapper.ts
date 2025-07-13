import { formatDuration } from '../../../core/utils/duration';
import { IMultipleSpotifySearchResponse } from '../../spotify/types/spotify.types';
import { IMissingTrackCardProps } from '../types/tracks.types';
import { DateTime } from 'luxon';
export const missingTrackMapper = (
  tracks: IMultipleSpotifySearchResponse
): IMissingTrackCardProps[] => {
  return tracks.map((track) => ({
    name: track.track?.name || null,
    hasTrack: track.track !== null,
    albumImage: track.track?.album?.images?.[0]?.url || null,
    artist: track.track?.artists?.[0]?.name || null,
    albumReleaseDate:
      DateTime.fromFormat(
        track.track?.album?.release_date || '',
        'yyyy-MM-dd'
      ).toFormat('dd/MM/yyyy') || null,
    isrc: track.isrc || null,
    duration: formatDuration(track.track?.duration_ms || 0),
    isAvailableInBrazil: track.track?.available_markets?.includes('BR') || false,
    spotifyUrl: track.track?.external_urls?.spotify || null,
    previewUrl: track.track?.preview_url || null,
  }))
};

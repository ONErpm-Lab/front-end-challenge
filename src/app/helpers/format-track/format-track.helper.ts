import { Track } from 'spotify-types';
import TrackInfo from '../../components/track-info/track-info.interface';

const formatTracks = (tracks: Track[]): TrackInfo[] =>
  tracks.map((track) => ({
    name: track.name,
    artists: track.artists.map((artist) => artist.name).join(', '),
    availableInBR: !!track.available_markets?.includes('BR'),
    previewUrl: track.preview_url,
    albumThumbnailUrl: track.album.images[0].url,
    duration: track.duration_ms,
    releaseDate: track.album.release_date,
    spotifyUrl: track.external_urls.spotify,
  }));

export default formatTracks;

import type { DatePrecision } from '../../../shared/pipes/release-date.pipe';

/**
 * The app's own view of a track.
 *
 * Shaped by what the page must render, not by what Spotify happens to return —
 * that is what keeps the provider replaceable. Translation lives in the mapper.
 */
export interface Track {
  readonly isrc: string;
  readonly id: string;
  readonly title: string;
  /** Artist names in the order Spotify credits them. */
  readonly artists: readonly string[];
  /** Album cover, already reduced to a single best-fit image. */
  readonly albumImageUrl: string | null;
  /** ISO-8601 date string; precision varies (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`). */
  readonly releaseDate: string;
  /** How much of {@link releaseDate} is meaningful, so the UI does not invent a day. */
  readonly releaseDatePrecision: DatePrecision;
  readonly durationMs: number;
  /**
   * 30-second preview stream.
   *
   * Usually null: Spotify stopped populating `preview_url` for apps created after
   * Nov 2024. `TrackPlayer` therefore falls back to Spotify's embed player, which
   * previews the track without needing this. Kept because when it *is* present we
   * can offer a real audio element instead of an iframe.
   */
  readonly previewUrl: string | null;
  /** Public Spotify page for the track. */
  readonly spotifyUrl: string;
  /** Whether the track is licensed for the configured market (BR). */
  readonly availableInTargetMarket: boolean;
}

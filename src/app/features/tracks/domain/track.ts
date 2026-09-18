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
  readonly durationMs: number;
  /**
   * 30-second preview stream.
   *
   * TODO(spec-landmine): Spotify stopped populating `preview_url` for apps created
   * after Nov 2024, so this is `null` for most tracks and the required audio player
   * cannot rely on it. Decide before building the player:
   *   (a) use the Spotify embed iframe (open.spotify.com/embed/track/{id}) as the
   *       fallback player, or
   *   (b) render a disabled player with an explanation when this is null.
   * Whichever wins, it stays behind the player component so the rest is unaffected.
   */
  readonly previewUrl: string | null;
  /** Public Spotify page for the track. */
  readonly spotifyUrl: string;
  /** Whether the track is licensed for the configured market (BR). */
  readonly availableInTargetMarket: boolean;
}

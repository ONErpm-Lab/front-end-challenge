/** How many tracks came out in one year (only years that have some). */
export interface ReleaseYear {
  readonly year: number;
  readonly count: number;
}

/** The numbers of the summary cards, all derived from the lookup results. */
export interface CatalogSummary {
  /** ISRCs looked up. */
  readonly total: number;
  readonly found: number;
  readonly availableInBR: number;
  readonly unavailableInBR: number;
  readonly notFound: number;
  /** ISRCs whose lookup failed (Spotify did not answer for them). */
  readonly failed: number;
  /** Sum of the durations of the found tracks. */
  readonly totalDurationMs: number;
  /** Releases per year, oldest first. */
  readonly releasesByYear: readonly ReleaseYear[];
}

/** ISRC: 2-letter country, 3-char registrant, 2-digit year, 5-digit designation (12 chars, no hyphens). */
const ISRC_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;

/** Strips hyphens/spaces and upper-cases, so `br-sp1-20-00071` and `BRSP1200071` compare equal. */
export function normalizeIsrc(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

export function isValidIsrc(value: string): boolean {
  return ISRC_PATTERN.test(value);
}

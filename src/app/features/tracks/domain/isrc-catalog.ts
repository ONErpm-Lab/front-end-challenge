/**
 * The ISRC codes the challenge hands us (docs/README.md).
 *
 * The spec is explicit that nothing is persisted and nothing is searched, so the
 * list is a constant of the feature rather than state or configuration.
 */
export const REQUESTED_ISRCS: readonly string[] = [
  'NO1R42509310',
  'NO1R42511410',
  'BRC310600002',
  'BR1SP1200071',
  'BR1SP1200070',
  'BR1SP1500002',
  'BXKZM1900338',
  'BXKZM1900345',
  'QZNJX2081700',
  'QZNJX2078148',
] as const;

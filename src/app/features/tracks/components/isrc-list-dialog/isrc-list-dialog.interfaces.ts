export interface IsrcListDialogData {
  /** Translation keys of the title and of the explanation. */
  readonly titleKey: string;
  readonly hintKey: string;
  readonly isrcs: readonly string[];
  /** When given, the dialog offers "try again" (and closes before calling it). */
  readonly retry?: () => void;
}

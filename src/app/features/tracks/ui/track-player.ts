import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

/**
 * The audio preview the brief requires.
 *
 * Spotify stopped populating `preview_url` for apps created after Nov 2024, so for
 * most tracks there is no file to hand an `<audio>` element. Rather than ship a dead
 * control, this falls back to Spotify's own embed player, which still previews the
 * track. Both paths live here so the rest of the card never learns which one ran.
 */
@Component({
  selector: 'onerpm-track-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (previewUrl(); as url) {
      <audio
        class="w-full"
        controls
        preload="none"
        [src]="url"
        [attr.aria-label]="'Prévia de ' + title()"
      ></audio>
    } @else {
      <iframe
        class="h-[152px] w-full rounded-xl border-0"
        height="152"
        loading="lazy"
        [src]="embedUrl()"
        [title]="'Player do Spotify para ' + title()"
        allow="encrypted-media; clipboard-write; picture-in-picture"
      ></iframe>
    }
  `,
})
export class TrackPlayer {
  private readonly sanitizer = inject(DomSanitizer);

  readonly trackId = input.required<string>();
  readonly title = input.required<string>();
  readonly previewUrl = input<string | null>(null);

  /**
   * Trusted because it is built here from a Spotify id we control, never from a URL
   * that arrived in a payload.
   */
  protected readonly embedUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://open.spotify.com/embed/track/${encodeURIComponent(this.trackId())}`,
    ),
  );
}

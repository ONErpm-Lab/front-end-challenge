import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

/**
 * Player incorporado do Spotify para uma faixa. Recebe a URL já validada por
 * `spotifyEmbedUrl`, então pode marcá-la como confiável para o iframe.
 * A altura escolhe o layout do Spotify; quem usa decide conforme o espaço disponível.
 */
@Component({
  selector: 'app-spotify-embed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iframe
      [src]="safeUrl()"
      [title]="'Player do Spotify: ' + title()"
      width="100%"
      [height]="height()"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    ></iframe>
  `,
  styles: `
    :host {
      display: block;
    }

    iframe {
      display: block;
      border: 0;
      animation: embed-in 250ms var(--ease-out) both;
      border-radius: var(--radius-md);
    }

    @keyframes embed-in {
      from {
        opacity: 0;
      }
    }
  `,
})
export class SpotifyEmbedComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly url = input.required<string>();
  readonly title = input.required<string>();
  /** Alturas do Spotify: 80 (compacto), 152 ou 352 (com capa grande). */
  readonly height = input<80 | 152 | 352>(152);

  protected readonly safeUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.url()),
  );
}

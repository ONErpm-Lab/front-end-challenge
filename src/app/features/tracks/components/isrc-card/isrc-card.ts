import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LookupStatus } from '../../../../../contract/tracks.enums';
import { CopyButton } from '../../../../shared/copy-button/copy-button';
import { UnresolvedStatus } from '../../domain/domain.types';

/**
 * An ISRC that did not become a track: Spotify does not know it, or the lookup failed.
 * It stays on the page so the producer can see exactly which of the codes did not come back.
 */
@Component({
  selector: 'orp-isrc-card',
  imports: [CopyButton, TranslocoPipe],
  templateUrl: './isrc-card.html',
  styleUrl: './isrc-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsrcCard {
  public readonly isrc = input.required<string>();
  public readonly status = input.required<UnresolvedStatus>();

  protected readonly isNotFound = computed(() => this.status() === LookupStatus.NOT_FOUND);
  protected readonly messageKey = computed(() =>
    this.isNotFound() ? 'tracks.notFound' : 'tracks.failed',
  );
  protected readonly icon = computed(() =>
    this.isNotFound() ? 'pi pi-search' : 'pi pi-exclamation-triangle',
  );
}

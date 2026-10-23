import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { InfoChipComponent } from '@shared/components/info-chip/info-chip.component';
import { IconComponent } from '@shared/icons/icon.component';
import { withViewTransition } from '@shared/utils/view-transition';
import { TrackCardComponent } from '../../components/track-card/track-card.component';
import { TrackNotFoundComponent } from '../../components/track-not-found/track-not-found.component';
import { TrackSkeletonComponent } from '../../components/track-skeleton/track-skeleton.component';
import { TRACKS_STORE } from '../../ports/tracks-store.port';
import { provideTracksFeature } from '../../tracks.providers';

/**
 * Componente de apresentação: lê o estado do store e repassa as ações do usuário.
 * Não decide quando carregar: o store carrega sozinho ao ser criado (`withHooks`).
 */
@Component({
  selector: 'app-tracks-page',
  imports: [
    AlertComponent,
    IconComponent,
    InfoChipComponent,
    TrackCardComponent,
    TrackNotFoundComponent,
    TrackSkeletonComponent,
  ],
  providers: [provideTracksFeature()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracks-page.component.html',
  styleUrl: './tracks-page.component.scss',
})
export class TracksPageComponent {
  /** Depende da porta, não da implementação (DIP). */
  protected readonly store = inject(TRACKS_STORE);

  protected retry(): void {
    this.store.load();
  }

  protected toggleDirection(): void {
    withViewTransition(() => this.store.toggleDirection());
  }
}

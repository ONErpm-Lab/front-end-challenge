import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TracksPageComponent } from '@features/tracks/pages/tracks-page/tracks-page.component';

@Component({
  selector: 'app-root',
  imports: [TracksPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="shell">
      <app-tracks-page />
    </main>
    <footer class="shell shell__footer">
      Integração com a Spotify Web API. Nada é armazenado.
    </footer>
  `,
})
export class AppComponent {}

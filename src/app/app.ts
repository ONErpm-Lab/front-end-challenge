import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppFooter } from './layout/app-footer/app-footer';
import { PlayerBar } from './features/tracks/components/player-bar/player-bar';
import { AppHeader } from './layout/app-header/app-header';

@Component({
  selector: 'orp-root',
  imports: [RouterOutlet, AppHeader, AppFooter, PlayerBar, TranslocoPipe],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}

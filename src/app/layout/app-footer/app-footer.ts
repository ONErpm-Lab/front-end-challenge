import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AUTHOR_NAME, AUTHOR_URL, REPOSITORY_URL } from '../layout.constants';

/** Credits: who built it and for what, the source code, and where the data comes from. */
@Component({
  selector: 'orp-app-footer',
  imports: [TranslocoPipe],
  templateUrl: './app-footer.html',
  styleUrl: './app-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooter {
  protected readonly authorName = AUTHOR_NAME;
  protected readonly authorUrl = AUTHOR_URL;
  protected readonly repositoryUrl = REPOSITORY_URL;
}

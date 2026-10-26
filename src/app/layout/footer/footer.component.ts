import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SOURCE_CODE_URL } from '../layout.constants';

@Component({
  selector: 'orp-footer',
  imports: [TranslocoPipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected readonly sourceCodeUrl = SOURCE_CODE_URL;
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { IconComponent } from '@shared/icons/icon.component';
import { SpotifyEmbedComponent } from '../spotify-embed/spotify-embed.component';

type Phase = 'opening' | 'open' | 'closing';

/** Abaixo desta largura o card é horizontal e baixo: cabe o player compacto do Spotify. */
const NARROW = '(max-width: 639px)';
/**
 * Se `animationend` não chegar (aba em segundo plano, navegador que pula animações),
 * a fase avança mesmo assim. Um pouco acima da duração das animações no CSS.
 */
const OPEN_FALLBACK_MS = 800;
const CLOSE_FALLBACK_MS = 500;

/**
 * Face "tocando" do card: a capa desfocada cobre o card num círculo que nasce no botão
 * que a pessoa tocou, e o player do Spotify entra quando o círculo termina.
 * O iframe nunca está dentro de uma animação de transformação: só é montado na fase `open`.
 */
@Component({
  selector: 'app-card-player',
  imports: [IconComponent, SpotifyEmbedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card-player.component.html',
  styleUrl: './card-player.component.scss',
  host: {
    role: 'region',
    '[attr.aria-label]': '"Player do Spotify: " + title()',
    '[class.is-closing]': 'phase() === "closing"',
    '[style.--origin-x.px]': 'origin().x',
    '[style.--origin-y.px]': 'origin().y',
    '[style.--radius.px]': 'origin().radius',
    '(animationend)': 'onAnimationEnd($event)',
    '(keydown.escape)': 'close()',
  },
})
export class CardPlayerComponent {
  readonly url = input.required<string>();
  readonly title = input.required<string>();
  readonly coverUrl = input<string | null>(null);
  /**
   * Centro do botão que abriu o player, relativo ao card, e o raio até o canto mais distante:
   * o círculo termina exatamente ao cobrir o card, então toda a animação fica visível.
   */
  readonly origin = input<{ x: number; y: number; radius: number }>({ x: 0, y: 0, radius: 0 });
  /** Emitido quando a animação de saída termina; quem usa fecha o player. */
  readonly closed = output<void>();

  protected readonly phase = signal<Phase>('opening');
  protected readonly embedHeight = computed(() =>
    typeof matchMedia !== 'undefined' && matchMedia(NARROW).matches ? 80 : 352,
  );
  protected readonly background = computed(() => {
    const cover = this.coverUrl();
    return cover ? `url("${cover}")` : null;
  });

  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private fallback: ReturnType<typeof setTimeout> | undefined = setTimeout(
    () => this.finishOpening(),
    OPEN_FALLBACK_MS,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.fallback));
  }

  close(): void {
    if (this.phase() === 'closing') return;
    this.phase.set('closing');
    clearTimeout(this.fallback);
    this.fallback = setTimeout(() => this.finishClosing(), CLOSE_FALLBACK_MS);
  }

  protected onAnimationEnd(event: AnimationEvent): void {
    // Só a revelação do próprio host importa (o fade do iframe também borbulha até aqui).
    if (event.target !== event.currentTarget) return;
    if (this.phase() === 'opening') this.finishOpening();
    else if (this.phase() === 'closing') this.finishClosing();
  }

  private finishOpening(): void {
    if (this.phase() !== 'opening') return;
    clearTimeout(this.fallback);
    this.phase.set('open');
    this.closeButton().nativeElement.focus();
  }

  private finishClosing(): void {
    clearTimeout(this.fallback);
    this.fallback = undefined;
    this.closed.emit();
  }
}

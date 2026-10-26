import { DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { NowPlayingService } from '../../store/now-playing.service';
import { foundResult } from '../../testing/builders';
import { renderWithTracks } from '../../testing/render-with-tracks';
import { DetailSheetComponent } from './detail-sheet.component';

const LOUCA = foundResult('Louca', { id: '1Esxp6lXJWU7TaOQM2JsQn', isrc: 'BXKZM1900345' });

async function render() {
  const close = vi.fn();
  TestBed.overrideProvider(DialogRef, { useValue: { close } });
  const page = await renderWithTracks(DetailSheetComponent, [LOUCA]);
  return { ...page, close };
}

describe('DetailSheetComponent', () => {
  it('shows the detail of the track in focus, compact, named by its heading', async () => {
    const { root } = await render();

    expect(root.querySelector('orp-track-detail')?.classList).toContain('sheet');
    expect(root.querySelector('#detail-sheet-title')?.textContent?.trim()).toBe('Louca');
  });

  it('closes when the detail asks', async () => {
    const { root, close } = await render();

    (root.querySelector('button[aria-label="Close the details"]') as HTMLButtonElement).click();

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('stops the preview when it goes away', async () => {
    const { fixture } = await render();
    const nowPlaying = TestBed.inject(NowPlayingService);
    nowPlaying.play(LOUCA.status === 'found' ? LOUCA.track : (null as never));

    fixture.destroy();

    expect(nowPlaying.track()).toBeNull();
  });
});

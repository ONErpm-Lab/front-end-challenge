import { TestBed } from '@angular/core/testing';
import { TrackCoverComponent } from './track-cover.component';

async function render(url: string | null) {
  const fixture = TestBed.createComponent(TrackCoverComponent);
  fixture.componentRef.setInput('url', url);
  fixture.componentRef.setInput('alt', 'Cover of the album Louca');
  fixture.componentRef.setInput('missingLabel', 'No cover available');
  await fixture.whenStable();
  return { fixture, root: fixture.nativeElement as HTMLElement };
}

describe('TrackCover', () => {
  it('shows the cover with its description, loaded lazily', async () => {
    const { root } = await render('https://i.scdn.co/image/abc');

    const img = root.querySelector('img') as HTMLImageElement;
    expect(img.src).toBe('https://i.scdn.co/image/abc');
    expect(img.alt).toBe('Cover of the album Louca');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('shows a named placeholder when there is no cover', async () => {
    const { root } = await render(null);

    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'No cover available',
    );
  });

  it('falls back to the placeholder when the image fails, and tries again for a new address', async () => {
    const { fixture, root } = await render('https://i.scdn.co/image/broken');

    root.querySelector('img')?.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(root.querySelector('img')).toBeNull();

    fixture.componentRef.setInput('url', 'https://i.scdn.co/image/other');
    await fixture.whenStable();
    expect(root.querySelector('img')).not.toBeNull();
  });
});

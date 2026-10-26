import { ReleaseDatePrecision } from '../../../../models/tracks.enums';
import { NowPlayingService } from '../../store/now-playing.service';
import { foundResult, notFoundResult } from '../../testing/builders';
import { renderWithTracks, settle, text } from '../../testing/render-with-tracks';
import { TrackDetailComponent } from './track-detail.component';
import { TestBed } from '@angular/core/testing';

const LOUCA = foundResult('Louca', {
  id: '1Esxp6lXJWU7TaOQM2JsQn',
  isrc: 'BXKZM1900345',
  artists: ['DJ Malibu', 'MC Pack'],
  albumName: 'Louca',
  coverUrl: 'https://i.scdn.co/image/louca',
  releaseDate: { value: '2019-10-04', precision: ReleaseDatePrecision.DAY },
  durationMs: 124_315,
  spotifyUrl: 'https://open.spotify.com/track/1Esxp6lXJWU7TaOQM2JsQn',
});
const REPENTE = foundResult('Repente', {
  id: '4lwE7ainG51zmxt1xAC7XQ',
  isrc: 'BRC310600002',
  availableInBR: false,
});

const button = (root: HTMLElement, label: string) =>
  [...root.querySelectorAll('button')].find((candidate) =>
    text(candidate)?.includes(label),
  ) as HTMLButtonElement;

describe('TrackDetailComponent', () => {
  it('shows the track in focus: cover, availability, title, artists and its data', async () => {
    const { root } = await renderWithTracks(TrackDetailComponent, [LOUCA]);

    expect(root.querySelector('img')?.getAttribute('alt')).toBe('Cover of the album Louca');
    expect(text(root.querySelector('.badge'))).toBe('Available in Brazil');
    expect(text(root.querySelector('h2'))).toBe('Louca');
    expect(text(root.querySelector('.artists'))).toBe('DJ Malibu, MC Pack');
    expect(text(root.querySelector('dl'))).toContain('October 4, 2019');
    expect(text(root.querySelector('dl'))).toContain('02:04');
    expect(text(root.querySelector('dl'))).toContain('BXKZM1900345');
  });

  it('warns when Spotify has more than one release date', async () => {
    const twoDates = foundResult('Quem Diria', {
      isrc: 'BR1SP1200070',
      releaseDate: { value: '2014-05-12', precision: ReleaseDatePrecision.DAY },
      releaseDates: [
        { value: '2014-05-12', precision: ReleaseDatePrecision.DAY },
        { value: '2014-07-28', precision: ReleaseDatePrecision.DAY },
      ],
    });
    const { root, store, fixture } = await renderWithTracks(TrackDetailComponent, [
      LOUCA,
      twoDates,
    ]);
    expect(root.querySelector('orp-release-dates button')).toBeNull();

    store.select('BR1SP1200070');
    await settle(fixture);

    expect(text(root.querySelector('orp-release-dates button'))).toBe('2 dates found');
  });

  it('says when the track does not play in Brazil', async () => {
    const { root, store, fixture } = await renderWithTracks(TrackDetailComponent, [LOUCA, REPENTE]);

    store.select('BRC310600002');
    await settle(fixture);

    expect(text(root.querySelector('.badge'))).toBe('Not available in Brazil');
  });

  it('opens the track on Spotify in a new tab', async () => {
    const { root } = await renderWithTracks(TrackDetailComponent, [LOUCA]);

    const link = root.querySelector('a') as HTMLAnchorElement;
    expect(link.href).toBe('https://open.spotify.com/track/1Esxp6lXJWU7TaOQM2JsQn');
    expect(link.target).toBe('_blank');
    expect(text(link)).toContain('opens in a new tab');
  });

  it('copies the ISRC', async () => {
    const { root, copy } = await renderWithTracks(TrackDetailComponent, [LOUCA]);

    (root.querySelector('orp-copy-button button') as HTMLButtonElement).click();

    expect(copy).toHaveBeenCalledWith('BXKZM1900345');
  });

  it('plays a preview on request and closes the player on request', async () => {
    const { root, fixture, spotify } = await renderWithTracks(TrackDetailComponent, [LOUCA]);

    button(root, 'Listen to a preview').click();
    await settle(fixture);
    expect(root.querySelector('orp-spotify-preview')).not.toBeNull();
    expect(spotify.load).toHaveBeenCalled();

    button(root, "Close Spotify's official player").click();
    await settle(fixture);
    expect(root.querySelector('orp-spotify-preview')).toBeNull();
  });

  it('stops the preview when another track comes into focus', async () => {
    const { root, fixture, store } = await renderWithTracks(TrackDetailComponent, [LOUCA, REPENTE]);
    button(root, 'Listen to a preview').click();
    await settle(fixture);

    store.select('BRC310600002');
    await settle(fixture);

    expect(TestBed.inject(NowPlayingService).track()).toBeNull();
    expect(root.querySelector('orp-spotify-preview')).toBeNull();
  });

  it('says to pick a track when none is in focus', async () => {
    const { root } = await renderWithTracks(TrackDetailComponent, [notFoundResult('QZNJX2081700')]);

    expect(text(root)).toBe('Pick a track to see its details.');
  });

  describe('in the bottom sheet', () => {
    it('is compact, names itself with the given heading id, and has a close button', async () => {
      const { root, fixture } = await renderWithTracks(TrackDetailComponent, [LOUCA]);
      const closed = vi.fn();
      fixture.componentInstance.closed.subscribe(closed);
      fixture.componentRef.setInput('sheet', true);
      fixture.componentRef.setInput('headingId', 'sheet-title');
      await settle(fixture);

      expect(fixture.nativeElement.classList).toContain('sheet');
      expect(root.querySelector('article')?.getAttribute('aria-labelledby')).toBe('sheet-title');
      expect(root.querySelector('h2')?.id).toBe('sheet-title');
      (root.querySelector('button[aria-label="Close the details"]') as HTMLButtonElement).click();

      expect(closed).toHaveBeenCalledTimes(1);
    });
  });
});

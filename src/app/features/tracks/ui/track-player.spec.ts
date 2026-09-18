import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TrackPlayer } from './track-player';

/**
 * The preview player is a spec requirement with two mutually exclusive paths, so
 * which one renders matters more than how it looks.
 */
function setup(previewUrl: string | null, trackId = 'track-id', title = 'Uma Faixa') {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });

  const fixture = TestBed.createComponent(TrackPlayer);
  fixture.componentRef.setInput('trackId', trackId);
  fixture.componentRef.setInput('title', title);
  fixture.componentRef.setInput('previewUrl', previewUrl);
  return fixture;
}

describe('TrackPlayer', () => {
  it('uses a native audio element when Spotify supplies a preview', async () => {
    const fixture = setup('https://p.scdn.co/mp3-preview/abc');
    await fixture.whenStable();

    const audio: HTMLAudioElement = fixture.nativeElement.querySelector('audio');
    expect(audio).toBeTruthy();
    expect(audio.getAttribute('src')).toBe('https://p.scdn.co/mp3-preview/abc');
    expect(audio.hasAttribute('controls')).toBe(true);
    expect(fixture.nativeElement.querySelector('iframe')).toBeFalsy();
  });

  it('falls back to the Spotify embed when there is no preview file', async () => {
    const fixture = setup(null, 'abc123');
    await fixture.whenStable();

    const iframe: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toBe('https://open.spotify.com/embed/track/abc123');
    expect(fixture.nativeElement.querySelector('audio')).toBeFalsy();
  });

  it('renders the embed at the height Spotify needs to paint anything', async () => {
    const fixture = setup(null);
    await fixture.whenStable();

    // Below 152px the embed renders blank, which once hid the player entirely.
    expect(fixture.nativeElement.querySelector('iframe').getAttribute('height')).toBe('152');
  });

  it('escapes the track id rather than interpolating it into the URL raw', async () => {
    const fixture = setup(null, 'a/b?c=d');
    await fixture.whenStable();

    const src = fixture.nativeElement.querySelector('iframe').getAttribute('src');
    expect(src).toBe('https://open.spotify.com/embed/track/a%2Fb%3Fc%3Dd');
  });

  it.each([
    ['audio', 'https://p.scdn.co/mp3-preview/abc'],
    ['iframe', null],
  ])('labels the %s for screen readers', async (tag, previewUrl) => {
    const fixture = setup(previewUrl, 'id', 'Quase Nua');
    await fixture.whenStable();

    const el = fixture.nativeElement.querySelector(tag);
    const label = el.getAttribute('aria-label') ?? el.getAttribute('title');
    expect(label).toContain('Quase Nua');
  });
});

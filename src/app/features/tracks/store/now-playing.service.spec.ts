import { TestBed } from '@angular/core/testing';
import { track } from '../testing/builders';
import { NowPlayingService } from './now-playing.service';

const setup = () => TestBed.inject(NowPlayingService);

describe('NowPlaying', () => {
  it('plays nothing at first', () => {
    expect(setup().track()).toBeNull();
  });

  it('plays the track it is given', () => {
    const nowPlaying = setup();

    nowPlaying.play(track({ id: 'a' }));

    expect(nowPlaying.track()?.id).toBe('a');
  });

  it('has one track at a time: choosing another replaces the first', () => {
    const nowPlaying = setup();
    nowPlaying.play(track({ id: 'a' }));

    nowPlaying.play(track({ id: 'b' }));

    expect(nowPlaying.track()?.id).toBe('b');
  });

  it('stops when told to', () => {
    const nowPlaying = setup();
    nowPlaying.play(track({ id: 'a' }));

    nowPlaying.stop();

    expect(nowPlaying.track()).toBeNull();
  });

  describe('focus', () => {
    const button = () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      return element;
    };
    afterEach(() => document.body.querySelectorAll('button').forEach((b) => b.remove()));

    it('goes back to the control that asked to play, when the player stops', () => {
      const nowPlaying = setup();
      const opener = button();
      nowPlaying.play(track(), opener);

      nowPlaying.stop();

      expect(document.activeElement).toBe(opener);
    });

    it('goes back only to the control of the track that is playing, not an older one', () => {
      const nowPlaying = setup();
      const first = button();
      const second = button();
      nowPlaying.play(track({ id: 'a' }), first);
      nowPlaying.play(track({ id: 'b' }), second);

      nowPlaying.stop();

      expect(document.activeElement).toBe(second);
    });

    it('does nothing when the control is gone from the page', () => {
      const nowPlaying = setup();
      const opener = button();
      nowPlaying.play(track(), opener);
      opener.remove();

      expect(() => nowPlaying.stop()).not.toThrow();
      expect(document.activeElement).not.toBe(opener);
    });

    it('does nothing when no control was given', () => {
      const nowPlaying = setup();
      nowPlaying.play(track());

      expect(() => nowPlaying.stop()).not.toThrow();
    });

    it('forgets the control once stopped, so a second stop does not steal the focus again', () => {
      const nowPlaying = setup();
      const opener = button();
      nowPlaying.play(track(), opener);
      nowPlaying.stop();
      const other = button();
      other.focus();

      nowPlaying.stop();

      expect(document.activeElement).toBe(other);
    });

    it('can leave the focus where it is, when the visitor already moved on', () => {
      const nowPlaying = setup();
      const opener = button();
      nowPlaying.play(track(), opener);
      const other = button();
      other.focus();

      nowPlaying.stop(false);

      expect(nowPlaying.track()).toBeNull();
      expect(document.activeElement).toBe(other);
    });
  });
});

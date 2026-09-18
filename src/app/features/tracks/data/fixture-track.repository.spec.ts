import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import { TrackRepository } from '../domain/track-repository';
import { FixtureTrackRepository } from './fixture-track.repository';

const CONFIG: AppConfig = {
  spotifyApiUrl: 'https://api.spotify.com/v1',
  tokenEndpoint: '/api/spotify-token',
  targetMarket: 'BR',
  lookupConcurrency: 4,
  maxRetries: 1,
  useFixtures: true,
};

/**
 * The fixture repository exists so the UI can be built while Spotify is unreachable.
 * These tests pin the behaviour the UI will be built against — if the stand-in and
 * the real repository disagree on the contract, the UI is built on a lie.
 */
describe('FixtureTrackRepository', () => {
  let repository: TrackRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: CONFIG },
        { provide: TrackRepository, useClass: FixtureTrackRepository },
      ],
    });

    repository = TestBed.inject(TrackRepository);
  });

  it('resolves known ISRCs through the production mapper', async () => {
    const tracks = await firstValueFrom(repository.findByIsrcs(['BRC310600002']));

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      isrc: 'BRC310600002',
      title: 'Amanhecer na Ponte',
      artists: ['Marina Rocha'],
      availableInTargetMarket: true,
    });
  });

  it('omits an ISRC with no fixture, like an unresolvable code', async () => {
    const tracks = await firstValueFrom(repository.findByIsrcs(['BRC310600002', 'QZNJX2078148']));

    expect(tracks.map((t) => t.isrc)).toEqual(['BRC310600002']);
  });

  it('marks a track absent from BR as unavailable', async () => {
    const tracks = await firstValueFrom(repository.findByIsrcs(['NO1R42509310']));

    expect(tracks[0].availableInTargetMarket).toBe(false);
  });

  it('leaves preview_url null for most tracks, matching Spotify today', async () => {
    const tracks = await firstValueFrom(repository.findByIsrcs(['BRC310600002']));

    expect(tracks[0].previewUrl).toBeNull();
  });

  it('picks the largest cover, and tolerates a track with none', async () => {
    const tracks = await firstValueFrom(repository.findByIsrcs(['QZNJX2081700', 'BXKZM1900345']));
    const byIsrc = new Map(tracks.map((t) => [t.isrc, t]));

    expect(byIsrc.get('QZNJX2081700')?.albumImageUrl).toContain('640');
    expect(byIsrc.get('BXKZM1900345')?.albumImageUrl).toBeNull();
  });

  it('returns an empty list for no codes', async () => {
    await expect(firstValueFrom(repository.findByIsrcs([]))).resolves.toEqual([]);
  });

  it('propagates a provider failure when the failure switch is on', async () => {
    (window as unknown as { __failTracks?: boolean }).__failTracks = true;

    try {
      await expect(firstValueFrom(repository.findByIsrcs(['BRC310600002']))).rejects.toMatchObject({
        kind: 'provider',
      });
    } finally {
      delete (window as unknown as { __failTracks?: boolean }).__failTracks;
    }
  });
});

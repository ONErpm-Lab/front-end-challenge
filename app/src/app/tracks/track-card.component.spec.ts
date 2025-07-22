import { TrackCardComponent } from './track-card.component';

describe('TrackCardComponent', () => {
  it('should format duration in mm:ss', () => {
    const component = new TrackCardComponent();
    component.track = {
      durationMs: 185000,
      albumImage: '',
      artists: [],
      availableInBrazil: true,
      externalUrl: '',
      notFound: false,
      previewUrl: null,
      releaseDate: '',
      title: '',
    };

    expect(component.formattedDuration).toBe('3:05');
  });
});

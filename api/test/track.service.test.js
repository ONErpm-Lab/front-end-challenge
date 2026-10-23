import { describe, expect, it, vi } from 'vitest';
import { createTrackService } from '../src/tracks/track.service.js';
import { spotifyTrack } from './fixtures.js';

describe('TrackService', () => {
  it('marca a faixa como disponível quando o Spotify a encontra no mercado BR', async () => {
    const client = { findTrackByIsrc: vi.fn().mockResolvedValue(spotifyTrack) };

    const track = await createTrackService(client).getByIsrc('BR1SP1200071');

    expect(client.findTrackByIsrc).toHaveBeenCalledWith('BR1SP1200071', 'BR');
    expect(track).toMatchObject({
      title: 'Faixa de Teste',
      artists: ['Artista A', 'Artista B'],
      thumbnailUrl: 'https://i.scdn.co/300',
      availableInBrazil: true,
    });
  });

  it('respeita is_playable=false no mercado BR', async () => {
    const client = { findTrackByIsrc: vi.fn().mockResolvedValue({ ...spotifyTrack, is_playable: false }) };

    const track = await createTrackService(client).getByIsrc('BR1SP1200071');

    expect(track.availableInBrazil).toBe(false);
  });

  it('busca sem mercado e marca indisponível quando a faixa não existe no BR', async () => {
    const client = { findTrackByIsrc: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(spotifyTrack) };

    const track = await createTrackService(client).getByIsrc('NO1R42509310');

    expect(client.findTrackByIsrc).toHaveBeenLastCalledWith('NO1R42509310');
    expect(track.availableInBrazil).toBe(false);
  });

  it('retorna null quando a faixa não existe em lugar nenhum', async () => {
    const client = { findTrackByIsrc: vi.fn().mockResolvedValue(null) };

    expect(await createTrackService(client).getByIsrc('NO1R42509310')).toBeNull();
  });
});

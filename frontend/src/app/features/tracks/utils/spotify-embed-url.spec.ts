import { spotifyEmbedUrl } from './spotify-embed-url';

describe('spotifyEmbedUrl', () => {
  it('monta a URL do player incorporado para um ID válido', () => {
    expect(spotifyEmbedUrl('4s71Bub5KzXBSMyE8nlH4E')).toBe(
      'https://open.spotify.com/embed/track/4s71Bub5KzXBSMyE8nlH4E?theme=0',
    );
  });

  it.each([null, '', 'curto', '4s71Bub5KzXBSMyE8nlH4E/../x', 'javascript:alert(1)______'])(
    'recusa %s',
    (id) => expect(spotifyEmbedUrl(id)).toBeNull(),
  );
});

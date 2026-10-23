export const spotifyTrack = {
  id: '4s71Bub5KzXBSMyE8nlH4E',
  name: 'Faixa de Teste',
  artists: [{ name: 'Artista A' }, { name: 'Artista B' }],
  album: {
    name: 'Álbum',
    release_date: '2012-05-10',
    release_date_precision: 'day',
    images: [{ url: 'https://i.scdn.co/640' }, { url: 'https://i.scdn.co/300' }, { url: 'https://i.scdn.co/64' }],
  },
  duration_ms: 215000,
  preview_url: null,
  is_playable: true,
  external_urls: { spotify: 'https://open.spotify.com/track/abc' },
};

export const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

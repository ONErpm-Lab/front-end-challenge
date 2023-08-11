class TreatUntreatedTracks {
  constructor() {

  }

  getTreatedTracksProperties(untreatedTracks) {
    const tracksWithRelevantProperties = [];

    untreatedTracks.forEach(untreatedTrack => {
      if(this._doISRCExistInSpotifyDatabase(untreatedTrack)) {
        const track = this._getTrackFromObject(untreatedTrack);

        const artists = track.artists;
        const relevantArtistsInfo = this._getRelevantArtistsInfo(artists);

        const trackWithRelevantProperties = {
          albumName: track.album.name,
          albumSpotifyURL: track.album.external_urls.spotify,
          artists: relevantArtistsInfo,
          availableMarkets: track.available_markets,
          durationInMilliseconds: track.duration_ms,
          images: track.album.images,
          name: track.name,
          previewURL: track.preview_url,
          releaseDate: track.album.release_date,
          spotifyURL: track.external_urls.spotify
        };

        tracksWithRelevantProperties.push(trackWithRelevantProperties);
      }
    });

     return tracksWithRelevantProperties;
  }

  _doISRCExistInSpotifyDatabase(object) {
    // If a ISRC does not exist on Spotify's database, then their Web API returns
    // an empty array
    return object.tracks.items.length > 0;
  }

  _getTrackFromObject(object) {
    // Spotify's Web API always returns array of items with length = 1
    // when querying items by ISRC
    return object.tracks.items[0];
  }

  _getRelevantArtistsInfo(artists) {
    const relevantArtistsInfo = artists.map(
      artist => { 
        return {
          name: artist.name,
          spotifyURL: artist.external_urls.spotify
        }
      }
    );

    return relevantArtistsInfo;
  }

}

module.exports = {
  TreatUntreatedTracks
};
require("dotenv").config();

class Tracks {
  constructor(authenticationService) {
    this._authenticationService = authenticationService;

    this._apiUrl = process.env.SPOTIFY_API_URL;
    this._headers = new Headers();
  }

  async getTreatedTracksByISRCs(ISRCs) {
    const untreatedTracks = await this._fetchUntreatedTracksByISRCs(ISRCs);
    const treatedTracks = this._getRelevantTracksProperties(untreatedTracks);

    return treatedTracks; 
  }

  async _fetchUntreatedTracksByISRCs(ISRCs) {
    const accessToken = await this._authenticationService.getAccessToken();
    this._appendBearerTokenToHeader(accessToken);  

    const untreatedTracks = [];
    const requestPromises = this._getRequestsPromises(ISRCs);
    await Promise
      .all(requestPromises)
      .then(trackDataArray => untreatedTracks.push(...trackDataArray));

    return untreatedTracks;
  }

  _getRelevantTracksProperties(untreatedTracks) {
    const tracksWithRelevantProperties = [];

    untreatedTracks.forEach(untreatedTrack => {
      if(this._doISRCExistInSpotifyDatabase(untreatedTrack)) {
        const track = this._getTrackFromObject(untreatedTrack);

        const artists = track.artists;
        const relevantArtistsInfo = this._getRelevantArtistsInfo(artists);

        const trackWithRelevantProperties = {
          releaseDate: track.album.release_date,
          artists: relevantArtistsInfo,
          availableMarkets: track.available_markets,
          spotifyURL: track.external_urls.spotify,
          name: track.name,
          previewURL: track.preview_url,
          durationInMilliseconds: track.duration_ms
        };

        tracksWithRelevantProperties.push(trackWithRelevantProperties);
      }
    });

     return tracksWithRelevantProperties;
  }

  _appendBearerTokenToHeader(accessToken) {
    this._headers.append(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }

  _getRequestsPromises(ISRCs) {
    const promises = [];

    for(let ISRC in ISRCs) {
      const requestUrl = this._getRequestUrl(ISRC);
      const promise = fetch(
        requestUrl,
        { headers: this._headers, method: "GET" }
      ).then(response => response.json());

      promises.push(promise);
    }

    return promises;
  }

  _getRequestUrl(ISRC) {
    const endpoint = "search";
    const queryParam = `q=isrc:${ISRC}`;
    const typeParam = "type=track";

    let requestUrl = `https://${this._apiUrl}/${endpoint}`;
    requestUrl += `?${queryParam}`;
    requestUrl += `&${typeParam}`;

    return requestUrl;
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
  Tracks
};
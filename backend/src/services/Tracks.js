require("dotenv").config();

class Tracks {
  constructor(authenticateService, treatUntreatedTracks) {
    this._authenticateService = authenticateService;
    this._treatUntreatedTracks = treatUntreatedTracks;
    this._apiUrl = process.env.SPOTIFY_API_URL;
    this._headers = new Headers();
  }

  async getTracksByISRCs(ISRCs) {
    const untreatedTracks = await this._fetchUntreatedTracksByISRCs(ISRCs);
    const treatedTracks = 
      this._treatUntreatedTracks.getTreatedTracksProperties(untreatedTracks);

    return treatedTracks; 
  }

  async _fetchUntreatedTracksByISRCs(ISRCs) {
    const accessToken = await this._authenticateService.getAccessToken();
    this._appendBearerTokenToHeader(accessToken);  

    const untreatedTracks = [];
    const requestPromises = this._getRequestsPromises(ISRCs);
    await Promise
      .all(requestPromises)
      .then(trackDataArray => untreatedTracks.push(...trackDataArray));

    return untreatedTracks;
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
}

module.exports = {
  Tracks
};
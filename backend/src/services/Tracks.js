require("dotenv").config();

class Tracks {
  constructor(authenticationService) {
    this._authenticationService = authenticationService;

    this._apiUrl = process.env.SPOTIFY_API_URL;
    this._headers = new Headers();
  }

  async fetchTracksByISRCs(ISRCs) {
    const accessToken = await this._authenticationService.getAccessToken();
    this._appendBearerTokenToHeader(accessToken);
    

    const tracks = [];

    const requestPromises = this._getRequestsPromises(ISRCs);
    await Promise
      .all(requestPromises)
      .then(trackDataArray => tracks.push(...trackDataArray));

    return tracks;
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

  _appendBearerTokenToHeader(accessToken) {
    this._headers.append(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }
}

module.exports = {
  Tracks
};
require("dotenv").config();

class Authentication {
  constructor() {
    this._authApiUrl = process.env.SPOTIFY_AUTH_API_URL;
    this._clientId = process.env.CLIENT_ID;
    this._clientSecret = process.env.CLIENT_SECRET;
    this._headers = new Headers();
  }

  async getAccessToken() {
    this._appendContentTypeToHeaders("application/x-www-form-urlencoded");
    
    const requestUrl = this._getRequestUrl();
    
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: this._headers
    });

    const { access_token } = await response.json();
    return access_token;
  }

  _getRequestUrl() {
    const grantTypeParam = "grant_type=client_credentials";
    const clientIdParam = `client_id=${this._clientId}`;
    const clientSecretParam = `client_secret=${this._clientSecret}`;
    
    let requestUrl = `https://${this._authApiUrl}/token`;
    requestUrl += `?${grantTypeParam}`;
    requestUrl += `&${clientIdParam}`;
    requestUrl += `&${clientSecretParam}`;

    return requestUrl;
  }

  _appendContentTypeToHeaders(contentType) {
    this._headers.append(
      "Content-Type",
      contentType
    );
  }
}

module.exports = {
  Authentication
};
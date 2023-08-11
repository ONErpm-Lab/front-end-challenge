const {
  Authenticate,
  GetTracks,
  TreatUntreatedTracks
} = require("../services");

const ISRCs = [
  "US7VG1846811",
  "US7QQ1846811",
  "BRC310600002",
  "BR1SP1200071",
  "BR1SP1200070",
  "BR1SP1500002",
  "BXKZM1900338",
  "BXKZM1900345",
  "QZNJX2081700",
  "QZNJX2078148"
];

class Tracks {
  constructor() {
    this._authenticateService = new Authenticate()
    this._treatUntreatedTracksService = new TreatUntreatedTracks();
    this._getTracksService = new GetTracks(
      this._authenticateService,
      this._treatUntreatedTracksService
    );
  }

  async getTracks() {
    const tracks = await this._getTracksService.getTracksByISRCs(ISRCs);
    return tracks;
  }
}

module.exports = {
  Tracks
}
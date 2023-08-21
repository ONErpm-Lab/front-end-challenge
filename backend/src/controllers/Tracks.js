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
  "QZNJX2078148",
  "USWB10300468",
  "USSM11707035",
  "BRBRI0500413",
  "GBARL2001273",
  "GBARL1202418",
  "QZDA82146340",
  "DES370500352",
  "SEY491300022",
  "QM2PV1660830",
  "USRE11000568",
  "USAT21700684"
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
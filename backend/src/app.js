const express = require("express");
const { Authenticate, Tracks, TreatUntreatedTracks } = require("./services");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get('/tracks', async (_, res) => {
  const authenticateService = new Authenticate();
  const treatUntreatedTracksService = new TreatUntreatedTracks();
  const tracksService = new Tracks(
    authenticateService,
    treatUntreatedTracksService
  );
  
  try {
    const tracks = await tracksService.getTracksByISRCs(ISRCs);
    res.status(200).json({ data: tracks });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
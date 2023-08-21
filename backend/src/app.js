const express = require("express");
const { Tracks } = require("./controllers");

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOW_ORIGIN_COMMAND_LINE_ARG = process.argv.slice(2)[0];

app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", ALLOW_ORIGIN_COMMAND_LINE_ARG);
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get('/tracks', async (_, res) => {
  const tracksController = new Tracks(); 
  
  try {
    const tracks = await tracksController.getTracks();
    res.status(200).json({ data: tracks });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}, allowing requests from ${ALLOW_ORIGIN_COMMAND_LINE_ARG}`);
});
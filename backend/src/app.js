const express = require("express");
const { Tracks } = require("./controllers");

const app = express();
const PORT = process.env.PORT || 3000;

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
  console.log(`Server is running on port ${PORT}`);
});
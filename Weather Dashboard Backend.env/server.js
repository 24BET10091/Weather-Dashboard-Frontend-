const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT|| 5000;
const API_KEY = process.env.API_KEY;
app.use(cors());

app.get("/weather/:city", async (req,res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
    res.json(response.data);

  } catch(error) {
    res.status(500).json({error: "Failed to fetch weather data"});
  }
});
app.get("/forecast/:city", async(req,res) => {
  const city = req.params.city;
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    res.json(response.data);
  } catch(error) {
    res.status(500).json({error: "Failed to fetch forecast data"});
  }
});

app.get("/airquality/:lat/:lon", async(req, res )=> {
  const {lat,lon} = req.params;
  try {
    const response = await axios.get(
           `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch air quality data"});
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


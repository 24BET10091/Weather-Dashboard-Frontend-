const express = require('express')
const mongoose = require('mongoose')
const axios = require('axios')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/weatherAI'

mongoose.connect(mongoUri).catch(err => {
  console.warn('MongoDB connection unavailable, continuing without database storage:', err.message)
})

const weatherSchema = new mongoose.Schema({
  city: String,
  country: String,
  state: String,
  temperature: Number,
  description: String,
  icon: String,
  humidity: Number,
  pressure: Number,
  visibility: Number,
  windSpeed: Number,
  feelsLike: Number,
  sunrise: Number,
  sunset: Number,
  sunriseTime: String,
  sunsetTime: String,
  timezoneOffset: Number,
  currentTime: String,
  currentDate: String,
  aqi: Number,
  pm2_5: Number,
  pm10: Number,
  co: Number,
  no: Number,
  no2: Number,
  nh3: Number,
  o3: Number,
  so2: Number,
  date: { type: Date, default: Date.now }
})

const Weather = mongoose.model('Weather', weatherSchema)

function hasValidApiKey() {
  const apiKey = (process.env.OPENWEATHER_KEY || '').trim()
  return Boolean(apiKey && !/your_actual_openweather_api_key/i.test(apiKey))
}

function getDemoTimestamp(hoursFromNow = 0) {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000)
  return Math.floor(date.getTime() / 1000)
}

function getDemoWeather(city) {
  const now = new Date()
  return {
    city: city || 'Delhi',
    country: 'IN',
    name: city || 'Delhi',
    main: { temp: 31, humidity: 45, pressure: 1011, feels_like: 33 },
    weather: [{ description: 'clear sky', icon: '01d' }],
    visibility: 10000,
    wind: { speed: 3.2 },
    sys: {
      country: 'IN',
      sunrise: getDemoTimestamp(-6),
      sunset: getDemoTimestamp(18)
    },
    timezone: 19800,
    coord: { lat: 28.6139, lon: 77.209 },
    currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    currentDate: now.toDateString()
  }
}

function getDemoAqi() {
  return {
    main: { aqi: 2 },
    components: { pm2_5: 18, pm10: 27, co: 240, no: 2, no2: 18, nh3: 8, o3: 24, so2: 6 }
  }
}

function getLocalDateTime(unix, offset) {
  const date = new Date((unix + offset) * 1000)
  return {
    time: date.toUTCString().slice(17, 22),
    fullTime: date.toUTCString().slice(17, 25),
    date: date.toUTCString().slice(0, 16)
  }
}

function makeWeatherObject(weather, aqi) {
  const offset = weather.timezone || 0
  const now = Math.floor(Date.now() / 1000)
  const localNow = getLocalDateTime(now, offset)
  const sunrise = getLocalDateTime(weather.sys.sunrise, offset)
  const sunset = getLocalDateTime(weather.sys.sunset, offset)

  return {
    city: weather.name,
    country: weather.sys.country,
    state: weather.name,
    temperature: weather.main.temp,
    description: weather.weather[0].description,
    icon: weather.weather[0].icon,
    humidity: weather.main.humidity,
    pressure: weather.main.pressure,
    visibility: weather.visibility,
    windSpeed: weather.wind.speed,
    feelsLike: weather.main.feels_like,
    sunrise: weather.sys.sunrise,
    sunset: weather.sys.sunset,
    sunriseTime: sunrise.time,
    sunsetTime: sunset.time,
    timezoneOffset: offset,
    currentTime: localNow.fullTime,
    currentDate: localNow.date,
    aqi: aqi.main.aqi,
    pm2_5: aqi.components.pm2_5,
    pm10: aqi.components.pm10,
    co: aqi.components.co,
    no: aqi.components.no,
    no2: aqi.components.no2,
    nh3: aqi.components.nh3,
    o3: aqi.components.o3,
    so2: aqi.components.so2
  }
}

async function fetchWeatherByCity(city) {
  if (!hasValidApiKey()) {
    return makeWeatherObject(getDemoWeather(city), getDemoAqi())
  }

  const apiKey = process.env.OPENWEATHER_KEY.trim()

  const weatherRes = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: { q: city, appid: apiKey, units: 'metric' }
  })
  const weather = weatherRes.data
  const aqiRes = await axios.get('https://api.openweathermap.org/data/2.5/air_pollution', {
    params: { lat: weather.coord.lat, lon: weather.coord.lon, appid: apiKey }
  })

  return makeWeatherObject(weather, aqiRes.data.list[0])
}

async function fetchWeatherByCoords(lat, lon) {
  if (!hasValidApiKey()) {
    return makeWeatherObject(getDemoWeather('Current Location'), getDemoAqi())
  }

  const apiKey = process.env.OPENWEATHER_KEY.trim()

  const weatherRes = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: { lat, lon, appid: apiKey, units: 'metric' }
  })
  const weather = weatherRes.data
  const aqiRes = await axios.get('https://api.openweathermap.org/data/2.5/air_pollution', {
    params: { lat: weather.coord.lat, lon: weather.coord.lon, appid: apiKey }
  })

  return makeWeatherObject(weather, aqiRes.data.list[0])
}

async function saveWeather(weatherData) {
  try {
    await new Weather(weatherData).save()
  } catch (dbError) {
    console.warn('Weather save skipped because MongoDB is not available:', dbError.message)
  }
}

async function getForecastData(params) {
  if (!hasValidApiKey()) {
    return {
      city: { timezone: 19800 },
      list: Array.from({ length: 8 }, (_, index) => ({
        dt: getDemoTimestamp(index * 3),
        main: { temp: 30 + (index % 3), temp_min: 28, temp_max: 33 },
        weather: [{ icon: '01d', description: 'clear sky' }]
      }))
    }
  }

  const apiKey = process.env.OPENWEATHER_KEY.trim()
  const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
    params: { ...params, appid: apiKey, units: 'metric' }
  })
  return response.data
}

async function getDailyForecastData(params) {
  if (!hasValidApiKey()) {
    return {
      list: Array.from({ length: 5 }, (_, index) => ({
        dt: getDemoTimestamp(index * 24),
        temp: { day: 32 + index, min: 28, max: 35 },
        weather: [{ icon: '01d', description: 'clear sky' }]
      }))
    }
  }

  const apiKey = process.env.OPENWEATHER_KEY.trim()
  const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast/daily', {
    params: { ...params, cnt: 16, appid: apiKey, units: 'metric' }
  })
  return response.data
}

function formatHourly(data) {
  const offset = data.city.timezone || 0
  return data.list.slice(0, 8).map(item => {
    const local = new Date((item.dt + offset) * 1000)
    return {
      time: local.toUTCString().slice(17, 22),
      date: local.toUTCString().slice(0, 16),
      temp: item.main.temp,
      icon: item.weather[0].icon,
      description: item.weather[0].description
    }
  })
}

function formatDaily(data) {
  const offset = data.city.timezone || 0
  const daily = []
  const seen = new Set()

  data.list.forEach(item => {
    const local = new Date((item.dt + offset) * 1000)
    const dayKey = local.toUTCString().slice(0, 16)
    const hour = local.getUTCHours()

    if (!seen.has(dayKey) && hour >= 11 && hour <= 14) {
      seen.add(dayKey)
      daily.push({
        day: local.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
        date: local.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        temp: item.main.temp,
        icon: item.weather[0].icon,
        description: item.weather[0].description,
        time: local.toUTCString().slice(17, 22)
      })
    }
  })

  return daily.slice(0, 5)
}

function formatMonthly(data) {
  return (data.list || []).slice(0, 16).map(item => ({
    date: new Date(item.dt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    temp: item.temp?.day ?? item.main?.temp ?? 0,
    min: item.temp?.min ?? item.main?.temp_min ?? 0,
    max: item.temp?.max ?? item.main?.temp_max ?? 0,
    icon: item.weather?.[0]?.icon ?? item.icon,
    description: item.weather?.[0]?.description ?? item.description ?? 'Forecast'
  }))
}

function formatYearly(data) {
  const monthly = formatMonthly(data)
  return {
    label: 'Yearly outlook (forecast summary)',
    avgTemp: monthly.reduce((sum, item) => sum + Number(item.temp || 0), 0) / Math.max(monthly.length, 1),
    minTemp: Math.min(...monthly.map(item => Number(item.min || 0))),
    maxTemp: Math.max(...monthly.map(item => Number(item.max || 0))),
    entries: monthly.slice(0, 12)
  }
}

app.get('/weather/location', async (req, res) => {
  const lat = req.query.lat
  const lon = req.query.lon

  if (lat == null || lon == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' })
  }

  try {
    const weatherData = await fetchWeatherByCoords(lat, lon)
    await saveWeather(weatherData)
    res.json(weatherData)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather data by location' })
  }
})

app.get('/weather/coords/:lat/:lon', async (req, res) => {
  try {
    const weatherData = await fetchWeatherByCoords(req.params.lat, req.params.lon)
    await saveWeather(weatherData)
    res.json(weatherData)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch weather data by coordinates. Set OPENWEATHER_KEY in .env for live weather.' })
  }
})

app.get('/weather/:city', async (req, res) => {
  try {
    const weatherData = await fetchWeatherByCity(req.params.city)
    await saveWeather(weatherData)
    res.json(weatherData)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch weather data. Set OPENWEATHER_KEY in .env for live weather.' })
  }
})

app.get('/time/:city', async (req, res) => {
  try {
    const weatherData = await fetchWeatherByCity(req.params.city)
    res.json({
      city: weatherData.city,
      country: weatherData.country,
      state: weatherData.state,
      currentTime: weatherData.currentTime,
      currentDate: weatherData.currentDate,
      timezoneOffset: weatherData.timezoneOffset
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch local time' })
  }
})

app.get('/time/coords/:lat/:lon', async (req, res) => {
  try {
    const weatherData = await fetchWeatherByCoords(req.params.lat, req.params.lon)
    res.json({
      city: weatherData.city,
      country: weatherData.country,
      state: weatherData.state,
      currentTime: weatherData.currentTime,
      currentDate: weatherData.currentDate,
      timezoneOffset: weatherData.timezoneOffset
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch local time by coordinates' })
  }
})

app.get('/forecast/:city', async (req, res) => {
  try {
    const data = await getForecastData({ q: req.params.city })
    res.json(formatDaily(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forecast data' })
  }
})

app.get('/forecast/coords/:lat/:lon', async (req, res) => {
  try {
    const data = await getForecastData({ lat: req.params.lat, lon: req.params.lon })
    res.json(formatDaily(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forecast data by coordinates' })
  }
})

app.get('/hourly/:city', async (req, res) => {
  try {
    const data = await getForecastData({ q: req.params.city })
    res.json(formatHourly(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hourly forecast' })
  }
})

app.get('/hourly/coords/:lat/:lon', async (req, res) => {
  try {
    const data = await getForecastData({ lat: req.params.lat, lon: req.params.lon })
    res.json(formatHourly(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hourly forecast by coordinates' })
  }
})

app.get('/monthly/:city', async (req, res) => {
  try {
    const data = await getDailyForecastData({ q: req.params.city })
    res.json(formatMonthly(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly forecast' })
  }
})

app.get('/monthly/coords/:lat/:lon', async (req, res) => {
  try {
    const data = await getDailyForecastData({ lat: req.params.lat, lon: req.params.lon })
    res.json(formatMonthly(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly forecast by coordinates' })
  }
})

app.get('/yearly/:city', async (req, res) => {
  try {
    const data = await getDailyForecastData({ q: req.params.city })
    res.json(formatYearly(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch yearly outlook' })
  }
})

app.get('/yearly/coords/:lat/:lon', async (req, res) => {
  try {
    const data = await getDailyForecastData({ lat: req.params.lat, lon: req.params.lon })
    res.json(formatYearly(data))
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch yearly outlook by coordinates' })
  }
})

app.get('/history', async (req, res) => {
  try {
    const history = await Weather.find().sort({ date: -1 }).limit(10)
    res.json(history)
  } catch (error) {
    res.status(200).json([])
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log('Backend running on port ' + PORT)
})

let cityInput = document.getElementById('city_input'),
searchBtn = document.getElementById('searchBtn'),
locationBtn = document.getElementById('locationBtn'),
liveStatus = document.getElementById('liveStatus'),
weatherEffects = document.getElementById('weather-effects'),
api_key = 'b90a3e609e0b429d20ea7c58fb222481',
currentWeatherCard = document.querySelector('.weather-left .card'),
fiveDaysForecastCard = document.querySelector('.day-forecast'),
aqiCard = document.querySelector('.highlights .card'),
sunriseCard = document.querySelectorAll('.highlights .card')[1],
humidityVal = document.getElementById('humidityVal'),
pressureVal = document.getElementById('pressureVal'),
visibilityVal = document.getElementById('visibilityVal'),
windSpeedVal = document.getElementById('windSpeedVal'),
feelsVal = document.getElementById('feelsVal'),
hourlyForecastCard = document.querySelector('.hourly-forecast'),
liveWeatherSnippet = document.getElementById('live-weather-snippet'),
aqiList = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
let currentWeatherContext = null;
let autoRefreshTimer = null;

function updateLiveStatus(text, type = 'live') {
    if (!liveStatus) return;
    liveStatus.textContent = text;
    liveStatus.className = `live-pill ${type}`;
}

function createWeatherOverlay(type, count = 90) {
    if (!weatherEffects) return;
    weatherEffects.innerHTML = '';

    if (type === 'rain' || type === 'drizzle') {
        for (let i = 0; i < count; i++) {
            const drop = document.createElement('span');
            drop.className = 'weather-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.top = `${Math.random() * -20}%`;
            drop.style.animationDelay = `${Math.random() * 1.3}s`;
            drop.style.animationDuration = `${0.7 + Math.random() * 0.8}s`;
            weatherEffects.appendChild(drop);
        }
        return;
    }

    if (type === 'thunderstorm') {
        weatherEffects.classList.add('storm');
        const bolt = document.createElement('div');
        bolt.className = 'thunderbolt';
        weatherEffects.appendChild(bolt);
        for (let i = 0; i < count; i++) {
            const drop = document.createElement('span');
            drop.className = 'weather-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.top = `${Math.random() * -20}%`;
            drop.style.animationDelay = `${Math.random() * 1.2}s`;
            weatherEffects.appendChild(drop);
        }
        return;
    }

    if (type === 'clouds') {
        for (let i = 0; i < 4; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'weather-cloud';
            cloud.style.left = `${-20 + i * 25}%`;
            cloud.style.top = `${10 + i * 10}%`;
            cloud.style.animationDuration = `${16 + i * 5}s`;
            weatherEffects.appendChild(cloud);
        }
    }
}

function applyWeatherEffects(description, mainWeather) {
    if (!weatherEffects) return;
    const combined = `${mainWeather} ${description}`.toLowerCase();
    weatherEffects.className = 'weather-effects';
    weatherEffects.innerHTML = '';

    if (combined.includes('thunderstorm') || combined.includes('storm')) {
        weatherEffects.classList.add('storm');
        createWeatherOverlay('thunderstorm');
    } else if (combined.includes('rain') || combined.includes('drizzle')) {
        weatherEffects.classList.add('rain');
        createWeatherOverlay('rain');
    } else if (combined.includes('cloud')) {
        createWeatherOverlay('clouds');
    } else if (combined.includes('snow')) {
        weatherEffects.classList.add('snow');
    }
}

function refreshWeather() {
    if (!currentWeatherContext) return;
    getWeatherDetails(currentWeatherContext.name, currentWeatherContext.lat, currentWeatherContext.lon, currentWeatherContext.country, currentWeatherContext.state || '', currentWeatherContext.useGeolocation);
}

function fetchJson(url) {
    return fetch(url)
    .then(async res => {
        let data = await res.json();
        if(!res.ok) {
            throw new Error(data.message || 'Request failed');
        }
        return data;
    });
}
function getCityCoordinates() {
    if (!cityInput) return;
    let cityName = cityInput.value.trim();
    cityInput.value = '';
    if(!cityName) return;
    let GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${api_key}`;
    updateLiveStatus(`Searching ${cityName}…`, 'loading');
    fetchJson(GEOCODING_API_URL)
    .then(data => {
        if(!data.length) {
            alert('City not found');
            return;
        }
        let {name, lat, lon, country, state} = data[0];
        currentWeatherContext = { name, lat, lon, country, state: state || '', useGeolocation: false };
        getWeatherDetails(name, lat, lon, country, state || '');
    })
    .catch(error => {
        console.log(error.message);
        alert('Failed to fetch city');
    });

}
function getWeatherDetails(name,lat, lon, country, state, useGeolocation = false) {
      let WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}&units=metric`;
    let FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}&units=metric`;
    let AIR_POLLUTION_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`;
    updateLiveStatus(`Updating ${name} live…`, 'loading');
    Promise.all([
        fetchJson(WEATHER_API_URL),
        fetchJson(FORECAST_API_URL),
        fetchJson(AIR_POLLUTION_API_URL)

    ])
    .then(([weatherData, forecastData, airData]) => {
        let weather = weatherData.weather[0];
        let air = airData.list[0];
        let components = air.components;
        currentWeatherContext = { name, lat, lon, country, state, useGeolocation };
        applyWeatherEffects(weather.description, weather.main);
        if (currentWeatherCard) {
            currentWeatherCard.innerHTML = `
            <div class="current-weather">
            <div class="details">
            <p>Now</p>
            <h2>${Math.round(weatherData.main.temp)}&deg;C</h2>
            <p>${weather.description}</p>
            </div>
            <div class="weather-icon">
            <img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" alt="">
            </div>
            </div>
            <hr>
            <div class="card-footer">
            <p><i class="fa-light fa-calendar"></i> ${moment().format('dddd, D MMM YYYY')}</p>
            <p><i class="fa-light fa-location-dot"></i> ${name}, ${country}</p>
            </div>
            `;
        }
        if (aqiCard) {
            aqiCard.innerHTML = `
            <div class="card-head">
            <p>Air Quality Index</p>
            <p class="air-index aqi-${air.main.aqi}">${aqiList[air.main.aqi - 1]}</p>
            </div>
            <div class="air-indices">
            <i class="fa-solid fa-wind fa-3x"></i>
            <div class="item"><p>PM2.5</p><h2>${components.pm2_5}</h2></div>
            <div class="item"><p>PM10</p><h2>${components.pm10}</h2></div>
            <div class="item"><p>SO2</p><h2>${components.so2}</h2></div>
            <div class="item"><p>CO</p><h2>${components.co}</h2></div>
            <div class="item"><p>NO</p><h2>${components.no}</h2></div>
            <div class="item"><p>NO2</p><h2>${components.no2}</h2></div>
            <div class="item"><p>NH3</p><h2>${components.nh3}</h2></div>
            <div class="item"><p>O3</p><h2>${components.o3}</h2></div>
            </div>
            `;
        }
        if (sunriseCard) {
            sunriseCard.innerHTML = `
            <div class="card-head">
                <p>Sunrise & Sunset</p>
            </div>

            <div class="sunrise-sunset">
                <div class="item">
                    <div class="icon">
                        <i class="fa-solid fa-sun fa-3x"></i>
                    </div>
                    <div>
                        <p>Sunrise</p>
                        <h2>${moment.utc((weatherData.sys.sunrise + weatherData.timezone) * 1000).format('hh:mm A')}</h2>
                    </div>
                </div>

                <div class="item">
                    <div class="icon">
                        <i class="fa-solid fa-cloud-sun fa-3x"></i>
                    </div>
                    <div>
                        <p>Sunset</p>
                        <h2>${moment.utc((weatherData.sys.sunset + weatherData.timezone) * 1000).format('hh:mm A')}</h2>
                    </div>
                </div>
            </div>
            `;
        }
        if (humidityVal) humidityVal.innerHTML = `${weatherData.main.humidity}%`;
        if (pressureVal) pressureVal.innerHTML = `${weatherData.main.pressure} hPa`;
        if (visibilityVal) visibilityVal.innerHTML = `${(weatherData.visibility / 1000).toFixed(1)} km`;
        if (windSpeedVal) windSpeedVal.innerHTML = `${weatherData.wind.speed} m/s`;
        if (feelsVal) feelsVal.innerHTML = `${Math.round(weatherData.main.feels_like)}&deg;C`;
        if (liveWeatherSnippet) {
            liveWeatherSnippet.innerHTML = `<strong>${name}</strong> • ${Math.round(weatherData.main.temp)}°C • ${weather.description} • AQI ${air.main.aqi}`;
        }
        updateLiveStatus(`Live • ${name} • ${Math.round(weatherData.main.temp)}°C`, 'live');
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
        autoRefreshTimer = setInterval(refreshWeather, 300000);
        getForecast(forecastData);
        getHourlyForecast(forecastData);
        })
        .catch(error => {
            console.log(error.message);
            updateLiveStatus('Unable to update weather right now', 'loading');
            alert('Failed to fetch weather');
        });
}
if (currentWeatherCard) currentWeatherCard.innerHTML = '<h2>Loading...</h2>';

function getForecast(data) {
    if (!fiveDaysForecastCard) return;
    fiveDaysForecastCard.innerHTML = '';

    let uniqueForecastDays = [];

    data.list.forEach(item => {
        let forecastDate = item.dt_txt.split(' ')[0];

        if (!uniqueForecastDays.includes(forecastDate) && item.dt_txt.includes('12:00:00')) {
            uniqueForecastDays.push(forecastDate);

            fiveDaysForecastCard.innerHTML += `
                <div class="forecast-item">
                    <div class="icon-wrapper">
                        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="">
                        <span>${Math.round(item.main.temp)}&deg;C</span>
                    </div>
                    <p>${moment(item.dt_txt).format('D MMM')}</p>
                    <p>${moment(item.dt_txt).format('dddd')}</p>
                </div>
            `;
        }
    });
}

function getHourlyForecast(data) {
    if (!hourlyForecastCard) return;
    hourlyForecastCard.innerHTML = '';

    data.list.slice(0, 8).forEach(item => {
        hourlyForecastCard.innerHTML += `
            <div class="card">
                <p>${moment(item.dt_txt).format('h A')}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="">
                <p>${Math.round(item.main.temp)}&deg;C</p>
            </div>
        `;
    });
}

function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;
            let REVERSE_GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${api_key}`;

            fetchJson(REVERSE_GEOCODING_API_URL)
                .then(data => {
                    if (!data.length) {
                        alert('Location not found');
                        return;
                    }

                    let { name, country, state } = data[0];
                    currentWeatherContext = { name, lat, lon, country, state: state || '', useGeolocation: true };
                    getWeatherDetails(name, lat, lon, country, state || '', true);
                })
                .catch(error => {
                    console.log(error.message);
                    alert('Failed to fetch location');
                });
        },
        () => alert('Location permission denied')
    );
}

if (searchBtn) searchBtn.addEventListener('click', getCityCoordinates);
if (locationBtn) locationBtn.addEventListener('click', getCurrentLocationWeather);
if (cityInput) cityInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        getCityCoordinates();
    }
});

window.addEventListener('load', () => {
    if (navigator.geolocation) {
        getCurrentLocationWeather();
    } else if (cityInput) {
        cityInput.value = 'Delhi';
        getCityCoordinates();
    }
});
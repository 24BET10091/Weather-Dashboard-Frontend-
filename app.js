let cityInput = document.getElementById('city_input'),
    searchBtn = document.getElementById('searchBtn'),
    locationBtn = document.getElementById('locationBtn'),
    api_key = 'b90a3e609e0b429d20ea7c58fb222481',
    currentWeatherCard = document.querySelectorAll('.weather-left .card')[0],
    fiveDaysForecastCard = document.querySelector('.day-forecast'),
    aqiCard = document.querySelectorAll('.highlights .card')[0],
    sunriseCard = document.querySelectorAll('.highlights .card')[1],
    humidityVal = document.getElementById('humidityVal'),
    pressureVal = document.getElementById('pressureVal'),
    visibilityVal = document.getElementById('visibilityVal'),
    windSpeedVal = document.getElementById('windSpeedVal'),
    feelsVal = document.getElementById('feelsVal'),
    hourlyForecastCard = document.querySelector('.hourly-forecast'),
    aqiList = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

function fetchJson(url) {
    return fetch(url)
        .then(async res => {
            let data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        });
}

function getCityCoordinates() {
    let cityName = cityInput.value.trim();
    cityInput.value = '';

    if (!cityName) return;

    let GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${api_key}`;

    fetchJson(GEOCODING_API_URL)
        .then(data => {
            if (!data.length) {
                alert('City not found');
                return;
            }

            let { name, lat, lon, country, state } = data[0];
            getWeatherDetails(name, lat, lon, country, state || '');
        })
        .catch(error => {
            console.log(error.message);
            alert('Failed to fetch city');
        });
}

function getWeatherDetails(name, lat, lon, country, state) {
    let WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}&units=metric`;
    let FORECAST_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${api_key}&units=metric`;
    let AIR_POLLUTION_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${api_key}`;

    Promise.all([
        fetchJson(WEATHER_API_URL),
        fetchJson(FORECAST_API_URL),
        fetchJson(AIR_POLLUTION_API_URL)
    ])
        .then(([weatherData, forecastData, airData]) => {
            let weather = weatherData.weather[0];
            let air = airData.list[0];
            let components = air.components;

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

            aqiCard.innerHTML = `
                <div class="card-head">
                    <p>Air Quality Index</p>
                    <p class="air-index aqi-${air.main.aqi}">${aqiList[air.main.aqi - 1]}</p>
                </div>
                <div class="air-indices">
                    <i class="fa regular fa-wind fa-3x"></i>
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

            sunriseCard.innerHTML = `
                <div class="card-head">
                    <p>Sunrise & Sunset</p>
                </div>
                <div class="sunrise-sunset">
                    <div class="item">
                        <div class="icon">
                            <i class="fa-light fa-sunrise fa-4x"></i>
                        </div>
                        <div>
                            <p>Sunrise</p>
                            <h2>${moment.unix(weatherData.sys.sunrise).format('hh:mm A')}</h2>
                        </div>
                    </div>
                    <div class="item">
                        <div class="icon">
                            <i class="fa-light fa-sunset fa-4x"></i>
                        </div>
                        <div>
                            <p>Sunset</p>
                            <h2>${moment.unix(weatherData.sys.sunset).format('hh:mm A')}</h2>
                        </div>
                    </div>
                </div>
            `;

            humidityVal.innerHTML = `${weatherData.main.humidity}%`;
            pressureVal.innerHTML = `${weatherData.main.pressure} hPa`;
            visibilityVal.innerHTML = `${(weatherData.visibility / 1000).toFixed(1)} km`;
            windSpeedVal.innerHTML = `${weatherData.wind.speed} m/s`;
            feelsVal.innerHTML = `${Math.round(weatherData.main.feels_like)}&deg;C`;

            getForecast(forecastData);
            getHourlyForecast(forecastData);
        })
        .catch(error => {
            console.log(error.message);
            alert('Failed to fetch weather');
        });
}

function getForecast(data) {
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
                    getWeatherDetails(name, lat, lon, country, state || '');
                })
                .catch(error => {
                    console.log(error.message);
                    alert('Failed to fetch location');
                });
        },
        () => alert('Location permission denied')
    );
}

searchBtn.addEventListener('click', getCityCoordinates);

locationBtn.addEventListener('click', getCurrentLocationWeather);

cityInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        getCityCoordinates();
    }
});

window.addEventListener('load', () => {
    cityInput.value = 'Delhi';
    getCityCoordinates();
});
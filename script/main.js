const FIREBASE_URL = "https://aquaclima-576b3-default-rtdb.firebaseio.com/";

window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.style.display = 'none', 600);
    }, 4000); // Show for 4 seconds
  }
});

// Update your UI here
function updateUI(data) {
  document.getElementById("soilMoisture").innerText = data.soil + " %";
  document.getElementById("phValue").innerText = data.ph;
  document.getElementById("flowRate").innerText = data.flow + " L/min";
  document.getElementById("waterLevel").innerText = data.water_level + " cm";
  document.getElementById("waterTemp").innerText = data.water_temp + " °C";
  document.getElementById("airData").innerText = data.air_temp + " °C / " + data.humidity + " %";
  document.getElementById("airQuality").innerText = data.air_quality + " AQI";
}

async function fetchSensorData() {
  try {
    const res = await fetch(`${FIREBASE_URL}/sensors.json`);
    const data = await res.json();
    updateUI(data);
  } catch (e) {
    console.error("Failed to fetch sensor data", e);
  }
}

async function fetchAIRecommendation() {
  try {
    const res = await fetch(`${FIREBASE_URL}/ai/recommendation.json`);
    const data = await res.json();
    document.getElementById("aiRecommendation").innerText = data;
  } catch (e) {
    console.error("Failed to fetch AI recommendation", e);
  }
}

function showPumpPopup(isOn) {
  const popup = document.getElementById('pump-popup');
  const sound = document.getElementById('pump-sound');
  if (popup) {
    popup.querySelector('.pump-message').textContent = isOn ? "Pump Started!" : "Pump Stopped!";
    popup.querySelector('.pump-icon').textContent = isOn ? "💧" : "🛑";
    popup.style.display = 'flex';
    popup.style.opacity = '1';
    sound.currentTime = 0;
    sound.play();
    setTimeout(() => {
      popup.style.opacity = '0';
      setTimeout(() => popup.style.display = 'none', 400);
    }, 3000); // Hide after 3 seconds
  }
}

// Call this in togglePump after successful fetch:
async function togglePump(state) {
  try {
    await fetch(`${FIREBASE_URL}/controls.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pump: state })
    });
    showPumpPopup(state); // Show popup
    alert(`Pump turned ${state ? "ON" : "OFF"}`);
  } catch (e) {
    console.error("Failed to update pump state", e);
  }
}

function refreshAllData() {
  fetchSensorData();
  fetchAIRecommendation();

  // Refresh weather (auto-detect location each time for accuracy)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        updateWeather(pos.coords.latitude, pos.coords.longitude);
      },
      err => {
        updateWeather(51.5074, -0.1278); // fallback to London
      }
    );
  } else {
    updateWeather(51.5074, -0.1278);
  }

  // Fetch pump status if you have a separate endpoint
  fetchPumpStatus();

  // Check air quality and show alert if needed
  checkAirQuality();
}

// Example pump status fetcher (customize as needed)
async function fetchPumpStatus() {
  try {
    const res = await fetch(`${FIREBASE_URL}/controls.json`);
    const data = await res.json();
    setPumpStatus(data.pump); // true/false
  } catch (e) {
    console.error("Failed to fetch pump status", e);
  }
}

// Example air quality checker (customize threshold as needed)
function checkAirQuality() {
  const airQualityElem = document.getElementById("airQuality");
  if (airQualityElem) {
    const aqi = parseInt(airQualityElem.textContent);
    if (aqi > 150) { // threshold for "bad" air quality
      showAirQualityAlert("Air Quality is BAD!");
    }
  }
}

// Poll every 5 seconds
setInterval(refreshAllData, 5000);

// Replace 'YOUR_API_KEY' with your OpenWeatherMap API key
const API_KEY = 'f8851fe88abc4439b0c161938250708';

function updateWeather(lat, lon) {
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
    .then(res => res.json())
    .then(data => {
      const weather = data.current_weather;
      document.querySelector('.weather-temp').textContent = `${Math.round(weather.temperature)}°C`;
      document.querySelector('.weather-desc').textContent = getWeatherDescription(weather.weathercode);
      document.querySelector('.weather-humidity').textContent = `Humidity: N/A`;
      document.querySelector('.weather-wind').textContent = `Wind: ${weather.windspeed} km/h`;
      document.querySelector('.weather-icon').textContent = getWeatherIcon(weather.weathercode);

      // Friendly summary
      let summary = `It's currently ${getWeatherDescription(weather.weathercode).toLowerCase()} in your area.`;
      let summaryElem = document.querySelector('.weather-summary');
      if (!summaryElem) {
        summaryElem = document.createElement('div');
        summaryElem.className = 'weather-summary';
        document.querySelector('.weather-details').appendChild(summaryElem);
      }
      summaryElem.textContent = summary;
    });
}

// Weather code mapping for Open-Meteo
function getWeatherDescription(code) {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return map[code] || "Unknown";
}

function getWeatherIcon(code) {
  const iconMap = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌧️", 56: "🌧️", 57: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️", 66: "🌧️", 67: "🌧️",
    71: "❄️", 73: "❄️", 75: "❄️", 77: "❄️",
    80: "🌦️", 81: "🌧️", 82: "🌧️",
    85: "🌨️", 86: "🌨️",
    95: "⛈️", 96: "⛈️", 99: "⛈️"
  };
  return iconMap[code] || "🌦️";
}

// Auto-detect location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      updateWeather(pos.coords.latitude, pos.coords.longitude);
    },
    err => {
      // Fallback: use default city (London)
      updateWeather(51.5074, -0.1278);
    }
  );
} else {
  updateWeather(51.5074, -0.1278);
}

function showAirQualityAlert(message = "Air Quality is BAD!") {
  const popup = document.getElementById('air-quality-popup');
  const sound = document.getElementById('aqi-alert-sound');
  if (popup) {
    popup.querySelector('.aqi-message').textContent = message;
    popup.style.display = 'flex';
    popup.style.opacity = '1';
    sound.currentTime = 0;
    sound.play();
    setTimeout(() => {
      popup.style.opacity = '0';
      setTimeout(() => popup.style.display = 'none', 400);
    }, 4000); // Hide after 4 seconds
  }
}

// Example usage: call this when air quality is bad
// showAirQualityAlert("Air Quality is BAD!");

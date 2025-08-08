const FIREBASE_URL = "https://aquaclima-576b3-default-rtdb.firebaseio.com/";

// Loading screen logic
window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.style.display = 'none', 600);
    }, 4000); // Show for 4 seconds
  }
});

// Update UI with sensor data
function updateUI(data) {
  // Moisture
  document.getElementById("soilMoisture").innerText = data.soil + " %";
  updateGauge("moisture-bar", ".circular-chart.moisture .gauge-value", data.soil, 100, "%");

  // Humidity
  document.getElementById("airHumidity").innerText = data.humidity + " %";
  updateGauge("humidity-bar", ".circular-chart.humidity .gauge-value", data.humidity, 100, "%");

  // Water Level
  const waterLevelStatus = getStatus(data.water_level, [20, 40, 60], ["Low", "Average", "Good", "High"]);
  document.getElementById("waterLevel").innerText = `${waterLevelStatus.text} (${data.water_level} cm)`;
  updateGauge("waterlevel-bar", ".circular-chart.waterlevel .gauge-value", data.water_level, 100, "cm", waterLevelStatus.text);

  // pH Level
  const phStatus = getStatus(data.ph, [5.5, 6.5, 7.5], ["Acidic", "Good", "Average", "Alkaline"]);
  document.getElementById("phValue").innerText = `${phStatus.text} (${data.ph})`;
  updateGauge("ph-bar", ".circular-chart.ph .gauge-value", data.ph, 14, "", phStatus.text);

  // Air Temp / Humidity
  document.getElementById("airData").innerText = `${data.air_temp} °C / ${data.humidity} %`;
  updateGauge("airtemp-bar", ".circular-chart.airtemp .gauge-value", data.air_temp, 50, "°C");

  // Water Temp
  const waterTempStatus = getStatus(data.water_temp, [10, 20, 30], ["Cold", "Good", "Warm", "Hot"]);
  document.getElementById("waterTemp").innerText = `${waterTempStatus.text} (${data.water_temp} °C)`;
  updateGauge("watertemp-bar", ".circular-chart.watertemp .gauge-value", data.water_temp, 50, "°C", waterTempStatus.text);

  // Air Quality
  const airQualityStatus = getStatus(data.air_quality, [50, 100, 150], ["Good", "Average", "Bad", "Very Bad"]);
  document.getElementById("airQuality").innerText = `${airQualityStatus.text} (${data.air_quality} AQI)`;
  updateGauge("airquality-bar", ".circular-chart.airquality .gauge-value", data.air_quality, 500, "AQI", airQualityStatus.text);

  // Water Flow
  const flowStatus = getStatus(data.flow, [1, 3, 5], ["Low", "Average", "Good", "High"]);
  document.getElementById("flowRate").innerText = `${flowStatus.text} (${data.flow} L/min)`;
  updateGauge("flow-bar", ".circular-chart.flow .gauge-value", data.flow, 10, "L/min", flowStatus.text);

  // Battery Percentage
  document.getElementById("batteryPercent").innerText = 
    (data.battery !== undefined ? data.battery + " %" : "-- %");
}

// Helper to update gauge
function updateGauge(barId, valueSelector, value, max, unit, statusText) {
  const bar = document.getElementById(barId);
  const valueElem = document.querySelector(valueSelector);
  if (bar && valueElem) {
    const percent = Math.max(0, Math.min(100, (value / max) * 100));
    bar.setAttribute('stroke-dasharray', `${percent}, 100`);
    valueElem.textContent = statusText ? `${statusText} (${value} ${unit})` : `${value} ${unit}`;
  }
}

// Helper to get status text
function getStatus(value, thresholds, labels) {
  for (let i = 0; i < thresholds.length; i++) {
    if (value < thresholds[i]) return { text: labels[i] };
  }
  return { text: labels[labels.length - 1] };
}

// Fetch sensor data from Firebase
async function fetchSensorData() {
  try {
    const res = await fetch(`${FIREBASE_URL}/sensors.json`);
    const data = await res.json();
    updateUI(data);
  } catch (e) {
    console.error("Failed to fetch sensor data", e);
  }
}

// Fetch AI recommendation
async function fetchAIRecommendation() {
  try {
    const res = await fetch(`${FIREBASE_URL}/ai/recommendation.json`);
    let data = await res.json();
    if (typeof data === "string" && data.startsWith('"') && data.endsWith('"')) {
      data = data.slice(1, -1);
    }
    document.getElementById("aiRecommendation").innerText = data;
  } catch (e) {
    console.error("Failed to fetch AI recommendation", e);
  }
}

// Manual override: Start/Stop Pump
async function togglePumpWithManualOverride(state) {
  try {
    await fetch(`${FIREBASE_URL}/controls.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pump: state, manual_override: true })
    });
    showPumpPopup(state);
    setPumpStatus(state);
  } catch (e) {
    console.error("Failed to update pump state", e);
  }
}

// Return to Auto Mode (automation resumes)
function resetAutoMode() {
  fetch(`${FIREBASE_URL}/controls.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ manual_override: false })
  })
  .then(() => {
    showPumpPopup("auto"); // Show auto mode popup
  })
  .catch((err) => {
    console.error("Failed to reset to auto mode: " + err);
  });
}

// Show pump popup (static, no fade/move, just appears/disappears)
function showPumpPopup(isOn) {
  const popup = document.getElementById('pump-popup');
  const sound = document.getElementById('pump-sound');
  if (popup) {
    if (isOn === "auto") {
      popup.querySelector('.pump-message').textContent = "Auto Mode Activated!";
      popup.querySelector('.pump-icon').textContent = "🤖";
    } else {
      popup.querySelector('.pump-message').textContent = isOn ? "Pump Started!" : "Pump Stopped!";
      popup.querySelector('.pump-icon').textContent = isOn ? "💧" : "🛑";
    }
    popup.style.display = 'flex';
    popup.style.opacity = '1';
    sound.currentTime = 0;
    sound.play();
    setTimeout(() => {
      popup.style.display = 'none';
      popup.style.opacity = '0';
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

// Update pump status on UI
function setPumpStatus(isOn) {
  const pumpStateElem = document.getElementById('pump-state');
  if (pumpStateElem) {
    pumpStateElem.textContent = isOn ? "ON" : "OFF";
    pumpStateElem.className = isOn ? "on" : "off";
  }
}

// Fetch pump status from Firebase
async function fetchPumpStatus() {
  try {
    const res = await fetch(`${FIREBASE_URL}/controls.json`);
    const data = await res.json();
    setPumpStatus(data.pump);
  } catch (e) {
    console.error("Failed to fetch pump status", e);
  }
}

// Animate cards on load
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card').forEach((card, i) => {
    card.style.opacity = '0';
    setTimeout(() => {
      card.style.opacity = '1';
    }, 150 + i * 120);
  });
});

// Enhanced popup show/hide
function showAirQualityAlert(message = "Air Quality is BAD!") {
  const popup = document.getElementById('air-quality-popup');
  const sound = document.getElementById('aqi-alert-sound');
  if (popup) {
    popup.querySelector('.aqi-message').textContent = message;
    popup.style.display = 'flex';
    setTimeout(() => popup.style.opacity = '1', 10);
    sound.currentTime = 0;
    sound.play();
    setTimeout(() => {
      popup.style.opacity = '0';
      setTimeout(() => popup.style.display = 'none', 400);
    }, 4000);
  }
}

// Check air quality and show alert if needed
function checkAirQuality() {
  const airQualityElem = document.getElementById("airQuality");
  if (airQualityElem) {
    const aqi = parseInt(airQualityElem.textContent);
    if (aqi > 150) { // threshold for "bad" air quality
      showAirQualityAlert("Air Quality is BAD!");
    }
  }
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

// Fetch weather from Open-Meteo (no API key needed)
function fetchWeather() {
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
}

function updateWeather(lat, lon) {
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
    .then(res => res.json())
    .then(data => {
      const weather = data.current_weather;
      document.getElementById('weather-summary').textContent =
        `${Math.round(weather.temperature)}°C, ${getWeatherDescription(weather.weathercode)}`;
      document.getElementById('weather-details').textContent =
        `Wind: ${weather.windspeed} km/h`;
    });
}

// Refresh all data
function refreshAllData() {
  fetchSensorData();
  fetchAIRecommendation();
  fetchWeather();
  fetchPumpStatus();

  // Check air quality and show alert if needed
  checkAirQuality();
}

// Poll every 5 seconds
setInterval(refreshAllData, 5000);

// Initial data fetch
refreshAllData();

document.getElementById('fab').onclick = () => {
  refreshAllData();
  document.getElementById('fab').style.transform = 'rotate(360deg)';
  setTimeout(() => document.getElementById('fab').style.transform = '', 400);
};

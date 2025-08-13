const FIREBASE_URL = "https://aquaclima-576b3-default-rtdb.firebaseio.com/";

// Loading screen with smooth animation
window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;

  // Simulate loading progress
  setTimeout(() => {
    loadingScreen.style.animation = "pop-dissolve 0.7s forwards";
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 700);
  }, 2000);
});

// Update UI with sensor data
function updateUI(data) {
  // Soil Moisture
  const soilMoisture = data.soil || 0;
  document.getElementById("soilMoisture").textContent = `${soilMoisture}%`;
  updateProgressRing("soil-progress", soilMoisture, 100);

  // Air Humidity
  const humidity = data.humidity || 0;
  document.getElementById("airHumidity").textContent = `${humidity}%`;
  updateProgressRing("humidity-progress", humidity, 100);

  // Water Level
  const waterLevel = data.water_level || 0;
  const waterStatus = getStatusInfo(waterLevel, [20, 40, 60], ["Low", "Average", "Good", "High"]);
  document.getElementById("waterLevel").textContent = `${waterLevel}%`;
  document.getElementById("water-status").textContent = waterStatus.text;
  document.getElementById("water-status").className = `sensor-status ${waterStatus.class}`;

  // pH Level
  const ph = data.ph || 0;
  const phStatus = getStatusInfo(ph, [5.5, 6.5, 7.5], ["Acidic", "Good", "Average", "Alkaline"]);
  document.getElementById("phValue").textContent = ph.toFixed(1);
  document.getElementById("ph-status").textContent = phStatus.text;
  document.getElementById("ph-status").className = `sensor-status ${phStatus.class}`;

  // Air Temperature
  const airTemp = data.air_temp || 0;
  document.getElementById("airData").textContent = `${airTemp}°C`;

  // Water Temperature
  const waterTemp = data.water_temp || 0;
  const waterTempStatus = getStatusInfo(waterTemp, [10, 20, 30], ["Cold", "Good", "Warm", "Hot"]);
  document.getElementById("waterTemp").textContent = `${waterTemp}°C`;
  document.getElementById("water-temp-status").textContent = waterTempStatus.text;
  document.getElementById("water-temp-status").className = `sensor-status ${waterTempStatus.class}`;

  // Air Quality
  const airQuality = data.air_quality || 0;
  const airQualityStatus = getStatusInfo(airQuality, [50, 100, 150], ["Good", "Average", "Bad", "Hazardous"]);
  document.getElementById("airQuality").textContent = `${airQuality} AQI`;
  document.getElementById("air-quality-status").textContent = airQualityStatus.text;
  document.getElementById("air-quality-status").className = `sensor-status ${airQualityStatus.class}`;

  // Trigger alert if AQI is bad or hazardous
  if (airQualityStatus.text === "Bad" || airQualityStatus.text === "Hazardous") {
    showAirQualityAlert(`Air Quality is ${airQualityStatus.text}! (${airQuality} AQI)`);
  }

  // Water Flow
  const flow = data.flow || 0;
  const flowStatus = getStatusInfo(flow, [1, 3, 5], ["Low", "Average", "Good", "High"]);
  document.getElementById("flowRate").textContent = `${flow} L/min`;
  document.getElementById("flow-status").textContent = flowStatus.text;
  document.getElementById("flow-status").className = `sensor-status ${flowStatus.class}`;

  // Battery Percentage
  const battery = data.battery || 0;
  document.getElementById("batteryPercent").textContent = `${battery}%`;
  document.getElementById("battery-text").textContent = `${battery}%`;
  updateBatteryLevel(battery);
}

// Helper function to get status info with CSS classes
function getStatusInfo(value, thresholds, labels) {
  const classes = ["danger", "good", "warning", "danger"];
  for (let i = 0; i < thresholds.length; i++) {
    if (value < thresholds[i]) {
      return { text: labels[i], class: classes[i] };
    }
  }
  return { text: labels[labels.length - 1], class: classes[classes.length - 1] };
}

// Update progress ring
function updateProgressRing(elementId, value, max) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const circumference = 157; // 2 * π * 25
  const offset = circumference - (percentage / 100) * circumference;
  
  element.style.strokeDashoffset = offset;
}

// Update battery level visual
function updateBatteryLevel(percentage) {
  const batteryLevel = document.getElementById("battery-level");
  const batteryIndicator = document.querySelector(".battery-status .status-indicator");
  
  if (batteryLevel) {
    batteryLevel.style.width = `${Math.max(5, percentage)}%`;
    
    // Change color based on battery level
    if (percentage > 50) {
      batteryLevel.style.background = "var(--success-color)";
      if (batteryIndicator) {
        batteryIndicator.className = "status-indicator active";
      }
    } else if (percentage > 20) {
      batteryLevel.style.background = "var(--warning-color)";
      if (batteryIndicator) {
        batteryIndicator.className = "status-indicator warning";
      }
    } else {
      batteryLevel.style.background = "var(--danger-color)";
      if (batteryIndicator) {
        batteryIndicator.className = "status-indicator danger";
      }
    }
  }
}

// Fetch sensor data from Firebase
async function fetchSensorData() {
  try {
    const res = await fetch(`${FIREBASE_URL}.json`);
    const data = await res.json();
    if (data) {
      updateUI(data);
    }
  } catch (error) {
    console.error("Failed to fetch sensor data:", error);
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
    document.getElementById("aiRecommendation").textContent = data || "No recommendations available";
  } catch (error) {
    console.error("Failed to fetch AI recommendation:", error);
    document.getElementById("aiRecommendation").textContent = "Unable to load recommendations";
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
    showPumpNotification(state);
    updatePumpStatus(state);
  } catch (error) {
    console.error("Failed to update pump state:", error);
  }
}

// Return to Auto Mode
async function resetAutoMode() {
  try {
    await fetch(`${FIREBASE_URL}/controls.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manual_override: false })
    });
    showPumpNotification("auto");
  } catch (error) {
    console.error("Failed to reset to auto mode:", error);
  }
}

// Show pump notification
function showPumpNotification(state) {
  const notification = document.getElementById('pump-popup');
  const sound = document.getElementById('pump-sound');
  
  if (notification) {
    const messageElement = notification.querySelector('.notification-message');
    const iconElement = notification.querySelector('.notification-icon');
    
    if (state === "auto") {
      messageElement.textContent = "System returned to automatic mode";
      iconElement.textContent = "🤖";
    } else {
      messageElement.textContent = state ? "Pump has been started manually" : "Pump has been stopped manually";
      iconElement.textContent = state ? "💧" : "⏹️";
    }
    
    notification.style.display = 'flex';
    
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Ignore audio errors
    }
    
    setTimeout(() => {
      notification.style.display = 'none';
    }, 4000);
  }
}

// Update pump status display
function updatePumpStatus(isOn) {
  const statusText = document.getElementById('pump-status-text');
  const indicator = document.getElementById('pump-indicator');
  
  if (statusText && indicator) {
    statusText.textContent = isOn ? "Running" : "Stopped";
    indicator.className = isOn ? "status-indicator active" : "status-indicator";
  }
}

// Fetch pump status from Firebase
async function fetchPumpStatus() {
  try {
    const res = await fetch(`${FIREBASE_URL}/controls.json`);
    const data = await res.json();
    if (data) {
      updatePumpStatus(data.pump);
    }
  } catch (error) {
    console.error("Failed to fetch pump status:", error);
  }
}

// Track last alerted AQI status
let lastAlertStatus = null;

// Show air quality alert
function showAirQualityAlert(message) {
  const notification = document.getElementById('air-quality-popup');
  const sound = document.getElementById('aqi-alert-sound');
  
  if (notification) {
    notification.querySelector('.notification-message').textContent = message;
    notification.style.display = 'flex';
    
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Ignore audio errors
    }
  }
}

// Close air quality alert
document.getElementById('aqi-confirm-btn').addEventListener('click', function() {
  const notification = document.getElementById('air-quality-popup');
  notification.style.display = 'none';
});

// Weather functions
function getWeatherDescription(code) {
  const weatherMap = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 80: "Rain showers",
    81: "Moderate rain showers", 82: "Violent rain showers", 95: "Thunderstorm"
  };
  return weatherMap[code] || "Unknown conditions";
}

// Fetch weather data
function fetchWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        updateWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        updateWeather(40.7128, -74.0060); // Default to New York
      }
    );
  } else {
    updateWeather(40.7128, -74.0060);
  }
}

function updateWeather(lat, lon) {
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
    .then(response => response.json())
    .then(data => {
      const weather = data.current_weather;
      const temp = Math.round(weather.temperature);
      const description = getWeatherDescription(weather.weathercode);
      
      document.getElementById('weather-summary').textContent = `${temp}°C, ${description}`;
      document.getElementById('weather-details').textContent = `Wind: ${weather.windspeed} km/h`;
    })
    .catch(error => {
      console.error("Failed to fetch weather:", error);
      document.getElementById('weather-summary').textContent = "Weather data unavailable";
      document.getElementById('weather-details').textContent = "";
    });
}

// Refresh all data
function refreshAllData() {
  fetchSensorData();
  fetchAIRecommendation();
  fetchWeather();
  fetchPumpStatus();
}

// Refresh button functionality
document.getElementById('refresh-btn').addEventListener('click', function() {
  refreshAllData();
  
  // Add visual feedback
  const icon = this.querySelector('.btn-icon');
  icon.style.transform = 'rotate(360deg)';
  icon.style.transition = 'transform 0.5s ease';
  
  setTimeout(() => {
    icon.style.transform = '';
  }, 500);
});

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Initial data fetch
  refreshAllData();
  
  // Set up periodic updates every 5 seconds
  setInterval(refreshAllData, 5000);
  
  // Add smooth animations to cards
  const cards = document.querySelectorAll('.sensor-card, .status-card, .info-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });
});
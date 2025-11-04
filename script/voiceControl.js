// ===================================================
//   Clima Voice Control (Auto Listening + Glow Mic)
// ===================================================

console.log("🌿 Clima Voice Control initialized.");

let recognition;
let listening = false;
let glowInterval;

// ---------- Create Mic Button ----------
window.addEventListener("DOMContentLoaded", () => {
  const micButton = document.createElement("button");
  micButton.id = "clima-mic";
  micButton.textContent = "🎙️";
  Object.assign(micButton.style, {
    position: "fixed",
    left: "20px",
    bottom: "20px",
    background: "linear-gradient(135deg, #059669, #06b6d4)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    fontSize: "1.8rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
    cursor: "pointer",
    zIndex: "99999",
    transition: "all 0.3s ease",
  });
  document.body.appendChild(micButton);

  micButton.onclick = () => {
    if (!listening) startRecognition();
    else stopRecognition();
  };

  // Initialize recognition after user grants mic access
  initRecognition(micButton);
});

// ---------- Setup SpeechRecognition ----------
function initRecognition(micButton) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("Speech Recognition not supported in this browser.");
    return;
  }

  recognition = new SR();
  recognition.lang = "en-IN";
  recognition.continuous = false; // Chrome ignores continuous
  recognition.interimResults = false;

  recognition.onstart = () => {
    listening = true;
    console.log("🎙️ Clima is listening...");
    micButton.style.background = "linear-gradient(135deg, #0ea5e9, #14b8a6)";
    startGlow(micButton);
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    const conf = event.results[0][0].confidence.toFixed(2);
    console.log(`🗣️ Heard: "${transcript}" | Confidence: ${conf}`);
    handleVoiceCommand(transcript);
  };

  recognition.onerror = (e) => {
    console.warn("Speech error:", e.error);
  };

  recognition.onend = () => {
    listening = false;
    stopGlow(micButton);
    micButton.style.background = "linear-gradient(135deg, #059669, #06b6d4)";
    console.log("🛑 Recognition ended. Restarting...");
    setTimeout(startRecognition, 1200);
  };

  // Start automatically once clicked once
  window.addEventListener("click", () => {
    if (!listening) startRecognition();
  });
}

// ---------- Start / Stop Recognition ----------
function startRecognition() {
  try {
    recognition?.start();
  } catch (err) {
    console.warn("Recognition start failed:", err.message);
  }
}
function stopRecognition() {
  recognition?.stop();
}

// ---------- Glow Effect ----------
function startGlow(btn) {
  let grow = true;
  clearInterval(glowInterval);
  glowInterval = setInterval(() => {
    const shadow = grow
      ? "0 0 25px #00f2ff, 0 0 50px #00f2ff"
      : "0 0 10px rgba(0,0,0,0.3)";
    btn.style.boxShadow = shadow;
    grow = !grow;
  }, 500);
}
function stopGlow(btn) {
  clearInterval(glowInterval);
  btn.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
}

// ---------- Voice Command Handler ----------
function handleVoiceCommand(text) {
  const normalized = text.toLowerCase();

  // Wake word: any word starting with "cli"
  if (/^cli[a-z]*/.test(normalized)) {
    console.log("✅ Wake word detected:", normalized);
    speak("Yes, I'm here. What should I do?");
    return;
  }

  // Commands
  if (normalized.includes("turn on") || normalized.includes("pump on") || normalized.includes("start pump")) {
    console.log("➡️ Command: Pump ON");
    speak("Turning pump on.");
    togglePumpWithManualOverride?.(true);
  } else if (normalized.includes("turn off") || normalized.includes("pump off") || normalized.includes("stop pump")) {
    console.log("➡️ Command: Pump OFF");
    speak("Turning pump off.");
    togglePumpWithManualOverride?.(false);
  } else if (normalized.includes("auto mode") || normalized.includes("automatic")) {
    console.log("➡️ Command: Auto Mode");
    speak("Switching to automatic mode.");
    resetAutoMode?.();
  } else if (normalized.includes("status")) {
    console.log("➡️ Command: Status");
    speak("Checking system status.");
    fetchPumpStatus?.();
  } else {
    console.log("🤔 Unknown command:", text);
  }
}

// ---------- Speech Output ----------
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-US";
  msg.rate = 0.95;
  msg.pitch = 1;
  speechSynthesis.speak(msg);
}

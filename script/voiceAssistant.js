// === Clima Voice Assistant ===
console.log("🌿 Clima Voice Control (spacebar push-to-talk) loaded.");

let listening = false;
let recognition;

/* ----------  UI  ---------- */
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
  width: "55px",
  height: "55px",
  fontSize: "1.5rem",
  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  cursor: "pointer",
  zIndex: "2000",
  transition: "all 0.3s ease",
});
document.body.appendChild(micButton);

/* ----------  Speech Recognition  ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) {
  alert("Voice recognition only works in Chrome or Edge.");
} else {
  recognition = new SR();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 5;

  recognition.onstart = () => {
    listening = true;
    micButton.style.background = "red";
    console.log("🎙️  Clima is listening...");
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
    micButton.style.background = "linear-gradient(135deg, #059669, #06b6d4)";
    console.log("🛑 Recognition ended.");
  };
}

/* ----------  Mic Button Click ---------- */
micButton.onclick = () => {
  if (!recognition) return;
  if (!listening) recognition.start();
  else recognition.stop();
};

/* ----------  SPACEBAR Push-to-Talk ---------- */
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.repeat) {
    e.preventDefault();
    if (!listening && recognition) {
      console.log("⏺️ Spacebar pressed – start listening");
      recognition.start();
    }
  }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (listening && recognition) {
      console.log("⏹ Spacebar released – stop listening");
      recognition.stop();
    }
  }
});

/* ----------  Command Handler  ---------- */
function handleVoiceCommand(text) {
  const normalized = text.toLowerCase();

  // Wake-word tolerance
  const wake =
    normalized.includes("clima") ||
    normalized.includes("cleema") ||
    normalized.includes("klima") ||
    normalized.includes("climah");
  if (wake) {
    console.log("✅ Wake word detected: Clima");
    speak("Yes, I'm here. What should I do?");
    return;
  }

  // Actions
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
    speak("Sorry, I didn't catch that. Please repeat.");
  }
}

/* ----------  Speech Output  ---------- */
function speak(msgText) {
  const msg = new SpeechSynthesisUtterance(msgText);
  msg.lang = "en-US";
  msg.rate = 0.95;
  msg.pitch = 1;
  speechSynthesis.speak(msg);
}

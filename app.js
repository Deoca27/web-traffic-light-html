let lampStatus = "Mati";
let espStatus = "OFFLINE";
let connectionStatus = "Disconnected";

const brokerStatusEl = document.getElementById("brokerStatus");
const espStatusEl = document.getElementById("espStatus");
const lampTextEl = document.getElementById("lampText");
const lampMerah = document.getElementById("lampMerah");
const lampKuning = document.getElementById("lampKuning");
const lampHijau = document.getElementById("lampHijau");
const btnOn = document.getElementById("btnOn");
const btnOff = document.getElementById("btnOff");

// Heartbeat timestamp
let lastPing = Date.now();

function updateLamps() {
  lampMerah.style.background = lampStatus.includes("Merah") ? "#ef4444" : "#d1d5db";
  lampKuning.style.background = lampStatus.includes("Kuning") ? "#facc15" : "#d1d5db";
  lampHijau.style.background = lampStatus.includes("Hijau") ? "#22c55e" : "#d1d5db";
  lampTextEl.textContent = lampStatus;
}

function updateStatus() {
  brokerStatusEl.textContent = "Broker: " + connectionStatus;
  brokerStatusEl.style.background = connectionStatus === "Connected" ? "#22c55e" :
                                   connectionStatus === "Error" ? "#ef4444" : "#6b7280";

  espStatusEl.textContent = "ESP32: " + espStatus;
  espStatusEl.style.background = espStatus === "ONLINE" ? "#16a34a" :
                                 espStatus === "OFFLINE" ? "#dc2626" : "#6b7280";

  const allow = connectionStatus === "Connected" && espStatus === "ONLINE";
  btnOn.disabled = !allow;
  btnOff.disabled = !allow;
}

// MQTT
const client = mqtt.connect("wss://test.mosquitto.org:8081");

client.on("connect", () => {
  connectionStatus = "Connected";
  updateStatus();
  client.subscribe("trafficlight/status");
  client.subscribe("trafficlight/heartbeat"); // subscribe heartbeat
});

client.on("reconnect", () => { connectionStatus = "Reconnecting"; updateStatus(); });
client.on("offline", () => { connectionStatus = "Disconnected"; updateStatus(); });
client.on("close", () => { connectionStatus = "...."; updateStatus(); });
client.on("error", (err) => { console.error(err); connectionStatus = "Error"; updateStatus(); });

// Message handler
client.on("message", (topic, message) => {
  const msg = message.toString();

  if(topic === "trafficlight/status"){
    if(msg === "Mati") lampStatus = "Mati";
    else lampStatus = msg;
    updateLamps();
  }

  if(topic === "trafficlight/heartbeat"){
    lastPing = Date.now();
    if(espStatus !== "ONLINE") espStatus = "ONLINE";
    updateStatus();
  }
});

// cek heartbeat tiap detik
setInterval(() => {
  if(Date.now() - lastPing > 5000){ // timeout 5 detik
    espStatus = "OFFLINE";
    lampStatus = "Mati";
    updateLamps();
    updateStatus();
  }
}, 1000);

// tombol kontrol + animasi klik (desktop + mobile)
function addClickAnimation(button, action){
  const trigger = (event) => {
    event.preventDefault();
    if(button.disabled) return;
    button.classList.add("animate-click");
    setTimeout(() => button.classList.remove("animate-click"), 300);
    action();
  }

  button.addEventListener("click", trigger);
  button.addEventListener("touchstart", trigger);
}

addClickAnimation(btnOn, () => client.publish("trafficlight/control", "ON"));
addClickAnimation(btnOff, () => client.publish("trafficlight/control", "OFF"));

updateLamps();
updateStatus();

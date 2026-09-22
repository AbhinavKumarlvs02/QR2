const video = document.getElementById("video");
const status = document.getElementById("status");

const ws = new WebSocket(
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
);

ws.onopen = () => status.textContent = "Connected";

ws.onclose = () => status.textContent = "Disconnected";

navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  audio: false
}).then(stream => {
  video.srcObject = stream;
  status.textContent = "Camera active";
}).catch(err => {
  status.textContent = "Camera error: " + err.message;
});

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let sending = false;

async function sendFrame() {
  if (sending || ws.readyState !== WebSocket.OPEN ||
      video.readyState < 2 || !video.videoWidth) return;

  sending = true;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(async blob => {
    if (blob) ws.send(await blob.arrayBuffer());
    sending = false;
  }, "image/jpeg", 0.72);
}

setInterval(sendFrame, 100); // ~10 FPS
const screen = document.getElementById("screen");
const status = document.getElementById("status");

const ws = new WebSocket(
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
);

ws.binaryType = "blob";

let oldUrl = null;

ws.onopen = () => status.textContent = "Connected — waiting for camera";

ws.onmessage = e => {
  const url = URL.createObjectURL(e.data);
  screen.onload = () => {
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    oldUrl = url;
  };
  screen.src = url;
  status.textContent = "Live";
};

ws.onclose = () => status.textContent = "Disconnected";
const qr=document.getElementById("qr"),status=document.getElementById("status");
const ws=new WebSocket(`${location.protocol==="https:"?"wss":"ws"}://${location.host}`);ws.binaryType="arraybuffer";let old=null;
ws.onopen=()=>status.textContent="Connected - waiting for QR";
ws.onmessage=e=>{const u=URL.createObjectURL(new Blob([e.data],{type:"image/png"}));qr.onload=()=>{if(old)URL.revokeObjectURL(old);old=u};qr.src=u;status.textContent="Live"};
ws.onclose=()=>status.textContent="Disconnected";
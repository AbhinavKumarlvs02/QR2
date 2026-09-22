const video=document.getElementById("video"),status=document.getElementById("status");
const ws=new WebSocket(`${location.protocol==="https:"?"wss":"ws"}://${location.host}`);
ws.binaryType="arraybuffer"; let cvReady=false;
function ready(){cvReady=true;status.textContent="OpenCV ready";startCamera()}
if(typeof cv!=="undefined") cv.onRuntimeInitialized=ready;
else {const t=setInterval(()=>{if(typeof cv!=="undefined"){clearInterval(t);cv.onRuntimeInitialized=ready}},100)}
ws.onopen=()=>status.textContent="Connected"; ws.onclose=()=>status.textContent="Disconnected";
async function startCamera(){try{video.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});status.textContent="Camera active"}catch(e){status.textContent="Camera error: "+e.message}}
const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
function order(p){p=p.map(x=>({x:x.x,y:x.y})).sort((a,b)=>a.x+a.y-b.x-b.y);const tl=p[0],br=p[3],r=[p[1],p[2]].sort((a,b)=>a.x-a.y-b.x+b.y);return[tl,r[0],br,r[1]]}
function send(){if(!cvReady||ws.readyState!==1||video.readyState<2||!video.videoWidth)return;
canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0);
const src=cv.imread(canvas),det=new cv.QRCodeDetector(),pts=new cv.Mat(),found=det.detect(src,pts);
if(!found||pts.empty()){src.delete();pts.delete();det.delete();return}
const d=pts.data32F,p=order([...Array(4)].map((_,i)=>({x:d[i*2],y:d[i*2+1]})));
const size=Math.max(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y),Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y),Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y));
const n=Math.max(300,Math.min(1200,Math.round(size)));
const sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(x=>[x.x,x.y]));
const dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,n-1,0,n-1,n-1,0,n-1]);
const M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();
cv.warpPerspective(src,dst,M,new cv.Size(n,n),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
const out=document.createElement("canvas");out.width=n;out.height=n;cv.imshow(out,dst);
out.toBlob(async b=>{if(b&&ws.readyState===1)ws.send(await b.arrayBuffer())},"image/png");
[src,pts,det,sp,dp,M,dst].forEach(x=>x.delete())}
setInterval(send,200);
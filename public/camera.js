// const video=document.getElementById("video"),status=document.getElementById("status");
// const ws=new WebSocket(`${location.protocol==="https:"?"wss":"ws"}://${location.host}`);
// ws.binaryType="arraybuffer"; let cvReady=false;
// function ready(){cvReady=true;status.textContent="OpenCV ready";startCamera()}
// if(typeof cv!=="undefined") cv.onRuntimeInitialized=ready;
// else {const t=setInterval(()=>{if(typeof cv!=="undefined"){clearInterval(t);cv.onRuntimeInitialized=ready}},100)}
// ws.onopen=()=>status.textContent="Connected"; ws.onclose=()=>status.textContent="Disconnected";
// async function startCamera(){try{video.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});status.textContent="Camera active"}catch(e){status.textContent="Camera error: "+e.message}}
// const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
// function order(p){p=p.map(x=>({x:x.x,y:x.y})).sort((a,b)=>a.x+a.y-b.x-b.y);const tl=p[0],br=p[3],r=[p[1],p[2]].sort((a,b)=>a.x-a.y-b.x+b.y);return[tl,r[0],br,r[1]]}
// function send(){if(!cvReady||ws.readyState!==1||video.readyState<2||!video.videoWidth)return;
// canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0);
// const src=cv.imread(canvas),det=new cv.QRCodeDetector(),pts=new cv.Mat(),found=det.detect(src,pts);
// if(!found||pts.empty()){src.delete();pts.delete();det.delete();return}
// const d=pts.data32F,p=order([...Array(4)].map((_,i)=>({x:d[i*2],y:d[i*2+1]})));
// const size=Math.max(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y),Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y),Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y));
// const n=Math.max(300,Math.min(1200,Math.round(size)));
// const sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(x=>[x.x,x.y]));
// const dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,n-1,0,n-1,n-1,0,n-1]);
// const M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();
// cv.warpPerspective(src,dst,M,new cv.Size(n,n),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
// const out=document.createElement("canvas");out.width=n;out.height=n;cv.imshow(out,dst);
// out.toBlob(async b=>{if(b&&ws.readyState===1)ws.send(await b.arrayBuffer())},"image/png");
// [src,pts,det,sp,dp,M,dst].forEach(x=>x.delete())}
// setInterval(send,200);







// const video = document.getElementById("video");
// const status = document.getElementById("status");

// const ws = new WebSocket(
//     `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
// );

// ws.binaryType = "arraybuffer";

// let cvReady = false;
// let detector = null;
// let lastPoints = null;
// let lastSent = 0;

// function ready() {
//     cvReady = true;
//     detector = new cv.QRCodeDetector();
//     status.textContent = "OpenCV ready";
//     startCamera();
// }

// if (typeof cv !== "undefined") {
//     cv.onRuntimeInitialized = ready;
// } else {
//     const timer = setInterval(() => {
//         if (typeof cv !== "undefined") {
//             clearInterval(timer);
//             cv.onRuntimeInitialized = ready;
//         }
//     }, 100);
// }

// ws.onopen = () => {
//     status.textContent = "Connected";
// };

// ws.onclose = () => {
//     status.textContent = "Disconnected";
// };

// async function startCamera() {
//     try {
//         video.srcObject = await navigator.mediaDevices.getUserMedia({
//             video: {
//                 facingMode: { ideal: "environment" },
//                 width: { ideal: 1920 },
//                 height: { ideal: 1080 }
//             },
//             audio: false
//         });

//         status.textContent = "Camera active";
//     } catch (e) {
//         status.textContent = "Camera error: " + e.message;
//     }
// }

// const canvas = document.createElement("canvas");
// const ctx = canvas.getContext("2d");

// function orderPoints(points) {
//     const sorted = points.slice().sort(
//         (a, b) => (a.x + a.y) - (b.x + b.y)
//     );

//     const tl = sorted[0];
//     const br = sorted[3];

//     const other = [sorted[1], sorted[2]].sort(
//         (a, b) => (a.x - a.y) - (b.x - b.y)
//     );

//     return [tl, other[0], br, other[1]];
// }

// function distance(a, b) {
//     return Math.hypot(a.x - b.x, a.y - b.y);
// }

// function sendQR() {

//     if (
//         !cvReady ||
//         !detector ||
//         ws.readyState !== WebSocket.OPEN ||
//         video.readyState < 2 ||
//         !video.videoWidth
//     ) {
//         return;
//     }

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     ctx.drawImage(
//         video,
//         0,
//         0,
//         canvas.width,
//         canvas.height
//     );

//     const src = cv.imread(canvas);

//     const points = new cv.Mat();

//     let found = false;

//     try {
//         found = detector.detect(src, points);
//     } catch (e) {
//         found = false;
//     }

//     if (found && !points.empty() && points.data32F.length >= 8) {

//         const data = points.data32F;

//         const detected = [];

//         for (let i = 0; i < 4; i++) {
//             detected.push({
//                 x: data[i * 2],
//                 y: data[i * 2 + 1]
//             });
//         }

//         lastPoints = orderPoints(detected);

//         status.textContent = "QR detected";
//     }

//     /*
//        If detection fails for one or two frames,
//        use the previous QR position.
//     */

//     if (!lastPoints) {
//         src.delete();
//         points.delete();
//         return;
//     }

//     const p = lastPoints;

//     const top = distance(p[0], p[1]);
//     const bottom = distance(p[3], p[2]);
//     const left = distance(p[0], p[3]);
//     const right = distance(p[1], p[2]);

//     const size = Math.max(
//         top,
//         bottom,
//         left,
//         right
//     );

//     const n = Math.max(
//         400,
//         Math.min(1400, Math.round(size))
//     );

//     const srcPts = cv.matFromArray(
//         4,
//         1,
//         cv.CV_32FC2,
//         [
//             p[0].x, p[0].y,
//             p[1].x, p[1].y,
//             p[2].x, p[2].y,
//             p[3].x, p[3].y
//         ]
//     );

//     const dstPts = cv.matFromArray(
//         4,
//         1,
//         cv.CV_32FC2,
//         [
//             0, 0,
//             n - 1, 0,
//             n - 1, n - 1,
//             0, n - 1
//         ]
//     );

//     const matrix = cv.getPerspectiveTransform(
//         srcPts,
//         dstPts
//     );

//     const dst = new cv.Mat();

//     cv.warpPerspective(
//         src,
//         dst,
//         matrix,
//         new cv.Size(n, n),
//         cv.INTER_LINEAR,
//         cv.BORDER_CONSTANT,
//         new cv.Scalar(255, 255, 255, 255)
//     );

//     const output = document.createElement("canvas");

//     output.width = n;
//     output.height = n;

//     cv.imshow(output, dst);

//     output.toBlob(
//         async blob => {

//             if (
//                 blob &&
//                 ws.readyState === WebSocket.OPEN
//             ) {
//                 ws.send(await blob.arrayBuffer());
//             }

//         },
//         "image/png"
//     );

//     src.delete();
//     points.delete();
//     srcPts.delete();
//     dstPts.delete();
//     matrix.delete();
//     dst.delete();
// }

// setInterval(sendQR, 100);














// const video = document.getElementById("video");
// const status = document.getElementById("status");
// const counter = document.getElementById("counter");

// const ws = new WebSocket(
//     `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
// );

// ws.binaryType = "arraybuffer";

// let framesSent = 0;

// ws.onopen = () => {
//     status.textContent = "Connected";
//     startCamera();
// };

// ws.onclose = () => {
//     status.textContent = "Disconnected";
// };

// ws.onerror = () => {
//     status.textContent = "Connection error";
// };

// async function startCamera() {

//     try {

//         const stream =
//             await navigator.mediaDevices.getUserMedia({

//                 video: {
//                     facingMode: {
//                         ideal: "environment"
//                     },

//                     width: {
//                         ideal: 1280
//                     },

//                     height: {
//                         ideal: 1280
//                     }
//                 },

//                 audio: false
//             });

//         video.srcObject = stream;

//         await video.play();

//         status.textContent = "Camera active - place QR inside the box";

//         startStreaming();

//     } catch (error) {

//         status.textContent =
//             "Camera error: " + error.message;

//     }
// }


// /*
//     Canvas used to extract only the box.
// */

// const canvas = document.createElement("canvas");

// const ctx = canvas.getContext("2d", {
//     alpha: false
// });


// function startStreaming() {

//     setInterval(() => {

//         if (
//             ws.readyState !== WebSocket.OPEN ||
//             video.readyState < 2 ||
//             !video.videoWidth
//         ) {
//             return;
//         }

//         const videoWidth = video.videoWidth;
//         const videoHeight = video.videoHeight;

//         /*
//             The visible box is:

//             width  = 70%
//             left   = 15%
//             top    = centered
//         */

//         const boxWidth = videoWidth * 0.70;

//         const boxHeight = boxWidth;

//         const boxX =
//             (videoWidth - boxWidth) / 2;

//         const boxY =
//             (videoHeight - boxHeight) / 2;

//         /*
//             Output resolution.
//             Keep it square because QR is square.
//         */

//         const outputSize = 600;

//         canvas.width = outputSize;
//         canvas.height = outputSize;

//         /*
//             Crop only the QR box.
//         */

//         ctx.drawImage(
//             video,

//             boxX,
//             boxY,
//             boxWidth,
//             boxHeight,

//             0,
//             0,
//             outputSize,
//             outputSize
//         );

//         /*
//             PNG keeps QR pixels lossless.
//         */

//         canvas.toBlob(
//             async (blob) => {

//                 if (
//                     blob &&
//                     ws.readyState === WebSocket.OPEN
//                 ) {

//                     const buffer =
//                         await blob.arrayBuffer();

//                     ws.send(buffer);

//                     framesSent++;

//                     counter.textContent =
//                         "Frames sent: " + framesSent;
//                 }

//             },
//             "image/png"
//         );






const video = document.getElementById("video");
const status = document.getElementById("status");
const counter = document.getElementById("counter");

const zoomSlider = document.getElementById("zoom");
const zoomValue = document.getElementById("zoomValue");

const ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
);

ws.binaryType = "arraybuffer";

let framesSent = 0;
let videoTrack = null;

zoomSlider.addEventListener("input", async () => {

    const zoom = Number(zoomSlider.value);

    zoomValue.textContent =
        zoom.toFixed(1) + "x";

    /*
        Try to use the phone's native
        camera zoom if supported.
    */

    if (videoTrack) {

        const capabilities =
            videoTrack.getCapabilities();

        if (
            capabilities.zoom &&
            capabilities.zoom.min !== undefined
        ) {

            const nativeZoom =
                Math.min(
                    Math.max(
                        zoom,
                        capabilities.zoom.min
                    ),
                    capabilities.zoom.max
                );

            try {

                await videoTrack.applyConstraints({
                    advanced: [
                        {
                            zoom: nativeZoom
                        }
                    ]
                });

                return;

            } catch (e) {
                console.log(
                    "Native zoom unavailable"
                );
            }
        }
    }

    /*
        Fallback:
        digitally zoom the displayed video.
    */

    video.style.transform =
        `scale(${zoom})`;
});


ws.onopen = () => {

    status.textContent =
        "Connected";

    startCamera();

};


ws.onclose = () => {

    status.textContent =
        "Disconnected";

};


ws.onerror = () => {

    status.textContent =
        "Connection error";

};


async function startCamera() {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: "environment"
                    },

                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    }
                },

                audio: false

            });


        video.srcObject = stream;

        videoTrack =
            stream.getVideoTracks()[0];

        await video.play();

        status.textContent =
            "Camera active - place QR inside the box";

        startStreaming();

    } catch (error) {

        status.textContent =
            "Camera error: " + error.message;

    }

}


/*
    Canvas used to extract only
    the QR box.
*/

const canvas =
    document.createElement("canvas");

const ctx =
    canvas.getContext("2d", {
        alpha: false
    });


function startStreaming() {

    setInterval(() => {

        if (
            ws.readyState !== WebSocket.OPEN ||
            video.readyState < 2 ||
            !video.videoWidth
        ) {
            return;
        }


        const videoWidth =
            video.videoWidth;

        const videoHeight =
            video.videoHeight;


        /*
            Visible QR box.
        */

        const boxWidth =
            videoWidth * 0.70;

        const boxHeight =
            boxWidth;


        const boxX =
            (videoWidth - boxWidth) / 2;

        const boxY =
            (videoHeight - boxHeight) / 2;


        /*
            Output resolution.
        */

        const outputSize = 600;

        canvas.width =
            outputSize;

        canvas.height =
            outputSize;


        /*
            Capture only the box.
        */

        ctx.drawImage(

            video,

            boxX,
            boxY,
            boxWidth,
            boxHeight,

            0,
            0,
            outputSize,
            outputSize

        );


        /*
            Lossless PNG.
        */

        canvas.toBlob(

            async (blob) => {

                if (
                    blob &&
                    ws.readyState ===
                    WebSocket.OPEN
                ) {

                    const buffer =
                        await blob.arrayBuffer();

                    ws.send(buffer);

                    framesSent++;

                    counter.textContent =
                        "Frames sent: " +
                        framesSent;
                }

            },

            "image/png"

        );

    }, 100);

}
//     }, 100);

}

import { Controller } from "./Controller";
import GIF from "gif.js";

const controller = new Controller();

const gif = new GIF({
    workerScript: "gif.worker.min.js",
    width: controller.renderer.canvas.width,
    height: controller.renderer.canvas.height,
    workers: 4,
    quality: 10,
});
gif.on("finished", (blob: any) => {
    window.open(URL.createObjectURL(blob));
});

const gifCreate = true;
const gifStart = 0;
const gifEnd = 300;
const gifTakeEvery = 2;
const stopRenderAfterGifEnd = true;

let gifI = 0;
setInterval(() => {
    if (!gifCreate || !stopRenderAfterGifEnd || gifI < gifEnd) {
        controller.iteration();
    }

    if (gifCreate) {
        if (gifI === gifStart) {
            console.log("gif started");
        }
        if (gifI >= gifStart && gifI < gifEnd) {
            if ((gifI - gifStart) % gifTakeEvery === 0) {
                gif.addFrame(controller.renderer.ctx, {
                    copy: true,
                    delay: 40,
                });
            }
        }
        if (gifI === gifEnd) {
            console.log("gif ended");
            gif.render();
        }
        gifI++;
    }
}, 20);

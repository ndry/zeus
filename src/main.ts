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

const gifStart = 500;
const gifEnd = -1;

let gifI = 0;
setInterval(() => {
    controller.iteration();

    if (gifI >= gifStart && gifI < gifEnd) {
        gif.addFrame(controller.renderer.ctx, {
            copy: true,
            delay: 20,
        });
    } else if (gifI === gifEnd) {
        gif.render();
    }
    gifI++;
}, 20);

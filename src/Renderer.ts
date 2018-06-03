import { World } from "./World";
import { setPixelXY, setPixelNormI } from "./utils/imageData";

export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    imageData: ImageData;

    fpsLabel: HTMLElement;

    frameList: HTMLElement;

    constructor (
        public world: World,
    ) {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.ctx = this.canvas.getContext("2d")!;
        this.ctx.imageSmoothingEnabled = false;
        this.imageData = this.ctx.createImageData(this.world.width, this.world.height);

        this.fpsLabel = document.getElementById("fps-label")!;
        this.frameList = document.getElementById("frame-list")!;
    }

    lastIteration = Date.now();
    render() {
        const now = Date.now();
        const fps = 1000 / (now - this.lastIteration);
        this.lastIteration = now;
        this.fpsLabel.innerText = `fps: ${fps.toFixed(2)}`;

        for (let i = 0; i < this.world.area; i++) {
            const tpi = this.world.travelPaths[i];
            const rtpi = 1 - tpi;
            const drawTpi = 1 - rtpi * rtpi * rtpi * rtpi;

            const fpsi = this.world.floodPaths.sumMap[i];
            const stop = fpsi > this.world.resistanceResource && fpsi < Infinity;
            const drawStop = stop ? 1 : 0;

            // const res = fpsi < Infinity ? 1 : 0;
            const res = Math.min(fpsi < Infinity ? fpsi / this.world.resistanceResource : 0, 1);

            const r = Math.max(drawStop, drawTpi);
            const g = res;
            const b = this.world.backgroundResistanceMap.normMap[i]; // this.world.voltageMap[x][y];

            setPixelNormI(this.imageData, i, r, g, b);
        }

        // setPixelXY(this.imageData, 150, 150, 255, 255, 255);

        this.ctx.putImageData(this.imageData, 0, 0);

        // const aLink = document.createElement("a");
        // aLink.download = `${this.world.t.toFixed(0)}.png`;
        // aLink.href = this.canvas.toDataURL();
        // aLink.innerText = `${this.world.t.toFixed(0)}.png`;
        // this.frameList.appendChild(aLink);
    }
}

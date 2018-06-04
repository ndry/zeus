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
        const startV = this.world.voltageMap[this.world.start.y][this.world.start.x];

        for (let y = 0; y < this.world.height; y++) {
            const oy = y * this.world.width;
            const vz = this.world.voltageMap[y];
            const fz = this.world.floodMap[y];
            const rz = this.world.backgroundResistanceMap.normMap[y];
            for (let x = 0; x < this.world.width; x++) {
                const vzz = vz[x];
                const dv = vzz - startV;

                const tpi = 0; // this.world.travelPaths[i];
                const rtpi = 1 - tpi;
                const drawTpi = 1 - rtpi * rtpi * rtpi * rtpi;

                const fzz = fz[x];
                const stop = false;
                const drawStop = stop ? 1 : 0;

                // const res = fpsi < Infinity ? 1 : 0;
                const res = Math.min(fzz < Infinity
                    ? (dv * dv / (fzz) * 20)
                    : 0,
                1);
                const r = Math.max(drawStop, drawTpi);
                const g = res;
                const b = 0; // rz[x]; // this.world.voltageMap[x][y];

                setPixelNormI(this.imageData, oy + x, r, g, b);
            }
        }

        // setPixelXY(this.imageData, 150, 150, 255, 255, 255);

        this.ctx.putImageData(this.imageData, 0, 0);
    }
}

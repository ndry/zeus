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
        this.canvas.style.width = `${this.world.width}px`;
        this.canvas.style.height = `${this.world.height}px`;
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
        const startV = this.world.voltageMap.map[this.world.start.y][this.world.start.x];

        for (let y = 0; y < this.world.height; y++) {
            const oy = y * this.world.width;
            const vz = this.world.voltageMap.map[y];
            const nvz = this.world.voltageMap.normMap[y];
            const fz = this.world.stateMap.current.floodMap[y];
            const rz = this.world.backgroundResistanceMap.normMap[y];
            const sz = this.world.stateMap.current.stopMap[y];
            const fbz = this.world.stateMap.current.floodBackMap[y];
            const fbdz = this.world.stateMap.current.floodBackDecayMap[y];
            const wave$z = this.world.stateMap.current.waveMap[y];
            for (let x = 0; x < this.world.width; x++) {
                const vzz = vz[x];
                const nvzz = nvz[x];
                const szz = sz[x];
                const fbzz = fbz[x];
                const fbdzz = fbdz[x];
                const wave$zz = wave$z[x];
                const dv = vzz - startV;

                const rtpi = 1 - Math.min(fbzz / 100, 1);
                const drawTpi = 1 - rtpi * rtpi * rtpi;

                const rwave = Math.min(wave$zz, 1);
                const drawWave = rwave * rwave * rwave * rwave * rwave * rwave * rwave * rwave * rwave * rwave * rwave;

                const fzz = fz[x];
                const stop = szz;
                const drawStop = stop ? 1 : 0;

                // const res = fpsi < Infinity ? 1 : 0;
                const res = Math.min(fzz < Infinity
                    ? ((dv / (fzz)))
                    : 0,
                1);
                const r = rz[x];
                const g = drawTpi;
                const b = 0; // stop; // fzz < Infinity ? fzz / 50 : 1;

                setPixelNormI(this.imageData, oy + x, r, g, b);
            }
        }

        // setPixelXY(this.imageData, 150, 150, 255, 255, 255);

        this.ctx.putImageData(this.imageData, 0, 0);
    }
}

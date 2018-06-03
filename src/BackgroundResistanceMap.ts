import SimplexNoise from "simplex-noise";
import { Random } from "./utils/Random";

class Noise {
    simplicisCount = 8;
    frequencyFactor = .35;

    simplicis = Array.from({length: this.simplicisCount}, (_, k) => new SimplexNoise((k + 2).toString()));

    getRange() {
        let v = 0;
        for (let i = 0; i < this.simplicis.length; i++) {
            const valueScale = Math.pow(2, (this.simplicis.length - i - 1) * this.frequencyFactor);

            v += 1 / valueScale;
        }
        return {
            min: -v,
            max: v,
        };
    }

    getValue(x: number, y: number, t: number) {
        let v = 0;
        for (let i = 0; i < this.simplicis.length; i++) {
            const simplex = this.simplicis[i];

            const gridScale = Math.pow(2, -i);
            const valueScale = Math.pow(2, (this.simplicis.length - i - 1) * this.frequencyFactor);

            v += simplex.noise3D(x * gridScale, y * gridScale, t * gridScale) / valueScale;
        }
        return v;
    }
}

export class BackgroundResistanceMap {
    random: Random;

    size: number;

    noise: Noise;
    originalMap: Float64Array;
    originalMapRange: {
        min: number,
        max: number,
    };
    map: Float64Array;
    normMap: Float64Array;

    constructor(
        public width: number,
        public height: number,
    ) {
        this.random = new Random(0);

        this.size = width * height;
        this.noise = new Noise();
        this.originalMap = new Float64Array(this.size);
        this.fillMap(0);
        this.map = new Float64Array(this.size);
        this.normMap = new Float64Array(this.size);
    }

    fillMap(t: number) {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        for (let y = 0; y < this.height; y++) {
            const oy = y * this.width;
            for (let x = 0; x < this.width; x++) {
                const i = oy + x;
                const v = this.originalMap[i] = this.noise.getValue(x, y, t);
                if (v > max) { max = v; }
                if (v < min) { min = v; }
            }
        }

        this.originalMapRange = {
            min,
            max,
        };
    }

    dynamicNoiseScale = 1 / 4;
    update(t: number) {
        const range = this.originalMapRange.max + this.dynamicNoiseScale - this.originalMapRange.min;

        for (let y = 0; y < this.height; y++) {
            const oy = y * this.width;
            for (let x = 0; x < this.width; x++) {
                const i = oy + x;
                const mapV = this.map[i] = this.originalMap[i] + this.random.nextFloat() * this.dynamicNoiseScale;
                this.normMap[i] = (mapV - this.originalMapRange.min) / range;
            }
        }
    }
}

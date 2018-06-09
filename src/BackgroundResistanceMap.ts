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

    area: number;

    noise: Noise;
    originalMap: Float64Array[];
    originalMapRange: {
        min: number,
        max: number,
    };
    map: Float64Array[];
    normMap: Float64Array[];

    constructor(
        public width: number,
        public height: number,
    ) {
        this.random = new Random(0);

        this.area = width * height;
        this.noise = new Noise();
        this.originalMap = Array.from({ length: height }, () => new Float64Array(width));
        this.fillMap(0);
        this.map = Array.from({ length: height }, () => new Float64Array(width));
        this.normMap = Array.from({ length: height }, () => new Float64Array(width));
    }

    fillMap(t: number) {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        for (let y = 0; y < this.height; y++) {
            const originalMapY = this.originalMap[y];
            for (let x = 0; x < this.width; x++) {
                const v = originalMapY[x] = this.noise.getValue(x, y, t);
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
            const originalMapY = this.originalMap[y];
            const mapY = this.map[y];
            const normMapY = this.normMap[y];
            for (let x = 0; x < this.width; x++) {
                const mapV = mapY[x] = originalMapY[x]; // + this.random.nextFloat() * this.dynamicNoiseScale;
                normMapY[x] = 0.2 + (mapV - this.originalMapRange.min) / range * .8;
            }
        }
    }
}

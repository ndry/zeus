import { BackgroundResistanceMap } from "./BackgroundResistanceMap";
import { generateVoltageMap } from "./generateVoltageMap";
import { floodPaths, travelPaths, floodPaths2, floodPaths3 } from "./paths";

export class World {
    area: number;

    backgroundResistanceMap: BackgroundResistanceMap;
    voltageMap: Float64Array;
    floodPaths: {
        sumMap: Float64Array,
        precessorMap: Int32Array,
    };
    travelPaths: Float64Array;

    t = -Infinity;

    resistanceResource = 60;

    constructor (
        public width: number,
        public height: number,
    ) {
        this.area = width * height;

        this.backgroundResistanceMap = new BackgroundResistanceMap(width, height);

        this.voltageMap = generateVoltageMap(width, height);
        // const ionizedResistaceMap = map(backgroundResistanceMap, () => 1);
    }

    update() {
        this.t = (this.t < 0) ? 0 : (this.t + 1);

        this.backgroundResistanceMap.update(this.t);
        this.floodPaths = floodPaths(this.backgroundResistanceMap.normMap,
            this.width, this.height, 150, 150, this.resistanceResource);
        this.travelPaths = travelPaths(this.floodPaths, this.voltageMap,
            this.width, this.height, 150, 150, this.resistanceResource);
    }
}

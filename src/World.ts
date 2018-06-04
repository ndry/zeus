import { BackgroundResistanceMap } from "./BackgroundResistanceMap";
import { generateVoltageMap } from "./generateVoltageMap";
import { floodPaths, travelPaths, floodPaths2, floodPaths3 } from "./paths";

export class World {
    area: number;

    backgroundResistanceMap: BackgroundResistanceMap;
    voltageMap: Float64Array[];
    floodMap: Float64Array[];
    nextFloodMap: Float64Array[];
    // floodPaths: {
    //     sumMap: Float64Array,
    //     precessorMap: Int32Array,
    // };
    // travelPaths: Float64Array;

    t = -Infinity;

    resistanceResource = 60;

    constructor (
        public width: number,
        public height: number,
        public start: {
            x: number,
            y: number,
        },
    ) {
        this.area = width * height;

        this.backgroundResistanceMap = new BackgroundResistanceMap(width, height);

        this.voltageMap = generateVoltageMap(width, height);

        this.floodMap = Array.from({ length: height }, () => {
            const arr = new Float64Array(width);
            arr.fill(Infinity);
            return arr;
        });
        this.nextFloodMap = Array.from({ length: height }, () => {
            const arr = new Float64Array(width);
            arr.fill(Infinity);
            return arr;
        });

        this.floodMap[this.start.y][this.start.x] = 0;
    }

    updateFloodMap() {
        const width = this.width;
        const height = this.height;

        const dnn = Math.SQRT2;
        const dnz = 1;
        const dnp = Math.SQRT2;
        const dzn = 1;
        const dzz = 0;
        const dzp = 1;
        const dpn = Math.SQRT2;
        const dpz = 1;
        const dpp = Math.SQRT2;

        let en;
        let ez = this.floodMap[0];
        let ep = this.floodMap[1];

        for (let ey = 1; ey < this.floodMap.length - 1; ey++) {
            en = ez;
            ez = ep;
            ep = this.floodMap[ey + 1];

            let enn;
            let enz = en[0];
            let enp = en[1];
            let ezn;
            let ezz = ez[0];
            let ezp = ez[1];
            let epn;
            let epz = ep[0];
            let epp = ep[1];

            const rz = this.backgroundResistanceMap.normMap[ey];
            const nez = this.nextFloodMap[ey];

            for (let ex = 1; ex < ez.length - 1; ex++) {
                enn = enz;
                enz = enp;
                enp = en[ex + 1];
                ezn = ezz;
                ezz = ezp;
                ezp = ez[ex + 1];
                epn = epz;
                epz = epp;
                epp = ep[ex + 1];

                const rzz = rz[ex];

                let minSum = ezz * 1.005;

                {
                    const sum = enn + dnn * rzz;
                    if (sum < minSum) { minSum = sum; }
                }
                {
                    const sum = enz + dnz * rzz;
                    if (sum < minSum) { minSum = sum; }
                }
                {
                    const sum = enp + dnp * rzz;
                    if (sum < minSum) { minSum = sum; }
                }
                {
                    const sum = ezn + dzn * rzz;
                    if (sum < minSum) { minSum = sum; }
                }
                {
                    const sum = ezp + dzp * rzz;
                    if (sum < minSum) { minSum = sum; }
                }
                {
                    const sum = epn + dpn * rzz;
                    if (sum < minSum) { minSum = sum; }
                }
                {
                    const sum = epz + dpz * rzz;
                    if (sum < minSum) { minSum = sum; }
                }
                {
                    const sum = epp + dpp * rzz;
                    if (sum < minSum) { minSum = sum; }
                }

                nez[ex] = minSum;
            }
        }

        const tmp = this.floodMap;
        this.floodMap = this.nextFloodMap;
        this.nextFloodMap = tmp;
    }

    update() {
        this.t = (this.t < 0) ? 0 : (this.t + 1);

        this.backgroundResistanceMap.update(this.t);
        this.updateFloodMap();
        // this.floodPaths = floodPaths(this.backgroundResistanceMap.normMap,
        //     this.width, this.height, 150, 150, this.resistanceResource);
        // this.travelPaths = travelPaths(this.floodPaths, this.voltageMap,
        //     this.width, this.height, 150, 150, this.resistanceResource);
    }
}

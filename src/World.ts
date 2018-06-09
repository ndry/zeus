import { BackgroundResistanceMap } from "./BackgroundResistanceMap";
import { generateVoltageMap } from "./generateVoltageMap";
import { floodPaths, travelPaths, floodPaths2, floodPaths3 } from "./paths";

function createMap(width: number, height: number, fill: number) {
    return Array.from({ length: height }, () => {
        const arr = new Float64Array(width);
        if (fill !== 0) {
            arr.fill(fill);
        }
        return arr;
    });
}

class Swap<T> {
    constructor(
        public current: T,
        public next: T,
    ) {

    }

    swap() {
        const tmp = this.current;
        this.current = this.next;
        this.next = tmp;
    }
}

class StateMap {
    floodMap: Float64Array[];
    stopMap: Float64Array[];
    floodBackMap: Float64Array[];
    floodBackDecayMap: Float64Array[];
    precessorMap: Float64Array[];
    waveMap: Float64Array[];
    ionizationFactorMap: Float64Array[];

    constructor(width: number, height: number) {
        this.floodMap = createMap(width, height, Infinity);
        this.stopMap = createMap(width, height, 0);
        this.floodBackMap = createMap(width, height, 0);
        this.floodBackDecayMap = createMap(width, height, 0);
        this.precessorMap = createMap(width, height, -1);
        this.waveMap = createMap(width, height, 0);
        this.ionizationFactorMap = createMap(width, height, 1);
    }
}

export class World {
    area: number;

    backgroundResistanceMap: BackgroundResistanceMap;
    voltageMap: {
        map: Float64Array[],
        normMap: Float64Array[],
    };

    stateMap: Swap<StateMap>;

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

        this.stateMap = new Swap(new StateMap(width, height), new StateMap(width, height));
        this.stateMap.current.floodMap[start.y][start.x] = 0;
    }

    updateFloodMap() {
        const width = this.width;
        const height = this.height;
        const resistanceResource = this.resistanceResource;

        this.stateMap.current.waveMap[this.start.y][this.start.x] += 1;

        const startV = this.voltageMap.map[this.start.y][this.start.x];

        const dnn = Math.SQRT2;
        const dnz = 1;
        const dnp = Math.SQRT2;
        const dzn = 1;
        const dzz = 0;
        const dzp = 1;
        const dpn = Math.SQRT2;
        const dpz = 1;
        const dpp = Math.SQRT2;

        const weightSum = 4 * 1 + 4 * Math.SQRT2;

        const weight$nn = dnn / weightSum;
        const weight$nz = dnz / weightSum;
        const weight$np = dnp / weightSum;
        const weight$zn = dzn / weightSum;
        const weight$zz = dzz / weightSum;
        const weight$zp = dzp / weightSum;
        const weight$pn = dpn / weightSum;
        const weight$pz = dpz / weightSum;
        const weight$pp = dpp / weightSum;

        let en;
        let ez = this.stateMap.current.floodMap[0];
        let ep = this.stateMap.current.floodMap[1];

        let resistance$n;
        let resistance$z = this.backgroundResistanceMap.normMap[0];
        let resistance$p = this.backgroundResistanceMap.normMap[1];

        let fbn;
        let fbz = this.stateMap.current.floodBackMap[0];
        let fbp = this.stateMap.current.floodBackMap[1];

        let precessor$n;
        let precessor$z = this.stateMap.current.precessorMap[0];
        let precessor$p = this.stateMap.current.precessorMap[1];

        let wave$n;
        let wave$z = this.stateMap.current.waveMap[0];
        let wave$p = this.stateMap.current.waveMap[1];

        let ionizationFactor$n;
        let ionizationFactor$z = this.stateMap.current.ionizationFactorMap[0];
        let ionizationFactor$p = this.stateMap.current.ionizationFactorMap[1];

        for (let y = 1; y < this.stateMap.current.floodMap.length - 1; y++) {
            resistance$n = resistance$z;
            resistance$z = resistance$p;
            resistance$p = this.backgroundResistanceMap.normMap[y + 1];

            let resistance$nn;
            let resistance$nz = resistance$n[0];
            let resistance$np = resistance$n[1];
            let resistance$zn;
            let resistance$zz = resistance$z[0];
            let resistance$zp = resistance$z[1];
            let resistance$pn;
            let resistance$pz = resistance$p[0];
            let resistance$pp = resistance$p[1];

            en = ez;
            ez = ep;
            ep = this.stateMap.current.floodMap[y + 1];

            let enn;
            let enz = en[0];
            let enp = en[1];
            let ezn;
            let ezz = ez[0];
            let ezp = ez[1];
            let epn;
            let epz = ep[0];
            let epp = ep[1];

            fbn = fbz;
            fbz = fbp;
            fbp = this.stateMap.current.floodBackMap[y + 1];

            let fbnn;
            let fbnz = fbn[0];
            let fbnp = fbn[1];
            let fbzn;
            let fbzz = fbz[0];
            let fbzp = fbz[1];
            let fbpn;
            let fbpz = fbp[0];
            let fbpp = fbp[1];

            precessor$n = precessor$z;
            precessor$z = precessor$p;
            precessor$p = this.stateMap.current.precessorMap[y + 1];

            let precessor$nn;
            let precessor$nz = precessor$n[0];
            let precessor$np = precessor$n[1];
            let precessor$zn;
            let precessor$zz = precessor$z[0];
            let precessor$zp = precessor$z[1];
            let precessor$pn;
            let precessor$pz = precessor$p[0];
            let precessor$pp = precessor$p[1];

            wave$n = wave$z;
            wave$z = wave$p;
            wave$p = this.stateMap.current.waveMap[y + 1];

            let wave$nn;
            let wave$nz = wave$n[0];
            let wave$np = wave$n[1];
            let wave$zn;
            let wave$zz = wave$z[0];
            let wave$zp = wave$z[1];
            let wave$pn;
            let wave$pz = wave$p[0];
            let wave$pp = wave$p[1];

            ionizationFactor$n = ionizationFactor$z;
            ionizationFactor$z = ionizationFactor$p;
            ionizationFactor$p = this.stateMap.current.ionizationFactorMap[y + 1];

            let ionizationFactor$nn;
            let ionizationFactor$nz = ionizationFactor$n[0];
            let ionizationFactor$np = ionizationFactor$n[1];
            let ionizationFactor$zn;
            let ionizationFactor$zz = ionizationFactor$z[0];
            let ionizationFactor$zp = ionizationFactor$z[1];
            let ionizationFactor$pn;
            let ionizationFactor$pz = ionizationFactor$p[0];
            let ionizationFactor$pp = ionizationFactor$p[1];

            const rz = this.backgroundResistanceMap.normMap[y];
            const nez = this.stateMap.next.floodMap[y];
            const nfbz = this.stateMap.next.floodBackMap[y];
            const sz = this.stateMap.current.stopMap[y];
            const nsz = this.stateMap.next.stopMap[y];
            const vz = this.voltageMap.map[y];
            const next$precessor$z = this.stateMap.next.precessorMap[y];
            const fbd$z = this.stateMap.next.floodBackDecayMap[y];
            const next$fbd$z = this.stateMap.next.floodBackDecayMap[y];
            const next$wave$z = this.stateMap.next.waveMap[y];
            const next$ionizationFactor$z = this.stateMap.next.ionizationFactorMap[y];

            for (let x = 1; x < ez.length - 1; x++) {
                resistance$nn = resistance$nz;
                resistance$nz = resistance$np;
                resistance$np = resistance$n[x + 1];
                resistance$zn = resistance$zz;
                resistance$zz = resistance$zp;
                resistance$zp = resistance$z[x + 1];
                resistance$pn = resistance$pz;
                resistance$pz = resistance$pp;
                resistance$pp = resistance$p[x + 1];

                enn = enz;
                enz = enp;
                enp = en[x + 1];
                ezn = ezz;
                ezz = ezp;
                ezp = ez[x + 1];
                epn = epz;
                epz = epp;
                epp = ep[x + 1];

                fbnn = fbnz;
                fbnz = fbnp;
                fbnp = fbn[x + 1];
                fbzn = fbzz;
                fbzz = fbzp;
                fbzp = fbz[x + 1];
                fbpn = fbpz;
                fbpz = fbpp;
                fbpp = fbp[x + 1];

                precessor$nn = precessor$nz;
                precessor$nz = precessor$np;
                precessor$np = precessor$n[x + 1];
                precessor$zn = precessor$zz;
                precessor$zz = precessor$zp;
                precessor$zp = precessor$z[x + 1];
                precessor$pn = precessor$pz;
                precessor$pz = precessor$pp;
                precessor$pp = precessor$p[x + 1];

                wave$nn = wave$nz;
                wave$nz = wave$np;
                wave$np = wave$n[x + 1];
                wave$zn = wave$zz;
                wave$zz = wave$zp;
                wave$zp = wave$z[x + 1];
                wave$pn = wave$pz;
                wave$pz = wave$pp;
                wave$pp = wave$p[x + 1];

                ionizationFactor$nn = ionizationFactor$nz;
                ionizationFactor$nz = ionizationFactor$np;
                ionizationFactor$np = ionizationFactor$n[x + 1];
                ionizationFactor$zn = ionizationFactor$zz;
                ionizationFactor$zz = ionizationFactor$zp;
                ionizationFactor$zp = ionizationFactor$z[x + 1];
                ionizationFactor$pn = ionizationFactor$pz;
                ionizationFactor$pz = ionizationFactor$pp;
                ionizationFactor$pp = ionizationFactor$p[x + 1];

                const rzz = rz[x];
                const vzz = vz[x];
                const szz = sz[x];
                const fbd$zz = fbd$z[x];

                const dv = vzz - startV;
                const a = dv / ezz;

                let minSum = ezz * 1.005;
                let minSumI = -1;
                let stop = 0;

                let next$fbzz = 0;
                let next$wave$zz = 0;

                const resistance = rzz * ionizationFactor$zz;

                // if (szz > 0) {
                    next$fbzz += a;
                // }

                {
                    const i = 0;
                    const n$backgroundResistance = resistance$nn;
                    const ne = enn;
                    const nd = dnn;
                    const nfb = fbnn;
                    const n$precessor = precessor$nn;
                    const iReverse = 7 - i;
                    const nwave = wave$nn;
                    const n$weight = weight$nn;
                    const n$ionizationFactor = ionizationFactor$nn;
                    const n$resistance = n$backgroundResistance * n$ionizationFactor;

                    next$wave$zz += nwave * n$weight / n$resistance;
                    if (n$precessor === iReverse) {
                        next$fbzz += nfb;
                    }
                    const sum = ne + nd * resistance;
                    if (sum < minSum) {
                        minSum = sum;
                        minSumI = i;
                    }
                    if (ne < this.resistanceResource) { stop++; }
                }
                {
                    const i = 1;
                    const n$backgroundResistance = resistance$nz;
                    const ne = enz;
                    const nd = dnz;
                    const nfb = fbnz;
                    const n$precessor = precessor$nz;
                    const iReverse = 7 - i;
                    const nwave = wave$nz;
                    const n$weight = weight$nz;
                    const n$ionizationFactor = ionizationFactor$nz;
                    const n$resistance = n$backgroundResistance * n$ionizationFactor;

                    next$wave$zz += nwave * n$weight / n$resistance;
                    if (n$precessor === iReverse) {
                        next$fbzz += nfb;
                    }
                    const sum = ne + nd * resistance;
                    if (sum < minSum) {
                        minSum = sum;
                        minSumI = i;
                    }
                    if (ne < this.resistanceResource) { stop++; }
                }
                {
                    const i = 2;
                    const n$backgroundResistance = resistance$np;
                    const ne = enp;
                    const nd = dnp;
                    const nfb = fbnp;
                    const n$precessor = precessor$np;
                    const iReverse = 7 - i;
                    const nwave = wave$np;
                    const n$weight = weight$np;
                    const n$ionizationFactor = ionizationFactor$np;
                    const n$resistance = n$backgroundResistance * n$ionizationFactor;

                    next$wave$zz += nwave * n$weight / n$resistance;
                    if (n$precessor === iReverse) {
                        next$fbzz += nfb;
                    }
                    const sum = ne + nd * resistance;
                    if (sum < minSum) {
                        minSum = sum;
                        minSumI = i;
                    }
                    if (ne < this.resistanceResource) { stop++; }
                }
                {
                    const i = 3;
                    const n$backgroundResistance = resistance$zn;
                    const ne = ezn;
                    const nd = dzn;
                    const nfb = fbzn;
                    const n$precessor = precessor$zn;
                    const iReverse = 7 - i;
                    const nwave = wave$zn;
                    const n$weight = weight$zn;
                    const n$ionizationFactor = ionizationFactor$zn;
                    const n$resistance = n$backgroundResistance * n$ionizationFactor;

                    next$wave$zz += nwave * n$weight / n$resistance;
                    if (n$precessor === iReverse) {
                        next$fbzz += nfb;
                    }
                    const sum = ne + nd * resistance;
                    if (sum < minSum) {
                        minSum = sum;
                        minSumI = i;
                    }
                    if (ne < this.resistanceResource) { stop++; }
                }
                {
                    const i = 4;
                    const n$backgroundResistance = resistance$zp;
                    const ne = ezp;
                    const nd = dzp;
                    const nfb = fbzp;
                    const n$precessor = precessor$zp;
                    const iReverse = 7 - i;
                    const nwave = wave$zp;
                    const n$weight = weight$zp;
                    const n$ionizationFactor = ionizationFactor$zp;
                    const n$resistance = n$backgroundResistance * n$ionizationFactor;

                    next$wave$zz += nwave * n$weight / n$resistance;
                    if (n$precessor === iReverse) {
                        next$fbzz += nfb;
                    }
                    const sum = ne + nd * resistance;
                    if (sum < minSum) {
                        minSum = sum;
                        minSumI = i;
                    }
                    if (ne < this.resistanceResource) { stop++; }
                }
                {
                    const i = 5;
                    const n$backgroundResistance = resistance$pn;
                    const ne = epn;
                    const nd = dpn;
                    const nfb = fbpn;
                    const n$precessor = precessor$pn;
                    const iReverse = 7 - i;
                    const nwave = wave$pn;
                    const n$weight = weight$pn;
                    const n$ionizationFactor = ionizationFactor$pn;
                    const n$resistance = n$backgroundResistance * n$ionizationFactor;

                    next$wave$zz += nwave * n$weight / n$resistance;
                    if (n$precessor === iReverse) {
                        next$fbzz += nfb;
                    }
                    const sum = ne + nd * resistance;
                    if (sum < minSum) {
                        minSum = sum;
                        minSumI = i;
                    }
                    if (ne < this.resistanceResource) { stop++; }
                }
                {
                    const i = 6;
                    const n$backgroundResistance = resistance$pz;
                    const ne = epz;
                    const nd = dpz;
                    const nfb = fbpz;
                    const n$precessor = precessor$pz;
                    const iReverse = 7 - i;
                    const nwave = wave$pz;
                    const n$weight = weight$pz;
                    const n$ionizationFactor = ionizationFactor$pz;
                    const n$resistance = n$backgroundResistance * n$ionizationFactor;

                    next$wave$zz += nwave * n$weight / n$resistance;
                    if (n$precessor === iReverse) {
                        next$fbzz += nfb;
                    }
                    const sum = ne + nd * resistance;
                    if (sum < minSum) {
                        minSum = sum;
                        minSumI = i;
                    }
                    if (ne < this.resistanceResource) { stop++; }
                }
                {
                    const i = 7;
                    const n$backgroundResistance = resistance$pp;
                    const ne = epp;
                    const nd = dpp;
                    const nfb = fbpp;
                    const n$precessor = precessor$pp;
                    const iReverse = 7 - i;
                    const nwave = wave$pp;
                    const n$weight = weight$pp;
                    const n$ionizationFactor = ionizationFactor$pp;
                    const n$resistance = n$backgroundResistance * n$ionizationFactor;

                    next$wave$zz += nwave * n$weight / n$resistance;
                    if (n$precessor === iReverse) {
                        next$fbzz += nfb;
                    }
                    const sum = ne + nd * resistance;
                    if (sum < minSum) {
                        minSum = sum;
                        minSumI = i;
                    }
                    if (ne < this.resistanceResource) { stop++; }
                }

                nez[x] = minSum;
                nsz[x] = ((ezz >= this.resistanceResource && ezz < Infinity) && (stop > 0 && stop < 8)) ? 1 : 0;
                next$precessor$z[x] = minSumI >= 0 ? minSumI : precessor$zz;
                nfbz[x] = next$fbzz;
                next$fbd$z[x] = Math.max(fbd$zz * .99, next$fbzz);
                next$wave$z[x] = next$wave$zz;

                const ionizationFactor = 0.02 + 0.98 * ionizationFactor$zz / (fbd$zz / 60);

                next$ionizationFactor$z[x] = Math.min(ionizationFactor * 1.05, 1);
            }
        }

        this.stateMap.swap();
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

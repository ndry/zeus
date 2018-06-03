import { ForkTurboJs } from "./utils/ForkTurboJs";

const queue = new Int32Array(3000000);

const gpu = new ForkTurboJs();

const floodPaths3Programs: { [id: string]: {
    program: any,
} } = {};

export function floodPaths3(
    resistanceMap: Float64Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    resistanceResource: number,
) {
    const buf = new Float32Array(resistanceMap.length * 4);
    for (let i = 0; i < resistanceMap.length; i++) {
        buf[i * 4 + 0] = resistanceMap[i];
        buf[i * 4 + 1] = Number.POSITIVE_INFINITY;
    }

    const startI = startY * width + startX;
    buf[startI * 4 + 1] = 0;

    const textureSize = Math.sqrt(buf.length / 4);
    const fGlsl = `
#define WIDTH ${width.toFixed(0)}
#define HEIGHT ${height.toFixed(0)}
#define INV_WIDTH ${(1 / width)}
#define INV_HEIGHT ${(1 / height)}
#define RESISTANCE_RESOURCE ${resistanceResource}
#define SQRT2 ${Math.SQRT2}

vec4 get(vec2 pos) {
    return texture2D(u_texture, pos);
}

void main(void) {
    const int NEIGHBOURS_COUNT = 8;
    vec2 NEIGHBOURS[NEIGHBOURS_COUNT];
    NEIGHBOURS[0] = vec2(-1. * INV_WIDTH, -1. * INV_HEIGHT);
    NEIGHBOURS[1] = vec2(-1. * INV_WIDTH,  0. * INV_HEIGHT);
    NEIGHBOURS[2] = vec2(-1. * INV_WIDTH, +1. * INV_HEIGHT);
    NEIGHBOURS[3] = vec2( 0. * INV_WIDTH, -1. * INV_HEIGHT);
    NEIGHBOURS[4] = vec2( 0. * INV_WIDTH, +1. * INV_HEIGHT);
    NEIGHBOURS[5] = vec2(+1. * INV_WIDTH, -1. * INV_HEIGHT);
    NEIGHBOURS[6] = vec2(+1. * INV_WIDTH,  0. * INV_HEIGHT);
    NEIGHBOURS[7] = vec2(+1. * INV_WIDTH, +1. * INV_HEIGHT);

    float NEIGHBOURS_DISTANCE[NEIGHBOURS_COUNT];
    NEIGHBOURS_DISTANCE[0] = SQRT2;
    NEIGHBOURS_DISTANCE[1] = 1.;
    NEIGHBOURS_DISTANCE[2] = SQRT2;
    NEIGHBOURS_DISTANCE[3] = 1.;
    NEIGHBOURS_DISTANCE[4] = 1.;
    NEIGHBOURS_DISTANCE[5] = SQRT2;
    NEIGHBOURS_DISTANCE[6] = 1.;
    NEIGHBOURS_DISTANCE[7] = SQRT2;

    vec4 e = get(pos);
    float er = e.x;
    float esum = e.y;

    float minSum = esum;

    for (int k = 0; k < NEIGHBOURS_COUNT; k++) {
        vec2 npos = pos + NEIGHBOURS[k];

        if (npos.x < 0. || npos.x > 1.) {
            continue;
        }
        if (npos.y < 0. || npos.y > 1.) {
            continue;
        }

        vec4 n = get(npos);
        float nsum = n.y;

        if (nsum > float(RESISTANCE_RESOURCE)) {
            // this neightbour is already unreachable, no need to go further
            continue;
        }

        float nd = NEIGHBOURS_DISTANCE[k];
        float sum = nsum + nd * er;

        if (sum < minSum) {
            minSum = sum;
        }
    }

    if (minSum < esum) {
        esum = minSum;
        // updated
    }

    gl_FragColor.x = er;
    gl_FragColor.y = esum;
}
    `;

    const cacheId = `${width}x${height}`;
    const cache = floodPaths3Programs[cacheId] || (floodPaths3Programs[cacheId] = {
        program: gpu.build(fGlsl),
    });

    let txt1 = gpu.writeTexture(buf, width, height);
    let txt2 = gpu.createTexture(width, height);

    for (let i = 0; i < 50; i++) {
        cache.program.run(txt1, txt2, width, height);
        const txtTmp = txt1;
        txt1 = txt2;
        txt2 = txtTmp;
    }
    cache.program.runOutput(txt1, buf, txt2, width, height);

    const sumMap = new Float64Array(resistanceMap.length);
    for (let i = 0; i < resistanceMap.length; i++) {
        sumMap[i] = buf[i * 4 + 1];
    }
    const precessorMap = new Int32Array(resistanceMap.length);
    precessorMap.fill(-1);

    return {
        sumMap,
        precessorMap,
    };
}

export function floodPaths2(
    resistanceMap: Float64Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    resistanceResource: number,
) {
    const neightbours = [{
        dx: -1, dy: -1, d: Math.SQRT2, di: -1 * width + -1,
    }, {
        dx: -1, dy: 0, d: 1, di: 0 * width + -1,
    }, {
        dx: -1, dy: 1, d: Math.SQRT2, di: 1 * width + -1,
    }, {
        dx: 0, dy: -1, d: 1, di: -1 * width + 0,
    }, {
        dx: 0, dy: 1, d: 1, di: 1 * width + 0,
    }, {
        dx: 1, dy: -1, d: Math.SQRT2, di: -1 * width + 1,
    }, {
        dx: 1, dy: 0, d: 1, di: 0 * width + 1,
    }, {
        dx: 1, dy: 1, d: Math.SQRT2, di: 1 * width + 1,
    }];

    const startI = startY * width + startX;

    let sumMap = new Float64Array(resistanceMap.length);
    sumMap.fill(Number.POSITIVE_INFINITY);
    let nextSumMap = new Float64Array(resistanceMap.length);
    nextSumMap.fill(Number.POSITIVE_INFINITY);
    const precessorMap = new Int32Array(resistanceMap.length);
    precessorMap.fill(-1);

    sumMap[startI] = 0;

    let ic = 0;
    let updated: number;
    do {
        ic++;
        updated = 0;
        for (let ei = 0; ei < sumMap.length; ei++) {
            const ex = ei % width;
            const ey = ei / width; // not exactly ey, but enough for boundary check
            const boundaryCheckNeeded = (ex - 1 < 0) || (ex + 1 >= width) || (ey - 1 < 0) || (ey + 1 >= height);

            const esum = sumMap[ei];

            let minSum = esum;
            let minSumI = -1;

            const r = resistanceMap[ei];

            for (const n of neightbours) {
                if (boundaryCheckNeeded) {
                    const nx = ex + n.dx;
                    const ny = ey + n.dy;

                    if (nx < 0 || nx >= width) {
                        continue;
                    }
                    if (ny < 0 || ny >= height) {
                        continue;
                    }
                }

                const ni = ei + n.di;

                const nsum = sumMap[ni];

                if (nsum > resistanceResource) {
                    // this neightbour is already unreachable, no need to go further
                    continue;
                }

                const sum = nsum + n.d * r;

                if (sum < minSum) {
                    minSum = sum;
                    minSumI = ni;
                }
            }

            if (minSum < esum) {
                nextSumMap[ei] = minSum;
                precessorMap[ei] = minSumI;
                updated++;
            } else {
                nextSumMap[ei] = esum;
            }
        }
        const t = nextSumMap;
        nextSumMap = sumMap;
        sumMap = t;
        console.log(updated);
    } while (updated > 0);
    console.log(ic);

    return {
        sumMap,
        precessorMap,
    };
}

export function floodPaths(
    resistanceMap: Float64Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    resistanceResource: number,
) {
    const neightbours = [{
        dx: -1, dy: -1, d: Math.SQRT2, di: -1 * width + -1,
    }, {
        dx: -1, dy: 0, d: 1, di: 0 * width + -1,
    }, {
        dx: -1, dy: 1, d: Math.SQRT2, di: 1 * width + -1,
    }, {
        dx: 0, dy: -1, d: 1, di: -1 * width + 0,
    }, {
        dx: 0, dy: 1, d: 1, di: 1 * width + 0,
    }, {
        dx: 1, dy: -1, d: Math.SQRT2, di: -1 * width + 1,
    }, {
        dx: 1, dy: 0, d: 1, di: 0 * width + 1,
    }, {
        dx: 1, dy: 1, d: Math.SQRT2, di: 1 * width + 1,
    }];

    const startI = startY * width + startX;

    const sumMap = new Float64Array(resistanceMap.length);
    sumMap.fill(Number.POSITIVE_INFINITY);
    const lastSumMap = new Float64Array(resistanceMap.length);
    lastSumMap.fill(Number.POSITIVE_INFINITY);
    const precessorMap = new Int32Array(resistanceMap.length);
    precessorMap.fill(-1);

    let qe = 0;
    let rqi = 0;

    sumMap[startI] = 0;

    queue[qe++] = startI;

    for (let qi = 0; qi < qe; qi++) {
        const ei = queue[qi];

        const esum = sumMap[ei];
        if (esum >= lastSumMap[ei]) {
            continue;
        }
        lastSumMap[ei] = esum;

        rqi++;

        const ex = ei % width;
        const ey = ei / width; // not exactly ey, but enough for boundary check
        const boundaryCheckNeeded = (ex - 1 < 0) || (ex + 1 >= width) || (ey - 1 < 0) || (ey + 1 >= height);

        for (const n of neightbours) {
            if (boundaryCheckNeeded) {
                const nx = ex + n.dx;
                const ny = ey + n.dy;

                if (nx < 0 || nx >= width) {
                    continue;
                }
                if (ny < 0 || ny >= height) {
                    continue;
                }
            }

            const ni = ei + n.di;

            const sum = esum + n.d * resistanceMap[ni];

            if (sum >= sumMap[ni]) {
                // better path to this neightbour is already found
                continue;
            }

            sumMap[ni] = sum;
            precessorMap[ni] = ei;

            if (sum > resistanceResource) {
                // this neightbour is already unreachable, no need to go further
                continue;
            }

            queue[qe++] = ni;
        }
    }

    // console.log(rqi, qe);

    return {
        sumMap,
        precessorMap,
    };
}

export function travelPaths(
    pathsMap: {
        sumMap: Float64Array,
        precessorMap: Int32Array,
    },
    voltageMap: Float64Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    resistanceResource: number,
) {
    const startI = startY * width + startX;
    const startV = voltageMap[startI];

    const travelMap = new Float64Array(voltageMap.length);

    let xMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;

    for (let y = 0; y < height; y++) {
        const oy = y * width;
        for (let x = 0; x < width; x++) {
            const i = oy + x;
            const pmsi = pathsMap.sumMap[i];
            if (pmsi === Infinity || pmsi <= resistanceResource) {
                continue;
            }

            if (xMin > x) { xMin = x; }
            if (xMax < x) { xMax = x; }
            if (yMin > y) { yMin = y; }
            if (yMax < y) { yMax = y; }

            const u = voltageMap[i] - startV;
            const a = u / pmsi;

            let pi = pathsMap.precessorMap[i];

            while (pi >= 0) {
                travelMap[pi] += a;
                pi = pathsMap.precessorMap[pi];
            }
        }
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (let y = yMin; y <= yMax; y++) {
        const oy = y * width;
        for (let x = xMin; x <= xMax; x++) {
            const i = oy + x;

            let v = travelMap[i];
            if (v < 0) { v = 0; }
            travelMap[i] = v;

            if (v > max) { max = v; }
            if (v < min) { min = v; }
        }
    }

    const range = max - min;

    for (let y = yMin; y <= yMax; y++) {
        const oy = y * width;
        for (let x = xMin; x <= xMax; x++) {
            const i = oy + x;
            travelMap[i] = (travelMap[i] - min) / range;
        }
    }

    return travelMap;
}

// https://en.wikipedia.org/wiki/Lehmer_random_number_generator
System.register("utils/Random", [], function (exports_1, context_1) {
    var __moduleName = context_1 && context_1.id;
    var MAX_INT32, MINSTD, Random;
    return {
        setters: [],
        execute: function () {// https://en.wikipedia.org/wiki/Lehmer_random_number_generator
            MAX_INT32 = 2147483647;
            MINSTD = 16807;
            Random = class Random {
                constructor(seed) {
                    if (!Number.isInteger(seed)) {
                        throw new TypeError("Expected `seed` to be a `integer`");
                    }
                    this.seed = seed % MAX_INT32;
                    if (this.seed <= 0) {
                        this.seed += (MAX_INT32 - 1);
                    }
                }
                next() {
                    return this.seed = this.seed * MINSTD % MAX_INT32;
                }
                nextFloat() {
                    return (this.next() - 1) / (MAX_INT32 - 1);
                }
            };
            exports_1("Random", Random);
        }
    };
});
System.register("BackgroundResistanceMap", ["simplex-noise", "utils/Random"], function (exports_2, context_2) {
    var __moduleName = context_2 && context_2.id;
    var simplex_noise_1, Random_1, Noise, BackgroundResistanceMap;
    return {
        setters: [
            function (simplex_noise_1_1) {
                simplex_noise_1 = simplex_noise_1_1;
            },
            function (Random_1_1) {
                Random_1 = Random_1_1;
            }
        ],
        execute: function () {
            Noise = class Noise {
                constructor() {
                    this.simplicisCount = 8;
                    this.frequencyFactor = .35;
                    this.simplicis = Array.from({ length: this.simplicisCount }, (_, k) => new simplex_noise_1.default((k + 2).toString()));
                }
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
                getValue(x, y, t) {
                    let v = 0;
                    for (let i = 0; i < this.simplicis.length; i++) {
                        const simplex = this.simplicis[i];
                        const gridScale = Math.pow(2, -i);
                        const valueScale = Math.pow(2, (this.simplicis.length - i - 1) * this.frequencyFactor);
                        v += simplex.noise3D(x * gridScale, y * gridScale, t * gridScale) / valueScale;
                    }
                    return v;
                }
            };
            BackgroundResistanceMap = class BackgroundResistanceMap {
                constructor(width, height) {
                    this.width = width;
                    this.height = height;
                    this.dynamicNoiseScale = 1 / 4;
                    this.random = new Random_1.Random(0);
                    this.area = width * height;
                    this.noise = new Noise();
                    this.originalMap = Array.from({ length: height }, () => new Float64Array(width));
                    this.fillMap(0);
                    this.map = Array.from({ length: height }, () => new Float64Array(width));
                    this.normMap = Array.from({ length: height }, () => new Float64Array(width));
                }
                fillMap(t) {
                    let min = Number.POSITIVE_INFINITY;
                    let max = Number.NEGATIVE_INFINITY;
                    for (let y = 0; y < this.height; y++) {
                        const originalMapY = this.originalMap[y];
                        for (let x = 0; x < this.width; x++) {
                            const v = originalMapY[x] = this.noise.getValue(x, y, t);
                            if (v > max) {
                                max = v;
                            }
                            if (v < min) {
                                min = v;
                            }
                        }
                    }
                    this.originalMapRange = {
                        min,
                        max,
                    };
                }
                update(t) {
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
            };
            exports_2("BackgroundResistanceMap", BackgroundResistanceMap);
        }
    };
});
System.register("generateVoltageMap", [], function (exports_3, context_3) {
    var __moduleName = context_3 && context_3.id;
    function generateVoltageMap(width, height) {
        const sourceRadialGradientArgs = {
            cx: 150,
            cy: 150,
            factor: 20,
        };
        const map = Array.from({ length: height }, () => new Float64Array(width));
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (let y = 0; y < height; y++) {
            const mapY = map[y];
            for (let x = 0; x < width; x++) {
                let v = 0;
                // v += (y / height);
                {
                    const args = sourceRadialGradientArgs;
                    const dx = x - args.cx;
                    const dy = y - args.cy;
                    const r = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
                    v -= (1 / r) * args.factor;
                }
                mapY[x] = v;
                if (v > max) {
                    max = v;
                }
                if (v < min) {
                    min = v;
                }
            }
        }
        const range = max - min;
        const normMap = Array.from({ length: height }, () => new Float64Array(width));
        for (let y = 0; y < height; y++) {
            const mapY = map[y];
            const normMapY = normMap[y];
            for (let x = 0; x < width; x++) {
                normMapY[x] = (mapY[x] - min) / range;
            }
        }
        return {
            map,
            normMap,
        };
    }
    exports_3("generateVoltageMap", generateVoltageMap);
    return {
        setters: [],
        execute: function () {
        }
    };
});
// Based on turbo.js https://turbo.js.org/
System.register("utils/ForkTurboJs", [], function (exports_4, context_4) {
    var __moduleName = context_4 && context_4.id;
    // Mozilla reference init implementation
    function initGLFromCanvas(canvas) {
        const attr = {
            alpha: false,
            antialias: false,
        };
        // Try to grab the standard context. If it fails, fallback to experimental.
        const gl = canvas.getContext("webgl", attr)
            || canvas.getContext("experimental-webgl", attr);
        // If we don't have a GL context, give up now
        if (!gl) {
            throw new Error("turbojs: Unable to initialize WebGL. Your browser may not support it.");
        }
        return gl;
    }
    var ForkTurboJs;
    return {
        setters: [],
        execute: function () {// Based on turbo.js https://turbo.js.org/
            ForkTurboJs = class ForkTurboJs {
                constructor(gl = initGLFromCanvas(document.createElement("canvas"))) {
                    this.gl = gl;
                    // turbo.js requires a 32bit float vec4 texture. Some systems only provide 8bit/float
                    // textures. A workaround is being created, but turbo.js shouldn't be used on those
                    // systems anyway.
                    if (!gl.getExtension("OES_texture_float")) {
                        throw new Error("turbojs: Required texture format OES_texture_float not supported.");
                    }
                    this.positionBuffer = this.newFloat32Buffer([-1, -1, 1, -1, 1, 1, -1, 1]);
                    this.textureBuffer = this.newFloat32Buffer([0, 0, 1, 0, 1, 1, 0, 1]);
                    this.indexBuffer = this.newUint16Buffer([1, 2, 0, 3, 0, 2], gl.ELEMENT_ARRAY_BUFFER);
                    const vertexShaderCode = `
        attribute vec2 position;
        varying vec2 pos;
        attribute vec2 texture;

        void main(void) {
        pos = texture;
        gl_Position = vec4(position.xy, 0.0, 1.0);
        }
        `;
                    this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
                    gl.shaderSource(this.vertexShader, vertexShaderCode);
                    gl.compileShader(this.vertexShader);
                    // This should not fail.
                    if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
                        throw new Error("\nturbojs: Could not build internal vertex shader (fatal).\n" + "\n" +
                            "INFO: >REPORT< THIS. That's our fault!\n" + "\n" +
                            "--- CODE DUMP ---\n" + vertexShaderCode + "\n\n" +
                            "--- ERROR LOG ---\n" + gl.getShaderInfoLog(this.vertexShader));
                    }
                }
                // GPU texture buffer from JS typed array
                newFloat32Buffer(data, e = this.gl.ARRAY_BUFFER) {
                    const gl = this.gl;
                    const buf = gl.createBuffer();
                    gl.bindBuffer(e, buf);
                    gl.bufferData(e, new Float32Array(data), gl.STATIC_DRAW);
                    return buf;
                }
                // GPU texture buffer from JS typed array
                newUint16Buffer(data, e = this.gl.ARRAY_BUFFER) {
                    const gl = this.gl;
                    const buf = gl.createBuffer();
                    gl.bindBuffer(e, buf);
                    gl.bufferData(e, new Uint16Array(data), gl.STATIC_DRAW);
                    return buf;
                }
                // Transfer data onto clamped texture and turn off any filtering
                writeTexture(data, width, height) {
                    const gl = this.gl;
                    const texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, data);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    return texture;
                }
                createTexture(width, height) {
                    const gl = this.gl;
                    const texture = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    return texture;
                }
                build(code) {
                    const gl = this.gl;
                    const textureBuffer = this.textureBuffer;
                    const positionBuffer = this.positionBuffer;
                    const indexBuffer = this.indexBuffer;
                    const stdlib = `
        precision mediump float;
        uniform sampler2D u_texture;
        varying vec2 pos;

        vec4 read(void) {
        return texture2D(u_texture, pos);
        }

        void commit(vec4 val) {
        gl_FragColor = val;
        }

        `;
                    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                    gl.shaderSource(fragmentShader, stdlib + code);
                    gl.compileShader(fragmentShader);
                    // Use this output to debug the shader
                    // Keep in mind that WebGL GLSL is **much** stricter than e.g. OpenGL GLSL
                    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                        const LOC = code.split("\n");
                        let dbgMsg = "ERROR: Could not build shader (fatal).\n\n" +
                            "------------------ KERNEL CODE DUMP ------------------\n";
                        for (let nl = 0; nl < LOC.length; nl++) {
                            dbgMsg += (stdlib.split("\n").length + nl) + "> " + LOC[nl] + "\n";
                        }
                        dbgMsg += "\n--------------------- ERROR  LOG ---------------------\n" +
                            gl.getShaderInfoLog(fragmentShader);
                        throw new Error(dbgMsg);
                    }
                    const program = gl.createProgram();
                    gl.attachShader(program, this.vertexShader);
                    gl.attachShader(program, fragmentShader);
                    gl.linkProgram(program);
                    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                        throw new Error("turbojs: Failed to link GLSL program code.");
                    }
                    const uTexture = gl.getUniformLocation(program, "u_texture");
                    const aPosition = gl.getAttribLocation(program, "position");
                    const aTexture = gl.getAttribLocation(program, "texture");
                    return {
                        run(iptTexture, optTexture, width, height) {
                            gl.useProgram(program);
                            gl.viewport(0, 0, width, height);
                            gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
                            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, optTexture, 0);
                            // // Test for mobile bug MDN->WebGL_best_practices, bullet 7
                            // const frameBufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                            // if (!(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE)) {
                            //     throw new Error("turbojs: Error attaching float texture to framebuffer. " +
                            //         "Your device is probably incompatible. " +
                            //         "Error info: " + frameBufferStatus);
                            // }
                            gl.bindTexture(gl.TEXTURE_2D, iptTexture);
                            gl.activeTexture(gl.TEXTURE0);
                            gl.uniform1i(uTexture, 0);
                            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
                            gl.enableVertexAttribArray(aTexture);
                            gl.vertexAttribPointer(aTexture, 2, gl.FLOAT, false, 0, 0);
                            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                            gl.enableVertexAttribArray(aPosition);
                            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
                            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                        },
                        runOutput(iptTexture, data, optTexture, width, height) {
                            gl.useProgram(program);
                            gl.viewport(0, 0, width, height);
                            gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
                            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, optTexture, 0);
                            // Test for mobile bug MDN->WebGL_best_practices, bullet 7
                            const frameBufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                            if (!(gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE)) {
                                throw new Error("turbojs: Error attaching float texture to framebuffer. " +
                                    "Your device is probably incompatible. " +
                                    "Error info: " + frameBufferStatus);
                            }
                            gl.bindTexture(gl.TEXTURE_2D, iptTexture);
                            gl.activeTexture(gl.TEXTURE0);
                            gl.uniform1i(uTexture, 0);
                            gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
                            gl.enableVertexAttribArray(aTexture);
                            gl.vertexAttribPointer(aTexture, 2, gl.FLOAT, false, 0, 0);
                            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                            gl.enableVertexAttribArray(aPosition);
                            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
                            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                            gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);
                            //                                 ^ 4 x 32 bit ^
                        },
                    };
                }
            };
            exports_4("ForkTurboJs", ForkTurboJs);
        }
    };
});
System.register("paths", ["utils/ForkTurboJs"], function (exports_5, context_5) {
    var __moduleName = context_5 && context_5.id;
    function floodPaths3(resistanceMap, width, height, startX, startY, resistanceResource) {
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
    exports_5("floodPaths3", floodPaths3);
    function floodPaths2(resistanceMap, width, height, startX, startY, resistanceResource) {
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
        let updated;
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
                }
                else {
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
    exports_5("floodPaths2", floodPaths2);
    function floodPaths(resistanceMap, width, height, startX, startY, resistanceResource) {
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
    exports_5("floodPaths", floodPaths);
    function travelPaths(pathsMap, voltageMap, width, height, startX, startY, resistanceResource) {
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
                if (xMin > x) {
                    xMin = x;
                }
                if (xMax < x) {
                    xMax = x;
                }
                if (yMin > y) {
                    yMin = y;
                }
                if (yMax < y) {
                    yMax = y;
                }
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
                if (v < 0) {
                    v = 0;
                }
                travelMap[i] = v;
                if (v > max) {
                    max = v;
                }
                if (v < min) {
                    min = v;
                }
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
    exports_5("travelPaths", travelPaths);
    var ForkTurboJs_1, queue, gpu, floodPaths3Programs;
    return {
        setters: [
            function (ForkTurboJs_1_1) {
                ForkTurboJs_1 = ForkTurboJs_1_1;
            }
        ],
        execute: function () {
            queue = new Int32Array(3000000);
            gpu = new ForkTurboJs_1.ForkTurboJs();
            floodPaths3Programs = {};
        }
    };
});
System.register("World", ["BackgroundResistanceMap", "generateVoltageMap"], function (exports_6, context_6) {
    var __moduleName = context_6 && context_6.id;
    function createMap(width, height, fill) {
        return Array.from({ length: height }, () => {
            const arr = new Float64Array(width);
            if (fill !== 0) {
                arr.fill(fill);
            }
            return arr;
        });
    }
    var BackgroundResistanceMap_1, generateVoltageMap_1, Swap, StateMap, World;
    return {
        setters: [
            function (BackgroundResistanceMap_1_1) {
                BackgroundResistanceMap_1 = BackgroundResistanceMap_1_1;
            },
            function (generateVoltageMap_1_1) {
                generateVoltageMap_1 = generateVoltageMap_1_1;
            }
        ],
        execute: function () {
            Swap = class Swap {
                constructor(current, next) {
                    this.current = current;
                    this.next = next;
                }
                swap() {
                    const tmp = this.current;
                    this.current = this.next;
                    this.next = tmp;
                }
            };
            StateMap = class StateMap {
                constructor(width, height) {
                    this.floodMap = createMap(width, height, Infinity);
                    this.stopMap = createMap(width, height, 0);
                    this.floodBackMap = createMap(width, height, 0);
                    this.floodBackDecayMap = createMap(width, height, 0);
                    this.precessorMap = createMap(width, height, -1);
                    this.waveMap = createMap(width, height, 0);
                    this.ionizationFactorMap = createMap(width, height, 1);
                }
            };
            World = class World {
                constructor(width, height, start) {
                    this.width = width;
                    this.height = height;
                    this.start = start;
                    // floodPaths: {
                    //     sumMap: Float64Array,
                    //     precessorMap: Int32Array,
                    // };
                    // travelPaths: Float64Array;
                    this.t = -Infinity;
                    this.resistanceResource = 60;
                    this.area = width * height;
                    this.backgroundResistanceMap = new BackgroundResistanceMap_1.BackgroundResistanceMap(width, height);
                    this.voltageMap = generateVoltageMap_1.generateVoltageMap(width, height);
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
                                if (ne < this.resistanceResource) {
                                    stop++;
                                }
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
                                if (ne < this.resistanceResource) {
                                    stop++;
                                }
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
                                if (ne < this.resistanceResource) {
                                    stop++;
                                }
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
                                if (ne < this.resistanceResource) {
                                    stop++;
                                }
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
                                if (ne < this.resistanceResource) {
                                    stop++;
                                }
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
                                if (ne < this.resistanceResource) {
                                    stop++;
                                }
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
                                if (ne < this.resistanceResource) {
                                    stop++;
                                }
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
                                if (ne < this.resistanceResource) {
                                    stop++;
                                }
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
            };
            exports_6("World", World);
        }
    };
});
System.register("utils/imageData", [], function (exports_7, context_7) {
    var __moduleName = context_7 && context_7.id;
    function setPixelI(imageData, i, r, g, b, a = 1) {
        // tslint:disable-next-line:no-bitwise
        const offset = i << 2;
        imageData.data[offset + 0] = r;
        imageData.data[offset + 1] = g;
        imageData.data[offset + 2] = b;
        imageData.data[offset + 3] = a;
    }
    exports_7("setPixelI", setPixelI);
    function scaleNorm(v) {
        return Math.floor(v * almost256);
    }
    function setPixelNormI(imageData, i, r, g, b, a = 1) {
        setPixelI(imageData, i, scaleNorm(r), scaleNorm(g), scaleNorm(b), scaleNorm(a));
    }
    exports_7("setPixelNormI", setPixelNormI);
    function setPixelXY(imageData, x, y, r, g, b, a = 255) {
        setPixelI(imageData, y * imageData.width + x, r, g, b, a);
    }
    exports_7("setPixelXY", setPixelXY);
    function setPixelNormXY(imageData, x, y, r, g, b, a = 1) {
        setPixelNormI(imageData, y * imageData.width + x, r, g, b, a);
    }
    exports_7("setPixelNormXY", setPixelNormXY);
    var almost256;
    return {
        setters: [],
        execute: function () {
            almost256 = 256 - Number.MIN_VALUE;
        }
    };
});
System.register("Renderer", ["utils/imageData"], function (exports_8, context_8) {
    var __moduleName = context_8 && context_8.id;
    var imageData_1, Renderer;
    return {
        setters: [
            function (imageData_1_1) {
                imageData_1 = imageData_1_1;
            }
        ],
        execute: function () {
            Renderer = class Renderer {
                constructor(world) {
                    this.world = world;
                    this.lastIteration = Date.now();
                    this.canvas = document.getElementById("canvas");
                    this.canvas.style.width = `${this.world.width}px`;
                    this.canvas.style.height = `${this.world.height}px`;
                    this.canvas.width = this.canvas.clientWidth;
                    this.canvas.height = this.canvas.clientHeight;
                    this.ctx = this.canvas.getContext("2d");
                    this.ctx.imageSmoothingEnabled = false;
                    this.imageData = this.ctx.createImageData(this.world.width, this.world.height);
                    this.fpsLabel = document.getElementById("fps-label");
                    this.frameList = document.getElementById("frame-list");
                }
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
                                : 0, 1);
                            const r = rz[x];
                            const g = drawTpi;
                            const b = 0; // stop; // fzz < Infinity ? fzz / 50 : 1;
                            imageData_1.setPixelNormI(this.imageData, oy + x, r, g, b);
                        }
                    }
                    // setPixelXY(this.imageData, 150, 150, 255, 255, 255);
                    this.ctx.putImageData(this.imageData, 0, 0);
                }
            };
            exports_8("Renderer", Renderer);
        }
    };
});
System.register("Controller", ["World", "Renderer"], function (exports_9, context_9) {
    var __moduleName = context_9 && context_9.id;
    var World_1, Renderer_1, Controller;
    return {
        setters: [
            function (World_1_1) {
                World_1 = World_1_1;
            },
            function (Renderer_1_1) {
                Renderer_1 = Renderer_1_1;
            }
        ],
        execute: function () {
            Controller = class Controller {
                constructor() {
                    this.world = new World_1.World(400, 400, { x: 150, y: 150 });
                    this.renderer = new Renderer_1.Renderer(this.world);
                }
                iteration() {
                    this.world.update();
                    this.renderer.render();
                }
            };
            exports_9("Controller", Controller);
        }
    };
});
System.register("main", ["Controller", "gif.js"], function (exports_10, context_10) {
    var __moduleName = context_10 && context_10.id;
    var Controller_1, gif_js_1, controller, gif, gifCreate, gifStart, gifEnd, gifTakeEvery, stopRenderAfterGifEnd, gifI;
    return {
        setters: [
            function (Controller_1_1) {
                Controller_1 = Controller_1_1;
            },
            function (gif_js_1_1) {
                gif_js_1 = gif_js_1_1;
            }
        ],
        execute: function () {
            controller = new Controller_1.Controller();
            gif = new gif_js_1.default({
                workerScript: "gif.worker.min.js",
                width: controller.renderer.canvas.width,
                height: controller.renderer.canvas.height,
                workers: 4,
                quality: 10,
            });
            gif.on("finished", (blob) => {
                window.open(URL.createObjectURL(blob));
            });
            gifCreate = true;
            gifStart = 0;
            gifEnd = 300;
            gifTakeEvery = 2;
            stopRenderAfterGifEnd = true;
            gifI = 0;
            setInterval(() => {
                if (!gifCreate || !stopRenderAfterGifEnd || gifI < gifEnd) {
                    controller.iteration();
                }
                if (gifCreate) {
                    if (gifI === gifStart) {
                        console.log("gif started");
                    }
                    if (gifI >= gifStart && gifI < gifEnd) {
                        if ((gifI - gifStart) % gifTakeEvery === 0) {
                            gif.addFrame(controller.renderer.ctx, {
                                copy: true,
                                delay: 40,
                            });
                        }
                    }
                    if (gifI === gifEnd) {
                        console.log("gif ended");
                        gif.render();
                    }
                    gifI++;
                }
            }, 20);
        }
    };
});
System.register("utils/misc", [], function (exports_11, context_11) {
    var __moduleName = context_11 && context_11.id;
    function isVisible(elt) {
        const style = window.getComputedStyle(elt);
        return (style.width !== null && +style.width !== 0)
            && (style.height !== null && +style.height !== 0)
            && (style.opacity !== null && +style.opacity !== 0)
            && style.display !== "none"
            && style.visibility !== "hidden";
    }
    exports_11("isVisible", isVisible);
    function adjust(x, ...applyAdjustmentList) {
        for (const applyAdjustment of applyAdjustmentList) {
            applyAdjustment(x);
        }
        return x;
    }
    exports_11("adjust", adjust);
    function getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    exports_11("getRandomElement", getRandomElement);
    return {
        setters: [],
        execute: function () {
        }
    };
});
//# sourceMappingURL=app.js.map
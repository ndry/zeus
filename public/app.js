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
                    this.size = width * height;
                    this.noise = new Noise();
                    this.originalMap = new Float64Array(this.size);
                    this.fillMap(0);
                    this.map = new Float64Array(this.size);
                    this.normMap = new Float64Array(this.size);
                }
                fillMap(t) {
                    let min = Number.POSITIVE_INFINITY;
                    let max = Number.NEGATIVE_INFINITY;
                    for (let y = 0; y < this.height; y++) {
                        const oy = y * this.width;
                        for (let x = 0; x < this.width; x++) {
                            const i = oy + x;
                            const v = this.originalMap[i] = this.noise.getValue(x, y, t);
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
                        const oy = y * this.width;
                        for (let x = 0; x < this.width; x++) {
                            const i = oy + x;
                            const mapV = this.map[i] = this.originalMap[i] + this.random.nextFloat() * this.dynamicNoiseScale;
                            this.normMap[i] = (mapV - this.originalMapRange.min) / range;
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
            r: (height - 150),
            factor: 1 / 3,
        };
        const map = new Float64Array(width * height);
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (let y = 0; y < height; y++) {
            const oy = y * width;
            for (let x = 0; x < width; x++) {
                const i = oy + x;
                let v = 0;
                v += (y / height) * (y / height) * (y / height) * (y / height) * (y / height);
                const dx = x - sourceRadialGradientArgs.cx;
                const dy = y - sourceRadialGradientArgs.cy;
                const d = Math.sqrt(dx * dx + dy * dy);
                v -= (1 - Math.pow(d / sourceRadialGradientArgs.r, 2)) * sourceRadialGradientArgs.factor;
                map[i] = v;
                if (v > max) {
                    max = v;
                }
                if (v < min) {
                    min = v;
                }
            }
        }
        const range = max - min;
        for (let y = 0; y < height; y++) {
            const oy = y * width;
            for (let x = 0; x < width; x++) {
                const i = oy + x;
                map[i] = (map[i] - min) / range;
            }
        }
        return map;
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
System.register("World", ["BackgroundResistanceMap", "generateVoltageMap", "paths"], function (exports_6, context_6) {
    var __moduleName = context_6 && context_6.id;
    var BackgroundResistanceMap_1, generateVoltageMap_1, paths_1, World;
    return {
        setters: [
            function (BackgroundResistanceMap_1_1) {
                BackgroundResistanceMap_1 = BackgroundResistanceMap_1_1;
            },
            function (generateVoltageMap_1_1) {
                generateVoltageMap_1 = generateVoltageMap_1_1;
            },
            function (paths_1_1) {
                paths_1 = paths_1_1;
            }
        ],
        execute: function () {
            World = class World {
                constructor(width, height) {
                    this.width = width;
                    this.height = height;
                    this.t = -Infinity;
                    this.resistanceResource = 60;
                    this.area = width * height;
                    this.backgroundResistanceMap = new BackgroundResistanceMap_1.BackgroundResistanceMap(width, height);
                    this.voltageMap = generateVoltageMap_1.generateVoltageMap(width, height);
                    // const ionizedResistaceMap = map(backgroundResistanceMap, () => 1);
                }
                update() {
                    this.t = (this.t < 0) ? 0 : (this.t + 1);
                    this.backgroundResistanceMap.update(this.t);
                    this.floodPaths = paths_1.floodPaths(this.backgroundResistanceMap.normMap, this.width, this.height, 150, 150, this.resistanceResource);
                    this.travelPaths = paths_1.travelPaths(this.floodPaths, this.voltageMap, this.width, this.height, 150, 150, this.resistanceResource);
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
                        imageData_1.setPixelNormI(this.imageData, i, r, g, b);
                    }
                    // setPixelXY(this.imageData, 150, 150, 255, 255, 255);
                    this.ctx.putImageData(this.imageData, 0, 0);
                    // const aLink = document.createElement("a");
                    // aLink.download = `${this.world.t.toFixed(0)}.png`;
                    // aLink.href = this.canvas.toDataURL();
                    // aLink.innerText = `${this.world.t.toFixed(0)}.png`;
                    // this.frameList.appendChild(aLink);
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
                    this.world = new World_1.World(800, 900);
                    this.renderer = new Renderer_1.Renderer(this.world);
                }
                iteration() {
                    this.world.update();
                    this.renderer.render();
                }
                run() {
                    setInterval(() => this.iteration(), 20);
                }
            };
            exports_9("Controller", Controller);
        }
    };
});
System.register("main", ["Controller"], function (exports_10, context_10) {
    var __moduleName = context_10 && context_10.id;
    var Controller_1, controller;
    return {
        setters: [
            function (Controller_1_1) {
                Controller_1 = Controller_1_1;
            }
        ],
        execute: function () {
            controller = new Controller_1.Controller();
            controller.run();
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
// Based on turbo.js https://turbo.js.org/

// Mozilla reference init implementation
function initGLFromCanvas(canvas: HTMLCanvasElement) {
    const attr = {
        alpha: false,
        antialias: false,
    };

    // Try to grab the standard context. If it fails, fallback to experimental.
    const gl =
        canvas.getContext("webgl", attr) as WebGLRenderingContext
        || canvas.getContext("experimental-webgl", attr) as WebGLRenderingContext;

    // If we don't have a GL context, give up now
    if (!gl) {
        throw new Error("turbojs: Unable to initialize WebGL. Your browser may not support it.");
    }

    return gl;
}

export class ForkTurboJs {

    // GPU texture buffer from JS typed array
    newFloat32Buffer(data: number[], e: number = this.gl.ARRAY_BUFFER) {
        const gl = this.gl;

        const buf = gl.createBuffer();

        gl.bindBuffer(e, buf);
        gl.bufferData(e, new Float32Array(data), gl.STATIC_DRAW);

        return buf;
    }

    // GPU texture buffer from JS typed array
    newUint16Buffer(data: number[], e: number = this.gl.ARRAY_BUFFER) {
        const gl = this.gl;

        const buf = gl.createBuffer();

        gl.bindBuffer(e, buf);
        gl.bufferData(e, new Uint16Array(data), gl.STATIC_DRAW);

        return buf;
    }

    vertexShader: WebGLShader;
    positionBuffer: WebGLBuffer;
    textureBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;

    constructor(
        public gl: WebGLRenderingContext = initGLFromCanvas(document.createElement("canvas")),
    ) {
        // turbo.js requires a 32bit float vec4 texture. Some systems only provide 8bit/float
        // textures. A workaround is being created, but turbo.js shouldn't be used on those
        // systems anyway.
        if (!gl.getExtension("OES_texture_float")) {
            throw new Error("turbojs: Required texture format OES_texture_float not supported.");
        }

        this.positionBuffer = this.newFloat32Buffer([ -1, -1, 1, -1, 1, 1, -1, 1 ])!;
        this.textureBuffer  = this.newFloat32Buffer([  0,  0, 1,  0, 1, 1,  0, 1 ])!;
        this.indexBuffer    = this.newUint16Buffer([  1,  2, 0,  3, 0, 2 ], gl.ELEMENT_ARRAY_BUFFER)!;

        const vertexShaderCode = `
        attribute vec2 position;
        varying vec2 pos;
        attribute vec2 texture;

        void main(void) {
        pos = texture;
        gl_Position = vec4(position.xy, 0.0, 1.0);
        }
        `;

        this.vertexShader = gl.createShader(gl.VERTEX_SHADER)!;

        gl.shaderSource(this.vertexShader, vertexShaderCode);
        gl.compileShader(this.vertexShader);

        // This should not fail.
        if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
            throw new Error(
                "\nturbojs: Could not build internal vertex shader (fatal).\n" + "\n" +
                "INFO: >REPORT< THIS. That's our fault!\n" + "\n" +
                "--- CODE DUMP ---\n" + vertexShaderCode + "\n\n" +
                "--- ERROR LOG ---\n" + gl.getShaderInfoLog(this.vertexShader),
            );
        }

    }

    // Transfer data onto clamped texture and turn off any filtering
    writeTexture(data: Float32Array, width: number, height: number) {
        const gl = this.gl;

        const texture = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, data);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }

    createTexture(width: number, height: number) {
        const gl = this.gl;

        const texture = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }

    build(code: string) {
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
            run(iptTexture: WebGLTexture, optTexture: WebGLTexture, width: number, height: number) {
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

            runOutput(
                iptTexture: WebGLTexture, data: Float32Array, optTexture: WebGLTexture, width: number, height: number,
            ) {
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
}

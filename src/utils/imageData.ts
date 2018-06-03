export function setPixelI(
    imageData: ImageData,
    i: number,
    r: number, g: number, b: number, a: number = 1,
) {
    // tslint:disable-next-line:no-bitwise
    const offset = i << 2;
    imageData.data[offset + 0] = r;
    imageData.data[offset + 1] = g;
    imageData.data[offset + 2] = b;
    imageData.data[offset + 3] = a;
}

const almost256 = 256 - Number.MIN_VALUE;
function scaleNorm(v: number) {
    return Math.floor(v * almost256);
}

export function setPixelNormI(
    imageData: ImageData,
    i: number,
    r: number, g: number, b: number, a: number = 1,
) {
    setPixelI(imageData, i, scaleNorm(r), scaleNorm(g), scaleNorm(b), scaleNorm(a));
}

export function setPixelXY(
    imageData: ImageData,
    x: number, y: number,
    r: number, g: number, b: number, a: number = 255,
) {
    setPixelI(imageData, y * imageData.width + x, r, g, b, a);
}

export function setPixelNormXY(
    imageData: ImageData,
    x: number, y: number,
    r: number, g: number, b: number, a: number = 1,
) {
    setPixelNormI(imageData, y * imageData.width + x, r, g, b, a);
}

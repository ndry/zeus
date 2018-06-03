export function generateVoltageMap(
    width: number,
    height: number,
) {
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
            if (v > max) { max = v; }
            if (v < min) { min = v; }
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

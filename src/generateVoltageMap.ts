export function generateVoltageMap(
    width: number,
    height: number,
) {
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
            if (v > max) { max = v; }
            if (v < min) { min = v; }
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

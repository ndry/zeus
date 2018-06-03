export function isVisible(elt: Element): boolean {
    const style = window.getComputedStyle(elt);
    return (style.width !== null && +style.width !== 0)
        && (style.height !== null && +style.height !== 0)
        && (style.opacity !== null && +style.opacity !== 0)
        && style.display !== "none"
        && style.visibility !== "hidden";
}

export function adjust<T>(
    x: T,
    ...applyAdjustmentList: Array<((x: T) => void)>,
): T {
    for (const applyAdjustment of applyAdjustmentList) {
        applyAdjustment(x);
    }
    return x;
}

export function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

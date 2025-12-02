export function scaleFont(size: number, fontScale: number) {
    if (fontScale === 1) {
        return size;
    }
    return Math.round(size * fontScale * 100) / 100;
}

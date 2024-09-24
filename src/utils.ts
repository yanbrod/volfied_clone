export function getGridIndex(x: number, y: number, gridWidth: number): number {
    return y * gridWidth + x;
}
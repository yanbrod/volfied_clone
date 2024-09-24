export class Enemy {
    public pos: { x: number; y: number };
    public dir: { x: number; y: number };

    constructor(x: number, y: number) {
        this.pos = { x, y };
        this.dir = {
            x: Math.random() < 0.5 ? -1 : 1,
            y: Math.random() < 0.5 ? -1 : 1,
        };
    }

    move(gridWidth: number, gridHeight: number, grid: Uint8Array) {
        let ex = this.pos.x;
        let ey = this.pos.y;
        let edx = this.dir.x;
        let edy = this.dir.y;

        // Randomly change direction
        if (Math.random() < 0.1) {
            edx = Math.floor(Math.random() * 3) - 1;
            edy = Math.floor(Math.random() * 3) - 1;
            if (edx === 0 && edy === 0) {
                edx = 1;
            }
            this.dir.x = edx;
            this.dir.y = edy;
        }

        const newEx = ex + edx;
        const newEy = ey + edy;

        // Avoid claimed areas
        if (
            newEx < 0 ||
            newEx >= gridWidth ||
            newEy < 0 ||
            newEy >= gridHeight ||
            grid[newEy * gridWidth + newEx] === 1
        ) {
            // Change direction
            edx = Math.floor(Math.random() * 3) - 1;
            edy = Math.floor(Math.random() * 3) - 1;
            if (edx === 0 && edy === 0) {
                edx = 1;
            }
            this.dir.x = edx;
            this.dir.y = edy;
        } else {
            this.pos.x = newEx;
            this.pos.y = newEy;
        }
    }
}

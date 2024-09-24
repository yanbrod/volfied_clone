import { GRID_SIZE } from './const';
import { Grid } from './grid';
import { Player } from './player';
import { Enemy } from './enemy';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private grid: Grid;
    private player: Player;
    private enemies: Enemy[];

    constructor(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        grid: Grid,
        player: Player,
        enemies: Enemy[]
    ) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.grid = grid;
        this.player = player;
        this.enemies = enemies;
    }

    draw(claimedPercentage: number, lives: number, trail: { x: number; y: number }[]) {
        const WIDTH = this.canvas.width;
        const HEIGHT = this.canvas.height;
        const GRID_WIDTH = this.grid.gridWidth;
        const GRID_HEIGHT = this.grid.gridHeight;

        // Clear canvas
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Update grid image data
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = WIDTH;
        gridCanvas.height = HEIGHT;
        const gridCtx = gridCanvas.getContext('2d')!;
        const gridImageData = gridCtx.createImageData(WIDTH, HEIGHT);
        const gridData = gridImageData.data;

        const claimedColor = { r: 0, g: 0, b: 255, a: 255 }; // Blue
        const gridLength = this.grid.grid.length;
        // Clear gridData first
        gridData.fill(0);

        for (let i = 0; i < gridLength; i++) {
            if (this.grid.grid[i] === 1) {
                const x = (i % GRID_WIDTH) * GRID_SIZE;
                const y = Math.floor(i / GRID_WIDTH) * GRID_SIZE;
                for (let dx = 0; dx < GRID_SIZE; dx++) {
                    for (let dy = 0; dy < GRID_SIZE; dy++) {
                        const px = x + dx;
                        const py = y + dy;
                        const pixelIndex = (py * WIDTH + px) * 4;
                        gridData[pixelIndex] = claimedColor.r;
                        gridData[pixelIndex + 1] = claimedColor.g;
                        gridData[pixelIndex + 2] = claimedColor.b;
                        gridData[pixelIndex + 3] = claimedColor.a;
                    }
                }
            }
        }
        // Put image data onto off-screen canvas
        gridCtx.putImageData(gridImageData, 0, 0);

        // Draw off-screen canvas onto main canvas
        this.ctx.drawImage(gridCanvas, 0, 0);

        // Draw the trail
        if (trail.length > 0) {
            this.ctx.strokeStyle = '#00FF00'; // Green
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(trail[0].x, trail[0].y);
            for (let i = 1; i < trail.length; i++) {
                this.ctx.lineTo(trail[i].x, trail[i].y);
            }
            this.ctx.lineTo(this.player.position.x, this.player.position.y);
            this.ctx.stroke();
        }

        // Draw player
        this.ctx.fillStyle = '#FFFFFF'; // White
        this.ctx.fillRect(this.player.position.x, this.player.position.y, GRID_SIZE, GRID_SIZE);

        // Draw enemies
        for (const enemy of this.enemies) {
            this.ctx.fillStyle = '#FF0000'; // Red
            this.ctx.fillRect(enemy.pos.x * GRID_SIZE, enemy.pos.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }

        // Display lives and claimed percentage
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${24 * (WIDTH / 500)}px Arial`;
        this.ctx.fillText(`Lives: ${lives}`, 10, 30 * (HEIGHT / 500));
        this.ctx.fillText(`Claimed: ${claimedPercentage.toFixed(1)}%`, 10, 60 * (HEIGHT / 500));
    }
}

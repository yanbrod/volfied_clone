import { GRID_SIZE } from './const';

export class Player {
    public position!: { x: number; y: number; };
    public speed: number = GRID_SIZE;
    public trail: { x: number; y: number }[] = [];
    public drawing: boolean = false;
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.resetPosition();
    }

    resetPosition() {
        this.position = {
            x: Math.floor(this.canvasWidth / 2 / GRID_SIZE) * GRID_SIZE,
            y: this.canvasHeight - GRID_SIZE,
        };
        this.trail = [];
        this.drawing = false;
    }

    move(direction: { x: number; y: number }) {
        this.position.x += direction.x * this.speed;
        this.position.y += direction.y * this.speed;
    }
}

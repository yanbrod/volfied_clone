// Game.ts
import { GRID_SIZE } from './const';
import { InputHandler } from './input';
import { Player } from './player';
import { Enemy } from './enemy';
import { Grid } from './grid';
import { Renderer } from './renderer';
import { getGridIndex } from './utils';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private inputHandler: InputHandler;
    private player: Player;
    private enemies!: Enemy[];
    private grid: Grid;
    private renderer: Renderer;
    private lives: number = 3;
    private gameWon: boolean = false;
    private lastTimestamp: number = 0;
    private desiredFPS: number = 30;
    private frameDuration: number = 1000 / this.desiredFPS;
    private prevGridIndex: number;
    private trail: { x: number; y: number }[] = [];
    private drawing: boolean = false;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.inputHandler = new InputHandler();
        this.player = new Player(this.canvas.width, this.canvas.height);
        this.grid = new Grid(
            Math.floor(this.canvas.width / GRID_SIZE),
            Math.floor(this.canvas.height / GRID_SIZE)
        );
        this.initializeEnemies();
        this.renderer = new Renderer(this.canvas, this.ctx, this.grid, this.player, this.enemies);
        this.prevGridIndex = getGridIndex(
            Math.floor(this.player.position.x / GRID_SIZE),
            Math.floor(this.player.position.y / GRID_SIZE),
            this.grid.gridWidth
        );
        this.gameLoop = this.gameLoop.bind(this);
    }

    initializeEnemies() {
        this.enemies = [];
        for (let i = 0; i < 3; i++) {
            this.enemies.push(
                new Enemy(
                    Math.floor(Math.random() * (this.grid.gridWidth - 2)) + 1,
                    Math.floor(Math.random() * (this.grid.gridHeight - 2)) + 1
                )
            );
        }
    }

    start() {
        requestAnimationFrame(this.gameLoop);
    }

    gameLoop(timestamp: number) {
        if (timestamp - this.lastTimestamp >= this.frameDuration) {
            this.lastTimestamp = timestamp;
            this.update();
            const claimedPercentage = this.grid.calculateClaimedPercentage();
            this.renderer.draw(claimedPercentage, this.lives, this.trail);
        }
        if (this.lives > 0 && !this.gameWon) {
            requestAnimationFrame(this.gameLoop);
        } else if (this.gameWon) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.fillText('You Win!', this.canvas.width / 2 - 100, this.canvas.height / 2);
        } else {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.fillText('Game Over', this.canvas.width / 2 - 100, this.canvas.height / 2);
        }
    }

    update() {
        const keysPressed = this.inputHandler.keysPressed;
        let moveX = 0;
        let moveY = 0;

        if (keysPressed.LEFT) {
            moveX = -1;
        }
        if (keysPressed.RIGHT) {
            moveX = 1;
        }
        if (keysPressed.UP) {
            moveY = -1;
        }
        if (keysPressed.DOWN) {
            moveY = 1;
        }

        if (moveX !== 0 || moveY !== 0) {
            if (moveX !== 0 && moveY !== 0) {
                moveY = 0;
            }
            const newPos = {
                x: this.player.position.x + moveX * this.player.speed,
                y: this.player.position.y + moveY * this.player.speed,
            };

            const gridX = Math.floor(newPos.x / GRID_SIZE);
            const gridY = Math.floor(newPos.y / GRID_SIZE);
            const gridIndex = getGridIndex(gridX, gridY, this.grid.gridWidth);
            const prevGridValue = this.grid.grid[this.prevGridIndex];

            if (
                gridX >= 0 &&
                gridX < this.grid.gridWidth &&
                gridY >= 0 &&
                gridY < this.grid.gridHeight
            ) {
                const currentGridValue = this.grid.grid[gridIndex];

                if (currentGridValue === 1) {
                    if (this.drawing) {
                        this.drawing = false;
                        this.enemies = this.grid.performFloodFill(this.trail, this.enemies);
                        this.trail = [];

                        const claimedPercentage = this.grid.calculateClaimedPercentage();
                        if (claimedPercentage >= 75) {
                            this.gameWon = true;
                        }
                    }
                    this.player.position = newPos;
                } else {
                    if (!this.drawing && prevGridValue === 1) {
                        this.drawing = true;
                        this.trail = [{ x: this.player.position.x, y: this.player.position.y }];
                    }
                    this.player.position = newPos;
                    if (this.drawing) {
                        this.trail.push({ x: this.player.position.x, y: this.player.position.y });
                    }
                }
                this.prevGridIndex = gridIndex;
            }
        }

        // Move enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.move(this.grid.gridWidth, this.grid.gridHeight, this.grid.grid);

            // Check collision with player
            const playerGridX = Math.floor(this.player.position.x / GRID_SIZE);
            const playerGridY = Math.floor(this.player.position.y / GRID_SIZE);
            if (enemy.pos.x === playerGridX && enemy.pos.y === playerGridY) {
                this.loseLife();
            }

            // Check collision with trail
            if (this.drawing) {
                for (const pos of this.trail) {
                    const tx = Math.floor(pos.x / GRID_SIZE);
                    const ty = Math.floor(pos.y / GRID_SIZE);
                    if (enemy.pos.x === tx && enemy.pos.y === ty) {
                        this.loseLife();
                        break;
                    }
                }
            }
        }
    }

    loseLife() {
        this.lives -= 1;
        this.player.resetPosition();
        this.drawing = false;
        this.trail = [];
        this.inputHandler.keysPressed.LEFT = false;
        this.inputHandler.keysPressed.RIGHT = false;
        this.inputHandler.keysPressed.UP = false;
        this.inputHandler.keysPressed.DOWN = false;
        this.prevGridIndex = getGridIndex(
            Math.floor(this.player.position.x / GRID_SIZE),
            Math.floor(this.player.position.y / GRID_SIZE),
            this.grid.gridWidth
        );
    }
}

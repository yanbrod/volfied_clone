import { GRID_SIZE } from './const';
import { getGridIndex } from './utils';
import { Enemy } from './enemy';

export class Grid {
    public grid: Uint8Array;
    public gridWidth: number;
    public gridHeight: number;

    constructor(gridWidth: number, gridHeight: number) {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.grid = new Uint8Array(this.gridWidth * this.gridHeight);
        this.initializeBorders();
    }

    initializeBorders() {
        for (let x = 0; x < this.gridWidth; x++) {
            this.grid[getGridIndex(x, 0, this.gridWidth)] = 1;
            this.grid[getGridIndex(x, this.gridHeight - 1, this.gridWidth)] = 1;
        }
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[getGridIndex(0, y, this.gridWidth)] = 1;
            this.grid[getGridIndex(this.gridWidth - 1, y, this.gridWidth)] = 1;
        }
    }

    performFloodFill(trail: { x: number; y: number }[], enemies: Enemy[]) {
        // Implement the flood-fill algorithm
        // Mark trail cells as claimed
        for (const pos of trail) {
            const tx = Math.floor(pos.x / GRID_SIZE);
            const ty = Math.floor(pos.y / GRID_SIZE);
            this.grid[getGridIndex(tx, ty, this.gridWidth)] = 1; // Mark trail cells as claimed
        }

        // Create a visited array
        const visited = new Uint8Array(this.grid.length);

        const stack: { x: number; y: number }[] = [];
        const adjacentOffsets = [
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
        ];

        // Flood-fill from enemies' positions and borders
        const addToStackIfUnvisited = (x: number, y: number) => {
            const index = getGridIndex(x, y, this.gridWidth);
            if (this.grid[index] === 0 && visited[index] === 0) {
                stack.push({ x, y });
                visited[index] = 1;
            }
        };

        // Flood-fill from the borders
        for (let x = 0; x < this.gridWidth; x++) {
            addToStackIfUnvisited(x, 0);
            addToStackIfUnvisited(x, this.gridHeight - 1);
        }
        for (let y = 0; y < this.gridHeight; y++) {
            addToStackIfUnvisited(0, y);
            addToStackIfUnvisited(this.gridWidth - 1, y);
        }

        // Flood-fill from enemies' positions
        for (const enemy of enemies) {
            addToStackIfUnvisited(enemy.pos.x, enemy.pos.y);
        }

        // Flood-fill to mark unclaimed cells reachable from borders or enemies
        while (stack.length > 0) {
            const { x, y } = stack.pop()!;
            const index = getGridIndex(x, y, this.gridWidth);
            this.grid[index] = 2; // Temporarily mark as reachable
            for (const offset of adjacentOffsets) {
                const nx = x + offset.dx;
                const ny = y + offset.dy;
                if (
                    nx >= 0 &&
                    nx < this.gridWidth &&
                    ny >= 0 &&
                    ny < this.gridHeight
                ) {
                    addToStackIfUnvisited(nx, ny);
                }
            }
        }

        // Any unclaimed cells not marked as reachable are enclosed by the trail and should be claimed
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] === 0) {
                this.grid[i] = 1; // Mark as claimed
            } else if (this.grid[i] === 2) {
                this.grid[i] = 0; // Reset reachable cells back to unclaimed
            }
        }

        // Remove enemies inside claimed areas
        enemies = enemies.filter(enemy => {
            const index = getGridIndex(enemy.pos.x, enemy.pos.y, this.gridWidth);
            return this.grid[index] !== 1;
        });

        return enemies;
    }

    calculateClaimedPercentage(): number {
        const totalCells = this.gridWidth * this.gridHeight;
        let claimedCells = 0;
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] === 1) {
                claimedCells++;
            }
        }
        const initialClaimedCells = this.gridWidth * 2 + (this.gridHeight - 2) * 2;
        const claimableCells = totalCells - initialClaimedCells;
        const claimedArea = claimedCells - initialClaimedCells;
        const claimedPercentage = (claimedArea / claimableCells) * 100;
        return claimedPercentage;
    }
}

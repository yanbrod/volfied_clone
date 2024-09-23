// main.ts
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRID_SIZE = 4;
const GRID_WIDTH = WIDTH / GRID_SIZE;
const GRID_HEIGHT = HEIGHT / GRID_SIZE;

// Game variables
let playerPos = { x: WIDTH / 2, y: HEIGHT - GRID_SIZE };
const playerSpeed = GRID_SIZE;
let trail: { x: number; y: number }[] = [];
let drawing = false;
let lives = 3;
let gameWon = false;

// Direction flags
const keysPressed: { [key: string]: boolean } = {
    LEFT: false,
    RIGHT: false,
    UP: false,
    DOWN: false,
};

// Grid representation using Uint8Array
// 0: unclaimed, 1: claimed
const grid = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);

// Helper function for grid indexing
function getGridIndex(x: number, y: number): number {
    return y * GRID_WIDTH + x;
}

// Initially, the borders are claimed
for (let x = 0; x < GRID_WIDTH; x++) {
    grid[getGridIndex(x, 0)] = 1;
    grid[getGridIndex(x, GRID_HEIGHT - 1)] = 1;
}
for (let y = 0; y < GRID_HEIGHT; y++) {
    grid[getGridIndex(0, y)] = 1;
    grid[getGridIndex(GRID_WIDTH - 1, y)] = 1;
}

// Enemies
interface Enemy {
    pos: { x: number; y: number };
    dir: { x: number; y: number };
}
let enemies: Enemy[] = [];
for (let i = 0; i < 3; i++) {
    enemies.push({
        pos: {
            x: Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1,
            y: Math.floor(Math.random() * (GRID_HEIGHT - 2)) + 1,
        },
        dir: {
            x: Math.random() < 0.5 ? -1 : 1,
            y: Math.random() < 0.5 ? -1 : 1,
        },
    });
}

// Input handling
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        keysPressed.LEFT = true;
    } else if (event.key === 'ArrowRight') {
        keysPressed.RIGHT = true;
    } else if (event.key === 'ArrowUp') {
        keysPressed.UP = true;
    } else if (event.key === 'ArrowDown') {
        keysPressed.DOWN = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') {
        keysPressed.LEFT = false;
    } else if (event.key === 'ArrowRight') {
        keysPressed.RIGHT = false;
    } else if (event.key === 'ArrowUp') {
        keysPressed.UP = false;
    } else if (event.key === 'ArrowDown') {
        keysPressed.DOWN = false;
    }
});

// Off-screen canvas for rendering grid
const gridCanvas = document.createElement('canvas');
gridCanvas.width = WIDTH;
gridCanvas.height = HEIGHT;
const gridCtx = gridCanvas.getContext('2d')!;
const gridImageData = gridCtx.createImageData(WIDTH, HEIGHT);
const gridData = gridImageData.data;

// Game loop control
let lastTimestamp = 0;
const desiredFPS = 30;
const frameDuration = 1000 / desiredFPS;

// Track previous grid position
let prevGridIndex = getGridIndex(Math.floor(playerPos.x / GRID_SIZE), Math.floor(playerPos.y / GRID_SIZE));

function gameLoop(timestamp: number) {
    if (timestamp - lastTimestamp >= frameDuration) {
        lastTimestamp = timestamp;
        update();
        draw();
    }
    if (lives > 0 && !gameWon) {
        requestAnimationFrame(gameLoop);
    } else if (gameWon) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '48px Arial';
        ctx.fillText('You Win!', WIDTH / 2 - 100, HEIGHT / 2);
    } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over', WIDTH / 2 - 100, HEIGHT / 2);
    }
}

function update() {
    // Update player position
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
        // Ensure only one direction is active at a time
        if (moveX !== 0 && moveY !== 0) {
            // Prioritize horizontal movement
            moveY = 0;
        }
        const newPos = {
            x: playerPos.x + moveX * playerSpeed,
            y: playerPos.y + moveY * playerSpeed,
        };

        // Check grid boundaries
        const gridX = Math.floor(newPos.x / GRID_SIZE);
        const gridY = Math.floor(newPos.y / GRID_SIZE);
        const gridIndex = getGridIndex(gridX, gridY);
        const prevGridValue = grid[prevGridIndex];

        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
            const currentGridValue = grid[gridIndex];

            if (currentGridValue === 1) {
                // Player is in claimed territory
                if (drawing) {
                    // Close the trail
                    drawing = false;
                    // Perform flood fill
                    performFloodFill();

                    trail = [];

                    // Check for win condition
                    const claimedPercentage = calculateClaimedPercentage();
                    if (claimedPercentage >= 75) {
                        gameWon = true;
                    }
                }
                playerPos = newPos;
                // Do not add to trail
            } else {
                // Player is in unclaimed territory
                if (!drawing && prevGridValue === 1) {
                    // Only start drawing when moving from claimed to unclaimed territory
                    drawing = true;
                    // Start new trail
                    trail = [{ x: playerPos.x, y: playerPos.y }];
                }
                playerPos = newPos;
                if (drawing) {
                    trail.push({ x: playerPos.x, y: playerPos.y });
                }
            }
            // Update prevGridIndex
            prevGridIndex = gridIndex;
        }
    }

    // Move enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        let ex = enemy.pos.x;
        let ey = enemy.pos.y;
        let edx = enemy.dir.x;
        let edy = enemy.dir.y;

        // Randomly change direction
        if (Math.random() < 0.1) {
            edx = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            edy = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            if (edx === 0 && edy === 0) {
                edx = 1; // Ensure the enemy moves
            }
            enemy.dir.x = edx;
            enemy.dir.y = edy;
        }

        const newEx = ex + edx;
        const newEy = ey + edy;

        const enemyIndex = getGridIndex(newEx, newEy);

        // Avoid claimed areas
        if (
            newEx < 0 ||
            newEx >= GRID_WIDTH ||
            newEy < 0 ||
            newEy >= GRID_HEIGHT ||
            grid[enemyIndex] === 1
        ) {
            // Change direction
            edx = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            edy = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            if (edx === 0 && edy === 0) {
                edx = 1; // Ensure the enemy moves
            }
            enemy.dir.x = edx;
            enemy.dir.y = edy;
        } else {
            enemy.pos.x = newEx;
            enemy.pos.y = newEy;
        }

        // Check collision with player
        const playerGridX = Math.floor(playerPos.x / GRID_SIZE);
        const playerGridY = Math.floor(playerPos.y / GRID_SIZE);
        if (enemy.pos.x === playerGridX && enemy.pos.y === playerGridY) {
            loseLife();
        }

        // Check collision with trail
        if (drawing) {
            for (const pos of trail) {
                const tx = Math.floor(pos.x / GRID_SIZE);
                const ty = Math.floor(pos.y / GRID_SIZE);
                if (enemy.pos.x === tx && enemy.pos.y === ty) {
                    loseLife();
                    break;
                }
            }
        }
    }
}

function performFloodFill() {
    // Mark trail cells as claimed
    for (const pos of trail) {
        const tx = Math.floor(pos.x / GRID_SIZE);
        const ty = Math.floor(pos.y / GRID_SIZE);
        grid[getGridIndex(tx, ty)] = 1; // Mark trail cells as claimed
    }

    // Create a visited array
    const visited = new Uint8Array(grid.length);

    const stack: { x: number; y: number }[] = [];
    const adjacentOffsets = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
    ];

    // Flood-fill from enemies' positions and borders
    function addToStackIfUnvisited(x: number, y: number) {
        const index = getGridIndex(x, y);
        if (grid[index] === 0 && visited[index] === 0) {
            stack.push({ x, y });
            visited[index] = 1;
        }
    }

    // Flood-fill from the borders
    for (let x = 0; x < GRID_WIDTH; x++) {
        addToStackIfUnvisited(x, 0);
        addToStackIfUnvisited(x, GRID_HEIGHT - 1);
    }
    for (let y = 0; y < GRID_HEIGHT; y++) {
        addToStackIfUnvisited(0, y);
        addToStackIfUnvisited(GRID_WIDTH - 1, y);
    }

    // Flood-fill from enemies' positions
    for (const enemy of enemies) {
        addToStackIfUnvisited(enemy.pos.x, enemy.pos.y);
    }

    // Flood-fill to mark unclaimed cells reachable from borders or enemies
    while (stack.length > 0) {
        const { x, y } = stack.pop()!;
        const index = getGridIndex(x, y);
        grid[index] = 2; // Temporarily mark as reachable
        for (const offset of adjacentOffsets) {
            const nx = x + offset.dx;
            const ny = y + offset.dy;
            if (
                nx >= 0 &&
                nx < GRID_WIDTH &&
                ny >= 0 &&
                ny < GRID_HEIGHT
            ) {
                addToStackIfUnvisited(nx, ny);
            }
        }
    }

    // Any unclaimed cells not marked as reachable are enclosed by the trail and should be claimed
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] === 0) {
            grid[i] = 1; // Mark as claimed
        } else if (grid[i] === 2) {
            grid[i] = 0; // Reset reachable cells back to unclaimed
        }
    }

    // Remove enemies inside claimed areas
    enemies = enemies.filter(enemy => {
        const index = getGridIndex(enemy.pos.x, enemy.pos.y);
        return grid[index] !== 1;
    });
}

function calculateClaimedPercentage(): number {
    const totalCells = GRID_WIDTH * GRID_HEIGHT;
    let claimedCells = 0;
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] === 1) {
            claimedCells++;
        }
    }
    const initialClaimedCells = GRID_WIDTH * 2 + (GRID_HEIGHT - 2) * 2;
    const claimableCells = totalCells - initialClaimedCells;
    const claimedArea = claimedCells - initialClaimedCells;
    const claimedPercentage = (claimedArea / claimableCells) * 100;
    return claimedPercentage;
}

function loseLife() {
    lives -= 1;
    playerPos = { x: WIDTH / 2, y: HEIGHT - GRID_SIZE };
    drawing = false;
    trail = [];
    // Reset keys pressed
    keysPressed.LEFT = false;
    keysPressed.RIGHT = false;
    keysPressed.UP = false;
    keysPressed.DOWN = false;
    if (lives === 0) {
        console.log('Game Over');
    }
    // Reset prevGridIndex
    prevGridIndex = getGridIndex(Math.floor(playerPos.x / GRID_SIZE), Math.floor(playerPos.y / GRID_SIZE));
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Update grid image data
    const claimedColor = { r: 0, g: 0, b: 255, a: 255 }; // Blue
    const gridLength = grid.length;
    // Clear gridData first
    gridData.fill(0);

    for (let i = 0; i < gridLength; i++) {
        if (grid[i] === 1) {
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
    ctx.drawImage(gridCanvas, 0, 0);

    // Draw the trail
    if (trail.length > 0) {
        ctx.strokeStyle = '#00FF00'; // Green
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.lineTo(playerPos.x, playerPos.y);
        ctx.stroke();
    }

    // Draw player
    ctx.fillStyle = '#FFFFFF'; // White
    ctx.fillRect(playerPos.x, playerPos.y, GRID_SIZE, GRID_SIZE);

    // Draw enemies
    for (const enemy of enemies) {
        ctx.fillStyle = '#FF0000'; // Red
        ctx.fillRect(enemy.pos.x * GRID_SIZE, enemy.pos.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }

    // Display lives and claimed percentage
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText(`Lives: ${lives}`, 10, 30);
    const claimedPercentage = calculateClaimedPercentage();
    ctx.fillText(`Claimed: ${claimedPercentage.toFixed(1)}%`, 10, 60);
}

requestAnimationFrame(gameLoop);

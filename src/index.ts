import { Game } from './game';

// Get references to canvas and context
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let game: Game;

function startGame() {
    game = new Game(canvas, ctx);
    game.start();
}

// Set canvas size based on its display size
function resizeCanvas() {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    // Restart the game with new dimensions
    startGame();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

startGame();

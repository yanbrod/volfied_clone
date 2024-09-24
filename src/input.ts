export class InputHandler {
    public keysPressed: { [key: string]: boolean } = {
        LEFT: false,
        RIGHT: false,
        UP: false,
        DOWN: false,
    };

    constructor() {
        // Input handling for keyboard
        document.addEventListener('keydown', this.keyDownHandler.bind(this));
        document.addEventListener('keyup', this.keyUpHandler.bind(this));
        // Input handling for mobile controls
        this.setupMobileControls();
    }

    private keyDownHandler(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') {
            this.keysPressed.LEFT = true;
        } else if (event.key === 'ArrowRight') {
            this.keysPressed.RIGHT = true;
        } else if (event.key === 'ArrowUp') {
            this.keysPressed.UP = true;
        } else if (event.key === 'ArrowDown') {
            this.keysPressed.DOWN = true;
        }
    }

    private keyUpHandler(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') {
            this.keysPressed.LEFT = false;
        } else if (event.key === 'ArrowRight') {
            this.keysPressed.RIGHT = false;
        } else if (event.key === 'ArrowUp') {
            this.keysPressed.UP = false;
        } else if (event.key === 'ArrowDown') {
            this.keysPressed.DOWN = false;
        }
    }

    private setupMobileControls() {
        const leftButton = document.getElementById('leftButton')!;
        const rightButton = document.getElementById('rightButton')!;
        const upButton = document.getElementById('upButton')!;
        const downButton = document.getElementById('downButton')!;

        leftButton.addEventListener('touchstart', () => {
            this.keysPressed.LEFT = true;
        });
        leftButton.addEventListener('touchend', () => {
            this.keysPressed.LEFT = false;
        });

        rightButton.addEventListener('touchstart', () => {
            this.keysPressed.RIGHT = true;
        });
        rightButton.addEventListener('touchend', () => {
            this.keysPressed.RIGHT = false;
        });

        upButton.addEventListener('touchstart', () => {
            this.keysPressed.UP = true;
        });
        upButton.addEventListener('touchend', () => {
            this.keysPressed.UP = false;
        });

        downButton.addEventListener('touchstart', () => {
            this.keysPressed.DOWN = true;
        });
        downButton.addEventListener('touchend', () => {
            this.keysPressed.DOWN = false;
        });

        // Prevent touch events from causing scrolling
        [leftButton, rightButton, upButton, downButton].forEach((button) => {
            button.addEventListener('touchstart', (e) => e.preventDefault());
            button.addEventListener('touchend', (e) => e.preventDefault());
        });
    }
}
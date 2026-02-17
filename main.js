import Phaser from 'phaser';

const TILE_WIDTH = 128;
const TILE_HEIGHT = 64;
const TILE_WIDTH_HALF = TILE_WIDTH / 2;
const TILE_HEIGHT_HALF = TILE_HEIGHT / 2;

const MAP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 2, 2, 2, 1, 1, 1, 1, 0],
    [0, 1, 2, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 2, 2, 2, 1, 0],
    [0, 1, 1, 1, 1, 2, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 2, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const START_POS = { x: 1, y: 1 };
const START_DIR = 0;

const DIRECTIONS = [
    { x: 1, y: 0 }, // East
    { x: 0, y: 1 }, // South
    { x: -1, y: 0 }, // West
    { x: 0, y: -1 }  // North
];

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.timeline = [];
        this.isStarted = false;
        this.isExecuting = false;
        this.characterPos = { ...START_POS };
        this.characterDir = START_DIR;
    }

    preload() {
        this.load.image('floor', 'assets/PNG/Voxel tiles/voxelTile_05.png');
        this.load.image('wall', 'assets/PNG/Voxel tiles/voxelTile_01.png');
        this.load.image('character', 'assets/character/ghost.png');
    }

    create() {
        this.mapGroup = this.add.group();
        this.renderMap();

        this.character = this.add.sprite(0, 0, 'character');
        this.character.setOrigin(0.5, 1);
        this.character.setScale(1.0);
        this.updateCharacterSpritePos();

        window.setTimeline = (timeline) => {
            this.timeline = timeline;
        };

        window.onStartGame = () => {
            if (this.isExecuting) return;
            this.executeTimeline();
        };

        window.onResetGame = () => {
            this.reset();
        };

        window.gameInstance = this;
    }

    renderMap() {
        this.mapGroup.clear(true, true);
        for (let y = 0; y < MAP.length; y++) {
            for (let x = 0; x < MAP[y].length; x++) {
                const tileType = MAP[y][x];
                if (tileType === 0) continue;

                const screenPos = this.gridToScreen(x, y);
                let texture = 'floor';
                let offsetY = 0;
                if (tileType === 2) {
                    texture = 'wall';
                    offsetY = -40;
                }
                const tile = this.add.image(screenPos.x, screenPos.y + offsetY, texture);
                tile.setDepth(screenPos.y);
                this.mapGroup.add(tile);
            }
        }
    }

    gridToScreen(x, y) {
        return {
            x: (x - y) * TILE_WIDTH_HALF + (this.cameras.main.width / 2),
            y: (x + y) * TILE_HEIGHT_HALF + 150
        };
    }

    updateCharacterSpritePos() {
        const screenPos = this.gridToScreen(this.characterPos.x, this.characterPos.y);
        // Position character slightly above the tile center
        this.character.setPosition(screenPos.x, screenPos.y);
        this.character.setDepth(screenPos.y + 10);
    }

    async executeTimeline() {
        this.isExecuting = true;
        this.isStarted = true;
        document.getElementById('start-btn').disabled = true;

        for (const action of this.timeline) {
            if (!this.isStarted) break;
            await this.performAction(action);
            if (this.checkDeath()) {
                await this.die();
                break;
            }
        }

        this.isExecuting = false;
        document.getElementById('start-btn').disabled = false;
    }

    async performAction(action) {
        return new Promise((resolve) => {
            if (action === 'walk') {
                this.walkOneStep(resolve);
            } else if (action === 'left') {
                this.characterDir = (this.characterDir + 3) % 4;
                this.time.delayedCall(300, resolve);
            } else if (action === 'right') {
                this.characterDir = (this.characterDir + 1) % 4;
                this.time.delayedCall(300, resolve);
            } else {
                resolve();
            }
        });
    }

    walkOneStep(callback) {
        let nextDir = this.characterDir;
        let nextX = this.characterPos.x + DIRECTIONS[nextDir].x;
        let nextY = this.characterPos.y + DIRECTIONS[nextDir].y;

        if (this.getTile(nextX, nextY) === 2) {
            for (let i = 0; i < 3; i++) {
                nextDir = (nextDir + 1) % 4;
                nextX = this.characterPos.x + DIRECTIONS[nextDir].x;
                nextY = this.characterPos.y + DIRECTIONS[nextDir].y;
                if (this.getTile(nextX, nextY) !== 2) break;
            }
            this.characterDir = nextDir;
        }

        this.characterPos.x = nextX;
        this.characterPos.y = nextY;

        const screenPos = this.gridToScreen(this.characterPos.x, this.characterPos.y);

        if (this.characterDir === 0 || this.characterDir === 1) {
            this.character.setFlipX(false);
        } else {
            this.character.setFlipX(true);
        }

        this.tweens.add({
            targets: this.character,
            x: screenPos.x,
            y: screenPos.y,
            duration: 800,
            onUpdate: () => {
                this.character.setDepth(this.character.y + 10);
            },
            onComplete: callback
        });
    }

    getTile(x, y) {
        if (y < 0 || y >= MAP.length || x < 0 || x >= MAP[y].length) return 0;
        return MAP[y][x];
    }

    checkDeath() {
        const tile = this.getTile(this.characterPos.x, this.characterPos.y);
        return tile === 0;
    }

    async die() {
        this.isStarted = false;
        return new Promise((resolve) => {
            this.tweens.add({
                targets: this.character,
                y: this.character.y + 200,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    alert('Game Over! You fell!');
                    this.reset();
                    resolve();
                }
            });
        });
    }

    reset() {
        this.isStarted = false;
        this.isExecuting = false;
        this.characterPos = { ...START_POS };
        this.characterDir = START_DIR;
        this.character.alpha = 1;
        this.character.setFlipX(false);
        this.updateCharacterSpritePos();
        document.getElementById('start-btn').disabled = false;
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight - 150,
    scene: GameScene,
    backgroundColor: '#333',
    pixelArt: true
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight - 150);
});

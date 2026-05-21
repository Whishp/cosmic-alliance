// Yandex Games SDK global variables
let ysdk = null;
let player = null;
let leaderboards = null;

// Audio Context for synthetic sounds
let audioCtx = null;

// Tiers of celestial objects
const TIERS = [
    { name: 'Астероид', color: 0x888888, size: 0.3, points: 2 },
    { name: 'Луна', color: 0xcccccc, size: 0.4, points: 5 },
    { name: 'Планета', color: 0x3388ff, size: 0.5, points: 10 },
    { name: 'Звезда', color: 0xffaa00, size: 0.6, points: 25 },
    { name: 'Сверхновая', color: 0xff3333, size: 0.7, points: 50 },
    { name: 'Галактика', color: 0xaa33ff, size: 0.8, points: 100 },
    { name: 'Чёрная дыра', color: 0x111111, size: 0.9, points: 250, border: 0xffffff }
];

// Audio synthesizers (Web Audio API)
const soundEffects = {
    init: function() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playTone: function(frequency, type, duration, vol=0.1) {
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    },
    click: function() { this.playTone(600, 'sine', 0.1, 0.1); },
    merge: function() { this.playTone(400, 'square', 0.2, 0.1); setTimeout(() => this.playTone(600, 'square', 0.3, 0.1), 100); },
    combo: function(multiplier) { this.playTone(400 + multiplier * 100, 'triangle', 0.3, 0.15); },
    gameOver: function() { this.playTone(150, 'sawtooth', 1.0, 0.2); setTimeout(() => this.playTone(100, 'sawtooth', 1.0, 0.2), 500); }
};

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // Initialize Web Audio API on first user interaction if needed, though often better on first click.
        // We'll init it here just in case, but browsers might block until interaction.
        const loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Загрузка...', {
            font: '32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Initialize Yandex Games SDK
        if (typeof YaGames !== 'undefined') {
            YaGames.init().then(_sdk => {
                ysdk = _sdk;

                // Init sticky banner
                ysdk.adv.showBannerAdv();

                // Get leaderboards
                ysdk.getLeaderboards()
                    .then(_lb => leaderboards = _lb)
                    .catch(err => console.error("Leaderboards error:", err));

                // Get player
                return ysdk.getPlayer({ scopes: false });
            }).then(_player => {
                player = _player;
                this.scene.start('MainScene');
            }).catch(err => {
                console.error("Yandex SDK error:", err);
                // Fallback start if SDK fails
                this.scene.start('MainScene');
            });
        } else {
            // For local testing without Yandex SDK
            setTimeout(() => {
                this.scene.start('MainScene');
            }, 500);
        }
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.gridSize = 6;
        this.cellSize = 120;
        this.grid = [];
        this.offsetX = 40;
        this.offsetY = 200;
        this.selectedCell = null;
        this.score = 0;
        this.mergesCount = 0;
        this.comboMultiplier = 1;
        this.scoreText = null;
        this.comboText = null;
        this.gameOverScreen = null;
    }

    create() {
        // Reset properties on scene restart
        this.grid = [];
        this.selectedCell = null;
        this.score = 0;
        this.mergesCount = 0;
        this.comboMultiplier = 1;
        this.gameOverScreen = null;

        // Init Audio
        this.input.on('pointerdown', () => soundEffects.init());

        // Load data
        if (player) {
            player.getData(['score']).then(data => {
                if (data.score) {
                    this.score = data.score;
                    this.updateScoreText();
                }
            });
        }

        // UI
        this.scoreText = this.add.text(400, 50, 'Очки: 0', {
            font: '48px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.comboText = this.add.text(400, 100, '', {
            font: '32px Arial',
            fill: '#ffaa00',
            align: 'center'
        }).setOrigin(0.5);

        this.createGrid();
        this.spawnInitialItems();

        // Rewarded ad button
        const adBtn = this.add.text(400, 950, 'Смотреть рекламу (x2 очки за следующий ход)', {
            font: '24px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5).setInteractive();

        adBtn.on('pointerdown', () => {
            if (ysdk) {
                ysdk.adv.showRewardedVideo({
                    callbacks: {
                        onOpen: () => {
                            // Pause game or sound if necessary
                        },
                        onRewarded: () => {
                            this.comboMultiplier *= 2;
                            this.updateComboText();
                        },
                        onClose: () => {
                            // Resume
                        },
                        onError: (e) => {
                            console.error('Video error:', e);
                        }
                    }
                });
            } else {
                // Local testing
                this.comboMultiplier *= 2;
                this.updateComboText();
            }
        });
    }

    updateScoreText() {
        this.scoreText.setText('Очки: ' + this.score);
    }

    updateComboText() {
        if (this.comboMultiplier > 1) {
            this.comboText.setText('Множитель: x' + this.comboMultiplier);
            this.comboText.setAlpha(1);
            this.tweens.add({
                targets: this.comboText,
                alpha: 0,
                duration: 2000,
                ease: 'Power1'
            });
        } else {
            this.comboText.setText('');
        }
    }

    createGrid() {
        for (let x = 0; x < this.gridSize; x++) {
            this.grid[x] = [];
            for (let y = 0; x < this.gridSize && y < this.gridSize; y++) {
                const cellX = this.offsetX + x * this.cellSize + this.cellSize / 2;
                const cellY = this.offsetY + y * this.cellSize + this.cellSize / 2;

                // Background cell
                this.add.rectangle(cellX, cellY, this.cellSize - 10, this.cellSize - 10, 0x111122).setStrokeStyle(2, 0x333344);

                // Interactive zone
                const zone = this.add.zone(cellX, cellY, this.cellSize, this.cellSize).setInteractive();
                zone.on('pointerdown', () => this.handleCellClick(x, y));

                this.grid[x][y] = { tier: -1, sprite: null, text: null };
            }
        }
    }

    drawObject(tier, x, y) {
        const t = TIERS[tier];
        const radius = (this.cellSize / 2) * t.size;

        const graphics = this.add.graphics();
        graphics.fillStyle(t.color, 1);

        if (t.border) {
            graphics.lineStyle(4, t.border, 1);
            graphics.strokeCircle(x, y, radius);
        }
        graphics.fillCircle(x, y, radius);

        const text = this.add.text(x, y, t.name, {
            font: '16px Arial',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: this.cellSize - 10 }
        }).setOrigin(0.5);

        return { sprite: graphics, text: text };
    }

    clearCell(x, y) {
        if (this.grid[x][y].sprite) {
            this.grid[x][y].sprite.destroy();
            this.grid[x][y].text.destroy();
            this.grid[x][y].sprite = null;
            this.grid[x][y].text = null;
            this.grid[x][y].tier = -1;
        }
    }

    spawnItem(x, y, tier) {
        this.clearCell(x, y);
        const cellX = this.offsetX + x * this.cellSize + this.cellSize / 2;
        const cellY = this.offsetY + y * this.cellSize + this.cellSize / 2;

        const obj = this.drawObject(tier, cellX, cellY);
        this.grid[x][y].tier = tier;
        this.grid[x][y].sprite = obj.sprite;
        this.grid[x][y].text = obj.text;

        // Pop animation
        this.tweens.add({
            targets: [obj.sprite, obj.text],
            scaleX: { from: 0, to: 1 },
            scaleY: { from: 0, to: 1 },
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    spawnInitialItems() {
        let spawned = 0;
        while(spawned < 10) {
            let rx = Phaser.Math.Between(0, this.gridSize - 1);
            let ry = Phaser.Math.Between(0, this.gridSize - 1);
            if (this.grid[rx][ry].tier === -1) {
                // Spawn tier 0 or 1
                this.spawnItem(rx, ry, Phaser.Math.Between(0, 1));
                spawned++;
            }
        }
    }

    getEmptyCells() {
        let empty = [];
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (this.grid[x][y].tier === -1) empty.push({x, y});
            }
        }
        return empty;
    }

    spawnRandomItem() {
        const empty = this.getEmptyCells();
        if (empty.length > 0) {
            const pos = Phaser.Math.RND.pick(empty);
            this.spawnItem(pos.x, pos.y, Phaser.Math.Between(0, 1));
        }
    }

    handleCellClick(x, y) {
        soundEffects.click();

        if (!this.selectedCell) {
            if (this.grid[x][y].tier !== -1) {
                this.selectedCell = {x, y};
                // Highlight logic (simple alpha change)
                if(this.grid[x][y].sprite) this.grid[x][y].sprite.setAlpha(0.5);
            }
            return;
        }

        const sx = this.selectedCell.x;
        const sy = this.selectedCell.y;

        // Deselect
        if (sx === x && sy === y) {
            if(this.grid[sx][sy].sprite) this.grid[sx][sy].sprite.setAlpha(1);
            this.selectedCell = null;
            return;
        }

        // Restore alpha
        if(this.grid[sx][sy].sprite) this.grid[sx][sy].sprite.setAlpha(1);

        // Movement / Merge logic
        if (this.grid[x][y].tier === -1) {
            // Move
            this.spawnItem(x, y, this.grid[sx][sy].tier);
            this.clearCell(sx, sy);

            // Chain reactions checking
            this.comboMultiplier = 1; // Reset combo if just moving, or keep it if we want chaining. We'll reset here.
            this.checkForChainReactions(x, y);

            this.spawnRandomItem();
            this.checkGameOver();
        } else if (this.grid[x][y].tier === this.grid[sx][sy].tier && this.grid[x][y].tier < TIERS.length - 1) {
            // Manual Merge
            this.performMerge(x, y, sx, sy);
            this.spawnRandomItem();
            this.checkGameOver();
        }

        this.selectedCell = null;
    }

    performMerge(x, y, sx, sy, isChain = false) {
        let newTier = this.grid[x][y].tier + 1;
        this.clearCell(sx, sy);
        this.spawnItem(x, y, newTier);

        // Points
        let points = TIERS[newTier].points * this.comboMultiplier;
        this.score += points;
        this.updateScoreText();
        this.saveScore();

        this.mergesCount++;

        if (isChain) {
            this.comboMultiplier++;
            this.updateComboText();
            soundEffects.combo(this.comboMultiplier);
        } else {
            this.comboMultiplier = 1;
            soundEffects.merge();
        }

        // Ads every 10 merges
        if (this.mergesCount % 10 === 0) {
            if (ysdk) {
                ysdk.adv.showFullscreenAdv({
                    callbacks: {
                        onClose: function(wasShown) {},
                        onError: function(error) {}
                    }
                });
            }
        }

        // Check for further chains
        this.time.delayedCall(300, () => {
            this.checkForChainReactions(x, y);
        });
    }

    checkForChainReactions(x, y) {
        let currentTier = this.grid[x][y].tier;
        if (currentTier === -1 || currentTier === TIERS.length - 1) return;

        // Check adjacent for same tier to trigger auto-merge (chain)
        let adjacents = [
            {dx: -1, dy: 0}, {dx: 1, dy: 0},
            {dx: 0, dy: -1}, {dx: 0, dy: 1}
        ];

        for (let adj of adjacents) {
            let nx = x + adj.dx;
            let ny = y + adj.dy;
            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                if (this.grid[nx][ny].tier === currentTier) {
                    this.performMerge(x, y, nx, ny, true);
                    return; // Only chain one at a time to prevent infinite loops, delayedCall will handle the next
                }
            }
        }
    }

    saveScore() {
        if (player) {
            player.setData({ score: this.score }).catch(() => {});
        }
        if (ysdk && leaderboards) {
            leaderboards.setLeaderboardScore('score', this.score).catch(() => {});
        }
    }

    checkGameOver() {
        const empty = this.getEmptyCells();
        if (empty.length > 0) return;

        // Check if any merges possible
        let mergesPossible = false;
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                let tier = this.grid[x][y].tier;
                if (tier === TIERS.length - 1) continue; // max tier

                // Check adjacent (simple check: horizontal and vertical)
                if (x > 0 && this.grid[x-1][y].tier === tier) mergesPossible = true;
                if (x < this.gridSize - 1 && this.grid[x+1][y].tier === tier) mergesPossible = true;
                if (y > 0 && this.grid[x][y-1].tier === tier) mergesPossible = true;
                if (y < this.gridSize - 1 && this.grid[x][y+1].tier === tier) mergesPossible = true;
            }
        }

        if (!mergesPossible) {
            soundEffects.gameOver();
            this.showGameOver();
        }
    }

    showGameOver() {
        if (this.gameOverScreen) return;

        const overlay = this.add.rectangle(400, 600, 800, 1200, 0x000000, 0.8);
        const text = this.add.text(400, 500, 'Игра Окончена\nСчёт: ' + this.score, {
            font: '48px Arial',
            fill: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(400, 700, 'Начать заново', {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });

        this.gameOverScreen = [overlay, text, restartBtn];
    }
}

// Configuration
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 1200
    },
    backgroundColor: '#050510',
    scene: [BootScene, MainScene]
};

const game = new Phaser.Game(config);

// Yandex SDK instance
let ysdk = null;
let player = null;
let leaderboard = null;

// Audio Manager (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;

const SoundManager = {
    playTone: function(frequency, type, duration, vol = 0.1) {
        if (isMuted) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
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
    
    playClick: function() {
        this.playTone(400, 'sine', 0.1, 0.05);
    },
    
    playMerge: function(tier) {
        const baseFreq = 300;
        this.playTone(baseFreq + (tier * 100), 'triangle', 0.2, 0.1);
    },
    
    playCombo: function(comboCount) {
        const freq = 400 + (comboCount * 150);
        this.playTone(freq, 'square', 0.15, 0.05);
    },
    
    playGameOver: function() {
        if (isMuted) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1.5);
    }
};

class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create() {
        this.generateTextures();

        // Init Yandex SDK
        if (typeof YaGames !== 'undefined') {
            YaGames.init().then(_ysdk => {
                ysdk = _ysdk;
                ysdk.features.LoadingAPI?.ready();
                
                let promises = [];
                promises.push(ysdk.getPlayer().then(_player => {
                    player = _player;
                }).catch(err => {
                    console.warn("Player init failed:", err);
                }));
                
                promises.push(ysdk.getLeaderboards().then(_lb => {
                    leaderboard = _lb;
                }).catch(err => {
                    console.warn("Leaderboard init failed:", err);
                }));
                
                Promise.all(promises).then(() => {
                    this.scene.start('Main');
                });
            }).catch(err => {
                console.warn("YaGames init failed:", err);
                this.scene.start('Main');
            });
        } else {
            console.warn("YaGames SDK not found, starting game anyway");
            this.scene.start('Main');
        }
    }

    generateTextures() {
        const graphics = this.make.graphics();
        
        // 1. Астероид (Asteroid) — gray
        graphics.clear();
        graphics.fillStyle(0x888888, 1);
        graphics.fillCircle(50, 50, 40);
        graphics.fillStyle(0x666666, 1);
        graphics.fillCircle(40, 40, 10);
        graphics.fillCircle(65, 60, 8);
        graphics.fillCircle(45, 70, 5);
        graphics.generateTexture('tier_1', 100, 100);
        
        // 2. Луна (Moon) — silver
        graphics.clear();
        graphics.fillStyle(0xcccccc, 1);
        graphics.fillCircle(50, 50, 40);
        graphics.fillStyle(0xaaaaaa, 1);
        graphics.fillCircle(35, 35, 8);
        graphics.fillCircle(60, 60, 12);
        graphics.fillCircle(65, 35, 6);
        graphics.generateTexture('tier_2', 100, 100);
        
        // 3. Планета (Planet) — blue
        graphics.clear();
        graphics.fillStyle(0x4488ff, 1);
        graphics.fillCircle(50, 50, 40);
        graphics.fillStyle(0x22aa44, 1);
        graphics.beginPath();
        // quadraticCurveTo doesn't exist on Phaser Graphics. Use simple shapes for planet details.
        graphics.fillCircle(35, 30, 15);
        graphics.fillCircle(65, 45, 10);
        graphics.fillCircle(40, 70, 12);
        graphics.generateTexture('tier_3', 100, 100);
        
        // 4. Звезда (Star) — gold/yellow
        graphics.clear();
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(50, 50, 40);
        graphics.fillStyle(0xffaa00, 0.5);
        graphics.fillCircle(50, 50, 45);
        graphics.generateTexture('tier_4', 100, 100);
        
        // 5. Сверхновая (Supernova) — orange
        graphics.clear();
        graphics.fillStyle(0xff8800, 1);
        graphics.fillCircle(50, 50, 35);
        for(let i=0; i<8; i++) {
            graphics.lineStyle(4, 0xffaa00, 1);
            let angle = (i / 8) * Math.PI * 2;
            graphics.beginPath();
            graphics.moveTo(50 + Math.cos(angle)*35, 50 + Math.sin(angle)*35);
            graphics.lineTo(50 + Math.cos(angle)*48, 50 + Math.sin(angle)*48);
            graphics.strokePath();
        }
        graphics.generateTexture('tier_5', 100, 100);
        
        // 6. Галактика (Galaxy) — purple
        graphics.clear();
        graphics.fillStyle(0x8844ff, 1);
        graphics.fillCircle(50, 50, 25);
        graphics.lineStyle(6, 0xbb88ff, 0.8);
        graphics.beginPath();
        graphics.arc(50, 50, 35, 0, Math.PI, false);
        graphics.strokePath();
        graphics.beginPath();
        graphics.arc(50, 50, 35, Math.PI, Math.PI*2, false);
        graphics.strokePath();
        graphics.generateTexture('tier_6', 100, 100);
        
        // 7. Черная дыра (Black Hole) — dark purple
        graphics.clear();
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(50, 50, 30);
        graphics.lineStyle(4, 0x440088, 1);
        graphics.strokeCircle(50, 50, 35);
        graphics.lineStyle(2, 0x8800ff, 0.5);
        graphics.strokeCircle(50, 50, 42);
        graphics.generateTexture('tier_7', 100, 100);
        
        // Cell Background
        graphics.clear();
        graphics.fillStyle(0x222233, 1);
        graphics.fillRoundedRect(0, 0, 100, 100, 15);
        graphics.lineStyle(2, 0x333344, 1);
        graphics.strokeRoundedRect(0, 0, 100, 100, 15);
        graphics.generateTexture('cell_bg', 100, 100);
        
        // Selected Highlight
        graphics.clear();
        graphics.lineStyle(6, 0xffd700, 1);
        graphics.strokeRoundedRect(0, 0, 100, 100, 15);
        graphics.generateTexture('cell_selected', 100, 100);
        
        // Particle
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('particle', 16, 16);
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super('Main');
        this.gridSize = 6;
        this.cellSize = 110;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        this.grid = []; // 2D array of objects { sprite, tier }
        this.selectedCell = null;
        this.score = 0;
        this.highScore = 0;
        this.isProcessing = false;
        this.comboMultiplier = 1;
        this.tierPoints = [0, 10, 30, 90, 270, 810, 2430, 7290];
        this.tierColors = [0x000000, 0x888888, 0xcccccc, 0x4488ff, 0xffff00, 0xff8800, 0x8844ff, 0x000000];
        this.scoreText = null;
        this.highScoreText = null;
        this.mergeCount = 0;
        this.doublePointsActive = false;
        this.rewardedBtn = null;
    }

    create() {
        this.input.mouse.disableContextMenu();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.gridOffsetX = (width - (this.gridSize * this.cellSize)) / 2 + (this.cellSize / 2);
        this.gridOffsetY = 300;

        // Background starfield
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
            this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xffffff, alpha);
        }

        // Top UI
        this.add.text(width/2, 50, 'КОСМИЧЕСКИЙ АЛЬЯНС', { fontSize: '40px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        
        this.scoreText = this.add.text(20, 120, 'СЧЕТ: 0', { fontSize: '32px', fill: '#ffd700' });
        
        // Try to load high score
        const savedScore = localStorage.getItem('cosmic_highscore');
        if (savedScore) this.highScore = parseInt(savedScore, 10);
        this.highScoreText = this.add.text(width - 20, 120, 'РЕКОРД: ' + this.highScore, { fontSize: '32px', fill: '#aaa' }).setOrigin(1, 0);

        // Try to load cloud save
        if (player) {
            player.getData(['score', 'highScore', 'grid']).then(data => {
                if (data.highScore) {
                    this.highScore = data.highScore;
                    this.highScoreText.setText('РЕКОРД: ' + this.highScore);
                    localStorage.setItem('cosmic_highscore', this.highScore.toString());
                }
            }).catch(() => {
                // Ignore error, fallback to localStorage
            });
        }

        // Mute button
        const muteText = this.add.text(width - 50, 50, '🔊', { fontSize: '40px' }).setOrigin(0.5).setInteractive();
        muteText.on('pointerdown', () => {
            isMuted = !isMuted;
            muteText.setText(isMuted ? '🔇' : '🔊');
        });

        // Rewarded Ad Button
        this.rewardedBtn = this.add.text(width/2, 180, 'Смотреть рекламу: 2x Очки на 1 ход!', { 
            fontSize: '24px', 
            fill: '#000', 
            backgroundColor: '#00ffaa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();
        
        this.rewardedBtn.on('pointerdown', () => this.showRewardedAd());

        this.initGrid();
        
        if (ysdk && ysdk.features.GameplayAPI) {
            ysdk.features.GameplayAPI.start();
        }
    }

    showRewardedAd() {
        if (!ysdk) return;
        ysdk.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => {
                    isMuted = true; // mute game while ad plays
                },
                onRewarded: () => {
                    this.doublePointsActive = true;
                    this.rewardedBtn.setVisible(false);
                },
                onClose: () => {
                    isMuted = false;
                }, 
                onError: (e) => {
                    console.warn('Video ad error', e);
                    isMuted = false;
                }
            }
        });
    }

    showInterstitialAd() {
        if (!ysdk) return;
        ysdk.adv.showFullscreenAdv({
            callbacks: {
                onOpen: () => { isMuted = true; },
                onClose: (wasShown) => { isMuted = false; },
                onError: (error) => { isMuted = false; }
            }
        });
    }

    saveCloudData() {
        if (player) {
            let gridData = [];
            for(let r=0; r<this.gridSize; r++){
                gridData[r] = [];
                for(let c=0; c<this.gridSize; c++){
                    gridData[r][c] = this.grid[r][c].tier;
                }
            }
            player.setData({
                score: this.score,
                highScore: this.highScore,
                grid: gridData
            }).catch(e => console.warn(e));
        }
    }

    initGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const x = this.gridOffsetX + col * this.cellSize;
                const y = this.gridOffsetY + row * this.cellSize;
                
                // BG cell
                this.add.image(x, y, 'cell_bg').setOrigin(0.5);
                
                // Selection highlight (hidden initially)
                const highlight = this.add.image(x, y, 'cell_selected').setOrigin(0.5).setVisible(false);
                
                // Invisible interactive zone
                const zone = this.add.zone(x, y, this.cellSize, this.cellSize).setInteractive();
                zone.on('pointerdown', () => this.handleCellClick(row, col));
                
                this.grid[row][col] = {
                    tier: 0,
                    sprite: null,
                    highlight: highlight
                };
            }
        }
        
        // Spawn initial items
        for (let i = 0; i < 5; i++) {
            this.spawnRandom();
        }
    }

    handleCellClick(row, col) {
        if (this.isProcessing) return;
        
        const cell = this.grid[row][col];
        
        // Deselect logic
        if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
            this.deselect();
            SoundManager.playClick();
            return;
        }

        // Select empty cell or select item logic
        if (!this.selectedCell) {
            if (cell.tier > 0) {
                this.select(row, col);
                SoundManager.playClick();
            }
            return;
        }

        // Try merge
        const selCell = this.grid[this.selectedCell.row][this.selectedCell.col];
        if (cell.tier > 0 && cell.tier === selCell.tier && (row !== this.selectedCell.row || col !== this.selectedCell.col)) {
            // Merge!
            this.isProcessing = true;
            this.comboMultiplier = 1;
            const targetTier = cell.tier;
            const fromRow = this.selectedCell.row;
            const fromCol = this.selectedCell.col;
            this.deselect();
            
            this.doMerge(fromRow, fromCol, row, col, targetTier, () => {
                this.checkChainReactions(() => {
                    this.endTurn();
                });
            });
        } else if (cell.tier > 0) {
            // Change selection
            this.deselect();
            this.select(row, col);
            SoundManager.playClick();
        }
    }

    select(row, col) {
        this.selectedCell = { row, col };
        this.grid[row][col].highlight.setVisible(true);
        if (this.grid[row][col].sprite) {
            this.tweens.add({
                targets: this.grid[row][col].sprite,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }
    }

    deselect() {
        if (this.selectedCell) {
            const r = this.selectedCell.row;
            const c = this.selectedCell.col;
            this.grid[r][c].highlight.setVisible(false);
            if (this.grid[r][c].sprite) {
                this.tweens.killTweensOf(this.grid[r][c].sprite);
                this.grid[r][c].sprite.setScale(1);
            }
            this.selectedCell = null;
        }
    }

    doMerge(r1, c1, r2, c2, tier, callback) {
        const sprite1 = this.grid[r1][c1].sprite;
        const targetX = this.gridOffsetX + c2 * this.cellSize;
        const targetY = this.gridOffsetY + r2 * this.cellSize;
        
        this.grid[r1][c1].tier = 0;
        this.grid[r1][c1].sprite = null;
        
        const nextTier = Math.min(tier + 1, 7);
        
        SoundManager.playMerge(nextTier);
        
        this.tweens.add({
            targets: sprite1,
            x: targetX,
            y: targetY,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                sprite1.destroy();
                this.upgradeCell(r2, c2, nextTier);
                
                // Score
                let multiplier = this.comboMultiplier;
                if (this.doublePointsActive) {
                    multiplier *= 2;
                }
                const pts = this.tierPoints[nextTier] * multiplier;
                this.addScore(pts);
                this.showFloatingText(targetX, targetY - 20, `+${pts}`, this.tierColors[nextTier]);
                
                this.mergeCount++;
                if (this.mergeCount % 10 === 0) {
                    this.showInterstitialAd();
                }

                if (callback) callback();
            }
        });
    }

    upgradeCell(r, c, tier) {
        const cell = this.grid[r][c];
        if (cell.sprite) cell.sprite.destroy();
        
        cell.tier = tier;
        const x = this.gridOffsetX + c * this.cellSize;
        const y = this.gridOffsetY + r * this.cellSize;
        
        cell.sprite = this.add.image(x, y, `tier_${tier}`);
        
        // Pop effect
        cell.sprite.setScale(0);
        this.tweens.add({
            targets: cell.sprite,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.out'
        });
        
        this.spawnParticles(x, y, this.tierColors[tier]);
    }

    spawnParticles(x, y, color) {
        const particles = this.add.particles('particle');
        const emitter = particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            tint: color,
            lifespan: 500,
            quantity: 10
        });
        
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
    }

    showFloatingText(x, y, text, color) {
        const t = this.add.text(x, y, text, {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add color tint if valid
        if (color !== 0x000000) t.setTint(color);

        this.tweens.add({
            targets: t,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => t.destroy()
        });
    }

    checkChainReactions(callback) {
        let chainFound = false;
        let chainMergeArgs = null;

        // Simple check: iterate all cells, look for adjacent same tiers
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = this.grid[r][c];
                if (cell.tier > 0 && cell.tier < 7) {
                    // Check right
                    if (c < this.gridSize - 1 && this.grid[r][c+1].tier === cell.tier) {
                        chainMergeArgs = [r, c+1, r, c, cell.tier];
                        chainFound = true;
                        break;
                    }
                    // Check down
                    if (r < this.gridSize - 1 && this.grid[r+1][c].tier === cell.tier) {
                        chainMergeArgs = [r+1, c, r, c, cell.tier];
                        chainFound = true;
                        break;
                    }
                }
            }
            if (chainFound) break;
        }

        if (chainFound) {
            this.comboMultiplier++;
            SoundManager.playCombo(this.comboMultiplier);
            this.time.delayedCall(200, () => {
                this.doMerge(chainMergeArgs[0], chainMergeArgs[1], chainMergeArgs[2], chainMergeArgs[3], chainMergeArgs[4], () => {
                    this.checkChainReactions(callback);
                });
            });
        } else {
            if (callback) callback();
        }
    }

    endTurn() {
        // Reset double points if it was used (only lasts one turn/chain)
        if (this.comboMultiplier === 1) {
            this.doublePointsActive = false;
            if (this.rewardedBtn) this.rewardedBtn.setVisible(true);
        }

        // Spawn new items
        const numToSpawn = Phaser.Math.Between(1, 2);
        let spawned = 0;
        for (let i = 0; i < numToSpawn; i++) {
            if (this.spawnRandom()) spawned++;
        }
        
        this.saveCloudData();

        if (this.getEmptyCells().length === 0) {
            this.gameOver();
            return;
        }
        
        this.isProcessing = false;
    }

    getEmptyCells() {
        const empty = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c].tier === 0) {
                    empty.push({r, c});
                }
            }
        }
        return empty;
    }

    spawnRandom() {
        const empty = this.getEmptyCells();
        if (empty.length === 0) return false;
        
        const target = Phaser.Utils.Array.GetRandom(empty);
        
        // Weighted random tier (mostly 1 and 2)
        const rand = Math.random();
        let tier = 1;
        if (rand > 0.8) tier = 2;
        if (rand > 0.95) tier = 3;
        
        this.upgradeCell(target.r, target.c, tier);
        return true;
    }

    addScore(pts) {
        this.score += pts;
        this.scoreText.setText('СЧЕТ: ' + this.score);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText('РЕКОРД: ' + this.highScore);
            localStorage.setItem('cosmic_highscore', this.highScore.toString());
        }
    }

    gameOver() {
        SoundManager.playGameOver();
        
        if (ysdk && ysdk.features.GameplayAPI) {
            ysdk.features.GameplayAPI.stop();
        }

        if (leaderboard) {
            ysdk.isAvailableMethod('leaderboards.setLeaderboardScore').then(available => {
                if (available) {
                    leaderboard.setLeaderboardScore('MainBoard', this.score);
                }
            });
        }
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8);
        const goText = this.add.text(width/2, height/2 - 50, 'ИГРА ОКОНЧЕНА', { fontSize: '48px', fill: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5);
        const scoreText = this.add.text(width/2, height/2 + 20, `Счет: ${this.score}`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        
        const restartBtn = this.add.text(width/2, height/2 + 100, 'ИГРАТЬ СНОВА', { 
            fontSize: '36px', 
            fill: '#000', 
            backgroundColor: '#ffd700',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        
        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 1200
    },
    backgroundColor: '#0a0a1a',
    scene: [BootScene, MainScene]
};

const game = new Phaser.Game(config);

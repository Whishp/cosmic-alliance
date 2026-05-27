// Yandex SDK instance
let ysdk = null;
let player = null;
let leaderboard = null;

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';

function formatNumber(num) {
    if (!isFinite(num) || isNaN(num)) return 'INF';
    if (num < 1000) return num.toString();
    const suffixes = ["", "K", "M", "B", "T"];
    const suffixNum = Math.floor(("" + num).length / 3);
    let shortValue = parseFloat((suffixNum != 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(2));
    if (shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
    return shortValue + suffixes[suffixNum];
}

const T = {
    ru: {
        title: 'КОСМИЧЕСКИЙ АЛЬЯНС',
        score: 'СЧЕТ: ',
        score_go: 'Счет: ',
        highscore: 'РЕКОРД: ',
        watch_ad: 'Смотреть рекламу: 2x Очки на 1 ход!',
        game_over: 'ИГРА ОКОНЧЕНА',
        play_again: 'ИГРАТЬ СНОВА',
        merges: 'СЛИЯНИЯ: ',
        tutorial_title: 'КАК ИГРАТЬ',
        tutorial_step1: '1. Нажмите на фишку, чтобы выбрать',
        tutorial_step2: '2. Нажмите на такую же фишку для слияния',
        tutorial_step3: '3. Объединяйте для получения большего числа очков',
        tutorial_step4: '4. Нажмите на пустую клетку для перемещения',
        tutorial_ok: 'ПОНЯТНО',
        prestige: 'Престиж',
        prestigeMultiplier: 'Множитель',
        prestigeConfirm: 'Сбросить прогресс ради множителя очков?',
        dailyChallenge: 'Ежедневный вызов',
        dailyReward: 'Награда',
        achievement: 'ДОСТИЖЕНИЕ',
        unlocked_tier: 'Открыт уровень: ',
        score_milestone: 'Счет достигнут: '
    },
    en: {
        title: 'COSMIC ALLIANCE',
        score: 'SCORE: ',
        score_go: 'Score: ',
        highscore: 'BEST: ',
        watch_ad: 'Watch Ad: 2x Points for 1 turn!',
        game_over: 'GAME OVER',
        play_again: 'PLAY AGAIN',
        merges: 'MERGES: ',
        tutorial_title: 'HOW TO PLAY',
        tutorial_step1: '1. Tap a piece to select',
        tutorial_step2: '2. Tap matching piece to merge',
        tutorial_step3: '3. Merge higher tiers for more points',
        tutorial_step4: '4. Tap empty cell to move selected piece',
        tutorial_ok: 'OK',
        prestige: 'Prestige',
        prestigeMultiplier: 'Multiplier',
        prestigeConfirm: 'Reset progress for a score multiplier?',
        dailyChallenge: 'Daily Challenge',
        dailyReward: 'Reward',
        achievement: 'ACHIEVEMENT',
        unlocked_tier: 'Unlocked Tier: ',
        score_milestone: 'Score Milestone: '
    }
};

function getLang() {
    return (ysdk && ysdk.environment && ysdk.environment.i18n && ysdk.environment.i18n.lang === 'en') ? 'en' : 'ru';
}

// Audio Manager (Web Audio API)
let audioCtx = null;
let isMuted = false;

const SoundManager = {
    initCtx: function() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    },
    playTone: function(frequency, type, duration, vol = 0.1) {
        if (isMuted) return;
        this.initCtx();
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
        this.initCtx();
        if (!audioCtx) return;
        
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
                    // silent fallback
                }));
                
                promises.push(ysdk.getLeaderboards().then(_lb => {
                    leaderboard = _lb;
                }).catch(err => {
                    // silent fallback
                }));
                
                Promise.all(promises).then(() => {
                    this.scene.start('Main');
                });
            }).catch(err => {
                // silent fallback
                this.scene.start('Main');
            });
        } else {
            // silent fallback
            this.scene.start('Main');
        }
    }

    generateTextures() {
        const graphics = this.make.graphics();
        
        // Neon dark cosmic theme

        // 1. Астероид (Asteroid) — Dark gray with cyan neon
        graphics.clear();
        graphics.fillStyle(0x222222, 1);
        graphics.fillCircle(50, 50, 38);
        graphics.lineStyle(3, 0x00e5ff, 0.8);
        graphics.strokeCircle(50, 50, 38);
        graphics.fillStyle(0x111111, 1);
        graphics.fillCircle(40, 40, 8);
        graphics.fillCircle(65, 60, 6);
        graphics.fillCircle(45, 70, 4);
        graphics.generateTexture('tier_1', 100, 100);
        
        // 2. Луна (Moon) — Dark blue with magenta neon
        graphics.clear();
        graphics.fillStyle(0x1a1a3a, 1);
        graphics.fillCircle(50, 50, 38);
        graphics.lineStyle(3, 0xff00ff, 0.8);
        graphics.strokeCircle(50, 50, 38);
        graphics.fillStyle(0x2a2a5a, 1);
        graphics.fillCircle(35, 35, 10);
        graphics.fillCircle(60, 60, 14);
        graphics.fillCircle(65, 35, 7);
        graphics.generateTexture('tier_2', 100, 100);
        
        // 3. Планета (Planet) — Deep green with bright green/yellow neon
        graphics.clear();
        graphics.fillStyle(0x0a2a1a, 1);
        graphics.fillCircle(50, 50, 38);
        graphics.lineStyle(4, 0x00ff88, 0.9);
        graphics.strokeCircle(50, 50, 38);
        graphics.fillStyle(0x114422, 1);
        graphics.fillCircle(35, 30, 15);
        graphics.fillCircle(65, 45, 10);
        graphics.fillCircle(40, 70, 12);
        graphics.generateTexture('tier_3', 100, 100);
        
        // 4. Звезда (Star) — Deep gold with bright yellow neon core
        graphics.clear();
        graphics.fillStyle(0x332200, 1);
        graphics.fillCircle(50, 50, 35);
        graphics.lineStyle(5, 0xffd700, 1);
        graphics.strokeCircle(50, 50, 35);
        graphics.fillStyle(0xffffaa, 0.8);
        graphics.fillCircle(50, 50, 15);
        graphics.generateTexture('tier_4', 100, 100);
        
        // 5. Сверхновая (Supernova) — Dark red/orange with fiery neon
        graphics.clear();
        graphics.fillStyle(0x441100, 1);
        graphics.fillCircle(50, 50, 30);
        graphics.lineStyle(4, 0xff4400, 1);
        graphics.strokeCircle(50, 50, 30);
        for(let i=0; i<12; i++) {
            graphics.lineStyle(3, 0xffaa00, 0.9);
            let angle = (i / 12) * Math.PI * 2;
            graphics.beginPath();
            graphics.moveTo(50 + Math.cos(angle)*30, 50 + Math.sin(angle)*30);
            graphics.lineTo(50 + Math.cos(angle)*45, 50 + Math.sin(angle)*45);
            graphics.strokePath();
        }
        graphics.generateTexture('tier_5', 100, 100);
        
        // 6. Галактика (Galaxy) — Deep space with bright purple neon spirals
        graphics.clear();
        graphics.fillStyle(0x110022, 1);
        graphics.fillCircle(50, 50, 20);
        graphics.lineStyle(5, 0xbb00ff, 0.9);
        graphics.beginPath();
        graphics.arc(50, 50, 30, 0, Math.PI * 1.2, false);
        graphics.strokePath();
        graphics.beginPath();
        graphics.arc(50, 50, 30, Math.PI, Math.PI * 2.2, false);
        graphics.strokePath();
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(50, 50, 8);
        graphics.generateTexture('tier_6', 100, 100);
        
        // 7. Черная дыра (Black Hole) — Pitch black with white/cyan neon event horizon
        graphics.clear();
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(50, 50, 25);
        graphics.lineStyle(4, 0x00e5ff, 1);
        graphics.strokeCircle(50, 50, 28);
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.strokeCircle(50, 50, 35);
        graphics.lineStyle(1, 0xbb00ff, 0.5);
        graphics.strokeCircle(50, 50, 45);
        graphics.generateTexture('tier_7', 100, 100);
        
        // Cell Background (iOS glass-morphism style)
        graphics.clear();
        graphics.fillStyle(0x1E1E3C, 0.6);
        graphics.fillRoundedRect(0, 0, 100, 100, 20);
        graphics.lineStyle(1, 0x00E5FF, 0.15);
        graphics.strokeRoundedRect(0, 0, 100, 100, 20);
        // Faint dot in center for empty cells
        graphics.fillStyle(0x00E5FF, 0.15);
        graphics.fillCircle(50, 50, 3);
        graphics.generateTexture('cell_bg', 100, 100);
        
        // Selected Highlight (iOS-style inner glow + cyan border)
        graphics.clear();
        // Inner glow
        graphics.fillStyle(0x00E5FF, 0.08);
        graphics.fillRoundedRect(2, 2, 96, 96, 20);
        // Border
        graphics.lineStyle(3, 0x00E5FF, 1);
        graphics.strokeRoundedRect(0, 0, 100, 100, 20);
        // Glow effect
        graphics.lineStyle(8, 0x00E5FF, 0.25);
        graphics.strokeRoundedRect(0, 0, 100, 100, 20);
        graphics.generateTexture('cell_selected', 100, 100);
        
        // Particle (Star shape or circle with glow)
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(8, 8, 4);
        graphics.fillStyle(0xffffff, 0.4);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('particle', 16, 16);

        // Button Texture (iOS-style gradient — cyan for ad button)
        const canvas = document.createElement('canvas');
        canvas.width = 420;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        // Shadow glow
        ctx.shadowColor = 'rgba(0, 229, 255, 0.3)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // iOS gradient: 135deg #00E5FF → #0088CC
        const gradient = ctx.createLinearGradient(10, 10, 410, 90);
        gradient.addColorStop(0, '#00E5FF');
        gradient.addColorStop(1, '#0088CC');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(10, 10, 400, 80, 14);
        } else {
            ctx.rect(10, 10, 400, 80);
        }
        ctx.fill();

        ctx.shadowBlur = 0;
        // Subtle white inner highlight
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(12, 12, 396, 38, 14);
        } else {
            ctx.rect(12, 12, 396, 38);
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();

        this.textures.addCanvas('button_bg', canvas);

        // Prestige button texture (iOS gradient — red/orange)
        const canvas2 = document.createElement('canvas');
        canvas2.width = 420;
        canvas2.height = 100;
        const ctx2 = canvas2.getContext('2d');

        ctx2.shadowColor = 'rgba(255, 55, 95, 0.3)';
        ctx2.shadowBlur = 16;
        ctx2.shadowOffsetY = 4;

        const gradient2 = ctx2.createLinearGradient(10, 10, 410, 90);
        gradient2.addColorStop(0, '#FF375F');
        gradient2.addColorStop(1, '#FF9F0A');

        ctx2.fillStyle = gradient2;
        ctx2.beginPath();
        if (ctx2.roundRect) {
            ctx2.roundRect(10, 10, 400, 80, 14);
        } else {
            ctx2.rect(10, 10, 400, 80);
        }
        ctx2.fill();
        ctx2.shadowBlur = 0;

        this.textures.addCanvas('button_bg_prestige', canvas2);

        // Daily button texture (iOS gradient — purple)
        const canvas3 = document.createElement('canvas');
        canvas3.width = 420;
        canvas3.height = 100;
        const ctx3 = canvas3.getContext('2d');

        ctx3.shadowColor = 'rgba(191, 90, 242, 0.3)';
        ctx3.shadowBlur = 16;
        ctx3.shadowOffsetY = 4;

        const gradient3 = ctx3.createLinearGradient(10, 10, 410, 90);
        gradient3.addColorStop(0, '#BF5AF2');
        gradient3.addColorStop(1, '#7B2CBF');

        ctx3.fillStyle = gradient3;
        ctx3.beginPath();
        if (ctx3.roundRect) {
            ctx3.roundRect(10, 10, 400, 80, 14);
        } else {
            ctx3.rect(10, 10, 400, 80);
        }
        ctx3.fill();
        ctx3.shadowBlur = 0;

        this.textures.addCanvas('button_bg_daily', canvas3);

        graphics.destroy();
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
        this.displayScore = 0;
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
        this.doublePointsTurns = 0;
        this.currentProgressRatio = 0;
        this.prestigeMultiplier = 1.0;
        this.prestigeCount = 0;
        this.isDailyChallenge = false;
        this.rng = new Phaser.Math.RandomDataGenerator();
    }

    init(data) {
        this.score = 0;
        this.displayScore = 0;
        this.highScore = 0;
        this.grid = [];
        this.mergeCount = 0;
        this.comboMultiplier = 1;
        this.doublePointsActive = false;
        this.doublePointsTurns = 0;
        this.selectedCell = null;
        this.isProcessing = false;
        this.maxUnlockedTier = 3;
        this.currentProgressRatio = 0;
        this.particleEmitter = null;
        this.hintTimer = null;
        this.hintTweens = [];
        this.prestigeMultiplier = 1.0;
        this.prestigeCount = 0;
        this.isDailyChallenge = data && data.isDailyChallenge ? true : false;
        this.dailyChallengeCompleted = false;
        this.scoreText = null;
        this.highScoreText = null;
        this.mergeCountText = null;
        this.prestigeText = null;
        this.prestigeBtnObj = null;
        this.rewardedBtn = null;

        this.passedMilestones = new Set();

        if (this.isDailyChallenge) {
            const dateStr = new Date().toISOString().split('T')[0];
            this.rng.init([dateStr]);
        } else {
            this.rng.init([(Math.random() * 1000000).toString()]);
        }
    }

    create() {
        this.scale.on('resize', this.handleResize, this);

        this.input.mouse.disableContextMenu();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Dynamic sizing for narrower/taller screens
        let fontSize = '28px';
        if (width <= 600) {
            this.cellSize = Math.floor((width - 10) / 6);
            this.gridOffsetY = Math.floor(height * 0.25);
            fontSize = '16px';
        } else {
            this.cellSize = Math.min(125, Math.floor((width - 40) / 6), Math.floor((height - 500) / 6));
            this.gridOffsetY = Math.floor(height * 0.30);
        }

        this.gridOffsetX = (width - (this.gridSize * this.cellSize)) / 2 + (this.cellSize / 2);

        this.bgRect = this.add.graphics();
        this.drawBackground();

        // Background starfield (parallax layers)
        this.starLayers = [];
        const layerSpeeds = [0.1, 0.2, 0.4];
        const starCounts = [50, 80, 50];
        const starRadii = [[0.5, 1.5], [1, 2], [1.5, 3]];

        for (let j = 0; j < 3; j++) {
            const container = this.add.container(0, 0);
            for (let i = 0; i < starCounts[j]; i++) {
                const x = Phaser.Math.Between(0, width);
                // Create stars across 2x height to allow continuous scrolling
                const y = Phaser.Math.Between(-height, height);
                const alpha = Phaser.Math.FloatBetween(0.1, 0.8);
                const r = Phaser.Math.FloatBetween(starRadii[j][0], starRadii[j][1]);
                const star = this.add.circle(x, y, r, 0xffffff, alpha);

                // Twinkle effect
                this.tweens.add({
                    targets: star,
                    alpha: alpha * 0.2,
                    duration: Phaser.Math.Between(1000, 3000),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                container.add(star);
            }
            this.starLayers.push({ container: container, speed: layerSpeeds[j] });
        }

        // Parallax Orbits (iOS-style faint circle outlines rotating slowly)
        this.orbitCircles = [];
        const orbitConfigs = [
            { radius: 120, x: width * 0.2, y: height * 0.3, speed: 0.003 },
            { radius: 200, x: width * 0.75, y: height * 0.5, speed: -0.005 },
            { radius: 160, x: width * 0.5, y: height * 0.7, speed: 0.004 },
            { radius: 90, x: width * 0.1, y: height * 0.8, speed: -0.002 }
        ];
        for (const cfg of orbitConfigs) {
            const g = this.add.graphics();
            g.lineStyle(1, 0x00E5FF, 0.08);
            g.strokeCircle(cfg.x, cfg.y, cfg.radius);
            g.setDepth(0);
            this.orbitCircles.push({ graphics: g, cfg: cfg, angle: Math.random() * Math.PI * 2 });
        }

        this.updateBackgroundGradient();

        // Top UI — iOS Status Bar
        const l = getLang();
        // Glass status bar at top
        const statusBarGfx = this.add.graphics();
        statusBarGfx.fillStyle(0x050510, 0.4);
        statusBarGfx.fillRoundedRect(0, 0, width, 44, 0);
        statusBarGfx.lineStyle(0.5, 0xFFFFFF, 0.06);
        statusBarGfx.lineBetween(0, 44, width, 44);
        // Title in status bar with letter-spacing
        const titleText = T[l].title.split('').join(' ');
        this.add.text(width/2, 22, titleText, { fontSize: '15px', fill: '#FFFFFF', fontFamily: FONT_FAMILY, fontStyle: 'bold' }).setOrigin(0.5);

        // Score Cards — iOS HUD Pills
        const cardY = 110;
        const pillW = width <= 600 ? Math.floor(width * 0.30) : 200;
        const pillH = 36;
        const pillGap = width <= 600 ? 8 : 16;
        const totalPillW = pillW * 3 + pillGap * 2;
        const pillStartX = (width - totalPillW) / 2;

        const cardBg = this.add.graphics();
        // Pill 1: Score (gold)
        cardBg.fillStyle(0x787880, 0.10);
        cardBg.fillRoundedRect(pillStartX, cardY, pillW, pillH, 20);
        cardBg.lineStyle(0.5, 0xFFFFFF, 0.06);
        cardBg.strokeRoundedRect(pillStartX, cardY, pillW, pillH, 20);
        // Pill 2: Merges (cyan)
        const pill2X = pillStartX + pillW + pillGap;
        cardBg.fillStyle(0x787880, 0.10);
        cardBg.fillRoundedRect(pill2X, cardY, pillW, pillH, 20);
        cardBg.lineStyle(0.5, 0xFFFFFF, 0.06);
        cardBg.strokeRoundedRect(pill2X, cardY, pillW, pillH, 20);
        // Pill 3: High Score (muted)
        const pill3X = pillStartX + (pillW + pillGap) * 2;
        cardBg.fillStyle(0x787880, 0.10);
        cardBg.fillRoundedRect(pill3X, cardY, pillW, pillH, 20);
        cardBg.lineStyle(0.5, 0xFFFFFF, 0.06);
        cardBg.strokeRoundedRect(pill3X, cardY, pillW, pillH, 20);

        this.fontSize = fontSize; // Store for later text creations
        this.cardY = cardY;
        this.pillStartX = pillStartX;
        this.pillW = pillW;
        this.pillGap = pillGap;

        this.scoreText = this.add.text(pillStartX + 10, cardY + 9, T[l].score + formatNumber(0), { fontFamily: FONT_FAMILY, fontSize: '13px', fill: '#FFD60A', fontStyle: 'bold' });
        this.setShadow(this.scoreText, '#FFD60A', 6);
        
        // Progress Indicator UI
        this.maxUnlockedTier = 3; // Starts assuming they have tier 3 from spawn
        this.progressBg = this.add.graphics();
        this.progressBar = this.add.graphics();
        this.drawProgressBar(width, 0);

        // Try to load high score
        const savedScore = localStorage.getItem('cosmic_highscore');
        if (savedScore) this.highScore = parseInt(savedScore, 10);

        const savedPrestigeMult = localStorage.getItem('prestigeMultiplier');
        if (savedPrestigeMult) this.prestigeMultiplier = parseFloat(savedPrestigeMult);

        const savedPrestigeCount = localStorage.getItem('prestigeCount');
        if (savedPrestigeCount) this.prestigeCount = parseInt(savedPrestigeCount, 10);

        this.highScoreText = this.add.text(pill3X + 10, cardY + 9, T[l].highscore + formatNumber(this.highScore), { fontFamily: FONT_FAMILY, fontSize: '13px', fill: '#EBEBF5', fontStyle: 'bold' }).setOrigin(0, 0);
        this.setShadow(this.highScoreText, '#aaa', 6);

        this.mergeCountText = this.add.text(pill2X + 10, cardY + 9, T[l].merges + this.mergeCount, { fontFamily: FONT_FAMILY, fontSize: '13px', fill: '#00E5FF', fontStyle: 'bold' }).setOrigin(0, 0);
        this.setShadow(this.mergeCountText, '#00E5FF', 6);

        if (this.prestigeMultiplier > 1.0) {
            this.prestigeText = this.add.text(20, cardY + 45, T[l].prestigeMultiplier + ': ' + this.prestigeMultiplier + 'x', { fontFamily: FONT_FAMILY, fontSize: fontSize, fill: '#ff8800' });
            this.setShadow(this.prestigeText, '#ff8800', 10);
        }

        // Try to load cloud save
        if (player && typeof player.getData === 'function') {
            player.getData(['score', 'highScore', 'grid', 'prestigeMultiplier', 'prestigeCount']).then(data => {
                if (data.highScore) {
                    this.highScore = data.highScore;
                    this.highScoreText.setText(T[getLang()].highscore + formatNumber(this.highScore));
                    localStorage.setItem('cosmic_highscore', this.highScore.toString());
                }
                if (data.prestigeMultiplier) {
                    this.prestigeMultiplier = data.prestigeMultiplier;
                    localStorage.setItem('prestigeMultiplier', this.prestigeMultiplier.toString());
                }
                if (data.prestigeCount) {
                    this.prestigeCount = data.prestigeCount;
                    localStorage.setItem('prestigeCount', this.prestigeCount.toString());
                }
                if (this.prestigeMultiplier > 1.0) {
                    if (this.prestigeText) {
                        this.prestigeText.setText(T[getLang()].prestigeMultiplier + ': ' + this.prestigeMultiplier + 'x');
                    } else {
                        this.prestigeText = this.add.text(20, cardY + 45, T[getLang()].prestigeMultiplier + ': ' + this.prestigeMultiplier + 'x', { fontFamily: FONT_FAMILY, fontSize: fontSize, fill: '#ff8800' });
                        this.setShadow(this.prestigeText, '#ff8800', 10);
                    }
                }
                if (data.score && !this.isDailyChallenge) {
                    this.score = data.score;
                    this.displayScore = data.score;
                    this.scoreText.setText(T[getLang()].score + formatNumber(this.score));
                    const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000];
                    for (let ms of milestones) {
                        if (this.score >= ms) this.passedMilestones.add(ms);
                    }
                }
                if (data.grid && Array.isArray(data.grid) && data.grid.length === this.gridSize && !this.isDailyChallenge) {
                    let valid = true;
                    for (let r = 0; r < this.gridSize; r++) {
                        if (!Array.isArray(data.grid[r]) || data.grid[r].length !== this.gridSize) {
                            valid = false;
                            break;
                        }
                        for (let c = 0; c < this.gridSize; c++) {
                            const t = data.grid[r][c];
                            if (typeof t !== 'number' || t < 0 || t > 7) {
                                valid = false;
                                break;
                            }
                        }
                    }
                    if (valid) {
                        for (let r = 0; r < this.gridSize; r++) {
                            for (let c = 0; c < this.gridSize; c++) {
                                const cell = this.grid[r][c];
                                if (cell.sprite) {
                                    cell.sprite.destroy();
                                    cell.sprite = null;
                                }
                                cell.tier = 0;
                            }
                        }
                        for (let r = 0; r < this.gridSize; r++) {
                            for (let c = 0; c < this.gridSize; c++) {
                                const t = data.grid[r][c];
                                if (t > 0) {
                                    this.upgradeCell(r, c, t, true);
                                }
                            }
                        }
                    }
                }
                if (!this.isDailyChallenge && this.score >= 5000 && !this.prestigeBtnObj) {
                    this.showPrestigeButton();
                }
            }).catch(() => {
                // Ignore error, fallback to localStorage
            });
        }

        // Mute button
        const savedMute = localStorage.getItem('cosmic_muted');
        if (savedMute !== null) {
            this.sound.mute = savedMute === '1';
            isMuted = this.sound.mute;
        }

        const muteText = this.add.text(width - 50, 50, this.sound.mute ? '🔇' : '🔊', { fontSize: '40px' }).setOrigin(0.5).setInteractive();
        muteText.on('pointerdown', () => {
            this.sound.mute = !this.sound.mute;
            isMuted = this.sound.mute; // Keep custom SoundManager in sync
            localStorage.setItem('cosmic_muted', this.sound.mute ? '1' : '0');
            muteText.setText(this.sound.mute ? '🔇' : '🔊');
        });

        // Rewarded Ad Button
        this.rewardedBtnContainer = this.add.container(width/2, 215);
        const btnBg = this.add.image(0, 0, 'button_bg').setOrigin(0.5).setScale(0.95, 0.8);
        const btnText = this.add.text(0, 0, T[getLang()].watch_ad, {
            fontFamily: FONT_FAMILY, fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.setShadow(btnText, '#000', 4);
        this.rewardedBtnContainer.add([btnBg, btnText]);

        btnBg.setInteractive({ useHandCursor: true });
        btnBg.on('pointerdown', () => {
            this.tweens.killTweensOf(this.rewardedBtnContainer);
            this.tweens.add({
                targets: this.rewardedBtnContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                ease: 'Sine.easeIn',
                yoyo: true,
                onComplete: () => {
                    this.showRewardedAd();
                }
            });
        });
        btnBg.on('pointerover', () => {
            this.tweens.add({
                targets: this.rewardedBtnContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        });
        btnBg.on('pointerout', () => {
            this.tweens.add({
                targets: this.rewardedBtnContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        });
        
        this.rewardedBtn = this.rewardedBtnContainer; // Reference for visibility toggling

        // Disable button gracefully if SDK is unavailable
        if (!ysdk || !ysdk.adv || !ysdk.adv.showRewardedVideo) {
            this.rewardedBtn.setVisible(false);
            this.rewardedBtn.setAlpha(0);
        }

        if (this.isDailyChallenge) {
            this.rewardedBtn.setVisible(false);
            const targetText = this.add.text(width / 2, 215, T[getLang()].dailyChallenge + " - Target: 2000", { fontFamily: FONT_FAMILY, fontSize: '20px', fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
            this.setShadow(targetText, '#00ff00', 10);
        } else {
            const todayStr = new Date().toISOString().split('T')[0];
            const lastDaily = localStorage.getItem('lastDailyChallenge');
            if (lastDaily !== todayStr) {
                this.dailyChallengeBtn = this.createStyledButton(width / 2, 270, T[getLang()].dailyChallenge, () => {
                    this.scene.restart({ isDailyChallenge: true });
                });
            }
        }

        this.initGrid();

        this.createBuyButtons();
        this.buyButtons.forEach(btn => {
            btn.hitArea.on('pointerdown', () => {
                const cost = this.getBuyCost(btn.count, btn.discount);
                if (this.score >= cost) {
                    this.score -= cost;
                    this.displayScore = this.score;
                    if (this.scoreText) {
                        this.scoreText.setText(T[getLang()].score + formatNumber(this.score));
                    }
                    this.updateBuyButtons();
                    SoundManager.playClick();

                    let spawned = 0;
                    for (let i = 0; i < btn.count; i++) {
                        if (this.spawnRandom()) {
                            spawned++;
                        }
                    }
                    if (spawned > 0) {
                        this.checkChainReactions(() => {
                            this.endTurn();
                        });
                    }
                }
            });
            btn.hitArea.on('pointerover', () => {
                this.drawBuyBtnBg(btn.bg, true);
            });
            btn.hitArea.on('pointerout', () => {
                this.drawBuyBtnBg(btn.bg, false);
            });
        });
        
        this.particleEmitter = this.add.particles('particle', {
            x: 0, y: 0,
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            emitting: false
        });

        if (ysdk && ysdk.features.GameplayAPI) {
            ysdk.features.GameplayAPI.start();
        }

        if (!localStorage.getItem('alliance_tutorial_done')) {
            this.showTutorialOverlay();
        } else {
            this.checkOfflineIncome();
        }

        this.handleResize({ width: width, height: height });
    }

    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        let fontSize = '28px';
        if (width <= 600) {
            this.cellSize = Math.floor((width - 10) / 6);
            this.gridOffsetY = Math.floor(height * 0.25);
            fontSize = '16px';
        } else {
            this.cellSize = Math.min(125, Math.floor((width - 40) / 6), Math.floor((height - 500) / 6));
            this.gridOffsetY = Math.floor(height * 0.30);
        }

        this.gridOffsetX = (width - (this.gridSize * this.cellSize)) / 2 + (this.cellSize / 2);

        // Update score/high score texts positions (iOS pills)
        const pillGap = this.pillGap || 16;
        const pillW = this.pillW || 200;
        const totalPillW2 = pillW * 3 + pillGap * 2;
        const pillStartX = (width - totalPillW2) / 2;
        const pill2X = pillStartX + pillW + pillGap;
        const pill3X = pillStartX + (pillW + pillGap) * 2;

        if (this.scoreText) {
            this.scoreText.setPosition(pillStartX + 10, this.cardY + 9);
            this.scoreText.setFontSize(13);
        }
        if (this.highScoreText) {
            this.highScoreText.setPosition(pill3X + 10, this.cardY + 9);
            this.highScoreText.setFontSize(13);
        }
        if (this.mergeCountText) {
            this.mergeCountText.setPosition(pill2X + 10, this.cardY + 9);
            this.mergeCountText.setFontSize(13);
        }
        if (this.prestigeText) {
            this.prestigeText.setPosition(20, this.cardY + 45);
            this.prestigeText.setFontSize(parseInt(fontSize));
        }

        // Update grid sprites positions
        if (this.grid) {
            for (let r = 0; r < this.gridSize; r++) {
                if (this.grid[r]) {
                    for (let c = 0; c < this.gridSize; c++) {
                        const cell = this.grid[r][c];
                        if (cell && cell.sprite) {
                            const nx = this.gridOffsetX + c * this.cellSize;
                            const ny = this.gridOffsetY + r * this.cellSize;
                            cell.sprite.setPosition(nx, ny);
                            cell.sprite.setDisplaySize(this.cellSize - 4, this.cellSize - 4);
                        }
                    }
                }
            }
        }

        // Update button positions
        if (this.rewardedBtnContainer) {
            this.rewardedBtnContainer.setPosition(width / 2, 215);
        }
        if (this.dailyChallengeBtn) {
            this.dailyChallengeBtn.setPosition(width / 2, 270);
        }
        if (this.prestigeBtnObj) {
            this.prestigeBtnObj.setPosition(width / 2, 330);
        }

        if (this.buyContainer) {
            this.buyContainer.setPosition(width / 2, this.gridOffsetY + (this.gridSize * this.cellSize) + 40);
        }
    }

    showTutorialOverlay() {
        this.isProcessing = true;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const l = getLang();

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x050510, 0.85);
        overlay.setInteractive(); // block background clicks

        const popup = this.add.container(width/2, height/2);

        const cardBg = this.add.graphics();
        // Outer glow
        cardBg.fillStyle(0x00E5FF, 0.15);
        cardBg.fillRoundedRect(-206, -186, 412, 372, 28);
        // Card body
        cardBg.fillStyle(0x16162E, 0.85);
        cardBg.fillRoundedRect(-200, -180, 400, 360, 24);
        cardBg.lineStyle(1, 0x00E5FF, 0.2);
        cardBg.strokeRoundedRect(-200, -180, 400, 360, 24);

        const titleText = this.add.text(0, -140, T[l].tutorial_title, { fontFamily: FONT_FAMILY, fontSize: '20px', fill: '#00E5FF', fontStyle: '800' }).setOrigin(0.5);
        this.setShadow(titleText, '#00e5ff', 5);

        const stepStyle = { fontFamily: FONT_FAMILY, fontSize: '18px', fill: '#ddd', wordWrap: { width: 360, useAdvancedWrap: true } };

        const s1 = this.add.text(-180, -90, T[l].tutorial_step1, stepStyle).setOrigin(0, 0.5);
        const s2 = this.add.text(-180, -40, T[l].tutorial_step2, stepStyle).setOrigin(0, 0.5);
        const s3 = this.add.text(-180, 10, T[l].tutorial_step3, stepStyle).setOrigin(0, 0.5);
        const s4 = this.add.text(-180, 60, T[l].tutorial_step4, stepStyle).setOrigin(0, 0.5);

        const okBtn = this.createStyledButton(0, 130, T[l].tutorial_ok, () => {
            localStorage.setItem('alliance_tutorial_done', 'true');
            overlay.destroy();
            popup.destroy();
            this.isProcessing = false;
            this.checkOfflineIncome();
        });

        popup.add([cardBg, titleText, s1, s2, s3, s4, okBtn]);
        popup.setDepth(100);
        overlay.setDepth(99);

        popup.setScale(0);
        this.tweens.add({
            targets: popup,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    checkOfflineIncome() {
        const lastActiveStr = localStorage.getItem('cosmic_last_active');
        const now = Date.now();

        if (lastActiveStr && this.score > 100) {
            const lastActive = parseInt(lastActiveStr, 10);
            const diffHours = (now - lastActive) / (1000 * 60 * 60);

            if (diffHours >= 1) {
                // Max 24 hours of offline income
                const hoursToReward = Math.min(diffHours, 24);
                // Rough estimate of earning power based on max tier
                const earningPower = (this.tierPoints[this.maxUnlockedTier] || 10) * 2;
                const offlineEarnings = Math.floor(hoursToReward * earningPower);

                if (offlineEarnings > 0) {
                    this.showOfflinePopup(offlineEarnings);
                }
            }
        }

        localStorage.setItem('cosmic_last_active', now.toString());
    }

    showOfflinePopup(amount) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x050510, 0.7);
        overlay.setInteractive(); // Block clicks

        const popup = this.add.container(width/2, height/2);

        const cardBg = this.add.graphics();
        // Outer glow
        cardBg.fillStyle(0x00E5FF, 0.12);
        cardBg.fillRoundedRect(-156, -106, 312, 212, 28);
        // Card body
        cardBg.fillStyle(0x16162E, 0.85);
        cardBg.fillRoundedRect(-150, -100, 300, 200, 24);
        cardBg.lineStyle(1, 0x00E5FF, 0.2);
        cardBg.strokeRoundedRect(-150, -100, 300, 200, 24);

        const l = getLang();
        const titleText = this.add.text(0, -60, l === 'ru' ? 'ОФФЛАЙН  Д О Х О Д' : 'O F F L I N E   I N C O M E', { fontFamily: FONT_FAMILY, fontSize: '20px', fill: '#00E5FF', fontStyle: '800' }).setOrigin(0.5);
        const amountText = this.add.text(0, -10, '+' + formatNumber(amount), { fontFamily: FONT_FAMILY, fontSize: '36px', fill: '#FFD60A' }).setOrigin(0.5);
        this.setShadow(amountText, '#000', 2);

        const claimBtnBg = this.add.image(0, 50, 'button_bg').setOrigin(0.5).setScale(0.6, 0.5);
        const claimBtnText = this.add.text(0, 50, l === 'ru' ? 'ЗАБРАТЬ' : 'CLAIM', { fontFamily: FONT_FAMILY, fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        popup.add([cardBg, titleText, amountText, claimBtnBg, claimBtnText]);

        popup.setScale(0);
        this.tweens.add({
            targets: popup,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });

        claimBtnBg.setInteractive({ useHandCursor: true });
        claimBtnBg.on('pointerdown', () => {
            this.tweens.add({
                targets: popup,
                scaleX: 0,
                scaleY: 0,
                duration: 300,
                ease: 'Back.easeIn',
                onComplete: () => {
                    overlay.destroy();
                    popup.destroy();
                    this.addScore(amount);
                    this.spawnParticles(width/2, height/2, 0xffd700, 50);
                }
            });
        });
    }

    update() {
        const height = this.cameras.main.height;
        const width = this.cameras.main.width;
        // Scroll star layers
        for (const layer of this.starLayers) {
            layer.container.y += layer.speed;
            if (layer.container.y > height) {
                layer.container.y -= height;
            }
        }

        // Rotate parallax orbits
        if (this.orbitCircles) {
            for (const orb of this.orbitCircles) {
                orb.angle += orb.cfg.speed;
                orb.graphics.clear();
                orb.graphics.lineStyle(1, 0x00E5FF, 0.08);
                orb.graphics.strokeCircle(orb.cfg.x, orb.cfg.y, orb.cfg.radius);
            }
        }

        if (this.displayScore !== this.score) {
            this.displayScore += (this.score - this.displayScore) * 0.1;
            if (Math.abs(this.score - this.displayScore) < 1) {
                this.displayScore = this.score;
            }
            if (this.scoreText) {
                this.scoreText.setText(T[getLang()].score + formatNumber(Math.floor(this.displayScore)));
            }
        }
    }

    setShadow(textObj, color, blur) {
        textObj.setShadow(0, 0, color, blur, true);
    }

    getBuyCost(count, discount) {
        return Math.floor(this.maxUnlockedTier * 50 * count * discount);
    }

    createBuyButtons() {
        this.buyContainer = this.add.container(0, 0);
        this.buyButtons = [];

        const configs = [
            { id: 'buy_x1', text: 'x1', count: 1, discount: 1, xOffset: -120 },
            { id: 'buy_x10', text: 'x10', count: 10, discount: 0.9, xOffset: 0 },
            { id: 'buy_x100', text: 'x100', count: 100, discount: 0.75, xOffset: 120 }
        ];

        configs.forEach(cfg => {
            const btnContainer = this.add.container(cfg.xOffset, 0);

            const bg = this.add.graphics();
            this.drawBuyBtnBg(bg, false);

            const btnText = this.add.text(0, -10, cfg.text, {
                fontFamily: FONT_FAMILY, fontSize: '18px', fill: '#fff', fontStyle: 'bold'
            }).setOrigin(0.5);
            this.setShadow(btnText, '#fff', 5);

            const costText = this.add.text(0, 10, "0", {
                fontFamily: FONT_FAMILY, fontSize: '14px', fill: '#ffd700'
            }).setOrigin(0.5);

            const hitArea = this.add.zone(0, 0, 100, 50).setInteractive({ useHandCursor: true });

            btnContainer.add([bg, btnText, costText, hitArea]);
            this.buyContainer.add(btnContainer);

            this.buyButtons.push({
                container: btnContainer,
                bg: bg,
                costText: costText,
                count: cfg.count,
                discount: cfg.discount,
                hitArea: hitArea
            });
        });
    }

    drawBuyBtnBg(bg, hover) {
        bg.clear();
        if (hover) {
            bg.fillStyle(0x2A2A5A, 0.8);
            bg.lineStyle(1, 0x00E5FF, 0.6);
        } else {
            bg.fillStyle(0x16162E, 0.7);
            bg.lineStyle(1, 0x00E5FF, 0.15);
        }
        bg.fillRoundedRect(-50, -25, 100, 50, 14);
        bg.strokeRoundedRect(-50, -25, 100, 50, 14);
    }

    updateBuyButtons() {
        if (!this.buyButtons) return;

        this.buyButtons.forEach(btn => {
            const cost = this.getBuyCost(btn.count, btn.discount);
            btn.costText.setText(formatNumber(cost));

            if (this.score >= cost) {
                btn.container.setAlpha(1);
            } else {
                btn.container.setAlpha(0.5);
            }
        });
    }

    createStyledButton(x, y, text, onClick) {
        const container = this.add.container(x, y);
        const paddingX = 20;
        const paddingY = 15;

        const btnText = this.add.text(0, 0, text, {
            fontFamily: FONT_FAMILY,
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.setShadow(btnText, '#ffffff', 10);

        const textWidth = btnText.width;
        const textHeight = btnText.height;
        const bgWidth = textWidth + paddingX * 2;
        const bgHeight = textHeight + paddingY * 2;

        const bg = this.add.graphics();
        bg.fillStyle(0x16162E, 0.85);
        bg.fillRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 14);
        bg.lineStyle(1, 0x00E5FF, 0.2);
        bg.strokeRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 14);

        // Interactive hit area
        const hitArea = this.add.zone(0, 0, bgWidth, bgHeight).setInteractive({ useHandCursor: true });

        container.add([bg, btnText, hitArea]);

        hitArea.on('pointerdown', () => {
            this.tweens.killTweensOf(container);
            this.tweens.add({
                targets: container,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                ease: 'Sine.easeIn',
                yoyo: true,
                onComplete: onClick
            });
        });

        hitArea.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: 'Sine.easeOut'
            });
            bg.clear();
            bg.fillStyle(0x2A2A5A, 0.85);
            bg.fillRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 14);
            bg.lineStyle(1, 0x00E5FF, 0.4);
            bg.strokeRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 14);
        });

        hitArea.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Sine.easeOut'
            });
            bg.clear();
            bg.fillStyle(0x16162E, 0.85);
            bg.fillRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 14);
            bg.lineStyle(1, 0x00E5FF, 0.2);
            bg.strokeRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 14);
        });

        return container;
    }

    showBanner(message) {
        const width = this.cameras.main.width;

        const bannerContainer = this.add.container(width/2, -100);
        bannerContainer.setDepth(100); // Ensure it's on top

        const bgWidth = Math.min(width - 40, 400);
        const bgHeight = 60;

        const bg = this.add.graphics();
        bg.fillStyle(0x16162E, 0.85);
        bg.fillRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 20);
        bg.lineStyle(1, 0xBF5AF2, 0.3);
        bg.strokeRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 20);

        const text = this.add.text(0, 0, message, {
            fontFamily: FONT_FAMILY,
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.setShadow(text, '#ffffff', 10);

        bannerContainer.add([bg, text]);

        // Slide down
        this.tweens.add({
            targets: bannerContainer,
            y: 80,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Wait 3 seconds, then slide back up
                this.time.delayedCall(3000, () => {
                    this.tweens.add({
                        targets: bannerContainer,
                        y: -100,
                        duration: 500,
                        ease: 'Back.easeIn',
                        onComplete: () => bannerContainer.destroy()
                    });
                });
            }
        });
    }

    drawBackground() {
        if (!this.bgRect) return;
        this.bgRect.clear();
        // iOS deep space black
        this.bgRect.fillStyle(0x050510, 1);
        this.bgRect.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    }

    drawProgressBar(width, progressRatio) {
        const barWidth = width - 40;
        const barHeight = 6;
        const x = 20;
        const y = 160;

        this.progressBg.clear();
        this.progressBg.fillStyle(0x16162E, 0.6);
        this.progressBg.fillRoundedRect(x, y, barWidth, barHeight, 3);
        this.progressBg.lineStyle(0.5, 0xFFFFFF, 0.06);
        this.progressBg.strokeRoundedRect(x, y, barWidth, barHeight, 3);

        this.progressBar.clear();
        if (progressRatio > 0) {
            this.progressBar.fillStyle(0x00E5FF, 1);
            this.progressBar.fillRoundedRect(x, y, barWidth * progressRatio, barHeight, 3);
            // glow effect
            this.progressBar.lineStyle(3, 0x00E5FF, 0.3);
            this.progressBar.strokeRoundedRect(x, y, barWidth * progressRatio, barHeight, 3);
        }
    }

    updateBackgroundGradient() {
        // iOS style — deep space black stays constant, no gradient shift
        if (this.bgRect) {
            this.bgRect.clear();
            this.bgRect.fillStyle(0x050510, 1);
            this.bgRect.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
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
                    this.doublePointsTurns = 1;
                    this.rewardedBtn.setVisible(false);
                },
                onClose: () => {
                    isMuted = false;
                }, 
                onError: (e) => {
                    // silent fallback
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
        if (player && !this.isDailyChallenge) {
            let gridData = this.grid.map(row => row.map(c => c.tier));
            player.setData({
                score: this.score,
                highScore: this.highScore,
                grid: gridData,
                prestigeMultiplier: this.prestigeMultiplier,
                prestigeCount: this.prestigeCount
            }).catch(e => { /* silent fallback */ });
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

        this.resetHintTimer();
    }

    resetHintTimer() {
        if (this.hintTimer) {
            this.hintTimer.destroy();
        }
        this.clearHints();
        this.hintTimer = this.time.delayedCall(10000, () => this.showHint());
    }

    clearHints() {
        for (const tween of this.hintTweens) {
            if (tween.targets && tween.targets[0]) {
                tween.targets[0].alpha = 1;
            }
            tween.stop();
        }
        this.hintTweens = [];
    }

    showHint() {
        if (this.isProcessing || this.selectedCell) return;

        let hintFound = false;
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = this.grid[r][c];
                if (cell.tier > 0 && cell.tier < 7) {
                    if (c < this.gridSize - 1 && this.grid[r][c+1].tier === cell.tier) {
                        this.addHintTween(cell.sprite);
                        this.addHintTween(this.grid[r][c+1].sprite);
                        hintFound = true;
                        break;
                    }
                    if (r < this.gridSize - 1 && this.grid[r+1][c].tier === cell.tier) {
                        this.addHintTween(cell.sprite);
                        this.addHintTween(this.grid[r+1][c].sprite);
                        hintFound = true;
                        break;
                    }
                }
            }
            if (hintFound) break;
        }
    }

    addHintTween(sprite) {
        if (!sprite) return;
        const tween = this.tweens.add({
            targets: sprite,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.hintTweens.push(tween);
    }

    handleCellClick(row, col) {
        if (this.isProcessing) return;
        
        this.resetHintTimer();

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
        if (cell.tier > 0 && cell.tier < 7 && cell.tier === selCell.tier && (row !== this.selectedCell.row || col !== this.selectedCell.col)) {
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
        } else if (cell.tier === 0) {
            // Move to empty cell
            this.isProcessing = true;

            this.deselect();

            const targetX = this.gridOffsetX + col * this.cellSize;
            const targetY = this.gridOffsetY + row * this.cellSize;

            this.tweens.add({
                targets: selCell.sprite,
                x: targetX,
                y: targetY,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    cell.tier = selCell.tier;
                    cell.sprite = selCell.sprite;

                    selCell.tier = 0;
                    selCell.sprite = null;

                    SoundManager.playClick();
                    this.endTurn();
                }
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

    checkScoreAchievements() {
        const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000];
        for (let i = 0; i < milestones.length; i++) {
            const ms = milestones[i];
            if (this.score >= ms && !this.passedMilestones.has(ms)) {
                this.passedMilestones.add(ms);
                this.showBanner(T[getLang()].achievement + ": " + T[getLang()].score_milestone + ms);
            }
        }
    }

    doMerge(r1, c1, r2, c2, tier, callback) {
        const sprite1 = this.grid[r1][c1].sprite;
        const sprite2 = this.grid[r2][c2].sprite;
        const targetX = this.gridOffsetX + c2 * this.cellSize;
        const targetY = this.gridOffsetY + r2 * this.cellSize;
        
        this.grid[r1][c1].tier = 0;
        this.grid[r1][c1].sprite = null;
        
        const nextTier = Math.min(tier + 1, 7);
        
        SoundManager.playMerge(nextTier);
        
        // Target cell anticipation squash
        if (sprite2) {
            this.tweens.add({
                targets: sprite2,
                scaleX: 1.2,
                scaleY: 0.8,
                duration: 100,
                ease: 'Sine.easeInOut',
                yoyo: true
            });
        }

        this.tweens.add({
            targets: sprite1,
            x: targetX,
            y: targetY,
            scaleX: 0.8, // stretch while moving
            scaleY: 1.2,
            duration: 200,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                sprite1.destroy();
                this.upgradeCell(r2, c2, nextTier);
                
                // Score
                let multiplier = this.comboMultiplier;
                if (this.doublePointsActive) {
                    multiplier *= 2;
                }
                if (this.prestigeMultiplier > 1.0) {
                    multiplier *= this.prestigeMultiplier;
                }
                const pts = Math.floor(this.tierPoints[nextTier] * multiplier);
                this.addScore(pts);
                this.showFloatingText(targetX, targetY - 20, `+${pts}`, this.tierColors[nextTier]);
                
                this.mergeCount++;
                if (this.mergeCountText) {
                    this.mergeCountText.setText(T[getLang()].merges + this.mergeCount);
                }

                if (this.mergeCount % 10 === 0) {
                    this.showInterstitialAd();
                }

                if (callback) callback();
            }
        });
    }

    upgradeCell(r, c, tier, isLoad = false) {
        const cell = this.grid[r][c];
        if (cell.sprite) {
            this.tweens.killTweensOf(cell.sprite);
            cell.sprite.destroy();
        }
        
        cell.tier = tier;
        if (tier > this.maxUnlockedTier) {
            this.maxUnlockedTier = tier;
            if (!isLoad) {
                this.showConfetti();
                this.showBanner(T[getLang()].achievement + ": " + T[getLang()].unlocked_tier + tier);
            }
        }

        const x = this.gridOffsetX + c * this.cellSize;
        const y = this.gridOffsetY + r * this.cellSize;
        
        cell.sprite = this.add.image(x, y, `tier_${tier}`);
        
        // Pop effect with elastic bounce
        cell.sprite.setScale(0);
        this.tweens.add({
            targets: cell.sprite,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Idle pulse for all tiers
                if (cell.sprite) {
                    this.tweens.add({
                        targets: cell.sprite,
                        scaleX: 1.03,
                        scaleY: 1.03,
                        duration: 1500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        });
        
        this.spawnParticles(x, y, this.tierColors[tier]);
    }

    spawnParticles(x, y, color, count = 15) {
        if (!this.particleEmitter) return;
        this.particleEmitter.setPosition(x, y);
        this.particleEmitter.setTint(color);
        this.particleEmitter.explode(count);

        // Camera shake on big merges
        const colorIndex = this.tierColors.indexOf(color);
        if (colorIndex >= 5) {
            this.cameras.main.shake(150, 0.01 * (colorIndex - 4));
        }
    }

    showFloatingText(x, y, text, color) {
        const t = this.add.text(x, y, text, {
            fontFamily: FONT_FAMILY, fontSize: '28px',
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
            this.comboMultiplier = Math.min(this.comboMultiplier + 1, 5);
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
        if (this.doublePointsActive) {
            this.doublePointsTurns--;
            if (this.doublePointsTurns <= 0) {
                this.doublePointsActive = false;
                if (this.rewardedBtn) this.rewardedBtn.setVisible(true);
            }
        }

        // Spawn new items
        const numToSpawn = this.rng.integerInRange(1, 2);
        let spawned = 0;
        for (let i = 0; i < numToSpawn; i++) {
            if (this.spawnRandom()) spawned++;
        }
        
        this.saveCloudData();

        if (this.getEmptyCells().length === 0 && !this.hasPossibleMerges()) {
            this.gameOver();
            return;
        }
        
        this.isProcessing = false;
        this.resetHintTimer();
        localStorage.setItem('cosmic_last_active', Date.now().toString());
    }

    hasPossibleMerges() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = this.grid[r][c];
                if (cell.tier > 0 && cell.tier < 7) {
                    if (c < this.gridSize - 1 && this.grid[r][c+1].tier === cell.tier) return true;
                    if (r < this.gridSize - 1 && this.grid[r+1][c].tier === cell.tier) return true;
                }
            }
        }
        return false;
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
        
        const target = this.rng.pick(empty);
        
        // Weighted random tier (mostly 1 and 2)
        const rand = this.rng.frac();
        let tier = 1;
        if (rand > 0.8) tier = 2;
        if (rand > 0.95) tier = 3;
        
        this.upgradeCell(target.r, target.c, tier);
        return true;
    }

    addScore(pts) {
        this.score += pts;

        if (!this.isDailyChallenge && this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText(T[getLang()].highscore + formatNumber(this.highScore));
            localStorage.setItem('cosmic_highscore', this.highScore.toString());
        }

        if (this.isDailyChallenge && this.score >= 2000 && !this.dailyChallengeCompleted) {
            this.dailyChallengeCompleted = true;
            this.showDailyChallengeComplete();
        }

        if (!this.isDailyChallenge && this.score >= 5000 && !this.prestigeBtnObj) {
            this.showPrestigeButton();
        }

        this.updateBackgroundGradient();
        this.updateProgressIndicator();
        this.checkScoreAchievements();
        this.updateBuyButtons();
    }

    showPrestigeButton() {
        const width = this.cameras.main.width;
        this.prestigeBtnObj = this.createStyledButton(width / 2, 330, T[getLang()].prestige, () => {
            this.showPrestigeConfirm();
        });
    }

    showPrestigeConfirm() {
        this.isProcessing = true;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const l = getLang();

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x050510, 0.85);
        overlay.setInteractive();

        const popup = this.add.container(width/2, height/2);

        const cardBg = this.add.graphics();
        // Outer glow
        cardBg.fillStyle(0xFF375F, 0.1);
        cardBg.fillRoundedRect(-206, -126, 412, 252, 28);
        // Card body
        cardBg.fillStyle(0x16162E, 0.85);
        cardBg.fillRoundedRect(-200, -120, 400, 240, 24);
        cardBg.lineStyle(1, 0xFF375F, 0.2);
        cardBg.strokeRoundedRect(-200, -120, 400, 240, 24);

        const titleText = this.add.text(0, -70, T[l].prestige, { fontFamily: FONT_FAMILY, fontSize: '28px', fill: '#ff8800', fontStyle: 'bold' }).setOrigin(0.5);
        this.setShadow(titleText, '#ff8800', 5);

        const confirmStyle = { fontFamily: FONT_FAMILY, fontSize: '20px', fill: '#ddd', wordWrap: { width: 360, useAdvancedWrap: true }, align: 'center' };
        const confirmText = this.add.text(0, -10, T[l].prestigeConfirm, confirmStyle).setOrigin(0.5);

        const nextMult = this.prestigeMultiplier + 0.5;
        const rewardText = this.add.text(0, 30, T[l].prestigeMultiplier + ": " + nextMult + "x", { fontFamily: FONT_FAMILY, fontSize: '22px', fill: '#ffd700' }).setOrigin(0.5);

        const okBtn = this.createStyledButton(-80, 80, T[l].tutorial_ok, () => {
            this.prestigeMultiplier += 0.5;
            this.prestigeCount++;
            this.score = 0;
            // Highscore is preserved, but we reset grid
            localStorage.setItem('prestigeMultiplier', this.prestigeMultiplier.toString());
            localStorage.setItem('prestigeCount', this.prestigeCount.toString());

            // clear grid from save
            let emptyGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
            if (player) {
                player.setData({
                    prestigeMultiplier: this.prestigeMultiplier,
                    prestigeCount: this.prestigeCount,
                    score: this.score,
                    grid: emptyGrid
                }).catch(() => {});
            }

            this.showConfetti();
            popup.destroy();
            overlay.destroy();
            this.time.delayedCall(2000, () => {
                this.scene.restart();
            });
        });

        // Cancel button
        const cancelBtnContainer = this.add.container(80, 80);
        const btnText = this.add.text(0, 0, "X", { fontFamily: FONT_FAMILY, fontSize: '20px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        const btnHit = this.add.zone(0, 0, 100, 50).setInteractive({ useHandCursor: true });
        cancelBtnContainer.add([btnText, btnHit]);

        btnHit.on('pointerdown', () => {
            overlay.destroy();
            popup.destroy();
            this.isProcessing = false;
        });

        popup.add([cardBg, titleText, confirmText, rewardText, okBtn, cancelBtnContainer]);
        popup.setDepth(100);
        overlay.setDepth(99);

        popup.setScale(0);
        this.tweens.add({
            targets: popup,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    showConfetti() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800];

        for (let i = 0; i < 100; i++) {
            const color = Phaser.Utils.Array.GetRandom(colors);
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(-100, -10);

            const rect = this.add.graphics();
            rect.fillStyle(color, 1);
            rect.fillRect(-5, -10, 10, 20);
            rect.setPosition(x, y);
            rect.setDepth(150);

            const duration = Phaser.Math.Between(2000, 4000);

            this.tweens.add({
                targets: rect,
                y: height + 50,
                x: x + Phaser.Math.Between(-100, 100),
                rotation: Phaser.Math.FloatBetween(0, Math.PI * 4),
                duration: duration,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    rect.destroy();
                }
            });
        }
    }

    showDailyChallengeComplete() {
        this.isProcessing = true;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const l = getLang();

        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem('lastDailyChallenge', todayStr);

        // Bonus points added to normal high score logic
        const bonusPts = 5000;

        let savedScore = localStorage.getItem('cosmic_highscore');
        let newHighScore = savedScore ? parseInt(savedScore, 10) : 0;
        newHighScore += bonusPts;
        localStorage.setItem('cosmic_highscore', newHighScore.toString());
        if (player) {
            player.setData({ highScore: newHighScore }).catch(() => {});
        }

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x050510, 0.85);
        overlay.setInteractive();

        const popup = this.add.container(width/2, height/2);

        const cardBg = this.add.graphics();
        // Outer glow
        cardBg.fillStyle(0x00ff00, 0.08);
        cardBg.fillRoundedRect(-186, -126, 372, 252, 28);
        // Card body
        cardBg.fillStyle(0x16162E, 0.85);
        cardBg.fillRoundedRect(-180, -120, 360, 240, 24);
        cardBg.lineStyle(1, 0x00ff00, 0.2);
        cardBg.strokeRoundedRect(-180, -120, 360, 240, 24);

        const titleText = this.add.text(0, -70, T[l].dailyChallenge, { fontFamily: FONT_FAMILY, fontSize: '28px', fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
        this.setShadow(titleText, '#00ff00', 5);

        const rewardText = this.add.text(0, -10, T[l].dailyReward + ": +" + bonusPts, { fontFamily: FONT_FAMILY, fontSize: '22px', fill: '#ffd700' }).setOrigin(0.5);

        const okBtn = this.createStyledButton(0, 60, T[l].tutorial_ok, () => {
            this.scene.restart(); // Back to normal mode
        });

        popup.add([cardBg, titleText, rewardText, okBtn]);
        popup.setDepth(100);
        overlay.setDepth(99);

        popup.setScale(0);
        this.tweens.add({
            targets: popup,
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });

        this.spawnParticles(width/2, height/2, 0x00ff00, 50);
    }

    updateProgressIndicator() {
        const nextTier = Math.min(this.maxUnlockedTier + 1, 7);
        const ptsNeeded = (this.tierPoints[nextTier] || 1000) * 10; // arbitrary heuristic for visual progress

        // Simple heuristic: how many merges towards the next big point milestone
        let currentTierProgress = this.score % ptsNeeded;
        let ratio = currentTierProgress / ptsNeeded;
        if (this.maxUnlockedTier === 7) ratio = 1;

        // Ensure ratio only goes up smoothly, avoiding weird jumps backwards within a tier unless it wrapped around
        if (ratio < this.currentProgressRatio && this.currentProgressRatio > 0.9) {
            this.currentProgressRatio = 0; // Wrap around safely
        }

        this.tweens.killTweensOf(this, 'currentProgressRatio');
        this.tweens.add({
            targets: this,
            currentProgressRatio: ratio,
            duration: 300,
            ease: 'Power2',
            onUpdate: () => {
                this.drawProgressBar(this.cameras.main.width, this.currentProgressRatio);
            }
        });
    }

    gameOver() {
        SoundManager.playGameOver();
        
        if (ysdk && ysdk.features.GameplayAPI) {
            ysdk.features.GameplayAPI.stop();
        }

        if (leaderboard && !this.isDailyChallenge) {
            ysdk.isAvailableMethod('leaderboards.setLeaderboardScore').then(available => {
                if (available) {
                    leaderboard.setLeaderboardScore('MainBoard', this.score);
                }
            });
        }
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x050510, 0.85);
        const l = getLang();
        const goText = this.add.text(width/2, height/2 - 100, T[l].game_over, {
            fontFamily: FONT_FAMILY, fontSize: '48px',
            fill: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.setShadow(goText, '#000', 5);
        
        const scoreText = this.add.text(width/2, height/2 - 30, T[l].score_go + formatNumber(this.score), {
            fontFamily: FONT_FAMILY, fontSize: '36px',
            fill: '#fff'
        }).setOrigin(0.5);
        this.setShadow(scoreText, '#000', 3);

        // Game Over Animation
        goText.setScale(0);
        this.tweens.add({
            targets: goText,
            scaleX: 1,
            scaleY: 1,
            duration: 800,
            ease: 'Elastic.easeOut'
        });

        // Periodic fireworks on Game Over
        this.time.addEvent({
            delay: 800,
            loop: true,
            callback: () => {
                if (!this.scene.isActive()) return;
                const fx = Phaser.Math.Between(100, width - 100);
                const fy = Phaser.Math.Between(100, height - 100);
                const color = Phaser.Utils.Array.GetRandom(this.tierColors.slice(2));
                this.spawnParticles(fx, fy, color, 30);
            }
        });

        const restartBtnContainer = this.add.container(width/2, height/2 + 80);
        const btnBg = this.add.image(0, 0, 'button_bg').setOrigin(0.5).setScale(1.1, 0.9);
        const btnText = this.add.text(0, 0, T[l].play_again, {
            fontSize: '32px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.setShadow(btnText, '#000', 4);
        restartBtnContainer.add([btnBg, btnText]);
        
        restartBtnContainer.setAlpha(0);
        this.tweens.add({
            targets: restartBtnContainer,
            alpha: 1,
            y: height/2 + 100,
            duration: 500,
            delay: 1000,
            ease: 'Power2'
        });

        btnBg.setInteractive({ useHandCursor: true });
        btnBg.on('pointerdown', () => {
            this.tweens.killTweensOf(restartBtnContainer);
            this.tweens.add({
                targets: restartBtnContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                ease: 'Sine.easeIn',
                yoyo: true,
                onComplete: () => {
                    this.scene.restart();
                }
            });
        });
        btnBg.on('pointerover', () => {
            this.tweens.add({
                targets: restartBtnContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        });
        btnBg.on('pointerout', () => {
            this.tweens.add({
                targets: restartBtnContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        });
    }
}

const windowRatio = window.innerHeight / window.innerWidth;
const baseWidth = 800;
const dynamicHeight = Math.max(1200, Math.floor(baseWidth * windowRatio));

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: baseWidth,
        height: dynamicHeight
    },
    transparent: true,
    scene: [BootScene, MainScene]
};

const game = new Phaser.Game(config);

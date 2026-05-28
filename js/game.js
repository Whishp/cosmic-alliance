document.addEventListener('DOMContentLoaded', function() {

// ========== LOCALIZATION ==========
const T = {
  ru: {
    title: 'КОСМИЧЕСКИЙ АЛЬЯНС',
    score: 'СЧЁТ', merges: 'СЛИЯНИЯ', highscore: 'РЕКОРД',
    watch_ad: 'Реклама 2x', dailyChallenge: 'Ежедневный', prestige: 'Престиж',
    prestigeMultiplier: 'МНОЖИТЕЛЬ', prestigeConfirm: 'Сбросить прогресс ради множителя очков?',
    tutorial_title: 'КАК ИГРАТЬ',
    tutorial_step1: '1. Нажмите на фишку, чтобы выбрать',
    tutorial_step2: '2. Нажмите на такую же фишку для слияния',
    tutorial_step3: '3. Объединяйте для получения большего числа очков',
    tutorial_step4: '4. Нажмите на пустую клетку для перемещения',
    tutorial_ok: 'ПОНЯТНО',
    game_over: 'ИГРА ОКОНЧЕНА', play_again: 'ИГРАТЬ СНОВА',
    score_go: 'Счёт: ',
    achievement: 'ДОСТИЖЕНИЕ', unlocked_tier: 'Открыт уровень: ', score_milestone: 'Счет достигнут: ',
    dailyReward: 'Награда', offline_income: 'ОФФЛАЙН  Д О Х О Д', claim: 'ЗАБРАТЬ',
    insufficient: 'НЕДОСТАТОЧНО', need: 'Нужно ',
    prestige_done: 'Теперь доход x', ok: 'ОК', cool: 'КРУТО',
    tab_game: 'Игра', tab_records: 'Рекорды', tab_upgrades: 'Апгрейды',
    buy_spawn: 'Появить',
    remove_ads: 'Без рекламы',
    record_highscore: 'Лучший счёт',
    record_total_merges: 'Всего слияний',
    record_max_tier: 'Макс. уровень'
  },
  en: {
    title: 'COSMIC ALLIANCE',
    score: 'SCORE', merges: 'MERGES', highscore: 'BEST',
    watch_ad: 'Ad 2x', dailyChallenge: 'Daily', prestige: 'Prestige',
    prestigeMultiplier: 'MULTIPLIER', prestigeConfirm: 'Reset progress for a score multiplier?',
    tutorial_title: 'HOW TO PLAY',
    tutorial_step1: '1. Tap a piece to select',
    tutorial_step2: '2. Tap matching piece to merge',
    tutorial_step3: '3. Merge higher tiers for more points',
    tutorial_step4: '4. Tap empty cell to move selected piece',
    tutorial_ok: 'OK',
    game_over: 'GAME OVER', play_again: 'PLAY AGAIN',
    score_go: 'Score: ',
    achievement: 'ACHIEVEMENT', unlocked_tier: 'Unlocked Tier: ', score_milestone: 'Score Milestone: ',
    dailyReward: 'Reward', offline_income: 'OFFLINE  INCOME', claim: 'CLAIM',
    insufficient: 'INSUFFICIENT', need: 'Need ',
    prestige_done: 'Now income x', ok: 'OK', cool: 'AWESOME',
    tab_game: 'Game', tab_records: 'Records', tab_upgrades: 'Upgrades',
    buy_spawn: 'Spawn',
    remove_ads: 'No Ads',
    record_highscore: 'Top Score',
    record_total_merges: 'Total Merges',
    record_max_tier: 'Highest Tier'
  }
};

// ========== YANDEX SDK ==========
let ysdk = null;
let player = null;
let leaderboardApi = null;
let payments = null;
let noAdsPurchased = false;

function getLang() {
  if (typeof ysdk !== 'undefined' && ysdk && ysdk.environment && ysdk.environment.i18n && ysdk.environment.i18n.lang === 'en') return 'en';
  const nav = navigator.language || navigator.userLanguage || 'ru';
  return nav.startsWith('en') ? 'en' : 'ru';
}

function t(key) { return T[lang][key] || T['ru'][key] || key; }

let lang = getLang();

function applyLocalization() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (T[lang] && T[lang][key]) el.textContent = T[lang][key];
    else if (T['ru'][key]) el.textContent = T['ru'][key];
  });
  document.documentElement.lang = lang === 'en' ? 'en' : 'ru';
  document.title = t('title');
}

function initYandexSDK() {
  return new Promise((resolve) => {
    if (typeof YaGames === 'undefined') { resolve(); return; }
    YaGames.init().then(_ysdk => {
      ysdk = _ysdk;
      if (ysdk.features && ysdk.features.LoadingAPI) ysdk.features.LoadingAPI.ready();
      let p1 = ysdk.getPlayer().then(_p => { player = _p; }).catch(() => {});
      let p2 = ysdk.getLeaderboards().then(_lb => { leaderboardApi = _lb; }).catch(() => {});
      let p3 = ysdk.getPayments({signed: true}).then(_payments => {
        payments = _payments;
        return payments.getPurchases();
      }).then(purchases => {
        if (purchases && purchases.some(p => p.productID === 'no_ads')) {
          noAdsPurchased = true;
        }
      }).catch(() => {});
      Promise.all([p1, p2, p3]).then(() => resolve());
    }).catch(() => resolve());
  });
}

// ========== AUDIO ==========
let audioCtx = null;
let isMuted = false;

const Sound = {
  _resumePromise: null,
  initCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      if (!this._resumePromise) this._resumePromise = audioCtx.resume().catch(() => {});
      return this._resumePromise;
    }
    return Promise.resolve();
  },
  tone(freq, type, dur, vol) {
    if (isMuted) return;
    const play = () => {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + dur);
    };
    if (audioCtx && audioCtx.state === 'running') { play(); return; }
    this.initCtx().then(play);
  },
  click() { this.tone(400, 'sine', 0.1, 0.05); },
  merge(tier) { this.tone(300 + tier * 100, 'triangle', 0.2, 0.1); },
  combo(c) { this.tone(400 + c * 150, 'square', 0.15, 0.05); },
  gameOver() {
    if (isMuted) return;
    const play = () => {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 1.5);
    };
    if (audioCtx && audioCtx.state === 'running') { play(); return; }
    this.initCtx().then(play);
  }
};

// ========== SEEDED RNG (for daily challenge) ==========
class SeededRNG {
  constructor(seed) { this.seed = seed; }
  next() {
    let x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  integerInRange(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick(arr) { return arr[this.integerInRange(0, arr.length - 1)]; }
}

// ========== GAME STATE ==========
const BOARD_SIZE = 5;
const MAX_TIER = 15; // 0-based, so 16 tiers total
const TIERS = ['🌑','🌒','🌓','🌔','🌕','☀️','⭐','🌟','💫','✨','🔥','💎','👑','🪐','🌌','🌀'];
const COLORS = ['#444','#666','#888','#aaa','#FFD60A','#FF9F0A','#FF375F','#BF5AF2','#7B2CBF','#0A84FF','#5AC8FA','#30D158','#FF453A','#FFD60A','#BF5AF2','#0A84FF'];
const TIER_POINTS = [0, 10, 30, 90, 270, 810, 2430, 7290, 21870, 65610, 196830, 590490, 1771470, 5314410, 15943230, 47829690];

let board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
let selected = null;
let score = 0, merges = 0, highscore = 0, dailyScore = 0;
let prestigeLevel = 0, prestigeMultiplier = 1.0;
let maxUnlockedTier = 3;
let doublePointsActive = false;
let isProcessing = false;
let lastInterstitialTime = 0;
let comboMultiplier = 1;
let isDailyChallenge = false;
let dailyChallengeCompleted = false;
let passedMilestones = new Set();
let hintTimer = null;
let rng = null;
let isGameOver = false;

// ========== SAVE / LOAD ==========
function saveGame() {
  const data = {
    board, score, merges, highscore, prestigeLevel, prestigeMultiplier,
    maxUnlockedTier, passedMilestones: Array.from(passedMilestones)
  };
  localStorage.setItem('alliance_save', JSON.stringify(data));
  localStorage.setItem('cosmic_last_active', Date.now().toString());
  saveCloudData();
}

function loadGame() {
  const s = localStorage.getItem('alliance_save');
  if (s) {
    try {
      const d = JSON.parse(s);
      board = d.board || board;
      score = d.score || 0;
      merges = d.merges || 0;
      highscore = d.highscore || 0;
      prestigeLevel = d.prestigeLevel || 0;
      prestigeMultiplier = d.prestigeMultiplier || (1 + prestigeLevel * 0.5);
      maxUnlockedTier = d.maxUnlockedTier || 3;
      if (d.passedMilestones) passedMilestones = new Set(d.passedMilestones);
    } catch(e) {}
  }
  // Load from separate keys (legacy Phaser version) — only override if higher
  const hs = localStorage.getItem('cosmic_highscore');
  if (hs) highscore = Math.max(highscore, parseInt(hs, 10));
  const pm = localStorage.getItem('prestigeMultiplier');
  if (pm) prestigeMultiplier = Math.max(prestigeMultiplier, parseFloat(pm));
  const pc = localStorage.getItem('prestigeCount');
  if (pc) prestigeLevel = Math.max(prestigeLevel, parseInt(pc, 10));

  // Muted state
  const m = localStorage.getItem('cosmic_muted');
  if (m !== null) isMuted = m === '1';
  updateMuteButton();
}

function saveCloudData() {
  if (player && !isDailyChallenge) {
    const gridData = board.map(row => row.map(c => c === null ? 0 : c + 1)); // convert null to 0, tier index to 1-based
    player.setData({
      score, highScore: highscore, grid: gridData,
      prestigeMultiplier, prestigeCount: prestigeLevel
    }).catch(() => {});
  }
}

function loadCloudData() {
  if (player && typeof player.getData === 'function' && !isDailyChallenge) {
    player.getData(['score', 'highScore', 'grid', 'prestigeMultiplier', 'prestigeCount']).then(data => {
      if (data.highScore && data.highScore > highscore) {
        highscore = data.highScore;
        localStorage.setItem('cosmic_highscore', highscore.toString());
        updateHUD();
      }
      if (data.prestigeMultiplier) {
        prestigeMultiplier = data.prestigeMultiplier;
        localStorage.setItem('prestigeMultiplier', prestigeMultiplier.toString());
      }
      if (data.prestigeCount) {
        prestigeLevel = data.prestigeCount;
        localStorage.setItem('prestigeCount', prestigeLevel.toString());
      }
      if (data.prestigeMultiplier > 1.0 || prestigeLevel > 0) {
        document.getElementById('prestige-hud').style.display = '';
      }
      updateHUD();
    }).catch(() => {});
  }
}

// ========== FORMAT ==========
function format(n) {
  if (!isFinite(n) || isNaN(n)) return 'INF';
  if (n >= 1e12) return (n/1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// ========== BOARD ==========
function getTier() {
  // Weighted spawn: mostly low tiers, occasional higher
  if (isDailyChallenge) {
    const r = rng.next();
    if (r > 0.9) return 2;
    return 1;
  }
  const r = Math.random();
  if (r > 0.95) return 3;
  if (r > 0.8) return 2;
  return 1;
}

function getEmptyCells() {
  const empty = [];
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (board[r][c] === null) empty.push({r, c});
  return empty;
}

function spawnRandom() {
  const empty = getEmptyCells();
  if (empty.length === 0) return false;
  let target;
  if (isDailyChallenge && rng) {
    target = rng.pick(empty);
  } else {
    target = empty[Math.floor(Math.random() * empty.length)];
  }
  const tier = getTier();
  board[target.r][target.c] = tier;
  return true;
}

function hasPossibleMerges() {
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      const tier = board[r][c];
      if (tier !== null && tier < MAX_TIER) {
        if (c < BOARD_SIZE - 1 && board[r][c+1] === tier) return true;
        if (r < BOARD_SIZE - 1 && board[r+1][c] === tier) return true;
      }
    }
  return false;
}

function initBoard() {
  board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  // Fill ~70% with random starting pieces
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (isDailyChallenge ? rng.next() < 0.7 : Math.random() < 0.7)
        board[r][c] = getTier();
  renderBoard();
  updateHUD();
  saveGame();
}

// ========== RENDERING ==========
function renderBoard() {
  const el = document.getElementById('board');
  if (!el) return;
  el.innerHTML = '';
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement('div');
      const tier = board[r][c];
      const isSelected = selected && selected.r === r && selected.c === c;
      cell.className = 'cell' + (tier === null ? ' empty' : '') + (isSelected ? ' selected' : '');
      if (tier !== null) {
        cell.style.borderColor = COLORS[tier] + '40';
        cell.style.boxShadow = `0 0 15px ${COLORS[tier]}20, inset 0 0 20px ${COLORS[tier]}10`;
        cell.innerHTML = `${TIERS[tier]}<span class="tier-label">T${tier+1}</span>`;
      }
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.addEventListener('pointerdown', () => handleCell(r, c));
      el.appendChild(cell);
    }
  }
  updateBuyButtons();
}

// ========== RECORDS ==========
function renderRecords() {
  const recHigh = document.getElementById('rec-highscore');
  const recMerges = document.getElementById('rec-merges');
  const recTier = document.getElementById('rec-tier');

  if (recHigh) recHigh.textContent = format(highscore);
  if (recMerges) recMerges.textContent = format(merges);
  if (recTier) {
    if (maxUnlockedTier >= 0 && maxUnlockedTier < TIERS.length) {
      recTier.textContent = `${TIERS[maxUnlockedTier]} (T${maxUnlockedTier + 1})`;
    } else {
      recTier.textContent = '-';
    }
  }
}

// ========== HUD ==========
function updateHUD() {
  const scoreEl = document.getElementById('score');
  const mergesEl = document.getElementById('merges');
  const highEl = document.getElementById('highscore');
  const prestEl = document.getElementById('prestige-mult');
  if (scoreEl) scoreEl.textContent = format(score);
  if (mergesEl) mergesEl.textContent = merges;
  if (highEl) highEl.textContent = format(highscore);
  if (prestEl) prestEl.textContent = prestigeMultiplier.toFixed(1) + 'x';
  // Show prestige hud if relevant
  if (prestigeMultiplier > 1.0 || prestigeLevel > 0) {
    const phud = document.getElementById('prestige-hud');
    if (phud) phud.style.display = '';
  }
  // Daily challenge button visibility
  const dailyBtn = document.getElementById('btn-daily');
  if (dailyBtn) {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDaily = localStorage.getItem('lastDailyChallenge');
    if (isDailyChallenge || lastDaily === todayStr) dailyBtn.style.display = 'none';
    else dailyBtn.style.display = '';
  }
}

// ========== PROGRESS BAR ==========
function updateProgressBar() {
  const fill = document.getElementById('progress-bar-fill');
  if (!fill) return;
  const nextTier = Math.min(maxUnlockedTier + 1, MAX_TIER);
  const ptsNeeded = (TIER_POINTS[nextTier] || 1000) * 10;
  let ratio = ptsNeeded > 0 ? (score % ptsNeeded) / ptsNeeded : 0;
  if (maxUnlockedTier >= MAX_TIER) ratio = 1;
  fill.style.width = (ratio * 100) + '%';
}

// ========== CELL INTERACTION ==========
function handleCell(r, c) {
  if (isProcessing || isGameOver) return;
  resetHint();
  Sound.click();

  const tier = board[r][c];

  // Deselect
  if (selected && selected.r === r && selected.c === c) {
    selected = null;
    renderBoard();
    return;
  }

  // Select piece
  if (tier !== null && !selected) {
    selected = { r, c };
    renderBoard();
    return;
  }

  // Merge same tiers
  if (selected && tier !== null && board[selected.r][selected.c] === tier && (selected.r !== r || selected.c !== c)) {
    const fromR = selected.r, fromC = selected.c;
    const fromTier = tier;
    selected = null;
    isProcessing = true;
    doMerge(fromR, fromC, r, c, fromTier, () => {
      checkChainReactions(() => {
        endTurn();
      });
    });
    return;
  }

  // Move to empty
  if (selected && tier === null) {
    board[r][c] = board[selected.r][selected.c];
    board[selected.r][selected.c] = null;
    selected = null;
    saveGame();
    renderBoard();
    updateHUD();
    return;
  }

  // Select different piece
  if (tier !== null) {
    selected = { r, c };
    renderBoard();
  }
}

// ========== EFFECTS ==========
function shakeScreen(intensity) {
  const app = document.getElementById('app');
  if (!app) return;

  app.classList.remove('shake', 'small', 'big');
  // force a reflow
  void app.offsetWidth;

  app.classList.add('shake', intensity);

  app.addEventListener('animationend', function handler() {
    app.classList.remove('shake', intensity);
    app.removeEventListener('animationend', handler);
  }, {once: true});
}

// ========== MERGE ==========
function doMerge(r1, c1, r2, c2, tier, callback) {
  board[r1][c1] = null;
  const nextTier = Math.min(tier + 1, MAX_TIER);
  board[r2][c2] = nextTier;

  Sound.merge(nextTier);

  // Track max tier
  if (nextTier > maxUnlockedTier) {
    maxUnlockedTier = nextTier;
    showConfetti();
    showBanner(t('achievement') + ': ' + t('unlocked_tier') + (nextTier + 1));
    shakeScreen('big');
  } else {
    shakeScreen('small');
  }

  // Calculate points
  let multiplier = comboMultiplier;
  if (doublePointsActive) multiplier *= 2;
  if (prestigeMultiplier > 1.0) multiplier *= prestigeMultiplier;
  const pts = Math.floor((TIER_POINTS[nextTier] || (nextTier * 10)) * multiplier);
  addScore(pts);
  showFloat(r2, c2, '+' + format(pts));

  merges++;

  // Interstitial every 10 merges (debounced to avoid overlapping during chains)
  if (merges % 10 === 0 && Date.now() - lastInterstitialTime > 30000) {
    showInterstitialAd();
  }

  renderBoard();
  // Animate the merged cell
  const idx = r2 * BOARD_SIZE + c2;
  const cells = document.querySelectorAll('.cell');
  if (cells[idx]) cells[idx].classList.add('merged');

  if (callback) callback();
}

function checkChainReactions(callback) {
  let chainFound = false;
  for (let r = 0; r < BOARD_SIZE && !chainFound; r++) {
    for (let c = 0; c < BOARD_SIZE && !chainFound; c++) {
      const tier = board[r][c];
      if (tier !== null && tier < MAX_TIER) {
        if (c < BOARD_SIZE - 1 && board[r][c+1] === tier) {
          comboMultiplier = Math.min(comboMultiplier + 1, 5);
          Sound.combo(comboMultiplier);
          setTimeout(() => {
            doMerge(r, c+1, r, c, tier, () => checkChainReactions(callback));
          }, 200);
          chainFound = true;
        } else if (r < BOARD_SIZE - 1 && board[r+1][c] === tier) {
          comboMultiplier = Math.min(comboMultiplier + 1, 5);
          Sound.combo(comboMultiplier);
          setTimeout(() => {
            doMerge(r+1, c, r, c, tier, () => checkChainReactions(callback));
          }, 200);
          chainFound = true;
        }
      }
    }
  }
  if (!chainFound && callback) callback();
}

function endTurn() {
  // Reset double points after a turn
  if (doublePointsActive) {
    doublePointsActive = false;
    const adBtn = document.getElementById('btn-ad');
    if (adBtn && ysdk) adBtn.style.display = '';
  }

  // Spawn new items
  const numToSpawn = isDailyChallenge ? rng.integerInRange(1, 2) : (Math.floor(Math.random() * 2) + 1);
  for (let i = 0; i < numToSpawn; i++) spawnRandom();

  // Check game over
  if (getEmptyCells().length === 0 && !hasPossibleMerges()) {
    gameOver();
    return;
  }

  comboMultiplier = 1;
  isProcessing = false;
  resetHint();
  renderBoard();
  updateHUD();
  updateProgressBar();
  saveGame();
}

// ========== ADD SCORE ==========
function addScore(pts) {
  score += pts;
  if (!isDailyChallenge && score > highscore) {
    highscore = score;
    localStorage.setItem('cosmic_highscore', highscore.toString());
  }
  // Daily challenge target
  if (isDailyChallenge && score >= 2000 && !dailyChallengeCompleted) {
    dailyChallengeCompleted = true;
    showDailyComplete();
  }
  checkScoreAchievements();
  updateHUD();
  updateProgressBar();
}

// ========== ACHIEVEMENTS ==========
function checkScoreAchievements() {
  const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000];
  for (const ms of milestones) {
    if (score >= ms && !passedMilestones.has(ms)) {
      passedMilestones.add(ms);
      showBanner(t('achievement') + ': ' + t('score_milestone') + format(ms));
    }
  }
}

// ========== FLOAT TEXT ==========
function showFloat(r, c, text) {
  const cells = document.querySelectorAll('.cell');
  const idx = r * BOARD_SIZE + c;
  const cell = cells[idx];
  if (!cell) return;
  const rect = cell.getBoundingClientRect();
  const ft = document.createElement('div');
  ft.className = 'float-text';
  ft.textContent = text;
  ft.style.left = (rect.left + rect.width/2) + 'px';
  ft.style.top = rect.top + 'px';
  ft.style.transform = 'translateX(-50%)';
  document.body.appendChild(ft);
  setTimeout(() => ft.remove(), 700);
}

// ========== CONFETTI ==========
function showConfetti() {
  const colors = ['#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#ff8800'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = Math.random() * 100 + '%';
    el.style.top = -(Math.random() * 100) + 'px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (2 + Math.random() * 2) + 's';
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
}

// ========== BANNER ==========
let bannerTimeout = null;
function showBanner(msg) {
  const el = document.getElementById('banner');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (bannerTimeout) clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => el.classList.remove('show'), 3500);
}

// ========== GAME OVER ==========
function gameOver() {
  isGameOver = true;
  Sound.gameOver();

  if (ysdk && ysdk.features && ysdk.features.GameplayAPI) ysdk.features.GameplayAPI.stop();

  // Submit leaderboard
  if (leaderboardApi && !isDailyChallenge) {
    ysdk.isAvailableMethod('leaderboards.setLeaderboardScore').then(avail => {
      if (avail) leaderboardApi.setLeaderboardScore('MainBoard', score);
    }).catch(() => {});
  }

  const overlay = document.getElementById('gameover-overlay');
  const scoreEl = document.getElementById('go-score');
  if (scoreEl) scoreEl.textContent = t('score_go') + format(score);
  if (overlay) overlay.classList.add('show');
}

function restartGame() {
  document.getElementById('gameover-overlay').classList.remove('show');
  isGameOver = false;
  isProcessing = false;
  selected = null;
  score = 0;
  merges = 0;
  comboMultiplier = 1;
  doublePointsActive = false;
  dailyChallengeCompleted = false;
  isDailyChallenge = false;
  passedMilestones = new Set();
  rng = null;
  initBoard();
}

document.getElementById('go-btn').addEventListener('click', restartGame);

// ========== HINTS ==========
function resetHint() {
  if (hintTimer) clearTimeout(hintTimer);
  // Clear hint classes
  document.querySelectorAll('.cell.hint').forEach(c => c.classList.remove('hint'));
  hintTimer = setTimeout(showHint, 10000);
}

function showHint() {
  if (isProcessing || selected || isGameOver) return;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const tier = board[r][c];
      if (tier !== null && tier < MAX_TIER) {
        if (c < BOARD_SIZE - 1 && board[r][c+1] === tier) {
          highlightHint(r, c); highlightHint(r, c+1); return;
        }
        if (r < BOARD_SIZE - 1 && board[r+1][c] === tier) {
          highlightHint(r, c); highlightHint(r+1, c); return;
        }
      }
    }
  }
}

function highlightHint(r, c) {
  const cells = document.querySelectorAll('.cell');
  const idx = r * BOARD_SIZE + c;
  if (cells[idx]) cells[idx].classList.add('hint');
}

// ========== MODAL ==========
let modalCallback = null;
let modalCancelCallback = null;

function showModal(title, text, btnLabel, opts = {}) {
  const mo = document.getElementById('modal');
  const mt = document.getElementById('modal-title');
  const mc = document.getElementById('modal-text');
  const mb = document.getElementById('modal-btn');
  const mCancel = document.getElementById('modal-cancel');
  const mReward = document.getElementById('modal-reward');
  if (mt) mt.textContent = title;
  if (mc) mc.innerHTML = text;
  if (mb) mb.textContent = btnLabel;
  if (mb) mb.className = 'modal-btn' + (opts.btnClass ? ' ' + opts.btnClass : '');
  if (mCancel) {
    mCancel.style.display = opts.cancelLabel ? '' : 'none';
    if (opts.cancelLabel) mCancel.textContent = opts.cancelLabel;
  }
  if (mReward) {
    if (opts.reward) { mReward.style.display = ''; mReward.textContent = opts.reward; }
    else { mReward.style.display = 'none'; }
  }
  modalCallback = opts.callback || hideModal;
  modalCancelCallback = opts.cancelCallback || null;
  if (mo) mo.classList.add('show');
}

function hideModal() {
  const mo = document.getElementById('modal');
  if (mo) mo.classList.remove('show');
}

document.getElementById('modal-btn').addEventListener('click', () => { if (modalCallback) modalCallback(); });
document.getElementById('modal-cancel').addEventListener('click', () => {
  hideModal();
  if (modalCancelCallback) modalCancelCallback();
});

// ========== ADS ==========
function showRewardedAd() {
  if (noAdsPurchased) {
    doublePointsActive = true;
    showModal(lang === 'en' ? '2X POINTS' : '2x ОЧКИ', lang === 'en' ? 'Next merge gives double points!' : 'Следующее слияние даёт x2 очков!', t('cool'));
    return;
  }
  if (!ysdk || !ysdk.adv || !ysdk.adv.showRewardedVideo) {
    // Fallback for testing
    doublePointsActive = true;
    showModal(lang === 'en' ? '2X POINTS' : '2x ОЧКИ', lang === 'en' ? 'Next merge gives double points!' : 'Следующее слияние даёт x2 очков!', t('cool'));
    return;
  }
  ysdk.adv.showRewardedVideo({
    callbacks: {
      onOpen: () => { isMuted = true; },
      onRewarded: () => {
        doublePointsActive = true;
        showModal(lang === 'en' ? '2X POINTS' : '2x ОЧКИ', lang === 'en' ? 'Next merge gives double points!' : 'Следующее слияние даёт x2 очков!', t('cool'));
      },
      onClose: () => { isMuted = localStorage.getItem('cosmic_muted') === '1'; },
      onError: () => { isMuted = localStorage.getItem('cosmic_muted') === '1'; }
    }
  });
}

function showInterstitialAd() {
  if (noAdsPurchased) return;
  if (!ysdk || !ysdk.adv || !ysdk.adv.showFullscreenAdv) return;
  lastInterstitialTime = Date.now();
  ysdk.adv.showFullscreenAdv({
    callbacks: {
      onOpen: () => { isMuted = true; },
      onClose: () => { isMuted = localStorage.getItem('cosmic_muted') === '1'; },
      onError: () => { isMuted = localStorage.getItem('cosmic_muted') === '1'; }
    }
  });
}

// ========== DAILY CHALLENGE ==========
function startDailyChallenge() {
  isDailyChallenge = true;
  dailyChallengeCompleted = false;
  score = 0; merges = 0;
  comboMultiplier = 1;
  doublePointsActive = false;
  selected = null;
  isProcessing = false;
  isGameOver = false;
  passedMilestones = new Set();
  const dateStr = new Date().toISOString().split('T')[0];
  rng = new SeededRNG(dateStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (rng.next() < 0.7) board[r][c] = getTier();
  renderBoard();
  updateHUD();
  showBanner(lang === 'en' ? 'Daily Challenge: Reach 2000!' : 'Ежедневный вызов: набери 2000!');
}

function showDailyComplete() {
  const bonusPts = 5000;
  // dailyScore is separate, doesn't inflate permanent highscore
  localStorage.setItem('lastDailyChallenge', new Date().toISOString().split('T')[0]);
  saveCloudData();
  showConfetti();
  showModal(
    t('dailyChallenge'),
    t('dailyReward') + ': +' + format(bonusPts),
    t('ok'),
    { btnClass: 'green', reward: '+' + format(bonusPts), callback: () => {
      isDailyChallenge = false;
      restartGame();
    }}
  );
}

// ========== PRESTIGE ==========
function getPrestigeReq() { return 5000 * Math.pow(2, prestigeLevel); }

function doPrestige() {
  prestigeMultiplier += 0.5;
  prestigeLevel++;
  score = 0; merges = 0;
  doublePointsActive = false;
  passedMilestones = new Set();
  localStorage.setItem('prestigeMultiplier', prestigeMultiplier.toString());
  localStorage.setItem('prestigeCount', prestigeLevel.toString());
  saveCloudData();
  showConfetti();
  showModal(
    t('prestige') + '!',
    t('prestige_done') + prestigeMultiplier.toFixed(1),
    t('cool'),
    { callback: () => { initBoard(); } }
  );
}

// ========== BUY (Bulk Spawn) ==========
function getBuyCost(count, discount) {
  return Math.floor(maxUnlockedTier * 50 * count * discount);
}

function buySpawn(count, discount) {
  const cost = getBuyCost(count, discount);
  if (score < cost) {
    showModal(t('insufficient'), t('need') + format(cost) + ' ' + t('score').toLowerCase(), t('ok'));
    return;
  }
  score -= cost;
  Sound.click();
  isProcessing = true;
  for (let i = 0; i < count; i++) spawnRandom();
  // Check chains after spawning
  checkChainReactions(() => {
    isProcessing = false;
    endTurn();
  });
}

function updateBuyButtons() {
  const configs = [
    { id: 'buy-x1', count: 1, discount: 1 },
    { id: 'buy-x10', count: 10, discount: 0.9 },
    { id: 'buy-x100', count: 100, discount: 0.75 }
  ];
  configs.forEach(cfg => {
    const btn = document.getElementById(cfg.id);
    const costEl = document.getElementById(cfg.id + '-cost');
    const cost = getBuyCost(cfg.count, cfg.discount);
    if (costEl) costEl.textContent = format(cost);
    if (btn) {
      if (score >= cost) btn.classList.remove('disabled');
      else btn.classList.add('disabled');
    }
  });
}

// ========== OFFLINE INCOME ==========
function checkOfflineIncome() {
  const lastActiveStr = localStorage.getItem('cosmic_last_active');
  const now = Date.now();
  if (lastActiveStr && score > 100) {
    const lastActive = parseInt(lastActiveStr, 10);
    const diffHours = (now - lastActive) / (1000 * 60 * 60);
    if (diffHours >= 1) {
      const hoursToReward = Math.min(diffHours, 24);
      const earningPower = (TIER_POINTS[maxUnlockedTier] || 10) * 2;
      const offlineEarnings = Math.floor(hoursToReward * earningPower);
      if (offlineEarnings > 0) {
        showOfflinePopup(offlineEarnings);
      }
    }
  }
  localStorage.setItem('cosmic_last_active', now.toString());
}

function showOfflinePopup(amount) {
  showModal(
    t('offline_income'),
    lang === 'en' ? 'You earned while away!' : 'Вы заработали пока были оффлайн!',
    t('claim'),
    { btnClass: 'gold', reward: '+' + format(amount), callback: () => { addScore(amount); } }
  );
}

// ========== MUTE ==========
function updateMuteButton() {
  const btn = document.getElementById('btn-mute');
  if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
}

// ========== TUTORIAL ==========
function showTutorial() {
  showModal(
    t('tutorial_title'),
    t('tutorial_step1') + '<br>' + t('tutorial_step2') + '<br>' + t('tutorial_step3') + '<br>' + t('tutorial_step4'),
    t('tutorial_ok'),
    { callback: () => {
      localStorage.setItem('alliance_tutorial_done', 'true');
      checkOfflineIncome();
    }}
  );
}

// ========== BACKGROUND ORBITS ==========
function createBackground() {
  const bg = document.getElementById('bg-layer');
  if (bg) {
    for (let i = 0; i < 6; i++) {
      const orb = document.createElement('div');
      orb.className = 'orbit';
      const size = 100 + Math.random() * 200;
      orb.style.width = size + 'px';
      orb.style.height = size + 'px';
      orb.style.left = (Math.random() * 100) + '%';
      orb.style.top = (Math.random() * 100) + '%';
      orb.style.transform = 'translate(-50%, -50%)';
      bg.appendChild(orb);
    }
  }
}

// ========== EVENT LISTENERS ==========
// Mute button
document.getElementById('btn-mute').addEventListener('click', () => {
  isMuted = !isMuted;
  localStorage.setItem('cosmic_muted', isMuted ? '1' : '0');
  updateMuteButton();
});

// Ad button
document.getElementById('btn-ad').addEventListener('click', () => {
  showRewardedAd();
});
// Hide ad button if no SDK
if (!ysdk) {
  // Will check again after SDK init
}

// Remove Ads button
document.getElementById('btn-remove-ads').addEventListener('click', () => {
  if (!payments) return;
  payments.purchase({id: 'no_ads'}).then(() => {
    noAdsPurchased = true;
    document.getElementById('btn-remove-ads').style.display = 'none';
    showBanner(lang === 'en' ? 'Ads removed! Thank you!' : 'Реклама отключена! Спасибо!');
  }).catch(() => {});
});

// Daily challenge button
document.getElementById('btn-daily').addEventListener('click', () => {
  startDailyChallenge();
});

// Prestige button
document.getElementById('btn-prestige').addEventListener('click', () => {
  const req = getPrestigeReq();
  if (score >= req) {
    showModal(
      t('prestige'),
      t('prestigeConfirm') + '<br>' + t('prestigeMultiplier') + ': ' + (prestigeMultiplier + 0.5).toFixed(1) + 'x',
      t('tutorial_ok'),
      {
        btnClass: 'danger',
        cancelLabel: '✕',
        callback: doPrestige,
        cancelCallback: () => {}
      }
    );
  } else {
    showModal(t('insufficient'), t('need') + format(req) + ' ' + t('score').toLowerCase(), t('ok'));
  }
});

// Buy buttons
document.getElementById('buy-x1').addEventListener('click', () => buySpawn(1, 1));
document.getElementById('buy-x10').addEventListener('click', () => buySpawn(10, 0.9));
document.getElementById('buy-x100').addEventListener('click', () => buySpawn(100, 0.75));

// Tab buttons (desktop nav + mobile tabs)
document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');

    // Update active state on all tab buttons
    document.querySelectorAll('[data-tab]').forEach(b => {
      if (b.getAttribute('data-tab') === tabName) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
      v.classList.remove('active');
      v.style.display = 'none';
    });

    // Show selected view
    const viewName = tabName === 'upgrades' ? 'game' : tabName;
    const viewEl = document.getElementById('view-' + viewName);
    if (viewEl) {
      viewEl.classList.add('active');
      viewEl.style.display = '';
    }

    if (tabName === 'records') {
      renderRecords();
    }
  });
});

// ========== INIT ==========
let gameInited = false;
function gameInit() {
  if (gameInited) return;
  gameInited = true;
  applyLocalization();
  createBackground();
  loadGame();

  // Check if board is empty / new game
  if (board.flat().every(x => x === null)) {
    initBoard();
  } else {
    renderBoard();
    updateHUD();
    updateProgressBar();
  }

  // Tutorial on first play
  if (!localStorage.getItem('alliance_tutorial_done')) {
    showTutorial();
  } else {
    checkOfflineIncome();
  }

  // Start hint timer
  resetHint();

  // Update ad button visibility
  const adBtn = document.getElementById('btn-ad');
  if (adBtn && !ysdk) adBtn.style.display = 'none';

  // Remove Ads button visibility
  const removeAdsBtn = document.getElementById('btn-remove-ads');
  if (removeAdsBtn) {
    if (noAdsPurchased || !payments) {
      removeAdsBtn.style.display = 'none';
    } else {
      removeAdsBtn.style.display = '';
    }
  }

  // Start Yandex Gameplay API
  if (ysdk && ysdk.features && ysdk.features.GameplayAPI) ysdk.features.GameplayAPI.start();
}

// Init with Yandex SDK
initYandexSDK().then(() => {
  // Re-check language after SDK loaded
  const sdkLang = getLang();
  if (sdkLang !== lang) {
    lang = sdkLang;
  }
  // Show ad button if SDK available
  if (ysdk && ysdk.adv && ysdk.adv.showRewardedVideo) {
    const adBtn = document.getElementById('btn-ad');
    if (adBtn) adBtn.style.display = '';
  }
  // Load cloud data
  loadCloudData();
  gameInit();
}).catch(() => {
  gameInit();
});

// If SDK takes too long, start anyway
setTimeout(() => {
  if (!document.getElementById('board').children.length) {
    gameInit();
  }
}, 3000);

// Save on page close / visibility change
window.addEventListener('beforeunload', () => saveGame());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveGame();
    if (ysdk && ysdk.features && ysdk.features.GameplayAPI) ysdk.features.GameplayAPI.stop();
  } else {
    if (ysdk && ysdk.features && ysdk.features.GameplayAPI) ysdk.features.GameplayAPI.start();
  }
});
}); // DOMContentLoaded

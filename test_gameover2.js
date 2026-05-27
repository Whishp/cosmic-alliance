const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set storage directly in the page setup so it's ready before DOMContentLoaded
  await page.addInitScript(() => {
    // Fill board with high tiers to guarantee no merges and getEmptyCells() === 0
    // so that when gameInit runs and calls hasPossibleMerges(), it triggers gameOver() immediately.
    // wait, if board is full from localStorage...
    const fullBoard = Array(5).fill(null).map(() => Array(5).fill(null));
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        fullBoard[r][c] = ((r * 5) + c) % 15; // Different adjacent tiers to prevent merges
      }
    }
    const data = {
      board: fullBoard,
      score: 100,
      merges: 10,
      highscore: 100,
      prestigeLevel: 0,
      prestigeMultiplier: 1,
      maxUnlockedTier: 3,
      passedMilestones: []
    };
    window.localStorage.setItem('alliance_save', JSON.stringify(data));
    window.localStorage.removeItem('alliance_tutorial_done');
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  const isGameOverVisible = await page.evaluate(() => {
    return document.getElementById('gameover-overlay').classList.contains('show');
  });

  const isTutorialVisible = await page.evaluate(() => {
    return document.getElementById('modal').classList.contains('show');
  });

  console.log('GameOver visible:', isGameOverVisible);
  console.log('Tutorial visible:', isTutorialVisible);

  await browser.close();
})();

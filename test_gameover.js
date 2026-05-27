const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Intercept requests and mock localStorage to test fresh load
  await page.addInitScript(() => {
    window.localStorage.clear();
  });

  await page.goto('http://localhost:3000');

  // Wait a moment for init to happen
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

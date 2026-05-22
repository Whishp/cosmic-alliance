import re

with open("game.js", "r") as f:
    code = f.read()

# Add buyButtons property to init
code = code.replace(
    "this.prestigeBtnObj = null;",
    "this.prestigeBtnObj = null;\n        this.buyButtons = [];"
)

# Render the buy cell buttons below score or below the grid. Let's add it right after we create prestige / daily buttons.
buyCellsCode = """
        // Buy Cell Buttons (Bulk Buy System)
        const buyContainerY = this.cardY + 110;

        const buy1Btn = this.createBuyButton(width / 2 - 120, buyContainerY, "x1", 1, 1);
        const buy10Btn = this.createBuyButton(width / 2, buyContainerY, "x10", 10, 0.9);
        const buy100Btn = this.createBuyButton(width / 2 + 120, buyContainerY, "x100", 100, 0.75);

        this.buyButtons.push(buy1Btn, buy10Btn, buy100Btn);

        this.updateBuyButtons();
"""

code = code.replace(
    "this.dailyChallengeBtn = this.createStyledButton(width / 2, 270, T[getLang()].dailyChallenge, () => {",
    "this.dailyChallengeBtn = this.createStyledButton(width / 2, 270, T[getLang()].dailyChallenge, () => {"
)
# Actually, I'll insert it at the end of the create method, before initGrid. Wait, let's insert it before `this.initGrid();`
code = code.replace(
    "        this.initGrid();",
    buyCellsCode + "\n        this.initGrid();"
)

# Add updateBuyButtons in update() and after score/tier changes
updateBuyButtonsCode = """
    updateBuyButtons() {
        if (!this.buyButtons) return;
        const l = getLang();
        const baseCost = this.maxUnlockedTier * 50;

        for (let btn of this.buyButtons) {
            const count = btn.getData('count');
            const discount = btn.getData('discount');
            const cost = Math.floor(baseCost * count * discount);
            btn.setData('cost', cost);

            // Update text
            const textObj = btn.getData('textObj');
            if (textObj) {
                textObj.setText(T[l].buyCell + " " + btn.getData('label') + "\\n" + formatNumber(cost));
            }

            // Check if affordable and space available
            const canAfford = this.score >= cost;
            const emptyCells = this.getEmptyCells().length;
            const hasSpace = emptyCells >= count;

            if (canAfford && hasSpace) {
                btn.setAlpha(1);
            } else {
                btn.setAlpha(0.5);
            }
        }
    }

    createBuyButton(x, y, label, count, discount) {
        const container = this.add.container(x, y);
        const paddingX = 15;
        const paddingY = 10;
        const l = getLang();

        const btnText = this.add.text(0, 0, T[l].buyCell + " " + label + "\\n--", {
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        this.setShadow(btnText, '#ffffff', 5);

        const textWidth = 80;
        const textHeight = 40;
        const bgWidth = textWidth + paddingX * 2;
        const bgHeight = textHeight + paddingY * 2;

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a3a, 0x1a1a3a, 0x0a0a2a, 0x0a0a2a, 1);
        bg.fillRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 10);
        bg.lineStyle(2, 0x00e5ff, 0.8);
        bg.strokeRoundedRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 10);

        const hitArea = this.add.zone(0, 0, bgWidth, bgHeight).setInteractive({ useHandCursor: true });

        container.add([bg, btnText, hitArea]);
        container.setData('count', count);
        container.setData('discount', discount);
        container.setData('label', label);
        container.setData('textObj', btnText);

        hitArea.on('pointerdown', () => {
            if (this.isProcessing) return;
            const cost = container.getData('cost');
            const canAfford = this.score >= cost;
            const emptyCells = this.getEmptyCells().length;
            const hasSpace = emptyCells >= count;

            if (canAfford && hasSpace) {
                this.isProcessing = true;

                this.tweens.add({
                    targets: container,
                    scaleX: 0.85,
                    scaleY: 0.85,
                    duration: 100,
                    ease: 'Back.easeIn',
                    yoyo: true,
                    onComplete: () => {
                        this.score -= cost;
                        this.displayScore = this.score;
                        if (this.scoreText) {
                            this.scoreText.setText(T[getLang()].score + formatNumber(this.displayScore));
                        }

                        SoundManager.playClick();

                        let spawned = 0;
                        for (let i = 0; i < count; i++) {
                            if (this.spawnRandom()) {
                                spawned++;
                            }
                        }

                        this.saveCloudData();
                        this.updateBuyButtons();
                        this.isProcessing = false;
                    }
                });
            } else {
                // Shake effect if cannot afford or no space
                this.tweens.add({
                    targets: container,
                    x: container.x + 5,
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
            }
        });

        return container;
    }
"""

code = code.replace(
    "    updateBackgroundGradient() {",
    updateBuyButtonsCode + "\n    updateBackgroundGradient() {"
)

# Hook updateBuyButtons in addScore and upgradeCell where maxUnlockedTier changes
code = code.replace(
    "this.updateProgressIndicator();",
    "this.updateProgressIndicator();\n        this.updateBuyButtons();"
)

# And add to endTurn as well
code = code.replace(
    "this.isProcessing = false;\n        this.resetHintTimer();",
    "this.isProcessing = false;\n        this.resetHintTimer();\n        this.updateBuyButtons();"
)

# Reposition the Buy Buttons dynamically in handleResize if needed
# We can add this inside `handleResize`
handleResizeCode = """
        if (this.buyButtons && this.buyButtons.length === 3) {
            const buyContainerY = this.cardY + 110;
            this.buyButtons[0].setPosition(width / 2 - 110, buyContainerY);
            this.buyButtons[1].setPosition(width / 2, buyContainerY);
            this.buyButtons[2].setPosition(width / 2 + 110, buyContainerY);
        }
"""
code = code.replace(
    "        // Update button positions",
    "        // Update button positions\n" + handleResizeCode
)


with open("game.js", "w") as f:
    f.write(code)

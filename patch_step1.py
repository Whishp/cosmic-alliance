import re

with open("game.js", "r") as f:
    code = f.read()

# Add translation strings
code = code.replace(
    "dailyReward: 'Награда'\n    },",
    "dailyReward: 'Награда',\n        achievement: 'ДОСТИЖЕНИЕ',\n        unlocked_tier: 'Открыт новый уровень',\n        score_milestone: 'Достигнут счет',\n        buyCell: 'Купить'\n    },"
)
code = code.replace(
    "dailyReward: 'Reward'\n    }\n};",
    "dailyReward: 'Reward',\n        achievement: 'ACHIEVEMENT',\n        unlocked_tier: 'New Tier Unlocked',\n        score_milestone: 'Score Milestone Reached',\n        buyCell: 'Buy'\n    }\n};"
)

# Add lastMilestone to MainScene.init
code = code.replace(
    "this.maxUnlockedTier = 3;",
    "this.maxUnlockedTier = 3;\n        this.lastMilestone = 0;"
)

# Update addScore to trigger achievements
addScoreReplacement = """
    addScore(pts) {
        this.score += pts;

        const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
        for (let m of milestones) {
            if (this.score >= m && this.lastMilestone < m) {
                this.lastMilestone = m;
                this.showAchievementPopup(T[getLang()].score_milestone, m.toString());
                break;
            }
        }

        if (!this.isDailyChallenge && this.score > this.highScore) {"""
code = code.replace(
    """    addScore(pts) {
        this.score += pts;

        if (!this.isDailyChallenge && this.score > this.highScore) {""",
    addScoreReplacement
)

# Update upgradeCell to trigger achievements
upgradeCellReplacement = """
        cell.tier = tier;
        if (tier > this.maxUnlockedTier) {
            this.maxUnlockedTier = tier;
            this.showConfetti();
            this.showAchievementPopup(T[getLang()].unlocked_tier, "Tier " + tier);
        }"""
code = code.replace(
    """        cell.tier = tier;
        if (tier > this.maxUnlockedTier) {
            this.maxUnlockedTier = tier;
            this.showConfetti();
        }""",
    upgradeCellReplacement
)

showAchievementPopupFunction = """
    showAchievementPopup(titleStr, textStr) {
        this.isProcessing = true;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const l = getLang();

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.85);
        overlay.setInteractive();

        const popup = this.add.container(width/2, height/2);

        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x1a1a3a, 1);
        cardBg.fillRoundedRect(-180, -120, 360, 240, 20);
        cardBg.lineStyle(3, 0xffd700, 1);
        cardBg.strokeRoundedRect(-180, -120, 360, 240, 20);

        const achTitle = this.add.text(0, -70, T[l].achievement, { fontFamily: FONT_FAMILY, fontSize: '28px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.setShadow(achTitle, '#ffd700', 5);

        const descText = this.add.text(0, -20, titleStr, { fontFamily: FONT_FAMILY, fontSize: '22px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        const valText = this.add.text(0, 20, textStr, { fontFamily: FONT_FAMILY, fontSize: '26px', fill: '#00e5ff', fontStyle: 'bold' }).setOrigin(0.5);

        const okBtn = this.createStyledButton(0, 80, T[l].tutorial_ok, () => {
            this.tweens.add({
                targets: [popup, overlay],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    overlay.destroy();
                    popup.destroy();
                    this.isProcessing = false;
                }
            });
        });

        popup.add([cardBg, achTitle, descText, valText, okBtn]);
        popup.setDepth(200);
        overlay.setDepth(199);

        popup.setAlpha(0);
        overlay.setAlpha(0);

        this.tweens.add({
            targets: [popup, overlay],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        this.spawnParticles(width/2, height/2, 0xffd700, 50);
    }

    showDailyChallengeComplete() {"""

code = code.replace(
    "    showDailyChallengeComplete() {",
    showAchievementPopupFunction
)

with open("game.js", "w") as f:
    f.write(code)

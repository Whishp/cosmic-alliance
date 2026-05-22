import re

with open("index.html", "r") as f:
    code = f.read()

# I see it is actually checking for a function, we must reset index.html changes as we shouldn't modify index.html
# wait, the instruction says "Only modify game.js. No new files." So modifying index.html was wrong. I will revert it.
# We should add a check inside game.js instead

with open("index.html", "w") as f:
    f.write(code.replace("""getPlayer: () => Promise.resolve({ getName: () => 'Player', getPhoto: () => '', isAuthorized: () => false, getData: () => Promise.resolve({}), setData: () => Promise.resolve() }),""", """getPlayer: () => Promise.resolve({ getName: () => 'Player', getPhoto: () => '', isAuthorized: () => false }),"""))

with open("game.js", "r") as f:
    game_js = f.read()

# Find the player check
game_js = game_js.replace("if (player) {\\n            player.getData", "if (player && typeof player.getData === 'function') {\\n            player.getData")

with open("game.js", "w") as f:
    f.write(game_js)

with open("game.js", "r") as f:
    code = f.read()

code = code.replace(
    "if (player) {\n            player.getData",
    "if (player && typeof player.getData === 'function') {\n            player.getData"
)

with open("game.js", "w") as f:
    f.write(code)

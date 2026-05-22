with open("game.js", "r") as f:
    code = f.read()

# Fix the getEmptyCells problem. It fails because this.grid or this.grid[r] is undefined before initGrid is called
# updateBuyButtons is called inside create() immediately after createBuyButtons but before this.initGrid() is run, so this.grid is undefined when getEmptyCells is run inside updateBuyButtons

code = code.replace(
    "this.updateBuyButtons();\n\n        this.initGrid();",
    "this.initGrid();\n\n        this.updateBuyButtons();"
)

with open("game.js", "w") as f:
    f.write(code)

import re

with open("index.html", "r") as f:
    code = f.read()

# Add getData to the player mock
mocked = """getPlayer: () => Promise.resolve({ getName: () => 'Player', getPhoto: () => '', isAuthorized: () => false, getData: () => Promise.resolve({}), setData: () => Promise.resolve() }),"""
code = code.replace(
    """getPlayer: () => Promise.resolve({ getName: () => 'Player', getPhoto: () => '', isAuthorized: () => false }),""",
    mocked
)

with open("index.html", "w") as f:
    f.write(code)

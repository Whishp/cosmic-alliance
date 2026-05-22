import sys
code = open('game.js').read()
for i, line in enumerate(code.split('\n')):
    if '10' in line or '100' in line:
        pass # Too many

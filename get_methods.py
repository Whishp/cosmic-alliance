import sys
code = open('game.js').read()
import re
methods = re.findall(r'^    ([a-zA-Z0-9_]+)\(.*\)', code, re.MULTILINE)
for m in set(methods): print(m)

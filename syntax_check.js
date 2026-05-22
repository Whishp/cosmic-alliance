const fs = require('fs');
try {
  const code = fs.readFileSync('game.js', 'utf8');
  new Function(code);
  console.log("Syntax OK");
} catch (e) {
  console.error("Syntax Error: " + e.message);
}

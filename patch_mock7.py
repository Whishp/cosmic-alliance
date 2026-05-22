import re

with open("game.js", "r") as f:
    code = f.read()

# Fix setTint bug. In Phaser 3.60+, setParticleTint or emitParticleAt etc., but wait, the existing code uses setTint.
# Let's see how spawnParticles is defined:
#     spawnParticles(x, y, color, count = 15) {
#         if (!this.particleEmitter) return;
#         this.particleEmitter.setPosition(x, y);
#         this.particleEmitter.setTint(color);
#         this.particleEmitter.explode(count);
#     }
# Wait, this.particleEmitter.setParticleTint is the Phaser 3.60 method.

code = code.replace(
    "this.particleEmitter.setTint(color);",
    "if (this.particleEmitter.setParticleTint) this.particleEmitter.setParticleTint(color); else this.particleEmitter.setTint(color);"
)

with open("game.js", "w") as f:
    f.write(code)

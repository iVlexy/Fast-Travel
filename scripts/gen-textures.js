/* Procedural tileable textures for skin map fill-patterns.
 * Pure Node + pngjs (no native deps). Deterministic (seeded LCG) so re-runs are stable.
 * Output: assets/skins/textures/<name>.png
 * Run:  node scripts/gen-textures.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const OUT = path.join(__dirname, '..', 'assets', 'skins', 'textures');
fs.mkdirSync(OUT, { recursive: true });

// Seeded RNG (LCG) for stable output.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const hex = (h) => {
  const c = h.replace('#', '');
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
};

// Blocky pixel texture: `block` px cells, each cell a random pick from palette.
function blocky({ name, size = 64, block = 8, palette, seed = 1, alpha = 255 }) {
  const png = new PNG({ width: size, height: size });
  const rand = rng(seed);
  const cells = size / block;
  const grid = [];
  for (let cy = 0; cy < cells; cy++) {
    grid[cy] = [];
    for (let cx = 0; cx < cells; cx++) grid[cy][cx] = hex(palette[Math.floor(rand() * palette.length)]);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = grid[Math.floor(y / block)][Math.floor(x / block)];
      const i = (size * y + x) << 2;
      png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = alpha;
    }
  }
  fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(png));
  console.log('wrote', name);
}

// Paper texture: base color + sparse darker speckle + faint horizontal fibers.
function paper({ name, size = 128, base, speckle, seed = 7 }) {
  const png = new PNG({ width: size, height: size });
  const rand = rng(seed);
  const [br, bg, bb] = hex(base);
  const [sr, sg, sb] = hex(speckle);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2;
      const fiber = Math.sin(y * 0.5) * 4;
      let r = br + fiber, g = bg + fiber, b = bb + fiber;
      if (rand() < 0.06) { r = sr; g = sg; b = sb; }
      png.data[i] = Math.max(0, Math.min(255, r));
      png.data[i + 1] = Math.max(0, Math.min(255, g));
      png.data[i + 2] = Math.max(0, Math.min(255, b));
      png.data[i + 3] = 255;
    }
  }
  fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(png));
  console.log('wrote', name);
}

// Scanline overlay: transparent with periodic green lines (Pip-Boy CRT).
function scanlines({ name, size = 16, color = '#3cff7a', seed = 3 }) {
  const png = new PNG({ width: size, height: size });
  const [r, g, b] = hex(color);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2;
      const on = y % 3 === 0;
      png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b;
      png.data[i + 3] = on ? 40 : 0;
    }
  }
  fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(png));
  console.log('wrote', name);
}

// --- Minecraft: blocky biome pixels ---
blocky({ name: 'mc-grass', block: 8, palette: ['#5b8a3c', '#4a7a33', '#6b9a4c', '#568238'], seed: 11 });
blocky({ name: 'mc-water', block: 8, palette: ['#3a6bb0', '#3363a6', '#4374bd'], seed: 22 });
blocky({ name: 'mc-dirt', block: 8, palette: ['#8a7a55', '#7d6e4b', '#96855f'], seed: 33 });
blocky({ name: 'mc-stone', block: 8, palette: ['#9a9a9a', '#8f8f8f', '#a5a5a5'], seed: 44 });
blocky({ name: 'mc-sand', block: 8, palette: ['#d8c48c', '#cdb37a', '#e0cf9a'], seed: 55 });

// --- Parchment (Skyrim / Morrowind) ---
paper({ name: 'parchment', base: '#cdb37a', speckle: '#a88b4e', seed: 7 });
paper({ name: 'parchment-water', base: '#9fb08a', speckle: '#84976f', seed: 8 });

// --- Pip-Boy scanlines ---
scanlines({ name: 'pipboy-scan' });

console.log('done ->', OUT);

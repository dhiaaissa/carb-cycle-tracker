/**
 * Renders the app icons from the brand mark (three arcs = low / med / high days).
 * One-off: run `npm i --no-save sharp && node scripts/make-icons.mjs` after changing the mark.
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';

const PAGE = '#F3F1EA', DOOR = '#1F4E9C', SAFFRON = '#D4901A', OLIVE = '#63712A';

// size: canvas px; scale: ring size relative to the canvas (maskable icons keep a 20% safe margin).
function svg(size, scale) {
  const r = size * 0.30 * scale, sw = size * 0.11 * scale, c = 2 * Math.PI * r, gap = size * 0.022 * scale, cx = size / 2;
  const arc = (frac) => `${c * frac - gap} ${c}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${PAGE}"/>
  <g transform="rotate(-90 ${cx} ${cx})" fill="none" stroke-width="${sw}">
    <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${DOOR}" stroke-dasharray="${arc(0.5)}"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${SAFFRON}" stroke-dasharray="${arc(0.3)}" stroke-dashoffset="${-c * 0.5}"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${OLIVE}" stroke-dasharray="${arc(0.2)}" stroke-dashoffset="${-c * 0.8}"/>
  </g>
</svg>`;
}

const out = [
  ['pwa-192.png', 192, 1.0],
  ['pwa-512.png', 512, 1.0],
  ['pwa-maskable-512.png', 512, 0.8],
  ['apple-touch-icon.png', 180, 0.95],
];
for (const [name, size, scale] of out) {
  await sharp(Buffer.from(svg(size, scale))).png().toFile(`public/${name}`);
  console.log('wrote', name);
}
writeFileSync('public/favicon.svg', svg(64, 1.35).replace(/<rect[^>]*\/>/, ''));
console.log('wrote favicon.svg');

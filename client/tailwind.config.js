import plugin from 'tailwindcss/plugin';

/**
 * Design tokens — see /DESIGN.md for the reasoning.
 *
 * Identity: a Mediterranean logbook. Sidi Bou Said door blue on lime-wash,
 * saffron and olive as the food colours (carbs, fat). Flat surfaces, hairline
 * borders, no gradients or coloured glows.
 *
 * Every colour is a CSS variable, so dark mode is just `.dark` on <html>.
 * Legacy Tailwind names (indigo, purple, green, amber, …) are aliased onto the
 * brand scales so older markup can't drift back to stock colours.
 */

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const scale = (hexes) => Object.fromEntries(SHADES.map((s, i) => [s, hexes[i]]));

// ── Brand scales ───────────────────────────────────────────────────────
const DOOR = scale(['#EEF3FB', '#D9E4F5', '#B5CBEB', '#86A8DC', '#5583C8', '#3266B4', '#1F4E9C', '#1A4182', '#17366A', '#142D57', '#0C1B36']);
const SAFFRON = scale(['#FDF7E8', '#FAEBC4', '#F4D68A', '#EDBE52', '#E5A92E', '#D4901A', '#B37313', '#8D5813', '#724716', '#5E3B16', '#351F08']);
const OLIVE = scale(['#F6F7EC', '#EAEDD2', '#D5DBA8', '#B9C376', '#9DAA4E', '#7F8E37', '#63712A', '#4C5724', '#3E4621', '#353C1F', '#1B200D']);
// Warm "lime-wash" neutral. 400 is darkened vs. stock so secondary text clears ~3.6:1.
const INK = scale(['#F7F6F2', '#EFEDE6', '#E2DFD6', '#CBC7BB', '#8A867B', '#706C62', '#5A574F', '#45433D', '#2F2E2A', '#1E1D1A', '#121210']);
// Kept for genuine errors only (never for "over target").
const CLAY = scale(['#FCF1EE', '#F8DED7', '#F0BBAD', '#E5907B', '#D86A52', '#C24E37', '#A13C2A', '#823224', '#6A2B21', '#58271F', '#30110C']);
const WATER = scale(['#ECFAFB', '#CFF1F4', '#A2E3EA', '#69CDD8', '#35AFBE', '#1D93A3', '#1A7686', '#1B5F6D', '#1D4F5A', '#1C434D', '#0C2A33']);

const BRAND = { door: DOOR, saffron: SAFFRON, olive: OLIVE, ink: INK, clay: CLAY, water: WATER };

// Legacy names → brand scales
const ALIASES = {
  indigo: DOOR, purple: DOOR, violet: DOOR, fuchsia: DOOR, blue: DOOR, sky: DOOR,
  amber: SAFFRON, yellow: SAFFRON, orange: SAFFRON,
  green: OLIVE, emerald: OLIVE, lime: OLIVE, teal: OLIVE,
  cyan: WATER,
  red: CLAY, rose: CLAY, pink: CLAY,
  gray: INK, slate: INK, zinc: INK, neutral: INK, stone: INK,
};
const ALL = { ...BRAND, ...ALIASES };
const NEUTRAL_NAMES = new Set(['ink', 'gray', 'slate', 'zinc', 'neutral', 'stone']);

// Dark mode mirrors each scale so light-mode pairs keep their contrast.
const NEUTRAL_DARK = { 50: '950', 100: '900', 200: '800', 300: '700', 400: '500', 500: '400', 600: '300', 700: '200', 800: '100', 900: '50', 950: '50' };
const HUE_DARK = { 50: '950', 100: '900', 200: '800', 300: '700', 400: '400', 500: '500', 600: '500', 700: '300', 800: '200', 900: '100', 950: '50' };

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => hexToRgb(a).map((v, i) => Math.round(v + (hexToRgb(b)[i] - v) * t));
const triplet = (rgb) => rgb.join(' ');

const PAGE_LIGHT = '#F3F1EA';                       // lime-wash
const PAGE_DARK = INK[950];
const SURFACE_DARK = mix(INK[900], INK[800], 0.3);   // cards (bg-white)

function paletteVars() {
  const light = {};
  const dark = {};
  for (const [name, sc] of Object.entries(ALL)) {
    const neutral = NEUTRAL_NAMES.has(name);
    const map = neutral ? NEUTRAL_DARK : HUE_DARK;
    for (const s of SHADES) {
      light[`--c-${name}-${s}`] = triplet(hexToRgb(sc[s]));
      let d = hexToRgb(sc[map[s]]);
      // Tinted backgrounds: pull the deep 950/900 shades toward the dark surface so they read as tints.
      if (!neutral && (s === '50' || s === '100')) d = mix(sc[map[s]], INK[900], s === '50' ? 0.6 : 0.45);
      dark[`--c-${name}-${s}`] = triplet(d);
    }
  }
  Object.assign(light, { '--c-surface': '255 255 255', '--c-page': triplet(hexToRgb(PAGE_LIGHT)) });
  Object.assign(dark, { '--c-surface': triplet(SURFACE_DARK), '--c-page': triplet(hexToRgb(PAGE_DARK)) });
  return { light, dark };
}

const palette = (name) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--c-${name}-${s}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  // Touch devices: no sticky hover after a tap (hover: styles only apply where hover exists).
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        ...Object.fromEntries(Object.keys(ALL).map((n) => [n, palette(n)])),
        page: 'rgb(var(--c-page) / <alpha-value>)',
      },
      backgroundColor: {
        // Only *backgrounds* named white become the dark surface; text-white stays white.
        white: 'rgb(var(--c-surface) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['"IBM Plex Sans Condensed"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // Restrained radii: the old rounded-2xl/3xl pillow look is retired.
        '2xl': '0.75rem',
        '3xl': '0.875rem',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      const { light, dark } = paletteVars();
      addBase({
        ':root': { ...light, colorScheme: 'light' },
        ':root.dark': { ...dark, colorScheme: 'dark' },
        // Surfaces that are dark by design (sidebar, login panel) keep their
        // palette in dark mode instead of being mirrored to light…
        ':root.dark .theme-fixed': light,
        // …and content inside them that should follow the theme opts back in.
        ':root.dark .theme-fixed .theme-auto': dark,
      });
    }),
  ],
};

import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

/**
 * Theme-aware palette.
 *
 * Every palette colour is a CSS variable, so the whole app gets dark mode by
 * toggling `.dark` on <html> — no `dark:` variant needed on each of the
 * ~1,500 colour classes. In dark mode the scales are mirrored so that pairs
 * written for light mode keep their contrast:
 *   bg-red-50 + text-red-700  →  dark red tint + light red text
 *   bg-white  + text-gray-800 →  dark surface  + near-white text
 * Mid shades (400–600) stay put so `bg-indigo-600 text-white` buttons keep working.
 */

const NEUTRALS = ['slate', 'gray', 'zinc', 'neutral', 'stone'];
const HUES = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const NEUTRAL_DARK = { 50: '950', 100: '900', 200: '800', 300: '700', 400: '500', 500: '400', 600: '300', 700: '200', 800: '100', 900: '50', 950: '50' };
const HUE_DARK = { 50: '950', 100: '900', 200: '800', 300: '700', 400: '400', 500: '500', 600: '600', 700: '300', 800: '200', 900: '100', 950: '50' };

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => hexToRgb(a).map((v, i) => Math.round(v + (hexToRgb(b)[i] - v) * t));
const triplet = (rgb) => rgb.join(' ');

// Dark-mode base surfaces
const DARK_PAGE = colors.gray[950];
const DARK_SURFACE = triplet(mix(colors.gray[900], colors.gray[800], 0.35)); // cards (bg-white)

function paletteVars() {
  const light = {};
  const dark = {};
  for (const name of [...NEUTRALS, ...HUES]) {
    const map = NEUTRALS.includes(name) ? NEUTRAL_DARK : HUE_DARK;
    for (const s of SHADES) {
      light[`--c-${name}-${s}`] = triplet(hexToRgb(colors[name][s]));
      let d = hexToRgb(colors[name][map[s]]);
      // Pastel backgrounds: soften the very saturated 950/900 tints toward the dark surface.
      if (!NEUTRALS.includes(name) && (s === '50' || s === '100')) {
        d = mix(colors[name][map[s]], colors.gray[900], s === '50' ? 0.55 : 0.4);
      }
      dark[`--c-${name}-${s}`] = triplet(d);
    }
  }
  light['--c-surface'] = '255 255 255';
  dark['--c-surface'] = DARK_SURFACE;
  dark['--c-page'] = triplet(hexToRgb(DARK_PAGE));
  return { light, dark };
}

const palette = (name) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--c-${name}-${s}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: Object.fromEntries([...NEUTRALS, ...HUES].map((n) => [n, palette(n)])),
      // Only *backgrounds* named white become the dark surface; text-white stays white.
      backgroundColor: {
        white: 'rgb(var(--c-surface) / <alpha-value>)',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      const { light, dark } = paletteVars();
      addBase({
        ':root': { ...light, colorScheme: 'light' },
        ':root.dark': { ...dark, colorScheme: 'dark' },
        // Surfaces that are dark by design (sidebar, login hero, onboarding backdrop)
        // keep their original palette in dark mode instead of being mirrored to light.
        ':root.dark .theme-fixed': light,
        // …and content inside them that *should* follow the theme opts back in.
        ':root.dark .theme-fixed .theme-auto': dark,
      });
    }),
  ],
};

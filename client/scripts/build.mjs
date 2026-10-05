/**
 * `vite build`, plus Node 18 support: the service-worker build (Workbox 7.4)
 * needs the Web Crypto global, which Node only exposes by default from v20.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const major = Number(process.versions.node.split('.')[0]);
const flags = major < 20 ? ['--experimental-global-webcrypto'] : [];
const { status } = spawnSync(process.execPath, [...flags, vite, 'build', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(status ?? 1);

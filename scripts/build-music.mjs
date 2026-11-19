// Optional build step: writes public/music/playlist.json from whatever audio files are in public/music.
// Cloudflare Pages build command:  node scripts/build-music.mjs     Output directory: public
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'music');
mkdirSync(dir, { recursive: true });
const AUDIO = /\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|webm)$/i;
const files = readdirSync(dir).filter((f) => AUDIO.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
writeFileSync(join(dir, 'playlist.json'), JSON.stringify(files.map((file) => ({ file })), null, 2));
console.log(`music: ${files.length} track(s)`);

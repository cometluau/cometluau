# Comet
Lua script hosting, pastebin and script directory on Cloudflare Pages + Pages Functions + D1. No bundler.

## Setup (one time, in the Cloudflare dashboard)
1. Workers & Pages -> your `cometluau` Pages project -> Settings -> Build: build command `node scripts/build-music.mjs` (or leave empty, see Music), output directory `public`.
2. Settings -> Bindings -> Add -> **D1 database**: variable name `DB` -> database `cometluau`. Do this for Production (and Preview if you use it). **This is the fix for "Server is not configured".**
3. Settings -> Variables and Secrets -> add secret `STAFF_PASSWORD` (the /staff login).
   Optional secret `KEY_SECRET` (`openssl rand -base64 32`). Set it **before** the first paste: it lets staff recover management keys. Changing it later invalidates keys of existing pastes.
4. Deployments -> Retry/redeploy so the bindings take effect.

Tables are created automatically on first use. `migrations/` is kept for `wrangler d1 migrations apply` if you prefer the CLI (it is safe to run both).

## Pages
- `/dashboard` home (tab title `Comet | Home`), `/scripts` search every script, `/pastebin` create a paste, `/pastebin/ID` details, `/staff` staff dashboard.
- `/main.lua` and `/raw/main`: your own loader, still public. Edit `public/main.lua`.

## Private or public raw links
Each script has a **Raw link access** toggle (on the create form, in "Manage this paste", and in /staff). Default is Private.
- **Private**: `/raw/ID` only answers scripts (HttpGet, request, curl). A browser gets `403` and `-- Access denied. This link only works when loaded by a script.` The public page and search never show the source; the owner unlocks it with the management key.
- **Public**: anyone can open the raw link and the page shows the source.
Existing scripts become Private. The database column is added automatically on first use, so there is no migration to run.
Private keeps casual people out; it cannot stop someone who deliberately fakes headers, because any script that can run your code can also download it. `/main.lua` and `/raw/main` stay public.

## Loading screen, page switching, effects
- First load: the logo animates in, then glides into the top bar while the page fades in and the music starts. Browsers only allow sound after a click, so if autoplay is blocked the logo screen shows "Click anywhere to enter" and the music starts on that click.
- Links between pages swap content in place (no reload), so the music keeps playing. A real refresh restarts the intro. `/raw/...` and `.lua` links open in a new tab so they never interrupt the music.
- `public/js/effects.js` holds the falling comets, the dot-and-ring cursor (white/blue gradient circling the ring) and the click burst. The cursor only replaces the system cursor on mouse devices.
- `public/assets/disable-devtool.min.js` is your DevTools blocker, left as you added it on the four public pages.

## Music
Drag audio files into `public/music/` on GitHub and commit. They loop in the player at the bottom-left. Browsers block sound until the first click or tap, so playback starts on the visitor's first interaction.
The list comes from `public/music/playlist.json` (made by the build command) or, if that is missing, straight from this GitHub repo (set `GITHUB_REPO` / `GITHUB_BRANCH` variables if yours differ from `cometluau/cometluau` on `main`).

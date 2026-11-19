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
- `/loader.lua` and `/raw/loader`: your own loader, still public. Edit `public/loader.lua`.

## Private or public raw links
Each script has a **Raw link access** toggle (on the create form, in "Manage this paste", and in /staff). Default is Private.
- **Private**: `/raw/ID` only answers scripts (HttpGet, request, curl). A browser gets `403` and `-- Access denied. This link only works when loaded by a script.` The public page and search never show the source; the owner unlocks it with the management key.
- **Public**: anyone can open the raw link and the page shows the source.
Existing scripts become Private. The database column is added automatically on first use, so there is no migration to run.
Private keeps casual people out; it cannot stop someone who deliberately fakes headers, because any script that can run your code can also download it. `/loader.lua` and `/raw/loader` stay public.

## Loading screen, page switching, effects
- First load: the logo animates in, then glides into the top bar while the page fades in and the music starts. Browsers only allow sound after a click, so if autoplay is blocked the logo screen shows "Click anywhere to enter" and the music starts on that click.
- Links between pages swap content in place (no reload), so the music keeps playing. A real refresh restarts the intro. `/raw/...` and `.lua` links open in a new tab so they never interrupt the music.
- `public/js/effects.js` holds the falling comets, the dot-and-ring cursor (white/blue gradient circling the ring) and the click burst. The cursor only replaces the system cursor on mouse devices.
- `public/assets/disable-devtool.min.js` is your DevTools blocker, left as you added it on the four public pages.

## Music
Drag audio files into `public/music/` on GitHub and commit. They loop in the player at the bottom-left (one track repeats forever, several play in order and wrap). Keep each file under 25 MB.
- The track list is `public/music/playlist.json`. It is rebuilt automatically by `.github/workflows/music-playlist.yml` whenever you change that folder, or by the Pages build command `node scripts/build-music.mjs` if you set it.
- If the playlist is out of date, the page also asks GitHub for the folder from the visitor's own browser, so a newly dragged-in file still appears. This expects the repo `cometluau/cometluau`, branch `main` (edit `GH` near the top of the music section in `public/js/app.js` if different).
- Browsers only allow sound after a click or tap. If autoplay is blocked, the logo screen shows "Click or tap anywhere to enter" and the music starts on that tap. Pausing only lasts until the page is reloaded.

## Paste links
`/pastebin/ID` is served by `functions/pastebin/[id].js`, which keeps the ID in the address. (A `_redirects` rewrite to `paste.html` makes Cloudflare redirect to `/paste` and the ID is lost, so there is none.)

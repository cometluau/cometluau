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

## Script-only links
`/raw/ID` only answers scripts (HttpGet, request, curl). A browser opening it gets `403`, and the public viewer/search never return source. The owner unlocks the source with the management key.
Switch it off with `HIDE_SOURCE_FROM_BROWSERS = false` in `functions/_lib/util.js`.
This keeps casual people out; it cannot stop someone who deliberately fakes headers, because any script that can run your code can also download it.

## Music
Drag audio files into `public/music/` on GitHub and commit. They loop in the player at the bottom-left. Browsers block sound until the first click or tap, so playback starts on the visitor's first interaction.
The list comes from `public/music/playlist.json` (made by the build command) or, if that is missing, straight from this GitHub repo (set `GITHUB_REPO` / `GITHUB_BRANCH` variables if yours differ from `cometluau/cometluau` on `main`).

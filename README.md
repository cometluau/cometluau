# Comet Luau
Lua pastebin + script hosting on Cloudflare Pages, Pages Functions and D1. No bundler.

## Setup
1. `npm install`
2. `npx wrangler d1 migrations apply cometluau --remote`
3. Cloudflare Pages -> Settings: build command *(empty)*, output directory `public`
4. Functions -> D1 binding: `DB` -> `cometluau` (database_id 78275bf0-2e6a-4e96-8d6e-738fbb0d88d1)
5. Variables and Secrets -> secrets `KEY_SECRET` (`openssl rand -base64 32`) and `STAFF_PASSWORD`

## Routes
- `/main.lua` static script you edit in `public/main.lua`; `/raw/main` serves the same file
- `/raw/ID` raw paste, `/pastebin/ID` viewer, `/staff` staff dashboard

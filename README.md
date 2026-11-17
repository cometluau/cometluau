# Comet Luau
Lua pastebin + script hosting on Cloudflare Pages, Pages Functions and D1. No bundler.

## Setup
1. `npm install`
2. `npx wrangler d1 create cometluau` -> put the `database_id` in `wrangler.toml`
3. `npx wrangler d1 migrations apply cometluau --remote`
4. Cloudflare Pages -> Settings: build command *(empty)*, output directory `public`
5. Functions -> D1 binding: `DB` -> `cometluau`
6. Variables and Secrets -> secret `KEY_SECRET` (`openssl rand -base64 32`)

## Status
Done: /, /dashboard, /pastebin, /pastebin/:id, /raw/:id, server-enforced expiry, management keys (HMAC verified + AES-GCM copy for staff recovery), edit/delete by key, real stats.
Not built yet: staff area, scripts library, Discord OAuth, reports, audit logs, rate limiting. Untested: nothing has been run against D1.

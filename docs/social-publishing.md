# OasisDeal social publishing

The Worker now contains the production publishing path for Facebook Pages, Instagram Professional accounts, Pinterest Pins, and TikTok photo posts. It does not store tokens in the browser: OAuth tokens are encrypted before they are written to D1.

## One-time Cloudflare setup

Create the database from the OasisDeal repository, then add the returned id to `wrangler.jsonc`:

```text
npx wrangler d1 create oasisdeal-social
```

```jsonc
"d1_databases": [
  {
    "binding": "SOCIAL_DB",
    "database_name": "oasisdeal-social",
    "database_id": "PASTE_THE_ID_RETURNED_BY_WRANGLER"
  }
]
```

Apply the schema remotely:

```text
npx wrangler d1 migrations apply oasisdeal-social --remote
```

Set these as Cloudflare Worker secrets. Do not put values in Git, `.dev.vars`, the dashboard, or chat:

```text
npx wrangler secret put SOCIAL_SESSION_SECRET
npx wrangler secret put SOCIAL_TOKEN_ENCRYPTION_KEY
npx wrangler secret put META_APP_ID
npx wrangler secret put META_APP_SECRET
npx wrangler secret put PINTEREST_APP_ID
npx wrangler secret put PINTEREST_APP_SECRET
npx wrangler secret put TIKTOK_CLIENT_KEY
npx wrangler secret put TIKTOK_CLIENT_SECRET
```

`SOCIAL_TOKEN_ENCRYPTION_KEY` must be a base64url value that decodes to exactly 32 bytes. Keep `SOCIAL_SESSION_SECRET` long and random. These optional variables are safe to keep as non-secret Worker variables:

```text
SOCIAL_PUBLIC_BASE_URL=https://oasisdeal.com
SOCIAL_DASHBOARD_URL=http://localhost:4173/
SOCIAL_ALLOWED_ORIGINS=https://oasisdeal.com,http://localhost:4173
META_GRAPH_VERSION=v24.0
META_PAGE_ID=<the OasisDeal Facebook Page id>
PINTEREST_BOARD_ID=<the board used for OasisDeal Pins>
```

## OAuth callback URLs

Register these exact URLs in each provider dashboard:

```text
https://oasisdeal.com/api/social/callback/meta
https://oasisdeal.com/api/social/callback/pinterest
https://oasisdeal.com/api/social/callback/tiktok
```

The local dashboard starts OAuth at `/api/social/connect/{platform}` and receives a short-lived signed dashboard session in the URL fragment after the callback. The fragment is not sent to the server.

## Platform notes

- Meta needs the Page permissions and Instagram permissions already selected in the OasisDeal app. The Page must have an Instagram Professional account linked to it. App Review still needs the app icon, screencast, API test calls, and the reviewer instructions before public users can authorize it.
- Pinterest publishing needs `boards:read`, `boards:write`, `pins:read`, `pins:write`, and `user_accounts:read`. The board id is intentionally explicit so a post cannot be sent to the wrong board.
- TikTok photo Direct Post uses the creator information endpoint first, then the photo publishing endpoint. TikTok requires `video.publish` approval and URL ownership verification. Unaudited clients can be restricted to private viewing, and the platform's Direct Post audit/policy requirements still apply.

The Worker scheduler runs every five minutes. It only publishes rows marked `scheduled` whose `scheduled_at` has passed, claims each row once, records the remote id, and records a short error when a platform rejects a post.


# TeraBox Setup Guide

TeraBox does **not** provide a public OAuth developer API. TurnixCloud connects via a **session token** (`ndus` cookie) copied from your browser after logging in to TeraBox.

> **Note:** This is an unofficial integration based on reverse-engineered web APIs. Sessions expire when you log out of TeraBox or when cookies expire. Reconnect the account to refresh.

## Prerequisites

- A TeraBox account ([terabox.com](https://www.terabox.com))
- TurnixCloud running locally or deployed

## Step 1 — Log in to TeraBox

1. Open [https://www.terabox.com](https://www.terabox.com) in Chrome, Firefox, or Edge.
2. Sign in with your TeraBox account.
3. Open **My Files** so the cloud file list loads.

## Step 2 — Copy the NDUS token

### Method A: Application / Cookies tab (easiest)

1. Press **F12** to open Developer Tools.
2. Go to **Application** (Chrome) or **Storage** (Firefox).
3. Expand **Cookies** → select `https://www.terabox.com`.
4. Find the cookie named **`ndus`**.
5. Copy its **Value** — this is your NDUS token.

### Method B: Network tab

1. Press **F12** → **Network** tab.
2. Filter by **XHR** or **Fetch**.
3. Click any folder in TeraBox to trigger a request.
4. Select a request to `/api/list` or `/api/check/login`.
5. In **Request Headers**, find the **Cookie** header.
6. Copy the value after `ndus=` (stop at the next `;`).

You can paste either:

- The raw `ndus` value, or
- The full Cookie header (TurnixCloud extracts `ndus` automatically).

## Step 3 — Connect in TurnixCloud

1. Open **Storage & Accounts** (`/quota`).
2. Click **Add Account** → **TeraBox** → **Connect**.
3. Paste your **NDUS Token**.
4. Optional: set a **Label** (e.g. `Personal TeraBox`).
5. Optional: **Base URL** — leave empty for default `https://www.terabox.com`.
6. Click **Connect**.

TurnixCloud validates the session before saving. If the token is invalid or expired, connection fails with an error message.

## Step 4 — Sync files

1. Click **Sync All** on the Storage & Accounts page.
2. Open **My Drive** to browse synced files.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `TeraBox session is invalid or expired` | Log in to TeraBox again, copy a fresh `ndus` token, reconnect |
| Files empty after connect | Run **Sync All** — connecting alone does not sync files |
| Account shows `error` status | Session expired — disconnect and reconnect with a new token |
| Upload/sync fails suddenly | TeraBox may have changed their web API — check for TurnixCloud updates |

## Security

- The NDUS token grants full access to your TeraBox account (same as staying logged in on the web).
- Tokens are stored **encrypted** in TurnixCloud.
- Never share your NDUS token or commit it to git.
- Reconnect periodically or after logging out of TeraBox on the web.

## Multiple accounts

You can connect multiple TeraBox accounts. Each needs its own NDUS token from a different logged-in session.

## Related

- In-app guide: **How to Connect** (`/guide`)
- Package used for API: [`terabox-api`](https://www.npmjs.com/package/terabox-api) (unofficial)

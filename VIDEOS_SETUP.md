# Video Library — One-Time Setup

The site now has a public **Video Library** (`/videos.html`) and a secured uploader on the agent dashboard (`/admin/videos.html`). Files are stored in **Vercel Blob** — no third-party accounts needed. Only signed-in agents can upload or delete; everyone else can only watch.

You need to do **three things once** in your Vercel project to turn it on. Total time: ~3 minutes.

---

## 1 · Enable Vercel Blob storage

1. Open your Vercel dashboard → the **kanye-luxury-360** project.
2. Click the **Storage** tab.
3. Click **Create Database** → choose **Blob** → name it `videos` (or anything) → **Create**.
4. When asked to connect it to the project, choose **kanye-luxury-360** and click **Connect**.

That's it — Vercel automatically injects a `BLOB_READ_WRITE_TOKEN` env var into your project. The API endpoints look for it.

---

## 2 · Add the two security env vars

Go to **Settings → Environment Variables** on the same project and add these two:

### `ADMIN_PASSWORD_HASH`

This is the SHA-256 hash of the dashboard password. It is what the server compares against — the actual password is never stored.

To generate it, run this in a terminal (replace the placeholder with your real password):

```bash
echo -n "YOUR_DASHBOARD_PASSWORD" | shasum -a 256 | awk '{print $1}'
```

Paste the resulting 64-character hex string as the value.

> The default dev password baked into the client is `admin77` — its hash is
> `d1cb6800649969380c1bbb67fa7210e198438e3ec6c94667ecd1a476ceec887b`. **Do not ship that to production.** Pick something stronger and update both this env var and (optionally) the local fallback in `admin/admin.js → DEFAULT_PASS_HASH`.

### `SESSION_SECRET`

Random string used to sign the 8-hour session tokens. Anything long and random works:

```bash
openssl rand -hex 32
```

Paste the output as the value.

Apply both to **Production, Preview, and Development**, then click **Save**.

---

## 3 · Redeploy

Trigger a redeploy (push a commit, or click **Redeploy** in the Vercel dashboard). The new endpoints under `/api/*` will pick up the env vars.

---

## How it works (so you know it's secure)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth` | POST | none (compares against `ADMIN_PASSWORD_HASH`) | Issues a signed 8h session token |
| `/api/upload-url` | POST | session token (validated by `@vercel/blob`) | Hands the browser a one-shot, content-type-restricted upload URL |
| `/api/videos` | GET | none | Returns the list of published videos (read-only) |
| `/api/videos` | POST | session token (Bearer header) | Saves a video record after upload |
| `/api/videos` | DELETE | session token (Bearer header) | Removes a video and its blob |

- Tokens are HMAC-SHA256 signed with `SESSION_SECRET` and expire after 8 hours.
- Upload endpoint enforces: `video/mp4`, `video/quicktime`, `video/webm`, `video/x-m4v` only · max 1 GB.
- Public users can hit `GET /api/videos` (needed for the showcase page) but cannot POST or DELETE.
- Even if someone discovered the upload URL, they can't get a valid token without the password.

---

## Cost

Vercel Blob free tier: **1 GB stored + 10 GB bandwidth/month**. Past that it's about **$0.15/GB stored** and **$0.05/GB bandwidth**. For an agent posting a handful of property tours, you'll likely stay free.

---

## Local development (optional)

If you want to run the site locally with working uploads:

```bash
npm install
npx vercel dev
```

You'll need a `.env.local` file with the same three env vars. Get the Blob token by running `vercel env pull .env.local` after step 1 above.

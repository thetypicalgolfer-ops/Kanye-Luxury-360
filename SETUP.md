# CRM Setup Guide — Kanye Concierge 360

This is a one-time setup. After it's done, every form submission on the site
will be saved to a real database, the agent will get an instant email + text,
and the prospect will get an automated thank-you email.

**Estimated time:** 30–45 minutes.
**Estimated monthly cost:** $0 to start, ~$15–25/mo once volume grows.

---

## What you'll set up

| Service | Purpose | Free tier | When it bills |
|---|---|---|---|
| **Supabase** | Lead database | 500 MB, 50k rows — plenty for years of leads | $25/mo only after you blow past the free tier |
| **Resend** | Outbound email (alerts + auto-reply) | 3,000 emails/mo, 100/day | $20/mo for 50k emails |
| **Twilio** | SMS alert to the agent | $0 trial credit; pay-as-you-go after | ~$1/mo phone rental + $0.0079 per SMS |

You can skip any one of these and the site keeps working — it just won't do that piece. (For example, skip Twilio and you still get email alerts but no text.)

---

## 1. Supabase (lead database)

1. Go to **https://supabase.com** and create a free account.
2. Click **New Project**. Name it `kanye-crm` (or whatever). Pick a strong DB password (you won't need it again, save it in 1Password). Region: pick the one closest to you (`East US (North Virginia)` is fine).
3. Wait ~2 min for provisioning.
4. Open the project → **SQL Editor** (left sidebar) → **New query**.
5. Open `db/schema.sql` from this repo, paste the entire file, click **Run**. You should see "Success. No rows returned."
6. Open **Project Settings → API**. Copy these two values:
   - **Project URL** → goes into `SUPABASE_URL`
   - **service_role secret** (under "Project API keys") → goes into `SUPABASE_SERVICE_ROLE_KEY`
   ⚠️ The `service_role` key bypasses Row Level Security. Never put it in the frontend / git / a public file. We only ever use it from `/api/*` server functions.

---

## 2. Resend (email — agent alerts + auto-reply)

1. Go to **https://resend.com** and sign up.
2. Click **Add Domain** → enter `kanyeconcierge360.com`.
3. Resend will show you 4–5 DNS records (TXT for SPF/DKIM, MX optional). Add them at whoever hosts your DNS (likely the registrar — Namecheap, GoDaddy, Cloudflare, etc.). DNS propagation usually takes < 1 hour.
4. Once Resend says **Verified**, go to **API Keys** → **Create API Key**. Name it `kanye-prod`, scope `Sending access`, domain `kanyeconcierge360.com`. Copy the key (starts with `re_`).
5. That key goes into `RESEND_API_KEY`.
6. The "from" address goes into `RESEND_FROM` — use:
   `Kanye Concierge 360 <leads@kanyeconcierge360.com>`
   (the local part — `leads@` — can be anything; the domain must be the verified one).
7. Set `AGENT_NOTIFY_EMAIL` to wherever you want the new-lead alerts to land. Most agents use `info@kanyeconcierge360.com` or their personal Gmail.

> **Why not just use FormSubmit.co like before?** FormSubmit requires the recipient to *click a confirmation link in their email* before the first message ever gets through. If `info@kanyeconcierge360.com` never confirmed, every lead since launch went into a black hole. Resend doesn't have that step — once the domain is verified, every email gets delivered.

---

## 3. Twilio (SMS alerts to the agent's phone)

⚠️ **Important — A2P 10DLC.** Since June 2023, U.S. carriers require all business SMS senders to register with "The Campaign Registry" (A2P 10DLC). It's a one-time form. Without it your texts will silently fail or hit huge surcharges. Twilio walks you through it.

1. Go to **https://twilio.com** and sign up. They give $15 trial credit.
2. **Buy a phone number** (Phone Numbers → Buy). Pick a local San Antonio (210/830) area code if available — costs ~$1.15/mo. **Choose SMS-capable.**
3. Go to **Messaging → Regulatory Compliance → A2P 10DLC**. Register a Sole Proprietor Brand (free, ~5 min) and a low-volume "Account Notification" campaign (~$15 one-time, $1.50/mo). This is what lets the agent's number actually deliver texts.
4. From the **Console Dashboard**, copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** (click to reveal) → `TWILIO_AUTH_TOKEN`
5. The number you bought in step 2 (in E.164 format, e.g. `+12105550100`) → `TWILIO_FROM_NUMBER`.
6. The agent's personal cell (E.164, e.g. `+18306996542`) → `AGENT_NOTIFY_PHONE`.

> **Legal note** — these are notification texts to the agent's *own* phone. That's fine. Sending SMS to leads themselves (especially without prior consent) is governed by **TCPA** and can carry $500–$1,500 per-message penalties. Phase 3 of the rebuild will add a "draft + agent-approves" SMS workflow that stays compliant. For now we only text the agent.

---

## 4. Vercel — wire it all up

1. Go to your Vercel project → **Settings → Environment Variables**.
2. Add each of the following (choose **Production**, **Preview**, **Development** — all three):

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | from step 1.6 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1.6 |
   | `RESEND_API_KEY` | from step 2.4 |
   | `RESEND_FROM` | `Kanye Concierge 360 <leads@kanyeconcierge360.com>` |
   | `AGENT_NOTIFY_EMAIL` | where new-lead alerts go |
   | `TWILIO_ACCOUNT_SID` | from step 3.4 |
   | `TWILIO_AUTH_TOKEN` | from step 3.4 |
   | `TWILIO_FROM_NUMBER` | E.164, your Twilio number |
   | `AGENT_NOTIFY_PHONE` | E.164, agent's cell |
   | `SITE_URL` | `https://kanyeconcierge360.com` (used in email links) |
   | `ADMIN_PASSWORD_HASH` | *(already set — don't change)* |
   | `SESSION_SECRET` | *(already set — don't change)* |
   | `BLOB_READ_WRITE_TOKEN` | *(already set — don't change)* |

3. Click **Redeploy** on the latest deployment so the new env vars take effect.

---

## 5. Smoke test

1. Open the site in a fresh incognito window.
2. Go to `/contact.html` and submit a test lead (use your own name + a real email you can check).
3. Within ~30 seconds you should see:
   - The agent's email inbox: a "New Lead — [Your Name]" alert.
   - The agent's phone: an SMS "🏡 New … lead: [Your Name] · …".
   - The email you used as the visitor: a "Thank you" auto-reply.
4. Open `/admin/inbox.html` (sign in with the existing admin password) and confirm the lead appears at the top of the list.

If any of those four things don't happen, check the Vercel Function Logs for `/api/leads` — the cause will be in there.

---

## What changed in this rebuild

- **New unified Inbox** (`/admin/inbox.html`) replaces the old Dashboard / Inquiries / Pipeline / Analytics / Campaigns tabs.
- **Mobile is supported** — the agent can read leads, change pipeline status, and add notes from his phone.
- **All leads now persist in Supabase** — no more localStorage data loss.
- **Forms now show a real error** if delivery fails (instead of silently pretending to succeed).
- **Auto-acknowledgement email** to every prospect within seconds of submission.
- **Agent SMS** within seconds of every new lead.
- **FormSubmit.co kept as a backup** — only fires if the main API is down, so leads are never lost.
- **Videos system was deliberately not touched** — it works the same way it always did.

---

## What's coming in Phase 2 / Phase 3

The same backend in place now is what Phase 2 (Claude AI auto-responder, lead qualification, Calendly booking) and Phase 3 (social posting/monitoring, AI-drafted outreach with one-tap approve) will plug into. Don't ship those without re-reading the legal flags from the original conversation — TCPA, CAN-SPAM, and MLS scraping rules apply.

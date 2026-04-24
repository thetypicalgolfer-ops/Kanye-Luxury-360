// /api/calendly-webhook  (PUBLIC POST)
//
// Receives Calendly booking events and creates a corresponding lead in the
// inbox so the agent sees bookings alongside contact-form submissions.
//
// Accepts payloads from:
//   • Native Calendly webhooks (paid plan: Standard / Teams) — full payload,
//     optional signature header `calendly-webhook-signature`.
//   • Zapier / Make / Pipedream relays (any plan) — same shape, no signature.
//
// Optional security: set CALENDLY_WEBHOOK_SECRET on Vercel to enforce the
// HMAC check. If unset, the endpoint accepts any well-formed payload (fine for
// the Zapier-relay case where Zapier itself authenticates with Calendly).

import crypto from 'node:crypto';
import { getSupabase, supabaseConfigured } from '../lib/supabase.js';
import { notifyAgentNewLead } from '../lib/notify.js';

function bad(res, code, msg) { return res.status(code).json({ error: msg }); }

function verifyCalendlySignature(rawBody, header, secret) {
    if (!header || !secret) return false;
    // Format: t=1234567890,v1=hexsha256
    const parts = String(header).split(',').reduce((acc, p) => {
        const [k, v] = p.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
    }, {});
    const ts = parts.t;
    const v1 = parts.v1;
    if (!ts || !v1) return false;
    const expected = crypto.createHmac('sha256', secret)
        .update(`${ts}.${rawBody}`)
        .digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
    } catch { return false; }
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return bad(res, 405, 'Method not allowed');
    }

    // Capture raw body string for signature verification.
    const rawBody = typeof req.body === 'string'
        ? req.body
        : (req.body ? JSON.stringify(req.body) : '');

    // Optional HMAC signature check (Calendly native webhooks).
    const secret = process.env.CALENDLY_WEBHOOK_SECRET;
    const sig = req.headers['calendly-webhook-signature'];
    if (secret && sig) {
        if (!verifyCalendlySignature(rawBody, sig, secret)) return bad(res, 401, 'invalid signature');
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    // Calendly v2 wraps everything under `payload`. Zapier may pass it flat.
    const event = body.event || body.event_type || 'invitee.created';
    const p = body.payload || body;

    // Only process new bookings (ignore cancellations / reschedules — those are
    // separate event types we can wire up later if useful).
    if (event !== 'invitee.created') {
        return res.status(200).json({ ok: true, ignored: event });
    }

    const scheduled = p.scheduled_event || p.event || {};
    const name      = (p.name || p.invitee_name || 'Calendly Booking').toString().slice(0, 200);
    const email     = (p.email || p.invitee_email || null);
    const phone     = (p.text_reminder_number || p.phone || (p.invitee && p.invitee.phone) || null);
    const eventName = (scheduled.name || 'Consultation').toString().slice(0, 120);
    const startTime = scheduled.start_time || scheduled.start || null;
    const cancelUrl = p.cancel_url || (p.invitee && p.invitee.cancel_url) || null;
    const reschedUrl= p.reschedule_url || (p.invitee && p.invitee.reschedule_url) || null;

    // Roll any custom Q&A answers into the lead's message field so the agent
    // sees the full context inline in the inbox timeline.
    const qa = Array.isArray(p.questions_and_answers) ? p.questions_and_answers : [];
    const lines = [`Booked: ${eventName}`];
    if (startTime) {
        try {
            lines.push(`When: ${new Date(startTime).toLocaleString('en-US', {
                dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Chicago',
            })} CT`);
        } catch {}
    }
    if (qa.length) {
        lines.push('');
        for (const q of qa) {
            if (q && q.question && q.answer) lines.push(`Q: ${q.question}\nA: ${q.answer}`);
        }
    }
    const message = lines.join('\n').slice(0, 5000);

    const lead = {
        name, email, phone,
        intent: `Booked: ${eventName}`.slice(0, 120),
        source: 'calendly',
        source_page: cancelUrl,
        message,
        meta: {
            calendly_event_uri: scheduled.uri || null,
            calendly_start_time: startTime,
            calendly_cancel_url: cancelUrl,
            calendly_reschedule_url: reschedUrl,
            received_at: new Date().toISOString(),
        },
    };

    if (!supabaseConfigured()) {
        console.warn('[calendly-webhook] Supabase not configured — booking not stored');
        // Still notify so the agent doesn't miss it.
        await notifyAgentNewLead(lead).catch(() => {});
        return res.status(200).json({ ok: true, persisted: false });
    }

    const supa = getSupabase();
    const { data, error } = await supa
        .from('leads')
        .insert(lead)
        .select('id')
        .single();
    if (error) {
        console.error('[calendly-webhook] insert failed:', error);
        return res.status(500).json({ error: error.message });
    }

    await supa.from('lead_events').insert({
        lead_id: data.id,
        kind: 'system',
        actor: 'system',
        body: `Booking made via Calendly: ${eventName}${startTime ? ' (' + startTime + ')' : ''}`,
        meta: { source: 'calendly', start_time: startTime, cancel_url: cancelUrl, reschedule_url: reschedUrl },
    });

    await notifyAgentNewLead(lead).catch(e => console.error('[calendly-webhook] notify failed:', e));

    return res.status(200).json({ ok: true, id: data.id });
}

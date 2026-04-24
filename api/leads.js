// /api/leads
//
//   POST   → public. Creates a new lead from a website form submission.
//            Body: { name, email, phone?, intent?, budget?, timeline?, message?,
//                    source?, source_page?, listing_id? }
//            Triggers: agent email + SMS notification, visitor auto-ack email.
//            Returns { ok: true, id } on success.
//
//   GET    → secured (admin token). Lists leads, newest first.
//            Query: ?status=new|contacted|warm|hot|escrow|closed|lost
//                   ?q=<search>   matches name/email/phone/message
//                   ?limit=50 (default)
//
//   PATCH  → secured. Body: { id, status?, priority?, assigned_to?, notes? }
//            Any status change or note is also logged to lead_events.
//
//   DELETE → secured. Body: { id }
//
// Falls back to a 503 explanation if Supabase env vars aren't set.

import { getSupabase, supabaseConfigured } from '../lib/supabase.js';
import { notifyAgentNewLead, sendAutoAcknowledgement } from '../lib/notify.js';
import { requireAuth } from '../lib/auth.js';

const VALID_STATUSES = ['new','contacted','warm','hot','escrow','closed','lost'];

function setNoCache(res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
}
function parseBody(req) {
    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    return body || {};
}
function cleanStr(v, max = 2000) {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s) return null;
    return s.slice(0, max);
}
function bad(res, code, msg) { return res.status(code).json({ error: msg }); }

export default async function handler(req, res) {
    setNoCache(res);

    // CORS — allow same-origin requests from the public site + admin.
    // (All our pages are served from the same Vercel deployment so default
    //  same-origin is fine; this header just makes curl-from-shell friendlier.)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
    if (req.method === 'OPTIONS') return res.status(204).end();

    const supa = getSupabase();

    // ───────────────────── CREATE (public) ─────────────────────
    if (req.method === 'POST') {
        const body = parseBody(req);
        const name  = cleanStr(body.name, 200);
        const email = cleanStr(body.email, 320);
        const phone = cleanStr(body.phone, 40);

        if (!name) return bad(res, 400, 'Name is required.');
        if (!email && !phone) return bad(res, 400, 'Email or phone is required.');

        // Basic email shape check (non-strict — Resend will bounce invalid ones)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return bad(res, 400, 'Please enter a valid email address.');
        }

        // Light spam shield: reject obvious bot submissions.
        // `website` is a honeypot field that real users never see.
        if (body.website) return res.status(200).json({ ok: true, id: 'ignored' });

        const lead = {
            name,
            email,
            phone,
            intent:      cleanStr(body.intent, 120),
            budget:      cleanStr(body.budget, 60),
            timeline:    cleanStr(body.timeline, 60),
            message:     cleanStr(body.message, 5000),
            source:      cleanStr(body.source, 60) || 'website',
            source_page: cleanStr(body.source_page, 500),
            listing_id:  cleanStr(body.listing_id, 80),
            meta: {
                user_agent: cleanStr(req.headers['user-agent'], 300),
                ip: cleanStr(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '', 60),
                referer: cleanStr(req.headers.referer, 500),
            },
        };

        let insertedId = null;
        let agentSettings = null;

        if (supa) {
            const { data, error } = await supa
                .from('leads')
                .insert(lead)
                .select('id')
                .single();
            if (error) {
                console.error('[leads] insert failed:', error);
                return bad(res, 500, 'Could not save lead. Please try again or call us directly.');
            }
            insertedId = data.id;

            // Initial timeline event
            await supa.from('lead_events').insert({
                lead_id: insertedId,
                kind: 'system',
                actor: 'system',
                body: `Lead captured from ${lead.source}${lead.source_page ? ' (' + lead.source_page + ')' : ''}.`,
                meta: {},
            });

            // Load agent settings for auto-reply personalization
            const { data: settings } = await supa
                .from('agent_settings')
                .select('*')
                .eq('id', 1)
                .maybeSingle();
            agentSettings = settings || null;
        } else {
            // Supabase not yet configured — we still send notifications so
            // leads aren't lost during the initial deploy window.
            console.warn('[leads] Supabase not configured — lead will be emailed only, not persisted.');
        }

        // Fire notifications in parallel, don't let failures block the response
        const notifyResult = await Promise.allSettled([
            notifyAgentNewLead(lead),
            sendAutoAcknowledgement(lead, agentSettings),
        ]);

        // Log notification results to the lead timeline (best-effort)
        if (supa && insertedId) {
            const events = [];
            const [agentRes, ackRes] = notifyResult;
            if (agentRes.status === 'fulfilled') {
                const r = agentRes.value;
                if (r.email && r.email.ok)  events.push({ lead_id: insertedId, kind: 'system', actor: 'system', body: 'Agent alert emailed.', meta: { resend_id: r.email.id } });
                if (r.sms   && r.sms.ok)    events.push({ lead_id: insertedId, kind: 'system', actor: 'system', body: 'Agent SMS sent.',      meta: { twilio_sid: r.sms.sid } });
            }
            if (ackRes.status === 'fulfilled' && ackRes.value && ackRes.value.ok) {
                events.push({ lead_id: insertedId, kind: 'email_sent', actor: 'system', body: 'Auto-acknowledgement sent to prospect.', meta: { resend_id: ackRes.value.id } });
            }
            if (events.length) await supa.from('lead_events').insert(events);
        }

        return res.status(200).json({
            ok: true,
            id: insertedId,
            persisted: !!supa,
        });
    }

    // ─────────────── Everything below requires admin auth ───────────────
    if (!requireAuth(req)) return bad(res, 401, 'Unauthorized');
    if (!supabaseConfigured() || !supa) {
        return res.status(503).json({
            error: 'Supabase is not configured yet. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel (see SETUP.md).',
        });
    }

    // ───────────────────── LIST (secured) ─────────────────────
    if (req.method === 'GET') {
        const url = new URL(req.url, 'http://x');
        const status = url.searchParams.get('status');
        const q      = url.searchParams.get('q');
        const limit  = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 500);

        let query = supa.from('leads').select('*').order('created_at', { ascending: false }).limit(limit);
        if (status && VALID_STATUSES.includes(status)) query = query.eq('status', status);
        if (q) {
            const like = `%${q.replace(/[%_]/g, '')}%`;
            query = query.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like},message.ilike.${like}`);
        }
        const { data, error } = await query;
        if (error) return bad(res, 500, error.message);
        return res.status(200).json({ leads: data || [] });
    }

    // ───────────────────── UPDATE (secured) ─────────────────────
    if (req.method === 'PATCH') {
        const body = parseBody(req);
        const id   = cleanStr(body.id, 80);
        if (!id) return bad(res, 400, 'id required');

        const patch = {};
        if (body.status != null) {
            if (!VALID_STATUSES.includes(body.status)) return bad(res, 400, 'invalid status');
            patch.status = body.status;
        }
        if (body.priority != null)    patch.priority    = body.priority === 'high' ? 'high' : 'normal';
        if (body.assigned_to != null) patch.assigned_to = cleanStr(body.assigned_to, 200);

        if (Object.keys(patch).length) {
            const { error } = await supa.from('leads').update(patch).eq('id', id);
            if (error) return bad(res, 500, error.message);
        }

        // Timeline events for status change + optional note
        const events = [];
        if (patch.status) events.push({ lead_id: id, kind: 'status', actor: body.actor || 'agent', body: `Status → ${patch.status}` });
        const note = cleanStr(body.note, 5000);
        if (note) events.push({ lead_id: id, kind: 'note', actor: body.actor || 'agent', body: note });
        if (events.length) await supa.from('lead_events').insert(events);

        return res.status(200).json({ ok: true });
    }

    // ───────────────────── DELETE (secured) ─────────────────────
    if (req.method === 'DELETE') {
        const body = parseBody(req);
        const id   = cleanStr(body.id, 80);
        if (!id) return bad(res, 400, 'id required');
        const { error } = await supa.from('leads').delete().eq('id', id);
        if (error) return bad(res, 500, error.message);
        return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return bad(res, 405, 'Method not allowed');
}

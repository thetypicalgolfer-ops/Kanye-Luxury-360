// /api/lead-events?lead_id=<uuid>
//
//   GET  → secured. Returns the timeline for a lead (newest first).
//   POST → secured. Adds a note or custom event to a lead's timeline.
//          Body: { lead_id, kind?, body, meta? }
//
// Separate from /api/leads so the inbox can lazy-load a lead's full history
// only when the agent opens it.

import { getSupabase, supabaseConfigured } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';

function bad(res, code, msg) { return res.status(code).json({ error: msg }); }

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (!requireAuth(req)) return bad(res, 401, 'Unauthorized');
    if (!supabaseConfigured()) return bad(res, 503, 'Supabase is not configured yet.');

    const supa = getSupabase();

    if (req.method === 'GET') {
        const url = new URL(req.url, 'http://x');
        const leadId = url.searchParams.get('lead_id');
        if (!leadId) return bad(res, 400, 'lead_id required');
        const { data, error } = await supa
            .from('lead_events')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) return bad(res, 500, error.message);
        return res.status(200).json({ events: data || [] });
    }

    if (req.method === 'POST') {
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
        body = body || {};
        const leadId = body.lead_id;
        const text   = String(body.body || '').trim();
        const kind   = String(body.kind || 'note').trim();
        if (!leadId || !text) return bad(res, 400, 'lead_id and body required');

        const { data, error } = await supa
            .from('lead_events')
            .insert({
                lead_id: leadId,
                kind,
                actor: body.actor || 'agent',
                body: text.slice(0, 5000),
                meta: body.meta || {},
            })
            .select('*')
            .single();
        if (error) return bad(res, 500, error.message);
        return res.status(200).json({ ok: true, event: data });
    }

    res.setHeader('Allow', 'GET, POST');
    return bad(res, 405, 'Method not allowed');
}

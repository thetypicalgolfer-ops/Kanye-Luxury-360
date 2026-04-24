// /api/agent-settings — secured. Read + save the agent's profile & notification prefs.
// Single-row table (id = 1).

import { getSupabase, supabaseConfigured } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';

const EDITABLE_FIELDS = [
    'agent_name', 'agent_email', 'agent_phone', 'agent_photo_url',
    'notify_email', 'notify_sms',
    'auto_reply_enabled', 'auto_reply_subject', 'auto_reply_body',
];

function bad(res, code, msg) { return res.status(code).json({ error: msg }); }

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (!requireAuth(req)) return bad(res, 401, 'Unauthorized');
    if (!supabaseConfigured()) return bad(res, 503, 'Supabase is not configured yet.');

    const supa = getSupabase();

    if (req.method === 'GET') {
        const { data, error } = await supa.from('agent_settings').select('*').eq('id', 1).maybeSingle();
        if (error) return bad(res, 500, error.message);
        return res.status(200).json({ settings: data || null });
    }

    if (req.method === 'PUT') {
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
        body = body || {};
        const patch = {};
        for (const f of EDITABLE_FIELDS) {
            if (f in body) patch[f] = body[f];
        }
        patch.updated_at = new Date().toISOString();

        const { data, error } = await supa
            .from('agent_settings')
            .upsert({ id: 1, ...patch })
            .select('*')
            .single();
        if (error) return bad(res, 500, error.message);
        return res.status(200).json({ ok: true, settings: data });
    }

    res.setHeader('Allow', 'GET, PUT');
    return bad(res, 405, 'Method not allowed');
}

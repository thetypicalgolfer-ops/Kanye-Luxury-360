// /api/integration-status  (SECURED, GET)
//
// Reports the live wiring status of each backend service the admin panel
// needs to display (Supabase, Resend, Vercel Blob, Twilio). Used by the
// Settings → Integrations page to show real "Connected" badges instead of
// hardcoded ones.
//
// We avoid making real outbound calls (which would burn quota on every page
// load) — instead we just check that the relevant env vars are set and that
// Supabase responds to a trivial query.

import { getSupabase, supabaseConfigured } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';

function bad(res, code, msg) { return res.status(code).json({ error: msg }); }

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (!requireAuth(req)) return bad(res, 401, 'Unauthorized');
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return bad(res, 405, 'Method not allowed');
    }

    // Supabase: reachable AND can query agent_settings?
    let supabaseOk = false, supabaseError = null;
    if (supabaseConfigured()) {
        try {
            const supa = getSupabase();
            const { error } = await supa.from('agent_settings').select('id').limit(1);
            supabaseOk = !error;
            if (error) supabaseError = error.message;
        } catch (e) { supabaseError = e.message; }
    }

    const out = {
        supabase: {
            configured: supabaseConfigured(),
            connected: supabaseOk,
            error: supabaseError,
        },
        resend: {
            configured: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM),
            sandboxMode: !!(process.env.RESEND_FROM && process.env.RESEND_FROM.includes('@resend.dev')),
            notifyEmail: process.env.AGENT_NOTIFY_EMAIL || null,
            autoReplyDisabled: process.env.AUTO_REPLY_DISABLED === '1',
        },
        twilio: {
            configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
            notifyPhone: process.env.AGENT_NOTIFY_PHONE || null,
        },
        vercelBlob: {
            configured: !!process.env.BLOB_READ_WRITE_TOKEN,
        },
        adminAuth: {
            configured: !!(process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET),
        },
    };
    return res.status(200).json(out);
}

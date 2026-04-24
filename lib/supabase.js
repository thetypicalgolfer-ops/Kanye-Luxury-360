// Supabase client used by the serverless API functions.
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from Vercel env.
// If either is missing we return null so callers can fall back gracefully
// (useful during initial deployment before the client has provisioned Supabase).

import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabase() {
    if (_client) return _client;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;

    _client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { 'x-application-name': 'kanye-concierge-360' } },
    });
    return _client;
}

export function supabaseConfigured() {
    return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

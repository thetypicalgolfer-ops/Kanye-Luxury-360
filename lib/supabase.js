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

// The database has hung for months (every query timed out the function), and the lead form
// waited on it before emailing anyone, so leads were lost. Cap every database call on the
// lead path: on timeout or error we carry on without it.
export async function withTimeout(promise, ms = 3500) {
    let timer;
    const timeout = new Promise(resolve => {
        timer = setTimeout(() => resolve({ data: null, error: { message: `database timed out after ${ms}ms` } }), ms);
    });
    try {
        return await Promise.race([Promise.resolve(promise).catch(err => ({ data: null, error: err })), timeout]);
    } finally {
        clearTimeout(timer);
    }
}

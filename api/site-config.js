// /api/site-config  (PUBLIC, GET)
//
// Returns the small set of integration values the public site needs to inject
// at runtime: Calendly URL, GA4 measurement ID, Meta Pixel ID. No PII, no auth
// required — these values are inherently public the moment they're wired into
// the page.
//
// Cached for 5 min via CDN to keep Supabase quiet on traffic spikes.

import { getSupabase, supabaseConfigured } from '../lib/supabase.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

    if (!supabaseConfigured()) {
        return res.status(200).json({ calendly_url: null, ga4_id: null, meta_pixel_id: null });
    }

    const supa = getSupabase();
    const { data, error } = await supa
        .from('agent_settings')
        .select('calendly_url, ga4_id, meta_pixel_id')
        .eq('id', 1)
        .maybeSingle();

    if (error) {
        // Fail soft — public site keeps working without integrations.
        return res.status(200).json({ calendly_url: null, ga4_id: null, meta_pixel_id: null });
    }

    return res.status(200).json({
        calendly_url:  (data && data.calendly_url)  || null,
        ga4_id:        (data && data.ga4_id)        || null,
        meta_pixel_id: (data && data.meta_pixel_id) || null,
    });
}

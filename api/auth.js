// POST /api/auth  body: { password }
// Validates password against ADMIN_PASSWORD_HASH (SHA-256 hex stored in Vercel env).
// On success returns { token } — an HMAC-signed session token (8h expiry) used by
// /api/upload-url and /api/videos for write actions.

import { signToken, sha256Hex } from '../lib/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const expectedHash = process.env.ADMIN_PASSWORD_HASH;
    const secret       = process.env.SESSION_SECRET;
    if (!expectedHash || !secret) {
        return res.status(500).json({ error: 'Server is not configured. Missing ADMIN_PASSWORD_HASH or SESSION_SECRET env vars on Vercel.' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const password = (body && body.password) || '';
    if (!password) return res.status(400).json({ error: 'Password required' });

    if (sha256Hex(password) !== expectedHash.toLowerCase()) {
        // Small delay slows brute force without locking the function open.
        await new Promise(r => setTimeout(r, 600));
        return res.status(401).json({ error: 'Invalid password' });
    }

    const token = signToken(secret);
    return res.status(200).json({ token, expiresIn: 8 * 60 * 60 });
}

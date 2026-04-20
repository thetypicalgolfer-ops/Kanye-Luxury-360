// Shared HMAC session-token helpers for the secured admin endpoints.
// Tokens are signed with SESSION_SECRET (Vercel env var) and expire after 8 hours.

import crypto from 'node:crypto';

const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function b64url(buf) {
    return Buffer.from(buf).toString('base64')
        .replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function b64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64');
}

export function signToken(secret) {
    if (!secret) throw new Error('SESSION_SECRET is not configured');
    const payload = { iat: Date.now(), exp: Date.now() + TTL_MS };
    const payloadB64 = b64url(JSON.stringify(payload));
    const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest();
    return `${payloadB64}.${b64url(sig)}`;
}

export function verifyToken(token, secret) {
    if (!token || !secret) return false;
    const parts = String(token).split('.');
    if (parts.length !== 2) return false;
    const [payloadB64, sigB64] = parts;

    const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest();
    const provided = b64urlDecode(sigB64);
    if (expected.length !== provided.length) return false;
    if (!crypto.timingSafeEqual(expected, provided)) return false;

    try {
        const payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'));
        if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false;
        return true;
    } catch { return false; }
}

// Reads bearer token from Authorization header or `x-admin-token` header.
export function requireAuth(req) {
    const secret = process.env.SESSION_SECRET;
    let token = '';
    const hdr = req.headers.authorization || req.headers.Authorization || '';
    if (hdr.startsWith('Bearer ')) token = hdr.slice(7);
    if (!token) token = req.headers['x-admin-token'] || '';
    return verifyToken(token, secret);
}

// SHA-256 hex digest — used to compare against ADMIN_PASSWORD_HASH env var.
export function sha256Hex(str) {
    return crypto.createHash('sha256').update(String(str), 'utf8').digest('hex');
}

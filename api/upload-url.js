// POST /api/upload-url
// Issues a one-shot Vercel Blob upload token so the browser can PUT large MP4s
// directly to Blob storage (bypasses the 4.5MB serverless function body limit).
//
// Auth: requires a valid session token in `Authorization: Bearer <token>` header,
//       or — for the client-upload completion callback — Vercel's own request signature.
//
// The @vercel/blob `handleUpload` helper drives the full flow:
//   1) browser calls this endpoint asking permission to upload `<filename>`
//   2) we verify the admin token, then return a signed upload URL
//   3) browser PUTs the file directly to Blob storage
//   4) Blob calls back to this same endpoint to confirm — `onUploadCompleted`

import { handleUpload } from '@vercel/blob/client';
import { verifyToken } from '../lib/auth.js';

const ALLOWED_TYPES  = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
const MAX_BYTES      = 1024 * 1024 * 1024; // 1 GB hard cap per upload

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const secret = process.env.SESSION_SECRET;
    if (!secret) return res.status(500).json({ error: 'SESSION_SECRET not configured' });
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured. Enable Vercel Blob in your project Storage tab.' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

    try {
        const json = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                // The browser passes the admin session token via clientPayload.
                let payload = {};
                try { payload = clientPayload ? JSON.parse(clientPayload) : {}; } catch {}
                if (!verifyToken(payload.token, secret)) {
                    throw new Error('Unauthorized — please sign in to the dashboard again.');
                }
                return {
                    allowedContentTypes: ALLOWED_TYPES,
                    maximumSizeInBytes: MAX_BYTES,
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({ pathname }),
                };
            },
            onUploadCompleted: async () => {
                // Metadata is saved by the browser via POST /api/videos once it has the
                // returned blob URL. Nothing to do here — Vercel just needs a 200 back.
            },
        });
        return res.status(200).json(json);
    } catch (err) {
        return res.status(401).json({ error: err && err.message ? err.message : 'Upload authorization failed' });
    }
}

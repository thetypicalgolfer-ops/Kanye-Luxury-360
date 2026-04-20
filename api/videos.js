// /api/videos
//
//   GET    → public. Returns the list of published videos (for both the public showcase
//            page and the admin dashboard).
//   POST   → secured. Adds a video record after the browser has finished uploading
//            the MP4 to Vercel Blob.  Body: { url, pathname, title, description, poster?, size?, contentType? }
//   DELETE → secured. Body: { id }. Removes the metadata entry AND the underlying
//            video blob in storage.
//
// Storage model: a single JSON file `meta/videos.json` lives in Vercel Blob and
// holds the array of video records. Simple, atomic enough for one-author use.

import { put, list, del } from '@vercel/blob';
import { requireAuth } from '../lib/auth.js';

const META_PATH = 'meta/videos.json';

async function findMetaBlob() {
    const { blobs } = await list({ prefix: 'meta/' });
    return blobs.find(b => b.pathname === META_PATH) || null;
}

async function readVideos() {
    const meta = await findMetaBlob();
    if (!meta) return [];
    try {
        const r = await fetch(meta.url + '?t=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) return [];
        const data = await r.json();
        return Array.isArray(data) ? data : [];
    } catch { return []; }
}

async function writeVideos(arr) {
    // Remove any prior copy (random-suffix tolerant), then write the new file fresh.
    const { blobs } = await list({ prefix: 'meta/' });
    const oldUrls = blobs.filter(b => b.pathname === META_PATH).map(b => b.url);
    if (oldUrls.length) { try { await del(oldUrls); } catch {} }

    await put(META_PATH, JSON.stringify(arr, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
    });
}

function uid() {
    return 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function setNoCache(res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
}

export default async function handler(req, res) {
    setNoCache(res);

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured. Enable Vercel Blob in Storage.' });
    }

    try {
        if (req.method === 'GET') {
            const videos = await readVideos();
            // Newest first so both pages render in the right order without sorting client-side.
            videos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            return res.status(200).json({ videos });
        }

        if (req.method === 'POST') {
            if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

            let body = req.body;
            if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
            const { url, pathname, title, description = '', poster = '', size = 0, contentType = '' } = body || {};
            if (!url || !pathname) return res.status(400).json({ error: 'url and pathname required' });
            if (!title || !title.trim()) return res.status(400).json({ error: 'title required' });

            const videos = await readVideos();
            const record = {
                id: uid(),
                title: String(title).trim().slice(0, 140),
                description: String(description).trim().slice(0, 2000),
                url, pathname,
                poster: poster || '',
                size: Number(size) || 0,
                contentType: String(contentType || ''),
                createdAt: Date.now(),
            };
            videos.push(record);
            await writeVideos(videos);
            return res.status(200).json({ ok: true, video: record });
        }

        if (req.method === 'DELETE') {
            if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

            let body = req.body;
            if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
            const id = body && body.id;
            if (!id) return res.status(400).json({ error: 'id required' });

            const videos = await readVideos();
            const idx = videos.findIndex(v => v.id === id);
            if (idx === -1) return res.status(404).json({ error: 'Not found' });

            const target = videos[idx];
            videos.splice(idx, 1);
            // Best-effort blob delete — if the underlying object is already gone, ignore.
            try { if (target.url) await del(target.url); } catch {}
            await writeVideos(videos);
            return res.status(200).json({ ok: true });
        }

        res.setHeader('Allow', 'GET, POST, DELETE');
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        return res.status(500).json({ error: err && err.message ? err.message : 'Server error' });
    }
}

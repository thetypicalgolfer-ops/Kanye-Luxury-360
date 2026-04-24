// ============================================================
//   KANYE CONCIERGE 360 — INBOX (CRM)
//   Fresh, mobile-friendly, Supabase-backed.
// ============================================================

// ── AUTH GUARD ────────────────────────────────────────
// Mirrors the existing admin auth (sessionStorage-based) but does NOT
// block mobile devices — the agent needs to read leads on his phone.
(function authGuard() {
    if (!sessionStorage.getItem('kl360_auth')) {
        window.location.href = 'login.html';
    }
})();

function logoutInbox() {
    sessionStorage.removeItem('kl360_auth');
    sessionStorage.removeItem('kl360_server_token');
    window.location.href = 'login.html';
}

// ── API ───────────────────────────────────────────────
const API = {
    token() { return sessionStorage.getItem('kl360_server_token') || ''; },
    headers(extra = {}) {
        const h = { 'Content-Type': 'application/json', ...extra };
        const t = this.token();
        if (t) h['Authorization'] = `Bearer ${t}`;
        return h;
    },
    async listLeads({ status, q } = {}) {
        const u = new URL('/api/leads', location.origin);
        if (status) u.searchParams.set('status', status);
        if (q)      u.searchParams.set('q', q);
        const r = await fetch(u, { headers: this.headers(), cache: 'no-store' });
        if (r.status === 401) { logoutInbox(); throw new Error('unauthorized'); }
        if (r.status === 503) { showConfigBanner(); return []; }
        if (!r.ok) throw new Error((await safeErr(r)) || 'Could not load leads');
        const j = await r.json();
        return j.leads || [];
    },
    async patchLead(id, patch) {
        const r = await fetch('/api/leads', {
            method: 'PATCH', headers: this.headers(),
            body: JSON.stringify({ id, ...patch }),
        });
        if (!r.ok) throw new Error((await safeErr(r)) || 'Could not update lead');
        return r.json();
    },
    async deleteLead(id) {
        const r = await fetch('/api/leads', {
            method: 'DELETE', headers: this.headers(),
            body: JSON.stringify({ id }),
        });
        if (!r.ok) throw new Error((await safeErr(r)) || 'Could not delete lead');
        return r.json();
    },
    async listEvents(leadId) {
        const u = new URL('/api/lead-events', location.origin);
        u.searchParams.set('lead_id', leadId);
        const r = await fetch(u, { headers: this.headers(), cache: 'no-store' });
        if (!r.ok) throw new Error((await safeErr(r)) || 'Could not load events');
        const j = await r.json();
        return j.events || [];
    },
    async addEvent(leadId, body, kind = 'note') {
        const r = await fetch('/api/lead-events', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify({ lead_id: leadId, body, kind }),
        });
        if (!r.ok) throw new Error((await safeErr(r)) || 'Could not save note');
        const j = await r.json();
        return j.event;
    },
};

async function safeErr(r) { try { const j = await r.json(); return j.error; } catch { return null; } }

// ── STATE ─────────────────────────────────────────────
const state = {
    leads: [],
    events: [],
    selectedId: null,
    filter: '',           // status filter ('' | new | contacted | …)
    query: '',
    seenKey: 'kl360_seen_lead_ids',
    seen: new Set(),
};

try { state.seen = new Set(JSON.parse(localStorage.getItem(state.seenKey) || '[]')); } catch {}

// ── HELPERS ───────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
}
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function timeAgo(iso) {
    const t = new Date(iso).getTime();
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return Math.floor(s/60) + 'm';
    if (s < 86400) return Math.floor(s/3600) + 'h';
    if (s < 86400*7) return Math.floor(s/86400) + 'd';
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function fullDate(iso) {
    return new Date(iso).toLocaleString('en-US', {
        month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit'
    });
}
function snippet(s, n = 80) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '…' : s;
}
function toast(msg, type = 'success') {
    const c = $('toast-container'); if (!c) return;
    const t = el('div', 'toast ' + type);
    t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(0)'; });
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(30px)'; setTimeout(() => t.remove(), 350); }, 2800);
}
function showConfigBanner() {
    const b = $('config-banner');
    if (b) b.style.display = 'block';
}

// ── RENDER LIST ───────────────────────────────────────
function renderList() {
    const body = $('inbox-list-body');
    const filtered = state.leads;
    $('inbox-count').textContent = filtered.length + (filtered.length === 1 ? ' lead' : ' leads');

    if (!filtered.length) {
        body.innerHTML = '';
        const empty = el('div', 'empty-pane');
        empty.innerHTML = `
            <h3>No leads ${state.filter || state.query ? 'match' : 'yet'}</h3>
            <p>${state.filter || state.query
                ? 'Try clearing your search or filter above.'
                : 'Once a visitor submits the contact or consultation form on your website, they will appear here.'}</p>`;
        body.appendChild(empty);
        return;
    }

    body.innerHTML = '';
    for (const lead of filtered) {
        const row = el('div', 'lead-row');
        if (lead.id === state.selectedId) row.classList.add('active');
        if (!state.seen.has(lead.id) && lead.status === 'new') row.classList.add('unread');

        const intentLine = [lead.intent, lead.budget].filter(Boolean).join(' · ');
        const initials = (lead.name || '?')
            .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?';
        const isSubscriber = lead.source === 'listing-alerts';
        if (isSubscriber) row.classList.add('soft-lead');
        const sourceBadge = isSubscriber
            ? '<span class="lead-row-source-badge" title="Subscribed via listing-alerts form">Subscriber</span>'
            : '';
        const snippetText = isSubscriber
            ? (lead.email || 'Listing alerts subscriber')
            : (lead.message || lead.email || lead.phone || '');
        row.innerHTML = `
            <div class="lead-row-avatar">${escapeHtml(initials)}</div>
            <div class="lead-row-body">
                <div class="lead-row-top">
                    <div class="lead-row-name">${escapeHtml(lead.name || 'Unknown')}</div>
                    <div class="lead-row-time">${timeAgo(lead.created_at)}</div>
                </div>
                ${intentLine ? `<div class="lead-row-intent">${escapeHtml(intentLine)}</div>` : ''}
                <div class="lead-row-snippet">${escapeHtml(snippet(snippetText))}</div>
                <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap">
                    <span class="lead-row-status ${escapeHtml(lead.status || 'new')}">${escapeHtml(lead.status || 'new')}</span>
                    ${sourceBadge}
                </div>
            </div>
        `;
        row.addEventListener('click', () => selectLead(lead.id));
        body.appendChild(row);
    }
}

// ── RENDER THREAD ─────────────────────────────────────
async function selectLead(id) {
    state.selectedId = id;
    state.seen.add(id);
    try { localStorage.setItem(state.seenKey, JSON.stringify(Array.from(state.seen))); } catch {}

    const lead = state.leads.find(l => l.id === id);
    if (!lead) return;

    $('inbox-empty').style.display = 'none';
    $('thread-content').style.display = 'flex';

    $('thread-name').textContent = lead.name || 'Unknown';
    const meta = [];
    if (lead.email) meta.push(`<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>`);
    if (lead.phone) meta.push(`<a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>`);
    meta.push(`Received ${fullDate(lead.created_at)}`);
    $('thread-meta').innerHTML = meta.join(' · ');

    renderList();
    renderDetail(lead);

    // mobile: switch to thread pane
    mobileShow('thread');
    $('mobile-detail-btn').style.display = (window.innerWidth <= 1024) ? 'inline-block' : 'none';

    // Load events
    const tb = $('thread-body');
    tb.innerHTML = `<div class="empty-pane"><p style="font-size:0.85rem">Loading timeline…</p></div>`;
    try {
        const events = await API.listEvents(id);
        state.events = events;
        renderThreadBody(lead, events);
    } catch (err) {
        tb.innerHTML = `<div class="empty-pane"><p>Could not load timeline: ${escapeHtml(err.message)}</p></div>`;
    }
}

function renderThreadBody(lead, events) {
    const tb = $('thread-body');
    tb.innerHTML = '';

    // Original inquiry message at the top
    if (lead.message) {
        const orig = el('div', 'thread-original');
        orig.innerHTML = `
            <div class="thread-original-label">Original Inquiry · ${escapeHtml(fullDate(lead.created_at))}</div>
            <div class="thread-original-msg">${escapeHtml(lead.message)}</div>
        `;
        tb.appendChild(orig);
    }

    // Events newest-first → reverse to chronological
    const chrono = [...events].reverse();
    for (const ev of chrono) {
        const row = el('div', 'thread-event kind-' + (ev.kind || 'note'));
        const icon = { note:'✎', status:'⇄', system:'•', email_sent:'✉', sms_sent:'✆', call:'☎', email_in:'✉' }[ev.kind] || '•';
        row.innerHTML = `
            <div class="event-icon">${icon}</div>
            <div class="event-body">
                <div class="event-meta">${escapeHtml(ev.kind)} · ${escapeHtml(ev.actor || 'system')} · ${escapeHtml(fullDate(ev.created_at))}</div>
                <div class="event-text">${escapeHtml(ev.body || '')}</div>
            </div>
        `;
        tb.appendChild(row);
    }

    // Scroll to bottom (newest)
    tb.scrollTop = tb.scrollHeight;
}

// ── RENDER DETAIL RAIL ────────────────────────────────
function renderDetail(lead) {
    const d = $('inbox-detail');
    d.innerHTML = '';

    // Status changer
    const statusSec = el('div', 'detail-section');
    statusSec.innerHTML = `<div class="detail-label">Pipeline Stage</div>`;
    const grid = el('div', 'status-grid');
    for (const s of ['new','contacted','warm','hot','escrow','closed','lost']) {
        const btn = el('button', 'status-btn' + (lead.status === s ? ' active' : ''), s);
        btn.addEventListener('click', () => updateStatus(lead.id, s));
        grid.appendChild(btn);
    }
    statusSec.appendChild(grid);
    d.appendChild(statusSec);

    // Quick actions
    const actSec = el('div', 'detail-section');
    actSec.innerHTML = `<div class="detail-label">Quick Actions</div>`;
    const actGrid = el('div', 'quick-actions');
    if (lead.email) {
        const a = el('a', 'quick-action');
        a.href = `mailto:${lead.email}?subject=Re: Your inquiry — Kanye Concierge 360`;
        a.textContent = 'Email';
        actGrid.appendChild(a);
    }
    if (lead.phone) {
        const a = el('a', 'quick-action');
        a.href = `tel:${lead.phone}`;
        a.textContent = 'Call';
        actGrid.appendChild(a);
        const sms = el('a', 'quick-action');
        sms.href = `sms:${lead.phone}`;
        sms.textContent = 'Text';
        actGrid.appendChild(sms);
    }
    const del = el('button', 'quick-action danger', 'Delete');
    del.addEventListener('click', () => deleteLead(lead.id));
    actGrid.appendChild(del);
    actSec.appendChild(actGrid);
    d.appendChild(actSec);

    // Lead details
    const info = el('div', 'detail-section');
    info.innerHTML = `<div class="detail-label">Lead Details</div>`;
    const rows = [
        ['Name',     lead.name],
        ['Email',    lead.email && `<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>`],
        ['Phone',    lead.phone && `<a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>`],
        ['Intent',   lead.intent],
        ['Budget',   lead.budget],
        ['Timeline', lead.timeline],
        ['Source',   lead.source],
        ['Page',     lead.source_page && `<a href="${escapeHtml(lead.source_page)}" target="_blank">${escapeHtml(snippet(lead.source_page, 30))}</a>`],
        ['Listing',  lead.listing_id],
        ['Received', fullDate(lead.created_at)],
    ];
    for (const [k, v] of rows) {
        if (!v) continue;
        const r = el('div', 'detail-row');
        const valHtml = typeof v === 'string' && v.startsWith('<a ') ? v : escapeHtml(v);
        r.innerHTML = `<div class="detail-row-key">${k}</div><div class="detail-row-val">${valHtml}</div>`;
        info.appendChild(r);
    }
    d.appendChild(info);
}

// ── ACTIONS ───────────────────────────────────────────
async function updateStatus(id, status) {
    try {
        await API.patchLead(id, { status });
        const idx = state.leads.findIndex(l => l.id === id);
        if (idx !== -1) state.leads[idx].status = status;
        const lead = state.leads[idx];
        if (lead) {
            renderDetail(lead);
            // Re-load events to show the new status entry
            const events = await API.listEvents(id);
            state.events = events;
            renderThreadBody(lead, events);
        }
        renderList();
        toast(`Marked ${status}`);
    } catch (err) {
        toast(err.message, 'danger');
    }
}

async function addNote() {
    const ta = $('compose-text');
    const text = ta.value.trim();
    if (!text || !state.selectedId) return;
    const send = $('compose-send');
    send.disabled = true;
    try {
        await API.addEvent(state.selectedId, text, 'note');
        ta.value = '';
        const lead = state.leads.find(l => l.id === state.selectedId);
        if (lead) {
            const events = await API.listEvents(state.selectedId);
            state.events = events;
            renderThreadBody(lead, events);
        }
        toast('Note added');
    } catch (err) {
        toast(err.message, 'danger');
    } finally {
        send.disabled = false;
    }
}

async function deleteLead(id) {
    if (!confirm('Delete this lead permanently? This cannot be undone.')) return;
    try {
        await API.deleteLead(id);
        state.leads = state.leads.filter(l => l.id !== id);
        if (state.selectedId === id) {
            state.selectedId = null;
            $('thread-content').style.display = 'none';
            $('inbox-empty').style.display = 'flex';
            $('inbox-detail').innerHTML = '<div class="empty-pane"><p style="font-size:0.85rem">Lead details appear here.</p></div>';
        }
        renderList();
        toast('Lead deleted');
    } catch (err) {
        toast(err.message, 'danger');
    }
}

// ── MOBILE PANE SWITCHER ──────────────────────────────
function mobileShow(which) {
    if (window.innerWidth > 1024) return;
    for (const id of ['inbox-list','inbox-thread','inbox-detail']) {
        const el = document.getElementById(id);
        if (!el) continue;
        const mode = id === 'inbox-list' ? 'list' : id === 'inbox-thread' ? 'thread' : 'detail';
        el.dataset.mobileActive = which;
        el.style.display = (mode === which) ? 'flex' : 'none';
    }
}
window.mobileShow = mobileShow;
window.logoutInbox = logoutInbox;
window.addNote = addNote;

// ── LOAD + REFRESH ────────────────────────────────────
async function refreshLeads() {
    try {
        const leads = await API.listLeads({ status: state.filter || undefined, q: state.query || undefined });
        state.leads = leads;
        renderList();
        // If a lead is selected but no longer in the filtered list, keep it visible
        if (state.selectedId && !leads.some(l => l.id === state.selectedId)) {
            // Try to refresh just that lead's view by leaving thread alone
        }
    } catch (err) {
        if (err.message !== 'unauthorized') {
            $('inbox-list-body').innerHTML = `<div class="empty-pane"><h3>Cannot load leads</h3><p>${escapeHtml(err.message)}</p></div>`;
        }
    }
}

// ── WIRING ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.filter = chip.dataset.status || '';
            refreshLeads();
        });
    });

    // Search (debounced)
    let qTimer;
    $('inbox-search').addEventListener('input', e => {
        clearTimeout(qTimer);
        qTimer = setTimeout(() => {
            state.query = e.target.value.trim();
            refreshLeads();
        }, 250);
    });

    // Compose: Cmd/Ctrl+Enter sends
    $('compose-text').addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            addNote();
        }
    });

    refreshLeads();
    // Light polling — every 30s pull new leads. Cheap on Supabase free tier.
    setInterval(refreshLeads, 30000);

    // Re-evaluate panes on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            // Reset to all visible
            for (const id of ['inbox-list','inbox-thread','inbox-detail']) {
                const e = document.getElementById(id);
                if (e) e.style.display = '';
            }
        } else if (state.selectedId) {
            mobileShow('thread');
        } else {
            mobileShow('list');
        }
    });
});

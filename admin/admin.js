// ============================================================
//   KANYE CONCIERGE 360 — ADMIN BACKEND · Full Engine
// ============================================================

// ── ONE-TIME LIVE CUTOVER ────────────────────────────────
// Wipes any demo data previously cached in the client's browser so the
// dashboard starts from a clean, live state. Bump this version string to
// force another wipe in the future.
(function () {
    const SCHEMA_VERSION = 'live-1';
    try {
        if (localStorage.getItem('kl360_schema_version') !== SCHEMA_VERSION) {
            localStorage.removeItem('kl360_listings');
            localStorage.removeItem('kl360_inquiries');
            localStorage.removeItem('kl360_campaigns');
            localStorage.setItem('kl360_schema_version', SCHEMA_VERSION);
        }
    } catch (e) { /* localStorage unavailable — ignore */ }
})();

// ── DATA LAYER ───────────────────────────────────────────
const DB = {
    get(key, fallback = []) {
        const val = localStorage.getItem('kl360_' + key);
        return val ? JSON.parse(val) : fallback;
    },
    set(key, data) {
        localStorage.setItem('kl360_' + key, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('db:update', { detail: { key } }));
        // Notify other tabs (homepage, properties) to re-render live
        try { new BroadcastChannel('kl360_sync').postMessage({ key }); } catch(e) {}
    },
    // LIVE MODE: no seed data. Dashboard starts empty and populates
    // only from real listings, website inquiries, and agent-created campaigns.
    getListings()  { return this.get('listings',  []); },
    saveListings(data)  { this.set('listings',  data); },
    getInquiries() { return this.get('inquiries', []); },
    saveInquiries(data) { this.set('inquiries', data); },
    getCampaigns() { return this.get('campaigns', []); },
    saveCampaigns(data) { this.set('campaigns', data); },
};

// ── UTILITIES ─────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function formatCurrency(n) {
    if (n >= 1000000) return '$' + (n/1000000).toFixed(n % 1000000 === 0 ? 0 : 2).replace(/\.?0+$/, '') + 'M';
    if (n >= 1000)    return '$' + (n/1000).toFixed(0) + 'K';
    return '$' + n.toLocaleString();
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function timeSince(iso) {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 3600)  return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
}

// Animated number counter
function animateCounter(el, target, prefix='', suffix='', duration=1400) {
    if (!el) return;
    const start = performance.now();
    const isFloat = String(target).includes('.');
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        const value = isFloat ? (target * ease).toFixed(2) : Math.round(target * ease);
        el.textContent = prefix + value + suffix;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function showToast(msg, type = 'success') {
    let container = $('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success:'✓', danger:'✕', info:'ℹ' };
    toast.innerHTML = `<span style="font-weight:600">${icons[type]||'✓'}</span> ${msg}`;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        setTimeout(() => toast.remove(), 350);
    }, 3200);
}

function badgeHTML(status) {
    const map = {
        'Active':'active','Just Listed':'active','Waterfront':'active','Live':'live',
        'Pending':'pending','Under Contract':'pending','Paused':'paused',
        'Hot Lead':'escrow','In Escrow':'escrow',
        'Warm Lead':'pending','Contacted':'new','New':'new',
        'Off-Market':'off-market','Draft':'draft',
        'Completed':'completed','Closed':'closed','Sold':'sold',
        'Ranch Land':'escrow',
    };
    return `<span class="badge badge-${map[status]||'new'}">${status}</span>`;
}

// ── MODAL HELPERS ─────────────────────────────────────────
function openModal(id) { const el=$(id); if(el){ el.classList.add('open'); el.style.display='flex'; } }
function closeModal(id) { const el=$(id); if(el){ el.classList.remove('open'); setTimeout(()=>{ el.style.display=''; },300); } }
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
});

// ── AUTH ───────────────────────────────────────────────────
// Default credentials: kanye@360.com / admin77
const DEFAULT_EMAIL = 'kanye@360.com';
const DEFAULT_PASS_HASH = 'd1cb6800649969380c1bbb67fa7210e198438e3ec6c94667ecd1a476ceec887b'; // SHA-256 of 'admin77'

async function hashPassword(pass) {
    const data = new TextEncoder().encode(pass);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getStoredCredentials() {
    const stored = localStorage.getItem('kl360_credentials');
    if (stored) return JSON.parse(stored);
    return { email: DEFAULT_EMAIL, passHash: DEFAULT_PASS_HASH };
}

function checkAuth() {
    // Block mobile devices
    if (window.innerWidth < 1024 && !window.location.pathname.endsWith('login.html')) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;font-family:sans-serif;background:#141413;color:#d8ccbc"><div><h2 style="font-size:1.3rem;margin-bottom:1rem;font-weight:300">Desktop Only</h2><p style="font-size:0.85rem;opacity:0.6;line-height:1.6">The Agent Portal is only available on desktop devices.<br>Please access from a computer.</p><a href="../index.html" style="display:inline-block;margin-top:1.5rem;color:#A47C48;font-size:0.8rem">← Back to Website</a></div></div>';
        return;
    }
    if (!sessionStorage.getItem('kl360_auth') && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
    const auth = JSON.parse(sessionStorage.getItem('kl360_auth') || '{}');
    const profile = DB.get('profile', { fname: 'Kanye', lname: 'West' });
    const name = (profile.fname || profile.lname) ? `${profile.fname} ${profile.lname}`.trim() : (auth.name || auth.email || 'Agent');
    const initials = name.split(/[\s@]/).map(w=>w.charAt(0)).join('').substring(0,2).toUpperCase() || 'A';

    $$('.user-name').forEach(el => el.textContent = name.includes('@') ? name.split('@')[0] : name);
    $$('.avatar-initials').forEach(el => el.textContent = initials);

    // Apply profile photo to all avatar-wrap elements
    const avatarPhoto = profile.photo;
    $$('.avatar-wrap').forEach(wrap => {
        const existing = wrap.querySelector('img');
        if (avatarPhoto) {
            if (existing) {
                existing.src = avatarPhoto;
            } else {
                const img = document.createElement('img');
                img.src = avatarPhoto;
                img.alt = 'Profile';
                wrap.appendChild(img);
            }
            const init = wrap.querySelector('.avatar-initials');
            if (init) init.style.display = 'none';
        } else {
            if (existing) existing.remove();
            const init = wrap.querySelector('.avatar-initials');
            if (init) init.style.display = '';
        }
    });
}
function logout() {
    sessionStorage.removeItem('kl360_auth');
    sessionStorage.removeItem('kl360_server_token');
    window.location.href = 'login.html';
}

// ── PAGE: LOGIN ───────────────────────────────────────────
function initLogin() {
    // Block mobile on login page too
    if (window.innerWidth < 1024) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;font-family:sans-serif;background:#141413;color:#d8ccbc"><div><h2 style="font-size:1.3rem;margin-bottom:1rem;font-weight:300">Desktop Only</h2><p style="font-size:0.85rem;opacity:0.6;line-height:1.6">The Agent Portal is only available on desktop devices.<br>Please access from a computer.</p><a href="../index.html" style="display:inline-block;margin-top:1.5rem;color:#A47C48;font-size:0.8rem">← Back to Website</a></div></div>';
        return;
    }
    const form = $('login-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = $('login-email').value.trim().toLowerCase();
        const pass  = $('login-pass').value;
        const btn   = form.querySelector('button[type=submit]');
        btn.textContent = 'Signing in…';
        btn.disabled = true;

        const creds = getStoredCredentials();
        const inputHash = await hashPassword(pass);

        if (email === creds.email.toLowerCase() && inputHash === creds.passHash) {
            sessionStorage.setItem('kl360_auth', JSON.stringify({ email, name: email.split('@')[0] }));
            // Also obtain a server-side session token so the agent can upload/delete videos.
            // Failure here is non-fatal — the rest of the dashboard works offline; the
            // videos page will simply show a "reconnect" banner.
            try {
                const r = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pass }),
                });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.token) sessionStorage.setItem('kl360_server_token', data.token);
                } else {
                    sessionStorage.removeItem('kl360_server_token');
                }
            } catch { sessionStorage.removeItem('kl360_server_token'); }
            window.location.href = 'dashboard.html';
        } else {
            const err = $('login-error');
            if (err) { err.textContent = 'Invalid email or password.'; err.style.display = 'block'; }
            btn.textContent = 'Sign In to Dashboard';
            btn.disabled = false;
        }
    });
}

// ── PAGE: DASHBOARD ───────────────────────────────────────
function initDashboard() {
    checkAuth();
    const listings  = DB.getListings();
    const inquiries = DB.getInquiries();
    const campaigns = DB.getCampaigns();

    const activeListings = listings.filter(l => l.status === 'Active').length;
    const totalVolume    = listings.reduce((a,l) => a + l.price, 0);
    const hotLeads       = inquiries.filter(i => i.status === 'Hot Lead' || i.status === 'Warm Lead').length;
    const liveCampaigns  = campaigns.filter(c => c.status === 'Live').length;

    // Animate counters
    animateCounter($('metric-listings'), activeListings);
    animateCounter($('metric-volume-num'), parseFloat((totalVolume/1000000).toFixed(2)), '$', 'M');
    animateCounter($('metric-leads'), hotLeads);
    animateCounter($('metric-campaigns'), liveCampaigns);

    renderInquiriesTable('recent-inquiries-body', inquiries.slice(0,5), true);
    renderMiniListings('recent-listings-body', listings.slice(0,5));
    renderActivityChart();

    // Greeting time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    
    const profile = DB.get('profile', { fname: 'Kanye', lname: 'West' });
    const auth = JSON.parse(sessionStorage.getItem('kl360_auth') || '{}');
    const name = profile.fname ? profile.fname : (auth.name || 'Agent');

    const greetEl = $('greeting');
    if (greetEl) greetEl.textContent = greeting + ', ' + name;
}

function renderActivityChart() {
    const canvas = $('activity-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,0,300);
    grad.addColorStop(0,'rgba(164,124,72,0.35)');
    grad.addColorStop(1,'rgba(164,124,72,0.0)');
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
            datasets: [{
                label: 'Inquiries',
                data: [8,14,11,19,24,17,29],
                borderColor: '#A47C48',
                backgroundColor: grad,
                borderWidth: 2.5,
                tension: 0.4, fill: true,
                pointBackgroundColor: '#A47C48',
                pointBorderColor: '#181817',
                pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 8,
            },{
                label: 'Showings',
                data: [3,6,5,8,12,9,15],
                borderColor: 'rgba(216,204,188,0.35)',
                backgroundColor: 'transparent',
                borderWidth: 1.5, tension: 0.4, fill: false,
                pointBackgroundColor: 'rgba(216,204,188,0.4)',
                pointBorderColor: '#181817',
                pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode:'index', intersect:false },
            plugins: {
                legend: { labels:{ color:'rgba(216,204,188,0.5)', font:{size:11}, boxWidth:12, padding:20 } },
                tooltip: {
                    backgroundColor:'#1E1E1C', titleColor:'#FDFAF6', bodyColor:'rgba(216,204,188,0.8)',
                    borderColor:'rgba(164,124,72,0.3)', borderWidth:1,
                    padding:14, displayColors:true,
                    callbacks:{ label: ctx => ' ' + ctx.dataset.label + ': ' + ctx.parsed.y }
                }
            },
            scales: {
                x: { grid:{ color:'rgba(216,204,188,0.05)', drawBorder:false }, ticks:{ color:'rgba(216,204,188,0.45)', font:{size:11} } },
                y: { grid:{ color:'rgba(216,204,188,0.05)', drawBorder:false }, ticks:{ color:'rgba(216,204,188,0.45)', font:{size:11} }, beginAtZero:true }
            }
        }
    });
}

// ── PAGE: LISTINGS ────────────────────────────────────────
let _uploadedPhotos = []; // base64 data URLs for current form

function initListings() {
    checkAuth();
    renderListingsTable();
    initPhotoUpload();
    initVisibilityToggle();
    initEditPhotoUpload();
    initEditVisibilityToggle();

    const form = $('listing-form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const listings = DB.getListings();
            const priceRaw = $('l-price').value.replace(/[^0-9.]/g,'');
            const visRadio = document.querySelector('input[name="l-visibility"]:checked');
            listings.unshift({
                id: Date.now().toString(),
                title:    $('l-title').value,
                location: $('l-location').value,
                price:    parseFloat(priceRaw) || 0,
                beds:     $('l-beds').value,
                baths:    $('l-baths').value,
                sqft:     $('l-sqft').value,
                acres:    $('l-acres').value || '—',
                status:   $('l-status').value,
                tag:      $('l-tag').value,
                visibility: visRadio ? visRadio.value : 'listings',
                description: $('l-desc').value,
                image:    _uploadedPhotos.length ? _uploadedPhotos[0] : '../img-estate-1.png?v=7',
                photos:   _uploadedPhotos.length ? [..._uploadedPhotos] : [],
                createdAt: new Date().toISOString()
            });
            DB.saveListings(listings);
            closeModal('modal-add-listing');
            form.reset();
            _uploadedPhotos = [];
            renderPhotoPreview();
            resetVisibilityToggle();
            renderListingsTable();
            showToast('Listing created successfully ✓');
        });
    }
    // Filter chips
    $$('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderListingsTable(btn.dataset.filter);
        });
    });
}

// ── PHOTO UPLOAD ──────────────────────────────────────────
function initPhotoUpload() {
    const zone = $('photo-drop-zone');
    const input = $('photo-file-input');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        handlePhotoFiles(input.files);
        input.value = '';
    });

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        handlePhotoFiles(e.dataTransfer.files);
    });
}

function handlePhotoFiles(files) {
    const maxPhotos = 5;
    const remaining = maxPhotos - _uploadedPhotos.length;
    if (remaining <= 0) { showToast('Maximum 5 photos allowed', 'info'); return; }

    const toProcess = Array.from(files).slice(0, remaining);
    toProcess.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            _uploadedPhotos.push(e.target.result);
            renderPhotoPreview();
        };
        reader.readAsDataURL(file);
    });
}

function renderPhotoPreview() {
    const grid = $('photo-preview-grid');
    if (!grid) return;
    if (!_uploadedPhotos.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = _uploadedPhotos.map((src, i) => `
        <div class="photo-preview-item ${i === 0 ? 'primary' : ''}">
            <img src="${src}" alt="Photo ${i+1}">
            <button type="button" class="photo-remove" onclick="removePhoto(${i})" title="Remove">✕</button>
        </div>
    `).join('');
}

function removePhoto(index) {
    _uploadedPhotos.splice(index, 1);
    renderPhotoPreview();
}

// ── VISIBILITY TOGGLE ─────────────────────────────────────
function initVisibilityToggle() {
    $$('.vis-option').forEach(opt => {
        opt.addEventListener('click', () => {
            $$('.vis-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            opt.querySelector('input').checked = true;
        });
    });
}
function resetVisibilityToggle() {
    $$('#modal-add-listing .vis-option').forEach(o => o.classList.remove('active'));
    const def = document.querySelector('#modal-add-listing .vis-option[data-vis="listings"]');
    if (def) { def.classList.add('active'); def.querySelector('input').checked = true; }
}

function initEditVisibilityToggle() {
    document.querySelectorAll('#modal-edit-listing .edit-vis-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('#modal-edit-listing .edit-vis-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            opt.querySelector('input').checked = true;
        });
    });
}

function visibilityBadge(vis) {
    if (vis === 'exceptional') return '<span class="vis-badge vis-exceptional">Exceptional Estates</span>';
    if (vis === 'both') return '<span class="vis-badge vis-both">Both</span>';
    if (vis === 'listings') return '<span class="vis-badge vis-listings">Listings Page</span>';
    // Legacy: treat old 'homepage' as 'both'
    if (vis === 'homepage') return '<span class="vis-badge vis-both">Both</span>';
    return '<span class="vis-badge vis-listings">Listings Page</span>';
}

function renderListingsTable(filter = 'All') {
    const tbody = $('listings-body');
    if (!tbody) return;
    let listings = DB.getListings();
    if (filter !== 'All') listings = listings.filter(l => l.status === filter);
    if (!listings.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:4rem;color:var(--text-secondary)">No listings match this filter.</td></tr>`;
        return;
    }
    tbody.innerHTML = listings.map(l => `
        <tr class="table-row-animate" data-id="${l.id}" onclick="openListingEdit('${l.id}')" style="cursor:pointer">
            <td onclick="event.stopPropagation()">
                <div class="drag-handle" title="Drag to reorder">
                    <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/></svg>
                </div>
            </td>
            <td>
                <div class="listing-preview">
                    <img src="${l.image}" alt="" class="listing-thumb" onerror="this.style.opacity=0">
                    <div>
                        <div class="listing-info-name">${l.title}</div>
                        <div class="listing-info-loc">${l.location}</div>
                    </div>
                </div>
            </td>
            <td style="font-family:var(--serif);font-size:1.1rem">${formatCurrency(l.price)}</td>
            <td style="font-size:0.82rem;color:var(--text-secondary)">${l.beds} bd · ${l.baths} ba · ${Number(l.sqft).toLocaleString()} sf${l.acres && l.acres!=='—' ? ' · '+l.acres+' ac':''}</td>
            <td onclick="event.stopPropagation()">
                <select class="inline-select" onchange="inlineUpdateListing('${l.id}','status',this.value)" title="Change status">
                    ${['Active','Pending','Off-Market','Sold'].map(s => `<option${s===l.status?' selected':''}>${s}</option>`).join('')}
                </select>
            </td>
            <td onclick="event.stopPropagation()">
                <select class="inline-select inline-select-vis" onchange="inlineUpdateListing('${l.id}','visibility',this.value)" title="Change visibility">
                    <option value="exceptional"${l.visibility==='exceptional'?' selected':''}>Exceptional Estates</option>
                    <option value="listings"${(l.visibility||'listings')==='listings'?' selected':''}>Listings Page</option>
                    <option value="both"${(l.visibility==='both'||l.visibility==='homepage')?' selected':''}>Both</option>
                </select>
            </td>
            <td onclick="event.stopPropagation()">
                <select class="inline-select" onchange="inlineUpdateListing('${l.id}','tag',this.value)" title="Change tag">
                    ${['Just Listed','Active','Ranch Land','Waterfront','Under Contract','Off-Market','Sold'].map(t => `<option${t===l.tag?' selected':''}>${t}</option>`).join('')}
                </select>
            </td>
            <td style="font-size:0.82rem;color:var(--text-secondary)">${formatDate(l.createdAt)}</td>
            <td onclick="event.stopPropagation()">
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="openListingEdit('${l.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteListing('${l.id}',event)">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    // Stagger row animation
    setTimeout(() => {
        tbody.querySelectorAll('.table-row-animate').forEach((row,i) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(8px)';
            setTimeout(() => {
                row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, i * 60);
        });
    }, 10);

    // Init drag-and-drop reordering
    initListingsDragDrop();
}

// ── DRAG & DROP REORDER ───────────────────────────────────
function initListingsDragDrop() {
    const tbody = $('listings-body');
    if (!tbody || typeof Sortable === 'undefined') return;

    // Destroy previous instance if exists
    if (tbody._sortable) tbody._sortable.destroy();

    tbody._sortable = new Sortable(tbody, {
        handle: '.drag-handle',
        animation: 250,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onEnd: function(evt) {
            if (evt.oldIndex === evt.newIndex) return;
            const listings = DB.getListings();
            // Get the current filter
            const activeFilter = document.querySelector('[data-filter].active');
            const filter = activeFilter ? activeFilter.dataset.filter : 'All';

            if (filter === 'All') {
                // Direct reorder
                const moved = listings.splice(evt.oldIndex, 1)[0];
                listings.splice(evt.newIndex, 0, moved);
            } else {
                // Reorder within filtered view — map back to full array indices
                const filtered = listings.filter(l => l.status === filter);
                const movedId = filtered[evt.oldIndex]?.id;
                const targetId = filtered[evt.newIndex]?.id;
                if (movedId && targetId) {
                    const fromIdx = listings.findIndex(l => l.id === movedId);
                    const toIdx = listings.findIndex(l => l.id === targetId);
                    const moved = listings.splice(fromIdx, 1)[0];
                    listings.splice(toIdx, 0, moved);
                }
            }
            DB.saveListings(listings);
            showToast('Listing order updated', 'info');
        }
    });
}

// ── INLINE TABLE UPDATES ──────────────────────────────────
function inlineUpdateListing(id, field, value) {
    const listings = DB.getListings();
    const idx = listings.findIndex(l => l.id === id);
    if (idx === -1) return;
    listings[idx][field] = value;
    DB.saveListings(listings);
    const labels = { status:'Status', visibility:'Visibility', tag:'Tag' };
    showToast(`${labels[field] || field} updated to "${value}"`);
}

// ── EDIT LISTING MODAL ────────────────────────────────────
let _editPhotos = [];
let _editListingId = null;

function openListingEdit(id) {
    const l = DB.getListings().find(x => x.id === id);
    if (!l) return;
    _editListingId = id;

    // Populate form fields
    $('e-title').value    = l.title || '';
    $('e-location').value = l.location || '';
    $('e-price').value    = l.price || '';
    $('e-status').value   = l.status || 'Active';
    $('e-beds').value     = l.beds || '';
    $('e-baths').value    = l.baths || '';
    $('e-sqft').value     = l.sqft || '';
    $('e-acres').value    = (l.acres && l.acres !== '—') ? l.acres : '';
    $('e-tag').value      = l.tag || 'Just Listed';
    $('e-desc').value     = l.description || '';

    // Visibility — map legacy 'homepage' to 'both'
    let visVal = l.visibility || 'listings';
    if (visVal === 'homepage') visVal = 'both';
    document.querySelectorAll('#modal-edit-listing .edit-vis-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.vis === visVal);
        opt.querySelector('input').checked = (opt.dataset.vis === visVal);
    });

    // Photos
    _editPhotos = l.photos && l.photos.length ? [...l.photos] : (l.image ? [l.image] : []);
    renderEditPhotoPreview();

    // Show date
    $('e-date').textContent = 'Listed ' + formatDate(l.createdAt);

    openModal('modal-edit-listing');
}

function renderEditPhotoPreview() {
    const grid = $('edit-photo-preview');
    if (!grid) return;
    if (!_editPhotos.length) {
        grid.innerHTML = '<div style="color:var(--text-dim);font-size:0.82rem;padding:0.5rem 0">No photos yet</div>';
        return;
    }
    grid.innerHTML = _editPhotos.map((src, i) => `
        <div class="photo-preview-item ${i === 0 ? 'primary' : ''}">
            <img src="${src}" alt="Photo ${i+1}">
            <button type="button" class="photo-remove" onclick="removeEditPhoto(${i})" title="Remove">✕</button>
        </div>
    `).join('');
}

function removeEditPhoto(index) {
    _editPhotos.splice(index, 1);
    renderEditPhotoPreview();
}

function initEditPhotoUpload() {
    const zone = $('edit-photo-drop-zone');
    const input = $('edit-photo-file-input');
    if (!zone || !input) return;
    if (zone._bound) return; // prevent double-binding
    zone._bound = true;

    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        handleEditPhotoFiles(input.files);
        input.value = '';
    });
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        handleEditPhotoFiles(e.dataTransfer.files);
    });
}

function handleEditPhotoFiles(files) {
    const maxPhotos = 5;
    const remaining = maxPhotos - _editPhotos.length;
    if (remaining <= 0) { showToast('Maximum 5 photos allowed', 'info'); return; }
    Array.from(files).slice(0, remaining).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            _editPhotos.push(e.target.result);
            renderEditPhotoPreview();
        };
        reader.readAsDataURL(file);
    });
}

function saveListingEdit() {
    if (!_editListingId) return;
    const listings = DB.getListings();
    const idx = listings.findIndex(l => l.id === _editListingId);
    if (idx === -1) return;

    const priceRaw = $('e-price').value.replace(/[^0-9.]/g,'');
    const visRadio = document.querySelector('#modal-edit-listing input[name="e-visibility"]:checked');

    listings[idx].title       = $('e-title').value;
    listings[idx].location    = $('e-location').value;
    listings[idx].price       = parseFloat(priceRaw) || 0;
    listings[idx].beds        = $('e-beds').value;
    listings[idx].baths       = $('e-baths').value;
    listings[idx].sqft        = $('e-sqft').value;
    listings[idx].acres       = $('e-acres').value || '—';
    listings[idx].status      = $('e-status').value;
    listings[idx].tag         = $('e-tag').value;
    listings[idx].visibility  = visRadio ? visRadio.value : 'homepage';
    listings[idx].description = $('e-desc').value;
    listings[idx].photos      = [..._editPhotos];
    listings[idx].image       = _editPhotos.length ? _editPhotos[0] : listings[idx].image;

    DB.saveListings(listings);
    closeModal('modal-edit-listing');
    renderListingsTable(document.querySelector('[data-filter].active')?.dataset.filter || 'All');
    showToast('Listing updated successfully ✓');
}

function deleteListing(id, e) {
    if (e) e.stopPropagation();
    if (!confirm('Remove this listing?')) return;
    DB.saveListings(DB.getListings().filter(l => l.id !== id));
    renderListingsTable(document.querySelector('[data-filter].active')?.dataset.filter || 'All');
    showToast('Listing removed', 'danger');
}

function renderMiniListings(tbodyId, listings) {
    const tbody = $(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = listings.map(l => `
        <tr style="cursor:pointer" onclick="window.location='listings.html'">
            <td>
                <div class="listing-info-name" style="font-size:0.85rem">${l.title}</div>
                <div class="listing-info-loc">${l.location}</div>
            </td>
            <td style="font-family:var(--serif)">${formatCurrency(l.price)}</td>
            <td>${badgeHTML(l.status)}</td>
        </tr>
    `).join('');
}

// ── PAGE: INQUIRIES ───────────────────────────────────────
function initInquiries() {
    checkAuth();
    renderInquiriesTable('inquiries-body', DB.getInquiries());
    initInquiryForm();
    // Filter chips
    $$('[data-inq-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('[data-inq-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.inqFilter;
            const all = DB.getInquiries();
            renderInquiriesTable('inquiries-body', f==='All' ? all : all.filter(i=>i.status===f));
        });
    });
}

let _currentInquiryId = null;
function renderInquiriesTable(tbodyId, inquiries, compact=false) {
    const tbody = $(tbodyId);
    if (!tbody) return;
    if (!inquiries.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text-secondary)">No inquiries found.</td></tr>`;
        return;
    }
    const statusEmoji = { 'New':'🔵', 'Contacted':'📞', 'Warm Lead':'🟡', 'Hot Lead':'🔥', 'In Escrow':'🟢', 'Closed':'🏆' };
    tbody.innerHTML = inquiries.map(i => `
        <tr class="table-row-animate" style="cursor:pointer" onclick="viewInquiry('${i.id}')">
            <td>
                <div style="font-weight:500;font-size:0.9rem">${i.name}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">${i.email}</div>
            </td>
            <td style="font-size:0.85rem;color:var(--text-secondary)">${i.intent}</td>
            <td style="font-size:0.85rem">${i.budget}</td>
            <td>${badgeHTML(i.status)}</td>
            <td style="font-size:1.1rem;text-align:center" title="${i.status}">${statusEmoji[i.status] || '⚪'}</td>
            <td style="font-size:0.78rem;color:var(--text-secondary)">${timeSince(i.createdAt)}</td>
            ${!compact ? `<td onclick="event.stopPropagation()">
                <select class="inline-select" onchange="updateInquiryStatus('${i.id}',this.value,'${tbodyId}',${compact})" title="Update status">
                    <option value="">Update</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Warm Lead">Warm Lead</option>
                    <option value="Hot Lead">Hot Lead</option>
                    <option value="In Escrow">In Escrow</option>
                    <option value="Closed">Closed</option>
                </select>
            </td>` : ''}
        </tr>
    `).join('');
    setTimeout(() => {
        tbody.querySelectorAll('.table-row-animate').forEach((row,i) => {
            row.style.opacity='0'; row.style.transform='translateY(6px)';
            setTimeout(() => { row.style.transition='opacity 0.25s,transform 0.25s'; row.style.opacity='1'; row.style.transform='translateY(0)'; }, i*50);
        });
    }, 10);
}

function updateInquiryStatus(id, status, fromTbody, fromCompact) {
    if (!status) return;
    const inqs = DB.getInquiries();
    const idx = inqs.findIndex(i=>i.id===id);
    if (idx!==-1) { inqs[idx].status=status; DB.saveInquiries(inqs); }

    // Re-render the table that triggered the update
    if (fromTbody && $(fromTbody)) {
        const data = fromCompact ? DB.getInquiries().slice(0,5) : DB.getInquiries();
        renderInquiriesTable(fromTbody, data, fromCompact);
    }
    // Also refresh the full inquiries page table if it exists
    if (fromTbody !== 'inquiries-body' && $('inquiries-body')) {
        const f = document.querySelector('[data-inq-filter].active');
        const filter = f ? f.dataset.inqFilter : 'All';
        const all = DB.getInquiries();
        renderInquiriesTable('inquiries-body', filter==='All' ? all : all.filter(i=>i.status===filter));
    }
    // Refresh dashboard metrics if on dashboard
    if (document.body.dataset.page === 'dashboard') {
        const inquiries = DB.getInquiries();
        const hotLeads = inquiries.filter(i => i.status === 'Hot Lead' || i.status === 'Warm Lead').length;
        const el = $('metric-leads');
        if (el) el.textContent = hotLeads;
    }
    // Refresh pipeline if it exists
    if (typeof renderPipeline === 'function' && $('col-new')) renderPipeline();

    showToast(`Status updated → "${status}"`);
}

// ── POPULATE LISTING DROPDOWN FOR INQUIRY MODALS ─────────
function populateInquiryListingDropdowns() {
    const listings = DB.getListings();
    const opts = '<option value="">None</option>' +
        listings.map(l => `<option value="${l.id}">${l.title} — ${l.location}</option>`).join('');
    const addSel = $('iq-listing');
    const editSel = $('ei-listing');
    if (addSel) addSel.innerHTML = opts;
    if (editSel) editSel.innerHTML = opts;
}

// ── ADD INQUIRY ──────────────────────────────────────────
function initInquiryForm() {
    const form = $('inquiry-form');
    if (!form) return;
    populateInquiryListingDropdowns();
    form.addEventListener('submit', e => {
        e.preventDefault();
        const inqs = DB.getInquiries();
        const srcRadio = document.querySelector('input[name="iq-source"]:checked');
        inqs.unshift({
            id:        Date.now().toString(),
            name:      $('iq-name').value.trim(),
            email:     $('iq-email').value.trim(),
            phone:     $('iq-phone').value.trim() || '—',
            intent:    $('iq-intent').value,
            budget:    $('iq-budget').value,
            status:    $('iq-status').value,
            source:    srcRadio ? srcRadio.value : '',
            message:   $('iq-message').value.trim(),
            listingId: $('iq-listing').value || null,
            createdAt: new Date().toISOString()
        });
        DB.saveInquiries(inqs);
        closeModal('modal-add-inquiry');
        form.reset();
        refreshInquiriesView();
        showToast('Inquiry created ✓');
    });
}

// ── EDIT INQUIRY (click row to open) ─────────────────────
function viewInquiry(id) {
    const i = DB.getInquiries().find(q => q.id === id);
    if (!i) return;
    _currentInquiryId = id;

    populateInquiryListingDropdowns();

    $('edit-inq-heading').textContent = i.name;
    $('ei-name').value    = i.name || '';
    $('ei-email').value   = i.email || '';
    $('ei-phone').value   = (i.phone && i.phone !== '—') ? i.phone : '';
    $('ei-intent').value  = i.intent || 'Purchase a property';
    $('ei-budget').value  = i.budget || 'Not Specified';
    $('ei-status').value  = i.status || 'New';
    $('ei-message').value = i.message || '';
    $('ei-date').textContent = 'Received ' + formatDate(i.createdAt);

    // Source picker
    document.querySelectorAll('input[name="ei-source"]').forEach(r => { r.checked = (r.value === (i.source || '')); });

    const listingSel = $('ei-listing');
    if (listingSel) listingSel.value = i.listingId || '';

    const emailBtn = $('ei-email-btn');
    if (emailBtn) emailBtn.href = 'mailto:' + i.email + '?subject=Kanye Concierge 360 — Following Up';

    openModal('modal-edit-inquiry');
}

function saveInquiryEdit() {
    if (!_currentInquiryId) return;
    const inqs = DB.getInquiries();
    const idx = inqs.findIndex(i => i.id === _currentInquiryId);
    if (idx === -1) return;

    inqs[idx].name      = $('ei-name').value.trim();
    inqs[idx].email     = $('ei-email').value.trim();
    inqs[idx].phone     = $('ei-phone').value.trim() || '—';
    inqs[idx].intent    = $('ei-intent').value;
    inqs[idx].budget    = $('ei-budget').value;
    inqs[idx].status    = $('ei-status').value;
    inqs[idx].message   = $('ei-message').value.trim();
    const editSrcRadio = document.querySelector('input[name="ei-source"]:checked');
    inqs[idx].source    = editSrcRadio ? editSrcRadio.value : (inqs[idx].source || '');
    inqs[idx].listingId = $('ei-listing').value || null;

    DB.saveInquiries(inqs);
    closeModal('modal-edit-inquiry');
    refreshInquiriesView();
    showToast('Inquiry updated ✓');
}

function deleteInquiry() {
    if (!_currentInquiryId) return;
    if (!confirm('Delete this inquiry permanently?')) return;
    DB.saveInquiries(DB.getInquiries().filter(i => i.id !== _currentInquiryId));
    closeModal('modal-edit-inquiry');
    _currentInquiryId = null;
    refreshInquiriesView();
    showToast('Inquiry deleted', 'danger');
}

function refreshInquiriesView() {
    // Inquiries page
    if ($('inquiries-body')) {
        const f = document.querySelector('[data-inq-filter].active');
        const filter = f ? f.dataset.inqFilter : 'All';
        const all = DB.getInquiries();
        renderInquiriesTable('inquiries-body', filter === 'All' ? all : all.filter(i => i.status === filter));
    }
    // Dashboard recent inquiries
    if ($('recent-inquiries-body')) {
        renderInquiriesTable('recent-inquiries-body', DB.getInquiries().slice(0, 5), true);
    }
    // Dashboard metrics
    if ($('metric-leads')) {
        const hotLeads = DB.getInquiries().filter(i => i.status === 'Hot Lead' || i.status === 'Warm Lead').length;
        $('metric-leads').textContent = hotLeads;
    }
    // Pipeline
    if (typeof renderPipeline === 'function' && $('col-new')) renderPipeline();
}

function updateDetailStatus(status) {
    if (!status || !_currentInquiryId) return;
    updateInquiryStatus(_currentInquiryId, status);
}

// ── PAGE: CAMPAIGNS ───────────────────────────────────────
// ── CAMPAIGNS: state ──────────────────────────────────────
let campFilter = 'all';
let wizardStep = 1;
let activePanelId = null;

function initCampaigns() {
    checkAuth();
    renderCampaignList();
    renderCampaignMetrics();

    // Filter pill clicks
    document.querySelectorAll('.camp-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.camp-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            campFilter = btn.dataset.filter;
            renderCampaignList();
        });
    });

    // Edit form
    const editForm = $('edit-campaign-form');
    if (editForm) {
        editForm.addEventListener('submit', e => {
            e.preventDefault();
            const campaigns = DB.getCampaigns();
            const idx = campaigns.findIndex(c => c.id === $('ec-id').value);
            if (idx !== -1) {
                campaigns[idx].name     = $('ec-name').value;
                campaigns[idx].type     = $('ec-type').value;
                campaigns[idx].audience = $('ec-audience').value;
                campaigns[idx].notes    = $('ec-notes').value;
                DB.saveCampaigns(campaigns);
                closeModal('modal-edit-campaign');
                renderCampaignList();
                renderCampaignMetrics();
                // refresh panel if open
                if (activePanelId === campaigns[idx].id) openCampaignPanel(campaigns[idx].id);
                showToast('Campaign updated');
            }
        });
    }
}

function renderCampaignMetrics() {
    const campaigns = DB.getCampaigns();
    const live = campaigns.filter(c=>c.status==='Live').length;
    const totalSent = campaigns.reduce((a,c)=>a+c.sent,0);
    const avgOpen = campaigns.filter(c=>c.sent>0).reduce((a,c,_,ar)=>a+(c.opens/c.sent*100)/ar.length,0);
    const setEl = (id,v) => { const el=$(id); if(el) el.textContent=v; };
    setEl('c-metric-live', live);
    setEl('c-metric-sent', totalSent >= 1000 ? (totalSent/1000).toFixed(1)+'K' : totalSent);
    setEl('c-metric-open', avgOpen ? Math.round(avgOpen)+'%' : '—');
}

function campTypeIcon(type) {
    const map = { 'Email Blast':'✉', 'Social Media':'📱', 'Direct Mailer':'📬', 'Open House Event':'🏡' };
    return map[type] || '📮';
}
function campTypeClass(type) {
    const map = { 'Email Blast':'email', 'Social Media':'social', 'Direct Mailer':'mailer', 'Open House Event':'event' };
    return map[type] || '';
}

function renderCampaignList() {
    const list = $('camp-list');
    const emptyEl = $('camp-empty');
    const filterEmpty = $('camp-filter-empty');
    if (!list) return;

    const campaigns = DB.getCampaigns();
    const filtered = campFilter === 'all' ? campaigns : campaigns.filter(c => c.status === campFilter);

    list.innerHTML = '';

    // show/hide empty states
    if (campaigns.length === 0) {
        emptyEl.style.display = 'block';
        filterEmpty.style.display = 'none';
        return;
    } else {
        emptyEl.style.display = 'none';
    }
    if (filtered.length === 0) {
        filterEmpty.style.display = 'block';
        return;
    } else {
        filterEmpty.style.display = 'none';
    }

    filtered.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'camp-row';
        const eng = c.engagement || (c.sent > 0 ? Math.round(c.opens/c.sent*100) : 0);
        row.innerHTML = `
            <div class="camp-row-icon ${campTypeClass(c.type)}">${campTypeIcon(c.type)}</div>
            <div class="camp-row-body">
                <div class="camp-row-title">${c.name}</div>
                <div class="camp-row-sub">${c.type} · ${c.audience} · ${badgeHTML(c.status)}</div>
            </div>
            <div class="camp-row-right">
                <div class="camp-row-eng">
                    <div class="camp-row-eng-value">${eng}%</div>
                    <div class="camp-row-eng-label">Engagement</div>
                </div>
                <div class="camp-row-chevron">›</div>
            </div>
        `;
        row.addEventListener('click', () => openCampaignPanel(c.id));
        list.appendChild(row);

        // staggered fade-in
        setTimeout(() => row.classList.add('show'), 40 + i * 60);
    });
}

// ── Detail panel ──────────────────────────────────────────
function openCampaignPanel(id) {
    const campaigns = DB.getCampaigns();
    const c = campaigns.find(x => x.id === id);
    if (!c) return;
    activePanelId = id;

    $('cp-title').textContent = c.name;
    $('cp-status').innerHTML  = badgeHTML(c.status);
    $('cp-type').textContent  = c.type;
    $('cp-audience').textContent = c.audience;
    $('cp-date').textContent  = new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    $('cp-notes').textContent = c.notes || '';

    $('cp-sent').textContent   = c.sent.toLocaleString();
    $('cp-opens').textContent  = c.opens.toLocaleString();
    $('cp-clicks').textContent = c.clicks.toLocaleString();
    const eng = c.engagement || (c.sent > 0 ? Math.round(c.opens/c.sent*100) : 0);
    $('cp-engagement').textContent = eng + '%';
    $('cp-eng-pct').textContent    = eng + '%';
    setTimeout(() => { $('cp-eng-bar').style.width = eng + '%'; }, 100);

    // Top-right actions (edit)
    $('cp-actions-top').innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="editCampaign('${c.id}')">Edit</button>
    `;

    // Bottom actions
    let actions = '';
    if (c.status === 'Draft')  actions += `<button class="btn btn-primary" onclick="launchCampaign('${c.id}')">Launch Campaign</button>`;
    if (c.status === 'Live')   actions += `<button class="btn btn-secondary" onclick="pauseCampaign('${c.id}')">Pause Campaign</button>`;
    if (c.status === 'Paused') actions += `<button class="btn btn-primary" onclick="launchCampaign('${c.id}')">Resume Campaign</button>`;
    if (c.status === 'Completed') actions += `<button class="btn btn-secondary" onclick="duplicateCampaign('${c.id}')">Duplicate Campaign</button>`;
    actions += `<button class="btn btn-danger" onclick="deleteCampaign('${c.id}')">Delete Campaign</button>`;
    $('cp-actions').innerHTML = actions;

    // Open panel
    $('camp-panel').classList.add('open');
    $('camp-panel-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCampaignPanel() {
    $('camp-panel').classList.remove('open');
    $('camp-panel-overlay').classList.remove('open');
    document.body.style.overflow = '';
    activePanelId = null;
    // reset bar
    $('cp-eng-bar').style.width = '0%';
}

// ── Campaign actions ──────────────────────────────────────
function launchCampaign(id) {
    const campaigns = DB.getCampaigns();
    const idx = campaigns.findIndex(c=>c.id===id);
    if (idx!==-1) { campaigns[idx].status='Live'; DB.saveCampaigns(campaigns); }
    renderCampaignList(); renderCampaignMetrics();
    if (activePanelId === id) openCampaignPanel(id);
    showToast('Campaign launched!');
}
function pauseCampaign(id) {
    const campaigns = DB.getCampaigns();
    const idx = campaigns.findIndex(c=>c.id===id);
    if (idx!==-1) { campaigns[idx].status='Paused'; DB.saveCampaigns(campaigns); }
    renderCampaignList(); renderCampaignMetrics();
    if (activePanelId === id) openCampaignPanel(id);
    showToast('Campaign paused');
}
function deleteCampaign(id) {
    if (!confirm('Delete this campaign permanently?')) return;
    DB.saveCampaigns(DB.getCampaigns().filter(c=>c.id!==id));
    closeCampaignPanel();
    renderCampaignList(); renderCampaignMetrics();
    showToast('Campaign deleted', 'danger');
}
function duplicateCampaign(id) {
    const campaigns = DB.getCampaigns();
    const orig = campaigns.find(c=>c.id===id);
    if (!orig) return;
    const copy = { ...orig, id: Date.now().toString(), name: orig.name + ' (Copy)', status: 'Draft', sent:0, opens:0, clicks:0, engagement:0, createdAt: new Date().toISOString() };
    campaigns.unshift(copy);
    DB.saveCampaigns(campaigns);
    closeCampaignPanel();
    renderCampaignList(); renderCampaignMetrics();
    showToast('Campaign duplicated as Draft');
}
function editCampaign(id) {
    const campaigns = DB.getCampaigns();
    const c = campaigns.find(x=>x.id===id);
    if (!c) return;
    $('ec-id').value       = c.id;
    $('ec-name').value     = c.name;
    $('ec-type').value     = c.type;
    $('ec-audience').value = c.audience;
    $('ec-notes').value    = c.notes || '';
    openModal('modal-edit-campaign');
}

// ── Wizard ────────────────────────────────────────────────
function openCampaignWizard() {
    wizardStep = 1;
    // reset form
    const radios = document.querySelectorAll('input[name="wiz-type"]');
    if (radios.length) radios[0].checked = true;
    const audRadios = document.querySelectorAll('input[name="wiz-audience"]');
    if (audRadios.length) audRadios[0].checked = true;
    const nameEl = $('wiz-name');
    if (nameEl) nameEl.value = '';
    const notesEl = $('wiz-notes');
    if (notesEl) notesEl.value = '';
    updateWizardUI();
    openModal('modal-campaign-wizard');
}

function updateWizardUI() {
    const titles = ['What type of campaign?', 'Name your campaign', 'Choose your audience', 'Review & save'];
    const titleEl = $('wizard-title');
    if (titleEl) titleEl.textContent = titles[wizardStep - 1];

    // Step indicators
    document.querySelectorAll('.wizard-step').forEach(el => {
        const s = parseInt(el.dataset.step);
        el.classList.remove('active', 'done');
        if (s === wizardStep) el.classList.add('active');
        if (s < wizardStep)  el.classList.add('done');
    });

    // Panels
    for (let i = 1; i <= 4; i++) {
        const panel = $('wiz-step-' + i);
        if (panel) panel.classList.toggle('active', i === wizardStep);
    }

    // Back button
    const backBtn = $('wiz-back');
    if (backBtn) backBtn.style.visibility = wizardStep === 1 ? 'hidden' : 'visible';

    // Next button text
    const nextBtn = $('wiz-next');
    if (nextBtn) nextBtn.textContent = wizardStep === 4 ? 'Save as Draft' : 'Next';

    // Populate review on step 4
    if (wizardStep === 4) {
        const type = document.querySelector('input[name="wiz-type"]:checked');
        const aud  = document.querySelector('input[name="wiz-audience"]:checked');
        $('wiz-rev-type').textContent     = type ? type.value : '';
        $('wiz-rev-name').textContent     = $('wiz-name') ? $('wiz-name').value : '';
        $('wiz-rev-audience').textContent  = aud ? aud.value : '';
        $('wiz-rev-notes').textContent     = $('wiz-notes') ? ($('wiz-notes').value || '—') : '—';
    }
}

function wizardNext() {
    // Validate step 2
    if (wizardStep === 2) {
        const name = $('wiz-name');
        if (!name || !name.value.trim()) {
            name.focus();
            name.style.borderColor = '#e05c5c';
            setTimeout(() => name.style.borderColor = '', 2000);
            return;
        }
    }

    if (wizardStep < 4) {
        wizardStep++;
        updateWizardUI();
    } else {
        // Save
        const type = document.querySelector('input[name="wiz-type"]:checked');
        const aud  = document.querySelector('input[name="wiz-audience"]:checked');
        const campaigns = DB.getCampaigns();
        campaigns.unshift({
            id:        Date.now().toString(),
            name:      $('wiz-name').value.trim(),
            type:      type ? type.value : 'Email Blast',
            audience:  aud ? aud.value : 'All Leads',
            notes:     $('wiz-notes') ? $('wiz-notes').value : '',
            status:    'Draft',
            sent:0, opens:0, clicks:0, engagement:0,
            createdAt: new Date().toISOString()
        });
        DB.saveCampaigns(campaigns);
        closeModal('modal-campaign-wizard');
        renderCampaignList();
        renderCampaignMetrics();
        showToast('Campaign saved as Draft');
    }
}

function wizardBack() {
    if (wizardStep > 1) {
        wizardStep--;
        updateWizardUI();
    }
}

// ── PAGE: ANALYTICS ───────────────────────────────────────
// ── EXPORT: CSV ───────────────────────────────────────────
function exportAnalyticsCSV() {
    const listings  = DB.getListings();
    const inquiries = DB.getInquiries();
    const today = new Date().toISOString().slice(0,10);

    let csv = '';

    // ── Summary
    const totalVol = listings.reduce((a,l)=>a+l.price,0);
    const avgPrice = listings.length ? totalVol/listings.length : 0;
    const convRate = inquiries.length ? Math.round(inquiries.filter(i=>i.status!=='New').length/inquiries.length*100) : 0;
    csv += 'PORTFOLIO SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Portfolio Value,"$${(totalVol/1000000).toFixed(2)}M"\n`;
    csv += `Avg Listing Price,"$${(avgPrice/1000000).toFixed(2)}M"\n`;
    csv += `Total Inquiries,${inquiries.length}\n`;
    csv += `Conversion Rate,${convRate}%\n\n`;

    // ── Listings
    csv += 'LISTINGS\n';
    csv += 'Title,Location,Price,Beds,Baths,SqFt,Acres,Status,Tag,Visibility,Listed\n';
    listings.forEach(l => {
        csv += `"${l.title}","${l.location}",${l.price},${l.beds},${l.baths},${l.sqft},"${l.acres}","${l.status}","${l.tag}","${l.visibility||''}","${l.createdAt?.slice(0,10)||''}"\n`;
    });
    csv += '\n';

    // ── Inquiries
    csv += 'INQUIRIES\n';
    csv += 'Name,Email,Phone,Intent,Budget,Status,Source,Received\n';
    inquiries.forEach(i => {
        csv += `"${i.name}","${i.email}","${i.phone||''}","${i.intent}","${i.budget}","${i.status}","${i.source||'Unknown'}","${i.createdAt?.slice(0,10)||''}"\n`;
    });
    csv += '\n';

    // ── Lead Sources
    const srcCounts = {};
    inquiries.forEach(i => { const s=i.source||'Unknown'; srcCounts[s]=(srcCounts[s]||0)+1; });
    csv += 'LEAD SOURCES\n';
    csv += 'Source,Count,Percentage\n';
    Object.entries(srcCounts).sort((a,b)=>b[1]-a[1]).forEach(([s,n]) => {
        csv += `"${s}",${n},${inquiries.length?Math.round(n/inquiries.length*100):0}%\n`;
    });
    csv += '\n';

    // ── Pipeline
    const pipeCounts = {};
    inquiries.forEach(i => { pipeCounts[i.status]=(pipeCounts[i.status]||0)+1; });
    csv += 'PIPELINE\n';
    csv += 'Stage,Count\n';
    ['New','Contacted','Warm Lead','Hot Lead','In Escrow','Closed'].forEach(s => {
        csv += `"${s}",${pipeCounts[s]||0}\n`;
    });

    // Download
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `KC360-Analytics-${today}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('CSV exported ✓');
}

// ── EXPORT: PDF ───────────────────────────────────────────
function exportAnalyticsPDF() {
    const listings  = DB.getListings();
    const inquiries = DB.getInquiries();
    const today = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

    const totalVol = listings.reduce((a,l)=>a+l.price,0);
    const avgPrice = listings.length ? totalVol/listings.length : 0;
    const convRate = inquiries.length ? Math.round(inquiries.filter(i=>i.status!=='New').length/inquiries.length*100) : 0;
    const hotLeads = inquiries.filter(i=>i.status==='Hot Lead'||i.status==='Warm Lead').length;
    const activeListings = listings.filter(l=>l.status==='Active').length;

    // Capture chart canvases as images
    const charts = ['pipeline-chart','status-pie-chart','source-chart','intent-chart','budget-chart'];
    const chartImgs = {};
    charts.forEach(id => {
        const c = $(id);
        if (c) { try { chartImgs[id] = c.toDataURL('image/png'); } catch(e){} }
    });

    // Lead sources
    const srcCounts = {};
    inquiries.forEach(i => { const s=i.source||'Unknown'; srcCounts[s]=(srcCounts[s]||0)+1; });
    const srcSorted = Object.entries(srcCounts).sort((a,b)=>b[1]-a[1]);
    const srcEmoji = {'Website':'🌐','Facebook':'📘','Instagram':'📷','Google Search':'🔍','Referral':'🤝','Paid Ad':'📣','Zillow/Realtor':'🏡','Direct Mail':'📬','Open House':'🏠','Other':'💬','Unknown':'❓'};
    const srcBars = srcSorted.map(([s,n],idx) => {
        const pct = inquiries.length ? Math.round(n/inquiries.length*100) : 0;
        const colors = ['#A47C48','#4c8fe1','#e05c8f','#4caf81','#e68c00','#8b5cf6','#2a6496','#d4a94f','#6E7462','#cf6679'];
        const color = colors[idx % colors.length];
        return `<div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span>${srcEmoji[s]||'📍'} ${s}</span>
                <span style="color:${color};font-weight:600">${n} leads · ${pct}%</span>
            </div>
            <div style="height:8px;background:#f0ebe4;border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${color};border-radius:4px"></div>
            </div>
        </div>`;
    }).join('');

    // Pipeline
    const pipeCounts = {};
    inquiries.forEach(i => { pipeCounts[i.status]=(pipeCounts[i.status]||0)+1; });
    const pipeStages = ['New','Contacted','Warm Lead','Hot Lead','In Escrow','Closed'];
    const pipeColors = ['#4c8fe1','#8b5cf6','#e68c00','#e05c5c','#A47C48','#4caf81'];
    const pipeBars = pipeStages.map((s,idx) => {
        const n = pipeCounts[s]||0;
        const pct = inquiries.length ? Math.round(n/inquiries.length*100) : 0;
        return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="width:90px;font-size:11px">${s}</span>
            <div style="flex:1;height:10px;background:#f0ebe4;border-radius:5px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${pipeColors[idx]};border-radius:5px;min-width:${n?'4px':'0'}"></div>
            </div>
            <span style="width:30px;text-align:right;font-weight:600;color:${pipeColors[idx]}">${n}</span>
        </div>`;
    }).join('');

    // Listings table
    const listingRows = listings.map(l =>
        `<tr><td style="font-weight:500">${l.title}</td><td>${l.location}</td><td style="color:#A47C48;font-weight:500">$${Number(l.price).toLocaleString()}</td><td><span class="status-pill status-${l.status.toLowerCase().replace(/[^a-z]/g,'')}">${l.status}</span></td></tr>`
    ).join('');

    // Inquiry table
    const inqRows = inquiries.map(i =>
        `<tr><td style="font-weight:500">${i.name}</td><td>${i.email}</td><td>${i.intent}</td><td>${i.budget}</td><td><span class="status-pill status-${i.status.toLowerCase().replace(/[^a-z]/g,'')}">${i.status}</span></td><td>${srcEmoji[i.source]||'❓'} ${i.source||'Unknown'}</td></tr>`
    ).join('');

    const chartImg = (id, width) => chartImgs[id] ? `<img src="${chartImgs[id]}" style="width:${width||'100%'};height:auto;display:block;margin:0 auto">` : '';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>KC360 Analytics Report — ${today}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'DM Sans','Helvetica Neue',Arial,sans-serif; color:#1a1a1a; font-size:11px; line-height:1.5; }
        .page { padding:48px 52px; max-width:900px; margin:0 auto; }

        /* Header */
        .report-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:36px; padding-bottom:20px; border-bottom:3px solid #A47C48; }
        .brand { font-size:18px; font-weight:600; color:#A47C48; letter-spacing:-0.02em; }
        .brand span { font-weight:300; }
        h1 { font-size:28px; font-weight:300; color:#1a1a1a; margin-top:2px; letter-spacing:-0.02em; }
        .report-meta { text-align:right; font-size:10px; color:#888; letter-spacing:0.08em; text-transform:uppercase; }

        /* KPI Cards */
        .kpi-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:36px; }
        .kpi { border:1px solid #e0d8cc; padding:18px 14px; text-align:center; background:#faf8f5; }
        .kpi-val { font-size:26px; font-weight:300; color:#A47C48; line-height:1.2; }
        .kpi-lbl { font-size:8px; letter-spacing:0.18em; text-transform:uppercase; color:#888; margin-top:5px; }

        /* Section headers */
        h2 { font-size:15px; font-weight:600; color:#A47C48; margin:32px 0 14px; padding-bottom:8px; border-bottom:2px solid #f0ebe4; display:flex; align-items:center; gap:8px; }
        h2 .h2-count { font-size:11px; font-weight:400; color:#888; }
        h3 { font-size:12px; font-weight:500; color:#666; margin-bottom:10px; }

        /* Charts row */
        .chart-row { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:8px; }
        .chart-box { text-align:center; }
        .chart-box img { border-radius:6px; }

        /* Status pills */
        .status-pill { display:inline-block; padding:2px 10px; border-radius:10px; font-size:9px; font-weight:600; letter-spacing:0.06em; }
        .status-active { background:#f0e8d8; color:#A47C48; }
        .status-pending { background:#fef3dc; color:#c67e00; }
        .status-offmarket { background:#eef0ec; color:#6E7462; }
        .status-sold { background:#e2f5eb; color:#2d8a56; }
        .status-new { background:#e8f0fc; color:#3572b0; }
        .status-contacted { background:#f0e8fc; color:#7c4dcc; }
        .status-warmlead { background:#fef3dc; color:#c67e00; }
        .status-hotlead { background:#fce8e8; color:#c0392b; }
        .status-inescrow { background:#f0e8d8; color:#A47C48; }
        .status-closed { background:#e2f5eb; color:#2d8a56; }

        /* Tables */
        table { width:100%; border-collapse:collapse; font-size:10.5px; margin-bottom:16px; }
        th { text-align:left; font-size:8px; letter-spacing:0.14em; text-transform:uppercase; color:#999; padding:8px 8px; border-bottom:2px solid #e0d8cc; font-weight:600; }
        td { padding:8px 8px; border-bottom:1px solid #f0ebe4; color:#333; vertical-align:middle; }
        tr:nth-child(even) td { background:#fdfbf8; }
        tr:hover td { background:#f5f0e8; }

        .footer { margin-top:44px; padding-top:16px; border-top:2px solid #A47C48; display:flex; justify-content:space-between; align-items:center; }
        .footer-left { font-size:10px; color:#A47C48; font-weight:500; }
        .footer-right { font-size:9px; color:#aaa; letter-spacing:0.06em; }
        .page-break { page-break-before:always; }

        @media print {
            body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
            .page { padding:30px 36px; }
            .page-break { break-before:page; }
        }
    </style></head><body>
    <div class="page">
        <div class="report-header">
            <div>
                <div class="brand">Kanye Concierge <span>360°</span></div>
                <h1>Portfolio Analytics Report</h1>
            </div>
            <div class="report-meta">
                Confidential<br>${today}
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi"><div class="kpi-val">$${(totalVol/1000000).toFixed(1)}M</div><div class="kpi-lbl">Portfolio Value</div></div>
            <div class="kpi"><div class="kpi-val">$${(avgPrice/1000000).toFixed(2)}M</div><div class="kpi-lbl">Avg Price</div></div>
            <div class="kpi"><div class="kpi-val">${activeListings}</div><div class="kpi-lbl">Active Listings</div></div>
            <div class="kpi"><div class="kpi-val">${inquiries.length}</div><div class="kpi-lbl">Inquiries</div></div>
            <div class="kpi"><div class="kpi-val">${convRate}%</div><div class="kpi-lbl">Conversion</div></div>
        </div>

        <h2>📊 Visual Analytics</h2>
        <div class="chart-row">
            <div class="chart-box">
                <h3>Lead Pipeline</h3>
                ${chartImg('pipeline-chart','100%')}
            </div>
            <div class="chart-box">
                <h3>Listings by Status</h3>
                ${chartImg('status-pie-chart','80%')}
            </div>
        </div>
        <div class="chart-row" style="margin-top:20px">
            <div class="chart-box">
                <h3>Lead Sources</h3>
                ${chartImg('source-chart','80%')}
            </div>
            <div class="chart-box">
                <h3>Client Intent</h3>
                ${chartImg('intent-chart','80%')}
            </div>
        </div>
        <div class="chart-row" style="margin-top:20px;grid-template-columns:1fr">
            <div class="chart-box">
                <h3>Budget Distribution</h3>
                ${chartImg('budget-chart','60%')}
            </div>
        </div>

        <h2>📈 Lead Source Performance</h2>
        ${srcBars}

        <h2>🔄 Pipeline Stages</h2>
        ${pipeBars}

        <div class="page-break"></div>

        <h2>🏠 Listings <span class="h2-count">(${listings.length} total)</span></h2>
        <table>
            <thead><tr><th>Property</th><th>Location</th><th>Price</th><th>Status</th></tr></thead>
            <tbody>${listingRows}</tbody>
        </table>

        <h2>📋 Client Inquiries <span class="h2-count">(${inquiries.length} total)</span></h2>
        <table>
            <thead><tr><th>Client</th><th>Email</th><th>Intent</th><th>Budget</th><th>Status</th><th>Source</th></tr></thead>
            <tbody>${inqRows}</tbody>
        </table>

        <div class="footer">
            <div class="footer-left">Kanye Concierge 360° — Agent Analytics</div>
            <div class="footer-right">Generated ${today} · Confidential</div>
        </div>
    </div>
    </body></html>`;

    const printWin = window.open('', '_blank', 'width=960,height=800');
    printWin.document.write(html);
    printWin.document.close();
    printWin.onload = () => setTimeout(() => printWin.print(), 600);
    showToast('PDF report ready — use Print → Save as PDF');
}

function initAnalytics() {
    checkAuth();
    const listings  = DB.getListings();
    const inquiries = DB.getInquiries();
    const totalVol  = listings.reduce((a,l)=>a+l.price,0);
    const avgPrice  = listings.length ? totalVol/listings.length : 0;
    const convRate  = inquiries.length ? Math.round(inquiries.filter(i=>i.status!=='New').length/inquiries.length*100) : 0;

    animateCounter($('a-total-vol-num'), parseFloat((totalVol/1000000).toFixed(1)), '$', 'M');
    animateCounter($('a-avg-price-num'), parseFloat((avgPrice/1000000).toFixed(2)), '$', 'M');
    animateCounter($('a-inquiries-num'), inquiries.length);
    animateCounter($('a-conv-rate-num'), convRate, '', '%');

    renderPipelineChart();
    renderStatusPieChart();
    renderSourceChart();
    renderSourceBreakdown();
    renderIntentChart();
    renderBudgetChart();
    renderListingPerfTable();
}

function renderPipelineChart() {
    const canvas = $('pipeline-chart');
    if (!canvas || typeof Chart==='undefined') return;
    const inquiries = DB.getInquiries();
    const statuses = ['New','Contacted','Warm Lead','Hot Lead','In Escrow','Closed'];
    const counts = statuses.map(s => inquiries.filter(i=>i.status===s).length);
    const colors = ['rgba(76,143,225,0.7)','rgba(139,92,246,0.7)','rgba(230,140,0,0.7)','rgba(224,92,92,0.7)','rgba(164,124,72,0.7)','rgba(76,175,129,0.7)'];
    new Chart(canvas, {
        type:'bar',
        data:{
            labels: statuses,
            datasets:[{
                label:'Inquiries',
                data: counts,
                backgroundColor: colors,
                borderColor: colors.map(c=>c.replace('0.7','1')),
                borderWidth:1, borderRadius:4,
            }]
        },
        options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#1E1E1C', titleColor:'#FDFAF6', bodyColor:'rgba(216,204,188,0.8)', borderColor:'rgba(164,124,72,0.3)', borderWidth:1, padding:12 } },
            scales:{
                x:{ grid:{color:'rgba(216,204,188,0.05)', drawBorder:false}, ticks:{color:'rgba(216,204,188,0.5)',font:{size:11}} },
                y:{ grid:{color:'rgba(216,204,188,0.05)', drawBorder:false}, ticks:{color:'rgba(216,204,188,0.5)',font:{size:11}}, beginAtZero:true, stepSize:1 }
            }
        }
    });
}

function renderListingPerfTable() {
    const tbody = $('listing-perf-body');
    if (!tbody) return;
    tbody.innerHTML = DB.getListings().map((l,i) => `
        <tr class="table-row-animate" style="opacity:0;transform:translateY(6px);transition:opacity 0.3s ${i*60}ms,transform 0.3s ${i*60}ms">
            <td><div class="listing-info-name">${l.title}</div><div class="listing-info-loc">${l.location}</div></td>
            <td style="font-family:var(--serif)">${formatCurrency(l.price)}</td>
            <td>${badgeHTML(l.status)}</td>
            <td style="font-size:0.82rem;color:var(--text-secondary)">${formatDate(l.createdAt)}</td>
            <td>${Math.floor(Math.random()*80+20)}</td>
            <td>
                <div style="display:flex;align-items:center;gap:0.5rem">
                    <div style="height:4px;width:80px;background:var(--bg-hover);border-radius:2px;overflow:hidden">
                        <div style="height:100%;width:${Math.floor(Math.random()*60+20)}%;background:var(--bronze);border-radius:2px"></div>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
    setTimeout(() => {
        tbody.querySelectorAll('tr').forEach(r => { r.style.opacity='1'; r.style.transform='translateY(0)'; });
    }, 50);
}

// ── CHART TOOLTIP DEFAULTS ────────────────────────────────
const _chartTooltip = {
    backgroundColor:'#1E1E1C', titleColor:'#FDFAF6',
    bodyColor:'rgba(216,204,188,0.8)',
    borderColor:'rgba(164,124,72,0.3)', borderWidth:1, padding:12
};
const _chartLegend = {
    position:'bottom',
    labels:{ color:'rgba(216,204,188,0.6)', font:{size:11}, padding:14, boxWidth:12 }
};
const _palette = ['#A47C48','#4c8fe1','#e05c8f','#4caf81','#e68c00','#8b5cf6','#2a6496','#d4a94f','#6E7462','#cf6679'];

// ── LISTINGS STATUS PIE CHART ─────────────────────────────
function renderStatusPieChart() {
    const canvas = $('status-pie-chart');
    if (!canvas || typeof Chart==='undefined') return;
    const listings = DB.getListings();
    const groups = {};
    listings.forEach(l => { groups[l.status] = (groups[l.status]||0)+1; });
    const statusColors = { 'Active':'#A47C48','Pending':'#e68c00','Off-Market':'#6E7462','Sold':'#4caf81' };
    const labels = Object.keys(groups);
    const data = Object.values(groups);
    const colors = labels.map(s => statusColors[s] || '#888');

    new Chart(canvas, {
        type:'polarArea',
        data:{ labels, datasets:[{ data, backgroundColor:colors.map(c=>c+'cc'), borderColor:colors, borderWidth:2 }] },
        options:{
            responsive:true, maintainAspectRatio:false,
            animation:{ animateRotate:true, animateScale:true, duration:1200, easing:'easeOutQuart' },
            scales:{ r:{ display:false } },
            plugins:{ legend:_chartLegend, tooltip:{ ..._chartTooltip,
                callbacks:{ label:ctx => ' '+ctx.label+': '+ctx.parsed.r+' listing'+(ctx.parsed.r!==1?'s':'') }
            }}
        }
    });
}

// ── LEAD SOURCE DOUGHNUT CHART ────────────────────────────
const _sourceEmoji = {
    'Website':'🌐','Facebook':'📘','Instagram':'📷','Google Search':'🔍',
    'Referral':'🤝','Paid Ad':'📣','Zillow/Realtor':'🏡','Direct Mail':'📬',
    'Open House':'🏠','Other':'💬','Unknown':'❓'
};

function getSourceData() {
    const inquiries = DB.getInquiries();
    const counts = {};
    inquiries.forEach(i => {
        const src = i.source || 'Unknown';
        counts[src] = (counts[src]||0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    return { sorted, total:inquiries.length };
}

function renderSourceChart() {
    const canvas = $('source-chart');
    if (!canvas || typeof Chart==='undefined') return;
    const { sorted } = getSourceData();
    if (!sorted.length) return;

    const labels = sorted.map(([s]) => s);
    const data = sorted.map(([,n]) => n);

    new Chart(canvas, {
        type:'doughnut',
        data:{
            labels,
            datasets:[{
                data,
                backgroundColor: _palette.slice(0, labels.length),
                borderColor:'#1E1E1C', borderWidth:3,
                hoverBorderColor:'#A47C48', hoverOffset:8
            }]
        },
        options:{
            responsive:true, maintainAspectRatio:false,
            cutout:'58%',
            animation:{ animateRotate:true, duration:1400, easing:'easeOutQuart' },
            plugins:{
                legend:_chartLegend,
                tooltip:{ ..._chartTooltip,
                    callbacks:{ label:ctx => ' '+(_sourceEmoji[ctx.label]||'')+' '+ctx.label+': '+ctx.parsed+' lead'+(ctx.parsed!==1?'s':'') }
                }
            }
        }
    });
}

function renderSourceBreakdown() {
    const container = $('source-breakdown');
    if (!container) return;
    const { sorted, total } = getSourceData();

    if (!sorted.length || (sorted.length===1 && sorted[0][0]==='Unknown' && !sorted[0][1])) {
        container.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;padding:2rem 0;text-align:center">No source data yet — set lead sources on inquiries.</p>';
        return;
    }

    container.innerHTML = sorted.map(([src, count], idx) => {
        const pct = total ? Math.round(count/total*100) : 0;
        const emoji = _sourceEmoji[src] || '📍';
        const color = _palette[idx % _palette.length];
        return `
            <div style="margin-bottom:1rem;padding:0 0.25rem">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem">
                    <span style="font-size:0.85rem;color:var(--text-primary)">${emoji} ${src}</span>
                    <span style="font-size:0.82rem;color:var(--text-secondary)">${count} lead${count>1?'s':''} · <strong style="color:${color}">${pct}%</strong></span>
                </div>
                <div style="height:6px;background:var(--bg-hover);border-radius:3px;overflow:hidden">
                    <div class="anim-bar" data-width="${pct}%" style="height:100%;width:0%;background:${color};border-radius:3px;transition:width 1s cubic-bezier(0.22,1,0.36,1)"></div>
                </div>
            </div>`;
    }).join('');
    setTimeout(() => container.querySelectorAll('.anim-bar').forEach(b => b.style.width=b.dataset.width), 200);
}

// ── INTENT BREAKDOWN CHART ────────────────────────────────
function renderIntentChart() {
    const canvas = $('intent-chart');
    if (!canvas || typeof Chart==='undefined') return;
    const inquiries = DB.getInquiries();
    const counts = {};
    inquiries.forEach(i => { const k = i.intent||'Other'; counts[k]=(counts[k]||0)+1; });
    const labels = Object.keys(counts);
    const data = Object.values(counts);

    new Chart(canvas, {
        type:'pie',
        data:{
            labels,
            datasets:[{
                data,
                backgroundColor:['#A47C48','#4c8fe1','#8b5cf6','#e68c00','#4caf81','#e05c8f'].slice(0,labels.length),
                borderColor:'#1E1E1C', borderWidth:3,
                hoverOffset:10
            }]
        },
        options:{
            responsive:true, maintainAspectRatio:false,
            animation:{ animateRotate:true, animateScale:true, duration:1200, easing:'easeOutQuart' },
            plugins:{
                legend:_chartLegend,
                tooltip:{ ..._chartTooltip,
                    callbacks:{ label:ctx => ' '+ctx.label+': '+ctx.parsed+' inquiry'+(ctx.parsed!==1?'ies':'') }
                }
            }
        }
    });
}

// ── BUDGET DISTRIBUTION CHART ─────────────────────────────
function renderBudgetChart() {
    const canvas = $('budget-chart');
    if (!canvas || typeof Chart==='undefined') return;
    const inquiries = DB.getInquiries();
    const counts = {};
    inquiries.forEach(i => { const b = i.budget||'Not Specified'; counts[b]=(counts[b]||0)+1; });
    const labels = Object.keys(counts);
    const data = Object.values(counts);

    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,0,260);
    grad.addColorStop(0,'rgba(164,124,72,0.6)');
    grad.addColorStop(1,'rgba(164,124,72,0.08)');

    new Chart(canvas, {
        type:'bar',
        data:{
            labels,
            datasets:[{
                label:'Clients',
                data,
                backgroundColor:grad,
                borderColor:'#A47C48',
                borderWidth:1, borderRadius:6,
                hoverBackgroundColor:'rgba(164,124,72,0.8)'
            }]
        },
        options:{
            responsive:true, maintainAspectRatio:false,
            animation:{ duration:1000, easing:'easeOutQuart' },
            plugins:{ legend:{display:false}, tooltip:_chartTooltip },
            scales:{
                x:{ grid:{color:'rgba(216,204,188,0.05)',drawBorder:false}, ticks:{color:'rgba(216,204,188,0.5)',font:{size:10},maxRotation:45} },
                y:{ grid:{color:'rgba(216,204,188,0.05)',drawBorder:false}, ticks:{color:'rgba(216,204,188,0.5)',font:{size:11},stepSize:1}, beginAtZero:true }
            }
        }
    });
}

// ── TABS ──────────────────────────────────────────────────
document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    const group = tab.closest('.tabs');
    if (!group) return;
    group.querySelectorAll('.tab-item').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    const panel = document.getElementById(tab.dataset.tab);
    if (panel) panel.classList.add('active');
});

// ── SIDEBAR TOGGLE (mobile) ───────────────────────────────
function toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('open');
    document.querySelector('.sidebar-overlay')?.classList.toggle('open');
}

// ── AUTO-INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page==='login')     initLogin();
    if (page==='dashboard') initDashboard();
    if (page==='listings')  initListings();
    if (page==='pipeline')  initPipeline();
    if (page==='inquiries') initInquiries();
    if (page==='campaigns') initCampaigns();
    if (page==='analytics') initAnalytics();
    if (page==='settings')  initSettings();
    if (page==='videos')    checkAuth(); // videos.html handles the rest via its own inline script
});

// ── PAGE: PIPELINE ────────────────────────────────────────
function initPipeline() {
    checkAuth();
    renderPipeline();

    // Init SortableJS on all columns
    if (typeof Sortable !== 'undefined') {
        const columns = document.querySelectorAll('.sortable-list');
        columns.forEach(col => {
            new Sortable(col, {
                group: 'pipeline',
                animation: 250,
                ghostClass: 'kanban-ghost',
                dragClass: 'kanban-drag',
                onEnd: function (evt) {
                    const itemEl = evt.item;
                    const leadId = itemEl.getAttribute('data-id');
                    const newStatus = evt.to.getAttribute('data-status');
                    
                    if (evt.from !== evt.to) {
                        // Update in DB
                        const inqs = DB.getInquiries();
                        const idx = inqs.findIndex(i => i.id === leadId);
                        if (idx !== -1) {
                            inqs[idx].status = newStatus;
                            DB.saveInquiries(inqs);
                        }
                        
                        if (newStatus === 'Closed') {
                            triggerCelebration();
                            showToast('🎉 Deal Closed! Congratulations!', 'success');
                        } else {
                            showToast('Lead moved to: ' + newStatus, 'success');
                        }
                        renderPipeline(); // Refresh totals
                    }
                }
            });
        });
    }
}

function parseBudget(budgetStr) {
    if (!budgetStr) return 0;
    // VERY simple parser: grabs the first number with an M and converts to int
    const match = budgetStr.match(/([0-9\.]+)[M|m]/);
    if(match) return parseFloat(match[1]) * 1000000;
    return 1000000; // Default generic value if not parseable
}

function renderPipeline() {
    const inquiries = DB.getInquiries();
    const cols = {
        'New':      { el: $('col-new'),    ct: $('count-new'),    val: $('val-new'),    tot:0, cnt:0 },
        'Warm Lead':{ el: $('col-warm'),   ct: $('count-warm'),   val: $('val-warm'),   tot:0, cnt:0 },
        'In Escrow':{ el: $('col-hot'),    ct: $('count-hot'),    val: $('val-hot'),    tot:0, cnt:0 },
        'Closed':   { el: $('col-closed'), ct: $('count-closed'), val: $('val-closed'), tot:0, cnt:0 },
    };

    // Clear html
    Object.values(cols).forEach(c => { if(c.el) c.el.innerHTML = ''; });

    inquiries.forEach((lead, i) => {
        // Map status to column
        let mapped = lead.status;
        if (mapped === 'Contacted') mapped = 'New';
        if (mapped === 'Hot Lead') mapped = 'In Escrow';
        
        const col = cols[mapped];
        if (!col) return; // Ignore "Lost" or unmapped statuses

        const val = parseBudget(lead.budget);
        
        col.tot += val;
        col.cnt++;

        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.setAttribute('data-id', lead.id);
        if (mapped === 'Closed') card.style.borderColor = 'var(--accent)';
        
        // Add staggered animation delay
        card.style.animationDelay = (col.cnt * 40) + 'ms';
        
        card.innerHTML = `
            <div class="kanban-card-title">${lead.name}</div>
            <div class="kanban-card-intent" style="margin-bottom:0.25rem">${lead.intent}</div>
            <div class="kanban-card-budget" style="margin-bottom:0.75rem">${lead.budget}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto">
                ${badgeHTML(mapped)}
                <div style="font-size:0.7rem;color:var(--text-secondary);cursor:pointer;text-decoration:underline" onclick="openPipelineDetail('${lead.id}')">View</div>
            </div>
        `;
        col.el.appendChild(card);
    });

    // Update totals
    Object.values(cols).forEach(c => {
        if(c.ct) c.ct.textContent = c.cnt;
        if(c.val) c.val.textContent = c.tot > 0 ? formatCurrency(c.tot) : '—';
    });
}

function openPipelineDetail(id) {
    const i = DB.getInquiries().find(q=>q.id===id);
    if (!i) return;
    const modal = $('modal-pipeline-detail');
    if (!modal) return;
    modal.querySelector('#pd-name').textContent   = i.name;
    modal.querySelector('#pd-intent').textContent = i.intent;
    modal.querySelector('#pd-budget').textContent = i.budget;
    modal.querySelector('#pd-status').innerHTML   = badgeHTML(i.status);
    modal.querySelector('#pd-msg').textContent    = i.message || 'No additional details provided.';
    openModal('modal-pipeline-detail');
}

function triggerCelebration() {
    if (typeof confetti === 'undefined') return;
    const colors = ['#A47C48', '#FFD700', '#FFFFFF', '#D8CCBC'];
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    // Launch firework bursts from random positions across the screen
    (function frame() {
        const remaining = end - Date.now();
        if (remaining <= 0) return;

        // Random origin each frame for a fireworks-all-over effect
        confetti({
            particleCount: 25,
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            gravity: 0.8,
            origin: { x: Math.random(), y: Math.random() * 0.6 },
            colors: colors
        });

        // Stagger a second burst for density
        if (Math.random() > 0.3) {
            confetti({
                particleCount: 15,
                startVelocity: 20,
                spread: 360,
                ticks: 50,
                gravity: 0.6,
                origin: { x: Math.random(), y: Math.random() * 0.5 },
                colors: colors
            });
        }

        setTimeout(frame, 80 + Math.random() * 120);
    }());
}

// ── PAGE: SETTINGS ────────────────────────────────────────
function initSettings() {
    checkAuth();

    // Load profile
    const profile = DB.get('profile', { fname: 'Kanye', lname: 'West' });
    const fnameInput = $('setting-fname');
    const lnameInput = $('setting-lname');
    if (fnameInput) fnameInput.value = profile.fname || '';
    if (lnameInput) lnameInput.value = profile.lname || '';

    // Profile photo upload
    const changePhotoBtn = $('change-photo-btn');
    const removePhotoBtn = $('remove-photo-btn');
    const avatarFileInput = $('avatar-file-input');
    if (removePhotoBtn && profile.photo) removePhotoBtn.style.display = '';

    if (changePhotoBtn && avatarFileInput) {
        changePhotoBtn.addEventListener('click', () => avatarFileInput.click());
        avatarFileInput.addEventListener('change', () => {
            const file = avatarFileInput.files[0];
            if (!file) return;
            if (!['image/jpeg','image/png'].includes(file.type)) {
                showToast('Please select a JPG or PNG file.', 'error'); return;
            }
            if (file.size > 2 * 1024 * 1024) {
                showToast('Image must be under 2MB.', 'error'); return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const current = DB.get('profile', { fname: 'Kanye', lname: 'West' });
                DB.set('profile', { ...current, photo: reader.result });
                showToast('Profile photo updated ✓', 'success');
                if (removePhotoBtn) removePhotoBtn.style.display = '';
                checkAuth();
            };
            reader.readAsDataURL(file);
            avatarFileInput.value = '';
        });
    }
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            const current = DB.get('profile', { fname: 'Kanye', lname: 'West' });
            delete current.photo;
            DB.set('profile', current);
            showToast('Profile photo removed', 'success');
            removePhotoBtn.style.display = 'none';
            checkAuth();
        });
    }

    // Save profile
    const saveBtn = $('save-profile-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const newFname = (fnameInput.value || '').trim();
            const newLname = (lnameInput.value || '').trim();
            const current = DB.get('profile', { fname: 'Kanye', lname: 'West' });
            DB.set('profile', { ...current, fname: newFname, lname: newLname });
            showToast('Profile updated ✓', 'success');
            checkAuth();
        });
    }

    // Change password
    const passBtn = $('save-password-btn');
    if (passBtn) {
        passBtn.addEventListener('click', async () => {
            const currentPass = $('setting-current-pass').value;
            const newPass = $('setting-new-pass').value;
            const confirmPass = $('setting-confirm-pass').value;

            if (!currentPass || !newPass || !confirmPass) {
                showToast('Please fill in all password fields.', 'error');
                return;
            }

            const creds = getStoredCredentials();
            const currentHash = await hashPassword(currentPass);

            if (currentHash !== creds.passHash) {
                showToast('Current password is incorrect.', 'error');
                return;
            }

            if (newPass.length < 4) {
                showToast('New password must be at least 4 characters.', 'error');
                return;
            }

            if (newPass !== confirmPass) {
                showToast('New passwords do not match.', 'error');
                return;
            }

            const newHash = await hashPassword(newPass);
            localStorage.setItem('kl360_credentials', JSON.stringify({ email: creds.email, passHash: newHash }));

            $('setting-current-pass').value = '';
            $('setting-new-pass').value = '';
            $('setting-confirm-pass').value = '';
            showToast('Password updated successfully ✓', 'success');
        });
    }
}

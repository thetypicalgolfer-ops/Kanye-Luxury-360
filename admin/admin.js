// ============================================================
//   KANYE LUXURY 360 — ADMIN BACKEND · Full Engine
// ============================================================

// ── DATA LAYER ───────────────────────────────────────────
const DB = {
    get(key, fallback = []) {
        const val = localStorage.getItem('kl360_' + key);
        return val ? JSON.parse(val) : fallback;
    },
    set(key, data) {
        localStorage.setItem('kl360_' + key, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('db:update', { detail: { key } }));
    },
    getListings() {
        return this.get('listings', [
            { id:'1', title:'Limestone & Steel Contemporary Estate', location:'The Dominion · San Antonio, TX', price:4250000, beds:5, baths:6, sqft:7200, acres:1.2, status:'Active', tag:'Just Listed', image:'../img-estate-1.png?v=7', description:'A breathtaking fusion of natural limestone and steel. 5 beds, 6 baths, chef\'s kitchen, resort pool.', createdAt: new Date(Date.now()-2*86400000).toISOString() },
            { id:'2', title:'Architectural Modern Home', location:'Alamo Heights · San Antonio, TX', price:2895000, beds:4, baths:4.5, sqft:4800, acres:0.5, status:'Active', tag:'Active', image:'../img-estate-3.png?v=7', description:'Clean lines, floor-to-ceiling glass, and bespoke finishes define this masterwork.', createdAt: new Date(Date.now()-7*86400000).toISOString() },
            { id:'3', title:'Hill Country Legacy Ranch', location:'Boerne · Texas Hill Country', price:6800000, beds:4, baths:3, sqft:3800, acres:340, status:'Active', tag:'Ranch Land', image:'../img-estate-2.png?v=6', description:'340 pristine acres, ag-exempt, with a custom 4-bed lodge and multiple water features.', createdAt: new Date(Date.now()-14*86400000).toISOString() },
            { id:'4', title:'Stone Oak Executive Estate', location:'Stone Oak · San Antonio, TX', price:1975000, beds:5, baths:4, sqft:4200, acres:0.8, status:'Pending', tag:'Under Contract', image:'../img-stone-oak.png?v=6', description:'Impeccably maintained estate in the heart of Stone Oak\'s premier gated community.', createdAt: new Date(Date.now()-21*86400000).toISOString() },
            { id:'5', title:'New Braunfels Waterfront Estate', location:'New Braunfels · Comal County, TX', price:3450000, beds:6, baths:5, sqft:5600, acres:2.1, status:'Active', tag:'Waterfront', image:'../img-new-braunfels.png?v=6', description:'Stunning river-front estate with private boat dock, infinity pool, and 6 en-suite bedrooms.', createdAt: new Date(Date.now()-5*86400000).toISOString() },
            { id:'6', title:'Fredericksburg Wine Country Estate', location:'Fredericksburg · Gillespie County, TX', price:5200000, beds:4, baths:4, sqft:4900, acres:75, status:'Off-Market', tag:'Off-Market', image:'../img-fredericksburg.png?v=6', description:'75-acre Hill Country estate surrounded by vineyards. Private guest cottage, pool, and event barn.', createdAt: new Date(Date.now()-30*86400000).toISOString() },
        ]);
    },
    saveListings(data) { this.set('listings', data); },
    getInquiries() {
        return this.get('inquiries', [
            { id:'1', name:'Michael & Elena Vance', email:'mvance@example.com', phone:'(210) 555-0192', intent:'Purchase a property', budget:'$3M–$5M', message:'Looking for a private estate in The Dominion district. We need at least 5 bedrooms and a pool.', status:'Hot Lead', listingId:'1', createdAt: new Date(Date.now()-1*86400000).toISOString() },
            { id:'2', name:'Arthur Pemberton', email:'a.pemberton@example.com', phone:'(210) 555-8839', intent:'Acquire land or ranch', budget:'$5M–$10M', message:'Interested in Hill Country ranch land, 200+ acres. Looking to build a legacy property for my family.', status:'Warm Lead', listingId:'3', createdAt: new Date(Date.now()-3*86400000).toISOString() },
            { id:'3', name:'Jessica & Tom Wei', email:'jwei@example.com', phone:'(512) 555-4421', intent:'Purchase a property', budget:'$2M–$3M', message:'Relocating from Austin, need modern luxury near top-rated schools in San Antonio.', status:'New', listingId:'2', createdAt: new Date(Date.now()-5*86400000).toISOString() },
            { id:'4', name:'David Calderon', email:'d.calderon@example.com', phone:'(210) 555-7723', intent:'Sell my property', budget:'Not Specified', message:'I own a 4,500 sqft home in Stone Oak. Looking for a top agent to list it properly.', status:'Contacted', listingId:null, createdAt: new Date(Date.now()-8*86400000).toISOString() },
            { id:'5', name:'Priya Nair', email:'p.nair@example.com', phone:'(210) 555-3351', intent:'Investment inquiry', budget:'$2M+', message:'Exploring investment-grade properties in the Hill Country corridor.', status:'New', listingId:null, createdAt: new Date(Date.now()-12*86400000).toISOString() },
            { id:'6', name:'James & Carol Whitfield', email:'whitfields@example.com', phone:'(830) 555-2200', intent:'Purchase a property', budget:'$1M–$2M', message:'Retiring and looking for a Hill Country estate close to Boerne or Fredericksburg.', status:'Warm Lead', listingId:'3', createdAt: new Date(Date.now()-15*86400000).toISOString() },
        ]);
    },
    saveInquiries(data) { this.set('inquiries', data); },
    getCampaigns() {
        return this.get('campaigns', [
            { id:'1', name:'Limestone Estate Launch', type:'Email Blast', status:'Live', audience:'Buyer Leads', sent:340, opens:218, clicks:64, engagement:64, notes:'Targeted at $3M–$5M buyer segment. Focus on architectural photography.', createdAt: new Date(Date.now()-5*86400000).toISOString() },
            { id:'2', name:'Hill Country Ranch Teasers', type:'Social Media', status:'Live', audience:'Ranch Buyers', sent:0, opens:1240, clicks:312, engagement:25, notes:'Instagram + Facebook carousel ads targeting ranch and land buyers.', createdAt: new Date(Date.now()-2*86400000).toISOString() },
            { id:'3', name:'Seller Valuation Drive — Q1', type:'Email Blast', status:'Completed', audience:'Seller Leads', sent:520, opens:312, clicks:89, engagement:60, notes:'Q1 seller campaign. Successfully generated 3 new listing appointments.', createdAt: new Date(Date.now()-30*86400000).toISOString() },
            { id:'4', name:'Spring Luxury Open House Series', type:'Direct Mailer', status:'Draft', audience:'All Leads', sent:0, opens:0, clicks:0, engagement:0, notes:'Planned for April. High-gloss mailer targeting Dominion and Alamo Heights zip codes.', createdAt: new Date(Date.now()-1*86400000).toISOString() },
        ]);
    },
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
function checkAuth() {
    if (!sessionStorage.getItem('kl360_auth') && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
    // Set agent name in header
    const auth = JSON.parse(sessionStorage.getItem('kl360_auth') || '{}');
    const profile = DB.get('profile', { fname: 'Kanye', lname: 'West' });
    const name = (profile.fname || profile.lname) ? `${profile.fname} ${profile.lname}`.trim() : (auth.name || auth.email || 'Agent');
    const initials = name.split(/[\s@]/).map(w=>w.charAt(0)).join('').substring(0,2).toUpperCase() || 'A';
    
    $$('.user-name').forEach(el => el.textContent = name.includes('@') ? name.split('@')[0] : name);
    $$('.avatar-initials').forEach(el => el.textContent = initials);
}
function logout() {
    sessionStorage.removeItem('kl360_auth');
    window.location.href = 'login.html';
}

// ── PAGE: LOGIN ───────────────────────────────────────────
function initLogin() {
    const form = $('login-form');
    if (!form) return;
    form.addEventListener('submit', e => {
        e.preventDefault();
        const email = $('login-email').value.trim();
        const pass  = $('login-pass').value;
        const btn   = form.querySelector('button[type=submit]');
        btn.textContent = 'Signing in…';
        btn.disabled = true;
        setTimeout(() => {
            if (email && pass.length >= 4) {
                sessionStorage.setItem('kl360_auth', JSON.stringify({ email, name: email.split('@')[0] }));
                window.location.href = 'dashboard.html';
            } else {
                const err = $('login-error');
                if (err) { err.textContent='Invalid credentials. Enter any email + 4-char password.'; err.style.display='block'; }
                btn.textContent = 'Sign In to Dashboard';
                btn.disabled = false;
            }
        }, 700);
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
function initListings() {
    checkAuth();
    renderListingsTable();
    const form = $('listing-form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const listings = DB.getListings();
            const priceRaw = $('l-price').value.replace(/[^0-9.]/g,'');
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
                description: $('l-desc').value,
                image:    '../img-estate-1.png?v=7',
                createdAt: new Date().toISOString()
            });
            DB.saveListings(listings);
            closeModal('modal-add-listing');
            form.reset();
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

function renderListingsTable(filter = 'All') {
    const tbody = $('listings-body');
    if (!tbody) return;
    let listings = DB.getListings();
    if (filter !== 'All') listings = listings.filter(l => l.status === filter);
    if (!listings.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:4rem;color:var(--text-secondary)">No listings match this filter.</td></tr>`;
        return;
    }
    tbody.innerHTML = listings.map(l => `
        <tr class="table-row-animate" onclick="openListingDetail('${l.id}')" style="cursor:pointer">
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
            <td>${badgeHTML(l.status)}</td>
            <td>${badgeHTML(l.tag)}</td>
            <td style="font-size:0.82rem;color:var(--text-secondary)">${formatDate(l.createdAt)}</td>
            <td onclick="event.stopPropagation()">
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="openListingDetail('${l.id}')">View</button>
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
}

function openListingDetail(id) {
    const l = DB.getListings().find(x => x.id === id);
    if (!l) return;
    const modal = $('modal-listing-detail');
    if (!modal) return;
    modal.querySelector('#ld-image').src = l.image;
    modal.querySelector('#ld-title').textContent = l.title;
    modal.querySelector('#ld-location').textContent = l.location;
    modal.querySelector('#ld-status').innerHTML = badgeHTML(l.status) + ' ' + badgeHTML(l.tag);
    modal.querySelector('#ld-price').textContent = formatCurrency(l.price);
    modal.querySelector('#ld-specs').textContent = `${l.beds} bed · ${l.baths} bath · ${Number(l.sqft).toLocaleString()} sqft${l.acres && l.acres!=='—' ? ' · '+l.acres+' acres':''}`;
    modal.querySelector('#ld-desc').textContent = l.description || 'No description provided.';
    modal.querySelector('#ld-date').textContent = 'Listed ' + formatDate(l.createdAt);
    openModal('modal-listing-detail');
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
    tbody.innerHTML = inquiries.map(i => `
        <tr class="table-row-animate" style="cursor:pointer" onclick="viewInquiry('${i.id}')">
            <td>
                <div style="font-weight:500;font-size:0.9rem">${i.name}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">${i.email}</div>
            </td>
            <td style="font-size:0.85rem;color:var(--text-secondary)">${i.intent}</td>
            <td style="font-size:0.85rem">${i.budget}</td>
            <td>${badgeHTML(i.status)}</td>
            <td style="font-size:0.78rem;color:var(--text-secondary)">${timeSince(i.createdAt)}</td>
            ${!compact ? `<td onclick="event.stopPropagation()">
                <select class="filter-select" style="padding:0.3rem 0.6rem;font-size:0.72rem" onchange="updateInquiryStatus('${i.id}',this.value);this.value=''">
                    <option value="">Update Status</option>
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

function updateInquiryStatus(id, status) {
    if (!status) return;
    const inqs = DB.getInquiries();
    const idx = inqs.findIndex(i=>i.id===id);
    if (idx!==-1) { inqs[idx].status=status; DB.saveInquiries(inqs); }
    renderInquiriesTable('inquiries-body', DB.getInquiries());
    showToast(`Status updated → "${status}"`);
}

function viewInquiry(id) {
    const i = DB.getInquiries().find(q=>q.id===id);
    if (!i) return;
    _currentInquiryId = id;
    const modal = $('modal-inquiry-detail');
    if (!modal) return;
    modal.querySelector('#detail-name').textContent   = i.name;
    modal.querySelector('#detail-email').textContent  = i.email;
    modal.querySelector('#detail-phone').textContent  = i.phone;
    modal.querySelector('#detail-intent').textContent = i.intent;
    modal.querySelector('#detail-budget').textContent = i.budget;
    modal.querySelector('#detail-msg').textContent    = i.message;
    modal.querySelector('#detail-status').innerHTML   = badgeHTML(i.status);
    modal.querySelector('#detail-date').textContent   = formatDate(i.createdAt);
    const emailBtn = modal.querySelector('#detail-email-btn');
    if (emailBtn) emailBtn.href = 'mailto:' + i.email + '?subject=Kanye Luxury 360 — Following Up';
    openModal('modal-inquiry-detail');
}

function updateDetailStatus(status) {
    if (!status || !_currentInquiryId) return;
    updateInquiryStatus(_currentInquiryId, status);
    const modal = $('modal-inquiry-detail');
    if (modal) modal.querySelector('#detail-status').innerHTML = badgeHTML(status);
}

// ── PAGE: CAMPAIGNS ───────────────────────────────────────
function initCampaigns() {
    checkAuth();
    renderCampaignCards();
    renderCampaignMetrics();
    const form = $('campaign-form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const campaigns = DB.getCampaigns();
            campaigns.unshift({
                id:       Date.now().toString(),
                name:     $('c-name').value,
                type:     $('c-type').value,
                audience: $('c-audience').value,
                notes:    $('c-notes').value,
                status:   'Draft',
                sent:0, opens:0, clicks:0, engagement:0,
                createdAt: new Date().toISOString()
            });
            DB.saveCampaigns(campaigns);
            closeModal('modal-add-campaign');
            form.reset();
            renderCampaignCards();
            renderCampaignMetrics();
            showToast('Campaign saved as Draft');
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

function renderCampaignCards() {
    const grid = $('campaigns-grid');
    if (!grid) return;
    const campaigns = DB.getCampaigns();

    // "Create" card first
    grid.innerHTML = `
        <div class="campaign-create-card" onclick="openModal('modal-add-campaign')">
            <div class="campaign-create-icon">+</div>
            <div class="campaign-create-label">New Campaign</div>
            <div class="campaign-create-sub">Email · Social · Mailer · Event</div>
        </div>
    `;

    campaigns.forEach((c, idx) => {
        const div = document.createElement('div');
        div.className = 'campaign-card';
        div.style.animationDelay = (idx * 80) + 'ms';
        const openRate = c.sent > 0 ? Math.round(c.opens/c.sent*100) : (c.opens > 0 ? 25 : 0);
        const engWidth = Math.min(c.engagement || openRate, 100);
        div.innerHTML = `
            <div class="campaign-card-header">
                <div class="campaign-card-type">${c.type}</div>
                ${badgeHTML(c.status)}
            </div>
            <div class="campaign-card-title">${c.name}</div>
            <div class="campaign-card-audience">Audience: ${c.audience}</div>
            ${c.notes ? `<div class="campaign-card-notes">"${c.notes.substring(0,80)}${c.notes.length>80?'…':''}"</div>` : ''}
            <div class="campaign-card-engagement">
                <div class="campaign-engagement-label">
                    <span>Engagement</span>
                    <strong>${engWidth}%</strong>
                </div>
                <div class="campaign-engagement-bar">
                    <div class="campaign-engagement-fill" style="width:0%" data-width="${engWidth}%"></div>
                </div>
            </div>
            <div class="campaign-card-stats">
                <div class="campaign-stat"><span>Sent</span><strong>${c.sent.toLocaleString()}</strong></div>
                <div class="campaign-stat"><span>Opens</span><strong>${c.opens.toLocaleString()}</strong></div>
                <div class="campaign-stat"><span>Clicks</span><strong>${c.clicks.toLocaleString()}</strong></div>
            </div>
            <div class="campaign-card-actions">
                ${c.status==='Draft'  ? `<button class="btn btn-primary btn-sm" onclick="launchCampaign('${c.id}',event)">🚀 Launch</button>` : ''}
                ${c.status==='Live'   ? `<button class="btn btn-secondary btn-sm" onclick="pauseCampaign('${c.id}',event)">⏸ Pause</button>` : ''}
                ${c.status==='Paused' ? `<button class="btn btn-primary btn-sm" onclick="launchCampaign('${c.id}',event)">▶ Resume</button>` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteCampaign('${c.id}',event)">Delete</button>
            </div>
        `;
        grid.appendChild(div);
    });

    // Animate engagement bars after render
    setTimeout(() => {
        $$('.campaign-engagement-fill').forEach(bar => {
            bar.style.transition = 'width 1s cubic-bezier(0.22,1,0.36,1)';
            bar.style.width = bar.dataset.width;
        });
        $$('.campaign-card').forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(16px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease, border-color 0.25s, box-shadow 0.25s, transform 0.25s';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 80);
        });
    }, 60);
}

function launchCampaign(id, e) {
    if (e) e.stopPropagation();
    const campaigns = DB.getCampaigns();
    const idx = campaigns.findIndex(c=>c.id===id);
    if (idx!==-1) { campaigns[idx].status='Live'; DB.saveCampaigns(campaigns); }
    renderCampaignCards(); renderCampaignMetrics();
    showToast('Campaign launched! 🚀');
}
function pauseCampaign(id, e) {
    if (e) e.stopPropagation();
    const campaigns = DB.getCampaigns();
    const idx = campaigns.findIndex(c=>c.id===id);
    if (idx!==-1) { campaigns[idx].status='Paused'; DB.saveCampaigns(campaigns); }
    renderCampaignCards(); renderCampaignMetrics();
    showToast('Campaign paused');
}
function deleteCampaign(id, e) {
    if (e) e.stopPropagation();
    if (!confirm('Delete this campaign?')) return;
    DB.saveCampaigns(DB.getCampaigns().filter(c=>c.id!==id));
    renderCampaignCards(); renderCampaignMetrics();
    showToast('Campaign deleted', 'danger');
}

// ── PAGE: ANALYTICS ───────────────────────────────────────
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
    renderListingPerfTable();
    renderStatusBars();
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

function renderStatusBars() {
    const container = $('status-breakdown');
    if (!container) return;
    const listings = DB.getListings();
    const groups = {};
    listings.forEach(l => { groups[l.status] = (groups[l.status]||0)+1; });
    const colors = { 'Active':'var(--bronze)','Pending':'#e68c00','Off-Market':'var(--sage)','Sold':'#4caf81' };
    container.innerHTML = Object.entries(groups).map(([s,n]) => `
        <div style="margin-bottom:1.1rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem">
                <span style="font-size:0.82rem;color:var(--text-secondary)">${s}</span>
                <span style="font-size:0.82rem;color:var(--text-primary);font-weight:500">${n} listing${n>1?'s':''}</span>
            </div>
            <div style="height:5px;background:var(--bg-hover);border-radius:3px;overflow:hidden">
                <div class="anim-bar" data-width="${Math.round(n/listings.length*100)}%" style="height:100%;width:0%;background:${colors[s]||'var(--bronze)'};border-radius:3px;transition:width 1s cubic-bezier(0.22,1,0.36,1)"></div>
            </div>
        </div>
    `).join('');
    setTimeout(() => $$('.anim-bar').forEach(b=>b.style.width=b.dataset.width), 100);
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
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;
    (function frame() {
        const remaining = end - Date.now();
        if (remaining <= 0) return;
        confetti({
            particleCount: 5, angle: 60, spread: 55, origin: { x: 0 },
            colors: ['#A47C48', '#FFD700', '#FFFFFF', '#D8CCBC']
        });
        confetti({
            particleCount: 5, angle: 120, spread: 55, origin: { x: 1 },
            colors: ['#A47C48', '#FFD700', '#FFFFFF', '#D8CCBC']
        });
        requestAnimationFrame(frame);
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

    // Save profile
    const saveBtn = $('save-profile-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const newFname = (fnameInput.value || '').trim();
            const newLname = (lnameInput.value || '').trim();
            DB.set('profile', { ...profile, fname: newFname, lname: newLname });
            
            showToast('Profile updated ✓', 'success');
            
            // Re-run checkAuth to instantly update the UI (header name/initials)
            checkAuth();
        });
    }
}

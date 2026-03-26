/* ============================================================
   KANYE CONCIERGE 360 — Dynamic Listings Renderer
   Reads admin-managed listings from localStorage and renders
   them on the homepage (Exceptional Estates) and properties page.

   LIVE SYNC: Listens for localStorage changes from the admin
   portal and re-renders instantly — no refresh needed.
   ============================================================ */

(function () {
    'use strict';

    // ── Read from the same localStorage the admin uses ────────
    function getListings() {
        const raw = localStorage.getItem('kl360_listings');
        if (raw) return JSON.parse(raw);
        // Fallback seed data (mirrors admin defaults)
        return [
            { id:'1', title:'Limestone & Steel Contemporary Estate', location:'The Dominion · San Antonio, TX', price:0, beds:5, baths:6, sqft:7200, acres:1.2, status:'Off-Market', tag:'Off-Market', visibility:'both', image:'img-estate-1.png', photos:['img-estate-1.png','img-estate-1b.png','img-estate-1c.png'] },
            { id:'2', title:'Architectural Modern Home', location:'Alamo Heights · San Antonio, TX', price:0, beds:4, baths:4.5, sqft:4800, acres:0.5, status:'Off-Market', tag:'Off-Market', visibility:'both', image:'img-estate-2a.png', photos:['img-estate-2a.png','img-estate-2b.png','img-estate-2c.png'] },
            { id:'3', title:'Hill Country Legacy Ranch', location:'Boerne · Texas Hill Country', price:0, beds:4, baths:3, sqft:3800, acres:340, status:'Off-Market', tag:'Off-Market', visibility:'both', image:'img-estate-3a.png', photos:['img-estate-3a.png','img-estate-3b.png','img-estate-3c.png'] },
            { id:'4', title:'Stone Oak Executive Estate', location:'Stone Oak · San Antonio, TX', price:0, beds:5, baths:4, sqft:4200, acres:0.8, status:'Off-Market', tag:'Off-Market', visibility:'listings', image:'img-stone-oak-1.png', photos:['img-stone-oak-1.png','img-stone-oak-2.png','img-stone-oak-3.png'] },
            { id:'5', title:'New Braunfels Waterfront Estate', location:'New Braunfels · Comal County, TX', price:0, beds:6, baths:5, sqft:5600, acres:2.1, status:'Off-Market', tag:'Off-Market', visibility:'listings', image:'img-new-braunfels.png', photos:['img-new-braunfels.png','img-new-braunfels-b.png','img-new-braunfels-c.png'] },
            { id:'6', title:'Fredericksburg Wine Country Estate', location:'Fredericksburg · Gillespie County, TX', price:0, beds:4, baths:4, sqft:4900, acres:75, status:'Off-Market', tag:'Off-Market', visibility:'listings', image:'img-fredericksburg.png', photos:['img-fredericksburg.png','img-fredericksburg-b.png','img-fredericksburg-c.png'] },
        ];
    }

    function formatPrice(n) {
        return '$' + Number(n).toLocaleString('en-US');
    }

    // Image src — admin stores paths with ../ prefix, public pages need without
    function imgSrc(listing) {
        let src = listing.image || '';
        if (src.startsWith('../')) src = src.substring(3);
        if (src.startsWith('data:')) return src;
        return src;
    }

    // Tag background color
    function tagBg(tag) {
        const map = {
            'Just Listed': 'var(--bronze)',
            'Active': 'var(--sage)',
            'Ranch Land': 'var(--saddle)',
            'Waterfront': '#2a6496',
            'Under Contract': '#e68c00',
            'Off-Market': '#555',
            'Sold': '#333',
        };
        return map[tag] || 'var(--bronze)';
    }

    // ── Build a property card HTML string ─────────────────────
    function buildCard(listing, opts) {
        const style = opts.minHeight ? `min-height:${opts.minHeight}; position:relative;` : '';
        const tag = listing.tag
            ? `<span class="pc-tag" style="background:${tagBg(listing.tag)}">${listing.tag}</span>`
            : '';

        const details = [];
        if (listing.beds) details.push(`<span>${listing.beds} Bd</span>`);
        if (listing.baths) details.push(`<span>${listing.baths} Ba</span>`);
        if (listing.sqft && Number(listing.sqft)) details.push(`<span>${Number(listing.sqft).toLocaleString()} sf</span>`);
        if (listing.acres && listing.acres !== '—') {
            const ac = Number(listing.acres);
            if (ac >= 5) details.push(`<span>${ac} Ac</span>`);
        }
        details.push(`<span class="pc-price">${listing.price ? formatPrice(listing.price) : 'Price Upon Request'}</span>`);

        return `
            <a href="property-detail.html?id=${listing.id}" class="property-card reveal" style="${style}">
                ${tag}
                <div class="pc-img"><img src="${imgSrc(listing)}" alt="${listing.title}"></div>
                <div class="pc-overlay"></div>
                <div class="pc-content">
                    <div class="pc-location">${listing.location}</div>
                    <div class="pc-name">${listing.title}</div>
                    <div class="pc-details">${details.join('')}</div>
                </div>
            </a>`;
    }

    // ── Re-apply GSAP reveal animations to freshly rendered cards ─
    function animateNewCards(container) {
        if (typeof gsap === 'undefined') return;
        container.querySelectorAll('.property-card').forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            gsap.to(el, {
                opacity: 1, y: 0,
                duration: 0.8,
                delay: i * 0.12,
                ease: 'power3.out'
            });
        });
    }

    // Re-attach custom cursor hover on dynamic elements
    function attachCursorHover(container) {
        const ring = document.getElementById('cursor-ring');
        if (!ring) return;
        container.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('hover'));
            el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
        });
    }

    // ── HOMEPAGE: Exceptional Estates ─────────────────────────
    function renderExceptionalEstates(animate) {
        const grid = document.getElementById('exceptional-estates-grid');
        if (!grid) return;

        const all = getListings();
        const featured = all.filter(l =>
            l.visibility === 'exceptional' || l.visibility === 'both' || l.visibility === 'homepage'
        );

        if (!featured.length) {
            grid.innerHTML = '<p style="color:var(--limestone);font-size:0.9rem;opacity:0.6;grid-column:1/-1;text-align:center;padding:4rem 0;">No featured listings yet. Add listings in the Agent Portal and set visibility to "Exceptional Estates" or "Both".</p>';
            return;
        }

        const show = featured.slice(0, 3);
        grid.innerHTML = show.map(l => buildCard(l, {})).join('');

        if (animate) animateNewCards(grid);
        attachCursorHover(grid);
    }

    // ── PROPERTIES PAGE: Filtered Listings ───────────────────
    function getVisibleListings() {
        const all = getListings();
        return all.filter(l =>
            l.visibility === 'listings' || l.visibility === 'both' || l.visibility === 'homepage'
        );
    }

    // Classify a listing into a property type based on tag/acres/title
    function getPropertyType(l) {
        const tag = (l.tag || '').toLowerCase();
        const title = (l.title || '').toLowerCase();
        if (tag.includes('ranch') || tag.includes('land') || Number(l.acres) >= 10) return 'Ranch & Land';
        if (tag.includes('waterfront') || title.includes('waterfront') || title.includes('river')) return 'Waterfront';
        return 'Luxury Home';
    }

    // Extract a short location key from the full location string
    // e.g. "The Dominion · San Antonio, TX" → "The Dominion"
    function getLocationKey(loc) {
        if (!loc) return '';
        return loc.split('·')[0].split('—')[0].split(',')[0].trim();
    }

    function applyFilters(listings) {
        const typeEl   = document.getElementById('filter-type');
        const locEl    = document.getElementById('filter-location');
        const priceEl  = document.getElementById('filter-price');
        const statusEl = document.getElementById('filter-status');

        let filtered = listings;

        // Property type
        const typeVal = typeEl ? typeEl.value : '';
        if (typeVal) {
            filtered = filtered.filter(l => getPropertyType(l) === typeVal);
        }

        // Location
        const locVal = locEl ? locEl.value : '';
        if (locVal) {
            filtered = filtered.filter(l => getLocationKey(l.location) === locVal);
        }

        // Price range
        const priceVal = priceEl ? priceEl.value : '';
        if (priceVal) {
            const [min, max] = priceVal.split('-').map(Number);
            filtered = filtered.filter(l => l.price >= min && l.price <= max);
        }

        // Status
        const statusVal = statusEl ? statusEl.value : '';
        if (statusVal) {
            filtered = filtered.filter(l => l.status === statusVal);
        }

        return filtered;
    }

    function populateLocationDropdown(listings) {
        const locEl = document.getElementById('filter-location');
        if (!locEl) return;
        const current = locEl.value;
        const locations = [...new Set(listings.map(l => getLocationKey(l.location)).filter(Boolean))].sort();
        locEl.innerHTML = '<option value="">All Locations</option>' +
            locations.map(loc => `<option value="${loc}"${loc === current ? ' selected' : ''}>${loc}</option>`).join('');
    }

    function renderPropertiesPage(animate) {
        const grid = document.getElementById('properties-listings-grid');
        if (!grid) return;

        const visible = getVisibleListings();

        // Populate location dropdown from actual data
        populateLocationDropdown(visible);

        const filtered = applyFilters(visible);

        if (!visible.length) {
            grid.innerHTML = '<p style="color:var(--charcoal);font-size:0.9rem;opacity:0.5;grid-column:1/-1;text-align:center;padding:4rem 0;">No listings available. Add listings in the Agent Portal.</p>';
            return;
        }

        if (!filtered.length) {
            grid.innerHTML = '<p style="color:var(--charcoal);font-size:0.9rem;opacity:0.5;grid-column:1/-1;text-align:center;padding:4rem 0;">No listings match your filters.</p>';
            return;
        }

        grid.innerHTML = filtered.map(l => buildCard(l, { minHeight: '380px' })).join('');

        if (animate) animateNewCards(grid);
        attachCursorHover(grid);
    }

    // ── FILTER EVENT LISTENERS ────────────────────────────────
    function initFilters() {
        const bar = document.getElementById('properties-filter-bar');
        if (!bar) return;
        bar.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', () => renderPropertiesPage(true));
        });
    }

    // ── RENDER ALL ────────────────────────────────────────────
    function renderAll(animate) {
        renderExceptionalEstates(animate);
        renderPropertiesPage(animate);
    }

    // ── INITIAL RENDER ────────────────────────────────────────
    // Run immediately — loaded before app.js so GSAP picks up
    // our .reveal elements for scroll animations on first load.
    renderAll(false);
    initFilters();

    // ── LIVE SYNC ─────────────────────────────────────────────
    // Two listeners for maximum reliability:
    //
    // 1) 'storage' event — fires when localStorage changes in a
    //    DIFFERENT tab (built-in browser API).
    // 2) BroadcastChannel — the admin explicitly posts a message
    //    after every save, reaching all open tabs instantly.
    //
    // Together these guarantee the homepage and properties page
    // update the moment the agent hits save — no refresh needed.

    window.addEventListener('storage', function (e) {
        if (e.key === 'kl360_listings') {
            renderAll(true);
        }
    });

    try {
        const channel = new BroadcastChannel('kl360_sync');
        channel.addEventListener('message', function (e) {
            if (e.data && e.data.key === 'listings') {
                renderAll(true);
            }
        });
    } catch (ignored) {}
})();

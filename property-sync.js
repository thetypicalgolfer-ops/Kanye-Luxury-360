/* ============================================================
   PROPERTY PAGE — LIVE CRM SYNC
   Reads listing data from localStorage (managed by admin portal)
   and dynamically overrides gallery images, title, specs, description,
   and features on static property pages. Updates in real-time when
   the agent makes changes in the CRM.
   ============================================================ */
(function () {
    'use strict';

    // Determine property ID from filename: property-3.html → "3"
    var match = window.location.pathname.match(/property-(\d+)\.html/);
    if (!match) return;
    var propertyId = match[1];

    function getListing() {
        var raw = localStorage.getItem('kl360_listings');
        if (!raw) return null;
        var listings = JSON.parse(raw);
        return listings.find(function (l) { return l.id === propertyId; }) || null;
    }

    function imgSrc(src) {
        if (!src) return '';
        if (src.startsWith('data:')) return src;
        if (src.startsWith('../')) return src.substring(3);
        return src;
    }

    function applyListing(l) {
        if (!l) return;

        // ── Gallery images ──
        var photos = l.photos && l.photos.length ? l.photos : (l.image ? [l.image] : []);
        if (photos.length) {
            var mainImg = document.querySelector('.pd-gallery-main img');
            if (mainImg) mainImg.src = imgSrc(photos[0]);

            var thumbs = document.querySelectorAll('.pd-gallery-thumb img');
            thumbs.forEach(function (img, i) {
                var photoIdx = i + 1;
                if (photos[photoIdx]) {
                    img.src = imgSrc(photos[photoIdx]);
                } else if (photos[0]) {
                    img.src = imgSrc(photos[0]);
                }
            });
        }

        // ── Title ──
        var headline = document.querySelector('.pd-main .section-headline');
        if (headline && l.title) {
            // Try to split at a natural point for the <em> tag
            var parts = l.title.split(/\s+/);
            if (parts.length >= 3) {
                var mid = Math.ceil(parts.length / 2);
                headline.innerHTML = parts.slice(0, mid).join(' ') + '<br><em>' + parts.slice(mid).join(' ') + '</em>';
            } else {
                headline.innerHTML = l.title;
            }
        }

        // ── Location eyebrow ──
        var eyebrow = document.querySelector('.pd-main .section-eyebrow');
        if (eyebrow && l.location) eyebrow.textContent = l.location;

        // ── Specs ──
        var specs = document.querySelectorAll('.pd-spec');
        var specData = [];
        if (l.beds) specData.push({ val: l.beds, lbl: 'Bedrooms' });
        if (l.baths) specData.push({ val: l.baths, lbl: 'Bathrooms' });
        if (l.sqft && Number(l.sqft)) specData.push({ val: Number(l.sqft).toLocaleString(), lbl: 'Square Feet' });
        if (l.acres && l.acres !== '—') specData.push({ val: l.acres, lbl: 'Acres' });

        specData.forEach(function (s, i) {
            if (specs[i]) {
                var valEl = specs[i].querySelector('.pd-spec-val');
                var lblEl = specs[i].querySelector('.pd-spec-lbl');
                if (valEl) valEl.textContent = s.val;
                if (lblEl) lblEl.textContent = s.lbl;
            }
        });

        // ── Description ──
        if (l.description) {
            var descs = document.querySelectorAll('.pd-desc');
            if (descs.length) {
                // Split description into paragraphs by double newline or use as single block
                var paragraphs = l.description.split(/\n\n+/).filter(Boolean);
                descs.forEach(function (el, i) {
                    if (paragraphs[i]) {
                        el.textContent = paragraphs[i];
                        el.style.display = '';
                    } else if (i > 0) {
                        el.style.display = 'none';
                    }
                });
            }
        }

        // ── Price ──
        var priceEl = document.querySelector('.pd-price');
        if (priceEl) {
            if (l.price && Number(l.price) > 0) {
                priceEl.textContent = '$' + Number(l.price).toLocaleString('en-US');
            } else {
                priceEl.textContent = 'Price Upon Request';
            }
        }

        // ── Status badge ──
        var statusEl = document.querySelector('.pd-meta .section-eyebrow');
        if (statusEl && l.status) statusEl.textContent = l.status;

        // ── Page title ──
        if (l.title) {
            document.title = l.title + ' | Kanye Concierge 360';
        }
    }

    // Initial apply
    var listing = getListing();
    if (listing) applyListing(listing);

    // Live sync — listen for changes from admin portal
    window.addEventListener('storage', function (e) {
        if (e.key === 'kl360_listings') {
            var updated = getListing();
            if (updated) applyListing(updated);
        }
    });

    try {
        var channel = new BroadcastChannel('kl360_sync');
        channel.addEventListener('message', function (e) {
            if (e.data && e.data.key === 'listings') {
                var updated = getListing();
                if (updated) applyListing(updated);
            }
        });
    } catch (ignored) {}
})();

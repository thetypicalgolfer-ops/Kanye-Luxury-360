// site-config.js — runs on every public page.
//
// Fetches /api/site-config (cached at the edge for 5 min) and conditionally
// injects:
//   • Google Analytics 4 (gtag.js) if ga4_id is set
//   • Meta Pixel (fbevents.js) if meta_pixel_id is set
//   • Calendly inline embed / link on consultation.html if calendly_url is set
//
// All injection is gated on the corresponding setting being present, so the
// site stays free of analytics tags until the agent intentionally turns them
// on from Settings → Integrations.

(function () {
    // Don't run on admin pages — they have their own bundle and we don't want
    // analytics tracking the agent's own activity.
    if (location.pathname.indexOf('/admin/') !== -1) return;

    var configCacheKey = '__kc360_site_config_v1';
    var configTTLms = 5 * 60 * 1000;  // 5 min client cache to avoid hitting the API on every navigation

    function loadConfig() {
        try {
            var cached = sessionStorage.getItem(configCacheKey);
            if (cached) {
                var parsed = JSON.parse(cached);
                if (parsed && parsed._t && (Date.now() - parsed._t) < configTTLms) {
                    return Promise.resolve(parsed.data);
                }
            }
        } catch (_) {}

        return fetch('/api/site-config', { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : { calendly_url: null, ga4_id: null, meta_pixel_id: null }; })
            .then(function (data) {
                try { sessionStorage.setItem(configCacheKey, JSON.stringify({ _t: Date.now(), data: data })); } catch (_) {}
                return data;
            })
            .catch(function () {
                return { calendly_url: null, ga4_id: null, meta_pixel_id: null };
            });
    }

    function injectGA4(measurementId) {
        if (!measurementId || !/^G-[A-Z0-9]{6,12}$/.test(measurementId)) return;
        // gtag.js — async-loaded so it doesn't block page render.
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', measurementId, { anonymize_ip: true });
    }

    function injectMetaPixel(pixelId) {
        if (!pixelId || !/^\d{8,20}$/.test(String(pixelId))) return;
        // Standard Meta Pixel base code (https://developers.facebook.com/docs/meta-pixel/get-started)
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
            t = b.createElement(e); t.async = !0; t.src = v;
            s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('init', String(pixelId));
        window.fbq('track', 'PageView');
        // <noscript> fallback for tracking visitors with JS disabled.
        var ns = document.createElement('noscript');
        var img = document.createElement('img');
        img.height = 1; img.width = 1; img.style.display = 'none';
        img.src = 'https://www.facebook.com/tr?id=' + encodeURIComponent(pixelId) + '&ev=PageView&noscript=1';
        ns.appendChild(img);
        document.head.appendChild(ns);
    }

    // ── CALENDLY (consultation page only) ─────────────────────────
    function injectCalendly(url) {
        if (!url) return;
        if (location.pathname.indexOf('consultation') === -1) return;

        // Sanity check the URL — must be a calendly.com link.
        try {
            var u = new URL(url);
            if (!/(^|\.)calendly\.com$/.test(u.hostname)) return;
        } catch (_) { return; }

        // Load Calendly's widget assets (CSS + JS).
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://assets.calendly.com/assets/external/widget.css';
        document.head.appendChild(css);

        var js = document.createElement('script');
        js.async = true;
        js.src = 'https://assets.calendly.com/assets/external/widget.js';
        document.head.appendChild(js);

        // Find the form wrapper on consultation.html and prepend a Calendly CTA.
        // We do NOT replace the form — visitors still get both options.
        function place() {
            var formWrap = document.querySelector('.consult-form-wrap');
            if (!formWrap) { setTimeout(place, 80); return; }
            if (formWrap.querySelector('.calendly-cta-block')) return;  // already injected

            var block = document.createElement('div');
            block.className = 'calendly-cta-block';
            block.style.cssText = 'margin-bottom:1.6rem;padding:1.4rem 1.5rem;background:rgba(164,124,72,0.1);border-left:3px solid #A47C48;';
            block.innerHTML =
                '<div style="font-family:DM Sans,sans-serif;font-size:0.65rem;letter-spacing:0.18em;text-transform:uppercase;color:#A47C48;margin-bottom:0.4rem;">Quickest Path</div>' +
                '<div style="font-family:Cormorant Garamond,Georgia,serif;font-size:1.4rem;font-weight:300;color:#FDFAF6;margin-bottom:0.5rem;">Book Your Consultation Directly</div>' +
                '<div style="font-size:0.85rem;color:rgba(216,204,188,0.7);line-height:1.5;margin-bottom:1.1rem;">Pick a 30-minute slot that works for you. No back-and-forth.</div>' +
                '<button type="button" id="calendly-open" style="background:#A47C48;color:#FDFAF6;border:none;padding:0.85rem 1.5rem;font-family:DM Sans,sans-serif;font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;cursor:pointer;">Open Calendar →</button>' +
                '<div style="font-size:0.7rem;color:rgba(216,204,188,0.4);margin-top:0.85rem;">Or fill the form below for a tailored response.</div>';
            formWrap.insertBefore(block, formWrap.firstChild);

            block.querySelector('#calendly-open').addEventListener('click', function () {
                if (window.Calendly && window.Calendly.initPopupWidget) {
                    window.Calendly.initPopupWidget({ url: url });
                } else {
                    window.open(url, '_blank', 'noopener');
                }
            });
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', place);
        } else {
            place();
        }
    }

    loadConfig().then(function (cfg) {
        injectGA4(cfg.ga4_id);
        injectMetaPixel(cfg.meta_pixel_id);
        injectCalendly(cfg.calendly_url);
    });
})();

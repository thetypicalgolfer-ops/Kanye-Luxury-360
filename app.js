/* ============================================================
   KANYE CONCIERGE 360 — ANIMATIONS & INTERACTIONS
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

// ── CUSTOM CURSOR ─────────────────────────────────────────
const cursor     = document.getElementById('cursor');
const cursorDot  = cursor?.querySelector('.cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

if (cursor) {
    let mx = 0, my = 0;
    let rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        cursorDot.style.left  = mx + 'px';
        cursorDot.style.top   = my + 'px';
    });

    // Smooth ring lag
    (function animateCursor() {
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        cursorRing.style.left = rx + 'px';
        cursorRing.style.top  = ry + 'px';
        requestAnimationFrame(animateCursor);
    })();

    // Hover state on interactive elements
    document.querySelectorAll('a, button, .property-card, .community-card, .journal-card, .lifestyle-item').forEach(el => {
        el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
    });
}

// ── NAVBAR SCROLL ─────────────────────────────────────────
const nav = document.getElementById('nav');
if (nav) {
    // Only toggle nav state on the homepage (which has a fullscreen .hero behind it).
    // On inner pages the nav always stays in its scrolled/cream state.
    const isHomepage = !!document.querySelector('.hero');
    if (isHomepage) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 60);
        }, { passive: true });
    }
}

// ── HAMBURGER MENU ────────────────────────────────────────
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('nav-mobile-menu');

if (hamburger && mobileMenu) {
    const navLogo = document.querySelector('.nav-logo');

    hamburger.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.style.color = isOpen ? 'var(--charcoal)' : '';
        document.body.style.overflow = isOpen ? 'hidden' : '';
        // Keep logo visible against the ivory menu overlay
        if (navLogo) navLogo.style.color = isOpen ? 'var(--charcoal)' : '';
    });

    // Close menu when any link is tapped
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.style.color = '';
            document.body.style.overflow = '';
            if (navLogo) navLogo.style.color = '';
        });
    });
}

// ── DISABLE CUSTOM CURSOR ON TOUCH DEVICES ────────────────
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    const cursorEl = document.getElementById('cursor');
    if (cursorEl) cursorEl.style.display = 'none';
    document.body.style.cursor = 'auto';
    document.querySelectorAll('button, a, .btn').forEach(el => {
        el.style.cursor = 'pointer';
    });
}


// ── HERO ENTRY ANIMATION ─────────────────────────────────
const tl = gsap.timeline({ delay: 0.3 });
tl.to('#hero-tag',      { opacity: 1, y: 0, duration: 1,   ease: 'power3.out' }, 0.1)
  .to('#hero-headline', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 0.3)
  .to('#hero-sub',      { opacity: 1, y: 0, duration: 1,   ease: 'power3.out' }, 0.6)
  .to('#hero-ctas',     { opacity: 1, y: 0, duration: 1,   ease: 'power3.out' }, 0.8);

// Subtle hero parallax on scroll
gsap.to('#hero-media img', {
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5
    },
    y: 120,
    ease: 'none'
});

// ── SCROLL REVEALS ────────────────────────────────────────
// Use gsap.to() — CSS .reveal pre-sets opacity:0/y:40px, so we animate TO visible.
document.querySelectorAll('.reveal').forEach(el => {
    gsap.to(el, {
        scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none'
        },
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out'
    });
});

// ── BRAND SECTION ANIMATION ("Intelligence Meets Influence") ──
const brandImg = document.getElementById('brand-image');
if (brandImg) {
    // Clip-path curtain wipe: image slides open left→right
    gsap.set(brandImg, { clipPath: 'inset(0 100% 0 0 round 0px)' });
    gsap.to(brandImg, {
        scrollTrigger: {
            trigger: '#about-preview',
            start: 'top 72%',
            toggleActions: 'play none none none'
        },
        clipPath: 'inset(0 0% 0 0 round 0px)',
        duration: 1.4,
        ease: 'power3.inOut'
    });

    // Subtle parallax on the image inside as the section scrolls
    gsap.to('#brand-image img', {
        scrollTrigger: {
            trigger: '#about-preview',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
        },
        y: 60,
        ease: 'none'
    });
}

// Staggered lift-reveal for the brand copy text
const brandCopy = document.querySelector('.brand-copy');
if (brandCopy) {
    const copyEls = brandCopy.querySelectorAll('.section-eyebrow, .section-headline, .section-sub, .btn');
    gsap.set(copyEls, { opacity: 0, y: 50 });
    gsap.to(copyEls, {
        scrollTrigger: {
            trigger: '#about-preview',
            start: 'top 68%',
            toggleActions: 'play none none none'
        },
        opacity: 1,
        y: 0,
        duration: 1.0,
        stagger: 0.15,
        ease: 'power3.out'
    });
}

// ── STATS COUNT-UP ANIMATION ──────────────────────────────
const brandStats = document.getElementById('brand-stats');
if (brandStats) {
    // Start stats block invisible
    gsap.set(brandStats, { opacity: 0, y: 30 });

    // Animate the whole stats block in after the copy
    const statsTrigger = ScrollTrigger.create({
        trigger: brandStats,
        start: 'top 82%',
        onEnter: () => {
            // Fade the stats container in
            gsap.to(brandStats, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });

            // Count-up each stat number
            brandStats.querySelectorAll('.stat-num[data-target]').forEach((el, i) => {
                const target   = parseFloat(el.dataset.target);
                const prefix   = el.dataset.prefix  || '';
                const suffix   = el.dataset.suffix  || '';
                const decimals = el.dataset.decimal ? parseInt(el.dataset.decimal) : 0;
                const obj      = { val: 0 };

                gsap.to(obj, {
                    val: target,
                    duration: 2.2,
                    delay: i * 0.18,
                    ease: 'power2.out',
                    onUpdate() {
                        const display = decimals
                            ? obj.val.toFixed(decimals)
                            : Math.round(obj.val);
                        el.textContent = prefix + display + suffix;
                    },
                    onComplete() {
                        // Snap to exact final value
                        el.textContent = prefix + (decimals ? target.toFixed(decimals) : target) + suffix;
                    }
                });
            });
        },
        once: true  // Only fire once — no re-count on scroll back
    });
}

// ── SERVICES TABS ─────────────────────────────────────────
const tabs   = document.querySelectorAll('.service-tab');
const panels = document.querySelectorAll('.service-panel');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) {
            target.classList.add('active');
            gsap.fromTo(
                target.querySelectorAll('.section-headline, p, ul, a, .service-panel-img'),
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
            );
        }
    });
});
// ── FORM SUBMIT ───────────────────────────────────────────
const form = document.querySelector('.lead-form');
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        const btn = form.querySelector('.form-submit');
        btn.textContent = "Message Received — We'll be in touch.";
        btn.style.background = 'var(--sage)';
        btn.disabled = true;
    });
}

// ── CONTACT FORM AUTO-SELECT ──────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const intentParam = urlParams.get('intent');
const intentSelect = document.getElementById('c-intent');
const contactHeadline = document.querySelector('.contact-page .section-headline');
const contactEyebrow = document.querySelector('.contact-page .section-eyebrow');

if (intentSelect && intentParam) {
    if (intentParam === 'buy') {
        intentSelect.value = 'Purchase a property';
        if (contactHeadline) contactHeadline.innerHTML = "Find Your Next<br><em>Masterpiece</em>";
        if (contactEyebrow) contactEyebrow.textContent = "Buyer Representation";
    } else if (intentParam === 'sell') {
        intentSelect.value = 'Sell my property';
        if (contactHeadline) contactHeadline.innerHTML = "Request Your<br><em>Property Valuation</em>";
        if (contactEyebrow) contactEyebrow.textContent = "Seller Representation";
    }
}

// ── RANDOMIZE RELATED ARTICLES ────────────────────────────
const relatedGrid = document.querySelector('.related-grid');
if (relatedGrid && window.location.pathname.includes('article-')) {
    const articlesData = [
        { url: 'article-1.html', img: 'img-journal-1.png', alt: 'Hill Country Land', cat: 'Market Insight', title: 'Why Texas Hill Country Land Values Are on a Generational Climb', date: 'March 12, 2026' },
        { url: 'article-2.html', img: 'img-journal-2.png', alt: 'Boerne', cat: 'Neighborhood Guide', title: 'Boerne: The Quiet Capital of Texas Luxury Ranching', date: 'February 28, 2026' },
        { url: 'article-3.html', img: 'img-brand.png', alt: 'Architecture', cat: 'Architecture', title: 'Limestone &amp; Steel: The Material Language of Modern Texas Homes', date: 'February 14, 2026' },
        { url: 'article-4.html', img: 'img-texas-countryside.png', alt: 'Investment', cat: 'Investment', title: 'Acreage as a Premium Asset: What Buyers Need to Know in 2026', date: 'January 30, 2026' },
        { url: 'article-5.html', img: 'img-sellers.png', alt: 'Selling Strategy', cat: 'Selling Strategy', title: 'The Case for Off-Market: When Privacy Serves the Seller', date: 'January 15, 2026' },
        { url: 'article-6.html', img: 'img-dominion.png', alt: 'Community Spotlight', cat: 'Community Spotlight', title: 'The Dominion: Inside San Antonio\'s Most Coveted Gated Community', date: 'January 5, 2026' }
    ];

    // Filter out the current article
    const currentPath = window.location.pathname.split('/').pop();
    const availableArticles = articlesData.filter(a => a.url !== currentPath);

    // Shuffle and pick 3
    const shuffled = availableArticles.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    // Render
    relatedGrid.innerHTML = '';
    selected.forEach(art => {
        const a = document.createElement('a');
        a.href = art.url;
        a.className = 'journal-card reveal';
        a.style.display = 'block';
        a.style.textDecoration = 'none';
        a.innerHTML = `
            <div class="jc-img"><img src="${art.img}" alt="${art.alt}"></div>
            <div class="jc-cat">${art.cat}</div>
            <h3 class="jc-title">${art.title}</h3>
            <div class="jc-date">${art.date}</div>
        `;
        
        // Re-attach cursor hover logic inside dynamically created element
        a.addEventListener('mouseenter', () => document.getElementById('cursor-ring')?.classList.add('hover'));
        a.addEventListener('mouseleave', () => document.getElementById('cursor-ring')?.classList.remove('hover'));
        
        relatedGrid.appendChild(a);

        // Re-attach GSAP reveal for dynamic elements
        if (typeof gsap !== 'undefined') {
            gsap.to(a, {
                scrollTrigger: {
                    trigger: a,
                    start: 'top 88%',
                    toggleActions: 'play none none none'
                },
                opacity: 1,
                y: 0,
                duration: 1.1,
                ease: 'power3.out'
            });
        }
    });
}

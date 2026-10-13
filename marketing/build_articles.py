#!/usr/bin/env python3
"""Builds the local San Antonio articles from marketing/articles/*.json into /<slug>.html.

Each JSON file: slug, title, seo_title, description, keywords, category, date (YYYY-MM-DD),
read_min, hero, hero_alt, intro (list of paragraphs), sections (list of {h2, paras?, items?}),
faq (list of {q, a}), sources (list of {name, url}), cta_intent ("Buying"|"Selling"|...), related (slugs).

"items" are rendered one fact per line ("Label: value"), never buried in a paragraph.
Run: python3 marketing/build_articles.py
"""
import html
import json
import pathlib
import re
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "marketing" / "articles"
SITE = "https://kanyeconcierge360.com"
TEMPLATE = (ROOT / "article-12.html").read_text()
HEAD_END = TEMPLATE.index("<body>")
NAV = TEMPLATE[TEMPLATE.index("<body>"):TEMPLATE.index('<div class="article-hero">')]
FOOTER = TEMPLATE[TEMPLATE.index("<footer>"):]

e = html.escape


def pretty_date(d: str) -> str:
    y, m, dd = map(int, d.split("-"))
    return date(y, m, dd).strftime("%B %-d, %Y")


def item_html(it: str) -> str:
    m = re.match(r"^([^:]{2,40}):\s+(.+)$", it)
    if m:
        return f"<li><strong>{e(m.group(1))}:</strong> {m.group(2)}</li>"
    return f"<li>{it}</li>"


def lead_form(intent: str) -> str:
    opts = ["Buying", "Selling", "Buying and selling", "Just exploring"]
    if intent in opts:
        opts.remove(intent)
        opts.insert(0, intent)
    budgets = ["Under $250K", "$250K–$400K", "$400K–$700K", "$700K–$1M", "$1M+", "Not sure yet"]
    return f"""<div class="article-cta-inline quick-lead">
            <h3>Talk to Kanye about your {e('home sale' if intent == 'Selling' else 'home search')}</h3>
            <p>Tell us what you need. Kanye reaches out personally within 24 hours. No pressure, no obligation.</p>
            <form class="quick-lead-form" novalidate>
                <input name="name" type="text" placeholder="Your name" autocomplete="name" aria-label="Your name">
                <input name="contact" type="text" placeholder="Phone or email" autocomplete="tel" aria-label="Phone or email">
                <select name="intent" aria-label="Buying or selling">{''.join(f'<option>{e(o)}</option>' for o in opts)}</select>
                <select name="budget" aria-label="Price range"><option value="">Price range</option>{''.join(f'<option>{e(b)}</option>' for b in budgets)}</select>
                <input type="text" name="website" tabindex="-1" autocomplete="off" class="qlf-hp" aria-hidden="true">
                <button type="submit" class="btn btn-dark">Send</button>
                <p class="qlf-note" aria-live="polite"></p>
            </form>
            <p class="qlf-call">Or call or text <a href="tel:+18306996542">830-699-6542</a></p>
        </div>"""


def build(a: dict, all_articles: dict) -> str:
    url = f"{SITE}/{a['slug']}.html"
    title = a["title"]
    seo_title = a.get("seo_title") or f"{title} | Kanye Concierge 360"
    schema = [
        {
            "@context": "https://schema.org", "@type": "Article", "headline": title,
            "description": a["description"], "image": f"{SITE}/{a['hero']}",
            "datePublished": a["date"], "dateModified": a.get("modified", a["date"]),
            "author": {"@type": "Organization", "name": "Kanye Concierge 360", "url": SITE},
            "publisher": {"@type": "Organization", "name": "Kanye Concierge 360", "url": SITE},
            "mainEntityOfPage": url, "about": {"@type": "City", "name": "San Antonio, Texas"},
        },
        {
            "@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
                {"@type": "ListItem", "position": 2, "name": "Journal", "item": f"{SITE}/journal.html"},
                {"@type": "ListItem", "position": 3, "name": title, "item": url},
            ],
        },
    ]
    if a.get("faq"):
        schema.append({
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", f["a"])}} for f in a["faq"]],
        })

    head = TEMPLATE[:HEAD_END]
    head = re.sub(r"<title>.*?</title>", f"<title>{e(seo_title)}</title>", head, flags=re.S)
    head = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(a["description"])}">', head)
    head = re.sub(r'<meta name="keywords" content="[^"]*">', f'<meta name="keywords" content="{e(", ".join(a["keywords"]))}">', head)
    head = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', head)
    head = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{e(title)}">', head)
    head = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{e(a["description"])}">', head)
    head = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', head)
    head = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{SITE}/{a["hero"]}">', head)
    head = re.sub(r'<script type="application/ld\+json">.*?</script>',
                  "\n    ".join(f'<script type="application/ld+json">{json.dumps(s, ensure_ascii=False)}</script>' for s in schema),
                  head, count=1, flags=re.S)
    head = head.replace("</head>", '    <meta name="robots" content="index, follow, max-image-preview:large">\n</head>')

    body = [f"<p>{p}</p>" for p in a["intro"]]
    for i, s in enumerate(a["sections"]):
        body.append(f"<h2>{e(s['h2'])}</h2>")
        for p in s.get("paras", []):
            body.append(f"<p>{p}</p>")
        if s.get("items"):
            body.append('<ul class="fact-list">' + "".join(item_html(it) for it in s["items"]) + "</ul>")
        for p in s.get("after", []):
            body.append(f"<p>{p}</p>")
        if i == len(a["sections"]) // 2 - 1:
            body.append(lead_form(a.get("cta_intent", "Buying")))
    if a.get("faq"):
        body.append("<h2>Questions people ask</h2>")
        for f in a["faq"]:
            body.append(f'<h3 class="faq-q">{e(f["q"])}</h3><p>{f["a"]}</p>')
    body.append(lead_form(a.get("cta_intent", "Buying")))
    if a.get("sources"):
        body.append('<p class="article-sources"><strong>Sources:</strong> ' + " · ".join(
            f'<a href="{e(s["url"])}" target="_blank" rel="noopener nofollow">{e(s["name"])}</a>' for s in a["sources"]) +
            ". Figures change; we update this page as new data is released.</p>")

    related = "".join(
        f'<a href="{r}.html" class="journal-card reveal" style="display:block;text-decoration:none;"><div class="jc-img"><img src="{all_articles[r]["hero"]}" alt="{e(all_articles[r]["category"])}" loading="lazy"></div><div class="jc-cat">{e(all_articles[r]["category"])}</div><h3 class="jc-title">{e(all_articles[r]["title"])}</h3><div class="jc-date">{pretty_date(all_articles[r]["date"])}</div></a>'
        for r in a.get("related", []) if r in all_articles
    )

    return f"""{head}{NAV}<div class="article-hero">
    <img src="{a['hero']}" alt="{e(a['hero_alt'])}">
    <div class="article-hero-overlay"></div>
    <div class="article-hero-content">
        <div class="article-meta"><span>{e(a['category'])}</span><span>·</span><span>{pretty_date(a['date'])}</span><span>·</span><span>{a['read_min']} min read</span></div>
        <h1 class="article-title">{e(title)}</h1>
    </div>
</div>
<div class="article-body">
    <div class="article-content">
        {chr(10).join('        ' + b for b in body).strip()}
    </div>
    <aside class="article-sidebar">
        <div class="sidebar-card">
            <div class="sidebar-label">Written By</div>
            <div class="sidebar-agent"><img src="img-agent.png?v=2" alt="Kanye Concierge 360 Agent" style="object-position:center top;">
                <div><div class="sidebar-agent-name">Kanye Concierge 360</div><div class="sidebar-agent-title">Licensed REALTOR® · Greater San Antonio</div></div></div>
            <p style="font-size:0.82rem;color:var(--sage);line-height:1.65;font-weight:300;">Straight talk for buyers and sellers at every price point across Greater San Antonio and the Texas Hill Country.</p>
        </div>
        <div class="sidebar-card">
            <div class="sidebar-label">Call or Text</div>
            <a href="tel:+18306996542" class="btn btn-dark btn-arrow" style="width:100%;justify-content:center;">830-699-6542</a>
        </div>
        <div class="sidebar-card">
            <div class="sidebar-label">Explore Listings</div>
            <a href="properties.html" class="btn btn-dark btn-arrow" style="width:100%;justify-content:center;">View Properties</a>
        </div>
    </aside>
</div>
<section class="related-articles"><div class="max-w"><span class="section-eyebrow reveal">Continue Reading</span><h2 class="section-headline reveal" style="font-size:clamp(1.8rem,2.5vw,2.8rem);">Related <em>Insights</em></h2><div class="related-grid">{related}</div></div></section>

{FOOTER}"""


# Older hand-built articles that new pages can link to as related reading.
LEGACY = {
    "article-6": {"title": "The Dominion San Antonio: Inside Texas's Most Coveted Gated Community 2026", "hero": "img-dominion.png", "category": "Community Guide", "date": "2026-01-05"},
    "article-8": {"title": "Living in Stone Oak, San Antonio: The 2026 Insider's Guide for Luxury Homebuyers", "hero": "img-stone-oak.png", "category": "Community Guide", "date": "2026-04-18"},
    "article-12": {"title": "Selling in San Antonio? 10 Mistakes That Scare Off Luxury Buyers", "hero": "img-fredericksburg.png", "category": "Seller Advisory", "date": "2026-07-20"},
}


def main():
    arts = dict(LEGACY)
    for p in sorted(SRC.glob("*.json")):
        a = json.loads(p.read_text())
        arts[a["slug"]] = a
    for slug, a in arts.items():
        if slug in LEGACY:
            continue
        (ROOT / f"{a['slug']}.html").write_text(build(a, arts))
        print("built", a["slug"])


if __name__ == "__main__":
    main()

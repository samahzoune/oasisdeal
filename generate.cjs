// OasisDeal static generator: builds individual deal pages + sitemap + robots.
// Run:  node generate.js   (re-run whenever data/deals.json changes)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://oasisdeal.com';
const { deals } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'deals.json'), 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function dealPage(d) {
  const url = `${SITE}/deals/${d.slug}`;
  const related = deals.filter(x => x.cat === d.cat && x.slug !== d.slug).slice(0, 3);
  const metaDesc = `${d.title} — now $${d.now} (was $${d.was}), ${d.off} off at ${d.store}. ${d.code ? 'Use code ' + d.code + '. ' : ''}Verified deal on OasisDeal.`;

  const jsonld = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": d.title,
    "description": d.description,
    "category": d.cat,
    "offers": {
      "@type": "Offer",
      "priceCurrency": d.currency || "USD",
      "price": d.now,
      "availability": "https://schema.org/InStock",
      "url": url,
      "seller": { "@type": "Organization", "name": d.store }
    }
  };
  const breadcrumb = {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/" },
      { "@type": "ListItem", "position": 2, "name": d.cat, "item": `${SITE}/#deals` },
      { "@type": "ListItem", "position": 3, "name": d.title, "item": url }
    ]
  };

  const relatedHtml = related.map(r => `
        <a class="rel-card" href="${r.slug}.html">
          <div class="rel-thumb">${r.emoji}</div>
          <div class="rel-info"><div class="rel-title">${esc(r.title)}</div>
          <div class="rel-price">$${r.now} <s>$${r.was}</s></div></div>
        </a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(d.title)} — ${d.off} off at ${esc(d.store)} | OasisDeal</title>
<meta name="description" content="${esc(metaDesc)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="${esc(d.title)} — ${d.off} off" />
<meta property="og:description" content="${esc(metaDesc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="OasisDeal" />
<meta property="og:image" content="${SITE}/favicon.svg" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${esc(d.title)} — ${d.off} off" />
<meta name="twitter:description" content="${esc(metaDesc)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../assets/page.css" />
<link rel="icon" type="image/svg+xml" href="../favicon.svg" />
<link rel="apple-touch-icon" href="../favicon.svg" />
<style>
  .crumb { font-size: 13px; color: var(--muted); margin-bottom: 22px; }
  .crumb a { color: var(--muted); } .crumb a:hover { color: var(--brand); }
  .deal { display: grid; grid-template-columns: 300px 1fr; gap: 30px; align-items: start; }
  @media (max-width: 680px){ .deal { grid-template-columns: 1fr; } }
  .deal-thumb { aspect-ratio: 1; border-radius: 18px; background: linear-gradient(135deg,#1b2848,#243152); display: grid; place-items: center; font-size: 96px; position: relative; }
  .deal-thumb .off { position: absolute; top: 14px; right: 14px; background: #fb7185; color: #fff; font-weight: 800; font-size: 14px; padding: 6px 13px; border-radius: 999px; }
  .deal-thumb .store { position: absolute; top: 14px; left: 14px; background: rgba(0,0,0,.45); color: #fff; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 999px; }
  .deal h1 { font-size: clamp(26px,4vw,36px); line-height: 1.15; margin-bottom: 6px; }
  .deal .catlabel { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--brand); margin-bottom: 10px; }
  .deal .prices { display: flex; align-items: baseline; gap: 12px; margin: 16px 0; }
  .deal .now { font-size: 34px; font-weight: 800; }
  .deal .was { font-size: 18px; color: var(--muted); text-decoration: line-through; }
  .deal .save { font-size: 13px; font-weight: 700; color: var(--brand); background: rgba(45,212,191,.1); padding: 4px 10px; border-radius: 999px; }
  .coupon { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px dashed var(--brand); border-radius: 12px; padding: 12px 12px 12px 16px; background: rgba(45,212,191,.07); max-width: 340px; margin: 18px 0; }
  .coupon code { font-weight: 800; letter-spacing: .04em; font-size: 16px; }
  .coupon button { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; background: var(--brand); color: #04121a; }
  .coupon button.copied { background: #fbbf24; }
  .getdeal { display: inline-block; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 16px; background: linear-gradient(135deg,#38bdf8,#2dd4bf); color: #04121a; }
  .getdeal:hover { filter: brightness(1.08); text-decoration: none; }
  .desc { margin-top: 40px; max-width: 720px; }
  .steps { margin: 14px 0 0 20px; } .steps li { margin-bottom: 8px; }
  .rel-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 16px; }
  @media (max-width: 680px){ .rel-grid { grid-template-columns: 1fr; } }
  .rel-card { display: flex; gap: 12px; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
  .rel-card:hover { border-color: var(--brand); text-decoration: none; }
  .rel-thumb { width: 54px; height: 54px; border-radius: 10px; background: linear-gradient(135deg,#1b2848,#243152); display: grid; place-items: center; font-size: 26px; flex: none; }
  .rel-title { font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.25; }
  .rel-price { font-size: 13px; color: var(--brand); margin-top: 3px; } .rel-price s { color: var(--muted); }
</style>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
</head>
<body>
<header>
  <nav class="nav">
    <a class="logo" href="../index.html"><img class="mark" src="../favicon.svg" alt="OasisDeal logo" width="34" height="34" />Oasis<span>Deal</span></a>
    <a class="back" href="../index.html#deals">← All deals</a>
  </nav>
</header>

<main class="wrap page">
  <div class="crumb"><a href="../index.html">Home</a> &nbsp;/&nbsp; <a href="../index.html#deals">${esc(d.cat)}</a> &nbsp;/&nbsp; ${esc(d.title)}</div>

  <article class="deal">
    <div class="deal-thumb"><span class="store">${esc(d.store)}</span><span class="off">-${d.off}</span>${d.emoji}</div>
    <div>
      <div class="catlabel">${esc(d.cat)}</div>
      <h1>${esc(d.title)}</h1>
      <div class="prices"><span class="now">$${d.now}</span><span class="was">$${d.was}</span><span class="save">Save ${d.off}</span></div>
      ${d.code ? `<div class="coupon"><code id="code">${esc(d.code)}</code><button id="copy" data-code="${esc(d.code)}">Copy code</button></div>` : ''}
      <a class="getdeal" href="${esc(d.url)}" target="_blank" rel="nofollow sponsored noopener">Get this deal →</a>
    </div>
  </article>

  <section class="desc">
    <h2>About this deal</h2>
    <p>${esc(d.description)}</p>
    <h2>How to use this ${d.code ? 'code' : 'deal'}</h2>
    <ol class="steps">
      <li>Click <strong>“Get this deal”</strong> to open ${esc(d.store)}.</li>
      ${d.code ? `<li>Add the item to your cart and head to checkout.</li><li>Paste the code <strong>${esc(d.code)}</strong> in the promo/coupon field and apply it.</li><li>Confirm the ${d.off} discount shows before you pay.</li>` : `<li>The discount is applied automatically at ${esc(d.store)} — no code needed.</li>`}
    </ol>
    <p style="color:var(--muted); font-size:13px; margin-top:18px;">Prices and availability are accurate as of the time of posting and may change. OasisDeal may earn a commission on purchases made through links on this page, at no extra cost to you.</p>
  </section>

  ${related.length ? `<section class="desc"><h2>More ${esc(d.cat)} deals</h2><div class="rel-grid">${relatedHtml}</div></section>` : ''}
</main>

<footer>
  <div class="foot">
    <div>© <span id="year"></span> OasisDeal — find your savings oasis.</div>
    <div class="links">
      <a href="../about.html">About</a>
      <a href="../contact.html">Contact</a>
      <a href="../privacy.html">Privacy</a>
      <a href="../index.html#deals">Deals</a>
    </div>
  </div>
</footer>
<script>
  document.getElementById('year').textContent = new Date().getFullYear();
  var c = document.getElementById('copy');
  if (c) c.addEventListener('click', function(){
    navigator.clipboard && navigator.clipboard.writeText(c.dataset.code);
    c.textContent = 'Copied!'; c.classList.add('copied');
    setTimeout(function(){ c.textContent = 'Copy code'; c.classList.remove('copied'); }, 1500);
  });
</script>
</body>
</html>
`;
}

// Build deal pages
const dealsDir = path.join(ROOT, 'deals');
fs.mkdirSync(dealsDir, { recursive: true });
deals.forEach(d => {
  fs.writeFileSync(path.join(dealsDir, `${d.slug}.html`), dealPage(d));
});

// Sitemap
const staticUrls = ['/', '/about', '/contact', '/privacy'];
const urls = [
  ...staticUrls.map(u => ({ loc: SITE + u, pri: u === '/' ? '1.0' : '0.5' })),
  ...deals.map(d => ({ loc: `${SITE}/deals/${d.slug}`, pri: '0.8' }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><changefreq>daily</changefreq><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

// robots.txt
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Generated ${deals.length} deal pages, sitemap.xml (${urls.length} urls), robots.txt`);

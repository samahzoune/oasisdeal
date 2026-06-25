// Generates AliExpress affiliate links for every deal's source URL and writes
// them into data/deals.json as `affiliateUrl`. The original `url` stays as the
// stable source so this is idempotent and re-runnable.
//
// Run with credentials in env (never hard-coded / committed):
//   ALI_KEY=... ALI_SECRET=... ALI_TRACK=oasisdeal node gen-affiliate-links.cjs
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const APP_KEY = process.env.ALI_KEY;
const APP_SECRET = process.env.ALI_SECRET;
const TRACKING = process.env.ALI_TRACK || 'oasisdeal';
if (!APP_KEY || !APP_SECRET) { console.error('Set ALI_KEY and ALI_SECRET env vars.'); process.exit(1); }

const dealsPath = path.join(__dirname, 'data', 'deals.json');
const db = JSON.parse(fs.readFileSync(dealsPath, 'utf8'));

function signSHA256(params, secret) {
  const base = Object.keys(params).sort().map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex').toUpperCase();
}
function post(form) {
  const body = new URLSearchParams(form).toString();
  return new Promise((resolve, reject) => {
    const req = https.request({ host: 'api-sg.aliexpress.com', path: '/sync', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); });
    req.on('error', reject); req.write(body); req.end();
  });
}
async function generate(sourceUrls) {
  const params = {
    app_key: APP_KEY, method: 'aliexpress.affiliate.link.generate', sign_method: 'sha256',
    timestamp: String(Date.now()), promotion_link_type: '0',
    source_values: sourceUrls.join(','), tracking_id: TRACKING,
  };
  params.sign = signSHA256(params, APP_SECRET);
  const raw = await post(params);
  const j = JSON.parse(raw);
  const r = j.aliexpress_affiliate_link_generate_response;
  if (!r || r.resp_result.resp_code !== 200) throw new Error('API: ' + raw.slice(0, 300));
  const links = r.resp_result.result.promotion_links.promotion_link || [];
  const map = {};
  links.forEach(l => { map[l.source_value] = l.promotion_link; });
  return map;
}

(async () => {
  const sources = db.deals.map(d => d.url);
  const map = await generate(sources);
  let ok = 0;
  db.deals.forEach(d => { if (map[d.url]) { d.affiliateUrl = map[d.url]; ok++; } });
  fs.writeFileSync(dealsPath, JSON.stringify(db, null, 2) + '\n');
  console.log(`Generated ${ok}/${db.deals.length} affiliate links (tracking: ${TRACKING}).`);
})();

// Enriches each deal in data/deals.json with a REAL AliExpress product:
// image, live price, discount, and a product-specific affiliate link.
// Keeps our curated title/description/FAQs; swaps in real image + price + link.
//
//   ALI_KEY=... ALI_SECRET=... ALI_TRACK=oasisdeal node fetch-products.cjs
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const APP_KEY = process.env.ALI_KEY, APP_SECRET = process.env.ALI_SECRET, TRACKING = process.env.ALI_TRACK || 'oasisdeal';
if (!APP_KEY || !APP_SECRET) { console.error('Set ALI_KEY and ALI_SECRET.'); process.exit(1); }

const QUERY = {
  'soundcore-p30i-anc-earbuds': 'soundcore p30i anker earbuds',
  'qcy-t13-wireless-earbuds': 'qcy t13 wireless earbuds',
  'smart-watch-bluetooth-call-fitness': 'smart watch bluetooth call fitness',
  'levitating-led-world-map-lamp': 'levitating moon lamp floating',
  'mini-aroma-diffuser-180ml': 'essential oil diffuser humidifier ultrasonic',
  'matter-smart-plug-energy-monitor': 'tuya smart plug wifi socket',
  'led-facial-beauty-mask-7-color': 'led face mask light therapy',
  'heatless-curling-rod-set': 'heatless curling rod set',
  'magnetic-wireless-power-bank-10000mah': 'magnetic wireless power bank 10000mah magsafe',
  '3-in-1-wireless-charging-station': '3 in 1 wireless charger station',
  '4k-wifi-mini-security-camera': 'mini wifi security camera',
  'ultrasonic-glasses-jewelry-cleaner': 'ultrasonic cleaner glasses jewelry',
  'portable-mini-thermal-printer': 'mini thermal printer bluetooth',
  'rgb-led-strip-lights-10m': 'led strip lights rgb wifi',
};
const BAD = /\b(case|cover|protector|sticker|skin|strap|freshener|refill|meter|clamp|module|lanyard)\b|\d+\s?pcs|\bpack\b/i;

function sign(p, s){ return crypto.createHmac('sha256', s).update(Object.keys(p).sort().map(k=>k+p[k]).join(''),'utf8').digest('hex').toUpperCase(); }
function post(form){ const body=new URLSearchParams(form).toString(); return new Promise((res,rej)=>{const r=https.request({host:'api-sg.aliexpress.com',path:'/sync',method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(body)}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res(d));});r.on('error',rej);r.write(body);r.end();}); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function query(keywords){
  const p={ app_key:APP_KEY, method:'aliexpress.affiliate.product.query', sign_method:'sha256', timestamp:String(Date.now()),
    keywords, page_size:'20', page_no:'1', target_currency:'USD', target_language:'EN', tracking_id:TRACKING, ship_to_country:'US', sort:'LAST_VOLUME_DESC' };
  p.sign=sign(p,APP_SECRET);
  const raw=await post(p);
  const r=JSON.parse(raw).aliexpress_affiliate_product_query_response;
  if(!r||r.resp_result.resp_code!==200) throw new Error(raw.slice(0,200));
  return (r.resp_result.result.products && r.resp_result.result.products.product) || [];
}

function pick(prods, targetNow){
  const clean = prods.filter(p => p.product_main_image_url && p.promotion_link && p.target_sale_price && !BAD.test(p.product_title||''));
  const pool = clean.length ? clean : prods.filter(p => p.product_main_image_url && p.promotion_link && p.target_sale_price);
  if(!pool.length) return null;
  // prefer products whose price is in a sensible band around our curated price
  const inBand = pool.filter(p => { const s=parseFloat(p.target_sale_price); return s >= targetNow*0.35 && s <= targetNow*2.8; });
  const cands = inBand.length ? inBand : pool;
  cands.sort((a,b)=> (parseInt(b.lastest_volume||0)) - (parseInt(a.lastest_volume||0)));
  return cands[0];
}

(async () => {
  const dealsPath = path.join(__dirname, 'data', 'deals.json');
  const db = JSON.parse(fs.readFileSync(dealsPath, 'utf8'));
  for (const d of db.deals) {
    const kw = QUERY[d.slug] || d.title;
    try {
      const prods = await query(kw);
      const best = pick(prods, d.now);
      if (best) {
        const sale = Math.round(parseFloat(best.target_sale_price));
        let orig = Math.round(parseFloat(best.target_original_price || 0));
        if (!orig || orig <= sale) orig = Math.round(sale / (1 - (parseInt(best.discount)||40)/100));
        d.image = best.product_main_image_url.replace(/^http:/, 'https:');
        d.now = sale; d.was = orig;
        d.off = Math.max(1, Math.round((1 - sale/orig) * 100)) + '%';
        d.affiliateUrl = best.promotion_link;
        console.log(`✓ ${d.slug}: $${sale} (was $${orig}) — ${(best.product_title||'').slice(0,48)}`);
      } else {
        console.log(`✗ ${d.slug}: no product found for "${kw}"`);
      }
    } catch (e) { console.log(`✗ ${d.slug}: ${e.message}`); }
    await sleep(250);
  }
  fs.writeFileSync(dealsPath, JSON.stringify(db, null, 2) + '\n');
  console.log('Saved data/deals.json');
})();

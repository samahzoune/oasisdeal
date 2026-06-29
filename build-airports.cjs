/* Airport-comparison pages (link magnets) in EN/FR/Darija. Each compares 2–3 Moroccan
   departure airports to a destination/region with LIVE "from" fares (fares proxy),
   a verdict, FAQ + FAQPage schema, hreflang. Output: /airports/<slug> etc.
   Run: node build-airports.cjs */
const fs = require('fs'); const path = require('path'); const ROOT = __dirname;
const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#E8A33D"/><path d="M16 22c0-7 3-10 8-11-1 6-3 9-8 11z" fill="#241F5E"/><path d="M16 22c0-7-3-10-8-11 1 6 3 9 8 11z" fill="#4B3FCB"/><rect x="14.6" y="20" width="2.8" height="5" rx="1" fill="#241F5E"/></svg>';

// Moroccan airports: code + name per lang + (optional) route-page slug for CMN routes.
const AP = {
  CMN:{en:'Casablanca',fr:'Casablanca',ar:'الدار البيضاء'},
  TNG:{en:'Tangier',fr:'Tanger',ar:'طنجة'},
  RAK:{en:'Marrakesh',fr:'Marrakech',ar:'مراكش'},
  NDR:{en:'Nador',fr:'Nador',ar:'الناظور'},
  RBA:{en:'Rabat',fr:'Rabat',ar:'الرباط'},
};
// destinations used as the comparison target
const DST = {
  PAR:{en:'Europe',fr:'l’Europe',ar:'أوروبا', city:{en:'Paris',fr:'Paris',ar:'باريس'}},
  MAD:{en:'Spain',fr:'l’Espagne',ar:'إسبانيا', city:{en:'Madrid',fr:'Madrid',ar:'مدريد'}},
  JED:{en:'Umrah (Jeddah)',fr:'la Omra (Djeddah)',ar:'العمرة (جدة)', city:{en:'Jeddah',fr:'Djeddah',ar:'جدة'}},
};
// comparisons
const CMP = [
  { slug:'casablanca-vs-tangier-flights-europe', kind:'vs', aps:['CMN','TNG'], dst:'PAR' },
  { slug:'casablanca-vs-marrakech-flights-europe', kind:'vs', aps:['CMN','RAK'], dst:'PAR' },
  { slug:'tangier-vs-nador-flights-spain', kind:'vs', aps:['TNG','NDR'], dst:'MAD' },
  { slug:'casablanca-vs-rabat-flights-europe', kind:'vs', aps:['CMN','RBA'], dst:'PAR' },
  { slug:'cheapest-airport-umrah-morocco', kind:'cheapest', aps:['CMN','RAK','TNG'], dst:'JED' },
];

const L = {
  en:{dir:'ltr',lang:'en',home:'/',hotels:'/hotels',esim:'/esim',comp:'/compensation',nav:{flights:'Flights',hotels:'Hotels',esim:'eSIM',comp:'Compensation'},
      from:'from',to:'to',cheapest:'Cheapest',search:'Search this route →',verdictH:'Which airport should you choose?',faqH:'FAQ',
      note:'Live starting fares from our partners; prices change daily and the final price is set by the airline. We may earn a commission at no extra cost to you.',secure:'Secure & free to use · No booking fees'},
  fr:{dir:'ltr',lang:'fr',home:'/fr/',hotels:'/hotels',esim:'/esim',comp:'/compensation',nav:{flights:'Vols',hotels:'Hôtels',esim:'eSIM',comp:'Indemnisation'},
      from:'à partir de',to:'vers',cheapest:'Le moins cher',search:'Chercher ce vol →',verdictH:'Quel aéroport choisir ?',faqH:'FAQ',
      note:'Tarifs de départ en direct via nos partenaires ; les prix changent chaque jour et le prix final est fixé par la compagnie. Nous pouvons percevoir une commission sans surcoût pour vous.',secure:'Sécurisé et gratuit · Sans frais'},
  ar:{dir:'rtl',lang:'ar',home:'/ar/',hotels:'/hotels',esim:'/esim',comp:'/compensation',nav:{flights:'رحلات',hotels:'فنادق',esim:'eSIM',comp:'تعويضات'},
      from:'ابتداءً من',to:'إلى',cheapest:'الأرخص',search:'ابحث عن هذه الرحلة →',verdictH:'أيّ مطار ينبغي أن تختار؟',faqH:'أسئلة شائعة',
      note:'أسعار البداية مباشرة من شركائنا؛ تتغيّر يوميًا والسعر النهائي تحدّده شركة الطيران. قد نتقاضى عمولة دون أي زيادة عليك.',secure:'آمن ومجاني · دون رسوم'},
};

function apN(code,lang){ return AP[code][lang]; }
function dstN(c,lang){ return DST[c][lang]; }

function pageTitle(cmp,lang){
  var d=dstN(cmp.dst,lang);
  if(cmp.kind==='vs'){
    var a=apN(cmp.aps[0],lang), b=apN(cmp.aps[1],lang);
    if(lang==='en') return a+' vs '+b+': cheapest airport to fly to '+d+'? | OasisDeal';
    if(lang==='fr') return a+' ou '+b+' : quel aéroport le moins cher vers '+d+' ? | OasisDeal';
    return a+' أم '+b+': ما أرخص مطار للطيران إلى '+d+'؟ | OasisDeal';
  } else {
    if(lang==='en') return 'Cheapest airport for '+d+' from Morocco | OasisDeal';
    if(lang==='fr') return 'Aéroport le moins cher pour '+d+' au départ du Maroc | OasisDeal';
    return 'أرخص مطار إلى '+d+' من المغرب | OasisDeal';
  }
}
function pageH1(cmp,lang){
  var d=dstN(cmp.dst,lang);
  if(cmp.kind==='vs'){
    var a=apN(cmp.aps[0],lang), b=apN(cmp.aps[1],lang);
    if(lang==='en') return a+' vs '+b+': cheapest flights to '+d;
    if(lang==='fr') return a+' ou '+b+' : vols les moins chers vers '+d;
    return a+' أم '+b+': أرخص رحلات إلى '+d;
  } else {
    if(lang==='en') return 'Cheapest airport for '+d+' from Morocco';
    if(lang==='fr') return 'Aéroport le moins cher pour '+d+' depuis le Maroc';
    return 'أرخص مطار إلى '+d+' من المغرب';
  }
}
function metaDesc(cmp,lang){
  var d=dstN(cmp.dst,lang), city=DST[cmp.dst].city[lang], names=cmp.aps.map(function(a){return apN(a,lang);}).join(lang==='ar'?'، ':', ');
  if(lang==='en') return 'Compare live flight prices from '+names+' to '+d+' (via '+city+') and see which Moroccan airport is cheapest right now, with airlines and booking tips.';
  if(lang==='fr') return 'Comparez les prix en direct des vols depuis '+names+' vers '+d+' (via '+city+') et voyez quel aéroport marocain est le moins cher en ce moment.';
  return 'قارن أسعار الرحلات المباشرة من '+names+' إلى '+d+' (عبر '+city+') واعرف أرخص مطار مغربي الآن.';
}
function intro(cmp,lang){
  var d=dstN(cmp.dst,lang);
  if(lang==='en') return 'Prices below are live, comparing each airport on a sample route to '+d+'. The cheapest is highlighted — but also consider how often each airport flies and which airlines serve it.';
  if(lang==='fr') return 'Les prix ci-dessous sont en direct, comparant chaque aéroport sur un vol type vers '+d+'. Le moins cher est mis en avant — pensez aussi à la fréquence des vols et aux compagnies.';
  return 'الأسعار أدناه مباشرة، تقارن كل مطار على رحلة نموذجية إلى '+d+'. الأرخص معلّم — لكن ضع في الحسبان عدد مرات تشغيل كل مطار للرحلات وأي شركات تعمل منه.';
}
function verdict(cmp,lang){
  // honest general guidance
  var hasCMN = cmp.aps.indexOf('CMN')!==-1;
  if(lang==='en') return (hasCMN?'Casablanca (CMN) usually has the most flights, the most airlines and the widest choice of dates, so it’s often cheapest and most flexible. ':'')+'A smaller airport can still win on price if you live nearby — you save the cost and time of reaching Casablanca. Use the live prices above for your exact dates, and check both before booking.';
  if(lang==='fr') return (hasCMN?'Casablanca (CMN) propose généralement le plus de vols, de compagnies et de dates, donc souvent le moins cher et le plus flexible. ':'')+'Un aéroport plus petit peut gagner sur le prix si vous habitez à côté — vous économisez le trajet jusqu’à Casablanca. Utilisez les prix en direct ci-dessus pour vos dates exactes.';
  return (hasCMN?'الدار البيضاء (CMN) عادةً لديها رحلات أكثر وشركات أكثر وتواريخ أكثر، لذا غالبًا ما تكون الأرخص والأكثر مرونة. ':'')+'قد يفوز مطار أصغر في السعر إن كنت تسكن قريبًا منه — فتوفّر تكلفة ووقت الوصول إلى الدار البيضاء. استخدم الأسعار المباشرة أعلاه لتواريخك، وتحقّق من الاثنين قبل الحجز.';
}
function faqs(cmp,lang){
  var d=dstN(cmp.dst,lang), a=apN(cmp.aps[0],lang), b=apN(cmp.aps[1]||cmp.aps[0],lang);
  if(lang==='en') return [
    ['Which Moroccan airport is cheapest to '+d+'?','It changes daily — the live comparison above shows today’s cheapest. Casablanca usually has the widest choice, but nearby airports can be cheaper for you overall.'],
    ['Is it worth driving to a bigger airport?','Sometimes. If a bigger airport saves more than your travel cost to reach it, yes — otherwise fly local. Compare the live prices first.'],
    ['Can I claim compensation on these flights?','If a flight to/from Europe is delayed 3+ hours or cancelled, you may be owed up to €600 under EU law. Check free on our compensation page.'],
  ];
  if(lang==='fr') return [
    ['Quel aéroport marocain est le moins cher vers '+d+' ?','Cela change chaque jour — la comparaison en direct ci-dessus montre le moins cher aujourd’hui. Casablanca offre souvent le plus de choix.'],
    ['Vaut-il la peine de rejoindre un plus grand aéroport ?','Parfois. Si l’économie dépasse le coût du trajet, oui — sinon, partez local. Comparez d’abord les prix en direct.'],
    ['Puis-je être indemnisé sur ces vols ?','Si un vol vers/depuis l’Europe est retardé de 3 h+ ou annulé, vous pouvez réclamer jusqu’à 600 €. Vérifiez gratuitement.'],
  ];
  return [
    ['ما أرخص مطار مغربي إلى '+d+'؟','يتغيّر يوميًا — المقارنة المباشرة أعلاه تُظهر الأرخص اليوم. الدار البيضاء عادةً لديها خيارات أكثر.'],
    ['هل يستحق الذهاب إلى مطار أكبر؟','أحيانًا. إن كان التوفير أكبر من تكلفة الطريق، فنعم — وإلا فسافر من مكانك. قارن الأسعار المباشرة أولًا.'],
    ['هل يمكنني الحصول على تعويض عن هذه الرحلات؟','إذا تأخرت رحلة إلى/من أوروبا 3 ساعات أو أُلغيت، فقد يكون لك الحق في ما يصل إلى 600 يورو. تحقّق مجانًا.'],
  ];
}

function nav(lang,slug){
  var x=L[lang];
  var langs=['en','fr','ar'].map(function(lg){var href=(lg==='en'?'':'/'+lg)+'/airports/'+slug;return '<a class="'+(lg===lang?'on':'')+'" href="'+href+'">'+lg.toUpperCase()+'</a>';}).join('');
  return '<nav class="nav"><div class="container nav-row"><a class="logo" href="'+x.home+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a><div class="nav-links">'
    +'<a class="nav-link" href="'+x.home+'">'+x.nav.flights+'</a><a class="nav-link" href="'+x.hotels+'">'+x.nav.hotels+'</a><a class="nav-link" href="'+x.esim+'">'+x.nav.esim+'</a><a class="nav-link" href="'+x.comp+'">'+x.nav.comp+'</a><span class="rp-langs">'+langs+'</span></div></div></nav>';
}
var NAVJS='<script>(function(){var C=\'.nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--paper);cursor:pointer;}.nav-toggle span{display:block;width:20px;height:2px;background:var(--ink);border-radius:2px;transition:transform .2s,opacity .2s;}.nav-row.menu-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg);}.nav-row.menu-open .nav-toggle span:nth-child(2){opacity:0;}.nav-row.menu-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}@media(max-width:720px){.nav-row{flex-wrap:nowrap!important;height:60px;position:relative;}.nav-toggle{display:flex;}.nav-links{position:absolute;top:100%;inset-inline-start:0;width:100%;flex-direction:column;align-items:stretch;gap:0!important;background:var(--paper);border:1px solid var(--line);border-radius:0 0 16px 16px;padding:8px;box-shadow:0 14px 30px rgba(24,26,46,.14);display:none!important;z-index:60;}.nav-row.menu-open .nav-links{display:flex!important;}.nav-links .nav-link{display:block!important;padding:13px 12px;font-size:1rem;border-bottom:1px solid var(--line);}.nav-links .btn{margin:10px 4px 4px;justify-content:center;}.nav-links .rp-langs{display:flex;justify-content:center;gap:16px;padding:12px;}.nav-links .rp-langs a{color:var(--ink);opacity:.75;}.nav-links .rp-langs a.on{opacity:1;}}\';function I(){var r=document.querySelector(".nav-row");if(!r||r.querySelector(".nav-toggle"))return;var l=r.querySelector(".nav-links");if(!l)return;var s=document.createElement("style");s.textContent=C;document.head.appendChild(s);var b=document.createElement("button");b.className="nav-toggle";b.type="button";b.setAttribute("aria-label","Menu");b.innerHTML="<span></span><span></span><span></span>";b.addEventListener("click",function(){r.classList.toggle("menu-open");});r.appendChild(b);l.addEventListener("click",function(e){if(e.target.closest("a"))r.classList.remove("menu-open");});}if(document.readyState!=="loading")I();else document.addEventListener("DOMContentLoaded",I);})();</script>';
function footer(lang){var x=L[lang];return '<footer class="footer"><div class="container"><div class="footer-trust">🔒 '+x.secure+'</div><div class="footer-bottom"><span>© <span id="y"></span> OasisDeal</span></div></div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS;}

function liveScript(cmp){
  var aps=JSON.stringify(cmp.aps), dst=cmp.dst;
  return '<script>(function(){var APS='+aps+',D="'+dst+'";'
    +'function ddmm(s){var x=s?new Date(/T/.test(s)?s:s+"T00:00:00"):new Date(Date.now()+30*864e5);if(isNaN(x))x=new Date(Date.now()+30*864e5);return ("0"+x.getDate()).slice(-2)+("0"+(x.getMonth()+1)).slice(-2);}'
    +'var FLY="https://fly.oasisdeal.com/?flightSearch=";var results={};var done=0;'
    +'APS.forEach(function(O){fetch("https://oasisdeal-fares.pages.dev/api/fares?origin="+O+"&destination="+D+"&currency=usd").then(function(r){return r.json();}).then(function(d){'
    +'var el=document.getElementById("p_"+O);if(d&&d.price){results[O]=d.price;if(el)el.textContent="$"+Math.round(d.price);var a=document.getElementById("b_"+O);if(a)a.href=FLY+O+ddmm(d.date)+D+"1";}else{if(el)el.textContent="—";}'
    +'}).catch(function(){var el=document.getElementById("p_"+O);if(el)el.textContent="—";}).finally(function(){done++;if(done===APS.length){var min=null,mk=null;for(var k in results){if(min===null||results[k]<min){min=results[k];mk=k;}}if(mk){var c=document.getElementById("card_"+mk);if(c)c.classList.add("best");var t=document.getElementById("tag_"+mk);if(t)t.style.display="inline-block";}}});});})();</script>';
}

function pageHtml(cmp,lang){
  var x=L[lang], slug=cmp.slug, self='https://oasisdeal.com'+(lang==='en'?'':'/'+lang)+'/airports/'+slug;
  var alts=['en','fr','ar'].map(function(lg){return '<link rel="alternate" hreflang="'+lg+'" href="https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+'/airports/'+slug+'" />';}).join('\n');
  var faqLd={'@context':'https://schema.org','@type':'FAQPage','mainEntity':faqs(cmp,lang).map(function(q){return {'@type':'Question','name':q[0],'acceptedAnswer':{'@type':'Answer','text':q[1]}};})};
  var city=DST[cmp.dst].city[lang];
  var cards=cmp.aps.map(function(code){
    var nm=apN(code,lang);
    return '<div class="rp-card" id="card_'+code+'"><span class="tag" id="tag_'+code+'" style="display:none">'+x.cheapest+'</span>'
      +'<h2>'+nm+' <span style="color:var(--ink-soft);font-size:.8em">('+code+')</span></h2>'
      +'<div class="price"><span class="from-pre">'+x.from+'</span> <span id="p_'+code+'">…</span></div>'
      +'<div class="days">'+x.to+' '+city+'</div>'
      +'<div class="get"><a class="btn btn-ghost" id="b_'+code+'" data-fly href="https://fly.oasisdeal.com" target="_blank" rel="noopener">'+x.search+'</a></div></div>';
  }).join('');
  var faqHtml=faqs(cmp,lang).map(function(q){return '<details><summary>'+q[0]+'</summary><p>'+q[1]+'</p></details>';}).join('');
  return '<!DOCTYPE html>\n<html lang="'+x.lang+'" dir="'+x.dir+'">\n<head>\n<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    +'<title>'+pageTitle(cmp,lang)+'</title>\n<meta name="description" content="'+metaDesc(cmp,lang)+'" />\n<link rel="canonical" href="'+self+'" />\n'+alts+'\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com/airports/'+slug+'" />\n'
    +'<meta property="og:title" content="'+pageTitle(cmp,lang)+'" /><meta property="og:description" content="'+metaDesc(cmp,lang)+'" /><meta property="og:url" content="'+self+'" /><meta property="og:type" content="website" />\n'
    +'<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    +'<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/assets/site.css" />\n'
    +'<script type="application/ld+json">'+JSON.stringify(faqLd)+'</script>\n'
    +'<style>.rp-hero{background:linear-gradient(160deg,var(--majorelle) 0%,var(--majorelle-deep) 100%);color:#fff;padding:50px 0 44px}.rp-hero h1{color:#fff;font-size:clamp(1.7rem,4.5vw,2.8rem)}.rp-hero p{opacity:.92;max-width:680px;margin-top:12px;line-height:1.6}.rp-langs a{margin-inline-start:8px;color:#fff;opacity:.7;text-decoration:none;font-size:.85rem}.rp-langs a.on{opacity:1;font-weight:700;text-decoration:underline}'
    +'.rp-grid{display:grid;grid-template-columns:repeat('+cmp.aps.length+',1fr);gap:16px;margin:28px 0}@media(max-width:680px){.rp-grid{grid-template-columns:1fr}}'
    +'.rp-card{position:relative;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:6px}.rp-card.best{border-color:var(--saffron);box-shadow:0 12px 30px rgba(232,163,61,.18)}'
    +'.rp-card .tag{position:absolute;top:-12px;inset-inline-start:24px;background:var(--saffron);color:var(--ink);font-weight:700;font-size:.72rem;text-transform:uppercase;padding:5px 12px;border-radius:100px}'
    +'.rp-card .price{font-family:Fraunces,serif;font-size:2.1rem;font-weight:600;color:var(--majorelle)}.rp-card .from-pre{font-family:"IBM Plex Mono",monospace;font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft)}.rp-card .days{color:var(--ink-soft);font-size:.9rem}.rp-card .get{margin-top:auto;padding-top:12px}.rp-card .btn{width:100%;justify-content:center}'
    +'.rp-card h2{font-size:1.3rem}.rp-sec{padding:26px 0;border-top:1px solid var(--line)}.rp-sec h2{font-size:1.4rem;margin-bottom:10px}.rp-sec p{color:var(--ink-soft);line-height:1.7}'
    +'.rp-faq details{border-bottom:1px solid var(--line);padding:14px 0}.rp-faq summary{cursor:pointer;font-weight:600}.rp-faq p{margin-top:8px}.rp-note{font-size:.82rem;color:var(--ink-soft);margin-top:20px}</style>\n</head>\n<body>\n'
    +nav(lang,slug)
    +'<header class="rp-hero"><div class="container"><h1>'+pageH1(cmp,lang)+'</h1><p>'+intro(cmp,lang)+'</p></div></header>'
    +'<main class="container" style="padding:30px 0"><div class="rp-grid">'+cards+'</div>'
    +'<section class="rp-sec"><h2>'+x.verdictH+'</h2><p>'+verdict(cmp,lang)+'</p></section>'
    +'<section class="rp-sec rp-faq"><h2>'+x.faqH+'</h2>'+faqHtml+'</section>'
    +'<p class="rp-note">'+x.note+'</p></main>'+footer(lang)+liveScript(cmp)+'\n</body>\n</html>\n';
}

function ensure(p){fs.mkdirSync(p,{recursive:true});}
function write(rel,html){var f=path.join(ROOT,rel);ensure(path.dirname(f));fs.writeFileSync(f,html);console.log('wrote',rel);}
var n=0;
['en','fr','ar'].forEach(function(lang){
  var base=lang==='en'?'airports':path.join(lang,'airports');
  CMP.forEach(function(cmp){ write(path.join(base,cmp.slug+'.html'), pageHtml(cmp,lang)); n++; });
});
console.log('Done:', n, 'airport-comparison pages across EN/FR/AR.');
// emit URLs for sitemap merge
var urls=[]; ['','/fr','/ar'].forEach(function(pre){CMP.forEach(function(cmp){urls.push('https://oasisdeal.com'+pre+'/airports/'+cmp.slug);});});
fs.writeFileSync(path.join(ROOT,'.airport-urls.json'), JSON.stringify(urls,null,0));
console.log('airport urls written to .airport-urls.json for sitemap merge');

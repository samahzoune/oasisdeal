/* OasisDeal programmatic route-page generator.
   Builds one SEO page per route per language (EN /flights/<slug>, FR /fr/flights/<slug>,
   AR-Darija /ar/flights/<slug>) with hreflang, FAQPage schema, a live "from" price
   (fetched client-side from the fares proxy) and cross-sells to compensation/hotels/eSIM.
   Also builds a hub page per language. Run: node build-routes.cjs
*/
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const ORIGIN = { code:'CMN', slug:'casablanca', en:'Casablanca', fr:'Casablanca', ar:'الدار البيضاء' };

// Tier-1 diaspora routes from Casablanca. dur = approx flight time. air = airlines on the route.
const DESTS = [
  { code:'PAR', slug:'paris',     en:'Paris',     fr:'Paris',      ar:'باريس',    dur:'3h 15m', air:['Royal Air Maroc','Air France','Transavia'] },
  { code:'LON', slug:'london',    en:'London',    fr:'Londres',    ar:'لندن',     dur:'3h 30m', air:['Royal Air Maroc','British Airways','easyJet'] },
  { code:'MAD', slug:'madrid',    en:'Madrid',    fr:'Madrid',     ar:'مدريد',    dur:'1h 35m', air:['Royal Air Maroc','Iberia','Air Arabia Maroc'] },
  { code:'BRU', slug:'brussels',  en:'Brussels',  fr:'Bruxelles',  ar:'بروكسل',   dur:'3h 20m', air:['Royal Air Maroc','Brussels Airlines','Air Arabia Maroc'] },
  { code:'MIL', slug:'milan',     en:'Milan',     fr:'Milan',      ar:'ميلانو',   dur:'2h 55m', air:['Royal Air Maroc','Air Arabia Maroc','ITA Airways'] },
  { code:'LYS', slug:'lyon',      en:'Lyon',      fr:'Lyon',       ar:'ليون',     dur:'2h 40m', air:['Royal Air Maroc','Transavia','Air Arabia Maroc'] },
  { code:'AMS', slug:'amsterdam', en:'Amsterdam', fr:'Amsterdam',  ar:'أمستردام', dur:'3h 40m', air:['Royal Air Maroc','Transavia','KLM'] },
  { code:'IST', slug:'istanbul',  en:'Istanbul',  fr:'Istanbul',   ar:'إسطنبول',  dur:'4h 45m', air:['Royal Air Maroc','Turkish Airlines','Pegasus'] },
  { code:'DXB', slug:'dubai',     en:'Dubai',     fr:'Dubaï',      ar:'دبي',      dur:'7h 00m', air:['Royal Air Maroc','Emirates','flydubai'] },
  { code:'JED', slug:'jeddah',    en:'Jeddah',    fr:'Djeddah',    ar:'جدة',      dur:'6h 15m', air:['Royal Air Maroc','Saudia','flynas'] },
];

const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#E8A33D"/><path d="M16 22c0-7 3-10 8-11-1 6-3 9-8 11z" fill="#241F5E"/><path d="M16 22c0-7-3-10-8-11 1 6 3 9 8 11z" fill="#4B3FCB"/><rect x="14.6" y="20" width="2.8" height="5" rx="1" fill="#241F5E"/></svg>';

// Per-language UI strings + URL prefixes. base = path back to site root from /flights or /xx/flights.
const L = {
  en: { dir:'ltr', lang:'en', home:'/', flights:'/', hotels:'/hotels', esim:'/esim', comp:'/compensation', hub:'/flights/',
        nav:{flights:'Flights',hotels:'Hotels',esim:'eSIM',comp:'Compensation'},
        from:'from', perRoute:'cheapest fare found now', search:'Search this route →',
        airlines:'Airlines on this route', flighttime:'Flight time', direct:'often direct',
        tipsH:'When is it cheapest?', faqH:'Frequently asked questions',
        compH:'Flight delayed or cancelled?', compP:'Under EU law you can claim up to €600 — even on past flights. Check free in 2 minutes.', compCta:'Check my compensation →',
        hotelH:'Where to stay in {city}', hotelCta:'Compare hotels →', esimH:'Stay online in {city}', esimCta:'Compare eSIMs →',
        note:'Live starting fare from our partners; final price is set by the airline. We may earn a commission at no extra cost to you.' },
  fr: { dir:'ltr', lang:'fr', home:'/fr/', flights:'/', hotels:'/hotels', esim:'/esim', comp:'/compensation', hub:'/fr/flights/',
        nav:{flights:'Vols',hotels:'Hôtels',esim:'eSIM',comp:'Indemnisation'},
        from:'à partir de', perRoute:'tarif le moins cher trouvé maintenant', search:'Chercher ce vol →',
        airlines:'Compagnies sur cette ligne', flighttime:'Durée du vol', direct:'souvent direct',
        tipsH:'Quand est-ce le moins cher ?', faqH:'Questions fréquentes',
        compH:'Vol retardé ou annulé ?', compP:'Selon la loi européenne, vous pouvez réclamer jusqu’à 600 € — même pour des vols passés. Vérifiez gratuitement en 2 minutes.', compCta:'Vérifier mon indemnisation →',
        hotelH:'Où dormir à {city}', hotelCta:'Comparer les hôtels →', esimH:'Rester connecté à {city}', esimCta:'Comparer les eSIM →',
        note:'Tarif de départ en direct via nos partenaires ; le prix final est fixé par la compagnie. Nous pouvons percevoir une commission sans surcoût pour vous.' },
  ar: { dir:'rtl', lang:'ar', home:'/ar/', flights:'/', hotels:'/hotels', esim:'/esim', comp:'/compensation', hub:'/ar/flights/',
        nav:{flights:'رحلات',hotels:'فنادق',esim:'eSIM',comp:'تعويضات'},
        from:'ابتداءً من', perRoute:'أرخص ثمن لقيناه دابا', search:'قلّب على هاد الرحلة →',
        airlines:'الشركات اللي كتطير فهاد الخط', flighttime:'مدة الرحلة', direct:'غالبا مباشرة',
        tipsH:'إمتى كتكون أرخص؟', faqH:'أسئلة مكررة',
        compH:'رحلتك تأخرت ولا تلغات؟', compP:'بقانون الاتحاد الأوروبي تقدر تطلب حتى 600 يورو — حتى على رحلات قديمة. شيك بلاش ف دقيقتين.', compCta:'شيك على التعويض ديالي →',
        hotelH:'فين تبات ف {city}', hotelCta:'قارن الفنادق →', esimH:'بقى متصل ف {city}', esimCta:'قارن الـ eSIM →',
        note:'ثمن البداية مباشر من شركائنا؛ الثمن النهائي كتحددو شركة الطيران. يمكن ناخدو عمولة بلا أي زيادة عليك.' },
};

function cityName(d, lang){ return d[lang]; }
function originName(lang){ return ORIGIN[lang]; }

// ---- localized page copy ----
function title(d, lang){
  var o=originName(lang), c=cityName(d,lang);
  if(lang==='en') return 'Cheap Flights '+o+' to '+c+' — Compare & Book | OasisDeal';
  if(lang==='fr') return 'Vols pas chers '+o+' – '+c+' — Comparer & Réserver | OasisDeal';
  return 'تذاكر طيران رخيصة من '+o+' إلى '+c+' — قارن واحجز | OasisDeal';
}
function metaDesc(d, lang){
  var o=originName(lang), c=cityName(d,lang);
  if(lang==='en') return 'Compare cheap flights from '+o+' to '+c+' across hundreds of airlines and book the lowest fare direct — no booking fees. Airlines, flight time, best time to book and delay-compensation rights.';
  if(lang==='fr') return 'Comparez les vols pas chers de '+o+' à '+c+' sur des centaines de compagnies et réservez le meilleur tarif en direct — sans frais. Compagnies, durée, meilleur moment pour réserver et droits à indemnisation.';
  return 'قارن تذاكر الطيران الرخيصة من '+o+' إلى '+c+' عبر مئات الشركات واحجز أرخص ثمن مباشرة — بلا رسوم. الشركات، مدة الرحلة، أحسن وقت للحجز وحقوق التعويض.';
}
function h1(d, lang){
  var o=originName(lang), c=cityName(d,lang);
  if(lang==='en') return 'Cheap flights '+o+' → '+c;
  if(lang==='fr') return 'Vols pas chers '+o+' → '+c;
  return 'تذاكر طيران رخيصة '+o+' ← '+c;
}
function tips(d, lang){
  var c=cityName(d,lang);
  if(lang==='en') return 'Fares to '+c+' spike during summer and Eid, when the diaspora flies home. For the lowest prices, travel mid-week (Tue/Wed) and in the off-season, and book roughly 4–6 weeks ahead. Use the live search above to see the cheapest dates for your trip.';
  if(lang==='fr') return 'Les tarifs vers '+c+' grimpent l’été et pendant l’Aïd, quand la diaspora rentre. Pour payer moins cher, voyagez en milieu de semaine (mar./mer.) et hors saison, et réservez environ 4 à 6 semaines à l’avance. Utilisez la recherche en direct ci-dessus pour voir les dates les moins chères.';
  return 'الأثمنة ل'+c+' كتطلع ف الصيف وف العيد، منين الجالية كترجع للبلاد. باش تخلّص أرخص، سافر ف وسط الأسبوع (الثلاثاء/الأربعاء) وخارج الموسم، واحجز تقريبا 4–6 سيمانات قبل. استعمل البحث المباشر لفوق باش تشوف أرخص التواريخ.';
}
function faqs(d, lang){
  var o=originName(lang), c=cityName(d,lang), air=d.air.join(lang==='ar'?'، ':', '), dur=d.dur;
  if(lang==='en') return [
    ['How much is a flight from '+o+' to '+c+'?', 'Fares start from the live price shown above and change daily. Compare all airlines in one search to grab the lowest fare for your dates.'],
    ['Which airlines fly '+o+' to '+c+'?', air+' operate this route, many of them direct.'],
    ['How long is the '+o+'–'+c+' flight?', 'A direct flight takes about '+dur+'.'],
    ['When are '+o+'–'+c+' flights cheapest?', 'Outside summer and Eid, mid-week, booked about 4–6 weeks ahead.'],
    ['My '+c+' flight was delayed — can I claim compensation?', 'Possibly up to €600 under EU rules, including many flights to and from Europe. Check free on our compensation page.'],
  ];
  if(lang==='fr') return [
    ['Combien coûte un vol de '+o+' à '+c+' ?', 'Les tarifs démarrent au prix en direct affiché ci-dessus et changent chaque jour. Comparez toutes les compagnies en une recherche pour trouver le meilleur tarif.'],
    ['Quelles compagnies relient '+o+' à '+c+' ?', air+' assurent cette ligne, souvent en direct.'],
    ['Combien de temps dure le vol '+o+'–'+c+' ?', 'Un vol direct dure environ '+dur+'.'],
    ['Quand les vols '+o+'–'+c+' sont-ils les moins chers ?', 'Hors été et Aïd, en milieu de semaine, réservés environ 4 à 6 semaines à l’avance.'],
    ['Mon vol pour '+c+' a été retardé — puis-je être indemnisé ?', 'Possiblement jusqu’à 600 € selon les règles européennes. Vérifiez gratuitement sur notre page indemnisation.'],
  ];
  return [
    ['شحال كيكلف تيكي من '+o+' ل'+c+'؟', 'الأثمنة كتبدا من الثمن المباشر اللي مبين لفوق وكتبدل كل نهار. قارن جميع الشركات ف بحث واحد باش تلقى أرخص ثمن للتواريخ ديالك.'],
    ['شنو هي الشركات اللي كتطير من '+o+' ل'+c+'؟', air+' كيخدمو هاد الخط، بزاف منهم مباشرة.'],
    ['شحال كتدوم رحلة '+o+'–'+c+'؟', 'الرحلة المباشرة كتدوم تقريبا '+dur+'.'],
    ['إمتى رحلات '+o+'–'+c+' كتكون أرخص؟', 'خارج الصيف والعيد، ف وسط الأسبوع، محجوزة تقريبا 4–6 سيمانات قبل.'],
    ['رحلتي ل'+c+' تأخرت — واش نقدر ناخد تعويض؟', 'يمكن حتى 600 يورو بقوانين الاتحاد الأوروبي. شيك بلاش ف صفحة التعويضات ديالنا.'],
  ];
}

function head(d, lang, slug){
  var alts = ['en','fr','ar'].map(function(lg){
    var href = 'https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+'/flights/'+slug;
    return '<link rel="alternate" hreflang="'+lg+'" href="'+href+'" />';
  }).join('\n');
  var self = 'https://oasisdeal.com'+(lang==='en'?'':'/'+lang)+'/flights/'+slug;
  var faqLd = { '@context':'https://schema.org','@type':'FAQPage','mainEntity': faqs(d,lang).map(function(q){
    return {'@type':'Question','name':q[0],'acceptedAnswer':{'@type':'Answer','text':q[1]}};
  })};
  return '<!DOCTYPE html>\n<html lang="'+L[lang].lang+'" dir="'+L[lang].dir+'">\n<head>\n'
    + '<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    + '<title>'+title(d,lang)+'</title>\n'
    + '<meta name="description" content="'+metaDesc(d,lang)+'" />\n'
    + '<link rel="canonical" href="'+self+'" />\n'
    + alts + '\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com/flights/'+slug+'" />\n'
    + '<meta property="og:title" content="'+title(d,lang)+'" />\n'
    + '<meta property="og:description" content="'+metaDesc(d,lang)+'" />\n'
    + '<meta property="og:url" content="'+self+'" />\n<meta property="og:type" content="website" />\n'
    + '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n'
    + '<link rel="stylesheet" href="/assets/site.css" />\n'
    + '<script type="application/ld+json">'+JSON.stringify(faqLd)+'</script>\n'
    + '<style>'
    + '.rp-hero{background:linear-gradient(160deg,var(--majorelle) 0%,var(--majorelle-deep) 100%);color:#fff;padding:54px 0 48px;}'
    + '.rp-hero h1{color:#fff;font-size:clamp(2rem,5vw,3.1rem);}'
    + '.rp-price{font-family:"Fraunces",serif;font-size:2.6rem;font-weight:600;margin-top:14px;}'
    + '.rp-price .pre{font-family:"IBM Plex Mono",monospace;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;opacity:.8;vertical-align:middle;margin-inline-end:6px;}'
    + '.rp-price small{display:block;font-family:"Inter";font-size:.9rem;font-weight:400;opacity:.85;margin-top:4px;}'
    + '.rp-facts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:28px 0;}'
    + '@media(max-width:640px){.rp-facts{grid-template-columns:1fr;}}'
    + '.rp-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:22px;}'
    + '.rp-card h2{font-size:1.2rem;margin-bottom:8px;}'
    + '.rp-cross{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:26px 0;}'
    + '@media(max-width:760px){.rp-cross{grid-template-columns:1fr;}}'
    + '.rp-cross .rp-card{display:flex;flex-direction:column;gap:10px;}'
    + '.rp-cross .btn{margin-top:auto;}'
    + '.rp-faq details{border-bottom:1px solid var(--line);padding:14px 0;}'
    + '.rp-faq summary{cursor:pointer;font-weight:600;font-size:1.05rem;}'
    + '.rp-faq p{color:var(--ink-soft);margin-top:8px;}'
    + '.rp-note{font-size:.82rem;color:var(--ink-soft);margin-top:22px;}'
    + '.rp-langs a{margin-inline-start:8px;color:#fff;opacity:.7;text-decoration:none;font-size:.85rem;}'
    + '.rp-langs a.on{opacity:1;font-weight:700;text-decoration:underline;}'
    + '</style>\n</head>\n';
}

function nav(lang, slug){
  var x = L[lang];
  var langs = ['en','fr','ar'].map(function(lg){
    var href = (lg==='en'?'':'/'+lg)+'/flights/'+slug;
    return '<a class="'+(lg===lang?'on':'')+'" href="'+href+'">'+lg.toUpperCase()+'</a>';
  }).join('');
  return '<nav class="nav"><div class="container nav-row">'
    + '<a class="logo" href="'+x.home+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a>'
    + '<div class="nav-links">'
    + '<a class="nav-link" href="'+x.home+'">'+x.nav.flights+'</a>'
    + '<a class="nav-link" href="'+x.hotels+'">'+x.nav.hotels+'</a>'
    + '<a class="nav-link" href="'+x.esim+'">'+x.nav.esim+'</a>'
    + '<a class="nav-link" href="'+x.comp+'">'+x.nav.comp+'</a>'
    + '<span class="rp-langs">'+langs+'</span>'
    + '</div></div></nav>';
}

function footer(lang){
  var x=L[lang];
  return '<footer class="footer"><div class="container">'
    + '<div class="footer-trust">🔒 '+ (lang==='en'?'Secure & free to use · No booking fees':(lang==='fr'?'Sécurisé et gratuit · Sans frais de réservation':'آمن ومجاني · بلا رسوم حجز')) +' · Travelpayouts · Stay22 · AirHelp</div>'
    + '<div class="footer-bottom"><span>© <span id="y"></span> OasisDeal</span><span>Casablanca, Morocco</span></div>'
    + '</div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>';
}

function liveScript(d){
  return '<script>(function(){var O="'+ORIGIN.code+'",D="'+d.code+'";'
    + 'function ddmm(s){var x=s?new Date(/T/.test(s)?s:s+"T00:00:00"):new Date(Date.now()+30*864e5);if(isNaN(x))x=new Date(Date.now()+30*864e5);return ("0"+x.getDate()).slice(-2)+("0"+(x.getMonth()+1)).slice(-2);}'
    + 'var FLY="https://fly.oasisdeal.com/?flightSearch=";'
    + 'Array.prototype.forEach.call(document.querySelectorAll("[data-fly]"),function(a){a.href=FLY+O+ddmm()+D+"1";});'
    + 'fetch("https://oasisdeal-fares.pages.dev/api/fares?origin="+O+"&destination="+D+"&currency=usd").then(function(r){return r.json();}).then(function(d){'
    + 'if(d&&d.price){var p=document.getElementById("lp");if(p)p.textContent="$"+Math.round(d.price);'
    + 'if(d.date){var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];var dt=new Date(d.date);var s=dt.getDate()+" "+M[dt.getMonth()];var ld=document.getElementById("ld");if(ld)ld.textContent=s;'
    + 'Array.prototype.forEach.call(document.querySelectorAll("[data-fly]"),function(a){a.href=FLY+O+ddmm(d.date)+D+"1";});}}}).catch(function(){});})();</script>';
}

function routePage(d, lang){
  var x=L[lang], o=originName(lang), c=cityName(d,lang), slug=ORIGIN.slug+'-'+d.slug;
  var airList = d.air.map(function(a){return '<li>'+a+'</li>';}).join('');
  var faqHtml = faqs(d,lang).map(function(q){return '<details><summary>'+q[0]+'</summary><p>'+q[1]+'</p></details>';}).join('');
  var hotelH = x.hotelH.replace('{city}',c), esimH = x.esimH.replace('{city}',c);
  return head(d,lang,slug)
    + '<body>\n'+nav(lang,slug)
    + '<header class="rp-hero"><div class="container">'
      + '<h1>'+h1(d,lang)+'</h1>'
      + '<div class="rp-price"><span class="pre">'+x.from+'</span><span id="lp">—</span><small>'+x.perRoute+' · <span id="ld"></span></small></div>'
      + '<div style="margin-top:22px"><a class="btn btn-primary" data-fly href="https://fly.oasisdeal.com">'+x.search+'</a></div>'
    + '</div></header>'
    + '<main class="container" style="padding:36px 0">'
      + '<div class="rp-facts">'
        + '<div class="rp-card"><h2>'+x.airlines+'</h2><ul>'+airList+'</ul></div>'
        + '<div class="rp-card"><h2>'+x.flighttime+'</h2><p style="font-size:1.6rem;font-family:Fraunces,serif;font-weight:600">'+d.dur+'</p><p style="color:var(--ink-soft)">'+x.direct+'</p></div>'
      + '</div>'
      + '<div class="rp-card" style="margin-bottom:26px"><h2>'+x.tipsH+'</h2><p style="color:var(--ink-soft)">'+tips(d,lang)+'</p></div>'
      + '<div class="rp-cross">'
        + '<div class="rp-card"><h2>'+x.compH+'</h2><p style="color:var(--ink-soft);font-size:.95rem">'+x.compP+'</p><a class="btn btn-primary" href="'+x.comp+'">'+x.compCta+'</a></div>'
        + '<div class="rp-card"><h2>'+hotelH+'</h2><a class="btn btn-ghost" href="'+x.hotels+'">'+x.hotelCta+'</a></div>'
        + '<div class="rp-card"><h2>'+esimH+'</h2><a class="btn btn-ghost" href="'+x.esim+'">'+x.esimCta+'</a></div>'
      + '</div>'
      + '<section class="rp-faq"><h2 style="margin-bottom:6px">'+x.faqH+'</h2>'+faqHtml+'</section>'
      + '<p class="rp-note">'+x.note+'</p>'
    + '</main>'
    + footer(lang) + liveScript(d) + '\n</body>\n</html>\n';
}

// ---- hub page per language ----
function hubPage(lang){
  var x=L[lang], o=originName(lang);
  var ttl = lang==='en' ? 'Cheap Flights from '+o+' — All Routes | OasisDeal'
    : lang==='fr' ? 'Vols pas chers depuis '+o+' — Toutes les lignes | OasisDeal'
    : 'تذاكر طيران رخيصة من '+o+' — جميع الوجهات | OasisDeal';
  var desc = lang==='en' ? 'Compare cheap flights from '+o+' to top destinations — Paris, London, Madrid, Dubai and more. Live fares, airlines and delay-compensation help.'
    : lang==='fr' ? 'Comparez les vols pas chers depuis '+o+' vers les meilleures destinations — Paris, Londres, Madrid, Dubaï et plus.'
    : 'قارن تذاكر الطيران الرخيصة من '+o+' لأهم الوجهات — باريس، لندن، مدريد، دبي وأكثر.';
  var hubH = lang==='en' ? 'Cheap flights from '+o : lang==='fr' ? 'Vols pas chers depuis '+o : 'تذاكر طيران رخيصة من '+o;
  var intro = lang==='en' ? 'Pick your destination to compare live fares across hundreds of airlines, see who flies the route, and the best time to book.'
    : lang==='fr' ? 'Choisissez votre destination pour comparer les tarifs en direct, voir les compagnies et le meilleur moment pour réserver.'
    : 'اختر وجهتك باش تقارن الأثمنة المباشرة عبر مئات الشركات، تشوف شكون كيطير، وأحسن وقت للحجز.';
  var alts = ['en','fr','ar'].map(function(lg){return '<link rel="alternate" hreflang="'+lg+'" href="https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+'/flights/" />';}).join('\n');
  var self='https://oasisdeal.com'+(lang==='en'?'':'/'+lang)+'/flights/';
  var cards = DESTS.map(function(d){
    var c=cityName(d,lang), href=(lang==='en'?'':'/'+lang)+'/flights/'+ORIGIN.slug+'-'+d.slug;
    var label = lang==='en' ? o+' → '+c : lang==='fr' ? o+' → '+c : o+' ← '+c;
    return '<a class="rp-card" style="text-decoration:none;color:inherit" href="'+href+'"><h2 style="font-size:1.15rem">'+label+'</h2><span style="color:var(--clay-deep);font-weight:600">'+(lang==='ar'?'شوف الأثمنة →':lang==='fr'?'Voir les prix →':'See prices →')+'</span></a>';
  }).join('');
  return '<!DOCTYPE html>\n<html lang="'+L[lang].lang+'" dir="'+L[lang].dir+'">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    + '<title>'+ttl+'</title>\n<meta name="description" content="'+desc+'" />\n<link rel="canonical" href="'+self+'" />\n'+alts+'\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com/flights/" />\n'
    + '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n'
    + '<link rel="stylesheet" href="/assets/site.css" />\n'
    + '<style>.rp-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:30px 0}@media(max-width:760px){.rp-grid{grid-template-columns:1fr}}.rp-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:22px;display:block}.rp-card:hover{border-color:var(--majorelle)}</style>\n</head>\n<body>\n'
    + nav(lang, ORIGIN.slug+'-'+DESTS[0].slug).replace(/\/flights\/[a-z-]+/g, (lang==='en'?'':'/'+lang)+'/flights/') // langs row points to hub siblings
    + '<header class="rp-hero" style="background:linear-gradient(160deg,var(--majorelle) 0%,var(--majorelle-deep) 100%);color:#fff;padding:54px 0"><div class="container"><h1 style="color:#fff">'+hubH+'</h1><p style="opacity:.9;max-width:640px;margin-top:10px">'+intro+'</p></div></header>'
    + '<main class="container" style="padding:30px 0"><div class="rp-grid">'+cards+'</div></main>'
    + footer(lang)+'\n</body>\n</html>\n';
}

// ---- write files ----
function ensure(p){ fs.mkdirSync(p, {recursive:true}); }
function write(rel, html){ var f=path.join(ROOT, rel); ensure(path.dirname(f)); fs.writeFileSync(f, html); console.log('wrote', rel); }

var count=0;
['en','fr','ar'].forEach(function(lang){
  var base = lang==='en' ? 'flights' : path.join(lang,'flights');
  DESTS.forEach(function(d){
    var slug = ORIGIN.slug+'-'+d.slug;
    write(path.join(base, slug+'.html'), routePage(d, lang));
    count++;
  });
  write(path.join(base, 'index.html'), hubPage(lang));
});
// ---- regenerate sitemap.xml (existing pages + all route pages/hubs) ----
var urls = ['/','/hotels','/esim','/compensation','/flight-rights','/fr/flight-rights','/ar/flight-rights','/about','/contact','/privacy'].map(function(p){return 'https://oasisdeal.com'+p;});
['','/fr','/ar'].forEach(function(pre){
  urls.push('https://oasisdeal.com'+pre+'/flights/');
  DESTS.forEach(function(d){ urls.push('https://oasisdeal.com'+pre+'/flights/'+ORIGIN.slug+'-'+d.slug); });
});
var sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map(function(u){return '  <url><loc>'+u+'</loc></url>';}).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), sm);
console.log('wrote sitemap.xml with', urls.length, 'urls');
console.log('Done:', count, 'route pages + 3 hubs across EN/FR/AR.');

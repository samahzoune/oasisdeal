/* OasisDeal programmatic route-page generator (multi-origin).
   One SEO page per route per language (EN /flights/<slug>, FR /fr/flights/<slug>,
   AR-Darija /ar/flights/<slug>) with hreflang, FAQPage schema, a live "from" price,
   and cross-sells. Routes are real high-demand queries (Google autocomplete).
   Honest by design: EU261 compensation shown only on Morocco<->Europe routes;
   eSIM only on international routes. Run: node build-routes.cjs */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const STAY22 = "<script>(function(s,t,a,y,o,n){s.Stay22=s.Stay22||{};s.Stay22.params={lmaID:'6a444061c151746f75b1b4ff'};o=t.createElement(a);n=t.getElementsByTagName(a)[0];o.async=1;o.src=y;n.parentNode.insertBefore(o,n);})(window,document,'script','https://scripts.stay22.com/letmeallez.js');</script><script src='/assets/consent.js' defer></script>";

// ---- cities (IATA -> slug + names). MA = Moroccan (domestic detection). ----
const CITY = {
  CMN:{slug:'casablanca', en:'Casablanca', fr:'Casablanca', ar:'الدار البيضاء', ma:1},
  RBA:{slug:'rabat',      en:'Rabat',      fr:'Rabat',      ar:'الرباط',       ma:1},
  TNG:{slug:'tangier',    en:'Tangier',    fr:'Tanger',     ar:'طنجة',         ma:1},
  AGA:{slug:'agadir',     en:'Agadir',     fr:'Agadir',     ar:'أكادير',       ma:1},
  FEZ:{slug:'fes',        en:'Fes',        fr:'Fès',        ar:'فاس',          ma:1},
  OUD:{slug:'oujda',      en:'Oujda',      fr:'Oujda',      ar:'وجدة',         ma:1},
  NDR:{slug:'nador',      en:'Nador',      fr:'Nador',      ar:'الناظور',      ma:1},
  VIL:{slug:'dakhla',     en:'Dakhla',     fr:'Dakhla',     ar:'الداخلة',      ma:1},
  ERH:{slug:'errachidia', en:'Errachidia', fr:'Errachidia', ar:'الرشيدية',     ma:1},
  EUN:{slug:'laayoune',   en:'Laayoune',   fr:'Laâyoune',   ar:'العيون',       ma:1},
  RAK:{slug:'marrakesh',  en:'Marrakesh',  fr:'Marrakech',  ar:'مراكش',        ma:1},
  PAR:{slug:'paris',     en:'Paris',     fr:'Paris',     ar:'باريس',     country:'fr'},
  LON:{slug:'london',    en:'London',    fr:'Londres',   ar:'لندن',      country:'uk'},
  MAD:{slug:'madrid',    en:'Madrid',    fr:'Madrid',    ar:'مدريد',     country:'es'},
  BRU:{slug:'brussels',  en:'Brussels',  fr:'Bruxelles', ar:'بروكسل',    country:'be'},
  MIL:{slug:'milan',     en:'Milan',     fr:'Milan',     ar:'ميلانو',    country:'it'},
  LYS:{slug:'lyon',      en:'Lyon',      fr:'Lyon',      ar:'ليون',      country:'fr'},
  AMS:{slug:'amsterdam', en:'Amsterdam', fr:'Amsterdam', ar:'أمستردام',  country:'nl'},
  IST:{slug:'istanbul',  en:'Istanbul',  fr:'Istanbul',  ar:'إسطنبول',   country:'tr'},
  DXB:{slug:'dubai',     en:'Dubai',     fr:'Dubaï',     ar:'دبي',       country:'ae'},
  JED:{slug:'jeddah',    en:'Jeddah',    fr:'Djeddah',   ar:'جدة',       country:'sa'},
  TUN:{slug:'tunis',     en:'Tunis',     fr:'Tunis',     ar:'تونس',      country:'tn'},
  AGP:{slug:'malaga',    en:'Malaga',    fr:'Malaga',    ar:'مالقة',     country:'es'},
  MRS:{slug:'marseille', en:'Marseille', fr:'Marseille', ar:'مرسيليا',   country:'fr'},
  BCN:{slug:'barcelona', en:'Barcelona', fr:'Barcelone', ar:'برشلونة',   country:'es'},
  DUS:{slug:'dusseldorf',en:'Düsseldorf',fr:'Düsseldorf', ar:'دوسلدورف',  country:'de'},
  FRA:{slug:'frankfurt', en:'Frankfurt', fr:'Francfort',  ar:'فرانكفورت', country:'de'},
};
const EUROPE = {fr:1,uk:1,es:1,be:1,it:1,nl:1,de:1}; // EU/UK -> EC261 applies (esp. on EU carriers)
const AIR = {
  fr:['Royal Air Maroc','Transavia','Air France'], uk:['Royal Air Maroc','British Airways','easyJet'],
  es:['Royal Air Maroc','Ryanair','Air Arabia Maroc'], be:['Royal Air Maroc','Brussels Airlines','Air Arabia Maroc'],
  it:['Royal Air Maroc','Air Arabia Maroc','ITA Airways'], nl:['Royal Air Maroc','Transavia','KLM'],
  de:['Royal Air Maroc','Lufthansa','Eurowings'],
  tr:['Royal Air Maroc','Turkish Airlines','Pegasus'], ae:['Royal Air Maroc','Emirates','flydubai'],
  sa:['Royal Air Maroc','Saudia','flynas'], tn:['Royal Air Maroc','Tunisair','Nouvelair'],
  dom:['Royal Air Maroc','Air Arabia Maroc'],
};
// optional curated durations (from-to). Others skip the flight-time card.
const DUR = {'CMN-PAR':'3h 15m','CMN-LON':'3h 30m','CMN-MAD':'1h 35m','CMN-BRU':'3h 20m','CMN-MIL':'2h 55m','CMN-LYS':'2h 40m','CMN-AMS':'3h 40m','CMN-IST':'4h 45m','CMN-DXB':'7h 00m','CMN-JED':'6h 15m','RBA-PAR':'3h 20m','TNG-PAR':'3h 05m','TNG-MAD':'1h 20m','TNG-BCN':'1h 50m','TNG-BRU':'2h 55m','TNG-MRS':'2h 00m','TNG-AMS':'3h 20m','FEZ-PAR':'3h 00m','CMN-AGA':'1h 05m','RBA-AGA':'1h 15m','CMN-DUS':'3h 45m','CMN-FRA':'3h 50m','AGA-BRU':'3h 30m','AGA-MRS':'2h 55m','AGA-PAR':'3h 35m','AGA-LON':'3h 50m'};

const ORIGINS = ['CMN','RBA','TNG','AGA','FEZ'];
const ROUTES = [
  ['CMN','PAR'],['CMN','LON'],['CMN','MAD'],['CMN','BRU'],['CMN','MIL'],['CMN','LYS'],['CMN','AMS'],['CMN','IST'],['CMN','DXB'],['CMN','JED'],['CMN','AGA'],['CMN','OUD'],['CMN','VIL'],['CMN','TUN'],['CMN','DUS'],['CMN','FRA'],
  ['RBA','AGA'],['RBA','PAR'],['RBA','OUD'],['RBA','NDR'],['RBA','ERH'],['RBA','VIL'],['RBA','AGP'],['RBA','TUN'],['RBA','MAD'],['RBA','RAK'],['RBA','BRU'],['RBA','MRS'],
  ['TNG','AGA'],['TNG','RAK'],['TNG','PAR'],['TNG','AGP'],['TNG','OUD'],['TNG','BCN'],['TNG','NDR'],['TNG','MAD'],['TNG','IST'],['TNG','BRU'],['TNG','MRS'],['TNG','AMS'],['TNG','DUS'],['TNG','LYS'],
  ['AGA','RBA'],['AGA','CMN'],['AGA','TNG'],['AGA','FEZ'],['AGA','PAR'],['AGA','VIL'],['AGA','EUN'],['AGA','OUD'],['AGA','BRU'],['AGA','MRS'],['AGA','AMS'],['AGA','DUS'],['AGA','LON'],['AGA','LYS'],['AGA','MAD'],
  ['FEZ','AGA'],['FEZ','RAK'],['FEZ','PAR'],['FEZ','AGP'],['FEZ','MRS'],['FEZ','VIL'],['FEZ','MAD'],['FEZ','TNG'],['FEZ','BCN'],['FEZ','OUD'],['FEZ','BRU'],['FEZ','AMS'],['FEZ','DUS'],
];

function isDom(f,t){ return CITY[f].ma && CITY[t].ma; }
function isEuro(t){ return CITY[t].country && EUROPE[CITY[t].country]; }
function airlines(f,t){ return isDom(f,t) ? AIR.dom : (AIR[CITY[t].country] || ['Royal Air Maroc']); }
function slugOf(f,t){ return CITY[f].slug+'-'+CITY[t].slug; }
function nm(code,lang){ return CITY[code][lang]; }

const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#E8A33D"/><path d="M16 22c0-7 3-10 8-11-1 6-3 9-8 11z" fill="#241F5E"/><path d="M16 22c0-7-3-10-8-11 1 6 3 9 8 11z" fill="#4B3FCB"/><rect x="14.6" y="20" width="2.8" height="5" rx="1" fill="#241F5E"/></svg>';

const L = {
  en:{dir:'ltr',lang:'en',home:'/',hotels:'/hotels',cars:'/cars',transfers:'/transfers',esim:'/esim',comp:'/compensation',nav:{flights:'Flights',hotels:'Hotels',cars:'Cars',transfers:'Transfers',esim:'eSIM',dest:'Destinations',blog:'Blog',comp:'Compensation'},
      from:'from',perRoute:'cheapest price found now',search:'Search this route →',airlines:'Airlines on this route',flighttime:'Flight time',direct:'often direct',
      tipsH:'When is it cheapest?',faqH:'Frequently asked questions',compH:'Flight delayed or cancelled?',compP:'On Morocco–Europe flights you can claim up to €600 under EU law — even past flights. Check free in 2 minutes.',compCta:'Check my compensation →',
      hotelH:'Where to stay in {city}',hotelCta:'Compare hotels →',esimH:'Stay online in {city}',esimCta:'Compare eSIMs →',
      note:'Live starting price from our partners; final price is set by the airline. We may earn a commission at no extra cost to you.',secure:'Secure & free to use · No booking fees'},
  fr:{dir:'ltr',lang:'fr',home:'/fr/',hotels:'/hotels',cars:'/cars',transfers:'/transfers',esim:'/esim',comp:'/compensation',nav:{flights:'Vols',hotels:'Hôtels',cars:'Voitures',transfers:'Transferts',esim:'eSIM',dest:'Destinations',blog:'Blog',comp:'Indemnisation'},
      from:'à partir de',perRoute:'tarif le moins cher trouvé maintenant',search:'Chercher ce vol →',airlines:'Compagnies sur cette ligne',flighttime:'Durée du vol',direct:'souvent direct',
      tipsH:'Quand est-ce le moins cher ?',faqH:'Questions fréquentes',compH:'Vol retardé ou annulé ?',compP:'Sur les vols Maroc–Europe, réclamez jusqu’à 600 € selon la loi européenne — même les vols passés. Vérifiez en 2 minutes.',compCta:'Vérifier mon indemnisation →',
      hotelH:'Où dormir à {city}',hotelCta:'Comparer les hôtels →',esimH:'Rester connecté à {city}',esimCta:'Comparer les eSIM →',
      note:'Tarif de départ en direct via nos partenaires ; le prix final est fixé par la compagnie. Nous pouvons percevoir une commission sans surcoût pour vous.',secure:'Sécurisé et gratuit · Sans frais'},
  ar:{dir:'rtl',lang:'ar',home:'/ar/',hotels:'/hotels',cars:'/cars',transfers:'/transfers',esim:'/esim',comp:'/compensation',nav:{flights:'رحلات',hotels:'فنادق',cars:'سيارات',transfers:'النقل',esim:'eSIM',dest:'الوجهات',blog:'المدوّنة',comp:'تعويضات'},
      from:'ابتداءً من',perRoute:'أرخص سعر وجدناه الآن',search:'ابحث عن هذه الرحلة →',airlines:'شركات الطيران على هذا الخط',flighttime:'مدة الرحلة',direct:'غالبًا مباشرة',
      tipsH:'متى تكون أرخص؟',faqH:'أسئلة شائعة',compH:'هل تأخرت رحلتك أو أُلغيت؟',compP:'في رحلات المغرب–أوروبا يمكنك المطالبة بما يصل إلى 600 يورو بموجب قانون الاتحاد الأوروبي — حتى الرحلات القديمة. تحقّق في دقيقتين.',compCta:'تحقّق من تعويضي →',
      hotelH:'أين تقيم في {city}',hotelCta:'قارن الفنادق →',esimH:'ابقَ متصلًا في {city}',esimCta:'قارن الـ eSIM →',
      note:'السعر المبدئي مباشر من شركائنا؛ السعر النهائي تحدّده شركة الطيران. قد نتقاضى عمولة دون أي زيادة عليك.',secure:'آمن ومجاني · دون رسوم حجز'},
};

function title(f,t,lang){var o=nm(f,lang),c=nm(t,lang);
  if(lang==='en')return 'Cheap Flights '+o+' to '+c+' — Compare & Book | OasisDeal';
  if(lang==='fr')return 'Vols pas chers '+o+' – '+c+' — Comparer & Réserver | OasisDeal';
  return 'تذاكر طيران رخيصة من '+o+' إلى '+c+' — قارن واحجز | OasisDeal';}
function metaDesc(f,t,lang){var o=nm(f,lang),c=nm(t,lang);
  if(lang==='en')return 'Compare cheap flights from '+o+' to '+c+' across hundreds of airlines and book the lowest price — no booking fees. Airlines, best time to book'+(isEuro(t)?' and delay-compensation rights.':'.');
  if(lang==='fr')return 'Comparez les vols pas chers de '+o+' à '+c+' sur des centaines de compagnies et réservez le meilleur tarif — sans frais. Compagnies, meilleur moment pour réserver'+(isEuro(t)?' et droits à indemnisation.':'.');
  return 'قارن تذاكر الطيران الرخيصة من '+o+' إلى '+c+' عبر مئات الشركات واحجز أرخص سعر — دون رسوم. شركات الطيران وأفضل وقت للحجز'+(isEuro(t)?' وحقوق التعويض.':'.');}
function h1(f,t,lang){var o=nm(f,lang),c=nm(t,lang);
  if(lang==='en')return 'Cheap flights '+o+' → '+c;
  if(lang==='fr')return 'Vols pas chers '+o+' → '+c;
  return 'تذاكر طيران رخيصة '+o+' ← '+c;}
function tips(f,t,lang){var c=nm(t,lang);var dom=isDom(f,t);
  if(lang==='en')return dom
    ? 'Domestic prices to '+c+' are usually low but rise on weekends and holidays. For the cheapest seats, fly mid-week and book a couple of weeks ahead. Use the live search above for your exact dates.'
    : 'Prices to '+c+' spike during summer and Eid, when the diaspora travels. For the lowest prices, fly mid-week (Tue/Wed) and off-season, and book roughly 4–6 weeks ahead. Use the live search above to see the cheapest dates.';
  if(lang==='fr')return dom
    ? 'Les tarifs intérieurs vers '+c+' sont généralement bas mais montent le week-end et les jours fériés. Pour payer moins, voyagez en milieu de semaine et réservez deux semaines à l’avance.'
    : 'Les tarifs vers '+c+' grimpent l’été et pendant l’Aïd. Pour payer moins, voyagez en milieu de semaine (mar./mer.) et hors saison, et réservez 4 à 6 semaines à l’avance.';
  return dom
    ? 'الأسعار الداخلية إلى '+c+' عادةً رخيصة لكنها ترتفع في عطلة نهاية الأسبوع والأعياد. لتدفع أقل، سافر في منتصف الأسبوع واحجز قبل أسبوعين.'
    : 'الأسعار إلى '+c+' ترتفع في الصيف والأعياد. لتدفع أقل، سافر في منتصف الأسبوع وخارج الموسم، واحجز قبل 4–6 أسابيع.';}

function faqs(f,t,lang){
  var o=nm(f,lang),c=nm(t,lang),air=airlines(f,t).join(lang==='ar'?'، ':', '),dur=DUR[f+'-'+t],euro=isEuro(t);
  var q=[];
  if(lang==='en'){
    q.push(['How much is a flight from '+o+' to '+c+'?','Prices start from the live price shown above and change daily. Compare all airlines in one search to grab the lowest price for your dates.']);
    q.push(['Which airlines fly '+o+' to '+c+'?',air+' operate this route.']);
    if(dur)q.push(['How long is the '+o+'–'+c+' flight?','A direct flight takes about '+dur+'.']);
    q.push(['When is it cheapest?', isDom(f,t)?'Mid-week and outside weekends/holidays, booked a couple of weeks ahead.':'Outside summer and Eid, mid-week, booked about 4–6 weeks ahead.']);
    if(euro)q.push(['My flight was delayed — can I claim compensation?','Possibly up to €600 under EU rules for Morocco–Europe flights. Check free on our compensation page.']);
  } else if(lang==='fr'){
    q.push(['Combien coûte un vol de '+o+' à '+c+' ?','Les tarifs démarrent au prix en direct ci-dessus et changent chaque jour. Comparez toutes les compagnies en une recherche.']);
    q.push(['Quelles compagnies relient '+o+' à '+c+' ?',air+' assurent cette ligne.']);
    if(dur)q.push(['Combien de temps dure le vol '+o+'–'+c+' ?','Un vol direct dure environ '+dur+'.']);
    q.push(['Quand est-ce le moins cher ?', isDom(f,t)?'En milieu de semaine, hors week-ends et fêtes, réservé deux semaines à l’avance.':'Hors été et Aïd, en milieu de semaine, réservé 4 à 6 semaines à l’avance.']);
    if(euro)q.push(['Mon vol a été retardé — puis-je être indemnisé ?','Possiblement jusqu’à 600 € selon les règles européennes pour les vols Maroc–Europe. Vérifiez gratuitement.']);
  } else {
    q.push(['كم تكلّف تذكرة من '+o+' إلى '+c+'؟','تبدأ الأسعار من السعر المباشر المبيّن أعلاه وتتغيّر يوميًا. قارن جميع الشركات في بحث واحد.']);
    q.push(['ما شركات الطيران التي تطير من '+o+' إلى '+c+'؟',air+' تخدم هذا الخط.']);
    if(dur)q.push(['كم تستغرق رحلة '+o+'–'+c+'؟','تستغرق الرحلة المباشرة حوالي '+dur+'.']);
    q.push(['متى تكون أرخص؟', isDom(f,t)?'في منتصف الأسبوع، خارج عطلة نهاية الأسبوع والأعياد، ومحجوزة قبل أسبوعين.':'خارج الصيف والأعياد، في منتصف الأسبوع، ومحجوزة قبل 4–6 أسابيع.']);
    if(euro)q.push(['تأخرت رحلتي — هل يمكنني الحصول على تعويض؟','قد تصل إلى 600 يورو بموجب قوانين الاتحاد الأوروبي لرحلات المغرب–أوروبا. تحقّق مجانًا.']);
  }
  return q;
}

function head(f,t,lang){
  var slug=slugOf(f,t);
  var alts=['en','fr','ar'].map(function(lg){return '<link rel="alternate" hreflang="'+lg+'" href="https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+'/flights/'+slug+'" />';}).join('\n');
  var self='https://oasisdeal.com'+(lang==='en'?'':'/'+lang)+'/flights/'+slug;
  var faqLd={'@context':'https://schema.org','@type':'FAQPage','mainEntity':faqs(f,t,lang).map(function(q){return {'@type':'Question','name':q[0],'acceptedAnswer':{'@type':'Answer','text':q[1]}};})};
  return '<!DOCTYPE html>\n<html lang="'+L[lang].lang+'" dir="'+L[lang].dir+'">\n<head>\n<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="p:domain_verify" content="1f6676c70992e08fca792b0978b916b9" />\n'
    +'<title>'+title(f,t,lang)+'</title>\n<meta name="description" content="'+metaDesc(f,t,lang)+'" />\n<link rel="canonical" href="'+self+'" />\n'+alts+'\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com/flights/'+slug+'" />\n'
    +'<meta property="og:title" content="'+title(f,t,lang)+'" /><meta property="og:description" content="'+metaDesc(f,t,lang)+'" /><meta property="og:url" content="'+self+'" /><meta property="og:type" content="website" /><meta property="og:image" content="https://oasisdeal.com/images/og-default.png" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content="https://oasisdeal.com/images/og-default.png" />\n'
    +'<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    +'<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/assets/site.css" />\n'
    +'<script type="application/ld+json">'+JSON.stringify(faqLd)+'</script>\n'
    +'<style>.rp-hero{background:linear-gradient(160deg,var(--majorelle) 0%,var(--majorelle-deep) 100%);color:#fff;padding:54px 0 48px}.rp-hero h1{color:#fff;font-size:clamp(2rem,5vw,3.1rem)}.rp-price{font-family:"Fraunces",serif;font-size:2.6rem;font-weight:600;margin-top:14px}.rp-price .pre{font-family:"IBM Plex Mono",monospace;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;opacity:.8;vertical-align:middle;margin-inline-end:6px}.rp-price small{display:block;font-family:"Inter";font-size:.9rem;font-weight:400;opacity:.85;margin-top:4px}'
    +'.rp-facts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:28px 0}@media(max-width:640px){.rp-facts{grid-template-columns:1fr}}.rp-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:22px}.rp-card h2{font-size:1.2rem;margin-bottom:8px}'
    +'.rp-cross{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:26px 0}.rp-cross .rp-card{display:flex;flex-direction:column;gap:10px}.rp-cross .btn{margin-top:auto}'
    +'.rp-faq details{border-bottom:1px solid var(--line);padding:14px 0}.rp-faq summary{cursor:pointer;font-weight:600;font-size:1.05rem}.rp-faq p{color:var(--ink-soft);margin-top:8px}.rp-note{font-size:.82rem;color:var(--ink-soft);margin-top:22px}.rp-langs a{margin-inline-start:8px;color:#fff;opacity:.7;text-decoration:none;font-size:.85rem}.rp-langs a.on{opacity:1;font-weight:700;text-decoration:underline}</style>\n<script data-cfasync="false">(function(){var s=document.createElement("script");s.async=1;s.src="https://tpembars.com/NTQzNDkw.js?t=543490";document.head.appendChild(s);})();</script></head>\n';
}
function nav(lang,slug){var x=L[lang];
  var langs=['en','fr','ar'].map(function(lg){return '<a class="'+(lg===lang?'on':'')+'" href="'+(lg==='en'?'':'/'+lg)+'/flights/'+slug+'">'+lg.toUpperCase()+'</a>';}).join('');
  return '<nav class="nav"><div class="container nav-row"><a class="logo" href="'+x.home+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a><div class="nav-links">'
    +'<a class="nav-link" href="'+x.home+'">'+x.nav.flights+'</a><a class="nav-link" href="'+x.hotels+'">'+x.nav.hotels+'</a><a class="nav-link" href="'+x.cars+'">'+x.nav.cars+'</a><a class="nav-link" href="'+x.transfers+'">'+x.nav.transfers+'</a><a class="nav-link" href="'+x.esim+'">'+x.nav.esim+'</a><a class="nav-link" href="'+x.comp+'">'+x.nav.comp+'</a><span class="nav-div"></span><a class="nav-link" href="'+(lang==='en'?'':'/'+lang)+'/destinations/">'+x.nav.dest+'</a><a class="nav-link" href="'+(lang==='en'?'':'/'+lang)+'/blog/">'+x.nav.blog+'</a><span class="rp-langs">'+langs+'</span></div></div></nav>';}
var NAVJS='<script>(function(){var C=\'.nav-div{display:inline-block;width:1px;height:18px;background:var(--line);margin:0 6px;vertical-align:middle;}.nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--paper);cursor:pointer;}.nav-toggle span{display:block;width:20px;height:2px;background:var(--ink);border-radius:2px;transition:transform .2s,opacity .2s;}.nav-row.menu-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg);}.nav-row.menu-open .nav-toggle span:nth-child(2){opacity:0;}.nav-row.menu-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}@media(max-width:1120px){.nav-div{display:none!important;}.nav-row{flex-wrap:nowrap!important;height:60px;position:relative;}.nav-toggle{display:flex;}.nav-links{position:absolute;top:100%;inset-inline-start:0;width:100%;flex-direction:column;align-items:stretch;gap:0!important;background:var(--paper);border:1px solid var(--line);border-radius:0 0 16px 16px;padding:8px;box-shadow:0 14px 30px rgba(24,26,46,.14);display:none!important;z-index:60;}.nav-row.menu-open .nav-links{display:flex!important;}.nav-links .nav-link{display:block!important;padding:13px 12px;font-size:1rem;border-bottom:1px solid var(--line);}.nav-links .btn{margin:10px 4px 4px;justify-content:center;}.nav-links .rp-langs{display:flex;justify-content:center;gap:16px;padding:12px;}.nav-links .rp-langs a{color:var(--ink);opacity:.75;}.nav-links .rp-langs a.on{opacity:1;}}\';function I(){var r=document.querySelector(".nav-row");if(!r||r.querySelector(".nav-toggle"))return;var l=r.querySelector(".nav-links");if(!l)return;var s=document.createElement("style");s.textContent=C;document.head.appendChild(s);var b=document.createElement("button");b.className="nav-toggle";b.type="button";b.setAttribute("aria-label","Menu");b.innerHTML="<span></span><span></span><span></span>";b.addEventListener("click",function(){r.classList.toggle("menu-open");});r.appendChild(b);l.addEventListener("click",function(e){if(e.target.closest("a"))r.classList.remove("menu-open");});}if(document.readyState!=="loading")I();else document.addEventListener("DOMContentLoaded",I);})();</script>';
function footer(lang){var x=L[lang];return '<footer class="footer"><div class="container"><div class="footer-trust">🔒 '+x.secure+' · Travelpayouts · Stay22 · AirHelp</div><div class="footer-bottom"><span>© <span id="y">2026</span> OasisDeal</span></div></div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS;}
function liveScript(f,t){return '<script>(function(){var O="'+f+'",D="'+t+'";function ddmm(s){var x=s?new Date(/T/.test(s)?s:s+"T00:00:00"):new Date(Date.now()+30*864e5);if(isNaN(x))x=new Date(Date.now()+30*864e5);return ("0"+x.getDate()).slice(-2)+("0"+(x.getMonth()+1)).slice(-2);}var FLY="https://fly.oasisdeal.com/?flightSearch=";Array.prototype.forEach.call(document.querySelectorAll("[data-fly]"),function(a){a.href=FLY+O+ddmm()+D+"1";});fetch("https://oasisdeal-fares.pages.dev/api/fares?origin="+O+"&destination="+D+"&currency=usd").then(function(r){return r.json();}).then(function(d){if(d&&d.price){var p=document.getElementById("lp");if(p)p.textContent="$"+Math.round(d.price);if(d.date){var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];var dt=new Date(d.date);var ld=document.getElementById("ld");if(ld)ld.textContent=dt.getDate()+" "+M[dt.getMonth()];Array.prototype.forEach.call(document.querySelectorAll("[data-fly]"),function(a){a.href=FLY+O+ddmm(d.date)+D+"1";});}else{var p2=document.getElementById("lp");if(p2)p2.textContent="—";}}else{var p3=document.getElementById("lp");if(p3)p3.textContent="—";}}).catch(function(){var p4=document.getElementById("lp");if(p4)p4.textContent="—";});})();</script>';}

function routePage(f,t,lang){
  var x=L[lang],c=nm(t,lang),slug=slugOf(f,t),dur=DUR[f+'-'+t];
  var airList=airlines(f,t).map(function(a){return '<li>'+a+'</li>';}).join('');
  var faqHtml=faqs(f,t,lang).map(function(q){return '<details><summary>'+q[0]+'</summary><p>'+q[1]+'</p></details>';}).join('');
  var facts='<div class="rp-card"><h2>'+x.airlines+'</h2><ul>'+airList+'</ul></div>';
  if(dur)facts+='<div class="rp-card"><h2>'+x.flighttime+'</h2><p style="font-size:1.6rem;font-family:Fraunces,serif;font-weight:600">'+dur+'</p><p style="color:var(--ink-soft)">'+x.direct+'</p></div>';
  var cross='';
  if(isEuro(t))cross+='<div class="rp-card"><h2>'+x.compH+'</h2><p style="color:var(--ink-soft);font-size:.95rem">'+x.compP+'</p><a class="btn btn-primary" href="'+x.comp+'">'+x.compCta+'</a></div>';
  cross+='<div class="rp-card"><h2>'+x.hotelH.replace('{city}',c)+'</h2><a class="btn btn-ghost" href="'+x.hotels+'">'+x.hotelCta+'</a></div>';
  if(!isDom(f,t))cross+='<div class="rp-card"><h2>'+x.esimH.replace('{city}',c)+'</h2><a class="btn btn-ghost" href="'+x.esim+'">'+x.esimCta+'</a></div>';
  return head(f,t,lang)+'<body>\n'+nav(lang,slug)
    +'<header class="rp-hero"><div class="container"><h1>'+h1(f,t,lang)+'</h1>'
    +'<div class="rp-price"><span class="pre">'+x.from+'</span><span id="lp">—</span><small>'+x.perRoute+' · <span id="ld"></span></small></div>'
    +'<div style="margin-top:22px"><a class="btn btn-primary" data-fly href="https://fly.oasisdeal.com">'+x.search+'</a></div></div></header>'
    +'<main class="container" style="padding:36px 0"><div class="rp-facts">'+facts+'</div>'
    +'<div class="rp-card" style="margin-bottom:26px"><h2>'+x.tipsH+'</h2><p style="color:var(--ink-soft)">'+tips(f,t,lang)+'</p></div>'
    +'<div class="rp-cross">'+cross+'</div>'
    +'<section class="rp-faq"><h2 style="margin-bottom:6px">'+x.faqH+'</h2>'+faqHtml+'</section><p class="rp-note">'+x.note+'</p></main>'
    +footer(lang)+liveScript(f,t)+STAY22+'\n</body>\n</html>\n';
}

// ---- guides (rights + airport comparisons) for the hub ----
var GUIDESH={en:'Travel guides & tips',fr:'Guides & conseils voyage',ar:'أدلة ونصائح السفر'};
var GUIDES={
  en:[['/flight-rights','Flight delay compensation — know your rights'],['/airports/casablanca-vs-tangier-flights-europe','Casablanca vs Tangier — cheapest airport to Europe'],['/airports/casablanca-vs-marrakech-flights-europe','Casablanca vs Marrakesh — cheapest to Europe'],['/airports/tangier-vs-nador-flights-spain','Tangier vs Nador — flights to Spain'],['/airports/casablanca-vs-rabat-flights-europe','Casablanca vs Rabat — flights to Europe'],['/airports/cheapest-airport-umrah-morocco','Cheapest airport for Umrah from Morocco']],
  fr:[['/flight-rights','Indemnisation de vol — connaître vos droits'],['/airports/casablanca-vs-tangier-flights-europe','Casablanca ou Tanger — aéroport le moins cher vers l’Europe'],['/airports/casablanca-vs-marrakech-flights-europe','Casablanca ou Marrakech — le moins cher vers l’Europe'],['/airports/tangier-vs-nador-flights-spain','Tanger ou Nador — vols vers l’Espagne'],['/airports/casablanca-vs-rabat-flights-europe','Casablanca ou Rabat — vols vers l’Europe'],['/airports/cheapest-airport-umrah-morocco','Aéroport le moins cher pour la Omra']],
  ar:[['/flight-rights','تعويض تأخّر الرحلة — اعرف حقوقك'],['/airports/casablanca-vs-tangier-flights-europe','الدار البيضاء أم طنجة — أرخص مطار لأوروبا'],['/airports/casablanca-vs-marrakech-flights-europe','الدار البيضاء أم مراكش — الأرخص لأوروبا'],['/airports/tangier-vs-nador-flights-spain','طنجة أم الناظور — رحلات إلى إسبانيا'],['/airports/casablanca-vs-rabat-flights-europe','الدار البيضاء أم الرباط — رحلات إلى أوروبا'],['/airports/cheapest-airport-umrah-morocco','أرخص مطار للعمرة من المغرب']],
};

function hubPage(lang){
  var x=L[lang];
  var ttl=lang==='en'?'Cheap Flights — Compare Routes & Prices | OasisDeal':lang==='fr'?'Vols pas chers — Comparez lignes et prix | OasisDeal':'تذاكر طيران رخيصة — قارن الوجهات والأسعار | OasisDeal';
  var desc=lang==='en'?'Compare cheap flights across hundreds of airlines — popular routes, live prices and the best time to book, cheapest first.':lang==='fr'?'Comparez les vols pas chers sur des centaines de compagnies — lignes populaires, tarifs en direct et meilleur moment pour réserver.':'قارن تذاكر الطيران الرخيصة عبر مئات الشركات — رحلات شائعة، أسعار مباشرة وأفضل وقت للحجز، الأرخص أولًا.';
  var hubH=lang==='en'?'Cheap flight routes':lang==='fr'?'Vols pas chers':'تذاكر طيران رخيصة';
  var intro=lang==='en'?'Pick your route to compare live prices across hundreds of airlines, with airlines and the best time to book.':lang==='fr'?'Choisissez votre trajet pour comparer les tarifs en direct, avec les compagnies et le meilleur moment pour réserver.':'اختر رحلتك لمقارنة الأسعار المباشرة عبر مئات الشركات، مع شركات الطيران وأفضل وقت للحجز.';
  var alts=['en','fr','ar'].map(function(lg){return '<link rel="alternate" hreflang="'+lg+'" href="https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+'/flights/" />';}).join('\n');
  var self='https://oasisdeal.com'+(lang==='en'?'':'/'+lang)+'/flights/';
  var seePrices=lang==='ar'?'اعرض الأسعار →':lang==='fr'?'Voir les prix →':'See prices →';
  var groups=ORIGINS.map(function(o){
    var rs=ROUTES.filter(function(r){return r[0]===o;});
    if(!rs.length)return '';
    var head2=(lang==='en'?'From ':lang==='fr'?'Depuis ':'من ')+nm(o,lang);
    var cards=rs.map(function(r){var c=nm(r[1],lang),href=(lang==='en'?'':'/'+lang)+'/flights/'+slugOf(r[0],r[1]);var label=lang==='ar'?nm(o,lang)+' ← '+c:nm(o,lang)+' → '+c;
      return '<a class="rp-card" style="text-decoration:none;color:inherit" href="'+href+'"><h2 style="font-size:1.05rem">'+label+'</h2><span style="color:var(--clay-deep);font-weight:600;font-size:.9rem">'+seePrices+'</span></a>';}).join('');
    return '<section class="origin-group" data-origin="'+o+'"><h2 class="origin-h" style="margin:30px 0 14px;font-size:1.4rem">'+head2+'</h2><div class="rp-grid">'+cards+'</div></section>';
  }).join('');
  var nearLbl=lang==='ar'?'📍 قريب منك':lang==='fr'?'📍 Près de chez vous':'📍 Near you';
  var reorderJs='<script>(function(){fetch("https://oasisdeal-fares.pages.dev/api/whereami").then(function(r){return r.json();}).then(function(g){var c=g&&g.origin;if(!c)return;var list=document.querySelectorAll(".origin-group");for(var i=0;i<list.length;i++){if(list[i].getAttribute("data-origin")===c){var s=list[i];s.parentNode.insertBefore(s,s.parentNode.firstChild);var h=s.querySelector(".origin-h");if(h&&!h.querySelector(".near-badge")){var b=document.createElement("span");b.className="near-badge";b.textContent="'+nearLbl+'";b.style.cssText="font-family:monospace;font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:var(--clay-deep);background:var(--sand);border:1px solid var(--line);border-radius:999px;padding:4px 9px;margin-inline-start:10px;vertical-align:middle";h.appendChild(b);}break;}}}).catch(function(){});})();</script>';
  var guides=GUIDES[lang].map(function(g){var href=(lang==='en'?'':'/'+lang)+g[0];return '<li><a style="color:var(--majorelle);font-weight:600;text-decoration:none" href="'+href+'">'+g[1]+' →</a></li>';}).join('');
  return '<!DOCTYPE html>\n<html lang="'+L[lang].lang+'" dir="'+L[lang].dir+'">\n<head>\n<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="p:domain_verify" content="1f6676c70992e08fca792b0978b916b9" />\n'
    +'<title>'+ttl+'</title>\n<meta name="description" content="'+desc+'" />\n<link rel="canonical" href="'+self+'" />\n'+alts+'\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com/flights/" />\n'
    +'<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    +'<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/assets/site.css" />\n'
    +'<style>.rp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}.rp-card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:18px;display:block}.rp-card:hover{border-color:var(--majorelle)}.rp-langs a{margin-inline-start:8px;color:#fff;opacity:.7;text-decoration:none;font-size:.85rem}.rp-langs a.on{opacity:1;font-weight:700;text-decoration:underline}</style>\n<script data-cfasync="false">(function(){var s=document.createElement("script");s.async=1;s.src="https://tpembars.com/NTQzNDkw.js?t=543490";document.head.appendChild(s);})();</script></head>\n<body>\n'
    +nav(lang,'casablanca-paris').replace(/\/flights\/casablanca-paris/g,(lang==='en'?'':'/'+lang)+'/flights/')
    +'<header class="rp-hero" style="background:linear-gradient(160deg,var(--majorelle) 0%,var(--majorelle-deep) 100%);color:#fff;padding:54px 0"><div class="container"><h1 style="color:#fff">'+hubH+'</h1><p style="opacity:.9;max-width:640px;margin-top:10px">'+intro+'</p></div></header>'
    +'<main class="container" style="padding:20px 0 36px">'+groups
    +'<section style="margin-top:40px"><h2 style="font-size:1.4rem;margin-bottom:14px">'+GUIDESH[lang]+'</h2><ul style="list-style:none;padding:0;line-height:2.1">'+guides+'</ul></section></main>'
    +footer(lang)+reorderJs+STAY22+'\n</body>\n</html>\n';
}

function ensure(p){fs.mkdirSync(p,{recursive:true});}
function write(rel,html){var ff=path.join(ROOT,rel);ensure(path.dirname(ff));fs.writeFileSync(ff,html);}
var count=0;
['en','fr','ar'].forEach(function(lang){
  var base=lang==='en'?'flights':path.join(lang,'flights');
  ROUTES.forEach(function(r){ write(path.join(base,slugOf(r[0],r[1])+'.html'),routePage(r[0],r[1],lang)); count++; });
  write(path.join(base,'index.html'),hubPage(lang));
});
console.log('wrote',count,'route pages +',3,'hubs');

// ---- sitemap ----
var urls=['/','/hotels','/cars','/transfers','/esim','/compensation','/terms','/cookies','/disclosure','/flight-rights','/fr/flight-rights','/ar/flight-rights','/about','/contact','/privacy'].map(function(p){return 'https://oasisdeal.com'+p;});
['','/fr','/ar'].forEach(function(pre){
  urls.push('https://oasisdeal.com'+pre+'/flights/');
  ROUTES.forEach(function(r){ urls.push('https://oasisdeal.com'+pre+'/flights/'+slugOf(r[0],r[1])); });
});
['casablanca-vs-tangier-flights-europe','casablanca-vs-marrakech-flights-europe','tangier-vs-nador-flights-spain','casablanca-vs-rabat-flights-europe','cheapest-airport-umrah-morocco'].forEach(function(slug){
  ['','/fr','/ar'].forEach(function(pre){ urls.push('https://oasisdeal.com'+pre+'/airports/'+slug); });
});
try{var dj=JSON.parse(fs.readFileSync(path.join(ROOT,'.dest-urls.json'),'utf8'));dj.forEach(function(u){if(urls.indexOf(u)===-1)urls.push(u);});}catch(e){}
try{var bj=JSON.parse(fs.readFileSync(path.join(ROOT,'.blog-urls.json'),'utf8'));bj.forEach(function(u){if(urls.indexOf(u)===-1)urls.push(u);});}catch(e){}
fs.writeFileSync(path.join(ROOT,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(function(u){return '  <url><loc>'+u+'</loc></url>';}).join('\n')+'\n</urlset>\n');
console.log('wrote sitemap.xml with',urls.length,'urls');

// ---- routes index for the homepage board/cards (deep-link to route pages) ----
var slugMap={}, cityMap={}; Object.keys(CITY).forEach(function(c){ slugMap[c]=CITY[c].slug; cityMap[c]=CITY[c].en; });
var pairs={}; ROUTES.forEach(function(r){ pairs[r[0]+'-'+r[1]]=1; });
write('assets/routes.js','window.OD_ROUTES='+JSON.stringify({slug:slugMap,city:cityMap,pairs:pairs})+';\n');
console.log('wrote assets/routes.js with',Object.keys(pairs).length,'route pairs');

/* ---- full multi-column footer (shared, appended to each generator) ---- */
function fullFooter(lang){
  var P=lang==='en'?'':'/'+lang, H=lang==='en'?'/':'/'+lang+'/';
  var T={en:{ex:'Explore',co:'Company',pr:'Top destinations',gu:'Guides',tag:'Find your savings oasis — flights, hotels and compensation, compared honestly.',flights:'Flights',hotels:'Hotels',cars:'Cars',transfers:'Transfers',esim:'eSIM',comp:'Compensation',dest:'Destinations',blog:'Blog',about:'About',contact:'Contact',privacy:'Privacy',terms:'Terms',cookies:'Cookies',disc:'Affiliate disclosure',rights:'Flight delay rights',umrah:'How to avoid jet lag',vs:'Best winter sun spots',allr:'All destinations →',secure:'Secure & free to use · No booking fees',r:[['dubai','Dubai'],['tokyo','Tokyo'],['paris','Paris']]},
    fr:{ex:'Explorer',co:'Société',pr:'Meilleures destinations',gu:'Guides',tag:'Trouvez votre oasis d’économies — vols, hôtels et indemnisation, comparés honnêtement.',flights:'Vols',hotels:'Hôtels',cars:'Voitures',transfers:'Transferts',esim:'eSIM',comp:'Indemnisation',dest:'Destinations',blog:'Blog',about:'À propos',contact:'Contact',privacy:'Confidentialité',terms:'Conditions',cookies:'Cookies',disc:'Divulgation d’affiliation',rights:'Indemnisation de vol',umrah:'Éviter le décalage horaire',vs:'Destinations soleil d’hiver',allr:'Toutes les destinations →',secure:'Sécurisé et gratuit · Sans frais',r:[['dubai','Dubaï'],['tokyo','Tokyo'],['paris','Paris']]},
    ar:{ex:'استكشف',co:'الشركة',pr:'أفضل الوجهات',gu:'أدلة',tag:'اعثر على واحة التوفير — رحلات وفنادق وتعويضات، نقارنها بصدق.',flights:'رحلات',hotels:'فنادق',cars:'سيارات',transfers:'النقل',esim:'eSIM',comp:'تعويضات',dest:'الوجهات',blog:'المدوّنة',about:'من نحن',contact:'اتصل بنا',privacy:'الخصوصية',terms:'الشروط',cookies:'الكوكيز',disc:'إفصاح الإحالة',rights:'تعويض تأخّر الرحلة',umrah:'كيف تتجنّب اضطراب الرحلات',vs:'وجهات شمس الشتاء',allr:'كل الوجهات →',secure:'آمن ومجاني · دون رسوم حجز',r:[['dubai','دبي'],['tokyo','طوكيو'],['paris','باريس']]}}[lang];
  function col(h,links){return '<div class="footer-col"><h4>'+h+'</h4>'+links.map(function(l){return '<a href="'+l[0]+'">'+l[1]+'</a>';}).join('')+'</div>';}
  var explore=col(T.ex,[[H,T.flights],['/hotels',T.hotels],['/cars',T.cars],['/transfers',T.transfers],['/esim',T.esim],['/compensation',T.comp],[P+'/destinations/',T.dest],[P+'/blog/',T.blog]]);
  var company=col(T.co,[['/about',T.about],['/contact',T.contact],['/privacy',T.privacy],['/terms',T.terms],['/cookies',T.cookies],['/disclosure',T.disc]]);
  var routes=col(T.pr,T.r.map(function(z){return [P+'/destinations/'+z[0],z[1]];}).concat([[P+'/destinations/',T.allr]]));
  var guides=col(T.gu,[[P+'/flight-rights',T.rights],[P+'/blog/how-to-avoid-jet-lag',T.umrah],[P+'/blog/best-winter-sun-destinations',T.vs]]);
  return '<footer class="footer"><div class="container">'
    +'<div class="footer-top"><div class="footer-brand"><a class="logo footer-logo" href="'+H+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a><p class="footer-tag">'+T.tag+'</p>'+'<div class="footer-social"><a class="footer-ig" href="https://www.instagram.com/oasisdealtravel/" target="_blank" rel="noopener" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg><span>Follow us on Instagram</span></a><script type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async></script><div class="trustpilot-widget" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="6a425cb3f6d6bcdc734d3d22" data-style-height="52px" data-style-width="100%" data-token="da476c82-b569-4dfe-bb19-b4af4c691150"><a href="https://www.trustpilot.com/review/oasisdeal.com" target="_blank" rel="noopener">Trustpilot</a></div></div>'+'</div>'
    +'<div class="footer-cols">'+explore+routes+guides+company+'</div></div>'
    +'<div class="footer-trust">🔒 '+T.secure+' · Travelpayouts · Stay22 · AirHelp</div>'
    +'<div class="footer-bottom"><span>© <span id="y">2026</span> OasisDeal</span></div>'
    +'</div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS;
}
function footer(lang){return fullFooter(lang);}


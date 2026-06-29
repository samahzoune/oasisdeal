/* OasisDeal destinations / travel-guide generator.
   A blog-style "Explore the world" hub + one guide page per destination,
   in EN / FR / AR (separate URLs + hreflang). Each guide: trending badge,
   live "cheapest from Casablanca" fare, best time to visit, highlights,
   currency/language, and cross-links to flights/hotels/eSIM/rights.
   Run: node build-destinations.cjs */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

// CMN routes that already have an on-site route page (deep-link target).
const CMN_ROUTE = {PAR:1,LON:1,MAD:1,AMS:1,IST:1,DXB:1,JED:1,BRU:1,MIL:1,LYS:1,DUS:1,FRA:1};
const EUROPE = {fr:1,uk:1,es:1,be:1,it:1,nl:1,de:1};

// region keys: eu / me / as / af
const DEST = [
  {code:'IST', slug:'istanbul',     region:'eu', trend:1, flag:'🇹🇷', cur:'TRY', lang_en:'Turkish', lang_fr:'Turc',      lang_ar:'التركية',  rslug:'casablanca-istanbul',
    en:'Where Europe meets Asia — grand bazaars, Bosphorus cruises and Ottoman palaces.', fr:'Là où l’Europe rencontre l’Asie — grands bazars, croisières sur le Bosphore et palais ottomans.', ar:'حيث تلتقي أوروبا بآسيا — أسواق كبرى، رحلات بحرية في مضيق البوسفور، وقصور عثمانية.',
    bt_en:'Apr–May & Sep–Oct', bt_fr:'avr.–mai & sep.–oct.', bt_ar:'أبريل–مايو وسبتمبر–أكتوبر', ar_name:'إسطنبول', fr_name:'Istanbul'},
  {code:'BCN', slug:'barcelona',    region:'eu', trend:1, flag:'🇪🇸', cur:'EUR', lang_en:'Spanish', lang_fr:'Espagnol', lang_ar:'الإسبانية', rslug:'',
    en:'Gaudí’s architecture, Mediterranean beaches and lively tapas nights.', fr:'L’architecture de Gaudí, les plages méditerranéennes et les soirées tapas animées.', ar:'عمارة غاودي، شواطئ البحر المتوسط، وأمسيات التاباس النابضة بالحياة.',
    bt_en:'May–Jun & Sep', bt_fr:'mai–juin & sep.', bt_ar:'مايو–يونيو وسبتمبر', ar_name:'برشلونة', fr_name:'Barcelone'},
  {code:'PAR', slug:'paris',        region:'eu', trend:0, flag:'🇫🇷', cur:'EUR', lang_en:'French', lang_fr:'Français', lang_ar:'الفرنسية', rslug:'casablanca-paris',
    en:'The City of Light — the Louvre, café terraces and the Eiffel Tower.', fr:'La Ville Lumière — le Louvre, les terrasses de café et la tour Eiffel.', ar:'مدينة النور — متحف اللوفر، مقاهي الأرصفة، وبرج إيفل.',
    bt_en:'Apr–Jun & Sep–Oct', bt_fr:'avr.–juin & sep.–oct.', bt_ar:'أبريل–يونيو وسبتمبر–أكتوبر', ar_name:'باريس', fr_name:'Paris'},
  {code:'MAD', slug:'madrid',       region:'eu', trend:0, flag:'🇪🇸', cur:'EUR', lang_en:'Spanish', lang_fr:'Espagnol', lang_ar:'الإسبانية', rslug:'casablanca-madrid',
    en:'World-class museums, grand plazas and Spain’s best nightlife.', fr:'Des musées de renommée mondiale, de grandes places et la meilleure vie nocturne d’Espagne.', ar:'متاحف عالمية، ساحات كبرى، وأفضل حياة ليلية في إسبانيا.',
    bt_en:'Mar–May & Sep–Nov', bt_fr:'mars–mai & sep.–nov.', bt_ar:'مارس–مايو وسبتمبر–نوفمبر', ar_name:'مدريد', fr_name:'Madrid'},
  {code:'AMS', slug:'amsterdam',    region:'eu', trend:0, flag:'🇳🇱', cur:'EUR', lang_en:'Dutch', lang_fr:'Néerlandais', lang_ar:'الهولندية', rslug:'casablanca-amsterdam',
    en:'Picturesque canals, world museums and bike-friendly streets.', fr:'Des canaux pittoresques, de grands musées et des rues adaptées au vélo.', ar:'قنوات مائية خلابة، متاحف عالمية، وشوارع صديقة للدراجات.',
    bt_en:'Apr–May & Sep', bt_fr:'avr.–mai & sep.', bt_ar:'أبريل–مايو وسبتمبر', ar_name:'أمستردام', fr_name:'Amsterdam'},
  {code:'LON', slug:'london',       region:'eu', trend:0, flag:'🇬🇧', cur:'GBP', lang_en:'English', lang_fr:'Anglais', lang_ar:'الإنجليزية', rslug:'casablanca-london',
    en:'Iconic landmarks, free museums and endless things to do.', fr:'Des monuments emblématiques, des musées gratuits et mille choses à faire.', ar:'معالم شهيرة، متاحف مجانية، وأنشطة لا تنتهي.',
    bt_en:'May–Sep', bt_fr:'mai–sep.', bt_ar:'مايو–سبتمبر', ar_name:'لندن', fr_name:'Londres'},
  {code:'DXB', slug:'dubai',        region:'me', trend:1, flag:'🇦🇪', cur:'AED', lang_en:'Arabic', lang_fr:'Arabe', lang_ar:'العربية', rslug:'casablanca-dubai',
    en:'Futuristic skylines, desert safaris and world-class shopping.', fr:'Des gratte-ciels futuristes, des safaris dans le désert et du shopping de classe mondiale.', ar:'ناطحات سحاب مستقبلية، رحلات سفاري صحراوية، وتسوق عالمي.',
    bt_en:'Nov–Mar', bt_fr:'nov.–mars', bt_ar:'نوفمبر–مارس', ar_name:'دبي', fr_name:'Dubaï'},
  {code:'JED', slug:'jeddah',       region:'me', trend:0, flag:'🇸🇦', cur:'SAR', lang_en:'Arabic', lang_fr:'Arabe', lang_ar:'العربية', rslug:'casablanca-jeddah',
    en:'Gateway to Umrah and the Red Sea, with the charming old town of Al-Balad.', fr:'Porte de la Omra et de la mer Rouge, avec la charmante vieille ville d’Al-Balad.', ar:'بوابة العمرة والبحر الأحمر، مع بلدة البلد القديمة الساحرة.',
    bt_en:'Nov–Mar', bt_fr:'nov.–mars', bt_ar:'نوفمبر–مارس', ar_name:'جدة', fr_name:'Djeddah'},
  {code:'BKK', slug:'bangkok',      region:'as', trend:1, flag:'🇹🇭', cur:'THB', lang_en:'Thai', lang_fr:'Thaï', lang_ar:'التايلاندية', rslug:'',
    en:'Glittering temples, legendary street food and buzzing night markets.', fr:'Des temples scintillants, une street-food légendaire et des marchés nocturnes animés.', ar:'معابد متلألئة، مأكولات شارع أسطورية، وأسواق ليلية نابضة.',
    bt_en:'Nov–Feb', bt_fr:'nov.–fév.', bt_ar:'نوفمبر–فبراير', ar_name:'بانكوك', fr_name:'Bangkok'},
  {code:'KUL', slug:'kuala-lumpur', region:'as', trend:1, flag:'🇲🇾', cur:'MYR', lang_en:'Malay', lang_fr:'Malais', lang_ar:'الماليزية', rslug:'',
    en:'The Petronas Towers, rainforest parks and incredible food courts.', fr:'Les tours Petronas, des parcs de forêt tropicale et une cuisine incroyable.', ar:'برجا بتروناس، حدائق الغابات المطيرة، وأطعمة مذهلة.',
    bt_en:'Dec–Feb', bt_fr:'déc.–fév.', bt_ar:'ديسمبر–فبراير', ar_name:'كوالالمبور', fr_name:'Kuala Lumpur'},
  {code:'ROM', slug:'rome',         region:'eu', trend:0, flag:'🇮🇹', cur:'EUR', lang_en:'Italian', lang_fr:'Italien', lang_ar:'الإيطالية', rslug:'',
    en:'The Colosseum, the Vatican and unforgettable Italian food.', fr:'Le Colisée, le Vatican et une cuisine italienne inoubliable.', ar:'الكولوسيوم، الفاتيكان، وطعام إيطالي لا يُنسى.',
    bt_en:'Apr–Jun & Sep–Oct', bt_fr:'avr.–juin & sep.–oct.', bt_ar:'أبريل–يونيو وسبتمبر–أكتوبر', ar_name:'روما', fr_name:'Rome'},
  {code:'CAI', slug:'cairo',        region:'af', trend:1, flag:'🇪🇬', cur:'EGP', lang_en:'Arabic', lang_fr:'Arabe', lang_ar:'العربية', rslug:'',
    en:'The Pyramids of Giza, the Nile and thousands of years of history.', fr:'Les pyramides de Gizeh, le Nil et des milliers d’années d’histoire.', ar:'أهرامات الجيزة، نهر النيل، وآلاف السنين من التاريخ.',
    bt_en:'Oct–Apr', bt_fr:'oct.–avr.', bt_ar:'أكتوبر–أبريل', ar_name:'القاهرة', fr_name:'Le Caire'},
];

const L = {
  en:{dir:'ltr',lang:'en',home:'/',dest:'/destinations/',hotels:'/hotels',esim:'/esim',comp:'/compensation',
      nav:{flights:'Flights',hotels:'Hotels',esim:'eSIM',dest:'Destinations',comp:'Compensation'},
      hubTitle:'Destinations — World Travel Guide for Morocco | OasisDeal',
      hubDesc:'Travel guides for explorers from Morocco — trending destinations, the best time to visit, highlights, and the cheapest flights from Casablanca.',
      hubH:'Explore the world', hubIntro:'Travel guides for explorers from Morocco — when to go, what to see, and the cheapest way to get there.',
      trending:'Trending now', regions:{eu:'Europe',me:'Middle East',as:'Asia',af:'Africa'},
      from:'from', fromCasa:'Cheapest from Casablanca', perGuide:'live lowest fare now',
      bestTime:'Best time to visit', why:'Why go', currency:'Currency', language:'Language', region:'Region',
      flights:'Find flights →', hotels:'Compare hotels →', esim:'Get a travel eSIM →', rights:'Know your rights →',
      faqH:'Frequently asked questions', back:'← All destinations', guideTag:'Destination guide',
      note:'Live starting fare from our partners; the final price is set by the airline. Visa and entry rules change — always confirm with official sources before booking.', secure:'Secure & free to use · No booking fees',
      mt:function(n){return n+' Travel Guide — Best Time, Highlights & Cheap Flights | OasisDeal';},
      md:function(n){return 'Travel guide to '+n+' from Morocco: the best time to visit, top highlights, currency and language, and the cheapest flights from Casablanca.';}},
  fr:{dir:'ltr',lang:'fr',home:'/fr/',dest:'/fr/destinations/',hotels:'/hotels',esim:'/esim',comp:'/compensation',
      nav:{flights:'Vols',hotels:'Hôtels',esim:'eSIM',dest:'Destinations',comp:'Indemnisation'},
      hubTitle:'Destinations — Guide de voyage mondial depuis le Maroc | OasisDeal',
      hubDesc:'Guides de voyage pour les explorateurs du Maroc — destinations tendance, meilleure période, incontournables et vols les moins chers depuis Casablanca.',
      hubH:'Explorez le monde', hubIntro:'Guides de voyage pour les explorateurs du Maroc — quand partir, quoi voir et comment y aller au meilleur prix.',
      trending:'Tendances du moment', regions:{eu:'Europe',me:'Moyen-Orient',as:'Asie',af:'Afrique'},
      from:'à partir de', fromCasa:'Le moins cher depuis Casablanca', perGuide:'tarif le plus bas en direct',
      bestTime:'Meilleure période', why:'Pourquoi y aller', currency:'Devise', language:'Langue', region:'Région',
      flights:'Trouver des vols →', hotels:'Comparer les hôtels →', esim:'Obtenir une eSIM voyage →', rights:'Connaître vos droits →',
      faqH:'Questions fréquentes', back:'← Toutes les destinations', guideTag:'Guide de destination',
      note:'Tarif de départ en direct via nos partenaires ; le prix final est fixé par la compagnie. Les règles de visa et d’entrée changent — vérifiez toujours auprès des sources officielles avant de réserver.', secure:'Sécurisé et gratuit · Sans frais',
      mt:function(n){return 'Guide de voyage à '+n+' — Meilleure période, incontournables & vols pas chers | OasisDeal';},
      md:function(n){return 'Guide de voyage à '+n+' depuis le Maroc : meilleure période, incontournables, devise et langue, et les vols les moins chers depuis Casablanca.';}},
  ar:{dir:'rtl',lang:'ar',home:'/ar/',dest:'/ar/destinations/',hotels:'/hotels',esim:'/esim',comp:'/compensation',
      nav:{flights:'رحلات',hotels:'فنادق',esim:'eSIM',dest:'الوجهات',comp:'تعويضات'},
      hubTitle:'الوجهات — دليل السفر حول العالم من المغرب | OasisDeal',
      hubDesc:'أدلة سفر للمسافرين من المغرب — الوجهات الرائجة، أفضل وقت للزيارة، أبرز المعالم، وأرخص الرحلات من الدار البيضاء.',
      hubH:'اكتشف العالم', hubIntro:'أدلة سفر للمسافرين من المغرب — متى تسافر، وماذا تشاهد، وكيف تصل بأرخص سعر.',
      trending:'الرائج الآن', regions:{eu:'أوروبا',me:'الشرق الأوسط',as:'آسيا',af:'أفريقيا'},
      from:'ابتداءً من', fromCasa:'الأرخص من الدار البيضاء', perGuide:'أرخص سعر مباشر الآن',
      bestTime:'أفضل وقت للزيارة', why:'لماذا تزورها', currency:'العملة', language:'اللغة', region:'المنطقة',
      flights:'ابحث عن رحلات →', hotels:'قارن الفنادق →', esim:'احصل على eSIM للسفر →', rights:'اعرف حقوقك →',
      faqH:'أسئلة شائعة', back:'→ كل الوجهات', guideTag:'دليل وجهة',
      note:'سعر البداية مباشر من شركائنا؛ السعر النهائي تحدّده شركة الطيران. قواعد التأشيرة والدخول تتغيّر — تأكّد دائمًا من المصادر الرسمية قبل الحجز.', secure:'آمن ومجاني · دون رسوم حجز',
      mt:function(n){return 'دليل السفر إلى '+n+' — أفضل وقت، أبرز المعالم، ورحلات رخيصة | OasisDeal';},
      md:function(n){return 'دليل السفر إلى '+n+' من المغرب: أفضل وقت للزيارة، أبرز المعالم، العملة واللغة، وأرخص الرحلات من الدار البيضاء.';}},
};

function nm(d,lang){ return lang==='ar'?d.ar_name : lang==='fr'?d.fr_name : d.slug.charAt(0).toUpperCase()+d.slug.slice(1).replace('-',' ').replace(/\b\w/g,function(c){return c.toUpperCase();}); }
function nameEN(d){ return d.slug.split('-').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' '); }
function dname(d,lang){ return lang==='en'?nameEN(d): lang==='fr'?d.fr_name : d.ar_name; }
function hi(d,lang){ return lang==='en'?d.en : lang==='fr'?d.fr : d.ar; }
function bt(d,lang){ return lang==='en'?d.bt_en : lang==='fr'?d.bt_fr : d.bt_ar; }
function langName(d,lang){ return lang==='en'?d.lang_en : lang==='fr'?d.lang_fr : d.lang_ar; }
function isEuro(d){ return d.region==='eu'; }

const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#E8A33D"/><path d="M16 22c0-7 3-10 8-11-1 6-3 9-8 11z" fill="#241F5E"/><path d="M16 22c0-7-3-10-8-11 1 6 3 9 8 11z" fill="#4B3FCB"/><rect x="14.6" y="20" width="2.8" height="5" rx="1" fill="#241F5E"/></svg>';

var NAVJS='<script>(function(){var C=\'.nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--paper);cursor:pointer;}.nav-toggle span{display:block;width:20px;height:2px;background:var(--ink);border-radius:2px;transition:transform .2s,opacity .2s;}.nav-row.menu-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg);}.nav-row.menu-open .nav-toggle span:nth-child(2){opacity:0;}.nav-row.menu-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}@media(max-width:720px){.nav-row{flex-wrap:nowrap!important;height:60px;position:relative;}.nav-toggle{display:flex;}.nav-links{position:absolute;top:100%;inset-inline-start:0;width:100%;flex-direction:column;align-items:stretch;gap:0!important;background:var(--paper);border:1px solid var(--line);border-radius:0 0 16px 16px;padding:8px;box-shadow:0 14px 30px rgba(24,26,46,.14);display:none!important;z-index:60;}.nav-row.menu-open .nav-links{display:flex!important;}.nav-links .nav-link{display:block!important;padding:13px 12px;font-size:1rem;border-bottom:1px solid var(--line);}.nav-links .btn{margin:10px 4px 4px;justify-content:center;}.nav-links .rp-langs{display:flex;justify-content:center;gap:16px;padding:12px;}.nav-links .rp-langs a{color:var(--ink);opacity:.75;}.nav-links .rp-langs a.on{opacity:1;}}\';function I(){var r=document.querySelector(".nav-row");if(!r||r.querySelector(".nav-toggle"))return;var l=r.querySelector(".nav-links");if(!l)return;var s=document.createElement("style");s.textContent=C;document.head.appendChild(s);var b=document.createElement("button");b.className="nav-toggle";b.type="button";b.setAttribute("aria-label","Menu");b.innerHTML="<span></span><span></span><span></span>";b.addEventListener("click",function(){r.classList.toggle("menu-open");});r.appendChild(b);l.addEventListener("click",function(e){if(e.target.closest("a"))r.classList.remove("menu-open");});}if(document.readyState!=="loading")I();else document.addEventListener("DOMContentLoaded",I);})();</script>';

function nav(lang, langsHtml){ var x=L[lang];
  return '<nav class="nav"><div class="container nav-row"><a class="logo" href="'+x.home+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a><div class="nav-links">'
    +'<a class="nav-link" href="'+x.home+'">'+x.nav.flights+'</a><a class="nav-link" href="'+x.hotels+'">'+x.nav.hotels+'</a><a class="nav-link" href="'+x.esim+'">'+x.nav.esim+'</a><a class="nav-link active" href="'+x.dest+'">'+x.nav.dest+'</a><a class="nav-link" href="'+x.comp+'">'+x.nav.comp+'</a>'
    +(langsHtml?'<span class="rp-langs">'+langsHtml+'</span>':'')+'</div></div></nav>'; }
function footer(lang){ var x=L[lang]; return '<footer class="footer"><div class="container"><div class="footer-trust">🔒 '+x.secure+' · Travelpayouts · Stay22 · AirHelp</div><div class="footer-bottom"><span>© <span id="y"></span> OasisDeal</span></div></div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS; }

var EXTRA = '<style>.dg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}'
  +'.dg-card{position:relative;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:20px;display:block;text-decoration:none;color:inherit;transition:border-color .15s,transform .15s}'
  +'.dg-card:hover{border-color:var(--majorelle);transform:translateY(-2px)}'
  +'.dg-flag{font-size:1.8rem;line-height:1}.dg-name{font-family:"Fraunces",serif;font-size:1.2rem;margin:8px 0 2px}'
  +'.dg-region{font-family:"IBM Plex Mono",monospace;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft)}'
  +'.dg-why{color:var(--ink-soft);font-size:.9rem;margin-top:10px;line-height:1.5}'
  +'.dg-price{margin-top:12px;font-family:"IBM Plex Mono",monospace;font-size:.82rem;color:var(--clay-deep);font-weight:600}'
  +'.dg-badge{position:absolute;top:14px;inset-inline-end:14px;background:var(--saffron);color:#241F5E;font-family:"IBM Plex Mono",monospace;font-size:.58rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:999px}'
  +'.dg-sec h2{font-size:1.4rem;margin:34px 0 14px}</style>';

function liveScript(codes){
  return '<script>(function(){var FLY="https://fly.oasisdeal.com/?flightSearch=";function ddmm(){var x=new Date(Date.now()+21*864e5);return ("0"+x.getDate()).slice(-2)+("0"+(x.getMonth()+1)).slice(-2);}'
    +'Array.prototype.forEach.call(document.querySelectorAll("[data-fly]"),function(a){a.href=FLY+"CMN"+ddmm()+a.getAttribute("data-fly")+"1";});'
    +'function load(code,el){fetch("https://oasisdeal-fares.pages.dev/api/fares?origin=CMN&destination="+code+"&currency=usd").then(function(r){return r.json();}).then(function(d){el.textContent=(d&&d.price)?("$"+Math.round(d.price)):"";}).catch(function(){el.textContent="";});}'
    +'Array.prototype.forEach.call(document.querySelectorAll("[data-price]"),function(el){load(el.getAttribute("data-price"),el);});})();</script>';
}

function head(lang, title, desc, canon, alts){
  return '<!DOCTYPE html>\n<html lang="'+L[lang].lang+'" dir="'+L[lang].dir+'">\n<head>\n<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    +'<title>'+title+'</title>\n<meta name="description" content="'+desc+'" />\n<link rel="canonical" href="'+canon+'" />\n'+alts+'\n'
    +'<meta property="og:title" content="'+title+'" /><meta property="og:description" content="'+desc+'" /><meta property="og:url" content="'+canon+'" /><meta property="og:type" content="website" />\n'
    +'<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    +'<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n<link rel="stylesheet" href="/assets/site.css" />\n'+EXTRA+'\n</head>\n<body>\n';
}

function pre(lang){ return lang==='en'?'':'/'+lang; }
function altsFor(p){ return ['en','fr','ar'].map(function(lg){return '<link rel="alternate" hreflang="'+lg+'" href="https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+p+'" />';}).join('\n')+'\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com'+p+'" />'; }
function langSwitch(lang, p){ return ['en','fr','ar'].map(function(lg){return '<a class="'+(lg===lang?'on':'')+'" href="'+(lg==='en'?'':'/'+lg)+p+'">'+lg.toUpperCase()+'</a>';}).join(''); }

function guidePage(d, lang){
  var x=L[lang], n=dname(d,lang), p='/destinations/'+d.slug;
  var faqs=[
    [ (lang==='en'?'When is the best time to visit '+n+'?': lang==='fr'?'Quelle est la meilleure période pour visiter '+n+' ?':'ما أفضل وقت لزيارة '+n+'؟'),
      (lang==='en'?'The best months are usually '+bt(d,lang)+' for pleasant weather. Fares are often lower mid-week and outside school holidays.': lang==='fr'?'Les meilleurs mois sont généralement '+bt(d,lang)+' pour un temps agréable. Les tarifs sont souvent plus bas en milieu de semaine et hors vacances scolaires.':'أفضل الأشهر عادةً '+bt(d,lang)+' لطقس لطيف. وغالبًا تكون الأسعار أقل في منتصف الأسبوع وخارج العطل المدرسية.') ],
    [ (lang==='en'?'How much is a flight to '+n+' from Morocco?': lang==='fr'?'Combien coûte un vol pour '+n+' depuis le Maroc ?':'كم تكلّف رحلة إلى '+n+' من المغرب؟'),
      (lang==='en'?'Fares change daily — see the live starting price above. Compare every airline in one search to grab the lowest fare for your dates.': lang==='fr'?'Les tarifs changent chaque jour — voyez le prix de départ en direct ci-dessus. Comparez toutes les compagnies en une recherche pour le tarif le plus bas.':'تتغيّر الأسعار يوميًا — انظر سعر البداية المباشر أعلاه. قارن جميع الشركات في بحث واحد للحصول على أرخص سعر لتواريخك.') ],
    [ (lang==='en'?'Do Moroccan travellers need a visa for '+n+'?': lang==='fr'?'Les voyageurs marocains ont-ils besoin d’un visa pour '+n+' ?':'هل يحتاج المسافرون المغاربة تأشيرة لـ '+n+'؟'),
      (lang==='en'?'Entry rules change often. Always confirm the current requirements for your passport with the official embassy or consulate before booking — we compare flights, not visas.': lang==='fr'?'Les règles d’entrée changent souvent. Vérifiez toujours les conditions actuelles pour votre passeport auprès de l’ambassade ou du consulat officiel avant de réserver — nous comparons les vols, pas les visas.':'تتغيّر قواعد الدخول كثيرًا. تأكّد دائمًا من المتطلبات الحالية لجواز سفرك لدى السفارة أو القنصلية الرسمية قبل الحجز — نحن نقارن الرحلات لا التأشيرات.') ],
  ];
  var faqLd={'@context':'https://schema.org','@type':'FAQPage','mainEntity':faqs.map(function(q){return {'@type':'Question','name':q[0],'acceptedAnswer':{'@type':'Answer','text':q[1]}};})};
  var flightsHref = d.rslug && CMN_ROUTE[d.code] ? (pre(lang)+'/flights/'+d.rslug) : '#';
  var flightsAttr = (d.rslug && CMN_ROUTE[d.code]) ? ('href="'+flightsHref+'"') : ('href="#" data-fly="'+d.code+'"');
  var crossHtml = '<div class="rp-cross">'
    + card(lang==='en'?'Flights':lang==='fr'?'Vols':'الرحلات', x.fromCasa, 'btn-primary', flightsAttr, x.flights)
    + card(lang==='en'?'Hotels':lang==='fr'?'Hôtels':'الفنادق', (lang==='en'?'Compare stays in '+n:lang==='fr'?'Comparez les hôtels à '+n:'قارن الإقامة في '+n), 'btn-ghost', 'href="'+x.hotels+'"', x.hotels)
    + card('eSIM', (lang==='en'?'Stay online in '+n:lang==='fr'?'Restez connecté à '+n:'ابقَ متصلًا في '+n), 'btn-ghost', 'href="'+x.esim+'"', x.esim)
    + (isEuro(d)? card(lang==='en'?'Your rights':lang==='fr'?'Vos droits':'حقوقك', (lang==='en'?'Delayed or cancelled flight?':lang==='fr'?'Vol retardé ou annulé ?':'رحلة متأخرة أو ملغاة؟'), 'btn-ghost', 'href="'+pre(lang)+'/flight-rights"', x.rights) : '')
    + '</div>';

  return head(lang, x.mt(n), x.md(n), 'https://oasisdeal.com'+pre(lang)+p, altsFor(p))
    + nav(lang, langSwitch(lang,p))
    + '<script type="application/ld+json">'+JSON.stringify(faqLd)+'</script>'
    + '<header class="rp-hero"><div class="container">'
    + '<div class="eyebrow" style="opacity:.85;margin-bottom:8px">'+d.flag+' '+x.regions[d.region]+' · '+x.guideTag+'</div>'
    + '<h1 style="color:#fff">'+n+'</h1>'
    + '<p style="opacity:.92;max-width:640px;margin-top:10px;font-size:1.05rem">'+hi(d,lang)+'</p>'
    + '<div class="rp-price"><span class="pre">'+x.fromCasa+'</span><span data-price="'+d.code+'">—</span><small>'+x.perGuide+'</small></div>'
    + '</div></header>'
    + '<main class="container" style="padding:30px 0 40px">'
    + '<div class="rp-facts">'
    + '<div class="rp-card"><h2>'+x.bestTime+'</h2><p style="color:var(--ink-soft)">'+bt(d,lang)+'</p></div>'
    + '<div class="rp-card"><h2>'+x.why+'</h2><p style="color:var(--ink-soft)">'+hi(d,lang)+'</p></div>'
    + '<div class="rp-card"><h2>'+x.currency+'</h2><p style="color:var(--ink-soft)">'+d.cur+'</p></div>'
    + '<div class="rp-card"><h2>'+x.language+'</h2><p style="color:var(--ink-soft)">'+langName(d,lang)+'</p></div>'
    + '</div>'
    + crossHtml
    + '<section class="rp-faq" style="margin-top:34px"><h2 style="font-size:1.4rem;margin-bottom:10px">'+x.faqH+'</h2>'
    + faqs.map(function(q){return '<details><summary>'+q[0]+'</summary><p>'+q[1]+'</p></details>';}).join('')
    + '</section>'
    + '<p class="rp-note">'+x.note+'</p>'
    + '<p style="margin-top:18px"><a href="'+x.dest+'" style="color:var(--majorelle);font-weight:600;text-decoration:none">'+x.back+'</a></p>'
    + '</main>'
    + footer(lang) + liveScript([d.code]) + '\n</body>\n</html>\n';
}

function card(title, sub, btnClass, attr, label){
  return '<div class="rp-card"><h2>'+title+'</h2><p style="color:var(--ink-soft);flex:1">'+sub+'</p><a class="btn '+btnClass+'" '+attr+'>'+label+'</a></div>';
}

function destCard(d, lang){
  var p='/destinations/'+d.slug, href=(lang==='en'?'':'/'+lang)+p;
  return '<a class="dg-card" href="'+href+'">'
    + (d.trend? '<span class="dg-badge">'+L[lang].trending+'</span>':'')
    + '<div class="dg-flag">'+d.flag+'</div>'
    + '<div class="dg-name">'+dname(d,lang)+'</div>'
    + '<div class="dg-region">'+L[lang].regions[d.region]+'</div>'
    + '<div class="dg-why">'+hi(d,lang)+'</div>'
    + '<div class="dg-price">'+L[lang].from+' <span data-price="'+d.code+'">—</span></div>'
    + '</a>';
}

function hubPage(lang){
  var x=L[lang], p='/destinations/';
  var trend = DEST.filter(function(d){return d.trend;});
  var trendHtml = '<section class="dg-sec"><h2>🔥 '+x.trending+'</h2><div class="dg-grid">'+trend.map(function(d){return destCard(d,lang);}).join('')+'</div></section>';
  var order=['eu','me','as','af'];
  var regionsHtml = order.map(function(rk){
    var list=DEST.filter(function(d){return d.region===rk;});
    if(!list.length) return '';
    return '<section class="dg-sec"><h2>'+x.regions[rk]+'</h2><div class="dg-grid">'+list.map(function(d){return destCard(d,lang);}).join('')+'</div></section>';
  }).join('');
  return head(lang, x.hubTitle, x.hubDesc, 'https://oasisdeal.com'+pre(lang)+p, altsFor(p))
    + nav(lang, langSwitch(lang,p))
    + '<header class="rp-hero"><div class="container"><h1 style="color:#fff">'+x.hubH+'</h1><p style="opacity:.92;max-width:660px;margin-top:10px;font-size:1.05rem">'+x.hubIntro+'</p></div></header>'
    + '<main class="container" style="padding:20px 0 44px">'+trendHtml+regionsHtml+'</main>'
    + footer(lang) + liveScript(DEST.map(function(d){return d.code;})) + '\n</body>\n</html>\n';
}

function ensure(p){fs.mkdirSync(p,{recursive:true});}
function write(rel,html){var ff=path.join(ROOT,rel);ensure(path.dirname(ff));fs.writeFileSync(ff,html);}

var count=0;
['en','fr','ar'].forEach(function(lang){
  var base=lang==='en'?'destinations':path.join(lang,'destinations');
  DEST.forEach(function(d){ write(path.join(base,d.slug+'.html'), guidePage(d,lang)); count++; });
  write(path.join(base,'index.html'), hubPage(lang));
});
console.log('wrote', count, 'destination guides +', 3, 'hubs');

// ---- merge destination URLs into sitemap.xml (idempotent) ----
var destUrls=[];
['','/fr','/ar'].forEach(function(pre){
  destUrls.push('https://oasisdeal.com'+pre+'/destinations/');
  DEST.forEach(function(d){ destUrls.push('https://oasisdeal.com'+pre+'/destinations/'+d.slug); });
});
var smPath=path.join(ROOT,'sitemap.xml');
if(fs.existsSync(smPath)){
  var sm=fs.readFileSync(smPath,'utf8');
  destUrls.forEach(function(u){
    if(sm.indexOf('<loc>'+u+'</loc>')===-1){ sm=sm.replace('</urlset>','  <url><loc>'+u+'</loc></url>\n</urlset>'); }
  });
  fs.writeFileSync(smPath,sm);
  console.log('merged', destUrls.length, 'destination urls into sitemap.xml');
}
fs.writeFileSync(path.join(ROOT,'.dest-urls.json'), JSON.stringify(destUrls));

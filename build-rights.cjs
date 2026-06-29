/* Generates the passenger-rights guide in EN/FR/Darija as separate SEO pages
   (/flight-rights, /fr/flight-rights, /ar/flight-rights) with hreflang, HowTo +
   FAQPage schema, and a handoff to the on-site compensation checker / AirHelp.
   Run: node build-rights.cjs */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const AIRHELP = 'https://airhelp.tpx.lu/EkCWcqrW';
const SLUG = 'flight-rights';

const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="#E8A33D"/><path d="M16 22c0-7 3-10 8-11-1 6-3 9-8 11z" fill="#241F5E"/><path d="M16 22c0-7-3-10-8-11 1 6 3 9 8 11z" fill="#4B3FCB"/><rect x="14.6" y="20" width="2.8" height="5" rx="1" fill="#241F5E"/></svg>';

const P = {
  en: {
    dir:'ltr', lang:'en', home:'/', hotels:'/hotels', esim:'/esim', comp:'/compensation',
    nav:{flights:'Flights',hotels:'Hotels',esim:'eSIM',dest:'Destinations',comp:'Compensation'},
    title:'Flight Delay Compensation Rights — Claim up to €600 | OasisDeal',
    desc:'Know your air passenger rights. If your flight was delayed 3+ hours, cancelled or overbooked, you can claim up to €600 under EU law — including many Morocco–Europe flights. Here’s how.',
    h1:'Know your flight rights', lead:'Most travellers never claim the money airlines owe them. If your flight was delayed, cancelled or overbooked, EU law (EC 261) can entitle you to up to €600 — even for flights from the last few years.',
    amtsH:'What you can be owed', amts:[['€250','Short flights up to 1,500 km'],['€400','Medium flights, 1,500–3,500 km'],['€600','Long flights over 3,500 km']],
    coverH:'Which flights are covered', coverP:'EC 261 covers any flight departing an EU/UK airport, and flights arriving in the EU/UK on a European airline. That includes many routes to and from Morocco — for example Casablanca–Paris on a European carrier, or any flight leaving a European airport back to Morocco.',
    whenH:'When you can claim', when:['Arrived 3+ hours late at your destination','Flight cancelled with less than 14 days’ notice','Denied boarding because the flight was overbooked','Missed a connection because of a delay'],
    notH:'When you usually can’t', notP:'Extraordinary circumstances outside the airline’s control — severe weather, strikes by third parties, political instability or safety risks — are generally not eligible.',
    howH:'How to claim — step by step', steps:[
      ['Check if you’re eligible','Use our free 30-second checker to see if your flight qualifies under EC 261.'],
      ['Gather your flight details','Your booking reference, flight number and date are usually enough — no need for receipts.'],
      ['Submit your claim','File free through our partner AirHelp. They handle the airline and the paperwork for you.'],
      ['Get paid','It’s no-win, no-fee — if the claim succeeds, the money goes to you minus a success fee. If it fails, you pay nothing.']],
    ctaH:'Check what you’re owed', ctaP:'Free, takes 2 minutes, and you only pay if your claim wins.', cta:'Check my compensation →', cta2:'Start my free claim →',
    faqH:'Flight-rights FAQ', faq:[
      ['How far back can I claim?','Usually flights from the last 1–3 years, and longer in some countries. If you’ve had a bad flight recently, it’s worth checking.'],
      ['How much does it cost to claim?','Checking is free, and claims are no-win, no-fee. A success commission is taken only if you get paid.'],
      ['Do Morocco–Europe flights count?','Often yes — any flight leaving a European airport is covered, and flights into Europe on a European airline are too.'],
      ['What if the airline refuses?','Our partner handles the dispute and, if needed, escalates it legally on your behalf.']],
    note:'OasisDeal is not a law firm; claims are handled by our partner AirHelp. We may earn a commission at no extra cost to you.',
    secure:'Secure & free to use · No win, no fee'
  },
  fr: {
    dir:'ltr', lang:'fr', home:'/fr/', hotels:'/hotels', esim:'/esim', comp:'/compensation',
    nav:{flights:'Vols',hotels:'Hôtels',esim:'eSIM',dest:'Destinations',comp:'Indemnisation'},
    title:'Droits des passagers aériens — Réclamez jusqu’à 600 € | OasisDeal',
    desc:'Connaissez vos droits. Vol retardé de 3 h+, annulé ou surréservé ? Vous pouvez réclamer jusqu’à 600 € selon la loi européenne (CE 261) — y compris sur de nombreux vols Maroc–Europe.',
    h1:'Connaissez vos droits passager', lead:'La plupart des voyageurs ne réclament jamais l’argent que les compagnies leur doivent. Vol retardé, annulé ou surréservé ? La loi européenne (CE 261) peut vous donner droit à 600 € — même pour des vols des dernières années.',
    amtsH:'Ce à quoi vous avez droit', amts:[['250 €','Vols courts jusqu’à 1 500 km'],['400 €','Vols moyens, 1 500–3 500 km'],['600 €','Vols longs de plus de 3 500 km']],
    coverH:'Quels vols sont couverts', coverP:'Le règlement CE 261 couvre tout vol au départ d’un aéroport de l’UE/RU, et les vols arrivant dans l’UE/RU sur une compagnie européenne. Cela inclut de nombreuses lignes vers et depuis le Maroc — par exemple Casablanca–Paris sur une compagnie européenne.',
    whenH:'Quand réclamer', when:['Arrivée avec 3 h+ de retard à destination','Vol annulé avec moins de 14 jours de préavis','Refus d’embarquement pour surréservation','Correspondance manquée à cause d’un retard'],
    notH:'Quand ce n’est généralement pas possible', notP:'Les circonstances extraordinaires hors du contrôle de la compagnie — météo grave, grèves de tiers, instabilité politique ou risques de sécurité — ne sont généralement pas éligibles.',
    howH:'Comment réclamer — étape par étape', steps:[
      ['Vérifiez votre éligibilité','Utilisez notre vérificateur gratuit (30 s) pour voir si votre vol est éligible au CE 261.'],
      ['Rassemblez les détails du vol','Votre référence de réservation, le numéro et la date du vol suffisent généralement.'],
      ['Déposez votre demande','Gratuitement via notre partenaire AirHelp, qui gère la compagnie et les démarches.'],
      ['Recevez votre argent','Sans gain, sans frais — en cas de succès, l’argent vous revient moins une commission. Sinon, vous ne payez rien.']],
    ctaH:'Vérifiez ce qu’on vous doit', ctaP:'Gratuit, 2 minutes, et vous ne payez que si votre dossier aboutit.', cta:'Vérifier mon indemnisation →', cta2:'Démarrer mon dossier gratuit →',
    faqH:'FAQ droits des passagers', faq:[
      ['Jusqu’à quand puis-je réclamer ?','En général les vols des 1 à 3 dernières années, davantage dans certains pays.'],
      ['Combien coûte une réclamation ?','La vérification est gratuite et c’est sans gain, sans frais. Une commission n’est prélevée qu’en cas de succès.'],
      ['Les vols Maroc–Europe comptent-ils ?','Souvent oui — tout vol au départ d’un aéroport européen est couvert, ainsi que les vols vers l’Europe sur une compagnie européenne.'],
      ['Et si la compagnie refuse ?','Notre partenaire gère le litige et l’escalade juridiquement si nécessaire.']],
    note:'OasisDeal n’est pas un cabinet juridique ; les dossiers sont gérés par notre partenaire AirHelp. Nous pouvons percevoir une commission sans surcoût pour vous.',
    secure:'Sécurisé et gratuit · Sans gain, sans frais'
  },
  ar: {
    dir:'rtl', lang:'ar', home:'/ar/', hotels:'/hotels', esim:'/esim', comp:'/compensation',
    nav:{flights:'رحلات',hotels:'فنادق',esim:'eSIM',dest:'الوجهات',comp:'تعويضات'},
    title:'حقوق المسافر الجوي — طالب بما يصل إلى 600 يورو | OasisDeal',
    desc:'اعرف حقوقك. إذا تأخرت رحلتك 3 ساعات أو أُلغيت أو تعرّضت لتجاوز الحجز، يمكنك المطالبة بما يصل إلى 600 يورو بموجب قانون الاتحاد الأوروبي (EC 261) — بما في ذلك كثير من رحلات المغرب–أوروبا.',
    h1:'اعرف حقوقك الجوية', lead:'معظم المسافرين لا يطالبون أبدًا بالأموال التي تدين بها لهم شركات الطيران. إذا تأخرت رحلتك أو أُلغيت أو تعرّضت لتجاوز الحجز، فقد يمنحك قانون الاتحاد الأوروبي (EC 261) الحق في ما يصل إلى 600 يورو — حتى على رحلات من سنوات ماضية.',
    amtsH:'كم يمكنك أن تطالب', amts:[['250 يورو','رحلات قصيرة حتى 1500 كم'],['400 يورو','رحلات متوسطة، 1500–3500 كم'],['600 يورو','رحلات طويلة أكثر من 3500 كم']],
    coverH:'ما الرحلات المشمولة', coverP:'يشمل قانون EC 261 أي رحلة تقلع من مطار في الاتحاد الأوروبي/بريطانيا، والرحلات الواصلة إلى أوروبا على شركة أوروبية. ويشمل ذلك كثيرًا من الخطوط من وإلى المغرب — مثل الدار البيضاء–باريس على شركة أوروبية.',
    whenH:'متى يمكنك المطالبة', when:['وصلت إلى وجهتك متأخرًا 3 ساعات أو أكثر','أُلغيت الرحلة بإشعار أقل من 14 يومًا','مُنعت من الصعود بسبب تجاوز الحجز','فاتتك رحلة الربط بسبب التأخير'],
    notH:'متى لا يمكنك عادةً', notP:'الظروف الاستثنائية الخارجة عن إرادة الشركة — طقس خطير، إضرابات أطراف خارجية، عدم استقرار سياسي أو مخاطر على السلامة — لا تترتّب عليها عادةً تعويضات.',
    howH:'كيف تطالب — خطوة بخطوة', steps:[
      ['تحقّق إن كان لك حق','استخدم فحصنا المجاني (30 ثانية) لمعرفة إن كانت رحلتك مؤهلة وفق EC 261.'],
      ['اجمع تفاصيل الرحلة','رقم الحجز ورقم الرحلة والتاريخ كافية عادةً — لا تحتاج إلى الفواتير.'],
      ['قدّم الطلب','مجانًا عبر شريكنا AirHelp، الذي يتولّى التعامل مع الشركة والأوراق نيابةً عنك.'],
      ['استلم أموالك','بلا ربح، بلا رسوم — إن نجح الطلب، تصلك الأموال مخصومًا منها عمولة النجاح. وإن لم ينجح، لا تدفع شيئًا.']],
    ctaH:'تحقّق مما قد تستحقه', ctaP:'مجانًا، يستغرق دقيقتين، ولا تدفع إلا إذا نجح ملفك.', cta:'تحقّق من تعويضي →', cta2:'ابدأ ملفي مجانًا →',
    faqH:'أسئلة شائعة حول حقوق المسافر', faq:[
      ['إلى متى يمكنني المطالبة بأثر رجعي؟','عادةً رحلات آخر سنة إلى 3 سنوات، وأطول في بعض الدول.'],
      ['كم تكلّف المطالبة؟','الفحص مجاني، والمطالبة بلا ربح بلا رسوم. لا تُقتطع العمولة إلا إذا حصلت على تعويضك.'],
      ['هل رحلات المغرب–أوروبا مشمولة؟','غالبًا نعم — أي رحلة تقلع من مطار أوروبي مشمولة، وكذلك الرحلات إلى أوروبا على شركة أوروبية.'],
      ['وماذا لو رفضت الشركة؟','يتولّى شريكنا النزاع ويصعّده قانونيًا عند اللزوم.']],
    note:'OasisDeal ليس مكتب محاماة؛ يتولّى الملفات شريكنا AirHelp. قد نتقاضى عمولة دون أي زيادة عليك.',
    secure:'آمن ومجاني · بلا ربح بلا رسوم'
  }
};

function nav(lang){
  var x=P[lang];
  var langs=['en','fr','ar'].map(function(lg){var href=(lg==='en'?'':'/'+lg)+'/'+SLUG;return '<a class="'+(lg===lang?'on':'')+'" href="'+href+'">'+lg.toUpperCase()+'</a>';}).join('');
  return '<nav class="nav"><div class="container nav-row">'
    + '<a class="logo" href="'+x.home+'">'+LOGO+'<span class="logo-word">Oasis<span class="pipe">|</span>Deal</span></a>'
    + '<div class="nav-links">'
    + '<a class="nav-link" href="'+x.home+'">'+x.nav.flights+'</a>'
    + '<a class="nav-link" href="'+x.hotels+'">'+x.nav.hotels+'</a>'
    + '<a class="nav-link" href="'+x.esim+'">'+x.nav.esim+'</a>'
    + '<a class="nav-link" href="'+(lang==='en'?'':'/'+lang)+'/destinations/">'+x.nav.dest+'</a>'
    + '<a class="nav-link" href="'+x.comp+'">'+x.nav.comp+'</a>'
    + '<span class="rp-langs">'+langs+'</span>'
    + '</div></div></nav>';
}
var NAVJS='<script>(function(){var C=\'.nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--paper);cursor:pointer;}.nav-toggle span{display:block;width:20px;height:2px;background:var(--ink);border-radius:2px;transition:transform .2s,opacity .2s;}.nav-row.menu-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg);}.nav-row.menu-open .nav-toggle span:nth-child(2){opacity:0;}.nav-row.menu-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}@media(max-width:720px){.nav-row{flex-wrap:nowrap!important;height:60px;position:relative;}.nav-toggle{display:flex;}.nav-links{position:absolute;top:100%;inset-inline-start:0;width:100%;flex-direction:column;align-items:stretch;gap:0!important;background:var(--paper);border:1px solid var(--line);border-radius:0 0 16px 16px;padding:8px;box-shadow:0 14px 30px rgba(24,26,46,.14);display:none!important;z-index:60;}.nav-row.menu-open .nav-links{display:flex!important;}.nav-links .nav-link{display:block!important;padding:13px 12px;font-size:1rem;border-bottom:1px solid var(--line);}.nav-links .btn{margin:10px 4px 4px;justify-content:center;}.nav-links .rp-langs{display:flex;justify-content:center;gap:16px;padding:12px;}.nav-links .rp-langs a{color:var(--ink);opacity:.75;}.nav-links .rp-langs a.on{opacity:1;}}\';function I(){var r=document.querySelector(".nav-row");if(!r||r.querySelector(".nav-toggle"))return;var l=r.querySelector(".nav-links");if(!l)return;var s=document.createElement("style");s.textContent=C;document.head.appendChild(s);var b=document.createElement("button");b.className="nav-toggle";b.type="button";b.setAttribute("aria-label","Menu");b.innerHTML="<span></span><span></span><span></span>";b.addEventListener("click",function(){r.classList.toggle("menu-open");});r.appendChild(b);l.addEventListener("click",function(e){if(e.target.closest("a"))r.classList.remove("menu-open");});}if(document.readyState!=="loading")I();else document.addEventListener("DOMContentLoaded",I);})();</script>';
function footer(lang){
  var x=P[lang];
  return '<footer class="footer"><div class="container">'
    + '<div class="footer-trust">🔒 '+x.secure+' · Powered by AirHelp</div>'
    + '<div class="footer-bottom"><span>© <span id="y"></span> OasisDeal</span></div>'
    + '</div></footer><script>document.getElementById("y").textContent=new Date().getFullYear();</script>'+NAVJS;
}

function page(lang){
  var x=P[lang];
  var self='https://oasisdeal.com'+(lang==='en'?'':'/'+lang)+'/'+SLUG;
  var alts=['en','fr','ar'].map(function(lg){return '<link rel="alternate" hreflang="'+lg+'" href="https://oasisdeal.com'+(lg==='en'?'':'/'+lg)+'/'+SLUG+'" />';}).join('\n');
  var howLd={'@context':'https://schema.org','@type':'HowTo','name':x.howH,'step':x.steps.map(function(s,i){return {'@type':'HowToStep','position':i+1,'name':s[0],'text':s[1]};})};
  var faqLd={'@context':'https://schema.org','@type':'FAQPage','mainEntity':x.faq.map(function(q){return {'@type':'Question','name':q[0],'acceptedAnswer':{'@type':'Answer','text':q[1]}};})};
  var amts=x.amts.map(function(a){return '<div class="amount"><div class="big">'+a[0]+'</div><p>'+a[1]+'</p></div>';}).join('');
  var when=x.when.map(function(w){return '<li>'+w+'</li>';}).join('');
  var steps=x.steps.map(function(s,i){return '<div class="rp-step"><div class="rp-step-n">'+(i+1)+'</div><div><h3>'+s[0]+'</h3><p>'+s[1]+'</p></div></div>';}).join('');
  var faq=x.faq.map(function(q){return '<details><summary>'+q[0]+'</summary><p>'+q[1]+'</p></details>';}).join('');
  return '<!DOCTYPE html>\n<html lang="'+x.lang+'" dir="'+x.dir+'">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    + '<title>'+x.title+'</title>\n<meta name="description" content="'+x.desc+'" />\n<link rel="canonical" href="'+self+'" />\n'+alts+'\n<link rel="alternate" hreflang="x-default" href="https://oasisdeal.com/'+SLUG+'" />\n'
    + '<meta property="og:title" content="'+x.title+'" /><meta property="og:description" content="'+x.desc+'" /><meta property="og:url" content="'+self+'" /><meta property="og:type" content="website" />\n'
    + '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n'
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n'
    + '<link rel="stylesheet" href="/assets/site.css" />\n'
    + '<script type="application/ld+json">'+JSON.stringify(howLd)+'</script>\n<script type="application/ld+json">'+JSON.stringify(faqLd)+'</script>\n'
    + '<style>'
    + '.rp-hero{background:linear-gradient(160deg,var(--majorelle-deep) 0%,var(--majorelle) 100%);color:#fff;padding:54px 0 48px}.rp-hero h1{color:#fff;font-size:clamp(2rem,5vw,3rem)}.rp-hero p{opacity:.92;max-width:680px;margin-top:14px;font-size:1.05rem;line-height:1.6}'
    + '.rp-langs a{margin-inline-start:8px;color:#fff;opacity:.7;text-decoration:none;font-size:.85rem}.rp-langs a.on{opacity:1;font-weight:700;text-decoration:underline}'
    + '.rp-sec{padding:34px 0;border-bottom:1px solid var(--line)}.rp-sec h2{font-size:1.6rem;margin-bottom:14px}'
    + '.amounts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px}@media(max-width:640px){.amounts{grid-template-columns:1fr}}'
    + '.amount{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:24px;text-align:center}.amount .big{font-family:Fraunces,serif;font-size:2.4rem;font-weight:600;color:var(--majorelle)}.amount p{color:var(--ink-soft);margin-top:6px}'
    + '.rp-step{display:flex;gap:16px;margin-bottom:18px;align-items:flex-start}.rp-step-n{flex:0 0 auto;width:38px;height:38px;border-radius:50%;background:var(--majorelle);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-weight:600}.rp-step h3{font-size:1.1rem}.rp-step p{color:var(--ink-soft)}'
    + '.rp-cta{background:var(--sand);border:1px solid var(--line);border-radius:18px;padding:30px;text-align:center;margin:30px 0}.rp-cta h2{font-size:1.5rem;margin-bottom:8px}.rp-cta p{color:var(--ink-soft);margin-bottom:18px}.rp-cta .btn{margin:6px}'
    + 'ul.rp-list{list-style:none;padding:0}ul.rp-list li{padding:8px 0 8px 26px;position:relative;color:var(--ink-soft)}ul.rp-list li:before{content:"✓";position:absolute;inset-inline-start:0;color:var(--clay-deep);font-weight:700}'
    + '.rp-faq details{border-bottom:1px solid var(--line);padding:14px 0}.rp-faq summary{cursor:pointer;font-weight:600}.rp-faq p{color:var(--ink-soft);margin-top:8px}.rp-note{font-size:.82rem;color:var(--ink-soft);margin-top:22px}'
    + '</style>\n</head>\n<body>\n'+nav(lang)
    + '<header class="rp-hero"><div class="container"><h1>'+x.h1+'</h1><p>'+x.lead+'</p>'
      + '<div style="margin-top:22px"><a class="btn btn-primary" href="'+x.comp+'">'+x.cta+'</a></div></div></header>'
    + '<main class="container">'
      + '<section class="rp-sec"><h2>'+x.amtsH+'</h2><div class="amounts">'+amts+'</div></section>'
      + '<section class="rp-sec"><h2>'+x.coverH+'</h2><p style="color:var(--ink-soft);line-height:1.7">'+x.coverP+'</p></section>'
      + '<section class="rp-sec"><h2>'+x.whenH+'</h2><ul class="rp-list">'+when+'</ul><p style="color:var(--ink-soft);margin-top:14px"><b>'+x.notH+':</b> '+x.notP+'</p></section>'
      + '<section class="rp-sec"><h2>'+x.howH+'</h2>'+steps+'</section>'
      + '<div class="rp-cta"><h2>'+x.ctaH+'</h2><p>'+x.ctaP+'</p><a class="btn btn-primary" href="'+x.comp+'">'+x.cta+'</a><a class="btn btn-ghost" href="'+AIRHELP+'" target="_blank" rel="noopener sponsored">'+x.cta2+'</a></div>'
      + '<section class="rp-sec rp-faq"><h2>'+x.faqH+'</h2>'+faq+'</section>'
      + '<p class="rp-note">'+x.note+'</p>'
    + '</main>'+footer(lang)+'\n</body>\n</html>\n';
}

function ensure(p){ fs.mkdirSync(p,{recursive:true}); }
function write(rel,html){ var f=path.join(ROOT,rel); ensure(path.dirname(f)); fs.writeFileSync(f,html); console.log('wrote',rel); }

write(SLUG+'.html', page('en'));
write(path.join('fr',SLUG+'.html'), page('fr'));
write(path.join('ar',SLUG+'.html'), page('ar'));
console.log('Done: passenger-rights page in EN/FR/AR.');

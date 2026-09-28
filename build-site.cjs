// Final deterministic processing. Generated HTML is committed for Workers Builds.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {load}=require('cheerio');
const root=__dirname;
// Windows indexers can briefly lock regenerated files; retry only sharing errors.
const originalWrite=fs.writeFileSync;
fs.writeFileSync=function(...args){for(let i=0;;i++){try{return originalWrite.apply(fs,args);}catch(e){if(i===10||!['UNKNOWN','EBUSY','EPERM'].includes(e.code))throw e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,200);}}};
function write(file,html){for(let i=0;;i++){try{fs.writeFileSync(file,html);return;}catch(e){if(i===10)throw e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,300);}}}
for(const name of ['airports','destinations','blog','rights','routes'])require(path.join(root,`build-${name}.cjs`));
const source=fs.readFileSync('assets/i18n.js','utf8');
const dict=vm.runInNewContext('('+source.slice(source.indexOf('var T =')+7,source.indexOf('var RTL')).trim().replace(/;$/,'')+')');
const base=['index','hotels','cars','transfers','esim','compensation'],langs=['en','fr','ar'];
function route(name,lang){return(lang==='en'?'':'/'+lang)+(name==='index'?'/':'/'+name);}
for(const name of base){
 const original=fs.readFileSync(name+'.html','utf8');
 for(const lang of langs){
  const $=load(original);$('html').attr({lang,dir:lang==='ar'?'rtl':'ltr'});
  if(lang!=='en'){
   for(const [attr,target] of [['data-i18n','text'],['data-i18n-html','html'],['data-i18n-ph','placeholder']])$(`[${attr}]`).each((_,el)=>{const v=dict[lang][$(el).attr(attr)];if(v!=null){if(target==='placeholder')$(el).attr(target,v);else $(el)[target](v);}});
   const title=$('h1').first().text().trim()+' | OasisDeal';
   const desc=$('.hero p').filter((_,e)=>$(e).text().trim().length>65).first().text().trim()||title;
   $('title').text(title);$('meta[name="description"],meta[property="og:description"]').attr('content',desc);$('meta[property="og:title"]').attr('content',title);
  }
  if(name==='cars'){
   const copy={en:['Car rental comparison — coming soon','Car rental comparison is not available yet. You can currently compare flights and hotels.'],fr:['Comparateur de location de voitures — bientôt disponible','La comparaison de voitures n’est pas encore disponible. Vous pouvez comparer les vols et hôtels.'],ar:['مقارنة تأجير السيارات — قريبًا','مقارنة تأجير السيارات غير متاحة بعد. يمكنك حاليًا مقارنة الرحلات الجوية والفنادق.']}[lang];
   $('h1').removeAttr('data-i18n').text(copy[0]);$('.hero-sub').removeAttr('data-i18n').text(copy[1]);$('.hero-eyebrow span').removeAttr('data-i18n').text(copy[0]);$('title').text(copy[0]+' | OasisDeal');$('meta[name="description"],meta[property="og:description"]').attr('content',copy[1]);$('meta[property="og:title"]').attr('content',copy[0]);$('meta[name="robots"]').remove();$('head').append('<meta name="robots" content="noindex,follow">');
  }
  $('link[hreflang]').remove();
  for(const l of [...langs,'x-default'])$('head').append(`<link rel="alternate" hreflang="${l}" href="https://oasisdeal.com${route(name,l==='x-default'?'en':l)}">`);
  const url='https://oasisdeal.com'+route(name,lang);$('link[rel="canonical"]').attr('href',url);$('meta[property="og:url"]').attr('content',url);
  const out=path.join(root,lang==='en'?'':lang,name+'.html');fs.mkdirSync(path.dirname(out),{recursive:true});write(out,$.html());
 }
}
const words={en:['Cookie preferences','Optional partner scripts load only if you accept.','Cookie Policy','Decline','Accept'],fr:['Préférences cookies','Les scripts partenaires facultatifs ne se chargent qu’avec votre accord.','Politique cookies','Refuser','Accepter'],ar:['تفضيلات الكوكيز','لا تُحمّل برامج الشركاء الاختيارية إلا بعد موافقتك.','سياسة الكوكيز','رفض','موافق']};
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name.startsWith('.')||['node_modules','src','instagram','pinterest','tiktok'].includes(e.name)?[]:e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);}
for(const file of walk(root)){
 if(path.basename(file).startsWith('google'))continue;
 const $=load(fs.readFileSync(file,'utf8')),lang=$('html').attr('lang')||'en',t=words[lang]||words.en;
 $('[src],[href]').each((_,e)=>{for(const attr of ['src','href']){const v=$(e).attr(attr);if(v&&!/^(?:[a-z]+:|\/|#)/i.test(v))$(e).attr(attr,'/'+v);}});
 $('a[href]').each((_,a)=>{const el=$(a);let href=el.attr('href');if(href.startsWith('/')){href=href.replace(/^\/(?:fr|ar)\/(fr|ar)\//,'/$1/').replace(/\/index\.html(?=[?#]|$)/,'/').replace(/\.html(?=[?#]|$)/,'');if(lang!=='en'&&!el.closest('.rp-langs,.lang-switch').length&&(/^(?:\/|\/hotels|\/cars|\/transfers|\/esim|\/compensation)(?:[?#]|$)/.test(href)||/^\/(?:flights|destinations|blog)\//.test(href)))href='/'+lang+href;el.attr('href',href);}if(/^https?:\/\/[^/]*(?:tpx\.lu|fly\.oasisdeal\.com)/.test(href))el.attr('rel',[...new Set((el.attr('rel')||'').split(/\s+/).concat(['sponsored','noopener']))].filter(Boolean).join(' '));});
 $('.lang-btn[data-lang]').each((_,e)=>{const l=$(e).attr('data-lang'),href=$(`link[hreflang="${l}"]`).attr('href');if(href)$(e).replaceWith(`<a class="lang-btn${l===lang?' active':''}" data-lang="${l}" href="${new URL(href).pathname}">${$(e).text()}</a>`);});
 $('script[type="application/ld+json"]').each((_,e)=>{const d=JSON.parse($(e).html());if(d['@type']==='BlogPosting'){d.author.url='https://oasisdeal.com/about';d.image=$('meta[property="og:image"]').attr('content');$(e).text(JSON.stringify(d));}});
 $('script').each((_,e)=>{const el=$(e);if(!el.attr('src')&&el.text().includes('.nav-toggle{display:none;flex-direction:column')){el.remove();return;}if(/tpembars\.com|scripts\.stay22\.com|widget\.trustpilot\.com/.test((el.attr('src')||'')+el.html())){if(el.attr('src')){el.attr('data-consent-src',el.attr('src'));el.removeAttr('src');}el.attr({'type':'text/plain','data-partner-script':''});}});
 if(!$('script[src="/assets/i18n.js"]').length&&!$('script[src="/assets/navigation.js"]').length)$('body').append('<script src="/assets/navigation.js" defer></script>');
 $('.od-consent,.od-consent-preference,#od-consent-style,#od-consent-init').remove();
 $('head').append('<link id="od-consent-style" rel="stylesheet" href="/assets/consent.css"><script id="od-consent-init">try{if(/^(accepted|declined)$/.test(localStorage.getItem("od_consent")))document.documentElement.classList.add("od-consent-saved")}catch(e){}</script>');
 const banner=`<aside class="od-consent" aria-label="${t[0]}"><p>${t[1]} <a href="/cookies">${t[2]}</a>.</p><div class="od-btns"><button type="button" class="od-decline">${t[3]}</button><button type="button" class="od-accept">${t[4]}</button></div></aside>`;
 if($('nav.nav').length)$('nav.nav').first().after(banner);else $('body').prepend(banner);
 $('footer').first().append(`<button class="od-consent-preference" type="button">${t[0]}</button>`);
 if(!$('script[src="/assets/consent.js"]').length)$('body').append('<script src="/assets/consent.js" defer></script>');
 if(!$('main').length&&$('header.hero').length)$('header.hero').nextUntil('footer').addBack().wrapAll('<main id="main-content"></main>');
 for(let attempt=0;;attempt++){try{fs.writeFileSync(file,$.html());break;}catch(e){if(attempt===4)throw e;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}}
}
let sitemap=fs.readFileSync('sitemap.xml','utf8').replace(/<url>\s*<loc>https:\/\/oasisdeal\.com\/cars<\/loc>[\s\S]*?<\/url>/g,'');
for(const lang of ['fr','ar'])for(const name of base.filter(n=>n!=='cars')){const url='https://oasisdeal.com'+route(name,lang);if(!sitemap.includes('<loc>'+url+'</loc>'))sitemap=sitemap.replace('</urlset>',`<url><loc>${url}</loc></url>\n</urlset>`);}
sitemap=sitemap.split(/\r?\n/).map(line=>line.trimEnd()).filter((line,index,all)=>line!==''||all[index-1]!=='').join('\n').trimEnd()+'\n';
fs.writeFileSync('sitemap.xml',sitemap);console.log('Localised landing pages and checked static HTML.');

const fs=require('fs'),path=require('path'),assert=require('assert'),{load}=require('cheerio');
const urls=[...fs.readFileSync('sitemap.xml','utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);let links=0,posts=0;
function resolve(p){p=decodeURI(p);const f=path.join(process.cwd(),p);return [f,f+'.html',path.join(f,'index.html')].find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());}
const errors=[];
for(const url of urls){const p=new URL(url).pathname,f=resolve(p);if(!f){errors.push('Missing '+p);continue;}const $=load(fs.readFileSync(f,'utf8'));if($('h1').length!==1)errors.push('h1 '+p);if($('link[rel=canonical]').attr('href')!==url)errors.push('canonical '+p);if(($('meta[name=robots]').attr('content')||'').includes('noindex'))errors.push('noindex '+p);
$('a[href],link[hreflang]').each((_,a)=>{const href=$(a).attr('href');if(!href||href.startsWith('//')||!/^(\/|https:\/\/oasisdeal.com\/)/.test(href))return;const dest=new URL(href,'https://oasisdeal.com');if(!resolve(dest.pathname))errors.push(p+' -> '+dest.pathname);links++;});
$('script[type="application/ld+json"]').each((_,e)=>{let d=JSON.parse($(e).html());for(const item of (Array.isArray(d)?d:[d]))if(item['@type']==='BlogPosting'){assert(item.image&&item.author.url);posts++;}});
$('script:not([type="text/plain"])').each((_,e)=>{if(/tpembars\.com|scripts\.stay22\.com|widget\.trustpilot\.com/.test(($(e).attr('src')||'')+$(e).html()))errors.push('ungated '+p);});
if(!$('script[src="/assets/affiliate-tracking.js"]').length)errors.push('missing affiliate tracking '+p);
}
console.log(JSON.stringify({pages:urls.length,links,posts,errors:errors.slice(0,20),totalErrors:errors.length}));if(errors.length)process.exitCode=1;

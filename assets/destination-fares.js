/* A displayed fare and its search link must describe the same departure. */
(function(){
 var origin='CMN',city='Casablanca';
 function dateCode(date){return date.slice(8,10)+date.slice(5,7);}
 function wire(){
  var fallback=new Date(Date.now()+21*864e5).toISOString().slice(0,10);
  document.querySelectorAll('[data-fly]').forEach(function(a){a.href='https://fly.oasisdeal.com/?flightSearch='+origin+dateCode(fallback)+a.dataset.fly+'1';a.rel='sponsored noopener';});
  var label=document.getElementById('dfrom');if(label)label.textContent=label.dataset.base+' '+city+' ('+origin+')';
  document.querySelectorAll('[data-price]').forEach(function(el){
   var dest=el.dataset.price;
   fetch('https://oasisdeal-fares.pages.dev/api/fares?origin='+encodeURIComponent(origin)+'&destination='+encodeURIComponent(dest)+'&currency=usd').then(function(r){if(!r.ok)throw Error('fare unavailable');return r.json();}).then(function(d){
    var date=d&&typeof d.date==='string'?d.date.slice(0,10):'';
    if(!d||!Number.isFinite(Number(d.price))||Number(d.price)<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||date<new Date().toISOString().slice(0,10)){el.textContent='—';return;}
    var lang=document.documentElement.lang||'en';
    el.textContent=new Intl.NumberFormat(lang,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(d.price)+' · '+new Intl.DateTimeFormat(lang,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date))+' · '+origin;
    document.querySelectorAll('[data-fly]').forEach(function(a){if(a.dataset.fly===dest)a.href='https://fly.oasisdeal.com/?flightSearch='+origin+dateCode(date)+dest+'1';});
   }).catch(function(){el.textContent='—';});
  });
 }
 wire();
 fetch('https://oasisdeal-fares.pages.dev/api/whereami').then(function(r){return r.json();}).then(function(g){if(g&&/^[A-Z]{3}$/.test(g.origin)){origin=g.origin;city=g.city||origin;wire();}}).catch(function(){});
})();

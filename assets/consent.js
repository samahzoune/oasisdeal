(function(){
var choice=null,loaded=false;try{choice=localStorage.getItem('od_consent');}catch(e){}window.odConsent=choice;
function partners(){if(loaded)return;loaded=true;document.querySelectorAll('script[data-partner-script]').forEach(function(old){var s=document.createElement('script');if(old.dataset.consentSrc){s.src=old.dataset.consentSrc;s.async=true;}else s.textContent=old.textContent;old.replaceWith(s);});}
function choose(value){try{localStorage.setItem('od_consent',value);}catch(e){}window.odConsent=value;document.documentElement.classList.add('od-consent-saved');if(value==='accepted')partners();else if(loaded)location.reload();}
var accept=document.querySelector('.od-accept'),decline=document.querySelector('.od-decline');if(accept)accept.addEventListener('click',function(){choose('accepted');});if(decline)decline.addEventListener('click',function(){choose('declined');});
document.querySelectorAll('.od-consent-preference').forEach(function(button){button.addEventListener('click',function(){document.documentElement.classList.remove('od-consent-saved');var box=document.querySelector('.od-consent');if(box){box.scrollIntoView({block:'center'});box.querySelector('button').focus();}});});
if(choice==='accepted')partners();
})();

/* OasisDeal newsletter signup — self-contained band injected above the footer
   on every page. Posts to /api/subscribe (Cloudflare Worker → Resend).
   Trilingual via <html lang>. Hides itself once the visitor has subscribed. */
(function () {
  if (window.__odNews) return; window.__odNews = true;

  var T = {
    en: { h: 'Never miss a cheap flight', p: 'Get travel tips and price-drop alerts in your inbox. No spam — unsubscribe anytime.',
          ph: 'you@example.com', btn: 'Subscribe', sending: 'Subscribing…',
          ok: '✓ You’re in! We’ll be in touch soon.', bad: 'Please enter a valid email.', err: 'Something went wrong — please try again.' },
    fr: { h: 'Ne ratez plus un vol pas cher', p: 'Recevez nos astuces voyage et alertes de baisse de prix par e-mail. Pas de spam — désabonnement à tout moment.',
          ph: 'vous@exemple.com', btn: 'S’abonner', sending: 'Inscription…',
          ok: '✓ C’est fait ! On revient vers vous très vite.', bad: 'Entrez un e-mail valide.', err: 'Une erreur est survenue — réessayez.' },
    ar: { h: 'لا تفوّت رحلة رخيصة بعد الآن', p: 'استقبل نصائح السفر وتنبيهات انخفاض الأسعار في بريدك. بدون إزعاج — وألغِ الاشتراك متى شئت.',
          ph: 'you@example.com', btn: 'اشترك', sending: 'جارٍ الاشتراك…',
          ok: '✓ تمّ! سنتواصل معك قريبًا.', bad: 'أدخل بريدًا صحيحًا.', err: 'حدث خطأ ما — حاول مجددًا.' }
  };

  function init() {
    try { if (localStorage.getItem('od_subscribed')) return; } catch (e) {}
    var footer = document.querySelector('footer.footer');
    if (!footer || document.getElementById('od-news')) return;

    var lang = (document.documentElement.lang || 'en').slice(0, 2);
    var t = T[lang] || T.en;

    var css = '#od-news{background:linear-gradient(160deg,#4B3FCB 0%,#241F5E 100%);color:#fff;padding:44px 20px}'
      + '.od-news-in{max-width:720px;margin:0 auto;text-align:center}'
      + '.od-news-in h2{font-family:"Fraunces",Georgia,serif;font-size:clamp(1.5rem,3.2vw,2.1rem);font-weight:600;color:#fff;margin:0 0 8px}'
      + '.od-news-in p{font-family:"Inter",system-ui,sans-serif;opacity:.9;margin:0 0 20px;line-height:1.6}'
      + '.od-news-form{display:flex;gap:10px;max-width:460px;margin:0 auto;flex-wrap:wrap;justify-content:center}'
      + '.od-news-form input[type=email]{flex:1;min-width:200px;padding:13px 16px;border:1px solid rgba(255,255,255,.35);border-radius:12px;background:rgba(255,255,255,.12);color:#fff;font-size:1rem;font-family:"Inter",system-ui,sans-serif}'
      + '.od-news-form input[type=email]::placeholder{color:rgba(255,255,255,.7)}'
      + '.od-news-form input[type=email]:focus{outline:none;border-color:#E8A33D;background:rgba(255,255,255,.18)}'
      + '.od-news-btn{padding:13px 24px;border:none;border-radius:12px;background:#E8A33D;color:#241F5E;font-weight:700;font-size:1rem;font-family:"Inter",system-ui,sans-serif;cursor:pointer;white-space:nowrap;transition:filter .15s}'
      + '.od-news-btn:hover{filter:brightness(1.06)}.od-news-btn:disabled{opacity:.7;cursor:default}'
      + '.od-news-status{min-height:1.2em;margin-top:12px;font-size:.95rem;font-weight:500;font-family:"Inter",system-ui,sans-serif}'
      + '.od-news-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var sec = document.createElement('section');
    sec.id = 'od-news';
    sec.innerHTML = '<div class="od-news-in">'
      + '<h2></h2><p></p>'
      + '<form class="od-news-form" novalidate>'
      + '<input type="text" class="od-news-hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" />'
      + '<input type="email" name="email" required />'
      + '<button type="submit" class="od-news-btn"></button>'
      + '</form>'
      + '<div class="od-news-status" role="status" aria-live="polite"></div>'
      + '</div>';
    sec.querySelector('h2').textContent = t.h;
    sec.querySelector('p').textContent = t.p;
    var input = sec.querySelector('input[type=email]');
    input.placeholder = t.ph;
    input.setAttribute('aria-label', t.ph);
    var btn = sec.querySelector('.od-news-btn'); btn.textContent = t.btn;
    var status = sec.querySelector('.od-news-status');
    var form = sec.querySelector('form');
    var hp = sec.querySelector('input[name=company]');

    footer.parentNode.insertBefore(sec, footer);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { status.style.color = '#FFD9B0'; status.textContent = t.bad; return; }
      var orig = btn.textContent; btn.disabled = true; btn.textContent = t.sending; status.textContent = '';
      fetch('/api/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, company: hp.value })
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (j) {
          if (j && j.ok) {
            try { localStorage.setItem('od_subscribed', '1'); } catch (e) {}
            form.style.display = 'none';
            status.style.color = '#B9F5CF'; status.textContent = t.ok;
          } else { status.style.color = '#FFB4A8'; status.textContent = (j && j.error) || t.err; btn.disabled = false; btn.textContent = orig; }
        })
        .catch(function () { status.style.color = '#FFB4A8'; status.textContent = t.err; btn.disabled = false; btn.textContent = orig; });
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

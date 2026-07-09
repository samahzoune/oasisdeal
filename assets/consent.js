/* OasisDeal cookie consent banner — lightweight, self-contained.
   Shows once until the visitor accepts or declines; stores the choice
   in localStorage. Non-essential/partner scripts should check
   window.odConsent === 'accepted' before firing tracking. */
(function () {
  var KEY = 'od_consent';
  try { if (localStorage.getItem(KEY)) { window.odConsent = localStorage.getItem(KEY); return; } } catch (e) { return; }

  function t(en, fr, ar) {
    var l = (document.documentElement.lang || 'en').slice(0, 2);
    return l === 'fr' ? fr : l === 'ar' ? ar : en;
  }
  var rtl = (document.documentElement.dir === 'rtl');

  var css = ''
    + '.od-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:720px;margin:0 auto;'
    + 'background:#241F5E;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:16px;'
    + 'box-shadow:0 18px 44px rgba(10,8,40,.4);padding:18px 20px;font-family:Inter,system-ui,sans-serif;'
    + 'display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;animation:odc-in .3s ease;}'
    + '@keyframes odc-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}'
    + '.od-consent p{margin:0;flex:1 1 320px;font-size:.9rem;line-height:1.5;color:rgba(255,255,255,.9)}'
    + '.od-consent a{color:#E8A33D;text-decoration:underline}'
    + '.od-consent .od-btns{display:flex;gap:10px;flex:0 0 auto;margin-inline-start:auto}'
    + '.od-consent button{border:none;border-radius:999px;padding:10px 20px;font-weight:600;font-size:.88rem;cursor:pointer;font-family:inherit}'
    + '.od-consent .od-accept{background:#E8A33D;color:#241F5E}'
    + '.od-consent .od-decline{background:rgba(255,255,255,.12);color:#fff}'
    + '.od-consent .od-decline:hover{background:rgba(255,255,255,.2)}'
    + '@media(max-width:520px){.od-consent .od-btns{width:100%}.od-consent button{flex:1}}';

  function build() {
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    var box = document.createElement('div');
    box.className = 'od-consent';
    if (rtl) box.setAttribute('dir', 'rtl');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie consent');
    box.innerHTML =
      '<p>' + t(
        'We use essential cookies to run the site and, with your consent, cookies from our travel partners. See our <a href="/cookies">Cookie Policy</a>.',
        'Nous utilisons des cookies essentiels pour faire fonctionner le site et, avec votre accord, des cookies de nos partenaires voyage. Voir notre <a href="/cookies">politique cookies</a>.',
        'نستخدم ملفات تعريف ارتباط أساسية لتشغيل الموقع، وبموافقتك، ملفات من شركائنا في السفر. راجع <a href="/cookies">سياسة الكوكيز</a>.'
      ) + '</p>'
      + '<div class="od-btns">'
      + '<button class="od-decline">' + t('Decline', 'Refuser', 'رفض') + '</button>'
      + '<button class="od-accept">' + t('Accept', 'Accepter', 'موافق') + '</button>'
      + '</div>';
    document.body.appendChild(box);
    function choose(v) {
      try { localStorage.setItem(KEY, v); } catch (e) {}
      window.odConsent = v;
      box.style.display = 'none';
    }
    box.querySelector('.od-accept').addEventListener('click', function () { choose('accepted'); });
    box.querySelector('.od-decline').addEventListener('click', function () { choose('declined'); });
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();

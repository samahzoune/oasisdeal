/* Consent-aware, first-party affiliate click measurement.
   Travelpayouts receives booking attribution through the affiliate link itself. */
(function () {
  if (window.__odAffiliateTracking) return;
  window.__odAffiliateTracking = true;

  function partnerFor(url) {
    var host = url.hostname.toLowerCase();
    if (host === 'fly.oasisdeal.com') return 'flights';
    if (/\.tpx\.lu$/.test(host)) return 'tpx_' + host.split('.')[0].replace(/[^a-z0-9_]/g, '');
    return '';
  }

  function placementFor(link) {
    if (link.closest('footer')) return 'footer';
    if (link.closest('nav')) return 'nav';
    if (link.closest('article')) return 'article';
    return 'page';
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || window.odConsent !== 'accepted') return;
    var target;
    try { target = new URL(link.href, location.href); } catch (e) { return; }
    var partner = partnerFor(target);
    if (!partner) return;
    var data = JSON.stringify({
      event: 'affiliate_click',
      partner: partner,
      page: location.pathname || '/',
      placement: placementFor(link)
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/event', data);
    } else {
      fetch('/api/event', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: data }).catch(function () {});
    }
  }, { capture: true });
})();

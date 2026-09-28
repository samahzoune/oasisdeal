/* Mobile hamburger menu — self-contained, injects its own CSS + toggle button.
   Loaded on every page (static via this file, generated pages via footer script). */
(function () {
  var CSS = '.nav-div{display:inline-block;width:1px;height:18px;background:var(--line);margin:0 6px;vertical-align:middle;}.nav-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:42px;height:42px;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--paper);cursor:pointer;}'
    + '.nav-toggle span{display:block;width:20px;height:2px;background:var(--ink);border-radius:2px;transition:transform .2s,opacity .2s;}'
    + '.nav-row.menu-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg);}'
    + '.nav-row.menu-open .nav-toggle span:nth-child(2){opacity:0;}'
    + '.nav-row.menu-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}'
    + '@media(max-width:1120px){.nav-div{display:none!important;}'
    + '.nav-row{flex-wrap:nowrap !important;height:60px;position:relative;}'
    + '.nav-toggle{display:flex;}'
    + '.nav-links{position:absolute;top:100%;inset-inline-start:0;width:100%;flex-direction:column;align-items:stretch;gap:0 !important;background:var(--paper);border:1px solid var(--line);border-radius:0 0 16px 16px;padding:8px;box-shadow:0 14px 30px rgba(24,26,46,.14);display:none !important;z-index:60;}'
    + '.nav-row.menu-open .nav-links{display:flex !important;}'
    + '.nav-links .nav-link{display:block !important;padding:13px 12px;font-size:1rem;border-bottom:1px solid var(--line);}'
    + '.nav-links .btn{margin:10px 4px 4px;justify-content:center;}'
    + '.lang-switch{order:0 !important;margin:8px auto 4px;}'
    + '.nav-links .rp-langs{display:flex;justify-content:center;gap:16px;padding:12px;}'
    + '.nav-links .rp-langs a{color:var(--ink);opacity:.75;}'
    + '.nav-links .rp-langs a.on{opacity:1;}'
    + '}';
  function init() {
    var row = document.querySelector(".nav-row");
    if (!row || row.querySelector(".nav-toggle")) return;
    var links = row.querySelector(".nav-links");
    if (!links) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var b = document.createElement("button");
    b.className = "nav-toggle"; b.type = "button";
    b.setAttribute("aria-label", "Menu"); b.setAttribute("aria-expanded", "false");
    b.innerHTML = "<span></span><span></span><span></span>";
    b.addEventListener("click", function () {
      var o = row.classList.toggle("menu-open");
      b.setAttribute("aria-expanded", o ? "true" : "false");
    });
    row.appendChild(b);
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) { row.classList.remove("menu-open"); b.setAttribute("aria-expanded", "false"); }
    });
    row.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && row.classList.contains("menu-open")) {
        row.classList.remove("menu-open"); b.setAttribute("aria-expanded", "false"); b.focus();
      }
    });
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();

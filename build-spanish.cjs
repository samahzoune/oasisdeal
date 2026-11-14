/*
 * Build Spanish HTML mirrors from the current English pages.
 * Translation is generated once and cached in data/es-translations.json so
 * subsequent builds are reproducible without making network requests.
 */
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('cheerio');

const ROOT = __dirname;
const CACHE_PATH = path.join(ROOT, 'data', 'es-translations.json');
const ORIGIN = 'https://oasisdeal.com';
const EXCLUDED_DIRS = new Set([
  '.git', '.wrangler', 'node_modules', 'src', 'assets', 'images', 'data',
  'docs', 'instagram', 'pinterest', 'tiktok', 'social-assets', 'fr', 'ar', 'es'
]);
const TEXT_BLOCKS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'button', 'label', 'summary',
  'figcaption', 'blockquote', 'dt', 'dd', 'td', 'th', 'legend', 'caption'
]);
const SKIP_TEXT_CLASSES = new Set([
  'logo', 'logo-word', 'rp-langs', 'lang-switch', 'nav-toggle', 'footer-social',
  'footer-ig', 'od-btns', 'od-consent-preference'
]);
const ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];
const SPACE_ONLY = /^[\d\s.,:;!?/\-–—€$%+()]+$/;
const ES_KEY_OVERRIDES = {
  'nav.cars': 'Coches', 'nav.transfers': 'Traslados', 'nav.search': 'Buscar vuelos →',
  'form.from': 'Origen', 'form.to': 'Destino', 'form.depart': 'Salida', 'form.travellers': 'Viajeros',
  'form.note': 'Sin cargos: paga lo mismo que al reservar directamente.',
  'form.loading': 'Abriendo la búsqueda de vuelos…',
  'form.error': 'Elige dos ciudades o aeropuertos distintos de las sugerencias y vuelve a intentarlo.',
  'routes.fromShort': 'desde', 'routes.search': 'Buscar →', 'routes.title': 'Destinos populares',
  'tr.cta_btn': 'Buscar traslados →', 'tr.q1': '¿El precio del traslado es fijo?',
  'tr.a1': 'Sí. Verás el precio total por adelantado y no cambiará: sin taxímetro, recargos ni sorpresas al llegar. Reservas un traslado y pagas el precio indicado.',
  'tr.a2': 'El conductor te esperará en llegadas con un cartel con tu nombre. Si el vuelo se retrasa, lo seguirá gratis y ajustará la recogida para que no pierdas el traslado.',
  'tr.a3': 'Ofrecemos traslados en más de 150 países, entre aeropuertos, hoteles, puertos, estaciones y direcciones particulares. Puedes buscar entre cerca de 2.000 ubicaciones en todo el mundo.',
  'tr.a4': 'La mayoría de los traslados se pueden cancelar gratis hasta 24 horas antes de la recogida, con reembolso completo. Verás las condiciones exactas antes de pagar.',
  'esim.loading': 'Consultando precios en tiempo real…',
  'esim.res_title': 'Mejores eSIM para {c}',
  'esim.cmp_sub': 'Precios desde · {n} proveedores destacados',
  'esim.copy': 'Copiar', 'esim.copied': 'Copiado', 'esim.promo_word': 'Promoción',
  'esim.soon': 'Código promocional próximamente', 'esim.from_only': 'desde',
  'esim.day': 'día', 'esim.days': 'días', 'esim.unlimited': 'Ilimitado',
  'esim.standard': 'estándar', 'esim.live': 'En directo',
  'esim.seeprice': 'Ver precio en tiempo real', 'esim.get': 'Ver planes →',
  'esim.checkprice': 'Consultar precio →', 'esim.cheapest': 'Más barato',
  'esim.perk_yesim': 'Planes flexibles · recargas sencillas',
  'esim.perk_airalo': 'Proveedor de confianza · más de 200 países',
  'esim.perk_saily': 'Bloqueador de anuncios integrado de NordVPN'
};

function allHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || EXCLUDED_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) allHtmlFiles(abs, out);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) out.push(abs);
  }
  return out;
}

function relOf(file) { return path.relative(ROOT, file).replace(/\\/g, '/'); }
function pageUrl(logicalRel) {
  if (logicalRel === 'index.html') return '/';
  if (logicalRel.endsWith('/index.html')) return '/' + logicalRel.slice(0, -'index.html'.length);
  return '/' + logicalRel.replace(/\.html$/i, '');
}
function logicalRel(rel) {
  return rel.replace(/^(?:fr|ar|es)\//, '');
}
function localizedRel(rel, lang) {
  const logical = logicalRel(rel);
  return lang === 'en' ? logical : `${lang}/${logical}`;
}
function langForRel(rel) {
  if (rel.startsWith('fr/')) return 'fr';
  if (rel.startsWith('ar/')) return 'ar';
  if (rel.startsWith('es/')) return 'es';
  return 'en';
}
function stripLang(pathname) { return pathname.replace(/^\/(?:fr|ar|es)(?=\/|$)/, '/') || '/'; }
function cleanRoute(route) {
  let p = stripLang(route);
  p = p.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
  if (p === '/index.html') p = '/';
  return p;
}

function hasVisibleWords(s) {
  return typeof s === 'string' && s.trim().length >= 3 && !SPACE_ONLY.test(s.trim());
}
function skipElement(el, $) {
  const e = $(el), tag = (el.tagName || '').toLowerCase();
  if (['script', 'style', 'svg', 'noscript', 'template'].includes(tag)) return true;
  if (e.closest('script,style,svg,noscript,template').length) return true;
  if ([...SKIP_TEXT_CLASSES].some(c => e.hasClass(c))) return true;
  if (e.closest('.rp-langs,.lang-switch,.language-switch,[data-lang]').length) return true;
  return false;
}

function collectHtmlFragments($) {
  const found = new Set();
  const hasTextBlockDescendant = (el) => $(el).find([...TEXT_BLOCKS].join(',')).length > 0;
  const isShortLeafContainer = (e, el, tag) => {
    const directText = e.contents().toArray().some(n => n.type === 'text' && hasVisibleWords(n.data || ''));
    return ['div', 'span', 'small', 'strong', 'em', 'b'].includes(tag)
      && directText && !hasTextBlockDescendant(el) && e.text().length <= 900;
  };
  $('body *').each((_, el) => {
    const e = $(el), tag = (el.tagName || '').toLowerCase();
    if (skipElement(el, $)) return;
    const isTextBlock = TEXT_BLOCKS.has(tag);
    const isLink = tag === 'a';
    const isLeafText = isShortLeafContainer(e, el, tag);
    if (isTextBlock || isLink || isLeafText) {
      if (e.parents().toArray().some(parent => {
        const p = (parent.tagName || '').toLowerCase(), pe = $(parent);
        return TEXT_BLOCKS.has(p) || p === 'a' && !skipElement(parent, $) || isShortLeafContainer(pe, parent, p);
      })) return;
      if (e.find('svg').length && !isTextBlock) return;
      const html = e.html();
      if (html && hasVisibleWords(e.text())) found.add(html);
    }
  });
  return [...found];
}

function collectExtraStrings($) {
  const found = new Set();
  for (const attr of ATTRS) {
    $(`[${attr}]`).each((_, el) => {
      if (skipElement(el, $)) return;
      const value = $(el).attr(attr);
      if (hasVisibleWords(value)) found.add(value);
    });
  }
  $('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"],title').each((_, el) => {
    const e = $(el), value = el.tagName.toLowerCase() === 'title' ? e.text() : e.attr('content');
    if (hasVisibleWords(value)) found.add(value);
  });
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const obj = JSON.parse($(el).html());
      const visit = (value, key) => {
        if (typeof value === 'string') {
          if (['name', 'headline', 'description', 'text', 'alternateName'].includes(key) && hasVisibleWords(value)) found.add(value);
        } else if (Array.isArray(value)) value.forEach(v => visit(v, key));
        else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => visit(v, k));
      };
      visit(obj, '');
    } catch (_) {}
  });
  $('script:not([src])').each((_, el) => {
    const js = $(el).html() || '';
    const odt = /(?:window\.)?odT\(\s*(['"])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*(['"])((?:\\.|(?!\3)[\s\S])*?)\3\s*\)/g;
    let match;
    while ((match = odt.exec(js))) {
      const value = match[4].replace(/\\([\\'"`])/g, '$1');
      if (hasVisibleWords(value)) found.add(value);
    }
    const cities = /\{\s*code:\s*'([^']+)'\s*,\s*city:\s*'([^']+)'\s*\}/g;
    while ((match = cities.exec(js))) found.add(match[2]);
    const perks = /perk:\s*'([^']+)'\s*,\s*perkEn:\s*'([^']+)'/g;
    while ((match = perks.exec(js))) found.add(match[2]);
  });
  return [...found];
}

function batches(values, maxChars = 1900, maxCount = 18) {
  const out = []; let current = [], chars = 0;
  for (const value of values) {
    const cost = value.length + 32;
    if (current.length && (chars + cost > maxChars || current.length >= maxCount)) {
      out.push(current); current = []; chars = 0;
    }
    if (value.length > maxChars) {
      out.push([value]);
      continue;
    }
    current.push(value); chars += cost;
  }
  if (current.length) out.push(current);
  return out;
}

async function translateBatch(items, batchNumber) {
  const separator = `\n\n[[[ODSEP${String(batchNumber).padStart(7, '0')}]]]`;
  const joined = items.join(separator);
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=' + encodeURIComponent(joined);
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`translation service returned ${response.status}`);
      const data = await response.json();
      const translated = (data[0] || []).map(part => part[0] || '').join('');
      const split = translated.split(separator);
      if (split.length !== items.length) throw new Error(`translation separator mismatch in batch ${batchNumber}`);
      return split.map(s => s.trim());
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function ensureTranslations(strings, cache) {
  const missing = [...new Set(strings)].filter(s => cache[s] == null);
  if (!missing.length) return;
  if (process.env.OD_TRANSLATE_ES !== '1') {
    throw new Error(`${missing.length} Spanish translations are missing from the cache. Set OD_TRANSLATE_ES=1 to refresh the translation cache.`);
  }
  const work = batches(missing);
  console.log(`Spanish translation cache: ${missing.length} new strings in ${work.length} batches.`);
  let cursor = 0, finished = 0;
  async function worker() {
    while (cursor < work.length) {
      const index = cursor++;
      const group = work[index];
      const result = await translateBatch(group, index + 1);
      group.forEach((source, i) => { cache[source] = result[i] || source; });
      finished++;
      if (finished % 15 === 0 || finished === work.length) {
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
        console.log(`Spanish translations: ${finished}/${work.length} batches`);
      }
      await new Promise(resolve => setTimeout(resolve, 90));
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, work.length) }, worker));
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
}

function rewriteUrl(value, urlMap, lang) {
  if (typeof value !== 'string' || !value) return value;
  let parsed;
  try { parsed = new URL(value, ORIGIN); } catch (_) { return value; }
  if (parsed.origin !== ORIGIN) return value;
  const logical = cleanRoute(parsed.pathname);
  if (!urlMap.has(logical)) return value;
  const localePrefix = lang === 'en' ? '' : `/${lang}`;
  return ORIGIN + localePrefix + (logical === '/' ? '/' : logical) + parsed.search + parsed.hash;
}

function applyCachedHtml($, cache) {
  $('body *').each((_, el) => {
    const e = $(el), tag = (el.tagName || '').toLowerCase();
    if (skipElement(el, $)) return;
    const isTextBlock = TEXT_BLOCKS.has(tag);
    const isLink = tag === 'a';
    const directText = e.contents().toArray().some(n => n.type === 'text' && hasVisibleWords(n.data || ''));
    const isShortLeafContainer = ['div', 'span', 'small', 'strong', 'em', 'b'].includes(tag)
      && directText && !e.find([...TEXT_BLOCKS].join(',')).length && e.text().length <= 900;
    if (!isTextBlock && !isLink && !isShortLeafContainer) return;
    if (e.parents().toArray().some(parent => {
      const p = (parent.tagName || '').toLowerCase(), pe = $(parent);
      const direct = pe.contents().toArray().some(n => n.type === 'text' && hasVisibleWords(n.data || ''));
      const leaf = ['div', 'span', 'small', 'strong', 'em', 'b'].includes(p) && direct
        && !pe.find([...TEXT_BLOCKS].join(',')).length && pe.text().length <= 900;
      return TEXT_BLOCKS.has(p) || p === 'a' && !skipElement(parent, $) || leaf;
    })) return;
    if (e.find('svg').length && !isTextBlock) return;
    const original = e.html();
    if (original != null && cache[original] != null) e.html(cache[original]);
  });
  for (const attr of ATTRS) {
    $(`[${attr}]`).each((_, el) => {
      if (skipElement(el, $)) return;
      const e = $(el), original = e.attr(attr);
      if (original && cache[original] != null) e.attr(attr, cache[original]);
    });
  }
  $('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]').each((_, el) => {
    const e = $(el), original = e.attr('content');
    if (original && cache[original] != null) e.attr('content', cache[original]);
  });
  const originalTitle = $('title').text();
  if (originalTitle && cache[originalTitle] != null) $('title').text(cache[originalTitle]);
}

function buildEsDictionary(englishFiles, cache) {
  const dict = {};
  const toPlainText = value => load(`<div>${value || ''}</div>`)('div').text();
  for (const file of englishFiles) {
    const $ = load(fs.readFileSync(file, 'utf8'));
    $('[data-i18n]').each((_, el) => {
      const e = $(el), key = e.attr('data-i18n'), original = e.html();
      if (key && original && cache[original] != null) dict[key] = toPlainText(cache[original]);
    });
    $('[data-i18n-html]').each((_, el) => {
      const e = $(el), key = e.attr('data-i18n-html'), original = e.html();
      if (key && original && cache[original] != null) dict[key] = cache[original];
    });
    $('[data-i18n-ph]').each((_, el) => {
      const e = $(el), key = e.attr('data-i18n-ph'), original = e.attr('placeholder');
      if (key && original && cache[original] != null) dict[key] = cache[original];
    });
    $('script:not([src])').each((_, el) => {
      const js = $(el).html() || '';
      const odt = /(?:window\.)?odT\(\s*(['"])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*(['"])((?:\\.|(?!\3)[\s\S])*?)\3\s*\)/g;
      let match;
      while ((match = odt.exec(js))) {
        const key = match[2].replace(/\\([\\'"`])/g, '$1');
        const value = match[4].replace(/\\([\\'"`])/g, '$1');
        if (key && cache[value] != null) dict[key] = cache[value];
      }
      const cities = /\{\s*code:\s*'([^']+)'\s*,\s*city:\s*'([^']+)'\s*\}/g;
      while ((match = cities.exec(js))) {
        if (cache[match[2]] != null) dict[`city.${match[1]}`] = toPlainText(cache[match[2]]);
      }
      const perks = /perk:\s*'([^']+)'\s*,\s*perkEn:\s*'([^']+)'/g;
      while ((match = perks.exec(js))) {
        if (cache[match[2]] != null) dict[match[1]] = toPlainText(cache[match[2]]);
      }
    });
  }
  return dict;
}

function saveEsDictionary(dict) {
  const source = 'window.OD_ES_DICT=' + JSON.stringify(dict).replace(/</g, '\\u003c') + ';\n';
  fs.writeFileSync(path.join(ROOT, 'assets', 'i18n-es.js'), source);
}

function applyEsOverrides($, dict) {
  $('[data-i18n]').each((_, el) => {
    const key = $(el).attr('data-i18n');
    if (dict[key] != null) $(el).text(dict[key]);
  });
  $('[data-i18n-html]').each((_, el) => {
    const key = $(el).attr('data-i18n-html');
    if (dict[key] != null) $(el).html(dict[key]);
  });
  $('[data-i18n-ph]').each((_, el) => {
    const key = $(el).attr('data-i18n-ph');
    if (dict[key] != null) $(el).attr('placeholder', dict[key]);
  });
}

function addLanguageSwitcher($, logical, lang, available) {
  const route = pageUrl(logical);
  const languageContainers = $('.rp-langs,.lang-switch,.language-switch');
  if (!languageContainers.length) return;
  languageContainers.each((_, container) => {
    const c = $(container);
    c.find('a,button[data-lang]').each((__, node) => {
      const a = $(node), code = (a.attr('data-lang') || a.text()).trim().toLowerCase();
      if (!['en', 'fr', 'ar', 'es'].includes(code) || !available[code].has(logical)) { a.remove(); return; }
      const target = (code === 'en' ? '' : `/${code}`) + (route === '/' ? '/' : route);
      const className = c.hasClass('rp-langs') ? (code === lang ? 'on' : '') : `lang-btn${code === lang ? ' active' : ''}`;
      const link = `<a class="${className}" data-lang="${code}" href="${target}">${code.toUpperCase()}</a>`;
      if (node.tagName.toLowerCase() === 'button') a.replaceWith(link);
      else a.replaceWith(link);
    });
    if (!c.find('a[data-lang="es"]').length && available.es.has(logical)) {
      const target = '/es' + (route === '/' ? '/' : route);
      const className = c.hasClass('rp-langs') ? (lang === 'es' ? 'on' : '') : `lang-btn${lang === 'es' ? ' active' : ''}`;
      c.append(`<a class="${className}" data-lang="es" href="${target}">ES</a>`);
    }
  });
}

function setAlternates($, logical, lang, available) {
  const route = pageUrl(logical);
  const candidates = ['en', 'fr', 'ar', 'es'];
  const found = new Map();
  for (const code of candidates) {
    if (available[code].has(logical)) found.set(code, ORIGIN + (code === 'en' ? '' : `/${code}`) + (route === '/' ? '/' : route));
  }
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const h = $(el).attr('hreflang');
    if (found.has(h)) $(el).attr('href', found.get(h));
    else if (h === 'x-default' && available.en.has(logical)) $(el).attr('href', ORIGIN + route);
  });
  for (const [code, href] of found) {
    if (!$(`link[rel="alternate"][hreflang="${code}"]`).length) $('head').append(`<link rel="alternate" hreflang="${code}" href="${href}">`);
  }
  if (!$('link[rel="alternate"][hreflang="x-default"]').length && available.en.has(logical)) $('head').append(`<link rel="alternate" hreflang="x-default" href="${ORIGIN + route}">`);
}

async function main() {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  let cache = {};
  if (fs.existsSync(CACHE_PATH)) cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));

  const englishFiles = allHtmlFiles(ROOT).filter(file => !/^(fr|ar|es)\//.test(relOf(file)) && !path.basename(file).toLowerCase().startsWith('google'));
  const logicalPages = new Set(englishFiles.map(relOf));
  const urls = new Set([...logicalPages].map(pageUrl));
  const locales = { en: new Set(logicalPages), fr: new Set(), ar: new Set(), es: new Set(logicalPages) };
  for (const lang of ['fr', 'ar']) {
    const dir = path.join(ROOT, lang);
    if (!fs.existsSync(dir)) continue;
    for (const file of allHtmlFiles(dir)) {
      const rel = relOf(file).replace(new RegExp(`^${lang}/`), '');
      if (logicalPages.has(rel)) locales[lang].add(rel);
    }
  }

  const fragments = new Set();
  for (const file of englishFiles) {
    const $ = load(fs.readFileSync(file, 'utf8'));
    collectHtmlFragments($).forEach(s => fragments.add(s));
    collectExtraStrings($).forEach(s => fragments.add(s));
  }
  await ensureTranslations([...fragments], cache);
  for (const [source, translated] of Object.entries(cache)) {
    if (typeof translated === 'string' && translated.includes('OasisOferta')) cache[source] = translated.replace(/OasisOferta/g, 'OasisDeal');
  }
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
  const esDictionary = Object.assign(buildEsDictionary(englishFiles, cache), ES_KEY_OVERRIDES);
  saveEsDictionary(esDictionary);

  for (const file of englishFiles) {
    const logical = relOf(file);
    const source = fs.readFileSync(file, 'utf8');
    const $ = load(source);
    applyCachedHtml($, cache);
    applyEsOverrides($, esDictionary);
    $('script:not([src])').each((_, el) => {
      const text = $(el).html() || '';
      const months = [
        `['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']`,
        `["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]`
      ];
      const spanishMonths = [
        `['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']`,
        `["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]`
      ];
      let translated = text;
      months.forEach((value, index) => { translated = translated.replaceAll(value, spanishMonths[index]); });
      $(el).html(translated);
    });
    if (/^flights\//.test(logical)) {
      $('title').each((_, el) => $(el).text($(el).text().replace(/^Vuelos baratos (?!de )/, 'Vuelos baratos de ')));
      $('h1').each((_, el) => $(el).text($(el).text().replace(/^Vuelos baratos (?!de )/, 'Vuelos baratos de ')));
    }
    const canonicalPath = pageUrl(logical);
    const canonical = ORIGIN + '/es' + (canonicalPath === '/' ? '/' : canonicalPath);
    $('html').attr({ lang: 'es', dir: 'ltr' });
    $('link[rel="canonical"]').attr('href', canonical);
    if (!$('link[rel="canonical"]').length) $('head').append(`<link rel="canonical" href="${canonical}">`);
    $('meta[property="og:url"]').attr('content', canonical);
    $('meta[property="og:locale"]').attr('content', 'es_ES');
    if (!$('meta[property="og:locale"]').length) $('head').append('<meta property="og:locale" content="es_ES">');
    $('meta[name="twitter:site"],meta[name="twitter:creator"]').each((_, el) => {});
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const visit = (value, key) => {
          if (typeof value === 'string') {
            if (key === 'inLanguage') return 'es';
            if (key === 'url' || key === 'item' || key === '@id' || key === 'mainEntityOfPage') return rewriteUrl(value, urls, 'es');
            if (['name', 'headline', 'description', 'text', 'alternateName'].includes(key)) return cache[value] || value;
            return value;
          }
          if (Array.isArray(value)) return value.map(v => visit(v, key));
          if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, visit(v, k)]));
          return value;
        };
        $(el).text(JSON.stringify(visit(data, '')));
      } catch (_) {}
    });
    $('a[href]').each((_, el) => {
      const e = $(el);
      if (e.closest('.rp-langs,.lang-switch,.language-switch').length) return;
      const href = e.attr('href');
      if (!href || !href.startsWith('/')) return;
      const rawPath = href.split(/[?#]/, 1)[0];
      const logicalRoute = cleanRoute(rawPath);
      if (!urls.has(logicalRoute)) return;
      const suffix = href.slice(rawPath.length);
      e.attr('href', '/es' + (logicalRoute === '/' ? '/' : logicalRoute) + suffix);
    });
    addLanguageSwitcher($, logical, 'es', locales);
    setAlternates($, logical, 'es', locales);
    const i18nScript = $('script[src="/assets/i18n.js"]');
    if (i18nScript.length && !$('script[src="/assets/i18n-es.js"]').length) {
      i18nScript.first().before('<script src="/assets/i18n-es.js" defer></script>');
    }
    $('.trustpilot-widget[data-locale]').attr('data-locale', 'es-ES');
    const output = path.join(ROOT, 'es', logical);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, $.html());
  }

  // Add reciprocal Spanish hreflang targets and the ES entry to each existing language page.
  const existingLanguageFiles = [];
  for (const lang of ['en', 'fr', 'ar']) {
    if (lang === 'en') existingLanguageFiles.push(...englishFiles);
    else if (fs.existsSync(path.join(ROOT, lang))) existingLanguageFiles.push(...allHtmlFiles(path.join(ROOT, lang)));
  }
  for (const file of existingLanguageFiles) {
    const rel = relOf(file), logical = logicalRel(rel), lang = langForRel(rel);
    if (!locales[lang].has(logical) || !locales.es.has(logical)) continue;
    const $ = load(fs.readFileSync(file, 'utf8'));
    setAlternates($, logical, lang, locales);
    addLanguageSwitcher($, logical, lang, locales);
    fs.writeFileSync(file, $.html());
  }

  let sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  for (const logical of logicalPages) {
    const htmlFile = path.join(ROOT, 'es', logical);
    if (!fs.existsSync(htmlFile)) continue;
    const $ = load(fs.readFileSync(htmlFile, 'utf8'));
    if (/\bnoindex\b/i.test($('meta[name="robots"]').attr('content') || '')) continue;
    const route = pageUrl(logical);
    const url = ORIGIN + '/es' + (route === '/' ? '/' : route);
    if (!sitemap.includes(`<loc>${url}</loc>`)) sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc></url>\n</urlset>`);
  }
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
  console.log(`Spanish pages generated: ${logicalPages.size}; locale alternatives and sitemap updated.`);
}

main().catch(error => { console.error('Spanish build failed:', error.message); process.exitCode = 1; });

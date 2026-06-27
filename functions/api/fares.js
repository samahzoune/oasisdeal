// Cloudflare Pages Function — proxies Travelpayouts cheapest-fare lookups.
// Keeps the API token server-side (set TP_TOKEN as an env var in Cloudflare).
// Route: /api/fares?origin=CMN&destination=PAR&currency=mad
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = (url.searchParams.get('origin') || '').toUpperCase();
  const destination = (url.searchParams.get('destination') || '').toUpperCase();
  const currency = (url.searchParams.get('currency') || 'mad').toLowerCase();
  const headers = { 'content-type': 'application/json', 'cache-control': 'public, max-age=21600' };

  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return new Response(JSON.stringify({ error: 'bad_params' }), { status: 400, headers });
  }
  const token = env.TP_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'no_token' }), { status: 200, headers });
  }

  const api = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
    + '?origin=' + origin
    + '&destination=' + destination
    + '&currency=' + currency
    + '&sorting=price&direct=false&limit=1&one_way=true&token=' + token;

  try {
    const r = await fetch(api, { cf: { cacheTtl: 21600, cacheEverything: true } });
    const j = await r.json();
    const item = j && j.data && j.data[0];
    return new Response(JSON.stringify({ origin, destination, currency, price: item ? item.price : null }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 200, headers });
  }
}

// OasisDeal Worker — API routes (contact form + newsletter via Resend),
// with a fallback to the static site assets for every other request.
// Requires a secret: RESEND_API_KEY (set in the Cloudflare dashboard).
// (redeploy 2026-07-11 to bind RESEND_API_KEY secret)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/api/contact') {
      return handleContact(request, env);
    }
    if (request.method === 'POST' && url.pathname === '/api/subscribe') {
      return handleSubscribe(request, env);
    }
    // Everything else → the static site.
    return env.ASSETS.fetch(request);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function sendEmail(env, payload) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return r;
}

async function handleContact(request, env) {
  let data;
  try { data = await request.json(); } catch (e) { return json({ ok: false, error: 'Bad request.' }, 400); }

  // Honeypot: bots fill hidden fields — accept silently and drop.
  if (data.company) return json({ ok: true });

  const name = String(data.name || '').trim().slice(0, 120);
  const email = String(data.email || '').trim().slice(0, 200);
  const message = String(data.message || '').trim().slice(0, 5000);

  if (!name || !email || !message) return json({ ok: false, error: 'Please fill in all fields.' }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'Email service is not configured yet.' }, 503);

  try {
    const r = await sendEmail(env, {
      from: 'OasisDeal Contact <contact@oasisdeal.com>',
      to: ['hello@oasisdeal.com'],
      reply_to: email,
      subject: 'New contact message from ' + name,
      text: 'From: ' + name + ' <' + email + '>\n\n' + message
    });
    if (!r.ok) return json({ ok: false, error: 'Could not send right now.' }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'Could not send right now.' }, 502);
  }
}

async function handleSubscribe(request, env) {
  let data;
  try { data = await request.json(); } catch (e) { return json({ ok: false, error: 'Bad request.' }, 400); }

  if (data.company) return json({ ok: true });

  const email = String(data.email || '').trim().slice(0, 200);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'Email service is not configured yet.' }, 503);

  try {
    // Preferred: add to a real Resend Audience (a proper list you can broadcast to).
    // Set RESEND_AUDIENCE_ID as a Worker secret to enable this.
    if (env.RESEND_AUDIENCE_ID) {
      const r = await fetch('https://api.resend.com/audiences/' + env.RESEND_AUDIENCE_ID + '/contacts', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, unsubscribed: false })
      });
      // 200/201 = added; 409 = already a contact — both are "success" for the visitor.
      if (r.ok || r.status === 409) return json({ ok: true });
      return json({ ok: false, error: 'Could not subscribe right now.' }, 502);
    }
    // Fallback until an Audience is configured: notify the owner by email.
    const r = await sendEmail(env, {
      from: 'OasisDeal <hello@oasisdeal.com>',
      to: ['hello@oasisdeal.com'],
      subject: 'New newsletter subscriber',
      text: 'New subscriber: ' + email
    });
    if (!r.ok) return json({ ok: false, error: 'Could not subscribe right now.' }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: 'Could not subscribe right now.' }, 502);
  }
}

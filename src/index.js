// Worker entrypoint, declared as `main` in wrangler.jsonc.
//
// Static files in public/ are served by Cloudflare before this code runs, so this
// only sees requests with no matching file. /api/subscribe is the one that matters;
// everything else is handed back to the asset server on the last line.
//
// Was a root _worker.js under Pages advanced mode until 5 Sep 2026. The logic is
// unchanged — only its location and how it is declared.

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

async function subscribe(request, env) {
  let email = '';
  let honeypot = '';

  try {
    const form = await request.formData();
    email = String(form.get('email') || '').trim().toLowerCase();
    honeypot = String(form.get('company') || '').trim();
  } catch {
    return json({ ok: false, message: 'Bad request.' }, 400);
  }

  // Bots fill every field they find. Humans never see this one.
  if (honeypot) return json({ ok: true, message: 'Check your inbox.' }, 200);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return json({ ok: false, message: "That doesn't look like an email address." }, 400);
  }

  if (!env.BUTTONDOWN_API_KEY) {
    return json({ ok: false, message: 'Signup is not configured yet.' }, 500);
  }

  // The visitor's real IP, not this Worker's. Without it every signup reaches Buttondown
  // from the same datacenter address and its firewall scores them all as very risky.
  const visitorIp = request.headers.get('CF-Connecting-IP') || '';

  const payload = { email_address: email };
  if (visitorIp) payload.ip_address = visitorIp;

  let res, text;
  try {
    res = await fetch('https://api.buttondown.com/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // No `type` field on purpose — Buttondown then defaults to double opt-in.
      body: JSON.stringify(payload),
    });
    text = await res.text();
  } catch {
    return json({ ok: false, message: 'Could not reach the mail service. Try again shortly.' }, 502);
  }

  if (res.status === 201) {
    return json({ ok: true, message: 'Almost there — click the link in the confirmation email.' }, 200);
  }

  // Buttondown returns 400 for BOTH "already subscribed" and "firewall blocked it".
  // Reading the code field is the only way to tell them apart.
  let code = '';
  try { code = (JSON.parse(text) || {}).code || ''; } catch { /* non-JSON body */ }

  if (code === 'subscriber_blocked') {
    // Do not claim success, and do not explain the filter to whoever tripped it.
    return json(
      { ok: false, message: "We couldn't complete that signup. If that seems wrong, email contact@learnthespec.com." },
      422
    );
  }

  // Genuine collision: already on the list. Say the same thing as success so the form
  // can't be used to test whether an address is subscribed.
  if (res.status === 400 || res.status === 409) {
    return json({ ok: true, message: 'Almost there — check your inbox.' }, 200);
  }

  if (res.status === 401) return json({ ok: false, message: 'Signup is misconfigured.' }, 500);
  if (res.status === 403) return json({ ok: false, message: 'Signup is temporarily unavailable.' }, 503);
  if (res.status === 429) return json({ ok: false, message: 'Too many signups right now — try again in a minute.' }, 429);

  return json({ ok: false, message: 'Something went wrong. Try again shortly.' }, 502);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/subscribe') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
      }
      return subscribe(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

// Worker entrypoint, declared as `main` in wrangler.jsonc.
//
// Static files in public/ are served by Cloudflare before this code runs, so this
// only sees requests with no matching file. /api/subscribe is the one that matters;
// everything else is handed back to the asset server on the last line.
//
// Was a root _worker.js under Pages advanced mode until 5 Sep 2026. The logic is
// unchanged — only its location and how it is declared.

import { EmailMessage } from 'cloudflare:email';

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


// ---- contact form -----------------------------------------------------------
// Sends each message as a plain-text email through Cloudflare Email Routing's
// send_email binding (CONTACT_EMAIL in wrangler.jsonc). Needs, in the dashboard:
// Email Routing enabled on learnthespec.com, the inbox it forwards to verified as a
// destination address, and that address set as the CONTACT_TO secret. Nothing is
// stored here: the message exists only in that inbox (privacy policy, contact section).
const clean = (s, max) => String(s || '').replace(/\r/g, '').trim().slice(0, max);
const oneLine = (s) => s.replace(/[\n\t]+/g, ' ');

async function contact(request, env) {
  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, message: 'Bad request.' }, 400); }

  // Honeypot: hidden from people, filled in by bots. Pretend it worked.
  if (clean(form.get('company'), 200)) return json({ ok: true, message: 'Thanks, your message was sent.' }, 200);

  const email = oneLine(clean(form.get('email'), 200)).toLowerCase();
  const subject = oneLine(clean(form.get('subject'), 150));
  const message = clean(form.get('message'), 5000);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return json({ ok: false, message: 'Please enter a valid email address.' }, 400);
  }
  if (!subject || !message) return json({ ok: false, message: 'Please fill in a subject and a message.' }, 400);
  if (form.get('consent') !== 'yes') {
    return json({ ok: false, message: 'Please tick the privacy box so we can store your message.' }, 400);
  }
  if (!env.CONTACT_EMAIL || !env.CONTACT_TO) {
    return json({ ok: false, message: 'The form is not set up yet. Please email contact@learnthespec.com.' }, 503);
  }

  const from = 'form@learnthespec.com';
  const id = crypto.randomUUID();
  const raw = [
    `From: Learnthespec contact form <${from}>`,
    `To: <${env.CONTACT_TO}>`,
    `Reply-To: <${email}>`,
    `Subject: [Contact] ${subject.replace(/[^\x20-\x7E]/g, '?')}`,
    `Message-ID: <${id}@learnthespec.com>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    `From: ${email}`,
    `Subject: ${subject}`,
    '',
    message,
    '',
  ].join('\r\n');

  try {
    await env.CONTACT_EMAIL.send(new EmailMessage(from, env.CONTACT_TO, raw));
  } catch {
    return json({ ok: false, message: 'Could not send right now. Please email contact@learnthespec.com.' }, 502);
  }
  return json({ ok: true, message: 'Thanks, your message was sent. We answer within two working days.' }, 200);
}

// ---- sitemap ------------------------------------------------------------------
// Built on request from the start page's links, so publishing an article (which
// always adds it to public/index.html) is all it takes to list it. Pages that carry
// <meta name="robots" content="noindex..."> (superseded editions) are left out.
// There must be NO public/sitemap.xml, or the static file would shadow this.
const SITE = 'https://learnthespec.com';
const FIXED = ['/', '/about/', '/contact/', '/impressum/', '/privacy/'];

async function sitemap(request, env) {
  const origin = new URL(request.url).origin;
  const get = (path) => env.ASSETS.fetch(new Request(origin + path));
  const home = await (await get('/')).text();
  const articles = [...new Set([...home.matchAll(/href="(\/articles\/[a-z0-9-]+\/)"/g)].map((m) => m[1]))];
  const urls = [];
  for (const path of [...FIXED, ...articles]) {
    const res = await get(path);
    if (!res.ok) continue;
    const html = await res.text();
    if (/<meta name="robots" content="[^"]*noindex/i.test(html)) continue;
    urls.push(`  <url><loc>${SITE}${path}</loc></url>`);
  }
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n';
  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
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
    if (url.pathname === '/sitemap.xml') return sitemap(request, env);
    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
      }
      return contact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

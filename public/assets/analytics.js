/* Consent and measurement. Three tools, deliberately treated differently.
 *
 *   Usercentrics CMP          asks for consent. Loads on every page.
 *   Cloudflare Web Analytics  loads on every page, no consent asked.
 *   Google Analytics 4        loads only after consent is actually given.
 *
 * The dividing line is § 25 (1) TDDDG, which turns on storing or reading anything on
 * the visitor's device. Cloudflare Web Analytics does neither: Cloudflare states it
 * uses no client-side state — no cookies, no localStorage — and does not fingerprint
 * visitors by IP or User Agent. So there is nothing for § 25 to catch, and it runs on
 * Art. 6 (1)(f) legitimate interest. GA4 writes _ga cookies, so it is gated. The CMP
 * stores the answer it collects, which § 25 (2) exempts as strictly necessary — you
 * cannot ask consent for the thing that asks consent.
 *
 * Each tool no-ops until its credential is filled in, so deploying half-configured
 * is safe. See CLAUDE.md § 7 and § 9.
 *
 * ORDERING NOTE. Usercentrics documents its loader as a literal <head> tag placed
 * before third-party scripts, so its script blocker can intercept them. Here it is
 * injected instead, which keeps every credential in one file and fires no request
 * until configured. That is sound while this file is the only thing loading third
 * parties. WHEN ADSENSE CODE IS ADDED, promote the loader to a literal <head> tag
 * ahead of everything else, or the ad tag can win the race.
 */
(function () {
  'use strict';

  // ---- the three lines to change --------------------------------------------
  // Usercentrics: Admin Interface > Implementation > Settings-ID.
  // Use data-ruleset-id instead if you configure geolocation rulesets.
  var UC_SETTINGS_ID = 'IpmEXI7zzGCI5_';

  // Cloudflare: dashboard > Analytics & Logs > Web Analytics > Manage site > JS snippet.
  // The token is the 32-character hex string inside data-cf-beacon.
  var CF_BEACON_TOKEN = 'PASTE_YOUR_CLOUDFLARE_TOKEN';

  // Google: Analytics > Admin > Data streams > web stream > Measurement ID.
  // It looks like G-ABC1234XYZ.
  var MEASUREMENT_ID = 'G-XXXXXXXXXX';

  // Google's vendor ID in the IAB TCF vendor list. Checked so that consent is to
  // Google specifically, not merely to the purpose in general.
  var GOOGLE_VENDOR_ID = 755;

  // TCF Purpose 1: "Store and/or access information on a device". This is the purpose
  // § 25 TDDDG turns on, so it is what gates analytics_storage.
  var STORAGE_PURPOSE = 1;

  var ucReady = UC_SETTINGS_ID.indexOf('PASTE') !== 0 && /^[A-Za-z0-9_-]{6,}$/.test(UC_SETTINGS_ID);
  var cfReady = /^[0-9a-f]{32}$/.test(CF_BEACON_TOKEN);
  var gaReady = !/^G-X+$/.test(MEASUREMENT_ID);

  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // Consent Mode v2 defaults, pushed before anything else so that if gtag.js is ever
  // loaded by another script, it starts denied rather than open.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);

  // ---- Usercentrics CMP -----------------------------------------------------
  // Google-certified and IAB TCF v2.3 capable. EU-based, so unlike Cloudflare and
  // Buttondown there is no third-country transfer to disclose.
  if (ucReady) {
    var cmp = document.createElement('script');
    cmp.id = 'usercentrics-cmp';
    cmp.src = 'https://web.cmp.usercentrics.eu/ui/loader.js';
    cmp.setAttribute('data-settings-id', UC_SETTINGS_ID);
    cmp.async = true;
    document.head.appendChild(cmp);
  }

  // ---- Cloudflare Web Analytics ---------------------------------------------
  // Stores nothing on the device, so it needs no consent. Cloudflare documents the
  // install as a tag before </body>; a deferred injection runs at the same point.
  if (cfReady) {
    var beacon = document.createElement('script');
    beacon.defer = true;
    beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_BEACON_TOKEN }));
    document.head.appendChild(beacon);
  }

  // ---- Google Analytics 4, consent-gated ------------------------------------
  function load() {
    if (loaded || !gaReady) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(s);
    gtag('js', new Date());
    // anonymize_ip is not set: it was a Universal Analytics switch. GA4 does not log
    // or store EU, Swiss or UK IP addresses at all, so setting it would be decorative.
    gtag('config', MEASUREMENT_ID, { send_page_view: true });
  }

  function grant() {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    load();
  }

  function deny() {
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }

  // ---- bridge to the CMP through IAB TCF ------------------------------------
  // Any certified CMP publishes __tcfapi, so this works with Usercentrics, Google's
  // own CMP, or a replacement. It is what decides whether gtag.js is fetched at all.
  function bridge() {
    if (typeof window.__tcfapi !== 'function') return false;
    window.__tcfapi('addEventListener', 2, function (data, success) {
      if (!success || !data) return;
      if (data.eventStatus !== 'useractioncomplete' && data.eventStatus !== 'tcloaded') return;
      // gdprApplies false means the CMP has decided this visitor is out of scope and
      // will show no banner, so consent can never arrive and GA4 stays dark for them.
      // That is deliberate: one code path, and never wrong for a German operator.
      var p = data.purpose && data.purpose.consents;
      var v = data.vendor && data.vendor.consents;
      if (p && p[STORAGE_PURPOSE] && v && v[GOOGLE_VENDOR_ID]) grant();
      else deny();
    });
    return true;
  }

  if (!bridge()) {
    // The CMP loads after this file. Watch for it, then stop watching.
    var tries = 0;
    var timer = setInterval(function () {
      if (bridge() || ++tries > 40) clearInterval(timer);
    }, 250);
  }

  // ---- "Privacy choices" footer link -----------------------------------------
  // /privacy/ promises the choice can be changed at any time, and Art. 7 (3) GDPR
  // requires withdrawal to be as easy as giving consent. This mounts a footer link
  // that reopens the consent dialog. It appears only once a CMP is actually present,
  // so the page never carries a control that does nothing.
  //
  // Which global does the reopening differs by CMP and by version, so each is feature
  // detected rather than assumed. reopen() returns the name of whichever answered,
  // which is the quickest way to confirm a new CMP is wired: run it in the console.
  function reopen() {
    var uc = window.UC_UI;
    if (uc && typeof uc.showSecondLayer === 'function') { uc.showSecondLayer(); return 'UC_UI'; }
    var uc3 = window.__ucCmp;
    if (uc3 && typeof uc3.showSecondLayer === 'function') { uc3.showSecondLayer(); return '__ucCmp'; }
    var fc = window.googlefc;
    if (fc && typeof fc.showRevocationMessage === 'function') { fc.showRevocationMessage(); return 'googlefc'; }
    if (typeof window.__tcfapi === 'function') {
      // Not core TCF: an extension Google's CMP and most certified CMPs implement.
      window.__tcfapi('displayConsentUi', 2, function () {});
      return '__tcfapi';
    }
    return null;
  }

  function cmpPresent() {
    return !!(window.UC_UI && typeof window.UC_UI.showSecondLayer === 'function')
        || !!(window.__ucCmp && typeof window.__ucCmp.showSecondLayer === 'function')
        || !!(window.googlefc && typeof window.googlefc.showRevocationMessage === 'function')
        || typeof window.__tcfapi === 'function';
  }

  function mountChoices() {
    if (document.getElementById('privacy-choices')) return true;
    if (!cmpPresent()) return false;
    var foot = document.querySelector('.foot');
    if (!foot) return false;
    var rows = foot.querySelectorAll('div');
    var row = rows[rows.length - 1];
    var sibling = row && row.querySelector('a');
    if (!sibling) return false;
    // Footers differ: articles separate with plain spaces, legal pages with nbsp.
    var sep = row.textContent.indexOf(' ') >= 0 ? ' · ' : ' · ';
    var a = document.createElement('a');
    a.id = 'privacy-choices';
    a.href = '#';
    a.textContent = 'PRIVACY CHOICES';
    if (sibling.getAttribute('style')) a.setAttribute('style', sibling.getAttribute('style'));
    a.addEventListener('click', function (e) { e.preventDefault(); reopen(); });
    row.appendChild(document.createTextNode(sep));
    row.appendChild(a);
    return true;
  }

  if (!mountChoices()) {
    var mtries = 0;
    var mtimer = setInterval(function () {
      if (mountChoices() || ++mtries > 40) clearInterval(mtimer);
    }, 250);
  }

  // Manual control, for testing the wiring and for a future settings link.
  window.ltsConsent = {
    grant: grant,
    deny: deny,
    reopen: reopen,
    state: function () {
      return {
        cmp: ucReady ? 'usercentrics loaded' : 'awaiting settings id',
        cmpApi: cmpPresent() ? 'present' : 'not present',
        cloudflare: cfReady ? 'loaded' : 'awaiting token',
        ga4: gaReady ? (loaded ? 'loaded' : 'awaiting consent') : 'awaiting measurement id'
      };
    }
  };
})();

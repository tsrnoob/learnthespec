/* Consent, measurement and ads. Four tools, deliberately treated differently.
 *
 *   Google's CMP              asks for consent (IAB TCF v2.3). Loads on every page.
 *                             Replaced Usercentrics on 20 Sep 2026: see the CMP block.
 *   Cloudflare Web Analytics  loads on every page, no consent asked.
 *   Google Analytics 4        loads only after consent is actually given.
 *   Google AdSense            loads only after consent is actually given, and never on
 *                             the legal pages.
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

  // AdSense: the publisher ID from the snippet AdSense hands you, ca-pub-<16 digits>.
  // The snippet itself is NOT pasted into the pages: adsbygoogle.js reads and writes
  // device storage, so § 25 (1) TDDDG applies to it exactly as it does to GA4, and it
  // is loaded here only once consent for advertising has actually been given.
  var ADSENSE_CLIENT = 'ca-pub-6413233215513891';

  // Google's vendor ID in the IAB TCF vendor list. Checked so that consent is to
  // Google specifically, not merely to the purpose in general.
  var GOOGLE_VENDOR_ID = 755;

  // TCF Purpose 1: "Store and/or access information on a device". This is the purpose
  // § 25 TDDDG turns on, so it is what gates analytics_storage.
  var STORAGE_PURPOSE = 1;

  var ucReady = UC_SETTINGS_ID.indexOf('PASTE') !== 0 && /^[A-Za-z0-9_-]{6,}$/.test(UC_SETTINGS_ID);
  var cfReady = /^[0-9a-f]{32}$/.test(CF_BEACON_TOKEN);
  var gaReady = !/^G-X+$/.test(MEASUREMENT_ID);
  var adsReady = /^ca-pub-\d{10,}$/.test(ADSENSE_CLIENT);

  // CLAUDE.md § 6: no ads on the legal pages. Keeping the rule here means a new page
  // cannot forget it.
  var adsAllowed = adsReady && !/^\/(impressum|privacy|contact)\//.test(location.pathname);

  var loaded = false;
  var adsLoaded = false;

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

  // ---- the consent manager: Google's own CMP ----------------------------------
  // Changed 20 Sep 2026. Usercentrics was the CMP until the AdSense account existed;
  // its free plan has no IAB TCF, and Google serves no ads to EEA/UK visitors without a
  // TCF string from a certified CMP. Google's CMP (AdSense > Privacy & messaging) is
  // free, certified, and tracks TCF versions by itself. It was always the first choice
  // (CLAUDE.md § 7); it simply could not exist before the account did.
  //
  // It is a literal <head> tag on every page, the standalone "message" tag rather than
  // the ad code, so the banner can be shown WITHOUT loading adsbygoogle.js. The
  // injection below is only the fallback for a page that lacks the tag. The message
  // itself is built and published in AdSense; until that is done this loads nothing
  // visible, no consent can be given, and every gated tool stays dark.
  var cmpReady = adsReady;
  if (cmpReady && !document.getElementById('google-cmp')) {
    var cmp = document.createElement('script');
    cmp.id = 'google-cmp';
    cmp.async = true;
    cmp.src = 'https://fundingchoicesmessages.google.com/i/' +
              ADSENSE_CLIENT.replace('ca-', '') + '?ers=1';
    document.head.appendChild(cmp);
  }
  // Google's documented companion to that tag: an empty, hidden iframe whose name tells
  // Google's scripts a CMP is on the page. It loads nothing.
  (function signalGooglefcPresent() {
    if (!cmpReady || window.frames['googlefcPresent']) return;
    if (!document.body) { setTimeout(signalGooglefcPresent, 0); return; }
    var f = document.createElement('iframe');
    f.style.cssText = 'display:none;width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px;';
    f.name = 'googlefcPresent';
    document.body.appendChild(f);
  })();

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

  // ---- Google AdSense, consent-gated ----------------------------------------
  // AdSense gives publishers one <script> tag to paste into every page's <head>. That
  // tag would load Google's code, and with it device storage, on the first paint —
  // before the banner is answered. § 25 (1) TDDDG requires the opposite order, so the
  // tag lives here and fires on the same consent signal GA4 waits for, with the ads
  // keys rather than the analytics one.
  // The ad units. Each is created once in AdSense > Ads > By ad unit > Display ads, as a
  // FIXED size, and its data-ad-slot number pasted into `id` below. Nothing else in the
  // site needs touching: the pages keep their reserved boxes (CLAUDE.md § 6: every slot's
  // height is reserved so nothing reflows), and the boxes are filled here after consent.
  // A slot with no id stays empty. Auto ads stay OFF in AdSense: they would place units
  // without asking, the legal pages included.
  var AD_SLOTS = [
    { name: 'left rail',   sel: '.rail-left .ad',      w: 160, h: 600, id: '' },
    { name: 'right rail',  sel: '.rail .ad',           w: 300, h: 600, id: '' },
    { name: 'in-content',  sel: '.ad.ad-incontent',    w: 336, h: 280, id: '' },
    { name: 'inline',      sel: '.ad.ad-inline',       w: 300, h: 250, id: '' },
    // Articles give the bar id="anchor"; the home page only the class. Match the class,
    // or the home page keeps showing an empty bar (seen 21 Oct 2026).
    { name: 'anchor',      sel: '.anchor',             w: 970, h: 50,  id: '' },
    { name: 'home footer', sel: '.ad[style*="92px"]',  w: 728, h: 90,  id: '' }
  ];

  // Until a box is filled it is an empty frame with a build note in it, which is no use
  // to a reader or to an AdSense reviewer. Rails keep their space (they are their own
  // columns, so hiding the content moves nothing); boxes inside the text flow and the
  // anchor bar are taken out entirely until there is an ad to show.
  function hideEmptySlots() {
    AD_SLOTS.forEach(function (slot) {
      var els = document.querySelectorAll(slot.sel);
      for (var i = 0; i < els.length; i++) {
        if (els[i].getAttribute('data-filled')) continue;
        var rail = els[i].parentNode && /(^| )rail(-left)?( |$)/.test(els[i].parentNode.className);
        if (rail) els[i].style.visibility = 'hidden';
        else els[i].style.display = 'none';
      }
    });
  }

  function fillSlots() {
    if (!adsLoaded) return;
    AD_SLOTS.forEach(function (slot) {
      if (!/^\d{6,}$/.test(slot.id)) return;
      var els = document.querySelectorAll(slot.sel);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.getAttribute('data-filled')) continue;
        // Un-hide to measure. A box its breakpoint has removed (a rail below 1180 px)
        // has no width, and AdSense throws on a zero-width slot, so it is left for the
        // resize handler to fill if the window ever grows.
        el.style.display = '';
        el.style.visibility = '';
        if (!el.offsetParent || el.offsetWidth < slot.w) { hideEmptySlots(); continue; }
        var notes = el.querySelectorAll('.ad-size, .ad-note');
        for (var n = 0; n < notes.length; n++) notes[n].parentNode.removeChild(notes[n]);
        el.style.border = '0';
        el.style.background = 'transparent';
        var ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.cssText = 'display:inline-block;width:' + slot.w + 'px;height:' + slot.h + 'px';
        ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
        ins.setAttribute('data-ad-slot', slot.id);
        el.appendChild(ins);
        el.setAttribute('data-filled', '1');
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    });
  }

  function loadAds() {
    if (adsLoaded || !adsAllowed) return;
    adsLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
            encodeURIComponent(ADSENSE_CLIENT);
    document.head.appendChild(s);
    fillSlots();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fillSlots, 300); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideEmptySlots);
  else hideEmptySlots();

  function grantAds() {
    gtag('consent', 'update', {
      ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted'
    });
    loadAds();
  }

  function deny() {
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }

  // ---- bridge 1: Google Consent Mode ----------------------------------------
  // This is the one that actually fires today. IAB TCF is a paid feature on the
  // Usercentrics plan in use, so __tcfapi never appears; a GDPR-type configuration
  // with Google Consent Mode enabled instead pushes
  //   gtag('consent', 'update', { ... })
  // into dataLayer once the visitor answers the banner. Watching dataLayer rather
  // than a vendor API keeps this working with any CMP that supports Consent Mode,
  // and it keeps working unchanged if a TCF configuration is added later.
  //
  // NOTE: Usercentrics maps Consent Mode to individual Google *services*, not to
  // categories, so Google Analytics has to be declared as a service in the
  // configuration or no update is ever pushed and GA4 stays dark.
  function watchConsentMode() {
    var nativePush = window.dataLayer.push;
    window.dataLayer.push = function () {
      var result = nativePush.apply(window.dataLayer, arguments);
      try {
        for (var i = 0; i < arguments.length; i++) {
          var a = arguments[i];
          // Consent Mode calls arrive as ('consent', 'update', {...}).
          if (a && a[0] === 'consent' && a[1] === 'update' && a[2]) {
            if (a[2].analytics_storage === 'granted') load();
            // The CMP has already pushed the update, so load the tag without pushing
            // a second one.
            if (a[2].ad_storage === 'granted') loadAds();
          }
        }
      } catch (e) { /* never let bookkeeping break a dataLayer push */ }
      return result;
    };
  }
  watchConsentMode();

  // ---- bridge 2: Usercentrics' own event ------------------------------------
  // Belt and braces. If Consent Mode is switched off in the configuration, the CMP
  // still emits ucEvent when the visitor answers. Ask it directly in that case.
  window.addEventListener('ucEvent', function (e) {
    var d = e && e.detail;
    if (!d) return;
    // The payload names services, not categories. Accept either the Consent Mode
    // key or an explicitly granted Google Analytics service.
    var granted = d['Google Analytics'] === true ||
                  (d.event === 'consent_status' && d['Google Analytics'] === true);
    if (granted) grant();
    // Usercentrics names AdSense as its own service, so it is consented separately
    // from Analytics. Either one may be granted without the other.
    if (d['Google AdSense'] === true || d['Google Ads'] === true) grantAds();
  });

  // ---- bridge 3: IAB TCF ----------------------------------------------------
  // Dormant on a GDPR configuration, because __tcfapi only exists under TCF. Kept
  // so that moving to a TCF configuration later needs no code change at all.
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
      if (p && p[STORAGE_PURPOSE] && v && v[GOOGLE_VENDOR_ID]) {
        grant();
        // TCF purposes 3 and 4 are the advertising ones: a personalised-ads profile,
        // and selecting personalised ads. Storage (purpose 1) plus either of them is
        // what an ad request needs, and Google must be consented as a vendor.
        if (p[3] || p[4]) grantAds();
      } else deny();
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
        cmp: cmpReady ? 'google cmp tag loaded' : 'awaiting adsense client id',
        tcf: typeof window.__tcfapi === 'function' ? 'present' : 'not present (no message published yet?)',
        adSlots: AD_SLOTS.map(function (s) { return s.name + ': ' + (s.id ? 'id set' : 'no id'); }),
        cmpApi: cmpPresent() ? 'present' : 'not present',
        cloudflare: cfReady ? 'loaded' : 'awaiting token',
        ga4: gaReady ? (loaded ? 'loaded' : 'awaiting consent') : 'awaiting measurement id',
        adsense: !adsReady ? 'awaiting client id'
               : !adsAllowed ? 'off on this page (legal page)'
               : adsLoaded ? 'loaded' : 'awaiting consent'
      };
    }
  };
})();

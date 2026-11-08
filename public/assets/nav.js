/* Shared navigation for every page: floating menu, context-aware buttons, search.
   The menu never offers the page you are already on — that slot becomes Home. */
(function () {
  'use strict';

  var ARTICLES = [
    { d: "04 SEP", u: "/articles/best-ai-model-september-2026/", t: "Best AI Model, September 2026",
      s: "Nine flagships on intelligence, price, cost per finished task, token efficiency, speed and context.", c: "24 SOURCES" },
    { d: "04 SEP", u: "/articles/best-ai-for-coding-september-2026/", t: "Best AI for Coding, September 2026",
      s: "SWE-bench Verified and Terminal-Bench 4.0 against cost per task, and why the two disagree.", c: "16 SOURCES" },
    { d: "04 SEP", u: "/articles/what-ai-chatbots-can-do-september-2026/", t: "What AI Chatbots Can Actually Do, September 2026",
      s: "Fourteen capabilities across the four big assistants: uploads, vision, images, search, deep research, code, memory, connectors.", c: "11 SOURCES" },
    { d: "04 SEP", u: "/articles/what-ai-can-do-when-coding-september-2026/", t: "What AI Can Actually Do When You Code, September 2026",
      s: "Multi-file edits, running tests, pull requests, parallel agents, cloud work, AGENTS.md, MCP, browser control and sandboxing across five coding tools.", c: "13 SOURCES" },
    { d: "04 SEP", u: "/articles/what-open-weights-mean-september-2026/", t: "What Open Weights Actually Mean, September 2026",
      s: "Open weights versus open source, the OSI definition, licences per model, download sizes, quantisation and self-hosting.", c: "12 SOURCES" },
    { d: "04 SEP", u: "/articles/best-open-weight-model-september-2026/", t: "Best Open-Weight Model, September 2026",
      s: "MiMo-V2.6-Pro, GLM-5.3, Kimi K3, Qwen3.8, DeepSeek V4.1 Flash, MiniMax-M3 and gpt-oss ranked on Intelligence Index v4.3.2, cost per task, rate per million tokens, speed and licence.", c: "19 SOURCES" },
    { d: "04 SEP", u: "/articles/best-free-ai-september-2026/", t: "Best Free AI, September 2026",
      s: "Free tiers of ChatGPT, Claude, Gemini and Grok, plus free developer APIs and local models. What each includes and what free costs you.", c: "10 SOURCES" },
    { d: "04 SEP", u: "/articles/subscription-or-api-september-2026/", t: "Subscription or API: Which Is Cheaper, September 2026",
      s: "What twenty euros buys on a plan against what it buys in tokens: output pages, finished tasks, and why no exact break-even exists.", c: "10 SOURCES" },
    { d: "04 SEP", u: "/articles/what-hardware-runs-which-local-model-september-2026/", t: "What Hardware Runs Which Local Model, September 2026",
      s: "Quantisation sizes for Qwen3 and gpt-oss against RTX 50 series VRAM and Apple unified memory. Which model fits which machine.", c: "10 SOURCES" },
    { d: "04 SEP", u: "/articles/best-ai-for-images-september-2026/", t: "Best AI for Images, September 2026",
      s: "GPT Image 2, Nano Banana, MAI-Image, FLUX and Ideogram ranked by blind vote Elo, with published per-image prices.", c: "8 SOURCES" },
    { d: "04 SEP", u: "/articles/best-ai-for-video-september-2026/", t: "Best AI for Video, September 2026",
      s: "Wan 3.0, Gemini Omni Flash, MiniMax H3, Kling, Veo and Sora ranked by blind vote Elo, with per-second rates and clip costs.", c: "8 SOURCES" },
    { d: "04 SEP", u: "/articles/context-windows-compared-september-2026/", t: "Context Windows, Compared Honestly, September 2026",
      s: "Advertised windows against words per million tokens, chat-app limits, AA-LCR long context reasoning scores and long-context pricing steps.", c: "9 SOURCES" },
    { d: "04 SEP", u: "/articles/rate-limits-compared-september-2026/", t: "Rate Limits and Usage Caps, Compared, September 2026",
      s: "Anthropic API tier limits in RPM and tokens per minute, Gemini spend tiers, what drains a subscription, and the two kinds of 429.", c: "8 SOURCES" },
    { d: "04 SEP", u: "/articles/output-speed-compared-september-2026/", t: "Output Speed, Compared, September 2026",
      s: "Output tokens per second against time to first token, the minutes-long waits at maximum reasoning effort, and what dropping one effort level actually costs.", c: "9 SOURCES" },
    { d: "04 SEP", u: "/articles/token-efficiency-compared-september-2026/", t: "Token Efficiency, Compared, September 2026",
      s: "Output tokens each model spends on one identical benchmark suite, the reasoning tokens you are billed for but never see, and the cost of every run.", c: "11 SOURCES" },
    { d: "05 SEP", u: "/articles/best-gpu-for-local-ai-september-2026/", t: "Best GPU for Local AI, September 2026",
      s: "NVIDIA and AMD cards ranked by price per gigabyte of VRAM, against memory bus width and the CUDA or ROCm support that decides what actually runs.", c: "8 SOURCES" },
    { d: "05 SEP", u: "/articles/which-ai-can-use-your-computer-september-2026/", t: "Which AI Can Use Your Computer, September 2026",
      s: "Anthropic, OpenAI and Google computer-use tools compared on actions, reach, prompt-injection defences and what the model may agree to on your behalf.", c: "9 SOURCES" },
    { d: "05 SEP", u: "/articles/every-ai-benchmark-explained-september-2026/", t: "Every AI Benchmark, Explained, September 2026",
      s: "Intelligence Index, SWE-bench, Terminal-Bench, OSWorld, HLE and arena Elo: what each measures, how big it is, and why versions and marking rules move the number.", c: "8 SOURCES" },
    { d: "05 SEP", u: "/articles/mcp-what-connects-to-what-september-2026/", t: "MCP: What Actually Connects to What, September 2026",
      s: "Tools, resources and prompts; what Claude, VS Code and ChatGPT each implement; transports, published size caps, and the security rules the specification makes mandatory.", c: "7 SOURCES" },
    { d: "05 SEP", u: "/articles/ai-jargon-defined-september-2026/", t: "AI Jargon, Defined, September 2026",
      s: "Token, context window, reasoning tokens, Intelligence Index, arena Elo, quantisation, agent, MCP and prompt injection, each defined with the figure its own publisher states.", c: "12 SOURCES" },
    { d: "13 SEP", u: "/articles/prompt-caching-prices-compared-september-2026/", t: "Prompt Caching Prices, Compared, September 2026",
      s: "Cached input, cache hit and cache write prices for Claude, Gemini, DeepSeek, Grok, Kimi, Qwen and Mistral, with minimum prompts, cache lifetimes, batch discounts and off-peak rates.", c: "16 SOURCES" },
    { d: "20 SEP", u: "/articles/voice-ai-prices-compared-september-2026/", t: "Voice AI Prices, Compared, September 2026",
      s: "Voice AI API prices compared: speech to speech, text to speech and transcription rates from OpenAI gpt-live-1 and gpt-realtime, Google Gemini 3.8 Live, ElevenLabs, Deepgram, AssemblyAI and Cartesia, billed per minute of call, per million audio tokens, per hour of audio and per million characters.", c: "8 SOURCES" },
    { d: "04 OCT", u: "/articles/subscription-or-api-october-2026/", t: "Subscription or API: Which Is Cheaper, October 2026",
      s: "Subscription or API, which is cheaper in October 2026: ChatGPT Go, Plus and Pro, Claude Pro and Max, Google AI Plus, Pro and Ultra monthly plan prices against API list prices per million tokens for GPT-6 Astra, GPT-6.1 Sol, GPT-6 Luna, Claude Opus 5.5, Sonnet 5.5, Fable 5.1, Gemini 4 Argon, Grok 4.7 and DeepSeek Flash, plus cost per finished task on Intelligence Index v4.3.2, what reasoning effort level does to the bill, and why no break-even can be computed.", c: "13 SOURCES" },
    { d: "05 OCT", u: "/articles/token-efficiency-compared-october-2026/", t: "Token Efficiency, Compared, October 2026",
      s: "Token efficiency compared in October 2026: how many output tokens Claude Opus 5.5, Claude Sonnet 5.5, Claude Fable 5.1, GPT-6 Astra, GPT-6.1 Sol, Gemini 4 Argon, Grok 4.7, MiMo-V2.6-Pro, MiMo-V2.6-Flash, Kimi K3, GLM-5.3, DeepSeek V4.1 Flash and gpt-oss-120b each spend running the Artificial Analysis Intelligence Index v4.3.2, the peer median each is measured against, reasoning tokens and reasoning effort levels, and what one finished task costs per model.", c: "16 SOURCES" },
    { d: "11 OCT", u: "/articles/best-free-ai-october-2026/", t: "Best Free AI, October 2026",
      s: "Best free AI in October 2026: what ChatGPT Free, Claude Free, Gemini without an AI plan, Grok Free and Mistral Vibe Free each list on their own pages, the only published figures (ChatGPT 27K free context against 54K and 128K paid, GitHub Copilot Free 2,000 completions a month, 500 free Gemini grounding requests a day, 1,550 free Claude code-execution hours), which models each free tier reaches, whether your prompts train the model and for how long they are kept, free developer API tiers at Google, OpenAI, Anthropic and Mistral, and the open-weight models you can run yourself: gpt-oss-20b, gpt-oss-120b, Kolibri-1 and Qwen3.8-Flash-Next.", c: "19 SOURCES" },
    { d: "18 OCT", u: "/articles/best-ai-for-coding-october-2026/", t: "Best AI for Coding, October 2026",
      s: "Best AI for coding in October 2026: the Terminal-Bench 4.0 leaderboard (Claude Opus 5.5 64.8%, Claude Sonnet 5.5 61.8%, GPT-6 Astra and GPT-6.1 Sol tied at 58.2%, Claude Fable 5.1 57.9%, GLM-5.3 41.8%, Grok 4.7 37.6%), the token total and run cost each one spent on that board, the SWE-bench Verified official leaderboard whose newest entry is dated 26 February 2026, the vendor-run coding scores Anthropic, DeepSeek and Reflection publish themselves on Terminal-Bench 4.0, Terminal Bench v2.1, DeepSWE v1.1, FrontierCode 1.1 and CursorBench 4.0, API list price per million tokens, cost per task on Intelligence Index v4.3.2, and the coding agents the board scores: Claude Code, Codex, Grok Build, mini-SWE-agent and Muse Code.", c: "18 SOURCES" },
    { d: "25 OCT", u: "/articles/best-ai-for-images-october-2026/", t: "Best AI for Images, October 2026",
      s: "Best AI image generator in October 2026: the Artificial Analysis text-to-image arena on AA-Image-T2I v2.1, all 106 models in one pass, with GPT Image 2.5 Sunburst at Elo 1222, GPT Image 2.5 Flare 1207, GPT Image 2 1186, Nano Banana 2.1 1176, MAI-Image-2.6 and Grok Imagine Image 2.0 tied at 1166, Muse Image 1127 and FLUX 3 Image 1117, the board's price per 1,000 images from $9.0 to $211.0, the ranks the board says it cannot separate, the 35-row open-weight board led by FLUX 3 Image Klein, Qwen-Image-2.1 and Fibo 2.0, the licence and download gate on each of those, Google's per-image equivalents at 1K, 2K and 4K for Nano Banana Pro, Nano Banana 2, Nano Banana 2.1 and Nano Banana 2 Lite, and which vendors publish no per-image rate at all.", c: "16 SOURCES" },
    { d: "01 NOV", u: "/articles/ai-agent-permissions-compared-november-2026/", t: "AI Agent Permissions, Compared, November 2026",
      s: "AI agent permissions compared, November 2026: what Claude Code, OpenAI Codex, Google Antigravity, GitHub Copilot CLI, the Copilot coding agent and Meta Muse each allow by default. Permission modes (Claude Code 6, Codex 2 approval policies and 3 sandbox modes, Antigravity 4 app presets, Copilot CLI 3), the allow, ask and deny rule lists, which rule wins, what an administrator can enforce, the widest setting each ships (bypassPermissions, danger-full-access, Turbo, --yolo), and the two published failures: CVE-2026-111322 at CVSS 9.8 and the tampered Claude Code VS Code extension.", c: "9 SOURCES" },
    { d: "01 NOV", u: "/articles/scheduled-ai-price-changes-november-2026/", t: "Scheduled AI Price Changes, November 2026",
      s: "Scheduled AI price changes, November 2026: what an API list price will be on 1 January 2027 against what it is today. Google prints a changes-to column for seven models and every input and output rate doubles (Gemini 3.8 Flash 0.75 to 1.50 and 3.75 to 7.50 USD per 1M, Gemini 4 Argon 2.00 to 4.00 and 10.00 to 20.00 from 1 December 2026), while Gemini 4 Carbon, Microsoft MAI-Transcribe-2-Streaming and GitHub Copilot Fusion all call a rate temporary without printing an end date, OpenAI hedges two promotions with at least through, and Anthropic cancelled the Claude Sonnet increase it had scheduled.", c: "9 SOURCES" }
  ];


  // "Impressum" keeps its German name on purpose: it is the legal term German
  // readers and authorities look for, and no English label carries that meaning.
  var LINKS = [
    { href: '/',            label: 'Home' },
    { href: '/privacy/',    label: 'Privacy' },
    { href: '/contact/',    label: 'Contact' },
    { href: '/impressum/',  label: 'Impressum' }
  ];

  var body = document.body;
  var here = location.pathname.replace(/index\.html$/, '');
  if (here.length > 1 && here.slice(-1) !== '/') here += '/';

  var state = { open: false, searching: false, submitted: false, query: '' };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ---- build the furniture -------------------------------------------------

  var scrim = document.createElement('div');
  scrim.className = 'site-scrim';
  body.appendChild(scrim);

  // Home only appears when you are not already home; the current page never
  // offers itself. Nearest the button first, so the list reads bottom-up.
  var shown = LINKS.filter(function (l) {
    return l.href !== here && !(l.href === '/' && here === '/');
  }).slice(0, 3);

  shown.forEach(function (l, i) {
    var a = document.createElement('a');
    a.className = 'pill pill-' + (i + 1);
    a.href = l.href;
    a.textContent = l.label;
    body.appendChild(a);
  });

  var search = document.createElement('div');
  search.className = 'site-search';
  search.innerHTML =
    '<div class="search-clip"><div class="search-inner">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C7482" stroke-width="2" stroke-linecap="round" style="flex-shrink:0">' +
    '<circle cx="11" cy="11" r="7"></circle><line x1="16.5" y1="16.5" x2="21" y2="21"></line></svg>' +
    '<input type="text" placeholder="Search news and comparisons" aria-label="Search">' +
    '<div class="search-hint">ENTER</div>' +
    '</div></div>';
  body.appendChild(search);

  var suggest = document.createElement('div');
  suggest.className = 'suggest';
  suggest.hidden = true;
  search.appendChild(suggest);

  var fab = document.createElement('button');
  fab.className = 'fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Menu and search');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = '<span class="bar bar-1"></span><span class="bar bar-2"></span><span class="bar bar-3"></span>';
  body.appendChild(fab);

  var results = document.createElement('div');
  results.className = 'results';
  results.hidden = true;
  body.appendChild(results);

  var input = search.querySelector('input');

  // ---- behaviour -----------------------------------------------------------

  function matches() {
    var q = state.query.trim().toLowerCase();
    if (!q) return [];
    return ARTICLES.filter(function (a) {
      return (a.t + ' ' + a.s + ' ' + a.c).toLowerCase().indexOf(q) >= 0;
    });
  }

  function render() {
    body.classList.toggle('menu-open', state.open);
    body.classList.toggle('searching', state.searching || state.submitted);
    fab.setAttribute('aria-expanded', state.open ? 'true' : 'false');

    var found = matches();

    var showSuggest = state.searching && !state.submitted && state.query.trim().length > 0;
    suggest.hidden = !showSuggest;
    if (showSuggest) {
      suggest.innerHTML =
        (found.length
          ? found.slice(0, 5).map(function (a) {
              return '<a class="suggest-row" href="' + esc(a.u) + '"><div class="suggest-title">' + esc(a.t) +
                '</div><div class="suggest-meta">' + esc(a.d) + ' &middot; ' + esc(a.c) + '</div></a>';
            }).join('')
          : '<div class="suggest-empty">Nothing matches that yet.</div>') +
        '<div class="suggest-foot">Press <b>ENTER</b> for the full results page</div>';
    }

    results.hidden = !state.submitted;
    if (state.submitted) {
      results.innerHTML =
        '<div class="results-head"><div class="results-q">&ldquo;' + esc(state.query.trim()) +
        '&rdquo;</div><div class="results-count">' +
        (found.length === 1 ? '1 RESULT' : found.length + ' RESULTS') + '</div></div>' +
        '<div class="results-list">' +
        (found.length
          ? found.map(function (a) {
              return '<a class="item" href="' + esc(a.u) + '"><div class="item-date">' + esc(a.d) +
                '</div><div class="item-body"><div class="item-title">' + esc(a.t) +
                '</div><div class="item-sub">' + esc(a.s) +
                '</div><div class="item-chip">' + esc(a.c) + '</div></div></a>';
            }).join('')
          : '<div class="suggest-empty">No articles match that. Try a model name, a price, or a format.</div>') +
        '</div><div class="results-foot"><div class="results-close">CLOSE &times;</div></div>';
    }
  }

  function close() { state.searching = false; state.submitted = false; render(); }

  fab.addEventListener('click', function () {
    // deliberately does NOT focus the input: opening the menu docks the search
    // bar beside the button, and only clicking into it lifts it to the centre.
    state.open = !state.open; state.searching = false; state.submitted = false; render();
  });
  scrim.addEventListener('click', close);
  results.addEventListener('click', function (e) {
    if (e.target.closest('.results-close')) close();
  });
  input.addEventListener('focus', function () { state.open = true; state.searching = true; render(); });
  input.addEventListener('input', function (e) { state.query = e.target.value; state.submitted = false; render(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); state.submitted = true; render(); }
    if (e.key === 'Escape') { close(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (state.open || state.searching || state.submitted)) {
      state.open = false; close();
    }
  });

  // Back-navigation restores this page from the browser's cache with its DOM and
  // this closure both intact, so an open search panel comes back open and looks
  // stuck. Reset on every show, and on restore clear the input too, which the
  // in-page close() deliberately leaves alone.
  window.addEventListener('pageshow', function () {
    state.open = false;
    state.searching = false;
    state.submitted = false;
    state.query = '';
    input.value = '';
    render();
  });

  render();

  // ---- horizontal scrollers: wheel + drag ---------------------------------
  // A vertical wheel does not scroll a horizontally-overflowing container on
  // its own, and neither does dragging. Both are wired up here for the start
  // page's card row and for the comparison tables inside articles.
  // Nothing is hijacked unless the element actually overflows, and the wheel
  // hands control back to the page once the row reaches either end — no trap.
  var SCROLLERS = '.trend-row, .tablewrap';

  function overflows(el) { return el.scrollWidth - el.clientWidth > 1; }

  Array.prototype.forEach.call(document.querySelectorAll(SCROLLERS), function (el) {
    el.addEventListener('wheel', function (e) {
      if (!overflows(el)) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;   // real horizontal intent: leave it
      var atStart = el.scrollLeft <= 0;
      var atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;  // give the page the scroll back
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }, { passive: false });

    // 8, not 3: an ordinary trackpad tap drifts several pixels, and at 3 those taps
    // were being read as drags, which silently killed every card link in the row.
    var DRAG_PX = 8;
    var down = false, startX = 0, startLeft = 0, dragged = false;

    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      // Reset unconditionally. Guarding this on overflows() left `dragged` true from
      // an earlier drag, which suppressed the next genuine click.
      down = true; dragged = false;
      startX = e.clientX; startLeft = el.scrollLeft;
    });

    el.addEventListener('pointermove', function (e) {
      if (!down || !overflows(el)) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) <= DRAG_PX) return;
      // Deliberately no setPointerCapture: capturing on the container retargets the
      // click away from the <a> inside it, so the link never fires.
      dragged = true;
      el.classList.add('is-dragging');
      el.scrollLeft = startLeft - dx;
    });

    function release() {
      if (!down) return;
      down = false;
      el.classList.remove('is-dragging');
    }
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);

    // Only a real drag swallows the click. A sloppy tap must still follow the link.
    el.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); e.stopPropagation(); }
      dragged = false;
    }, true);
  });
})();

/* light theme: the 3D key field behind the page lives in its own file */
(function () {
  var s = document.createElement('script');
  s.src = '/assets/keyfield.js';
  s.defer = true;
  document.head.appendChild(s);
})();

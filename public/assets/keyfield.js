/* Key field: the soft 3D field of keys behind every article (light theme, 1 Nov 2026).
   Loaded by nav.js, so every page that has the shared menu gets it without touching the page.
   three.js r128 is self-hosted next to this file; nothing comes from a third party. */
(function () {
  'use strict';
  if (window.__keyfield) return;
  var api = window.__keyfield = { tint: function () {}, pulse: function () {} };
  // articles scroll inside .page, the other pages scroll the window
  function scroller() {
    var p = document.querySelector('.page');
    return p && p.scrollHeight > p.clientHeight + 4 ? p : document.documentElement;
  }
  function start() {
    /* 3D scene: a quiet field of keys stretching away like a keyboard laid flat. They breathe slowly,
       a soft wash of the current chapter's colour (or the open AI's colour) drifts across them,
       and every click sends a gentle wave of key presses outward. */
    (function scene() {
      if (!window.THREE) return;
      const cv = document.createElement('canvas'); cv.id = 'keyfield'; cv.setAttribute('aria-hidden', 'true'); document.body.insertBefore(cv, document.body.firstChild);
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      const S = new THREE.Scene();
      const BG = new THREE.Color(0xD6DBE3);
      S.fog = new THREE.Fog(BG, 9, 32);
      const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
      S.add(new THREE.HemisphereLight(0xF2F4F8, 0xB4BDCA, 0.9));
      const sun = new THREE.DirectionalLight(0xffffff, 0.2); sun.position.set(-6, 12, 4); S.add(sun);

      const NX = 52, NZ = 72, P = 0.8, N = NX * NZ;
      const geo = new THREE.BoxGeometry(0.7, 0.2, 0.7); geo.translate(0, 0.1, 0);
      const keys = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), N);
      const base = new THREE.Color(0xD2D8E1), tint = new THREE.Color('#EE5E28'), goal = tint.clone();
      const gx = new Float32Array(N), gz = new Float32Array(N), press = new Float32Array(N);
      const m = new THREE.Matrix4(), c = new THREE.Color();
      for (let i = 0; i < N; i++) { gx[i] = (i % NX - NX / 2) * P; gz[i] = -Math.floor(i / NX) * P + 16; keys.setColorAt(i, base); }
      S.add(keys);

      const waves = [];
      let mx = 0, my = 0, sc = 0, scGoal = 0, dirty = true;
      api.tint = hex => { try { goal.set(hex); } catch (e) {} dirty = true; if (still) draw(0); };
      api.pulse = (hex, px, py, strength = 1) => {
        // turn the click's screen position into a spot on the key field
        const v = new THREE.Vector3(px * 2 - 1, -py * 2 + 1, 0.5).unproject(cam); // px, py arrive as 0–1 fractions of the screen
        const dir = v.sub(cam.position).normalize(), t = -cam.position.y / dir.y;
        const hit = cam.position.clone().add(dir.multiplyScalar(t > 0 ? t : 20));
        waves.push({ x: hit.x, z: hit.z, r: 0, s: strength, col: new THREE.Color(hex) });
        if (still) draw(0);
      };
      addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
      function size() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
      size(); addEventListener('resize', size);

      function draw(t) {
        const d = scroller();
        scGoal = d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight);
        sc += still ? scGoal - sc : (scGoal - sc) * 0.05;
        tint.lerp(goal, still ? 1 : 0.04);
        const time = still ? 0 : t * 0.00025;
        // the camera glides slowly over the field as you read
        const cz = 10 - sc * 18;
        cam.position.set(mx * 1.2, 11 - my * 0.6, cz + 9);
        cam.lookAt(0, 0, cz - 4);
        for (const w of waves) w.r += still ? 30 : 0.32;
        for (let i = waves.length - 1; i >= 0; i--) if (waves[i].r > 30) waves.splice(i, 1);
        // a slow wash of the chapter colour drifts across the right-hand side
        const wx = 9 + Math.sin(time * 3) * 3, wz = cz - 6 + Math.cos(time * 2) * 3;
        for (let i = 0; i < N; i++) {
          let y = 0.07 * Math.sin(gx[i] * 0.35 + time * 6) * Math.cos(gz[i] * 0.3 + time * 4);
          let p = 0, wc = null;
          for (const w of waves) {
            const dd = Math.hypot(gx[i] - w.x, gz[i] - w.z), off = Math.abs(dd - w.r);
            if (off < 1.4) { const k = (1 - off / 1.4) * w.s * (1 - w.r / 30); if (k > p) { p = k; wc = w.col; } }
          }
          press[i] = Math.max(p, press[i] * 0.9);
          y -= press[i] * 0.18;
          m.makeTranslation(gx[i], y, gz[i]); keys.setMatrixAt(i, m);
          const glow = Math.max(0, 1 - Math.hypot(gx[i] - wx, gz[i] - wz) / 9) * 0.4;
          c.copy(base).lerp(tint, glow);
          if (wc) c.lerp(wc, Math.min(0.7, p));
          keys.setColorAt(i, c);
        }
        keys.instanceMatrix.needsUpdate = true; keys.instanceColor.needsUpdate = true;
        renderer.render(S, cam);
      }
      function loop(t) { if (!document.hidden) draw(t); requestAnimationFrame(loop); }
      if (still) { draw(0); addEventListener('scroll', () => draw(0), { passive: true, capture: true }); } else requestAnimationFrame(loop);
    })();
    // a click on anything you can press ripples the keys under the pointer
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('a, button, summary, .fab, .pill')) return;
      api.pulse('#EE5E28', e.clientX / innerWidth, e.clientY / innerHeight);
    });
  }
  function boot() {
    if (window.THREE) return start();
    var s = document.createElement('script');
    s.src = '/assets/three.min.js';
    s.onload = start;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

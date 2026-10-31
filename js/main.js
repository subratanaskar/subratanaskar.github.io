/* =========================================================
   Subrata Naskar — Portfolio v2 interactions
   Flow: face loader → "Helloo" eyes → landing (pixel portrait
   builds itself) → taxi strip → showcase → worked with →
   side-scroll selected work → roles → every frame → play →
   toolkit → let's talk
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
  };
  const onVisible = (el, enter, leave, threshold = 0.2) => {
    if (!("IntersectionObserver" in window)) { enter(); return; }
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? enter() : leave && leave())), { threshold }).observe(el);
  };

  /* ---------- palette (from the pixel portrait) ---------- */
  const C = {
    hair: "#2d2d39", hairHi: "#5c534e", skin: "#f2a562", skinSh: "#c9814a", skinDeep: "#a8653a",
    white: "#ffffff", cream: "#fdfadc", shirt: "#cbd08a", shirtSh: "#9ca866", shirtDeep: "#878f5a",
    jeans: "#6d8fe0", shoe: "#fdfadc", navy: "#0f2457", navyDeep: "#0a1a42", navy2: "#182c5e",
    taxi: "#f6c21a", taxiSh: "#d29b06", glass: "#9ad1e8", chrome: "#d9d9d9", tyre: "#141414", red: "#e2366c",
  };

  /* =========================================================
     CURSOR — crosshair lines + plus (difference blend)
     ========================================================= */
  const cursor = $(".cursor");
  if (finePointer && !reduce) {
    document.documentElement.classList.add("has-cursor");
    const v = $(".cursor__line--v"), h = $(".cursor__line--h"), p = $(".cursor__plus");
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; cursor.classList.add("on"); }, { passive: true });
    addEventListener("pointerdown", () => cursor.classList.add("down"));
    addEventListener("pointerup", () => cursor.classList.remove("down"));
    document.addEventListener("mouseleave", () => cursor.classList.remove("on"));
    document.addEventListener("mouseover", (e) => cursor.classList.toggle("hover", !!e.target.closest("a, button, .tool, .show__media")));
    (function loop() {
      cx += (mx - cx) * 0.35; cy += (my - cy) * 0.35;
      v.style.transform = `translateX(${mx}px)`; h.style.transform = `translateY(${my}px)`;
      p.style.left = cx + "px"; p.style.top = cy + "px";
      requestAnimationFrame(loop);
    })();
  }

  /* =========================================================
     REVEALS
     ========================================================= */
  const revealIO = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }) : null;
  $$(".reveal").forEach((el) => (revealIO ? revealIO.observe(el) : el.classList.add("in")));

  /* =========================================================
     SPRITES — pixel Subro (16 × 27 cells)
     ========================================================= */
  const SP = { a: C.hair, b: C.hairHi, d: C.skin, c: C.skinSh, w: C.white, j: C.shirt, h: C.shirtSh, n: C.jeans, s: C.shoe };
  const HEAD = [
    ".....aaaaaa.....", "...aabaaaabaa...", "..aaaaaaaaaaaa..", "..abaaaaaaaaba..", "..aaddddddddaa..",
    "..adddddddddda..", "..daaaaddaaaad..", "..dawwaddawwad..", "..daaaaddaaaad..", "..cddddddddddc..",
    "..adddaaaaddda..", "..aaadwwwwdaaa..", "...aaaaaaaaaa...", "....aaaaaaaa....", "......cccc......",
  ];
  const BODY = ["...jjjjccjjjj...", "..jjjjjjjjjjjj..", ".jjhjjjjjjjjhjj.", ".jjhjjjjjjjjhjj.", ".ddhjjjjjjjjhdd.", ".dd.jjjjjjjj.dd."];
  const LEGS_A = ["....nnnnnnnn....", "....nnnnnnnn....", "....nnn..nnn....", "....nnn..nnn....", "....nnn..nnn....", "...sss....sss..."];
  const LEGS_B = ["....nnnnnnnn....", "...nnnn.nnnn....", "..nnn.....nnn...", "..nn.......nn...", ".nn.........nn..", "sss..........sss"];
  const LEGS_C = ["....nnnnnnnn....", "....nnnn.nnnn...", "...nnn.....nnn..", "...nn.......nn..", "..nn.........nn.", "sss..........sss"];
  const LEGS_SIT = ["..nnnnnnnnnnnn..", "..nnnnnnnnnnnn..", "..nn........nn..", "..nn........nn..", "..ss........ss.."];
  const WALK = [HEAD.concat(BODY, LEGS_A), HEAD.concat(BODY, LEGS_B), HEAD.concat(BODY, LEGS_A), HEAD.concat(BODY, LEGS_C)];
  const SIT = HEAD.concat(BODY, LEGS_SIT);
  function drawSprite(ctx, map, x, y, s, flip = false) {
    const w = map[0].length;
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let c = 0; c < w; c++) {
        const ch = row[c];
        if (ch === ".") continue;
        ctx.fillStyle = SP[ch];
        const cc = flip ? w - 1 - c : c;
        ctx.fillRect(Math.round(x + cc * s), Math.round(y + r * s), Math.ceil(s), Math.ceil(s));
      }
    }
  }

  /* emoji → crisp pixel icon (rendered small, scaled up with smoothing off) */
  const iconCache = {};
  function pixelIcon(emoji, px = 14) {
    const k = emoji + px;
    if (iconCache[k]) return iconCache[k];
    const c = document.createElement("canvas");
    c.width = c.height = px + 4;
    const x = c.getContext("2d");
    x.font = `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(emoji, (px + 4) / 2, (px + 4) / 2 + 1);
    return (iconCache[k] = c);
  }

  /* =========================================================
     1 + 2. LOADER → HELLO (eyes) → LANDING
     ========================================================= */
  const loader = $("#loader"), video = $("#loaderVideo"), bar = $("#loaderBar");
  const hello = $("#hello");
  let started = false;

  async function runHello() {
    hello.classList.add("show");
    await sleep(1050);                                   // "Helloo" rises (like the reference)
    hello.classList.add("eyes");                         // two eyes look around for ~1s
    const pupils = $$(".hello__oo .pupil", hello);
    // pupils start where the Figma puts them (looking right), then look around for ~1s
    const look = [[-58, 0], [-48, -16], [6, -18], [22, 16], [-26, 14], [0, 0]];
    for (const [px, py] of look) {
      pupils.forEach((p) => { p.style.transform = `translate(${px}px, ${py}px)`; });
      await sleep(175);
    }
    hello.classList.add("leave");
    document.body.classList.remove("is-loading");
    startLanding();
    await sleep(950);
    hello.remove();
  }

  function finishLoader() {
    if (started) return;
    started = true;
    store.set("subro-seen", "1");
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 700);
    runHello();
  }

  if (store.get("subro-seen") === "1" || reduce) {
    loader.remove(); hello.remove();
    document.body.classList.remove("is-loading");
    startLanding();
  } else {
    video.addEventListener("timeupdate", () => { if (video.duration) bar.style.width = (video.currentTime / video.duration) * 100 + "%"; });
    video.addEventListener("ended", finishLoader);
    video.addEventListener("error", finishLoader);
    loader.addEventListener("click", finishLoader);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !started) finishLoader(); });
    const pr = video.play();
    if (pr && pr.catch) pr.catch(() => setTimeout(finishLoader, 600));
    setTimeout(finishLoader, 4000);                      // the face clip is 1s; never hang on a slow network
  }

  /* =========================================================
     3. LANDING — pixel portrait built by a plus cursor in 2s
     ========================================================= */
  let landingStarted = false;
  function startLanding() {
    if (landingStarted) return;
    landingStarted = true;
    buildPortrait();
  }

  function buildPortrait() {
    const cv = $("#pixelArt"), cur = $("#buildCursor"), P = window.PORTRAIT;
    if (!cv || !P) return;
    const cell = 4, dpr = DPR();
    cv.width = P.w * cell * dpr; cv.height = P.h * cell * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    // blocks of 4×4 cells, serpentine order (like a printer head)
    const B = 4, blocks = [];
    for (let by = 0; by < Math.ceil(P.h / B); by++) {
      const row = [];
      for (let bx = 0; bx < Math.ceil(P.w / B); bx++) {
        const cells = [];
        for (let y = by * B; y < Math.min(P.h, by * B + B); y++)
          for (let x = bx * B; x < Math.min(P.w, bx * B + B); x++) {
            const ch = P.rows[y][x];
            if (ch !== ".") cells.push([x, y, P.palette[ch]]);
          }
        if (cells.length) row.push({ bx, by, cells });
      }
      if (by % 2) row.reverse();
      blocks.push(...row);
    }
    const drawBlock = (b) => b.cells.forEach(([x, y, col]) => { ctx.fillStyle = col; ctx.fillRect(x * cell, y * cell, cell, cell); });
    if (reduce) { blocks.forEach(drawBlock); return; }
    const D = 2000, t0 = performance.now();
    let i = 0;
    cur.classList.add("on");
    (function step(now) {
      const k = clamp((now - t0) / D, 0, 1);
      const target = Math.floor(k * blocks.length);
      while (i < target) drawBlock(blocks[i++]);
      const b = blocks[Math.max(0, i - 1)];
      if (b) {
        const r = cv.getBoundingClientRect();
        const sx = r.width / (P.w * cell);
        cur.style.left = ((b.bx * B + B / 2) * cell * sx) + "px";
        cur.style.top = ((b.by * B + B / 2) * cell * sx) + "px";
      }
      if (k < 1) requestAnimationFrame(step);
      else { while (i < blocks.length) drawBlock(blocks[i++]); setTimeout(() => cur.classList.remove("on"), 250); }
    })(t0);
  }

  /* =========================================================
     4. TAXI STRIP — pixel Subro on a yellow taxi, tossing interests
     ========================================================= */
  (function taxiStrip() {
    const cv = $("#taxiCanvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const INTERESTS = ["⚽", "🏓", "📷", "🎨", "🎬", "🏏", "🏊", "✈️", "🍳", "🍿", "📚", "🎧"];
    let S = 4;                        // one pixel cell = S CSS px
    let W = 0, H = 0, road = 0, city = null, running = false, last = 0, taxiX = -200, items = [], throwT = 0, iconIdx = 0;

    function makeCity() {
      const c = document.createElement("canvas");
      c.width = Math.ceil(W / S) + 2; c.height = Math.ceil(road / S);
      const x = c.getContext("2d");
      let px = 0, seed = 7;
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      while (px < c.width) {
        const bw = 6 + Math.floor(rnd() * 12), bh = 10 + Math.floor(rnd() * (c.height * 0.55));
        x.fillStyle = rnd() > 0.5 ? "#132b63" : "#11275a";
        x.fillRect(px, c.height - bh, bw, bh);
        x.fillStyle = "rgba(203,208,138,.35)";
        for (let wy = c.height - bh + 3; wy < c.height - 2; wy += 4)
          for (let wx = px + 2; wx < px + bw - 2; wx += 3) if (rnd() > 0.55) x.fillRect(wx, wy, 1, 1);
        px += bw + 1 + Math.floor(rnd() * 3);
      }
      // Howrah-bridge-ish truss in the middle distance
      const bx = Math.floor(c.width * 0.62), bwid = Math.min(90, Math.floor(c.width * 0.3)), base = c.height - 6;
      x.fillStyle = "#1c3a7a";
      x.fillRect(bx, base - 26, 3, 26); x.fillRect(bx + bwid, base - 26, 3, 26); x.fillRect(bx - 10, base - 4, bwid + 24, 2);
      for (let i = 0; i <= bwid; i += 2) { const yy = Math.round(base - 22 + Math.pow((i - bwid / 2) / (bwid / 2), 2) * 14); x.fillRect(bx + i, yy, 2, 1); if (i % 8 === 0) x.fillRect(bx + i, yy, 1, base - 4 - yy); }
      return c;
    }

    function resize() {
      const r = cv.getBoundingClientRect(), dpr = DPR();
      W = r.width; H = r.height; road = Math.round(H * 0.76);
      S = clamp(Math.floor(road / 44), 3, 6);
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      city = makeCity();
    }

    function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
    function drawTaxi(x, y, t) {
      // Ambassador-style taxi, 40 × 16 cells; front faces right
      const s = S, bob = Math.round(Math.sin(t / 90) * 0.6) * s;
      const X = (cx) => x + cx * s, Y = (cy) => y + cy * s + bob;
      rect(X(11), Y(0), 18 * s, 1 * s, C.taxiSh);             // roof top
      rect(X(10), Y(1), 20 * s, 4 * s, C.taxi);               // cabin
      rect(X(12), Y(1.6), 7 * s, 3 * s, C.glass);             // rear window
      rect(X(20.5), Y(1.6), 7 * s, 3 * s, C.glass);           // front window
      rect(X(17), Y(-1.4), 6 * s, 1.4 * s, "#1b1b1b");        // TAXI sign
      rect(X(18), Y(-1), 4 * s, 0.6 * s, C.taxi);
      rect(X(2), Y(5), 36 * s, 6 * s, C.taxi);                // body
      rect(X(1), Y(6), 1 * s, 4 * s, C.taxi); rect(X(38), Y(6), 1 * s, 4 * s, C.taxi);
      rect(X(2), Y(10), 36 * s, 1 * s, C.taxiSh);
      rect(X(20), Y(5.5), 0.5 * s, 4.5 * s, C.taxiSh);        // door seam
      rect(X(0), Y(10), 3 * s, 1.5 * s, C.chrome); rect(X(37), Y(10), 3 * s, 1.5 * s, C.chrome);
      rect(X(37), Y(6.5), 2 * s, 2 * s, "#fff6c0");           // headlight
      rect(X(1), Y(6.5), 1 * s, 1.5 * s, C.red);              // tail light
      [9, 30].forEach((cx) => {                               // wheels
        rect(X(cx - 2.5), Y(9.5), 5 * s, 5 * s, C.tyre);
        const spin = Math.floor(t / 60) % 2;
        rect(X(cx - 1), Y(11), 2 * s, 2 * s, spin ? "#9a9a9a" : "#cfcfcf");
      });
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min(48, now - (last || now)); last = now;
      const speed = Math.max(120, W / 8);                     // px per second
      taxiX += speed * dt / 1000;
      const taxiW = 40 * S;
      if (taxiX > W + 40) taxiX = -taxiW - 40;               // vanish right, re-enter left
      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(city, 0, 0, city.width, city.height, 0, 0, city.width * S, city.height * S);
      rect(0, road, W, H - road, C.navyDeep);
      for (let x = 12; x < W; x += 48) rect(x, road + (H - road) * 0.45, 24, 4, "rgba(253,250,220,.25)");
      const ty = road - 15 * S;
      drawTaxi(taxiX, ty, now);
      drawSprite(ctx, SIT, taxiX + 14 * S, ty - 26 * S + S, S, false);  // Subro sits on the roof
      // toss interests from the back of the taxi
      throwT += dt;
      if (throwT > 420 && taxiX > -taxiW && taxiX < W) {
        throwT = 0;
        items.push({ e: INTERESTS[iconIdx++ % INTERESTS.length], x: taxiX + 4 * S, y: ty - 2 * S, vx: speed * 0.25 - (90 + Math.random() * 120), vy: -(320 + Math.random() * 160), r: 0, vr: (Math.random() - 0.5) * 8, life: 1 });
      }
      items = items.filter((it) => it.life > 0);
      items.forEach((it) => {
        it.vy += 900 * dt / 1000; it.x += it.vx * dt / 1000; it.y += it.vy * dt / 1000; it.r += it.vr * dt / 1000;
        const floor = road + 8;
        if (it.y > floor) { it.y = floor; it.vy *= -0.35; it.vx *= 0.6; it.vr *= 0.5; it.life -= 0.012 * dt / 16; }
        if (it.y >= floor - 1 && Math.abs(it.vy) < 30) it.life -= 0.02 * dt / 16;
        const ic = pixelIcon(it.e, 14), sz = ic.width * 2.4;
        ctx.save(); ctx.globalAlpha = clamp(it.life, 0, 1); ctx.translate(it.x, it.y); ctx.rotate(Math.round(it.r * 4) / 4);
        ctx.drawImage(ic, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      });
      requestAnimationFrame(frame);
    }
    resize();
    addEventListener("resize", resize);
    onVisible(cv, () => { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } }, () => (running = false), 0.01);
  })();

  /* =========================================================
     5. SHOWCASE — lazy videos play only while on screen
     ========================================================= */
  const mediaIO = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    const m = e.target;
    if (e.isIntersecting) {
      if (m.dataset.src && !m.dataset.loaded) { m.src = m.dataset.src; m.dataset.loaded = "1"; }
      if (m.tagName === "VIDEO" && !reduce) { const p = m.play(); if (p && p.catch) p.catch(() => {}); }
    } else if (m.tagName === "VIDEO") m.pause();
  }), { threshold: 0.25 }) : null;
  const watchMedia = (el) => (mediaIO ? mediaIO.observe(el) : el.dataset.src && (el.src = el.dataset.src));
  $$(".show__media video, .show__media img[data-src]").forEach(watchMedia);

  /* =========================================================
     7. SELECTED WORK — side-scroll with a walking pixel mascot
     ========================================================= */
  const PROJECTS = [
    { title: "Chittarupa", year: "2026", desc: "Chittarupa (চিত্তরূপা, the form of consciousness) is a design interpretation of Durga.", tags: ["Design Project", "Cultural Documentation", "UI / UX"], img: "assets/img/project-chittarupa.jpg" },
    { title: "Afternoon in the Park", year: "2026", desc: "An illustrated loop where the background keeps changing its mind — sky, plaid, checkerboard, memory.", tags: ["Illustration", "Motion"], img: "assets/img/work-02.jpg", video: "assets/video/work-02.mp4" },
    { title: "Scream, Quietly", year: "2026", desc: "A hand-drawn, frame-by-frame study of a face losing its cool — one line, one feeling at a time.", tags: ["Animation", "Hand-drawn"], img: "assets/img/work-01.jpg", video: "assets/video/work-01.mp4" },
    { title: "Self, Drawn", year: "2026", desc: "An animated self-introduction: a designer drawing the character who draws him back.", tags: ["Self-portrait", "Animation"], img: "assets/img/work-04.jpg", video: "assets/video/work-04.mp4" },
  ];
  (function selectedWork() {
    const sec = $("#work"), track = $("#swTrack"), mascot = $("#swMascot"), cityEl = $("#swCity"), ground = $("#swGround"), prog = $("#swProgress");
    if (!sec) return;
    track.innerHTML = PROJECTS.map((p, i) => `
      <article class="card">
        <div class="card__content">
          <div>
            <div class="card__top"><span class="card__num">${String(i + 1).padStart(2, "0")}</span><span class="card__year">${p.year}</span></div>
            <h3 class="card__title">${p.title}</h3>
            <p class="card__desc">${p.desc}</p>
            <a class="tag tag--olive tilt-l" href="#">View Project <i class="tag__ic">↗</i></a>
          </div>
          <div class="card__tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>
        </div>
        <div class="card__media">
          ${p.video ? `<video data-src="${p.video}" poster="${p.img}" muted loop playsinline preload="none"></video>` : `<img src="${p.img}" alt="${p.title}" loading="lazy" />`}
          <i class="h h1"></i><i class="h h2"></i><i class="h h3"></i><i class="h h4"></i>
        </div>
      </article>`).join("");
    $$("video", track).forEach(watchMedia);
    const cards = $$(".card", track);

    // pixel skyline + ground tiles (generated, so no extra downloads)
    (function textures() {
      const s = 4, cw = 240, ch = 55, c = document.createElement("canvas");
      c.width = cw * s; c.height = ch * s;
      const x = c.getContext("2d");
      let seed = 3; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      let px = 0;
      while (px < cw) {
        const bw = 8 + Math.floor(rnd() * 14), bh = 14 + Math.floor(rnd() * 36);
        x.fillStyle = ["#132b63", "#162f69", "#11275a"][Math.floor(rnd() * 3)];
        x.fillRect(px * s, (ch - bh) * s, bw * s, bh * s);
        if (rnd() > 0.7) { x.fillRect((px + 2) * s, (ch - bh - 4) * s, 2 * s, 4 * s); }   // chimney / antenna
        x.fillStyle = "rgba(203,208,138,.28)";
        for (let wy = ch - bh + 3; wy < ch - 2; wy += 4) for (let wx = px + 2; wx < px + bw - 2; wx += 3) if (rnd() > 0.5) x.fillRect(wx * s, wy * s, s, s);
        px += bw + 2 + Math.floor(rnd() * 4);
      }
      // a few pixel trees
      for (let tx = 10; tx < cw; tx += 38 + Math.floor(rnd() * 20)) {
        x.fillStyle = "#3a4a2a"; x.fillRect((tx + 3) * s, (ch - 6) * s, 2 * s, 6 * s);
        x.fillStyle = "#6f7d46"; x.fillRect(tx * s, (ch - 14) * s, 8 * s, 8 * s); x.fillRect((tx + 1) * s, (ch - 16) * s, 6 * s, 2 * s);
      }
      cityEl.style.backgroundImage = `url(${c.toDataURL()})`;
      cityEl.style.backgroundSize = `${cw * s}px ${ch * s}px`;
      const g = document.createElement("canvas"); g.width = 64; g.height = 96;
      const gx = g.getContext("2d");
      gx.fillStyle = "#0a1a42"; gx.fillRect(0, 0, 64, 96);
      gx.fillStyle = "#cbd08a"; gx.fillRect(0, 0, 64, 8);           // olive kerb line
      gx.fillStyle = "#9ca866"; for (let i = 0; i < 64; i += 16) gx.fillRect(i, 8, 8, 4);
      gx.fillStyle = "#132b63"; for (let i = 0; i < 64; i += 32) gx.fillRect(i + 4, 36, 20, 4);
      gx.fillStyle = "rgba(253,250,220,.18)"; gx.fillRect(8, 64, 24, 4);
      ground.style.backgroundImage = `url(${g.toDataURL()})`;
    })();

    const mctx = mascot.getContext("2d");
    let frameI = 0, dir = 1, lastY = scrollY, dist = 0, idleTimer = 0, maxShift = 0, top = 0;
    function drawMascot() {
      mctx.clearRect(0, 0, mascot.width, mascot.height);
      drawSprite(mctx, WALK[frameI % 4], 0, 0, 4, dir < 0);
    }
    function layout() {
      sec.style.height = "auto";
      maxShift = Math.max(0, track.scrollWidth - innerWidth);
      sec.style.height = innerHeight + maxShift + "px";
      top = sec.getBoundingClientRect().top + scrollY;
      update();
    }
    function update() {
      const p = maxShift ? clamp((scrollY - top) / maxShift, 0, 1) : 0;
      const shift = p * maxShift;
      track.style.transform = `translate3d(${-shift}px,0,0)`;
      cityEl.style.transform = `translate3d(${-shift * 0.35}px,0,0)`;
      ground.style.backgroundPosition = `${-shift}px 0`;
      prog.style.width = p * 100 + "%";
      const mid = innerWidth / 2;
      cards.forEach((c) => { const r = c.getBoundingClientRect(); c.classList.toggle("near", r.left < mid + 120 && r.right > mid - 120); });
      const dy = scrollY - lastY; lastY = scrollY;
      if (p > 0 && p < 1 && dy) {
        dir = dy > 0 ? 1 : -1;
        dist += Math.abs(dy);
        if (dist > 26) { frameI++; dist = 0; }
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { frameI = 0; drawMascot(); }, 160);
      }
      drawMascot();
    }
    addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    addEventListener("resize", layout);
    addEventListener("load", layout);
    layout();
  })();

  /* =========================================================
     8. ROLES — each word steps into the frame, then all fade top→bottom
     ========================================================= */
  (function roles() {
    const list = $("#rolesList");
    if (!list) return;
    const items = $$("li", list), H = 52;
    let alive = false, running = false;
    const go = (i) => { list.style.transform = `translateY(${-(i * H + H / 2)}px)`; items.forEach((li, k) => li.classList.toggle("on", k === i)); };
    // H must match .roles__list li height in CSS
    go(3);
    async function loop() {
      if (running) return; running = true;
      while (alive) {
        for (let i = 0; i < items.length && alive; i++) { go(i); await sleep(i === 0 ? 500 : 340); }
        await sleep(700);
        for (let i = 0; i < items.length && alive; i++) { items[i].classList.add("gone"); await sleep(70); }
        await sleep(700);
        list.style.transition = "none"; go(0); items.forEach((li) => li.classList.remove("gone"));
        void list.offsetWidth; list.style.transition = "";
        await sleep(400);
      }
      running = false;
    }
    if (reduce) return;
    onVisible(list.parentElement, () => { alive = true; loop(); }, () => (alive = false), 0.4);
  })();

  /* =========================================================
     9. EVERY FRAME ON PURPOSE — fast typing + morphing shapes
     ========================================================= */
  (function efp() {
    const sec = $("#efp");
    if (!sec) return;
    const types = $$(".type", sec);
    let typed = false;
    async function typeIt() {
      if (typed) return; typed = true;
      const caret = document.createElement("span"); caret.className = "caret";
      for (const t of types) {
        const txt = t.dataset.text; t.textContent = ""; t.after(caret);
        for (const ch of txt) { t.textContent += ch; await sleep(reduce ? 0 : 38); }
        const fw = t.closest(".frame-word"); if (fw) fw.classList.add("boxed");
        await sleep(reduce ? 0 : 120);
      }
      setTimeout(() => caret.remove(), 1600);
    }
    types.forEach((t) => (t.textContent = ""));

    // shapes sampled at the same angles so they can morph into each other
    const N = 96, TAU = Math.PI * 2;
    const sample = (fn) => Array.from({ length: N }, (_, i) => { const a = (i / N) * TAU; const r = fn(a); return [Math.cos(a) * r, Math.sin(a) * r]; });
    const SHAPES = [
      { name: "CIRCLE", col: "#e94b3c", pts: sample(() => 92) },
      { name: "SQUARE", col: "#3a3df0", pts: sample((a) => 88 / Math.pow(Math.pow(Math.abs(Math.cos(a)), 4) + Math.pow(Math.abs(Math.sin(a)), 4), 0.25)) },
      { name: "BLOB", col: "#b9a7c9", pts: sample((a) => 84 + 10 * Math.sin(3 * a) + 6 * Math.cos(5 * a)) },
      { name: "TRIANGLE", col: "#f5c542", pts: sample((a) => { const k = ((a + Math.PI / 2) % (TAU / 3) + TAU / 3) % (TAU / 3) - Math.PI / 3; return 0.85 * (60 / Math.cos(k)) + 0.15 * 92; }) },
      { name: "FLOWER", col: "#cbd08a", pts: sample((a) => 72 + 22 * Math.cos(5 * a)) },
    ];
    const toD = (pts) => "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
    const path = $("#efpShapePath"), ghost = $("#efpGhost"), box = $("#efpBox");
    const lRot = $("#efpLabelRot"), lShape = $("#efpLabelShape"), sRot = $("#efpRot"), sShape = $("#efpShape"), sLayer = $("#efpLayer");
    path.setAttribute("d", toD(SHAPES[0].pts)); path.setAttribute("fill", SHAPES[0].col);
    let alive = false, running = false, rot = 0;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const hexLerp = (a, b, t) => { const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16)); return "rgb(" + pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",") + ")"; };
    async function loop() {
      if (running) return; running = true;
      let i = 0;
      while (alive) {
        const A = SHAPES[i % SHAPES.length], B = SHAPES[(i + 1) % SHAPES.length];
        ghost.setAttribute("d", toD(A.pts));
        const r0 = rot, r1 = rot + 45 + Math.round(Math.random() * 60);
        await new Promise((res) => {
          const t0 = performance.now(), D = 700;
          (function f(now) {
            const t = ease(clamp((now - t0) / D, 0, 1));
            const pts = A.pts.map((p, k) => [lerp(p[0], B.pts[k][0], t), lerp(p[1], B.pts[k][1], t)]);
            rot = lerp(r0, r1, t);
            path.setAttribute("d", toD(pts)); path.setAttribute("fill", hexLerp(A.col, B.col, t));
            path.setAttribute("transform", `rotate(${rot.toFixed(1)})`); box.setAttribute("transform", `rotate(${rot.toFixed(1)})`);
            const rs = (rot % 360).toFixed(1) + "°";
            lRot.textContent = "ROT " + rs; sRot.textContent = rs;
            if (t < 1 && alive) requestAnimationFrame(f); else res();
          })(t0);
        });
        lShape.textContent = "SHAPE " + B.name; sShape.textContent = B.name; sLayer.textContent = "shape_0" + (((i + 1) % SHAPES.length) + 1);
        ghost.setAttribute("d", "");
        i++;
        await sleep(950);
      }
      running = false;
    }
    onVisible(sec, () => { typeIt(); if (!reduce) { alive = true; loop(); } }, () => (alive = false), 0.25);
  })();

  /* =========================================================
     10. PLAY — "Creativity is like a game" sequence + 3D word wheel
     ========================================================= */
  (function play() {
    const stage = $("#playStage");
    if (!stage) return;
    const steps = $$(".play__s", stage), count = $("#playCount");
    const tools = $$(".tools b", stage);
    tools.forEach((b, i) => { const a = (i / tools.length) * Math.PI * 2 - Math.PI / 2; b.style.setProperty("--tx", Math.cos(a) * 190 + "px"); b.style.setProperty("--ty", Math.sin(a) * 110 + "px"); b.style.transitionDelay = i * 60 + "ms"; });
    const WORDS = ["Illustration", "Pixel Art", "Motion Design", "Character Design", "UI / UX", "Brand Identity", "Storyboarding", "Typography", "Animation", "Visual Design", "Prototyping", "Photography"];
    const wheel = $("#wheel"), inner = document.createElement("div");
    inner.className = "wheel__in";
    inner.innerHTML = WORDS.map((w) => `<span>${w}</span>`).join("");
    wheel.appendChild(inner);
    const spans = $$("span", inner), step = 360 / WORDS.length;
    let ang = 0, spinning = false, alive = false, running = false;
    function spin() {
      if (!spinning) return;
      ang += 0.35;
      spans.forEach((s, i) => {
        let rel = ((i * step - ang) % 360 + 540) % 360 - 180;
        s.style.transform = `rotateX(${-rel}deg)`;
        s.style.opacity = Math.abs(rel) > 80 ? 0 : 1;
        s.classList.toggle("on", Math.abs(rel) < step / 2);
      });
      requestAnimationFrame(spin);
    }
    const DUR = [1300, 1700, 2300, 1900, 5200];
    async function loop() {
      if (running) return; running = true;
      while (alive) {
        for (let i = 0; i < steps.length && alive; i++) {
          steps.forEach((s, k) => s.classList.toggle("on", k === i));
          count.textContent = `0${i + 1} / 0${steps.length}`;
          if (i === 4 && !spinning) { spinning = true; spin(); }
          await sleep(DUR[i]);
        }
        spinning = false;
      }
      running = false;
    }
    if (reduce) { steps.forEach((s, k) => s.classList.toggle("on", k === 4)); spinning = true; spin(); spinning = false; return; }
    onVisible(stage, () => { alive = true; loop(); }, () => { alive = false; }, 0.35);

    // Playbook track
    const PLAYS = [
      { src: "assets/img/portrait-grid.png", label: "Pixel self", pixel: true },
      { src: "assets/img/subro-dog.gif", label: "One-line dog" },
      { src: "assets/img/work-02.jpg", label: "Plaid sky" },
      { src: "assets/img/work-01.jpg", label: "Scream study" },
      { src: "assets/img/polaroid-writing.png", label: "Sketchbook" },
      { src: "assets/img/work-04.jpg", label: "Self, drawn" },
      { src: "assets/img/project-chittarupa.jpg", label: "Durga study" },
    ];
    $("#playbookTrack").innerHTML = PLAYS.map((p) => `<figure class="pb${p.pixel ? " pb--pixel" : ""}"><img src="${p.src}" alt="${p.label}" loading="lazy" /><span>${p.label}</span></figure>`).join("");
  })();

  /* =========================================================
     11. TOOLKIT — throwable polaroid cards with simple physics
     ========================================================= */
  (function toolkit() {
    const box = $("#toolBox");
    if (!box) return;
    const TOOLS = [
      { n: "Figma", bg: "#1e1e1e", fg: "#fff", t: "◐", svg: '<svg viewBox="0 0 38 57" width="40"><path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/><path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/><path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/><path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/><path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/></svg>' },
      { n: "Illustrator", bg: "#330000", fg: "#ff9a00", t: "Ai" },
      { n: "Photoshop", bg: "#001e36", fg: "#31a8ff", t: "Ps" },
      { n: "After Effects", bg: "#00005b", fg: "#9999ff", t: "Ae" },
      { n: "Premiere Pro", bg: "#00005b", fg: "#ea77ff", t: "Pr" },
      { n: "InDesign", bg: "#49021f", fg: "#ff3366", t: "Id" },
      { n: "Procreate", bg: "#111", fg: "#fff", t: "✎" },
      { n: "Blender", bg: "#e87d0d", fg: "#fff", t: "◉" },
      { n: "Aseprite", bg: "#7d929e", fg: "#fff", t: "▦" },
      { n: "Framer", bg: "#000", fg: "#fff", t: "◤" },
      { n: "Notion", bg: "#fff", fg: "#111", t: "N", border: true },
      { n: "Canva", bg: "#00c4cc", fg: "#fff", t: "C" },
    ];
    const els = TOOLS.map((t) => {
      const d = document.createElement("div");
      d.className = "tool";
      d.innerHTML = `<div class="tool__logo" style="background:${t.bg};color:${t.fg};${t.border ? "border:2px solid #111" : ""}">${t.svg || t.t}</div><div class="tool__name">${t.n}</div>`;
      box.appendChild(d);
      return d;
    });
    let W = 0, H = 0, bodies = [], running = false, started = false, grab = null, last = 0;
    let R = 72, HW = 66, HH = 79;
    function size() {
      W = box.clientWidth; H = box.clientHeight;
      const t = els[0]; HW = t.offsetWidth / 2; HH = t.offsetHeight / 2; R = HW * 1.09;
    }
    function init() {
      size();
      const rows = W < 760 ? 2 : 1, n = Math.ceil(els.length / rows), span = Math.max(200, W - 2 * HW - 40);
      bodies = els.map((el, i) => ({ el, row: i % rows, x: HW + 20 + ((Math.floor(i / rows) + 0.5) / n) * span, y: -120 - i * 70, vx: (Math.random() - 0.5) * 40, vy: 0, a: (Math.random() - 0.5) * 0.5, va: (Math.random() - 0.5) * 0.6, ph: i * 1.7 }));
    }
    let clock = 0;
    function stepPhys(dt) {
      // slow, floaty fall; cards hover above the floor and bob gently instead of landing
      const g = 520, lift = Math.max(70, H * 0.14);
      clock += dt;
      for (const b of bodies) {
        if (b === grab) continue;
        b.vy += g * dt;
        b.vx *= 1 - 1.2 * dt; b.vy *= 1 - 0.6 * dt;               // air drag
        const fl = H - HH - lift - b.row * (HH * 2 + 18) + Math.sin(clock * 1.3 + b.ph) * 9;  // float line (2 rows on phones)
        if (b.y > fl) {
          b.vy -= (b.y - fl) * 38 * dt;                           // soft spring pushes it back up
          b.vy *= 1 - 3.5 * dt;
          b.va += (-b.a * 2.2 + Math.sin(clock * 0.9 + b.ph) * 0.15) * dt;
          b.va *= 1 - 2.5 * dt;
        }
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
        if (b.y > H - HH) { b.y = H - HH; b.vy = Math.min(0, b.vy); }
        if (b.y < HH && b.vy < 0) { b.vy *= -0.4; }
        if (b.x < HW) { b.x = HW; b.vx *= -0.5; } if (b.x > W - HW) { b.x = W - HW; b.vx *= -0.5; }
        b.va *= 1 - 0.4 * dt;
      }
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const A = bodies[i], B = bodies[j], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
        const md = R * 1.55;
        if (d < md) {
          const o = (md - d) / 2 * 0.5, nx = dx / d, ny = dy / d;     // soft separation (no jitter)
          if (A !== grab) { A.x -= nx * o; A.y -= ny * o; } if (B !== grab) { B.x += nx * o; B.y += ny * o; }
          const rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rv < 0) { const imp = -rv * 0.4; if (A !== grab) { A.vx -= nx * imp; A.vy -= ny * imp; A.va -= 0.08; } if (B !== grab) { B.vx += nx * imp; B.vy += ny * imp; B.va += 0.08; } }
        }
      }
    }
    function render() { for (const b of bodies) b.el.style.transform = `translate(${b.x}px,${b.y}px) rotate(${b.a}rad)`; }
    function loop(now) {
      if (!running) return;
      const dt = Math.min(0.033, (now - (last || now)) / 1000); last = now;
      stepPhys(dt / 2); stepPhys(dt / 2); render();
      requestAnimationFrame(loop);
    }
    box.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".tool"); if (!el) return;
      grab = bodies.find((b) => b.el === el); if (!grab) return;
      el.setPointerCapture(e.pointerId); el.classList.add("grab");
      const r = box.getBoundingClientRect();
      grab.ox = e.clientX - r.left - grab.x; grab.oy = e.clientY - r.top - grab.y; grab.lx = e.clientX; grab.lt = performance.now();
    });
    box.addEventListener("pointermove", (e) => {
      if (!grab) return;
      const r = box.getBoundingClientRect(), now = performance.now(), dt = Math.max(1, now - grab.lt) / 1000;
      const nx = clamp(e.clientX - r.left - grab.ox, HW, W - HW), ny = clamp(e.clientY - r.top - grab.oy, HH, H - HH);
      grab.vx = (nx - grab.x) / dt; grab.vy = (ny - grab.y) / dt; grab.x = nx; grab.y = ny; grab.lt = now;
      grab.a += (grab.vx / 6000);
    });
    const release = () => { if (!grab) return; grab.el.classList.remove("grab"); grab.vx = clamp(grab.vx, -1100, 1100); grab.vy = clamp(grab.vy, -1100, 1100); grab.va = grab.vx / 900; grab = null; };
    box.addEventListener("pointerup", release); box.addEventListener("pointercancel", release);
    addEventListener("resize", size);
    init(); render();
    onVisible(box, () => { if (!started) { started = true; init(); } running = true; last = 0; requestAnimationFrame(loop); }, () => (running = false), 0.2);
  })();

  /* =========================================================
     MY STORY overlay
     ========================================================= */
  (function story() {
    const el = $("#story");
    if (!el) return;
    let lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      el.hidden = false; void el.offsetWidth;
      el.classList.add("open"); document.body.classList.add("story-open");
      $("#storyScroll").scrollTop = 0;
      setTimeout(() => $(".story__close", el).focus(), 50);
    }
    function close() {
      el.classList.remove("open"); document.body.classList.remove("story-open");
      setTimeout(() => { el.hidden = true; }, 800);
      if (lastFocus) lastFocus.focus();
    }
    $$("[data-open-story]").forEach((b) => b.addEventListener("click", () => (el.classList.contains("open") ? close() : open())));
    $$("[data-close-story]").forEach((b) => b.addEventListener("click", close));
    // nav links (Projects, Experiments, logo) close the story and go to the section
    $$(".nav a[href^='#']").forEach((a) => a.addEventListener("click", () => { if (el.classList.contains("open")) close(); }));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && el.classList.contains("open")) close(); });
    if (location.hash === "#story") open();
  })();

  /* star: eyes follow the pointer a little */
  (function starEyes() {
    const eyes = $("#starEyes"), star = $(".star");
    if (!eyes || reduce) return;
    addEventListener("pointermove", (e) => {
      const r = star.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const dx = clamp((e.clientX - (r.left + r.width / 2)) / r.width, -1, 1), dy = clamp((e.clientY - (r.top + r.height / 2)) / r.height, -1, 1);
      eyes.style.transform = `translate(${dx * 16}px, ${dy * 12}px)`;
    }, { passive: true });
  })();

  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();

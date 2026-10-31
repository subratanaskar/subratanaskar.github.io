/* =========================================================
   Subrata Naskar — Portfolio v2 interactions
   Flow: face loader → "Helloo" eyes → landing (pixel portrait
   builds itself) → taxi strip → worked with →
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
     SPRITES — live in js/sprites.js (window.SUBRO_SPRITES)
     ========================================================= */
  /* bake a string-map sprite into a 1px-per-cell canvas (drawn scaled with smoothing off) */
  function bakeSprite(map, pal) {
    const c = document.createElement("canvas");
    c.width = map[0].length; c.height = map.length;
    const x = c.getContext("2d");
    map.forEach((row, y) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== "." && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } } });
    return c;
  }


  /* =========================================================
     1 + 2. LOADER → HELLO (eyes) → LANDING
     ========================================================= */
  const loader = $("#loader"), video = $("#loaderVideo"), bar = $("#loaderBar");
  const hello = $("#hello");
  let started = false;

  async function runHello() {
    hello.classList.add("show");
    await sleep(1500);                                   // "Helloo" rises (like the reference)
    hello.classList.add("eyes");                         // two eyes look around for ~1s
    const pupils = $$(".hello__oo .pupil", hello);
    // pupils start where the Figma puts them (looking right), then look around for ~1s
    const look = [[-58, 0], [-48, -16], [6, -18], [22, 16], [-26, 14], [0, 0]];
    for (const [px, py] of look) {
      pupils.forEach((p) => { p.style.transform = `translate(${px}px, ${py}px)`; });
      await sleep(280);
    }
    hello.classList.add("leave");
    document.body.classList.remove("is-loading");
    startLanding();
    await sleep(1250);
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
    setTimeout(finishLoader, 5000);                      // the face clip is ~1.7s; never hang on a slow network
  }

  /* =========================================================
     3. LANDING — pixel portrait built by a plus cursor in 2s
     ========================================================= */
  var landingStarted = false;
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
    // Reveal like a design tool (2s): the plus cursor drags out a square,
    // then the square fills up with pixels until it becomes the face.
    const art = cv.parentElement;
    let box = $(".reveal-box", art);
    if (!box) {
      box = document.createElement("div");
      box.className = "reveal-box";
      box.innerHTML = '<i class="rb-h rb-tl"></i><i class="rb-h rb-tr"></i><i class="rb-h rb-bl"></i><i class="rb-h rb-br"></i><b class="rb-size">0 × 0</b>';
      art.appendChild(box);
    }
    const size = $(".rb-size", box);
    // pixels appear in a scattered order, biased top → bottom
    let sd = 11;
    const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    const order = blocks.map((bl) => ({ bl, k: bl.by / Math.ceil(P.h / B) * 0.65 + rnd() * 0.35 })).sort((p, q) => p.k - q.k).map((o) => o.bl);
    const T_IN = 180, T_DRAG = 820, T_END = 2000;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const t0 = performance.now();
    let i = 0;
    cur.classList.add("on");
    box.classList.add("on");
    (function step(now) {
      const t = now - t0;
      const r = cv.getBoundingClientRect();
      const Wd = r.width, Hd = r.height;
      if (t < T_IN) {
        cur.style.left = "0px"; cur.style.top = "0px";
        box.style.width = "0px"; box.style.height = "0px";
      } else if (t < T_DRAG) {
        const k = easeOut((t - T_IN) / (T_DRAG - T_IN));
        const w = Wd * k, h = Hd * k;
        cur.style.left = w + "px"; cur.style.top = h + "px";
        box.style.width = w + "px"; box.style.height = h + "px";
        size.textContent = Math.round(P.w * k) + " × " + Math.round(P.h * k);
      } else {
        box.style.width = Wd + "px"; box.style.height = Hd + "px";
        size.textContent = P.w + " × " + P.h;
        box.classList.add("filling");
        const k = clamp((t - T_DRAG) / (T_END - T_DRAG - 120), 0, 1);
        const target = Math.floor(k * order.length);
        while (i < target) drawBlock(order[i++]);
        cur.classList.remove("on");
      }
      if (t < T_END) requestAnimationFrame(step);
      else {
        while (i < order.length) drawBlock(order[i++]);
        box.classList.add("done");
        setTimeout(() => box.remove(), 600);
      }
    })(t0);
  }

  /* =========================================================
     4. TAXI STRIP — pixel Subro on a yellow taxi, tossing interests
     ========================================================= */
  (function taxiStrip() {
    const cv = $("#taxiCanvas");
    const SPR = window.SUBRO_SPRITES;
    if (!cv || !SPR) return;
    const ctx = cv.getContext("2d");
    const ORDER = ["football", "tabletennis", "camera", "painting", "writing", "movies", "cricket", "dancing", "swimming", "travelling", "cooking"];
    const icons = ORDER.map((n) => bakeSprite(SPR.icons[n], SPR.iconPal));
    const seat = SPR.sit.map((m) => bakeSprite(m, SPR.runPal || SPR.sitPal));   // same Subro as the runner
    const SEAT = (SPR.seatRow || 40) + 6;                  // sprite row that rests on the roof
    const taxiImg = new Image();
    taxiImg.src = "assets/img/taxi.svg";                      // 427 × 163, faces right
    const TW = 427, TH = 163;
    let W = 0, H = 0, road = 0, city = null, running = false, last = 0, taxiX = -500, items = [], throwT = 0, iconIdx = 0, armT = 0, S = 4;

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

    let k = 1, taxiW = 0, taxiH = 0, cell = 3;
    function resize() {
      const r = cv.getBoundingClientRect(), dpr = DPR();
      W = r.width; H = r.height; road = Math.round(H * 0.78);
      S = clamp(Math.floor(road / 44), 3, 6);
      taxiW = clamp(W * 0.3, 250, 400); k = taxiW / TW; taxiH = TH * k;
      cell = Math.max(1.5, Math.round(k * 3.0 * 2) / 2);   // one sprite pixel, in CSS px
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      city = makeCity();
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min(48, now - (last || now)); last = now;
      const speed = Math.max(120, W / 8);                     // px per second
      taxiX += speed * dt / 1000;
      if (taxiX > W + 60) taxiX = -taxiW - 60;               // vanish right, re-enter left
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(city, 0, 0, city.width, city.height, 0, 0, city.width * S, city.height * S);
      ctx.fillStyle = C.navyDeep; ctx.fillRect(0, road, W, H - road);
      ctx.fillStyle = "rgba(253,250,220,.25)";
      const dash = 48, off = (now * speed / 1000 * 0.0) % dash;
      for (let x = 12 - off; x < W; x += dash) ctx.fillRect(Math.round(x), Math.round(road + (H - road) * 0.45), 24, 4);
      const bob = (Math.floor(now / 140) % 2) * Math.max(1, Math.round(k));   // engine shake
      const tx = Math.round(taxiX), ty = Math.round(road - taxiH + 8 * k);
      // Subro sits on the roof, behind the TAXI sign, legs over the windscreen
      const sp = seat[armT > 0 ? 1 : 0];
      const sw = sp.width * cell, sh = sp.height * cell;
      const roofY = ty + 9 * k - bob;
      const sx = Math.round(tx + 128 * k - 14 * cell), sy = Math.round(roofY - SEAT * cell);
      if (taxiImg.complete && taxiImg.naturalWidth) {
        // the SVG is drawn facing left, so mirror it: bonnet leads, boot trails
        ctx.save(); ctx.translate(tx + taxiW, ty - bob); ctx.scale(-1, 1);
        ctx.drawImage(taxiImg, 0, 0, taxiW, taxiH); ctx.restore();
      }
      ctx.drawImage(sp, sx, sy, sw, sh);
      // toss interests out of his raised hand
      throwT += dt; armT -= dt;
      if (throwT > 620 && taxiX > -taxiW && taxiX < W) {
        throwT = 0; armT = 260;
        const ic = icons[iconIdx++ % icons.length];
        items.push({ ic, x: sx + 12 * cell, y: sy + 28 * cell, vx: speed * 0.2 - (100 + Math.random() * 120), vy: -(300 + Math.random() * 140), r: 0, vr: (Math.random() - 0.5) * 6, life: 1 });
      }
      items = items.filter((it) => it.life > 0);
      const isz = 12 * Math.max(2, cell);
      items.forEach((it) => {
        it.vy += 900 * dt / 1000; it.x += it.vx * dt / 1000; it.y += it.vy * dt / 1000; it.r += it.vr * dt / 1000;
        const floor = road + 10;
        if (it.y > floor) { it.y = floor; it.vy *= -0.35; it.vx *= 0.6; it.vr *= 0.5; it.life -= 0.012 * dt / 16; }
        if (it.y >= floor - 1 && Math.abs(it.vy) < 30) it.life -= 0.02 * dt / 16;
        ctx.save(); ctx.globalAlpha = clamp(it.life, 0, 1); ctx.translate(Math.round(it.x), Math.round(it.y));
        ctx.rotate(Math.round(it.r * 4) / 4);                 // snap rotation so it stays chunky
        ctx.drawImage(it.ic, -isz / 2, -isz / 2, isz, isz); ctx.restore();
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

    // runner traced from the reference: a 10-frame cycle, advanced by scroll distance
    const SPR = window.SUBRO_SPRITES;
    const RUN = SPR ? SPR.run.map((m) => bakeSprite(m, SPR.runPal || SPR.pal)) : [];
    const IDLE = 3;                                         // the most upright frame
    const mctx = mascot.getContext("2d");
    const RW = RUN.length ? RUN[0].width : 55, RH = RUN.length ? RUN[0].height : 63;
    mascot.width = RW * 4; mascot.height = RH * 4;
    let frameI = IDLE, dir = 1, lastY = scrollY, dist = 0, idleTimer = 0, maxShift = 0, top = 0;
    function drawMascot() {
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.clearRect(0, 0, mascot.width, mascot.height);
      if (!RUN.length) return;
      mctx.imageSmoothingEnabled = false;
      if (dir < 0) { mctx.translate(mascot.width, 0); mctx.scale(-1, 1); }
      mctx.drawImage(RUN[frameI % RUN.length], 0, 0, mascot.width, mascot.height);
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
        if (dist > 18) { frameI++; dist = 0; }
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { frameI = IDLE; drawMascot(); }, 220);
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
          if (count) count.textContent = `0${i + 1} / 0${steps.length}`;
          if (i === 4 && !spinning) { spinning = true; spin(); }
          await sleep(DUR[i]);
        }
        spinning = false;
      }
      running = false;
    }
    if (reduce) { steps.forEach((s, k) => s.classList.toggle("on", k === 4)); spinning = true; spin(); spinning = false; return; }
    onVisible(stage, () => { alive = true; loop(); }, () => { alive = false; }, 0.35);

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
      { n: "Procreate", bg: "#242424", fg: "#fff", img: "assets/img/tools/procreate.svg", full: true },
      { n: "Framer", bg: "#000000", fg: "#fff", svg: "<svg viewBox=\"0 0 14 21\" width=\"24\" aria-hidden=\"true\"><path fill=\"#fff\" d=\"M0 0h14v7H7zm0 7h7l7 7H0zm0 7h7v7z\"/></svg>" },
      { n: "Claude", bg: "#f0eee6", fg: "#d97757", svg: "<svg viewBox=\"0 0 24 24\" width=\"40\" aria-hidden=\"true\"><path fill=\"#D97757\" d=\"m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z\"/></svg>" },
      { n: "ChatGPT", bg: "#000000", fg: "#fff", svg: "<svg viewBox=\"0 0 24 24\" width=\"38\" aria-hidden=\"true\"><path fill=\"#ffffff\" d=\"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z\"/></svg>" },
      { n: "SketchUp", bg: "#005f9e", fg: "#fff", svg: "<svg viewBox=\"0 0 24 24\" width=\"38\" aria-hidden=\"true\"><path fill=\"#ffffff\" d=\"M.968 9.027l7.717 4.428-.006 1.32-4.39-2.518-2.763 1.57 7.148 4.12.005 1.27-7.658-4.405c.02.516.488 2.106 1.383 3.337.91 1.247 1.946 1.776 1.946 1.776L11.428 24V11.849L.975 5.846zm22.064-3.8L15.22.723S13.982 0 12.008 0C9.952 0 8.76.746 8.76.746l-7.236 4.14 11.009 6.328V24l7.245-4.136s1.295-.715 2.279-2.414c.867-1.496.975-2.943.975-2.943zM11.251 7.308s1.615-.298 2.98.49l2.171 1.25s.003 1.097.003 2.736c0 1.313-1.112 2.674-1.112 2.674l.002-4.816zm6.402 10.562l-2.358 1.353v-1.269l1.835-1.05c1.748-1.26 2.037-3.117 2.037-3.761l-.007-5.705-5.006-2.881s-.76-.499-2.129-.499c-1.367 0-2.113.461-2.113.461L8.154 5.53l-1.11-.641L9.473 3.5s.95-.527 2.544-.527c1.462 0 2.6.571 2.6.571L20.27 6.81l-.007 6.226c.04.957-.406 3.296-2.61 4.835z\"/></svg>" },
      { n: "AutoCAD", bg: "#f1f1f1", fg: "#fff", img: "assets/img/tools/autocad.svg" },
      { n: "ArcGIS", bg: "#f1f1f1", fg: "#fff", img: "assets/img/tools/arcgis.png" },
    ];
    const els = TOOLS.map((t) => {
      const d = document.createElement("div");
      d.className = "tool";
      const mark = t.img ? `<img class="tool__img${t.full ? " tool__img--full" : ""}" src="${t.img}" alt="" draggable="false" />` : (t.svg || t.t);
      d.innerHTML = `<div class="tool__logo" style="background:${t.bg};color:${t.fg};${t.border ? "border:2px solid #111" : ""}">${mark}</div><div class="tool__name">${t.n}</div>`;
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

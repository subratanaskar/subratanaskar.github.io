/* FILBo 2026 — page behaviour: the live kiosk inside the hero frame, counting stats, the "Kiosk Interface"
   button that opens the running kiosk, and the live clips from the fair floor */
(() => {
  const doc = document.getElementById("doc");
  if (!doc) return;
  const root = doc.firstElementChild;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const q = (s, el = root) => el.querySelector(s);
  const qa = (s, el = root) => [...el.querySelectorAll(s)];

  // The real kiosk, published on GitHub Pages (path is case-sensitive)
  const KIOSK_URL = "https://subro.me/FILBo-2026-Colombia-Kiosk-Navigation/";
  // Embedded copy starts on Welcome and skips the large intro videos, so the frame loads fast.
  const KIOSK_EMBED_URL = KIOSK_URL + "?embed=1";

  // ---- 1. the hero frame runs the actual kiosk: visitors can tap zones, follow footsteps, switch EN / ES.
  // The still screenshot stays underneath as a poster until the kiosk has loaded.
  const screen = q('[data-name="img/hero_kiosk"]');
  if (screen) {
    // The case study canvas is scaled with CSS zoom; an iframe inside a zoomed box renders black or
    // mis-places taps in several browsers. So the iframe lives on <body>, outside the zoom, and is
    // pinned on top of the screen area of the bezel.
    const frame = document.createElement("iframe");
    frame.className = "kiosk-live";
    frame.title = "FILBo 2026 kiosk, running live. Tap a zone to try it.";
    frame.setAttribute("allow", "autoplay; fullscreen");
    frame.setAttribute("referrerpolicy", "no-referrer");
    Object.assign(frame.style, {
      position: "absolute", left: "0", top: "0", width: "0", height: "0",
      border: "0", display: "block", zIndex: "5", background: "#1e1412",
      borderRadius: getComputedStyle(screen).borderRadius || "10px",
      opacity: "0", transition: "opacity .6s ease",
    });
    document.body.appendChild(frame);

    // Keep the iframe exactly over the screen (follows resizes, zoom changes and the reveal animation).
    const place = () => {
      const r = screen.getBoundingClientRect();
      if (!r.width || !r.height) { frame.style.visibility = "hidden"; return; }
      frame.style.visibility = "visible";
      frame.style.left = r.left + scrollX + "px";
      frame.style.top = r.top + scrollY + "px";
      frame.style.width = r.width + "px";
      frame.style.height = r.height + "px";
    };
    let raf = 0, near = false;
    const loop = () => { place(); raf = near ? requestAnimationFrame(loop) : 0; };
    addEventListener("resize", place);
    if ("ResizeObserver" in window) new ResizeObserver(place).observe(document.body);
    place();

    // Show the kiosk once its page has loaded; until then the still screenshot underneath stays visible.
    frame.addEventListener("load", () => {
      if (frame.src) setTimeout(() => { frame.style.opacity = "1"; }, 250);
    });

    // Load only when the frame is near the viewport (the kiosk's intro video is large),
    // and only track its position while it is near the viewport.
    const load = () => { if (!frame.src) frame.src = KIOSK_EMBED_URL; };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        near = es.some((e) => e.isIntersecting);
        if (near) { load(); if (!raf) raf = requestAnimationFrame(loop); }
      }, { rootMargin: "600px 0px" });
      io.observe(screen);
    } else {
      load();
    }

    // Caption under the frame tells people it is live.
    const bezel = screen.closest('[data-name="Kiosk 43in — bezel"]');
    const caption = bezel && bezel.nextElementSibling;
    if (caption && caption.tagName === "P") {
      caption.textContent = "This is the real kiosk, running live. Tap the screen, pick a zone and follow the footsteps from “You are here”.";
    }
  }

  // ---- 2. numbers count up when they come into view (600k+, 14, 12, 2 · 4k, 6, 12, 100 s)
  const nums = qa('[data-name^="Stat "] > p:first-child, [data-name="Build stats"] > * > p:first-child')
    .filter((p) => /^\d+/.test(p.textContent.trim()));
  if (!reduce && nums.length && "IntersectionObserver" in window) {
    nums.forEach((p) => {
      const t = p.textContent.trim(), m = t.match(/^(\d+)(.*)$/);
      p.dataset.to = m[1]; p.dataset.suffix = m[2];
      p.style.minWidth = p.offsetWidth + "px";
      p.textContent = "0" + m[2];
    });
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const p = e.target, to = +p.dataset.to, t0 = performance.now(), d = 1400;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / d), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
        p.textContent = v + p.dataset.suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    nums.forEach((p) => io.observe(p));
  }

  // ---- 4. "Kiosk Interface" opens the running kiosk in a new tab
  const cta = qa("p").find((p) => p.textContent.trim() === "Kiosk Interface");
  if (cta) {
    const btn = cta.parentElement;
    btn.classList.add("kiosk-cta");
    btn.setAttribute("role", "link");
    btn.setAttribute("aria-label", "Open the live FILBo 2026 kiosk in a new tab");
    btn.title = "Open the live kiosk";
    btn.tabIndex = 0;
    const go = () => window.open(KIOSK_URL, "_blank", "noopener");
    btn.addEventListener("click", go);
    btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  }

  // ---- 6. the live clips play for real (shot on the floor at Corferias), only while on screen
  const clips = [
    [q('[data-name="img/live_visitor"]'), "live-visitor"],
    [q('[data-name="img/live_tap"]'), "live-tap"],
    [q('[data-name="img/live_closeup"]'), "live-closeup"],
  ];
  const note = qa("p").find((p) => p.textContent.trim().startsWith("Designing the screens and turning them"));
  if (note && note.nextElementSibling) {
    const box = note.nextElementSibling;
    box.style.borderRadius = "16px";
    box.style.overflow = "hidden";
    box.style.background = "#1e1412";
    clips.push([box, "remote-build"]);
  }
  const vids = [];
  clips.forEach(([box, name]) => {
    if (!box) return;
    const v = document.createElement("video");
    v.className = "clip";
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.poster = `video/${name}.jpg`;
    v.src = `video/${name}.mp4`;
    v.setAttribute("aria-label", "Clip from the kiosk on the floor at FILBo 2026");
    box.appendChild(v);
    vids.push(v);
  });
  if (vids.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      vids.forEach((v) => { v.controls = true; v.preload = "metadata"; });
    } else {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
      }), { threshold: 0.25 });
      vids.forEach((v) => io.observe(v));
    }
  }
})();

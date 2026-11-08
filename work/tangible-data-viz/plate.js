/* Behind the Plate — page-specific interactions: skewers that build themselves, block weights on hover,
   the making-process path drawing as you scroll, and smoke rising off the grill. */
(() => {
  const root = document.getElementById("doc").firstElementChild;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- skewers: each stage block slides onto the rod in order; hover shows its weight
  const tip = document.createElement("div");
  tip.className = "plate-tip";
  document.body.appendChild(tip);
  const skewers = [...root.querySelectorAll('[data-name^="Skewer —"]')];
  skewers.forEach((sk) => {
    const food = sk.getAttribute("data-name").replace("Skewer — ", "");
    const blocks = [...sk.querySelectorAll('[data-name*=" block · "]')];
    blocks.forEach((b, i) => {
      b.setAttribute("data-skew", "");
      b.style.transitionDelay = `${120 + i * 110}ms`;
      const kg = b.getAttribute("data-name").split(" block · ")[1];
      b.addEventListener("mouseenter", () => { tip.textContent = `${food} · ${kg} CO₂e`; tip.classList.add("on"); });
      b.addEventListener("mousemove", (e) => { tip.style.left = e.clientX + "px"; tip.style.top = e.clientY + "px"; });
      b.addEventListener("mouseleave", () => tip.classList.remove("on"));
    });
    if (reduce || !("IntersectionObserver" in window)) return;
    sk.classList.add("skew-wait");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { setTimeout(() => sk.classList.remove("skew-wait"), 250); io.unobserve(sk); }
    }), { rootMargin: "0px 0px -15% 0px" });
    io.observe(sk);
  });

  // ---- making process: the dotted path between the seven steps draws itself as you scroll
  const path = root.querySelector('[data-name="Process path"]');
  const draw = () => {
    if (!path) return;
    const r = path.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.7 - r.top) / r.height));
    path.style.clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
  };
  if (!reduce) { addEventListener("scroll", draw, { passive: true }); draw(); }

  // ---- smoke rising off the hero grill and the final grill
  if (!reduce) {
    const puff = (host, n, xs) => {
      if (!host) return;
      for (let i = 0; i < n; i++) {
        const s = document.createElement("i");
        s.className = "plate-smoke";
        s.style.left = `${xs[0] + Math.random() * (xs[1] - xs[0])}px`;
        s.style.bottom = `${40 + Math.random() * 160}px`;
        s.style.animationDelay = `${-Math.random() * 7}s`;
        s.style.animationDuration = `${6 + Math.random() * 4}s`;
        host.appendChild(s);
      }
    };
    puff(root.querySelector('[data-name="00 · Hero"]'), 9, [200, 1200]);
    const met = root.querySelector('[data-name="09 · The Metaphor"]');
    puff(met && met.querySelector('[data-name^="AI image"]'), 7, [300, 1200]);
  }
})();

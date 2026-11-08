/* Form Follows Evidence — page behaviour: canvas scaling, reveals, timeline draw, lightbox, progress */
(() => {
  const doc = document.getElementById("doc");
  const root = doc.firstElementChild;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // scale the 1440px Figma canvas to the viewport (never above 1:1)
  const fit = () => {
    const w = document.documentElement.clientWidth;
    doc.style.setProperty("--z", Math.min(1.5, w / 1440));   // grow up to 1.5x so the canvas spans the window
  };
  fit();
  addEventListener("resize", fit);

  // on screens wider than 1440px, let each full-width band's colour run to the screen edges
  [...root.children].forEach((el) => {
    const bg = getComputedStyle(el).backgroundColor;
    if (el.offsetWidth >= 1439 && bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      el.style.boxShadow = `0 0 0 100vmax ${bg}`;
      el.style.clipPath = "inset(0 -100vmax)";
    }
  });

  // reveal each top-level block as it scrolls into view
  const blocks = [...root.children].filter((el) => el.getBoundingClientRect().height > 30);
  if (!reduce && "IntersectionObserver" in window) {
    blocks.forEach((el) => el.classList.add("rv"));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    blocks.forEach((el) => io.observe(el));
  }

  // storyboard: the red curvy timeline draws itself as you scroll through the eight scenes
  const tl = root.querySelector('[data-name="Curvy timeline"]');
  const line = tl && tl.querySelector('[data-name="Vector"]');
  const draw = () => {
    if (!line) return;
    const r = tl.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top) / r.height));
    line.style.clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
  };

  // reading progress
  const prog = document.getElementById("prog");
  const back = document.querySelector(".pj-back"), end = document.querySelector(".pj-end");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (!reduce) draw();
    // the floating Back to Works button steps aside once the Previous / Next buttons are on screen
    if (back && end) back.classList.toggle("away", end.getBoundingClientRect().top < innerHeight - 40);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // click any photo / page scan to see it large
  const lb = document.getElementById("lb"), lbImg = lb.querySelector("img");
  root.querySelectorAll('img[src$=".webp"]').forEach((img) => {
    const box = img.getBoundingClientRect();
    if (box.width < 60 || box.height < 60) return;
    img.classList.add("zoomable");
    img.style.pointerEvents = "auto";
    img.addEventListener("click", () => { lbImg.src = img.src; lb.classList.add("on"); });
  });
  // links back to the home page skip its intro animation (a refresh of the home page still plays it)
  document.querySelectorAll('a[href^="../../"]').forEach((a) => a.addEventListener("click", () => {
    try { sessionStorage.setItem("subro-skip-intro", "1"); } catch (e) {}
  }));

  const close = () => lb.classList.remove("on");
  lb.addEventListener("click", close);
  addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();

/* Subrata Naskar — Portfolio interactions */
(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Intro: Subro animation ---------- */
  const intro = document.getElementById("intro");
  const video = document.getElementById("introVideo");
  const bar = document.getElementById("introBar");
  const skip = document.getElementById("introSkip");
  let finished = false;

  const finishIntro = () => {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem("subro-intro-seen", "1"); } catch (e) {}
    intro.classList.add("is-ending");
    requestAnimationFrame(() => intro.classList.add("is-done"));
    intro.setAttribute("aria-hidden", "true");
    body.classList.remove("is-loading");
    setTimeout(() => {
      body.classList.add("is-ready");
      startGreeting();
      try { video.pause(); } catch (e) {}
    }, 250);
  };

  let seen = false;
  try { seen = sessionStorage.getItem("subro-intro-seen") === "1"; } catch (e) {}

  if (seen || reduceMotion) {
    intro.classList.add("is-done");
    finishIntro();
  } else {
    video.addEventListener("timeupdate", () => {
      if (video.duration) bar.style.width = (video.currentTime / video.duration) * 100 + "%";
    });
    video.addEventListener("ended", finishIntro);
    video.addEventListener("error", finishIntro);
    skip.addEventListener("click", finishIntro);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") finishIntro(); });
    const p = video.play();
    if (p && p.catch) p.catch(finishIntro);
    setTimeout(finishIntro, 16000); // safety net
  }

  /* ---------- Greeting: Hello → Namaskar → নমস্কার ---------- */
  const greetings = [
    { text: "Hello", lang: "en" },
    { text: "Namaskar", lang: "en" },
    { text: "নমস্কার", lang: "bn" },
  ];
  const greetEl = document.getElementById("greet");
  let gi = 0;
  let greetStarted = false;

  function startGreeting() {
    if (greetStarted || reduceMotion) return;
    greetStarted = true;
    setInterval(() => {
      greetEl.classList.add("is-out");
      setTimeout(() => {
        gi = (gi + 1) % greetings.length;
        greetEl.textContent = greetings[gi].text;
        greetEl.setAttribute("lang", greetings[gi].lang);
        greetEl.classList.remove("is-out");
        greetEl.classList.add("is-in");
        void greetEl.offsetWidth; // restart transition
        greetEl.classList.remove("is-in");
      }, 450);
    }, 2200);
  }

  /* ---------- Live clock (India) ---------- */
  const clock = document.getElementById("clock");
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true, timeZone: "Asia/Kolkata",
  });
  const tick = () => { if (clock) clock.textContent = fmt.format(new Date()) + " IST"; };
  tick();
  setInterval(tick, 1000);

  /* ---------- Scroll reveals ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Project videos: play only while visible ---------- */
  const workVideos = document.querySelectorAll(".card__media video");
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting && !reduceMotion) {
          if (v.preload === "none") v.preload = "auto";
          const p = v.play(); if (p && p.catch) p.catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    workVideos.forEach((v) => vio.observe(v));
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

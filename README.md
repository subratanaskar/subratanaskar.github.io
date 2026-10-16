# Subrata Naskar — Portfolio

Static site (HTML / CSS / JS, no build step) for GitHub Pages.

```
index.html          page markup
css/fonts.css       PP Editorial New (headings) + Saans Trial (body)
css/style.css       all styles — colours from the Figma file
js/main.js          intro video, Hello → Namaskar → নমস্কার, clock, reveals
assets/video/       subro-intro.mp4 (intro) + project videos
assets/img/         Subro dog, posters, favicon
assets/fonts/       put your licensed font files here (see README.txt)
```

## Things to fill in
- **Fonts** — add your PP Editorial New / Saans Trial `.woff2` files to `assets/fonts/`.
- **Resume** — add `assets/Subrata-Naskar-Resume.pdf`.
- **Projects** — titles, text and "View project" links live in `index.html` under *SELECTED WORKS*.
- **Social links** — Behance / LinkedIn / Instagram in the footer.
- **Email** — the Contact button's `mailto:` link.

## Publish
Push to a repo named `<username>.github.io`, then Settings → Pages → Deploy from branch `main` / root.
The intro plays once per browser session (Skip button or Esc to jump past it).

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

## Password protection
The live `index.html` is an encrypted password screen. The real page lives in `_source/index.html`,
which is **not committed** (it's in `.gitignore`), so the text can't be read on GitHub.
To change the page or the password:
```
python3 tools/protect.py "new-password"   # rebuilds index.html from _source/index.html
```
(needs `pip install cryptography`). Then commit and push `index.html`.

## Publish
Served by GitHub Pages from `main`, on the custom domain in `CNAME` (subro.me).
The intro plays once per browser session (Skip button or Esc to jump past it).

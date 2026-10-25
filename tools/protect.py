#!/usr/bin/env python3
"""
Build the password-protected index.html.

  python3 tools/protect.py "your-password"

Reads the real page from _source/index.html (kept out of git), encrypts it with
AES-256-GCM using a key derived from the password (PBKDF2-SHA256, 600k rounds),
and writes index.html: a branded password screen that decrypts the page in the
browser. Without the password, the page text cannot be read from the source.

Changing the password = run this again with a new one and push. Visitors who
ticked "Remember me" will be asked for the new password.
"""
import base64, hashlib, json, os, sys
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = Path(__file__).resolve().parent.parent
ITER = 600_000

def main():
    if len(sys.argv) != 2 or len(sys.argv[1]) < 8:
        sys.exit('usage: python3 tools/protect.py "password (8+ chars)"')
    pw = sys.argv[1].encode()
    html = (ROOT / "_source" / "index.html").read_bytes()
    salt, iv = os.urandom(16), os.urandom(12)
    key = hashlib.pbkdf2_hmac("sha256", pw, salt, ITER, 32)
    ct = AESGCM(key).encrypt(iv, html, None)
    b = lambda x: base64.b64encode(x).decode()
    payload = json.dumps({"salt": b(salt), "iv": b(iv), "ct": b(ct), "iter": ITER})
    out = TEMPLATE.replace("/*PAYLOAD*/null", payload)
    (ROOT / "index.html").write_text(out, encoding="utf-8")
    print(f"wrote index.html ({len(out)//1024} KB)")

TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Subrata Naskar — Portfolio</title>
<meta name="theme-color" content="#0f2457" />
<link rel="icon" type="image/png" href="assets/img/favicon.png" />
<link rel="stylesheet" href="css/fonts.css" />
<style>
  :root { --navy:#0f2457; --yellow:#e4d76c; --cream:#fdfadc; --pink:#e2366c; --sky:#3cc4ef; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    background-color: var(--navy);
    background-image: linear-gradient(to right, rgba(253,250,220,.07) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(253,250,220,.07) 1px, transparent 1px);
    background-size: 120px 120px; background-position: calc(50% - 60px) 0;
    color: var(--cream);
    font-family: "Saans Trial", system-ui, -apple-system, sans-serif;
    display: grid; place-items: center; padding: 24px 16px;
    -webkit-font-smoothing: antialiased;
  }
  .gate { width: min(100%, 460px); text-align: center; }
  .dog { width: 132px; height: 132px; margin: 0 auto 8px; display: block; }
  h1 {
    font-family: "PP Editorial New", Georgia, serif; font-weight: 400;
    font-size: clamp(56px, 14vw, 96px); line-height: .9; letter-spacing: -0.04em;
    color: var(--yellow); margin: 0 0 18px;
  }
  p { margin: 0 0 28px; font-weight: 300; font-size: 17px; line-height: 1.45; opacity: .85; }
  form { display: flex; gap: 8px; }
  input {
    flex: 1; min-width: 0; font: 400 16px/1 inherit; font-family: inherit;
    padding: 14px 14px; border: 2px solid rgba(253,250,220,.35); background: rgba(253,250,220,.06);
    color: var(--cream); border-radius: 0; outline: none; transition: border-color .2s;
  }
  input::placeholder { color: rgba(253,250,220,.45); }
  input:focus { border-color: var(--yellow); }
  button {
    font: 700 15px/1 inherit; font-family: inherit; letter-spacing: -0.01em;
    padding: 0 16px; border: 0; background: var(--pink); color: var(--cream); cursor: pointer;
    display: inline-flex; align-items: center; gap: 10px; transition: transform .2s;
  }
  button:hover { transform: translateY(-2px); }
  button:disabled { opacity: .6; cursor: wait; transform: none; }
  button span { width: 22px; height: 22px; background: var(--cream); color: var(--pink); display: grid; place-items: center; font-size: 14px; }
  .row { margin-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; opacity: .8; gap: 12px; flex-wrap: wrap; }
  label { display: inline-flex; gap: 8px; align-items: center; cursor: pointer; }
  input[type=checkbox] { flex: none; width: 16px; height: 16px; padding: 0; accent-color: var(--yellow); }
  .err { color: #ff8fb1; min-height: 1.2em; }
  a { color: var(--yellow); }
  .shake { animation: shake .4s; }
  @keyframes shake { 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }
  @media (prefers-reduced-motion: reduce) { .shake { animation: none; } }
</style>
</head>
<body>
<main class="gate" id="gate">
  <img class="dog" src="assets/img/subro-dog.gif" alt="Subro, a line-drawn dog" width="132" height="132" />
  <h1>Subrata<br/>Naskar</h1>
  <p>Namaskar! This portfolio is private.<br/>Enter the password to come in.</p>
  <form id="f" autocomplete="off">
    <input id="pw" type="password" placeholder="Password" aria-label="Password" required autofocus />
    <button id="go" type="submit">Enter <span aria-hidden="true">→</span></button>
  </form>
  <div class="row">
    <label><input id="remember" type="checkbox" checked /> Remember me on this device</label>
    <span class="err" id="err" role="alert"></span>
  </div>
  <p style="margin-top:28px;font-size:13px">No password? Write to <a href="mailto:sn9830654503@gmail.com">sn9830654503@gmail.com</a></p>
</main>
<script>
(() => {
  const P = /*PAYLOAD*/null;
  const KEY = "subro-pass-" + P.salt.slice(0, 12);
  const $ = (id) => document.getElementById(id);
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const toB64 = (u) => btoa(String.fromCharCode(...u));
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };

  if (!window.crypto || !crypto.subtle) {
    $("err").textContent = "Please open this page over https://";
    $("go").disabled = true;
    return;
  }

  async function derive(pw) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64(P.salt), iterations: P.iter, hash: "SHA-256" }, base, 256);
    return new Uint8Array(bits);
  }
  async function unlock(raw) {
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(P.iv) }, key, b64(P.ct));
    const html = new TextDecoder().decode(pt);
    document.open(); document.write(html); document.close();
  }

  const saved = store.get();
  if (saved) unlock(b64(saved)).catch(() => store.clear());

  $("f").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("go"); btn.disabled = true; $("err").textContent = "";
    try {
      const remember = $("remember").checked;
      const raw = await derive($("pw").value);
      const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(P.iv) }, key, b64(P.ct)); // throws if wrong
      if (remember) store.set(toB64(raw));
      await unlock(raw);
    } catch (err) {
      btn.disabled = false;
      $("err").textContent = "That’s not it — try again.";
      const f = $("f"); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
      $("pw").select();
    }
  });
})();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()

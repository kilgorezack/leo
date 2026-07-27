# OtterDrift — landing site

A fast, static, dependency-free marketing site for **OtterDrift Communications**.
Built around an interactive "evening quiz" that recommends a plan and a live
satellite-vs-local simulator. No framework, no build step — just HTML, CSS, and
vanilla JS, ready to deploy on Vercel.

## Project structure

```
.
├── index.html              # the landing page (SEO, Open Graph, JSON-LD in <head>)
├── 404.html                # branded not-found page
├── assets/
│   ├── styles.css          # all styling (brand tokens at the top)
│   ├── main.js             # quiz, evening simulator, nav + address-form logic
│   ├── og-image.png        # 1200×630 social share card
│   ├── apple-touch-icon.png
│   └── icon-192 / 512 / maskable-512.png   # PWA icons
├── favicon.svg             # primary icon (modern browsers)
├── favicon.ico             # legacy fallback
├── site.webmanifest        # PWA manifest
├── robots.txt
├── sitemap.xml
└── vercel.json             # security headers, caching, clean URLs
```

## Deploy to Vercel

This is a plain static site, so there's nothing to build.

**Option A — Git (recommended):**
1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo.
3. Framework preset: **Other**. Build command: *(none)*. Output directory: `./`.
4. Deploy.

**Option B — CLI:**
```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

## Before you go live — set your domain

The absolute URLs used for canonical links, Open Graph, the sitemap, and
structured data currently point at the placeholder
`https://otterdrift.vercel.app`. Replace that with your real domain in:

- `index.html`  (canonical, `og:*`, `twitter:*`, and the JSON-LD block)
- `sitemap.xml`
- `robots.txt`

A quick find-and-replace across those three files is all it takes.

## Wire up the address check

The footer "Check your address" form confirms on the client and marks the
integration point in `assets/main.js` (search for **`Integration point`**).
Drop in a `fetch()` to your availability API, CRM, or a form service
(Formspree, Vercel Serverless Function, etc.) and you're collecting leads.

## Rebranding

Open `assets/styles.css` — the first block is a set of brand tokens
(`--dusk`, `--lamp`, `--go`, fonts, spacing). Swap those six colors and the
whole page re-themes. Quiz questions, plans, and simulator copy live as data
arrays at the top of `assets/main.js`.

## Notes

- **Accessibility:** skip link, semantic landmarks, keyboard number shortcuts
  on the quiz, visible focus rings, and `prefers-reduced-motion` support.
- **Performance:** no JS framework, fonts preconnected, assets cached
  immutably for a year via `vercel.json` (HTML stays revalidated).
- **Privacy:** `Permissions-Policy` disables `interest-cohort` (FLoC) and
  camera/mic/geolocation by default.

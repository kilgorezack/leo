# OtterDrift — competitive landing pages vs. satellite and fixed wireless

A fast, static, dependency-free marketing site built to argue one thing: for a
home that a local provider already reaches, **experience beats a headline speed
number**. It makes that case with five interactive tools rather than a wall of
copy.

Built as a reference implementation for service providers competing against
Starlink, Amazon Leo, and 5G home internet from the mobile carriers. **OtterDrift is a
fictional brand** — the whole thing is designed to be re-skinned and reused.

No framework, no build step, no dependencies. Just HTML, CSS, and vanilla JS.

**Three pages, three arguments — pick the one that matches who you're up against:**

| Page | Competitor | The angle it takes |
|---|---|---|
| `/` | Satellite / LEO | *"Bring on the full house."* One evening, compared two ways. |
| `/v2` | Satellite / LEO | *"365 nights. Let's count them."* A whole year, counted. |
| `/v3` | Fixed wireless / 5G home | *"The router lives in the window now."* One box, and a puzzle you can't win. |
| `/v4` | Fixed wireless / 5G home | *"Every neighbor is a roommate."* One tower, divided by everyone who buys it. |

---

## The interactive pieces

These are the reusable part. Each one is self-contained, works with keyboard and
screen readers, and honours `prefers-reduced-motion`.

### 1. The Evening Quiz — `/`

Seven questions about a normal weeknight (how many people, does work follow you
home, where does the signal give up) that end in a recommended plan, with the
reasoning shown back to the customer in their own terms — *"you're on camera, and
being seen clearly is half of being in the meeting"* — plus where satellite
would specifically let *that* household down.

As you answer, windows light up in an SVG house. Not decoration: it's a running
visual of coverage the customer just told you they need.

**Good for:** save calls, on-site visits, tablet in a retail lane, or a lead-gen
page. It captures household needs without asking for an email first.

### 2. The Evening Simulator — `/#compare`

Scrub the hour from 5pm to 11pm, switch the weather between clear/storm/snow,
and toggle what's happening in the house (work call, gaming, movie, homework,
cameras). Two panes react live: a dish on the roof degrades with congestion,
weather, and load, while the local line stays flat. A rolling "why" note explains
the mechanism — shared overhead capacity, rain fade, the round trip to orbit.

**Good for:** the objection-handling moment. It shows *why* rather than asserting.

### 3. The Year Grid — `/v2`

365 squares, one per evening. Pick a climate and what your nights involve, press
play, and the year time-lapses square by square — green fine, amber rough, red
lost — with running tallies and a dated incident log (*"Nov 21 — snow on the
dish. Movie night became a conversation about the dish."*). Then flip the toggle
and the identical year re-runs on a local line: the grid heals, the tallies go
to zero, the log empties.

Snow country lands around 40+ lost evenings; high desert around 20. The model is
seeded, so the same setup always replays the same year.

**Good for:** the zoom-out argument. One bad night is anecdote; 43 is a pattern.

> **On the model:** the year grid is an *illustration*, not a measurement — it
> combines monthly weather likelihood, night-of-week congestion, and random
> obstruction events. It's commented as such in `assets/v2.js`. If you have real
> outage or weather data for your footprint, feed it in and the claim becomes
> defensible rather than merely plausible.

### 4. Find the Spot — `/v3`

The fixed-wireless argument, which is a different argument from satellite. Drag
the gateway around a top-down floor plan hunting for signal. Rooms turn green,
amber, or red as you move it, a meter shows the link back to the tower, and a
counter keeps score: *"3 of 7 rooms working."*

The point is that **it's a puzzle you can't win**. The two things you want pull
against each other — the link to the tower wants a window on the tower side,
whole-home coverage wants the middle of the house. The best position on a quiet
afternoon reaches 5 of 7 rooms; in the evening 4; when the tower is busy 3. The
tool tracks the best score you managed and throws it back at you when you flip
to the local view and the whole house goes green.

A separate control sets how busy the tower is, which is the other fixed-wireless
truth: home traffic yields to phone traffic on the same tower, so the product
gets worse at exactly the hour you want it.

**Good for:** the "but I already get 300 Mbps from my phone company" conversation.
It moves the argument off the speed test and onto the floor plan.

> **On this model too:** signal falls off with distance and loses more crossing
> each wall, with tower load subtracted from the link. It's a physical intuition
> made interactive, not a propagation study — commented as such in `assets/v3.js`.

### 5. Sign Up the Street — `/v4`

The simplest tool on the site, and the one that lands hardest. A row of houses.
Click any of them and that neighbor buys the same fixed wireless you have. The
tower bar splits one more way, your share drops from *the whole tower* toward
*1/16 of the tower*, and items switch off a list of what still works at 8pm —
4K first, then the work call, until you're down to email and a radio.

The visitor causes the damage themselves, one click at a time, without ever
touching their own house. That's the argument: **the better it sells on your
street, the worse it works in your home.** No other product behaves that way,
and nothing on the bill will ever tell you it happened.

Underneath, a second bar never moves — a line to one house isn't divided when
somebody else signs up.

One control, no modes, no play button. It reads in about four seconds.

**Good for:** the top of a save call, a lobby screen, or anywhere you have a few
seconds and no attention. Also the easiest of the five to hand to a
non-technical seller.

> **On this model:** it's peak-hour contention, drawn simply. Real networks lean
> on people not all transmitting at once — true at 3pm, much less true at 8pm,
> which is the hour the tool is about. Commented as such in `assets/v4.js`.

---

## Taking a tool for your own site

Everything is plain HTML/CSS/JS, so there's no framework to adopt and nothing to
compile. Two ways in.

### Option A — iframe it (fastest)

Host this repo anywhere (Vercel, Netlify, S3, your own web server) and embed a
page in your existing site:

```html
<iframe src="https://your-deploy.example.com/v2"
        title="A year of evenings"
        style="width:100%;height:1400px;border:0" loading="lazy"></iframe>
```

No code to merge, and updates land wherever it's embedded. The trade-off is that
you inherit the whole page, styling included.

### Option B — lift the component (proper integration)

Each widget mounts only if its markup is on the page, so you can copy one and
leave the rest behind. Take three things: **the markup block**, **the CSS**, and
**the JS file**.

| Tool | Copy this markup | CSS | JS |
|---|---|---|---|
| Evening Quiz | `<div class="quiz-grid">…</div>` in `index.html` | `styles.css` | `main.js` |
| Evening Simulator | `<div class="sim">…</div>` in `index.html` | `styles.css` | `main.js` |
| Year Grid | `<div class="year">…</div>` in `v2.html` | `styles.css` + `v2.css` | `v2.js` |
| Find the Spot | `<div class="spot">…</div>` in `v3.html` | `styles.css` + `v3.css` | `v3.js` |
| Sign Up the Street | `<div class="street">…</div>` in `v4.html` | `styles.css` + `v4.css` | `v4.js` |

The scripts find their own elements by ID and no-op when those IDs are absent —
dropping `main.js` on a page holding only the simulator works fine, and the quiz
runs with no house illustration at all. Keep the `id` and `data-` attributes
intact; they're the wiring. Class names are yours to rename if you also rename
them in the CSS.

`styles.css` carries the shared foundation (brand tokens, buttons, chips,
segmented controls, type scale) that all three build on, so copy it first even if
you only want one widget.

### Change the content without touching the logic

All the copy and behaviour lives in data structures at the top of each file:

**`assets/main.js`**
- `QUESTIONS` — the seven questions, their options, the score each contributes,
  which rooms light up, and which flags it sets
- `PLANS` — plan names and prices
- `WHY` / `GAPS` — the flag → sentence maps behind the personalised result
- `ACTS`, `HOURS`, `WX` — simulator activities, hour-by-hour load, weather effects

**`assets/v2.js`**
- `REGIONS` — climates and their monthly severe-weather likelihood
- `ACTS` — the activity chips
- `LINES` — what a lost evening sounded like, by cause
- `pickPlan()` thresholds decide which plan each score lands on

**`assets/v3.js`**
- `ROOMS` — the floor plan itself: rename, resize, or add rooms
- `WALLS` — wall segments the signal has to cross
- `LOADS` — the tower-load settings and what each one costs
- `TOWER` — where the tower sits relative to the house

**`assets/v4.js`**
- `NEEDS` — what an evening asks for, and the share of a tower each thing takes
- `TOTAL` / `YOU` — how many houses on the street, and which one is the visitor's

Rewriting the strings is enough to re-point the whole thing at your market. You
can add or remove questions and options freely — nothing is hard-coded to seven.

### Re-skin it

The first block of `assets/styles.css` is the brand token set:

```css
--dusk / --night / --haze / --paper   /* surfaces */
--lamp / --ember                      /* accent + hover */
--go                                  /* "this is working" green */
--display / --body                    /* typefaces */
```

Swap those and the entire site re-themes, both pages and all three widgets.
Replace the logo mark (an otter) in the nav of `index.html` and `v2.html`, the
`favicon.*` files, and `assets/og-image.png`.

### Fair warning before you ship it

- The **pricing, plan features, and stats** (12-minute drive, since 1954) are
  invented. Replace them with yours.
- **Competitor claims** — anything the page says about satellite — should go past
  whoever signs off on your comparative advertising. The original page carried a
  disclaimer; it has since been removed at the owner's request.
- The address form is **client-side only** (see below).

---

## Deploy

Static site, nothing to build.

**Vercel (recommended):** import the repo, framework preset **Other**, no build
command, output directory `./`.

**Anywhere else:** upload the files. Only `vercel.json` is Vercel-specific — it
sets security headers, caching, and clean URLs. On another host, reproduce the
clean-URL rule (`/v2` → `v2.html`) or change the links to `/v2.html`.

```bash
npm i -g vercel && vercel --prod    # CLI alternative
```

### Before you go live

1. **Set your domain.** Replace `https://otterdrift.vercel.app` in `index.html`
   (canonical, `og:*`, `twitter:*`, JSON-LD), `v2.html`, `v3.html`, `v4.html`, `sitemap.xml`, and
   `robots.txt`.
2. **Wire up the address check.** The footer form confirms on the client only.
   Search `assets/main.js` for **`Integration point`** and drop in a `fetch()` to
   your availability API, CRM, or a form service.
3. **Bump the asset version** when you edit CSS or JS. Links carry `?v=2`;
   files under `/assets/` cache for ten minutes and then revalidate, so edits
   normally propagate on their own — bumping the number forces it immediately,
   even for a browser holding an older copy.

---

## Project structure

```
.
├── index.html          # main page: quiz + evening simulator
├── v2.html             # second page: the year grid
├── v3.html             # third page: find the spot (fixed wireless)
├── v4.html             # fourth page: sign up the street (fixed wireless)
├── 404.html
├── assets/
│   ├── styles.css      # brand tokens + shared foundation + main-page styles
│   ├── main.js         # quiz, simulator, nav, address form
│   ├── v2.css          # year-grid styles
│   ├── v2.js           # year-grid model + animation
│   ├── v3.css          # floor-plan styles
│   ├── v3.js           # signal model + drag interaction
│   ├── v4.css          # street styles
│   ├── v4.js           # contention model + click interaction
│   ├── og-image.png    # 1200×630 share card
│   └── icon-*.png      # PWA + apple-touch icons
├── favicon.svg / .ico
├── site.webmanifest
├── robots.txt / sitemap.xml
└── vercel.json         # headers, caching, clean URLs
```

## Notes

- **Accessibility:** skip link, semantic landmarks, ARIA live regions on results,
  number-key shortcuts on the quiz, visible focus rings, and reduced-motion
  fallbacks for every animation.
- **Performance:** no framework, no dependencies, no build. Fonts preconnected;
  assets cached with revalidation.
- **Privacy:** no analytics, no cookies, no third-party scripts. The only
  external request is Google Fonts — self-host those two families if you'd
  rather have none.

## Credits

Created by **Zack Kilgore** ([@kilgorezack](https://github.com/kilgorezack)) —
concept, positioning, copy, and build.

Take it, brand it, ship it.

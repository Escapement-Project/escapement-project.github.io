# Design tokens

The colours, line patterns and type that the Escapement Project's pages and verge-gui share. One
source, `tokens.toml`, generates everything else:

| Output | For |
|---|---|
| `static/tokens.css` | the site, and any page that keeps a copy |
| `static/fonts/` | the web fonts `tokens.css` loads, subset to Latin |
| `design/out/tokens.rs` | verge-gui's colours, patterns, font list and Verge's mark in motion |
| `design/out/mark.json`, `design/out/tickwave-mark.json` | Verge's and tickwave's marks in motion, which the landing page embeds |
| `design/out/fonts/` | the fixed font files verge-gui embeds |
| `static/favicon.ico`, `static/apple-touch-icon.png` | the sites' favicon and iOS icon |
| `static/favicon-verge.ico` | the favicon on Verge's page and docs |
| `design/out/icons/` | Verge's app icon for Linux (SVG and PNGs), Windows (ICO) and macOS (ICNS); tickwave's icon (SVG and PNGs) and its pages' favicon; and the org's avatar |
| `static/preview.png` | the site's link preview |
| `design/out/previews/` | each published repository's social preview, to upload on GitHub |

Edit `tokens.toml`, then rebuild:

```sh
uv run design/build.py
```

The source fonts download once, from google/fonts at the commit `tokens.toml` pins. The icons
come from the marks in `marks/`. The link previews also read the headline from `data/landing.json`
and the repositories from `content/_index.md`.

## Shared files

Besides what the build generates, these hand-written files are shared by the project's pages:

| File | What |
|---|---|
| `static/base.css` | the shared base sheet: the header, sections, type, figures, tables, references, the Copy buttons and the footer. A page adds a sheet of its own after it (the site's is `static/site.css`) |
| `design/header.html` | the header every page shows: the mark, the places and the day and night switch. `{{mark}}` stands for the dial and `{{base}}` for the address the links start with. On a product's pages the product's link gives way to its group, below (the site's `templates/partials/header.html` fills the header in for Zola) |
| `design/header-verge.html` | Verge's group, for the header on Verge's pages: the site's and the measurements page's |
| `design/footer.html` | the footer every page shows |
| `static/js/face.js` | the day and night switch |
| `static/js/header.js` | the header's hairline once the page has scrolled, the mark on the section of the page the reader is in, the header brought back on the way up where it scrolls away, and the published address for a page opened from disk |
| `static/js/copy.js` | a Copy button on each command (`.console`) and on each code block in a doc (`article.doc pre`), except a block marked as text, which is output |
| `static/doc.css`, `static/js/doc.js` | a product's docs: the docs index, a doc's text, and its frame (the contents in a rail beside the text, where the reader is marked on it, and narrow, a bar naming the section that opens the contents as a sheet). The markup is below |
| `static/js/search.js` | a product's docs search: a field on the docs index and at the top of the rail, the sections found in the contents' place, the words marked in the page a result opens. Each product's build writes its index, below |

Edit them here; the copies follow.

### A product's group in the header

On a product's own pages the header shows the product's pages beside its name, on one rule, the
page shown on a heavier stretch of it (base.css). A page's build puts the group in place of the
product's link, which `design/header.html` has once:

```html
<span class="product"><a href="{{base}}/verge/" data-page="verge">Verge</a><a href="{{base}}/verge/docs/" data-page="verge/docs">Docs</a><a href="{{base}}/verge/measurements/" data-page="verge/measurements">Measurements</a></span>
```

The product's link comes first, then its pages. The build marks where the reader is with
`aria-current`: the page's own entry `"page"`; the entry a page sits inside, as Docs is for a doc,
`"true"`; and the product's link `"true"`, or `"page"` on the product's main page. Verge's group is
`design/header-verge.html`, which the site and the measurements page both use; tickwave's site
writes its own.

### A product's docs

Each product's docs are built by that product, into the markup below; doc.css, doc.js, search.js
and copy.js do the rest, so the docs read and work the same whoever built them. The site's are
`templates/verge-docs.html` and `templates/verge-doc.html`; tickwave's site writes its own.

The docs index:

```html
<div class="wrap docs-index">
  <div class="docs-head">
    <h1>Verge's docs</h1>
    <search class="find" data-index="search.json">…</search>
  </div>
  <p class="intro">Where the docs are written, in a line.</p>
  <div class="found" id="found" role="listbox" aria-label="Sections found" hidden></div>
  <div class="doc-groups">
    <div id="a-group">
      <h2 class="group">A group</h2>
      <ul>
        <li><a href="…">A doc</a><p>What it covers.</p></li>
      </ul>
    </div>
  </div>
</div>
```

A doc page:

```html
<div class="wrap doc-wrap">
  <button class="doc-bar" type="button" aria-expanded="false" aria-controls="doc-rail">
    <span class="label">Contents</span><span class="where">The doc's title</span></button>
  <div class="doc-rail" id="doc-rail">
    <search class="find" data-index="search.json">…</search>
    <div class="doc-list">
      <nav class="doc-nav" aria-label="…">
        <ul>
          <li><a href="…">Another doc</a></li>
          <li><a href="…" aria-current="page">This doc</a>
            <ul class="toc">
              <li><a href="#a-section">A section</a>
                <ul><li><a href="#a-subsection">A subsection</a></li></ul></li>
            </ul></li>
        </ul>
      </nav>
      <div class="found" id="found" role="listbox" aria-label="Sections found" hidden></div>
    </div>
  </div>
  <article class="doc">
    <h1>The doc's title</h1>
    <h2 id="a-section">A section<a class="anchor" href="#a-section" aria-label="Link to this section">#</a></h2>
    …
    <p class="doc-source">From <a href="…">its repository</a>, where changes to this page go.</p>
  </article>
</div>
```

- The docs sit in groups or in one list. Grouped, the index has a `.group` heading over each list
  and the rail a `<details class="group">` with a `<summary>` and its `<ul>`, the reader's group
  open; in one list, the index has one `<div>` with no heading and the rail a bare `<ul>`. A doc
  not yet written can be a `<span class="coming">` in place of its link.
- The search field is `templates/partials/find.html`'s markup with the product's index at
  `data-index` and its label naming the product's docs. Without it the page works as a plain list.
- Each `.toc` link's fragment is the `id` of its heading in the doc. A subsection's list shows
  while the reader is in its section.
- Headings h2 to h4 end with the link to themselves; the h1 has none.
- The page's title is the doc's name as the rail lists it, then the product, then the project:
  "Host interface – Verge – Escapement Project", and the index's "Docs – Verge – Escapement
  Project".
- The root needs the `js` class before the page draws, as the header needs it: without it, a narrow
  page shows the contents above the text and no bar.

### The search index

search.js reads `{"docs": [[title, address], ...], "sections": [[doc, id, heading, text], ...]}`
from the field's `data-index`: the docs in the index's order, each doc's sections in page order,
`doc` a doc's place in `docs`, every address relative to the index file. Each product's build writes
it (the site's is `.github/search-index.py`, run after `zola build`), to this definition:

- A doc's text is its `article.doc` and nothing outside it.
- A doc's title is its name as the rail lists it.
- The first section is the text after the h1 and before the first h2 or h3 with an id, headed by
  the doc's title, with id `""`, left out when it is empty.
- Then each h2 or h3 with an id starts a section, which runs to the next h2 or h3 with an id. A
  heading without an id does not start one: its text joins the section it is in. A heading's
  section is kept even with no text of its own, as when an h3 follows its h2 directly. h4 and
  deeper stay in their section.
- Text, a heading's included, is plain, its whitespace collapsed, with a space between blocks.
  Left out wherever they sit, headings included: `svg`, `script`, `style`, the heading link
  (`.anchor`) and the source line (`.doc-source`).

## Keeping copies current

A page or program outside this repository keeps its own copy of the files it uses. To check them,
run this from this repository:

```sh
uv run design/build.py --check ../mculink-bench/page/tokens.css ../mculink-bench/page/out/fonts/* \
    ../mculink-bench/page/dial.svg ../mculink-bench/page/favicon-verge.ico \
    ../mculink-bench/page/base.css ../mculink-bench/page/header.html ../mculink-bench/page/header-verge.html \
    ../mculink-bench/page/footer.html ../mculink-bench/page/face.js ../mculink-bench/page/header.js \
    ../verge/gui/src/tokens.rs ../verge/gui/fonts/*.ttf ../verge/gui/fonts/*-OFL.txt ../verge/gui/icons/*.png \
    ../tickwave/site/tokens.css ../tickwave/site/fonts/* ../tickwave/site/dial.svg \
    ../tickwave/site/base.css ../tickwave/site/header.html \
    ../tickwave/site/footer.html ../tickwave/site/face.js ../tickwave/site/header.js \
    ../tickwave/site/copy.js ../tickwave/site/doc.css ../tickwave/site/doc.js ../tickwave/site/search.js \
    ../tickwave/site/favicon-tickwave.ico
```

Today's copies:

- the measurements page in mculink-bench: `page/tokens.css`, `page/out/fonts/`, `page/dial.svg`,
  Verge's favicon `page/favicon-verge.ico`, and the shared files `page/base.css`,
  `page/header.html`, `page/header-verge.html`, `page/footer.html`, `page/face.js` and
  `page/header.js`. The page inlines all but the fonts, so
  after updating a copy, rebuild the page; `page/build.py --check` fails while the page still
  carries the old one.
- verge-gui in verge: `gui/src/tokens.rs`, the fixed fonts and their licences in `gui/fonts/`, and
  the app icon's PNGs in `gui/icons/`.
- tickwave's site: `site/tokens.css`, the web fonts and their licences in `site/fonts/`,
  `site/dial.svg`, its favicon `site/favicon-tickwave.ico` from `out/icons/`, and the shared files
  `site/base.css`, `site/header.html`, `site/footer.html`, `site/face.js`, `site/header.js`,
  `site/copy.js`, `site/doc.css`, `site/doc.js` and `site/search.js`.

The check rebuilds everything from `tokens.toml`, the marks and the content the previews show. It
fails if a committed output differs from that build, if the build no longer makes a file it made
before (`design/out/outputs.txt` lists what the last build wrote), or if a copy differs from the
output, mark or shared file of the same name. Copies are matched by name, so the build refuses two
outputs, marks or shared files that share a name and differ. It always writes the same bytes for
the same source, on any system, which is why it pins fontTools, Brotli, resvg and Pillow exactly.
The publish workflow runs the check, and the measurements page's, before it builds the site.

## Colours

Every colour has a role, and a role keeps its meaning wherever it appears. Each has a day and a
night value. `tokens.css` sets the day values on `:root`. It sets the night values when the page
sets `data-face="night"` on `<html>`, or when the system prefers dark and the page has not set
`data-face="day"`.

| Role | Day | Night | For |
|---|---|---|---|
| `page` | `#dce8ed` | `#0e1216` | the page behind everything |
| `surface` | `#eef4f6` | `#151b21` | panels and figures |
| `raised` | `#ffffff` | `#1b232b` | what sits above a surface |
| `sunken` | `#cbd9e0` | `#0a0d10` | wells and inputs |
| `hair` | `#bccbd3` | `#29333c` | dividers |
| `rule` | `#738691` | `#636e79` | stronger lines and control outlines, at least 3:1 against page, surface and raised |
| `ink` | `#11171d` | `#e6ebee` | text, and the interaction layer |
| `ink-2` | `#525f6a` | `#aab5be` | secondary text |
| `lume` | `#c4f03c` | `#c4f03c` | the identity: a fill only, never a line or text |
| `on-lume` | `#11171d` | `#11171d` | text and marks on lume |
| `plate` | `#11171d` | `#11171d` | the plate under the marks and app icons |
| `plate-line` | `#aab5be` | `#aab5be` | lines drawn on the plate, such as the mark's stems, trace and beam, at partial opacity |
| `hand`, `ring`, `face` | | | the landing page's dial only |
| `window-edge` | `#11171d` | transparent | the edge of a window of lume: the dial's, the measurements headline's |
| `fault-ink`, `fault-fill` | `#b81c20`, `#ef4b4b` | `#f24e4d`, `#ef4b4b` | something failed |
| `attention-ink`, `attention-fill` | `#924a03`, `#f1710d` | `#f1710d` | something needs a look |
| `on-status` | `#11171d` | `#11171d` | text on a status fill |
| `series-verge` | `#0f8a6c` | `#1aa384` | Verge in data |
| `series-nxp` | `#2a78d6` | `#3987e5` | NXP's firmware in data |
| `series-context` | `#47525c` | `#aab5be` | reference probes in data |

Every text role (`ink`, `ink-2` and both status inks) keeps at least 4.5:1 on page, surface, raised
and sunken, in both faces. Ink is for text and lines and fill is for areas, in each status pair. A
status colour always comes with an icon or words: fault and attention sit close, 10.3 apart in
normal vision and 2.1 under deuteranopia by day (OKLab ΔE ×100).

Interaction has no hue. Focus is a 2 px ink ring. What the pointer is on gets a wash of ink at
12 % (`--wash`), and what is selected an ink fill with page text.

## Data

A colour follows the probe it measures, never its rank, so a filter never repaints what remains.
Verge and NXP's firmware are 18.0 apart under colour-vision deficiency and 18.9 in normal vision
(OKLab ΔE ×100) on both faces' surfaces. Both status inks are at least 9.7 from both. The status
fills come closer: by day the fault fill is 6.1 from Verge's teal under protanopia, which their icon
or words make up for. Data sits on page, surface or raised, never in a sunken well: by day Verge's
teal is 2.98:1 on sunken, under the 3:1 a line needs. No third hue
passed against all of these, so reference probes share the context colour and are told apart by
pattern and name. The day context is a step darker than `ink-2`: at `ink-2` it sat 12.7 from
Verge's teal, under the floor of 15.

Patterns, as stroke dash arrays at a 2 px line:

| Pattern | Dashes | For |
|---|---|---|
| solid | | a probe's headline build (Clang) |
| `--dash-second-build` | `6 3` | its other build (GCC) |
| `--dash-misread` | `2 4` | figures from a clock where the firmware reads wrong; their points hollow |
| `--dash-reference` | `8 3 2 3` | a reference probe |
| `--capture-opacity`, `--capture-width` | 60 %, 1.5 px | a run under energy capture |
| `--dash-capture-second` | `12 4` | a second run of one build under energy capture; the first keeps the build's pattern |

## Type

| Role | Face | CSS |
|---|---|---|
| display | Saira, expanded (`wdth` 125), 500 | `--font-display`, `--display-stretch`, `--display-weight` |
| text | Hanken Grotesk, 400 to 600 | `--font-text` |
| figures that change in place | Martian Mono, semi-expanded (`wdth` 112.5), 500 | `--font-figures`, `--figures-stretch`, `--figures-weight` |
| code | Martian Mono, normal width, 500 | `--font-code`, `--code-stretch`, `--code-weight` |

All three have tabular figures. The web fonts set text within 0.05 px of Google Fonts' own cuts.
egui has no variable axes, so verge-gui gets fixed instances, named as the fonts' own style tables
name them: Saira Expanded Medium and SemiBold, Hanken Grotesk Regular, Medium and SemiBold, and
Martian Mono Medium and SemiExpanded Medium.

The fonts are under the SIL Open Font License 1.1, with no Reserved Font Name. Each family's
licence sits beside its files.

## Icons

There are three marks in `marks/`: the project's dial with one rising edge, Verge's V of samples,
and tickwave's wave on its ticks.
Each has a master on a 64-unit grid. At 16, 24 and 32 px, a master fitted to the pixel grid takes
over (`dial-16.svg`, `verge-24.svg` and so on). Its straight edges sit on whole pixels, so the mark
stays sharp where the scaled master would blur. A fitted master fills its plate at the size it
names.

An icon is a mark on a plate, both set in `tokens.toml` by colour role:

| Icon | Mark | Plate | For |
|---|---|---|---|
| `project` | the dial in `on-lume` | `lume` | the sites' favicon, the iOS icon, the org's avatar |
| `verge` | the V in `lume` | `plate` | verge-gui's app icon, the favicon on Verge's page and docs |
| `tickwave` | the wave in `lume`, its other ticks in `plate-line` | `plate` | tickwave's icon and its pages' favicon, its repository's preview |

A mark's parts with `class="line"` take the icon's `line` colour at its `line-opacity`; the rest take
its `ink`. tickwave's mark is the one that has them: the ticks under the wave's edges are lume, the
ticks between them grey. Its fitted masters keep two pulses at every size, with fewer, thinner
ticks than the scaled master would draw.

The plate's corners round by 14/64 of its side, and a 64-unit master sits an eighth of the side in
from each edge. iOS and GitHub round an icon's corners themselves, so the iOS icon and the avatar
are square. The macOS icon follows Apple's grid: an 824 plate on a 1024 canvas.

The shared header (`design/header.html`, through `{{mark}}`) and the landing page's Verge plate
inline the 64-unit masters. Those two masters must not refer to anything by `url(#id)`: a page that
sets another base URL breaks the reference. The fitted masters are only ever drawn into images, so
their clips are fine. Two drawings carry their own copy of the dial's geometry, which nothing
checks: the hero's larger step in `static/js/landing.js`, and the not-found page's dial with its
edge left flat in `templates/404.html`.

Verge's app icon as SVG is `verge-icon.svg`, not `verge.svg`: that is the mark's name. tickwave's is
`tickwave-icon.svg`, for the same reason.

The org's avatar is uploaded by hand, in the org's settings on GitHub:
`design/out/icons/escapement-project-avatar.png`.

## The marks in motion

Verge's mark moves on the landing page's Verge plate and in verge-gui. A beam sweeps the plate and
each sample moves from the V to the project's step as the beam reaches it, grey stems rising from
the floor. The step has the low run, the middle sample half-way up the riser, then the high run.
The mark holds on the step, then the next sweep wipes it back to the V.

Both draw it from one source, so they cannot drift apart. The samples' places come from the marks:
`marks/verge.svg`, and `marks/verge-24.svg` for verge-gui's 24 px strip. Everything else is in
`tokens.toml`'s `[motion.mark]`:

- **Times:** the sweep, a sample's move, the hold on the step, the stems growing and retracting,
  and the rest between plays where it loops.
- **The move's easing:** the power of an ease-out; 3 is out-cubic, which never overshoots.
- **The step:** each sample's level, from the floor (0) to the top (1).
- **Lines:** the riser's place and the floor's, the beam's run, the line widths and opacities, in
  `plate-line`. The trace, floor and stems draw under the samples and the beam over them.

The build writes the result twice: as `tokens.rs`'s `mark` module for verge-gui, and as
`out/mark.json`, which `templates/index.html` embeds for `static/js/mark.js`. Each drawing comes
with its places and widths in its own units: the 64-unit master on its plate, the fitted 24 px
master, and the landing page's 64-unit box.

To change the timing, edit `tokens.toml` and rebuild, then copy `tokens.rs` into verge
(`--check` reports the copy until then).

tickwave's mark moves on the landing page's tickwave plate. The time axis zooms in on one rising
edge, which glides to the middle, until it is the only edge in view: the project's step. It holds
there and zooms back out. Its times are Verge's, so both marks reach the step, hold and return
together. The zoom's own tokens are in `[motion.tickwave-mark]`:

- **The edge:** the rising edge it zooms to.
- **The scale:** how far it zooms. The build fails unless every other edge leaves the wave's run.
- **The thirds:** the zoom over which a tick at each third fades in, so the ruler stays as dense
  as at rest.

The wave and ruler come from `marks/tickwave.svg`. The build writes them with the times to
`out/tickwave-mark.json`, which the landing page embeds for `static/js/mark.js`. A plate names its
mark with `data-mark="verge"` or `data-mark="tickwave"`.

## Link previews

A link to the site shows `static/preview.png`: the project's mark, the page's headline, and the
measured ratio in its lume window with the clocks the claim depends on. Each published repository
gets a social preview with its name, the `summary` from `content/_index.md`, its language and
licence (the content's default, or its own `licence`). Verge's three repositories also carry
Verge's icon (`icon = "verge"`). A repository without a language is not published yet and gets no
preview.

The previews are drawn on the night face, with the plate as ground. They use the fixed fonts the
build makes and never the system's, so any machine draws the same bytes. The build fails when a
character has no glyph in its font, or when text would run past its room: a name into the icon, a
summary into the rule below it. Change the headline or a summary and `--check` reports the preview
as stale.

GitHub takes a repository's preview by hand, in the repository's settings:
`design/out/previews/<repository>.png`.

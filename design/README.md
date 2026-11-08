# Design tokens

The colours, line patterns and type that the Escapement Project's pages and verge-gui share. One
source, `tokens.toml`, generates everything else:

| Output | For |
|---|---|
| `static/tokens.css` | the site, and any page that keeps a copy |
| `static/fonts/` | the web fonts `tokens.css` loads, subset to Latin |
| `design/out/tokens.rs` | verge-gui's colours, patterns and font list |
| `design/out/fonts/` | the fixed font files verge-gui embeds |
| `static/favicon.ico`, `static/apple-touch-icon.png` | the sites' favicon and iOS icon |
| `design/out/icons/` | Verge's app icon for Linux (SVG and PNGs), Windows (ICO) and macOS (ICNS), and the org's avatar |
| `static/preview.png` | the site's link preview |
| `design/out/previews/` | each published repository's social preview, to upload on GitHub |

Edit `tokens.toml`, then rebuild:

```sh
uv run design/build.py
```

The source fonts download once, from google/fonts at the commit `tokens.toml` pins. The icons
come from the marks in `marks/`. The link previews also read the headline from `data/landing.json`
and the repositories from `content/_index.md`.

## Keeping copies current

A page or program outside this repository keeps its own copy of the files it uses. To check them,
run this from this repository:

```sh
uv run design/build.py --check ../mculink-bench/page/tokens.css ../mculink-bench/page/out/fonts/* \
    ../mculink-bench/page/dial.svg ../mculink-bench/page/favicon.ico \
    ../verge/gui/src/tokens.rs ../verge/gui/fonts/*.ttf ../verge/gui/fonts/*-OFL.txt ../verge/gui/icons/*.png
```

Today's copies:

- the measurements page in mculink-bench: `page/tokens.css`, `page/out/fonts/`, `page/dial.svg`
  and `page/favicon.ico`. The page inlines all but the fonts, so after updating a copy, rebuild the
  page; `page/build.py --check` fails while the page still carries the old one.
- verge-gui in verge: `gui/src/tokens.rs`, the fixed fonts and their licences in `gui/fonts/`, and
  the app icon's PNGs in `gui/icons/`.

The check rebuilds everything from `tokens.toml`, the marks and the content the previews show. It
fails if a committed output differs from that build, if the build no longer makes a file it made
before (`design/out/outputs.txt` lists what the last build wrote), or if a copy differs from the
output or mark of the same name. Copies are matched by name, so the build refuses two outputs or
marks that share a name and differ. It always writes the same bytes for the same source, on any
system, which is why it pins fontTools, Brotli, resvg and Pillow exactly. The publish workflow runs
the check, and the measurements page's, before it builds the site.

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

There are two marks in `marks/`: the project's dial with one rising edge, and Verge's V of samples.
Each has a master on a 64-unit grid. At 16, 24 and 32 px, a master fitted to the pixel grid takes
over (`dial-16.svg`, `verge-24.svg` and so on). Its straight edges sit on whole pixels, so the mark
stays sharp where the scaled master would blur. A fitted master fills its plate at the size it
names.

An icon is a mark on a plate, both set in `tokens.toml` by colour role:

| Icon | Mark | Plate | For |
|---|---|---|---|
| `project` | the dial in `on-lume` | `lume` | the sites' favicon, the iOS icon, the org's avatar |
| `verge` | the V in `lume` | `plate` | verge-gui's app icon |

The plate's corners round by 14/64 of its side, and a 64-unit master sits an eighth of the side in
from each edge. iOS and GitHub round an icon's corners themselves, so the iOS icon and the avatar
are square. The macOS icon follows Apple's grid: an 824 plate on a 1024 canvas.

The site's header and the landing page's Verge plate inline the 64-unit masters. Those two masters
must not refer to anything by `url(#id)`: a page that sets another base URL breaks the reference.
The fitted masters are only ever drawn into images, so their clips are fine. Two drawings carry
their own copy of the dial's geometry, which nothing checks: the hero's larger step in
`static/js/landing.js`, and the not-found page's dial with its edge left flat in
`templates/404.html`.

Verge's app icon as SVG is `verge-icon.svg`, not `verge.svg`: that is the mark's name.

The org's avatar is uploaded by hand, in the org's settings on GitHub:
`design/out/icons/escapement-project-avatar.png`.

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

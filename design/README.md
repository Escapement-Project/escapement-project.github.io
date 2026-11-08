# Design tokens

The colours, line patterns and type that the Escapement Project's pages and verge-gui share. One
source, `tokens.toml`, generates everything else:

| Output | For |
|---|---|
| `static/tokens.css` | the site, and any page that keeps a copy |
| `static/fonts/` | the web fonts `tokens.css` loads, subset to Latin |
| `design/out/tokens.rs` | verge-gui's colours, patterns and font list |
| `design/out/fonts/` | the fixed font files verge-gui embeds |

Edit `tokens.toml`, then rebuild:

```sh
uv run design/build.py
```

The source fonts download once, from google/fonts at the commit `tokens.toml` pins.

## Keeping copies current

A page or program outside this repository keeps its own copy of the files it uses. To check them,
run this from this repository:

```sh
uv run design/build.py --check ../mculink-bench/page/tokens.css ../mculink-bench/page/fonts/*.woff2
```

Today's copies: the measurements page in mculink-bench (`page/tokens.css` and `page/fonts/`).
verge-gui takes `tokens.rs` and the fixed fonts when it moves onto the tokens.

It rebuilds everything from `tokens.toml`. It fails if the committed outputs differ from that
build, or if a copy differs from the output of the same name. The build always writes the same bytes
for the same source, which is why it pins fontTools and Brotli exactly.

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
| `rule` | `#7b8e99` | `#636e79` | stronger lines and control outlines, at least 3:1 against page, surface and raised |
| `ink` | `#11171d` | `#e6ebee` | text, and the interaction layer |
| `ink-2` | `#56636e` | `#aab5be` | secondary text |
| `lume` | `#c4f03c` | `#c4f03c` | the identity: a fill only, never a line or text |
| `on-lume` | `#11171d` | `#11171d` | text and marks on lume |
| `plate` | `#11171d` | `#11171d` | the plate under the marks and app icons |
| `hand`, `ring`, `face` | | | the landing page's dial only |
| `window-edge` | `#11171d` | transparent | the edge of a window of lume: the dial's, the measurements headline's |
| `fault-ink`, `fault-fill` | `#c42b2b`, `#ef4b4b` | `#ef4b4b` | something failed |
| `attention-ink`, `attention-fill` | `#b45309`, `#f1710d` | `#f1710d` | something needs a look |
| `on-status` | `#11171d` | `#11171d` | text on a status fill |
| `series-verge` | `#0f8a6c` | `#1aa384` | Verge in data |
| `series-nxp` | `#2a78d6` | `#3987e5` | NXP's firmware in data |
| `series-context` | `#47525c` | `#aab5be` | reference probes in data |

Ink is for text and lines and fill is for areas, in each status pair. A status colour always comes
with an icon or words: fault and attention sit close under deuteranopia (2.4 apart by day).

Interaction has no hue. Focus is a 2 px ink ring. What the pointer is on gets a wash of ink at
12 % (`--wash`), and what is selected an ink fill with page text.

## Data

A colour follows the probe it measures, never its rank, so a filter never repaints what remains.
Verge and NXP's firmware are 18.0 apart under colour-vision deficiency and 18.9 in normal vision
(OKLab ΔE ×100) on both faces' surfaces, and at least 8.8 from both status colours. No third hue
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

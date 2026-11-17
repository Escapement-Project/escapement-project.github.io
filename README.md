# escapement-project.github.io

The Escapement Project's site, built with [Zola](https://www.getzola.org/), and the design tokens
its pages and verge-gui share.

```sh
uv run .github/verge-docs.py .        # Verge's docs, from the checkouts beside this one
zola serve                            # a local copy that rebuilds on every change
zola build                            # the site, into public/
uv run .github/search-index.py public # the docs' search index, from the built site
```

`zola serve` has no search index, so its docs' search says the index didn't load. Build, write
the index, and serve `public/` to try the search.

| Path | What |
|---|---|
| `templates/` | the page templates: `base.html` for every page, `index.html` for the landing page, `verge.html` for Verge's page, `verge-docs.html` and `verge-doc.html` for its docs, `404.html` for any address without a page |
| `content/_index.md` | the landing page's description and the Source section's repositories, with each one's preview summary |
| `content/verge/_index.md` | Verge's page, and its docs: their groups, order, addresses and where each lives |
| `static/base.css` | the base every page of the project shares: header, sections, type, a product's main page, figures, tables, Copy buttons and footer, naming colour roles, never values |
| `static/site.css` | the site's own pages' parts (the landing page, Verge's page and docs, the not-found page), after `base.css` |
| `design/header.html`, `design/header-verge.html`, `design/footer.html` | the header and footer every page of the project shows, and Verge's group in the header on Verge's pages; `templates/partials/header.html` fills the header in for Zola |
| `static/js/face.js` | the day and night switch, on every page |
| `static/js/header.js` | the header's hairline, the mark on the section in view, the header brought back on the way up where it scrolls away, and the project's mark in motion (the logo on hover, the landing's hero), on every page |
| `static/doc.css`, `static/js/doc.js` | the docs, shared with tickwave's: the docs index, a doc's text, the contents in a rail, the section the reader is in, and the sheet narrow screens open from the bar |
| `static/js/search.js` | the docs' search, on the docs' index and every doc page, shared with tickwave's docs |
| `static/js/landing.js` | the landing page's hero mark, which it has `header.js` play as it arrives, and its Verge section's commands |
| `static/js/dial.js` | Verge's headline as a dial, at the head of Verge's page |
| `static/js/measured.js` | Figure 1 and Table 1 on Verge's page, and the links between them and the claim |
| `static/js/wires.js` | loads tickwave's elements for the Wires section on Verge's page as it nears the view |
| `static/js/mark.js` | the marks in motion: Verge's on the landing page and Verge's page, tickwave's on the landing page and tickwave's page, shared with tickwave's site |
| `static/js/copy.js` | click-to-copy for the commands in consoles and docs, on every page |
| `data/landing.json` | the headline the landing page and Verge's page show, and Figure 1 and Table 1 on Verge's page, written by mculink-bench's `page/extract.py --landing` |
| `design/` | the design tokens and fonts, and the script that generates them: see `design/README.md` |
| `.github/verge-docs.py` | copies Verge's docs from their repositories into `content/verge/docs/` |
| `.github/wire-refs.py` | checks every recording Verge's page's Wires section cites against the recordings' annotations, before the site publishes |
| `.github/search-index.py` | writes the docs' search index, `verge/docs/search.json`, from the built site: each doc's sections as plain text |
| `.github/workflows/publish.yml` | checks the generated files, builds the site with the measurements page and Verge's docs, writes the search index, and publishes it to GitHub Pages |

`static/tokens.css`, `static/fonts/`, `static/favicon.ico`, `static/favicon-verge.ico`,
`static/apple-touch-icon.png`, `static/preview.png` and `design/out/` are generated: edit
`design/tokens.toml`, the marks in `design/marks/` or the content the previews show, and run
`uv run design/build.py` rather than editing them.

The measurements page keeps copies of `base.css`, the header, Verge's group, the footer, `face.js`
and `header.js`, as it does of the tokens. tickwave's site keeps those and `copy.js`, `doc.css`,
`doc.js`, `search.js` and `mark.js`, its favicon from `design/out/icons/`, its mark from `design/marks/`
and the mark's motion from `design/out/`. `design/README.md` says how the
copies are checked.

The landing page and Verge's page work without scripts: their figures are in the text, and Verge's
page has Table 1, which Zola renders from `data/landing.json`. Scripts add Verge's dial, Figure 1 and
the highlights that link the claim, the figure and the table, all on Verge's page.
tickwave's `<tickwave-chart>` draws Figure 1, loaded from tickwave's own site on this origin at the
version `config.toml` pins; the pages load no fonts or scripts from anywhere else.

## The measurements page

The site serves mculink-bench's measurements page at `/verge/measurements/`. To see it locally,
link the page's folder from a mculink-bench checkout beside this one:

```sh
ln -s ../../../mculink-bench/page/out static/verge/measurements
```

Git ignores the link. `zola serve` follows it, so a rebuilt measurements page shows on the next
reload.

To publish, the workflow copies `page/out` from mculink-bench's default branch in place of the link,
with `.github/measurements.py`. The copy loads the site's fonts rather than its own, so a reader
downloads each font once. A new measurements page goes live on the workflow's next run: push here,
or run it by hand. The page's wire section cites annotations in the recordings, so the workflow
also checks out their sidecars from mculink-recordings (the recordings themselves load from that
repository's own site). The workflow needs mculink-bench and mculink-recordings to be public, and
this repository's Pages settings to deploy from GitHub Actions.

## Verge's docs

Verge's docs live beside the code they describe, in mculink-verge and verge, so a change to a
command updates its doc in the same commit. `content/verge/_index.md` lists them: their groups,
order, addresses under `/verge/docs/`, and the file each comes from. `.github/verge-docs.py` copies
them into `content/verge/docs/`, which git ignores, from checkouts beside this one (or the ones
`--repo NAME=PATH` names). Links between listed docs become page links, which `zola build` checks;
other links go to the file on GitHub. An SVG image from the doc's own repository, on a line of its
own, is copied into the page as a figure, so the site's colours, fonts and day and night faces reach
it; its alt text becomes the figure's accessible name. A listed doc that does not exist yet shows as
coming. Run it again after a doc changes. The workflow does the same from each repository's default
branch, so those repositories must be public too.

## The marks

The project's marks are its dial, Verge's V of samples and tickwave's wave. The masters in
`design/marks/` are under the Creative Commons Attribution 4.0 International licence (CC BY 4.0),
in `design/marks/CC-BY-4.0.txt`. So is every image drawn from them: the icons and previews in
`design/out/`, and the favicons and link preview in `static/`. Credit the Escapement Project.

Use the marks to refer to the Escapement Project or its tools, in an article, a talk, a package or a
link. Don't use them, changed or not, as another project's mark. Don't use them to suggest that the
project made or endorses something it didn't.

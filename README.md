# escapement-project.github.io

The Escapement Project's site, built with [Zola](https://www.getzola.org/), and the design tokens
its pages and verge-gui share.

```sh
zola serve      # a local copy that rebuilds on every change
zola build      # the site, into public/
```

| Path | What |
|---|---|
| `templates/` | the page templates: `base.html` for every page, `index.html` for the landing page, `404.html` for any address without a page |
| `content/_index.md` | the landing page's description and the Source section's repositories, with each one's preview summary |
| `static/base.css` | the base every page of the project shares: header, sections, type, figures, tables and footer, naming colour roles, never values |
| `static/site.css` | the landing and not-found pages' own parts, after `base.css` |
| `design/header.html`, `design/footer.html` | the header and footer every page of the project shows; `templates/partials/header.html` fills the header in for Zola |
| `static/js/face.js` | the day and night switch, on every page |
| `static/js/header.js` | the header's hairline, the mark on the section in view, and the menu of places on phones, on every page |
| `static/js/landing.js` | the landing page's dial, figure, links and Verge section |
| `data/landing.json` | the figures the landing page shows, and where they come from |
| `design/` | the design tokens and fonts, and the script that generates them: see `design/README.md` |
| `.github/workflows/publish.yml` | checks the generated files, builds the site with the measurements page and publishes it to GitHub Pages |

`static/tokens.css`, `static/fonts/`, `static/favicon.ico`, `static/apple-touch-icon.png`,
`static/preview.png` and `design/out/` are generated: edit `design/tokens.toml`, the marks in
`design/marks/` or the content the previews show, and run `uv run design/build.py` rather than
editing them.

The measurements page keeps copies of `base.css`, the header, the footer, `face.js` and
`header.js`, as it does of the tokens; `design/README.md` says how they are checked.

The landing page works without scripts: its figures are in the text and in Table 1, which Zola
renders from `data/landing.json`. Scripts add the dial, Figure 1, and the highlights that link the
text, the figure and the table. The page loads no fonts or scripts from anywhere else.

## The measurements page

The site serves mculink-bench's measurements page at `/measurements/`. To see it locally, link the
page's folder from a mculink-bench checkout beside this one:

```sh
ln -s ../../mculink-bench/page/out static/measurements
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

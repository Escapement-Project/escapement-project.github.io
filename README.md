# escapement-project.github.io

The Escapement Project's site, built with [Zola](https://www.getzola.org/), and the design tokens
its pages and verge-gui share.

```sh
zola serve      # a local copy that rebuilds on every change
zola build      # the site, into public/
```

| Path | What |
|---|---|
| `templates/` | the page templates: `base.html` for every page, `index.html` for the landing page |
| `static/site.css` | the site's layout and components, naming colour roles, never values |
| `static/js/face.js` | the day and night switch, on every page |
| `static/js/landing.js` | the landing page's dial, figure, links and Verge section |
| `data/landing.json` | the figures the landing page shows, and where they come from |
| `design/` | the design tokens and fonts, and the script that generates them: see `design/README.md` |

`static/tokens.css`, `static/fonts/` and `design/out/` are generated: edit `design/tokens.toml` and
run `uv run design/build.py` rather than editing them.

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

# /// script
# dependencies = ["fonttools", "uharfbuzz"]
# ///
"""Fit the fallback faces in tokens.toml's [[fallbacks]]: for each web font at a weight and width the
site uses, how far to scale a local font so the site's text, shaped with kerning as a browser sets
it, takes the same width (size-adjust), and the web font's ascent, descent and line gap on that
scale.

    uv run design/fallbacks.py SANS SANS_BOLD MONO PUBLIC

SANS, SANS_BOLD and MONO are Liberation Sans Regular and Bold and Liberation Mono Regular, which
have Arial's and Courier New's advance widths, kerning and vertical metrics. PUBLIC is a built site:
the text of its pages is what gets shaped. Reads the fixed instances
in design/out/fonts/ (build.py writes them). Prints the [[fallbacks]] entries to paste."""
import html.parser
import pathlib
import sys

import uharfbuzz as hb
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent
# (web family, instance file, weight range, stretch, reference): the weights each face covers, so
# a weight between two instances takes the nearer one.
FACES = [
    ("Hanken Grotesk", "HankenGrotesk-Regular.ttf", "100 449", None, "sans"),
    ("Hanken Grotesk", "HankenGrotesk-Medium.ttf", "450 549", None, "sans"),
    ("Hanken Grotesk", "HankenGrotesk-SemiBold.ttf", "550 1000", None, "sans-bold"),
    ("Saira", "Saira-Expanded-Medium.ttf", "100 549", None, "sans"),
    ("Saira", "Saira-Expanded-SemiBold.ttf", "550 1000", None, "sans-bold"),
    ("Martian Mono", "MartianMono-Medium.ttf", "100 1000", "100%", "mono"),
    ("Martian Mono", "MartianMono-SemiExpanded-Medium.ttf", "100 1000", "112.5%", "mono"),
]


class Text(html.parser.HTMLParser):
    """The text a reader sees: everything outside script, style and template."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip, self.lines = 0, []

    def handle_starttag(self, tag, attrs):
        self.skip += tag in ("script", "style", "template", "svg")

    def handle_endtag(self, tag):
        self.skip -= tag in ("script", "style", "template", "svg") and self.skip > 0

    def handle_data(self, data):
        if not self.skip and data.split():
            self.lines.append(" ".join(data.split()))


def width(path, lines):
    """The site's text shaped in this font with its default features (kerning, ligatures), in ems."""
    blob = hb.Blob.from_file_path(str(path))
    face = hb.Face(blob)
    font, total = hb.Font(face), 0
    for line in lines:
        buf = hb.Buffer()
        buf.add_str(line)
        buf.guess_segment_properties()
        hb.shape(font, buf)
        total += sum(p.x_advance for p in buf.glyph_positions)
    return total / face.upem


def vertical(font):
    """Ascent, descent and line gap in ems, as browsers read them: the typo metrics when the font
    asks for them (USE_TYPO_METRICS), else hhea's."""
    upm, os2, hhea = font["head"].unitsPerEm, font["OS/2"], font["hhea"]
    if os2.fsSelection & (1 << 7):
        return os2.sTypoAscender / upm, -os2.sTypoDescender / upm, os2.sTypoLineGap / upm
    return hhea.ascent / upm, -hhea.descent / upm, hhea.lineGap / upm


def main():
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    refs = dict(zip(("sans", "sans-bold", "mono"), sys.argv[1:4]))
    text = Text()
    for page in sorted(pathlib.Path(sys.argv[4]).rglob("index.html")):
        text.feed(page.read_text())
    for family, file, weight, stretch, ref in FACES:
        path = ROOT / "out" / "fonts" / file
        scale = width(path, text.lines) / width(refs[ref], text.lines)
        web = TTFont(path)
        asc, desc, gap = vertical(web)
        print("[[fallbacks]]")
        print(f'family = "{family}"')
        print(f'local = "{ref}"')
        print(f'weight = "{weight}"')
        if stretch:
            print(f'stretch = "{stretch}"')
        print(f"size-adjust = {scale * 100:.2f}")
        print(f"ascent = {asc / scale * 100:.2f}")
        print(f"descent = {desc / scale * 100:.2f}")
        print(f"line-gap = {gap / scale * 100:.2f}")
        print(f"# from {file}, {sum(map(len, text.lines))} characters of the site's text")
        print()


if __name__ == "__main__":
    main()

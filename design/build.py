# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools==4.68.0", "brotli==1.2.1", "resvg-py==0.5.0", "pillow==13.0.0"]
# ///
# Pinned exactly: --check compares bytes, and another version may write a font or an image
# differently from the same source.
"""Build the design tokens from design/tokens.toml.

Writes static/tokens.css, the web fonts under static/fonts/, the favicon, the iOS icon and the
site's link preview for the site and any page that vendors them; design/out/tokens.rs with the
fixed font instances under design/out/fonts/ for verge-gui; the icons under design/out/icons/:
Verge's app icon for each platform and the org's avatar; and each published repository's social
preview under design/out/previews/. The source fonts download once from google/fonts at the commit
tokens.toml pins; the marks are design/marks/. The previews also read the headline from
data/landing.json and the repositories from content/_index.md.

    uv run design/build.py                   # write every output
    uv run design/build.py --check FILE...   # are the outputs current, and is each FILE, a
                                             # vendored copy, the same as the output, mark or
                                             # shared file of its name?
"""
import argparse
import filecmp
import io
import json
import pathlib
import re
import shutil
import struct
import sys
import tempfile
import tomllib
import urllib.parse
import urllib.request

import resvg_py
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageFont

DESIGN = pathlib.Path(__file__).resolve().parent
ROOT = DESIGN.parent
CACHE = DESIGN / "fonts-source"
MARKS = DESIGN / "marks"
# Everything the build writes. The two folders are the build's alone and are written afresh, so a
# renamed or removed output does not linger.
OUT_FILES = tuple(map(pathlib.Path, ("static/tokens.css", "static/favicon.ico", "static/apple-touch-icon.png",
                                     "static/preview.png")))
OUT_DIRS = (pathlib.Path("static/fonts"), pathlib.Path("design/out"))
# What the last build wrote. A loose file it no longer makes is found here, as an orphan.
MANIFEST = pathlib.Path("design/out/outputs.txt")
# Written by hand, not built, and copied by the project's other pages: the shared base sheet, the
# header and footer every page shows, and the scripts behind the header. --check compares copies of
# these too, by name.
SHARED = tuple(map(pathlib.Path, ("static/base.css", "static/js/face.js", "static/js/header.js",
                                  "design/header.html", "design/footer.html")))
# Apple's grid: a 1024 canvas holds an 824 plate, with room for the shadow macOS draws.
MACOS_PLATE = 824 / 1024


def fail(message):
    raise SystemExit(f"design/tokens.toml: {message}")


def content_fail(message):
    raise SystemExit(f"content/_index.md: {message}")


def write_text(path, text):
    # "\n" on every system: --check compares bytes, and Windows would otherwise write "\r\n".
    path.write_text(text, newline="\n")


def colour(role, face, value):
    """A colour as CSS gives it and as a Rust Color32 expression."""
    if value == "transparent":
        return value, "Color32::TRANSPARENT"
    m = re.fullmatch(r"#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})", value)
    if not m:
        fail(f"color.{role}.{face} is {value!r}: give #rgb, #rrggbb, #rrggbbaa or transparent")
    h = m.group(1)
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    if len(h) == 8:
        return value, f"Color32::from_rgba_unmultiplied(0x{h[0:2]}, 0x{h[2:4]}, 0x{h[4:6]}, 0x{h[6:8]})"
    return value, f"Color32::from_rgb(0x{r:02x}, 0x{g:02x}, 0x{b:02x})"


def families(tokens):
    """The font entries, by name; each names its family."""
    out = {}
    for key, entry in tokens["fonts"].items():
        if not isinstance(entry, dict):
            continue
        if "family" not in entry:
            fail(f"fonts.{key} names no family")
        out[key] = entry
    return out


def span(axes, axis):
    """An axis's range as (low, high), or None where the font keeps no such axis."""
    v = axes.get(axis)
    if v is None:
        return None
    return (v[0], v[1]) if isinstance(v, list) else (v, v)


def check_type(tokens, fonts):
    """Each type role's family is a font the build makes, at a width and weight that font keeps: a
    browser clamps a value outside the range without a word."""
    by_family = {f["family"]: (key, f["web"]) for key, f in fonts.items()}
    for role, t in tokens["type"].items():
        if t["family"] not in by_family:
            fail(f"type.{role} is {t['family']!r}, which no [fonts.*] entry makes")
        key, web = by_family[t["family"]]
        for axis, field, default in (("wdth", "stretch", 100), ("wght", "weight", None)):
            want, have = t.get(field), span(web, axis)
            if want is None:
                continue
            lo, hi = have if have else (default, default)
            if lo is not None and not lo <= want <= hi:
                fail(f"type.{role}.{field} is {want}, outside fonts.{key}.web's {axis} {lo}-{hi}")


def stack(t):
    return ", ".join(f'"{f}"' if " " in f or f[0].isupper() else f for f in [t["family"], *t["fallback"]])


def css(tokens, web):
    out = ["/* The Escapement Project's design tokens, generated by design/build.py from design/tokens.toml.",
           "   Edit the tokens and rebuild rather than this file. */"]
    for f in web:
        desc = [f'font-family: "{f["family"]}"', f'src: url("fonts/{f["file"]}") format("woff2")']
        if f["weight"]:
            desc.append(f'font-weight: {f["weight"]}')
        if f["stretch"]:
            desc.append(f'font-stretch: {f["stretch"]}')
        out.append("@font-face { " + "; ".join(desc + ["font-display: swap"]) + "; }")

    def block(face, indent="  "):
        return [f"{indent}--{role}: {colour(role, face, v[face])[0]};" for role, v in tokens["color"].items()]

    i = tokens["interaction"]
    patterns = []
    for name, v in tokens["pattern"].items():
        if isinstance(v, list):
            patterns.append(f"  --dash-{name}: {' '.join(f'{x:g}' for x in v)};")
        else:
            patterns.append(f"  --{name}: {v:g}{'px' if name.endswith('-width') else ''};")
    types = []
    for role, t in tokens["type"].items():
        line = f"  --font-{role}: {stack(t)};"
        if "stretch" in t:
            line += f" --{role}-stretch: {t['stretch']:g}%;"
        if "weight" in t:
            line += f" --{role}-weight: {t['weight']};"
        types.append(line)
    out += [":root {", *block("day"),
            "  /* Interaction: a focus ring, and a wash of ink over what the pointer is on */",
            f'  --focus-width: {i["focus-width"]}px;',
            f'  --wash: color-mix(in srgb, var(--ink) {round(i["wash"] * 100)}%, transparent);',
            "  /* Line patterns: dash arrays as stroke-dasharray values at a 2 px line */",
            *patterns,
            "  /* Type */",
            *types,
            "  color-scheme: light;", "}",
            "/* Night, chosen on the page or followed from the system */",
            ':root[data-face="night"] {', *block("night"), "  color-scheme: dark;", "}",
            "@media (prefers-color-scheme: dark) {",
            '  :root:not([data-face="day"]) {', *block("night", "    "), "    color-scheme: dark;", "  }", "}"]
    return "\n".join(out) + "\n"


def rust(tokens, fixed):
    roles = list(tokens["color"])
    field = lambda role: role.replace("-", "_")
    out = ["//! The Escapement Project's design tokens, by role.",
           "//!",
           "//! Generated by design/build.py in escapement-project.github.io from design/tokens.toml:",
           "//! edit the tokens there and regenerate rather than this file. design/README.md says what",
           "//! each role is for.",
           "",
           "use egui::Color32;",
           "",
           "/// Every colour role for one face.",
           "#[derive(Clone, Copy, Debug, PartialEq)]",
           "pub struct Face {",
           *[f"    pub {field(r)}: Color32," for r in roles],
           "}",
           ""]
    for face in ("day", "night"):
        out += [f"pub const {face.upper()}: Face = Face {{",
                *[f"    {field(r)}: {colour(r, face, tokens['color'][r][face])[1]}," for r in roles], "};", ""]
    i = tokens["interaction"]
    out += ["/// The focus ring's width, in points.",
            f"pub const FOCUS_WIDTH: f32 = {float(i['focus-width'])};",
            "/// The ink wash over what the pointer is on, as an alpha on the face's ink.",
            f"pub const WASH: f32 = {float(i['wash'])};",
            "",
            "/// Line patterns, as design/README.md describes them: dash and gap lengths at a 2 point",
            "/// line, and the opacity and width of a run under energy capture."]
    for name, v in tokens["pattern"].items():
        const = name.upper().replace("-", "_")
        if isinstance(v, list):
            out.append(f"pub const DASH_{const}: &[f32] = &[{', '.join(f'{float(x)}' for x in v)}];")
        else:
            out.append(f"pub const {const}: f32 = {float(v)};")
    out += ["",
            "/// The fixed font instances under fonts/, each with the axis values it was cut at.",
            "pub const FONTS: &[(&str, &str)] = &["]
    # In rustfmt's own layout, so a crate can format the copy: each instance's axes on a line of
    # its own (it realigns trailing comments), and a tuple past 60 characters split (its call width).
    for name, axes in fixed:
        inner = f'"{name}", "{name}.ttf"'
        out.append(f"    // {axes}")
        out += [f"    ({inner}),"] if len(inner) <= 60 else ["    (", f'        "{name}",', f'        "{name}.ttf",', "    ),"]
    out += ["];", ""]
    return "\n".join(out)


def unicodes(spec):
    cps = []
    for part in spec.split(","):
        lo, _, hi = part.strip().removeprefix("U+").partition("-")
        cps += range(int(lo, 16), int(hi or lo, 16) + 1)
    return cps


def source(entry, key):
    """A file from google/fonts at the pinned commit, downloaded once."""
    path = entry[key]
    local = CACHE / entry["commit"] / path
    if not local.exists():
        local.parent.mkdir(parents=True, exist_ok=True)
        url = f"https://raw.githubusercontent.com/google/fonts/{entry['commit']}/{urllib.parse.quote(path)}"
        with urllib.request.urlopen(url) as r:
            local.write_bytes(r.read())
    return local


def load(path):
    # No timestamp written on save, so the same source always gives the same bytes.
    return TTFont(path, recalcTimestamp=False)


def limits(axes):
    out = {}
    for axis in ("wdth", "wght"):
        s = span(axes, axis)
        if s is not None:
            out[axis] = s if s[0] != s[1] else s[0]
    return out


def descriptor(axes, axis, unit=""):
    s = span(axes, axis)
    if s is None:
        return None
    fmt = lambda x: f"{x:g}{unit}"
    return fmt(s[0]) if s[0] == s[1] else f"{fmt(s[0])} {fmt(s[1])}"


def master(name, size):
    """The mark's master for a size: the one fitted to that size's pixel grid where it exists, else
    the 64-unit master. Returns its grid, its shapes, and whether it is fitted."""
    fitted = MARKS / f"{name}-{size}.svg"
    path = fitted if size and fitted.exists() else MARKS / f"{name}.svg"
    m = re.fullmatch(r'\s*<svg [^>]*viewBox="0 0 (\d+) \1"[^>]*>(.*)</svg>\s*', path.read_text(), re.S)
    if not m:
        raise SystemExit(f"{path.relative_to(ROOT)}: give one <svg> with a square viewBox from 0 0")
    return int(m.group(1)), m.group(2), path == fitted


def icon_svg(tokens, key, size=None, corners=True, plate=1.0):
    """An icon as SVG: its mark on its plate. A fitted master is used only where the plate fills a
    canvas of its size; elsewhere the 64-unit master, scaled into the plate."""
    spec, ic = tokens["icon"][key], tokens["icon"]
    fill = lambda role: tokens["color"][role]["day"]
    g, body, fitted = master(spec["mark"], size if plate == 1.0 else None)
    side, at = g * plate, g * (1 - plate) / 2
    rx = f"{ic['corner'] * side:g}" if corners else "0"
    if not fitted:
        k = side * (1 - 2 * ic["inset"]) / g
        body = f'<g transform="translate({at + side * ic["inset"]:g} {at + side * ic["inset"]:g}) scale({k:g})">{body}</g>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {g} {g}">'
            f'<rect x="{at:g}" y="{at:g}" width="{side:g}" height="{side:g}" rx="{rx}" fill="{fill(spec["ground"])}"/>'
            f'<g fill="{fill(spec["ink"])}">{body}</g></svg>')


def png(svg_text, px):
    return bytes(resvg_py.svg_to_bytes(svg_string=svg_text, width=px, height=px))


def image(svg_text, px):
    return Image.open(io.BytesIO(png(svg_text, px))).convert("RGBA")


def icons(tokens, out_root):
    for key in ("project", "verge"):
        if key not in tokens["icon"]:
            fail(f"icon.{key} is missing")
        for field in ("mark", "ground", "ink"):
            v = tokens["icon"][key].get(field)
            if field == "mark" and not (MARKS / f"{v}.svg").exists():
                fail(f"icon.{key}.mark is {v!r}, which design/marks/ does not have")
            if field != "mark" and v not in tokens["color"]:
                fail(f"icon.{key}.{field} is {v!r}, which is not a colour role")
    static, out = out_root / "static", out_root / "design" / "out" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    # The sites' favicon. iOS and GitHub round an icon's corners themselves: theirs are square.
    ico = [image(icon_svg(tokens, "project", px), px) for px in (16, 32, 48, 64)]
    ico[-1].save(static / "favicon.ico", format="ICO", sizes=[i.size for i in ico], append_images=ico[:-1])
    (static / "apple-touch-icon.png").write_bytes(png(icon_svg(tokens, "project", corners=False), 180))
    (out / "escapement-project-avatar.png").write_bytes(png(icon_svg(tokens, "project", corners=False), 512))
    # Verge's app icon: SVG and PNGs for Linux, ICO for Windows, ICNS on Apple's grid for macOS.
    # Not verge.svg: that is the mark's name, and copies are checked by name.
    write_text(out / "verge-icon.svg", icon_svg(tokens, "verge") + "\n")
    for px in (16, 24, 32, 48, 64, 128, 256, 512):
        (out / f"verge-{px}.png").write_bytes(png(icon_svg(tokens, "verge", px), px))
    win = [image(icon_svg(tokens, "verge", px), px) for px in (16, 24, 32, 48, 64, 256)]
    win[-1].save(out / "verge.ico", format="ICO", sizes=[i.size for i in win], append_images=win[:-1])
    mac = {px: png(icon_svg(tokens, "verge", plate=MACOS_PLATE), px) for px in (16, 32, 64, 128, 256, 512, 1024)}
    (out / "verge.icns").write_bytes(icns(mac))


# Each ICNS entry by its size in pixels, every one PNG-coded. Pillow's writer leaves out the 16 and
# 32 px entries at 1x (icp4, icp5), so the container is written here: a header, then type, length
# and data per entry.
ICNS_TYPES = (("icp4", 16), ("icp5", 32), ("icp6", 64), ("ic07", 128), ("ic08", 256), ("ic09", 512),
              ("ic10", 1024), ("ic11", 32), ("ic12", 64), ("ic13", 256), ("ic14", 512))


def icns(pngs):
    body = b"".join(kind.encode() + struct.pack(">I", 8 + len(pngs[px])) + pngs[px] for kind, px in ICNS_TYPES)
    return b"icns" + struct.pack(">I", 8 + len(body)) + body


class Card:
    """A link preview drawn as SVG, in the fixed fonts the build makes, on the night face."""

    def __init__(self, tokens, fonts, w, h, what):
        self.tokens, self.fonts, self.w, self.h, self.what = tokens, fonts, w, h, what
        self.cmaps = {}
        night = lambda role: tokens["color"][role]["night"]
        self.ink, self.ink2, self.hair = night("ink"), night("ink-2"), night("hair")
        self.parts = [f'<rect width="{w}" height="{h}" fill="{tokens["color"]["plate"]["day"]}"/>']

    def width(self, text, font, size):
        # Basic layout, never a system shaper: a line break must not depend on the machine.
        return ImageFont.truetype(self.fonts / f"{font}.ttf", size, layout_engine=ImageFont.Layout.BASIC).getlength(text)

    def lines(self, text, font, size, measure):
        """Greedy lines at the narrowest measure that keeps their count, so no word sits alone."""
        def greedy(m):
            out, line = [], ""
            for word in text.split():
                t = f"{line} {word}".strip()
                if line and self.width(t, font, size) > m:
                    out.append(line)
                    t = word
                line = t
            return out + [line]
        n = len(greedy(measure))
        while measure > 200 and len(greedy(measure - 10)) == n:
            measure -= 10
        return greedy(measure)

    def text(self, x, y, text, family, size, fill, weight, stretch, font, measure=None, leading=1.3,
             anchor="start", max_lines=1, room=None):
        """Text from its first baseline at y in `font`, the fixed instance that `family`, `weight`
        and `stretch` select; wrapped to `measure` if given. A glyph the font lacks would draw
        nothing, and a line past `max_lines` or wider than `room` would run into what is beside it:
        both fail the build. Returns the last baseline."""
        if font not in self.cmaps:
            self.cmaps[font] = TTFont(self.fonts / f"{font}.ttf")["cmap"].getBestCmap()
        missing = sorted({ch for ch in text if not ch.isspace() and ord(ch) not in self.cmaps[font]})
        if missing:
            raise SystemExit(f"{self.what}: {font} has no glyph for {''.join(missing)!r} in {text!r}")
        rows = self.lines(text, font, size, measure) if measure else [text]
        if len(rows) > max_lines:
            raise SystemExit(f"{self.what}: {text!r} takes {len(rows)} lines, room for {max_lines}")
        if room is not None and self.width(text, font, size) > room:
            raise SystemExit(f"{self.what}: {text!r} is wider than its {room} px")
        esc = lambda t: t.replace("&", "&amp;").replace("<", "&lt;")
        spans = "".join(f'<tspan x="{x}" y="{y + i * size * leading:.1f}">{esc(r)}</tspan>' for i, r in enumerate(rows))
        self.parts.append(f'<text font-family="{family}" font-size="{size}" font-weight="{weight}" font-stretch="{stretch}" '
                          f'text-anchor="{anchor}" fill="{fill}">{spans}</text>')
        return y + (len(rows) - 1) * size * leading

    def place(self, svg_text, x, y, side, opacity=1):
        """An SVG drawn into a square at (x, y)."""
        inner = svg_text.replace("<svg ", f'<svg x="{x}" y="{y}" width="{side}" height="{side}" opacity="{opacity}" ', 1)
        self.parts.append(inner)

    def brand(self, x, y, side):
        self.place(icon_svg(self.tokens, "project"), x, y, side)
        self.text(x + side + 20, y + side / 2 + 9, "Escapement Project", "Saira", 26, self.ink, 500, "expanded",
                  "Saira-Expanded-Medium")

    def png(self):
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}">{"".join(self.parts)}</svg>'
        files = [str(f) for f in sorted(self.fonts.glob("*.ttf"))]
        return bytes(resvg_py.svg_to_bytes(svg_string=svg, width=self.w, height=self.h, font_files=files,
                                           skip_system_fonts=True))


def front_matter(path):
    m = re.match(r"\+\+\+\n(.*?)\n\+\+\+", path.read_text(), re.S)
    if not m:
        raise SystemExit(f"{path.relative_to(ROOT)}: no +++ front matter")
    return tomllib.loads(m.group(1))


def bare(name, fill):
    """A 64-unit master in one colour, as a standalone SVG."""
    _, body, _ = master(name, None)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="{fill}">{body}</g></svg>'


def previews(tokens, out_root):
    """The site's link preview (1200 x 630) and one social preview (1280 x 640) per published
    repository, on the night face."""
    fonts = out_root / "design" / "out" / "fonts"
    lume, on_lume = tokens["color"]["lume"]["day"], tokens["color"]["on-lume"]["day"]
    h = json.loads((ROOT / "data" / "landing.json").read_text())["headline"]
    site = front_matter(ROOT / "content" / "_index.md")

    c = Card(tokens, fonts, 1200, 630, "static/preview.png")
    # The hero's dial, faint and cropped at the right edge.
    c.place(bare("dial", c.ink), 880, 150, 520, opacity=0.08)
    c.brand(72, 72, 56)
    y = c.text(72, 236, "Open firmware for NXP's MCU-Link", "Saira", 58, c.ink, 500, "expanded",
               "Saira-Expanded-Medium", 700, 1.18, max_lines=2)
    # The headline in its lume window, as the measurements page sets it.
    ratio = f"{h['ratio']}×"
    win = c.width(ratio, "MartianMono-SemiExpanded-Medium", 84) + 56
    c.parts.append(f'<rect x="72" y="{y + 64:.1f}" width="{win:.1f}" height="124" rx="10" fill="{lume}"/>')
    c.text(100, y + 156, ratio, "Martian Mono", 84, on_lume, 500, "semi-expanded", "MartianMono-SemiExpanded-Medium")
    claim = (f"the write rate of NXP's own firmware over SWD, through probe-rs: Verge at {h['oursAt']} MHz, "
             f"NXP's firmware at {h['stockAt']} MHz, the fastest clock it reads right at")
    # Five lines end above the card's bottom margin; a wider ratio leaves the claim less room.
    c.text(72 + win + 32, y + 96, claim, "Hanken Grotesk", 26, c.ink2, 400, "normal", "HankenGrotesk-Regular",
           830 - 72 - win - 32, max_lines=5)
    (out_root / "static" / "preview.png").write_bytes(c.png())

    out = out_root / "design" / "out" / "previews"
    out.mkdir(parents=True, exist_ok=True)
    for r in site["extra"]["repos"]:
        # The same test as the Source section's: no language means not published yet.
        if not r.get("language"):
            continue
        if not r.get("summary"):
            content_fail(f"repository {r['name']} has no summary for its preview")
        if r.get("icon") and r["icon"] not in tokens["icon"]:
            content_fail(f"repository {r['name']}'s icon is {r['icon']!r}, which tokens.toml's [icon] does not name")
        c = Card(tokens, fonts, 1280, 640, f"design/out/previews/{r['name']}.png")
        if r.get("icon"):
            c.place(icon_svg(tokens, r["icon"]), 860, 170, 300)
        c.brand(80, 80, 48)
        right = 820 if r.get("icon") else 1200
        c.text(80, 290, r["name"], "Martian Mono", 64, c.ink, 500, "normal", "MartianMono-Medium", room=right - 80)
        # Three lines end above the rule at 520.
        c.text(80, 370, r["summary"], "Hanken Grotesk", 32, c.ink2, 400, "normal", "HankenGrotesk-Regular",
               700 if r.get("icon") else 1100, 1.35, max_lines=3)
        c.parts.append(f'<line x1="80" x2="1200" y1="520" y2="520" stroke="{c.hair}" stroke-width="2"/>')
        address = f"github.com/Escapement-Project/{r['name']}"
        c.text(80, 568, r["language"], "Hanken Grotesk", 24, c.ink2, 500, "normal", "HankenGrotesk-Medium", room=240)
        c.text(340, 568, r.get("licence", site["extra"]["licence"]), "Hanken Grotesk", 24, c.ink2, 500, "normal",
               "HankenGrotesk-Medium", room=1200 - 340 - c.width(address, "HankenGrotesk-Medium", 24) - 40)
        c.text(1200, 568, address, "Hanken Grotesk", 24, c.ink, 500, "normal", "HankenGrotesk-Medium", anchor="end")
        (out / f"{r['name']}.png").write_bytes(c.png())


def build(tokens, out_root):
    """Every output, into out_root."""
    fonts = families(tokens)
    check_type(tokens, fonts)
    web_dir, fixed_dir = out_root / "static" / "fonts", out_root / "design" / "out" / "fonts"
    web_dir.mkdir(parents=True, exist_ok=True)
    fixed_dir.mkdir(parents=True, exist_ok=True)
    wanted = unicodes(tokens["fonts"]["characters"])
    web, fixed = [], []
    for key, entry in fonts.items():
        src, licence = source(entry, "file"), source(entry, "license")
        w = entry["web"]
        font = instancer.instantiateVariableFont(load(src), limits(w))
        # Saved and read back before subsetting: the subsetter fails on the instancer's lazily
        # loaded glyph variations (a KeyError for a glyph that has none).
        buf = io.BytesIO()
        font.save(buf)
        font = load(io.BytesIO(buf.getvalue()))
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        sub = subset.Subsetter(options)
        sub.populate(unicodes=wanted)
        sub.subset(font)
        font.flavor = "woff2"
        font.save(web_dir / f"{w['name']}.woff2")
        shutil.copyfile(licence, web_dir / f"{w['name']}-OFL.txt")
        web.append({"family": entry["family"], "file": f"{w['name']}.woff2", "weight": descriptor(w, "wght"),
                    "stretch": descriptor(w, "wdth", "%")})
        for inst in entry["fixed"]:
            axes = {a: inst[a] for a in ("wdth", "wght") if a in inst}
            font = instancer.instantiateVariableFont(load(src), axes, updateFontNames=True)
            if "fvar" in font:
                left = [a.axisTag for a in font["fvar"].axes]
                fail(f"fonts.{key}.fixed {inst['name']} leaves {', '.join(left)} variable: egui has no axes, so give each a value")
            font.save(fixed_dir / f"{inst['name']}.ttf")
            fixed.append((inst["name"], ", ".join(f"{a} {v:g}" for a, v in axes.items())))
        shutil.copyfile(licence, fixed_dir / f"{key}-OFL.txt")
    write_text(out_root / "static" / "tokens.css", css(tokens, web))
    write_text(out_root / "design" / "out" / "tokens.rs", rust(tokens, fixed))
    icons(tokens, out_root)
    previews(tokens, out_root)


def outputs(root):
    """The build's files under root, as paths relative to it: the loose files it makes now and those
    its manifest says it made last time, and everything in its folders."""
    found = {f for f in OUT_FILES if (root / f).is_file()}
    if (root / MANIFEST).is_file():
        found |= {pathlib.Path(line) for line in (root / MANIFEST).read_text().splitlines()
                  if line and (root / line).is_file()}
    for d in OUT_DIRS:
        found |= {p.relative_to(root) for p in (root / d).rglob("*") if p.is_file()}
    return sorted(found)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--check", nargs="*", metavar="FILE", help="compare the outputs, and each vendored FILE, with a fresh build")
    args = ap.parse_args()
    tokens = tomllib.loads((DESIGN / "tokens.toml").read_text())
    with tempfile.TemporaryDirectory() as tmp:
        fresh = pathlib.Path(tmp)
        build(tokens, fresh)
        write_text(fresh / MANIFEST, "".join(f"{rel.as_posix()}\n" for rel in outputs(fresh)))
        made = outputs(fresh)
        # Copies are checked by file name, so two outputs, marks or shared files may share one only
        # with the same bytes (the fonts' licence texts do).
        contents = {}
        for path in [fresh / rel for rel in made] + sorted(MARKS.glob("*.svg")) + [ROOT / rel for rel in SHARED]:
            contents.setdefault(path.name, set()).add(path.read_bytes())
        clash = sorted(name for name, seen in contents.items() if len(seen) > 1)
        if clash:
            raise SystemExit(f"outputs, marks or shared files named {', '.join(clash)} differ: a copy of one could not be checked")
        if args.check is None:
            # Written afresh: the folders are the build's alone, and a loose file the last build made
            # and this one does not goes too.
            for rel in outputs(ROOT):
                if rel not in made:
                    (ROOT / rel).unlink()
            for d in OUT_DIRS:
                shutil.rmtree(ROOT / d, ignore_errors=True)
            for rel in made:
                (ROOT / rel).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(fresh / rel, ROOT / rel)
            for rel in made:
                print(rel)
            return
        here = outputs(ROOT)
        stale = [rel for rel in made if rel not in here or not filecmp.cmp(fresh / rel, ROOT / rel, shallow=False)]
        orphans = [rel for rel in here if rel not in made]
        # A copy may be of an output, a mark or a shared file.
        by_name = {p.name: p for p in MARKS.glob("*.svg")} | {rel.name: ROOT / rel for rel in SHARED} | {rel.name: fresh / rel for rel in made}
        drift = [f for f in map(pathlib.Path, args.check)
                 if f.name not in by_name or not f.exists() or not filecmp.cmp(f, by_name[f.name], shallow=False)]
        for rel in stale:
            print(f"stale: {rel} differs from a fresh build of the tokens, marks and content; run design/build.py", file=sys.stderr)
        for rel in orphans:
            print(f"orphan: {rel} is no longer an output; run design/build.py", file=sys.stderr)
        for f in drift:
            print(f"drift: {f} is not the current {f.name}", file=sys.stderr)
        if stale or orphans or drift:
            sys.exit(1)
        print(f"current: the outputs and {len(args.check)} vendored file(s)")


if __name__ == "__main__":
    main()

# Writes the docs' search index, verge/docs/search.json, from the built site: each doc's sections
# (its text before the first heading, then each h2 and h3 with what follows it) as plain text, so a
# result can link straight to its heading. Run it on the output of `zola build`:
#
#     python3 .github/search-index.py public
#
# The index: {"docs": [[title, address], ...], "sections": [[doc, id, heading, text], ...]}, the
# docs in the order the docs' index lists them, each doc's sections in page order, every address
# relative to the index's own. search.js reads it.
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# Elements that end a run of text, so the words on either side of them stay apart.
BLOCK = {"p", "li", "ul", "ol", "dt", "dd", "dl", "pre", "table", "thead", "tbody", "tr", "td", "th",
         "div", "blockquote", "figure", "figcaption", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
         "details", "summary", "section"}
VOID = {"br", "hr", "img", "input", "wbr", "col", "source", "meta", "link"}


class Doc(HTMLParser):
    """One doc page's article: its title and its sections."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0          # open elements inside the article; 0 outside it
        self.skip = 0           # depth at which a skipped subtree opened, or 0
        self.title = None
        self.into = None        # "title" or "heading" while inside one, else None
        self.sections = [["", None, []]]  # [id, heading, text parts]
        self.heading = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get("class") or "").split()
        if self.depth == 0:
            if tag == "article" and "doc" in classes:
                self.depth = 1
            return
        if tag in VOID:
            self.space()
            return
        self.depth += 1
        if self.skip:
            return
        # Not the text (design/README.md): the line naming the source, heading links and the
        # figures' labels.
        if tag in ("svg", "script", "style") or "doc-source" in classes or "anchor" in classes:
            self.skip = self.depth
            return
        if tag == "h1":
            self.into, self.heading = "title", []
        elif tag in ("h2", "h3") and a.get("id"):
            self.into, self.heading = "heading", []
            self.sections.append([a["id"], None, []])
        elif tag in BLOCK:
            self.space()

    def handle_endtag(self, tag):
        if self.depth == 0 or tag in VOID:
            return
        if self.skip and self.depth == self.skip:
            self.skip = 0
        elif not self.skip:
            if tag == "h1" and self.into == "title":
                self.title, self.into = squash(self.heading), None
            elif tag in ("h2", "h3") and self.into == "heading":
                self.sections[-1][1], self.into = squash(self.heading), None
            elif tag in BLOCK:
                self.space()
        self.depth -= 1

    def handle_data(self, data):
        if self.depth == 0 or self.skip:
            return
        if self.into:
            self.heading.append(data)
        else:
            self.sections[-1][2].append(data)

    def space(self):
        if not self.into:
            self.sections[-1][2].append(" ")


def squash(parts):
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def main():
    public = Path(sys.argv[1])
    docs_dir = public / "verge" / "docs"
    # The docs' index lists every written doc once, in the order the site groups them.
    listing = (docs_dir / "index.html").read_text(encoding="utf-8")
    order = []
    for name in re.findall(r'href="[^"]*/verge/docs/([\w-]+)/"', listing):
        if name not in order and (docs_dir / name / "index.html").exists():
            order.append(name)
    on_disk = sorted(p.parent.name for p in docs_dir.glob("*/index.html"))
    missing = sorted(set(on_disk) - set(order))
    if missing:
        sys.exit(f"search-index: the docs' index does not list {', '.join(missing)}")

    docs, sections = [], []
    for n, name in enumerate(order):
        page = Doc()
        page.feed((docs_dir / name / "index.html").read_text(encoding="utf-8"))
        page.close()
        if not page.title:
            sys.exit(f"search-index: no title in verge/docs/{name}/")
        docs.append([page.title, f"{name}/"])
        for sid, heading, parts in page.sections:
            text = squash(parts)
            if sid or text:
                sections.append([n, sid, heading or page.title, text])

    out = docs_dir / "search.json"
    out.write_text(json.dumps({"docs": docs, "sections": sections}, ensure_ascii=False,
                              separators=(",", ":")), encoding="utf-8")
    print(f"search-index: {len(sections)} sections in {len(docs)} docs, {out.stat().st_size // 1024} KiB")


if __name__ == "__main__":
    main()

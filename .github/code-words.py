# Keeps the words of a doc's inline code whole: in each doc's article, every word of inline code (a
# run between spaces) of up to WHOLE characters goes in a <span class="word">, which doc.css keeps on
# one line. A browser otherwise breaks code where it breaks prose, after a hyphen or anywhere, and
# `verge update --file` ends a line with "--". A longer word, a path, still breaks anywhere, so it
# fits a phone. design/README.md defines the markup for every product's docs. Run it on the output
# of `zola build`:
#
#     python3 .github/code-words.py public
#
# Zola writes inline code as a bare <code> holding only text, and a code block as <pre> then <code>.
import html
import re
import sys
from pathlib import Path

# The longest word kept whole: a list item at 320 px holds 23 characters of code in the wider of
# the two engines' code faces, less one for punctuation against the word. A list inside a list
# holds 19, so a longer word kept whole there would stick out past the text.
WHOLE = 22

ARTICLE = re.compile(r'(<article class="doc">)(.*?)(</article>)', re.S)
CODE = re.compile(r"(<pre\b[^>]*>\s*)?<code>([^<]*)</code>")


def word(w: str) -> str:
    return f'<span class="word">{w}</span>' if w and len(html.unescape(w)) <= WHOLE else w


def code(m: re.Match) -> str:
    if m[1]:
        return m[0]
    return "<code>" + " ".join(map(word, m[2].split(" "))) + "</code>"


docs = 0
for page in Path(sys.argv[1]).rglob("*.html"):
    text = page.read_text()
    new, n = ARTICLE.subn(lambda a: a[1] + CODE.sub(code, a[2]) + a[3], text)
    docs += n
    if new != text:
        page.write_text(new)
if not docs:
    sys.exit(f'no <article class="doc"> under {sys.argv[1]}')
print(f"kept inline code's words whole in {docs} docs")

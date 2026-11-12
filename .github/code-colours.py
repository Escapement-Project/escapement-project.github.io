# Paints the docs' highlighted code in the project's code colours. Zola highlights with Catppuccin
# Latte in class mode and writes giallo.css, a class for each Latte colour; this rewrites each class
# to the role design/tokens.toml's [code-latte] gives that colour, so tokens.css sets the colours for
# each face and for more contrast. It drops the theme's background and italics, and fails on a rule
# or a colour it does not know, so a Zola upgrade that changes the file is seen. Run it on the output
# of `zola build`:
#
#     python3 .github/code-colours.py public
import re
import sys
import tomllib
from pathlib import Path

public = Path(sys.argv[1])
tokens = tomllib.loads((Path(__file__).parent.parent / "design" / "tokens.toml").read_text())
latte = {c.lower(): role for c, role in tokens["code-latte"].items()}
css = public / "giallo.css"
source = css.read_text()


def var(role: str) -> str:
    return f"var(--{role})" if role == "ink-2" else f"var(--code-{role})"


rules = []
for selector, body in re.findall(r"([^{}]+)\{([^{}]*)\}", re.sub(r"/\*.*?\*/", "", source, flags=re.S)):
    selector, body = selector.strip(), " ".join(body.split())
    if re.fullmatch(r"\.z-\d+", selector):
        m = re.fullmatch(r"color: (#[0-9A-Fa-f]{6});", body)
        if not m or m[1].lower() not in latte:
            raise SystemExit(f"{css}: {selector} {{ {body} }} is no Latte colour design/tokens.toml's [code-latte] maps")
        rules.append(f"{selector} {{ color: {var(latte[m[1].lower()])}; }}")
    elif selector == ".z-code":
        # The block's own text; doc.css gives the background
        rules.append(".z-code { color: var(--ink); }")
    elif selector == ".z-hl":
        rules.append(".z-hl { background-color: var(--wash); }")
    elif selector == ".giallo-ln":
        rules.append(".giallo-ln { color: var(--ink-2); }")
    elif selector == ".z-i":
        continue  # no italics in code
    elif selector in (".z-b", ".z-u", ".z-s", ".z-us"):
        rules.append(f"{selector} {{ {body} }}")
    else:
        raise SystemExit(f"{css}: {selector} {{ {body} }} is a rule this script does not know")

css.write_text("/* Zola's giallo.css for Catppuccin Latte, with each colour replaced by its role in tokens.css\n"
               "   (.github/code-colours.py) */\n" + "\n".join(rules) + "\n")
print(f"code-colours: {len(rules)} rules")

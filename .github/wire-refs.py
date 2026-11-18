"""Check the site's pages against the recordings they cite: every <tickwave-ref> names a
<tickwave-view> on its page, and it, every <tickwave-inset> and every link that opens tickwave's
Open page at an annotation name an annotation the recording's sidecar has, its hand-written ids and
each included generator file's as <source>/<id>, as mculink-bench's page checks its own.

python3 .github/wire-refs.py templates/verge.html templates/index.html ../mculink-recordings
"""

import json
import re
import sys
import tomllib
from pathlib import Path
from urllib.parse import unquote


def sidecar_ids(toml: Path) -> set[str]:
    side = tomllib.loads(toml.read_text())
    ids = {a["id"] for a in side.get("annotation", [])}
    for inc in side.get("include", []):
        lines = (toml.parent / inc).read_text().splitlines()
        head = json.loads(lines[0])
        if head.get("recording_id") != side.get("recording_id"):
            raise SystemExit(f"{inc}: recording_id differs from {toml.name}'s")
        ids |= {f"{head['source']}/{json.loads(line)['id']}" for line in lines[1:] if line.strip()}
    return ids


def main() -> int:
    *pages, recordings = map(Path, sys.argv[1:])
    if not pages:
        raise SystemExit(__doc__)
    ids: dict[tuple[str, str], set[str]] = {}

    def has(date: str, name: str, ann: str) -> str | None:
        """Why `ann` is not in recording `name` of `date`, or None."""
        if (date, name) not in ids:
            toml = recordings / date / f"{name}.annotations.toml"
            ids[date, name] = sidecar_ids(toml) if toml.is_file() else set()
            if not toml.is_file():
                return f"no sidecar {toml}"
        return None if ann in ids[date, name] else f"{name} has no annotation {ann}"

    for page in pages:
        text = page.read_text()
        date = re.search(r'set rec = config\.base_url ~ "/mculink-recordings/([^/"]+)/"', text)
        if not date:
            raise SystemExit(f"{page}: no recordings date (set rec = ...)")
        rec = r'"\{\{ rec \| safe \}\}([^"]+)\.tickwave"'
        views = dict(re.findall(r'<tickwave-view id="([^"]+)" src=' + rec, text))
        refs = re.findall(r'<tickwave-ref for="([^"]+)" annotation="([^"]+)"', text)
        insets = re.findall(r'<tickwave-inset src=' + rec + r' annotation="([^"]+)"', text)
        open_page = (r'/tickwave/open\.html\?src=%2Fmculink-recordings%2F([^%"]+)%2F([^%"]+)\.tickwave'
                     r'&amp;annotation=([^"&]+)"')
        opens = [(m[1], m[2], unquote(m[3])) for m in re.finditer(open_page, text)]
        if not (refs or insets or opens):
            raise SystemExit(f"{page}: no references, insets or links to a recording found; "
                             "the patterns here need updating")
        problems = []
        for to, ann in refs:
            if to not in views:
                problems.append(f"reference to {ann} names view {to}, not on the page")
            elif why := has(date[1], views[to], ann):
                problems.append(why)
        for name, ann in insets:
            if why := has(date[1], name, ann):
                problems.append(f"inset: {why}")
        for when, name, ann in opens:
            if why := has(when, name, ann):
                problems.append(f"link: {why}")
        if problems:
            raise SystemExit(f"{page}:\n  " + "\n  ".join(problems))
        print(f"{page}: {len(refs)} references to {len(views)} recordings, {len(insets)} insets and "
              f"{len(opens)} links to the Open page, all present")
    return 0


if __name__ == "__main__":
    sys.exit(main())

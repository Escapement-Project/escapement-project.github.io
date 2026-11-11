"""Check Verge's page's Wires section against the recordings it cites: every <tickwave-ref> names a
<tickwave-view> on the page, and an annotation that recording's sidecar has, its hand-written ids
and each included generator file's as <source>/<id>, as mculink-bench's page checks its own.

python3 .github/wire-refs.py templates/verge.html ../mculink-recordings
"""

import json
import re
import sys
import tomllib
from pathlib import Path


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
    page, recordings = Path(sys.argv[1]), Path(sys.argv[2])
    text = page.read_text()
    date = re.search(r'set rec = config\.base_url ~ "/mculink-recordings/([^/"]+)/"', text)
    if not date:
        raise SystemExit(f"{page}: no recordings date (set rec = ...)")
    views = dict(re.findall(r'<tickwave-view id="([^"]+)" src="\{\{ rec \| safe \}\}([^"]+)\.tickwave"', text))
    refs = re.findall(r'<tickwave-ref for="([^"]+)" annotation="([^"]+)"', text)
    if not views or not refs:
        raise SystemExit(f"{page}: no views or references found; the patterns here need updating")
    problems, ids = [], {}
    for to, ann in refs:
        if to not in views:
            problems.append(f"reference to {ann} names view {to}, not on the page")
            continue
        name = views[to]
        if name not in ids:
            toml = recordings / date[1] / f"{name}.annotations.toml"
            if not toml.is_file():
                problems.append(f"no sidecar {toml}")
                ids[name] = set()
                continue
            ids[name] = sidecar_ids(toml)
        if ids[name] and ann not in ids[name]:
            problems.append(f"{name} has no annotation {ann}")
    if problems:
        raise SystemExit(f"{page}:\n  " + "\n  ".join(problems))
    print(f"{page}: {len(refs)} references to {len(views)} recordings, all present")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Copy mculink-bench's measurements page into the site, loading the site's own fonts.

    python3 .github/measurements.py PAGE SITE

PAGE is mculink-bench's page/out, SITE this repository. The page loads its fonts from fonts/ beside
it, copies of the site's static/fonts/. Pointed at the site's, a reader who opens both pages
downloads each font once.
"""
import filecmp
import pathlib
import re
import shutil
import sys

page, site = map(pathlib.Path, sys.argv[1:])
# Served at /verge/measurements/, so the site's fonts are two folders up.
WHERE = pathlib.PurePosixPath("verge/measurements")
dest = site / "static" / WHERE
if dest.exists() or dest.is_symlink():
    # Locally this is the link to mculink-bench: writing through it would change that repository.
    sys.exit(f"{dest} exists; this copies into a fresh checkout")

html = (page / "index.html").read_text()
names = re.findall(r'url\("fonts/([\w.-]+)"\)', html)
if not names or len(names) != html.count("fonts/"):
    sys.exit('the page loads its fonts other than as url("fonts/NAME"); update this script')
for name in names:
    ours = site / "static" / "fonts" / name
    if not ours.is_file():
        sys.exit(f"the page loads fonts/{name}, which the site does not have")
    if not filecmp.cmp(ours, page / "fonts" / name, shallow=False):
        # The page then draws with the site's newer font; its own copy is due an update.
        print(f"::warning::the page's fonts/{name} differs from the site's")

up = "../" * len(WHERE.parts)
shutil.copytree(page, dest, ignore=shutil.ignore_patterns("fonts"))
(dest / "index.html").write_text(html.replace('url("fonts/', f'url("{up}fonts/'))
print(f"copied the page, loading {len(names)} fonts from the site's")

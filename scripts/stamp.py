#!/usr/bin/env python3
"""
Stamp every local stylesheet/script reference in index.html with a short
content hash (css/style.css?v=1a2b3c4d), so a browser that cached the old
CSS or JS can never pair it with new HTML. GitHub Pages caches assets for
10 minutes; without this a visitor who reloads right after a deploy sees
the new page with the old styles. Run after any change to css/ or js/;
scripts/ingest.py calls it automatically.
"""
import hashlib, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"

def stamp_file(html_path: Path):
    """Hash every local css/js link in one HTML file; paths resolve relative to that file."""
    html = html_path.read_text()
    def sub(m):
        attr, path = m.group(1), m.group(2)
        f = (html_path.parent / path).resolve()
        if not f.exists() or ROOT not in f.parents:
            return m.group(0)
        v = hashlib.md5(f.read_bytes()).hexdigest()[:8]
        return f'{attr}="{path}?v={v}"'
    new = re.sub(r'\b(href|src)="((?:\.\./)?(?:css/|js/)?[\w./-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"', sub, html)
    if new != html:
        html_path.write_text(new)
    return len(re.findall(r'\.(?:css|js)\?v=[0-9a-f]+', new))

PAGES = [HTML, ROOT / "collection" / "index.html"]

def stamp():
    for page in PAGES:
        if page.exists():
            print(f"stamped {stamp_file(page)} assets in {page.relative_to(ROOT)}")

if __name__ == "__main__":
    stamp()

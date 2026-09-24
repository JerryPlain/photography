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

def stamp():
    html = HTML.read_text()
    def sub(m):
        attr, path = m.group(1), m.group(2)
        f = ROOT / path
        if not f.exists():
            return m.group(0)
        v = hashlib.md5(f.read_bytes()).hexdigest()[:8]
        return f'{attr}="{path}?v={v}"'
    new = re.sub(r'\b(href|src)="((?:css|js)/[^"?]+)(?:\?v=[0-9a-f]+)?"', sub, html)
    if new != html:
        HTML.write_text(new)
    stamped = re.findall(r'(?:css|js)/[^"?]+\?v=[0-9a-f]+', new)
    print(f"stamped {len(stamped)} assets in index.html")

if __name__ == "__main__":
    stamp()

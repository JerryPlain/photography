#!/usr/bin/env python3
"""
Ingest photos from the local Desktop library into the site.

    python3 scripts/ingest.py [SOURCE_DIR] [--force]

SOURCE_DIR defaults to ~/Desktop/photography and is expected to look like:

    01-City/Berlin, Germany/DSCF1518.jpg      -> title "Berlin", location "Germany"
    04-Car/Porsche 911 GTS/DSCF2940.jpg        -> title "Porsche 911 GTS"
    02-Me/IMG_4342.jpeg                        -> untitled plate in series "Me"

Only series folders that actually contain photos are published. For every
photo a 2000px "full" JPEG and a 1000px thumbnail are written under
photos/<series-slug>/ and photos/<series-slug>/thumbs/, named by a content
hash so re-running is incremental and stable. Files that no longer exist in
the source are pruned. Finally js/data.js is regenerated.
Uses only macOS `sips`, no third-party dependencies.
"""
import hashlib, json, os, re, struct, subprocess, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARGS = [a for a in sys.argv[1:] if not a.startswith("-")]
FORCE = "--force" in sys.argv          # re-encode even if the output is current
SRC = Path(ARGS[0]).expanduser() if ARGS else Path("~/Desktop/photography").expanduser()
OUT = ROOT / "photos"
DATA = ROOT / "js" / "data.js"

FULL_MAX, FULL_Q = 2000, 72
THUMB_MAX, THUMB_Q = 1000, 70
EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".tif", ".tiff"}

# ---------------------------------------------------------------- helpers

def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s or "untitled"

def series_title(folder: str) -> str:
    name = re.sub(r"^\d+-", "", folder).replace("-", " ")
    return re.sub(r"\band\b", "&", name)

# Camera/export filenames carry no meaning; anything else is treated as the
# photo's own label (e.g. 02-Me/Europe/Croatia.jpg -> "Croatia", in Europe).
NOT_A_NAME = {"fullsizerender", "image", "photo", "untitled", "screenshot"}

def stem_label(p: Path):
    """(title, label) from a meaningful filename, or ("", "") for camera names.
    'Rainbow, Opening Day.jpeg' -> ("Rainbow", "Opening Day"); 'Rainbow@TUM.jpeg' -> ("Rainbow", "TUM");
    'Croatia.jpg' -> ("Croatia", "")."""
    stem = unicodedata.normalize("NFC", p.stem.strip())
    if not stem or not re.match(r"^[A-Za-z\u00C0-\u024F]", stem):
        return "", ""                           # hashes, UUIDs, 0123.jpg
    if not re.fullmatch(r"[A-Za-z\u00C0-\u024F0-9'\u2019&.,@\- ]+", stem):
        return "", ""                           # underscores etc: IMG_6134
    if re.search(r"\d{3}", stem):
        return "", ""                           # DSCF1518, dates, counters
    if stem.lower() in NOT_A_NAME:
        return "", ""
    # "Title, Label" or "Title@Label" (Rainbow@TUM -> "Rainbow" / "TUM")
    m = re.match(r"^(.*?)\s*[,@]\s*(.*)$", stem)
    title, label = (m.group(1), m.group(2)) if m else (stem, "")
    return title.strip(), label.strip()

def file_hash(p: Path) -> str:
    h = hashlib.md5()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:8]

def jpeg_info(p: Path):
    """Return (raw_w, raw_h, orientation, datetime_original, meta) for a JPEG.
    meta holds camera/lens/exposure fields when the file carries EXIF."""
    w = h = None; orient = 1; dt = None; meta = {}
    with open(p, "rb") as f:
        data = f.read()
    if data[:2] != b"\xff\xd8":
        return None
    i = 2
    while i < len(data) - 4:
        if data[i] != 0xFF:
            i += 1; continue
        marker = data[i + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2; continue
        seglen = struct.unpack(">H", data[i + 2:i + 4])[0]
        seg = data[i + 4:i + 2 + seglen]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", seg[1:5])
            break
        if marker == 0xE1 and seg[:6] == b"Exif\x00\x00":
            tiff = seg[6:]
            try:
                end = "<" if tiff[:2] == b"II" else ">"
                SIZES = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8}
                def read_ifd(off):
                    n = struct.unpack(end + "H", tiff[off:off + 2])[0]
                    out = {}
                    for k in range(n):
                        e = tiff[off + 2 + 12 * k: off + 14 + 12 * k]
                        tag, typ, cnt = struct.unpack(end + "HHI", e[:8])
                        out[tag] = (typ, cnt, e[8:12])
                    return out
                def value(entry):
                    typ, cnt, raw = entry
                    size = SIZES.get(typ, 1) * cnt
                    buf = raw[:size] if size <= 4 else tiff[struct.unpack(end + "I", raw)[0]:][:size]
                    if typ == 2:
                        return buf.split(b"\x00", 1)[0].decode("ascii", "ignore").strip()
                    if typ == 3:
                        return struct.unpack(end + "H", buf[:2])[0]
                    if typ == 4:
                        return struct.unpack(end + "I", buf[:4])[0]
                    if typ in (5, 10):
                        n_, d_ = struct.unpack(end + ("II" if typ == 5 else "ii"), buf[:8])
                        return n_ / d_ if d_ else 0
                    return None
                ifd0 = struct.unpack(end + "I", tiff[4:8])[0]
                ifd = read_ifd(ifd0)
                if 0x0112 in ifd:
                    orient = value(ifd[0x0112]) or 1
                for tag, key in ((0x010F, "make"), (0x0110, "model")):
                    if tag in ifd:
                        meta[key] = value(ifd[tag])
                if 0x8769 in ifd:
                    sub = read_ifd(value(ifd[0x8769]))
                    for tag, key in ((0x9003, "dt"), (0x829A, "exposure"), (0x829D, "fnumber"),
                                     (0x8827, "iso"), (0x920A, "focal"), (0xA405, "focal35"),
                                     (0xA434, "lens")):
                        if tag in sub:
                            meta[key] = value(sub[tag])
                    dt = meta.get("dt")
            except Exception:
                pass
        i += 2 + seglen
    if w is None:
        return None
    return w, h, orient, dt, meta

def camera_line(meta):
    """'Fujifilm X-T30 II · 23 mm · ƒ/2 · 1/500 s · ISO 160' from EXIF, or ''."""
    if not meta:
        return "", ""
    make = (meta.get("make") or "").strip()
    model = (meta.get("model") or "").strip()
    if make.upper() == "FUJIFILM": make = "Fujifilm"
    if make.upper() == "APPLE": make = ""            # "iPhone 15 Pro" says it already
    camera = model if not make or model.lower().startswith(make.lower()) else f"{make} {model}"
    parts = []
    # phones quote the 35 mm-equivalent focal length; real cameras their lens
    phone = not make or "iphone" in model.lower()
    f = (meta.get("focal35") if phone else None) or meta.get("focal")
    if f: parts.append(f"{f:g} mm")
    n = meta.get("fnumber")
    if n: parts.append(f"ƒ/{n:g}")
    t = meta.get("exposure")
    if t:
        parts.append(f"1/{round(1 / t)} s" if 0 < t < 1 else f"{t:g} s")
    iso = meta.get("iso")
    if iso: parts.append(f"ISO {iso}")
    return camera.strip(), " · ".join(parts)

def created_date(p: Path) -> str:
    """kMDItemContentCreationDate via Spotlight; exports from Photos keep the capture date there."""
    try:
        out = subprocess.run(["mdls", "-raw", "-name", "kMDItemContentCreationDate", str(p)],
                             capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception:
        return ""
    m = re.match(r"(\d{4}-\d{2}-\d{2})", out)
    return m.group(1) if m else ""

def exif_date(meta):
    dt = (meta or {}).get("dt") or ""
    m = re.match(r"(\d{4}):(\d{2}):(\d{2})", dt)
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else ""

def displayed_dims(p: Path):
    info = jpeg_info(p)
    if not info:
        return None
    w, h, o = info[0], info[1], info[2]
    return (h, w) if o in (5, 6, 7, 8) else (w, h)

def pixel_dims(p: Path):
    """(width, height) for any format sips can read; (0, 0) if it cannot."""
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(p)],
                         capture_output=True, text=True).stdout
    w = h = 0
    for line in out.splitlines():
        if "pixelWidth:" in line:
            w = int(line.split(":")[1])
        elif "pixelHeight:" in line:
            h = int(line.split(":")[1])
    return w, h

def sips(src: Path, dst: Path, max_px: int, q: int):
    """Convert to JPEG, shrinking only when the source is bigger than max_px.
    sips --resampleHeightWidthMax happily UPSCALES a small photo, which just
    wastes bytes and softens it, so the flag is passed only when it shrinks."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    args = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(q)]
    w, h = pixel_dims(src)
    if max(w, h) > max_px:
        args += ["--resampleHeightWidthMax", str(max_px)]
    args += [str(src), "--out", str(dst)]
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# ---------------------------------------------------------------- scan

def scan():
    series = []
    for folder in sorted(SRC.iterdir()):
        if not folder.is_dir() or not re.match(r"^\d+-", folder.name):
            continue
        slug = slugify(re.sub(r"^\d+-", "", folder.name))
        groups = {}  # (title, location) -> [paths]
        for p in sorted(folder.rglob("*")):
            if not p.is_file() or p.suffix.lower() not in EXTS or p.name.startswith("."):
                continue
            # folders between the series and the file: the deepest one titles the
            # photo, the one above it becomes the small label, and an explicit
            # "Title, Label" folder beats both (Asia/Japan -> Japan / ASIA).
            dirs = [unicodedata.normalize("NFC", d) for d in p.relative_to(folder).parts[:-1]]
            if not dirs:
                key = ("", "")
            elif "," in dirs[-1]:
                title, _, loc = dirs[-1].partition(",")
                key = (title.strip(), loc.strip())
            else:
                key = (dirs[-1].strip(), dirs[-2].strip() if len(dirs) > 1 else "")
            groups.setdefault(key, []).append(p)
        # a meaningful filename becomes the photo's title; the folder then reads
        # as its context, e.g. Europe/Croatia.jpg -> "Croatia" / "EUROPE"
        labelled = {k: {p: stem_label(p) for p in v} for k, v in groups.items()}
        if not groups:
            continue

        # order groups by country then place; untitled plates keep source order
        def gkey(k):
            title, loc = k
            return (loc or title).lower(), title.lower()
        photos = []
        for key in sorted(groups, key=gkey):
            files = groups[key]
            def fkey(p):
                info = jpeg_info(p) if p.suffix.lower() in (".jpg", ".jpeg") else None
                when = (info[3] if info and info[3] else "").replace(":", "-")[:10] or created_date(p)
                return (when or "9999", p.name.lower())
            for p in sorted(files, key=fkey):
                title, label = labelled[key][p]
                if title:
                    photos.append((title, label or key[1] or key[0], p, key[0]))
                else:
                    photos.append((key[0], key[1], p, key[0]))
        series.append({"slug": slug, "title": series_title(folder.name), "photos": photos})
    return series

# ---------------------------------------------------------------- build

def main():
    if not SRC.exists():
        sys.exit(f"source not found: {SRC}")
    series = scan()
    manifest = []
    keep = set()
    for s in series:
        entries = []
        for title, location, src, group in s["photos"]:
            base = f"{slugify(title) if title else s['slug']}-{file_hash(src)}.jpg"
            full = OUT / s["slug"] / base
            thumb = OUT / s["slug"] / "thumbs" / base
            for dst, mx, q in ((full, FULL_MAX, FULL_Q), (thumb, THUMB_MAX, THUMB_Q)):
                if FORCE or not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
                    sips(src, dst, mx, q)
                    print(f"  {dst.relative_to(ROOT)}")
            keep.add(full); keep.add(thumb)
            dims = displayed_dims(full)
            if not dims:
                dims = (3, 2)
            # sanity: orientation must survive the resize
            sd = displayed_dims(src) if src.suffix.lower() in (".jpg", ".jpeg") else None
            if sd and (sd[0] > sd[1]) != (dims[0] > dims[1]):
                print(f"  !! orientation mismatch: {src}")
            info = jpeg_info(src) if src.suffix.lower() in (".jpg", ".jpeg") else None
            meta = info[4] if info else {}
            camera, settings = camera_line(meta)
            entry = {"file": f"{s['slug']}/{base}", "src": src.stem, "title": title,
                     "location": location, "w": dims[0], "h": dims[1]}
            when = exif_date(meta) or created_date(src)
            if when: entry["date"] = when
            if group and group != title: entry["group"] = group   # the folder a renamed file lives in
            if camera: entry["camera"] = camera
            if settings: entry["exif"] = settings
            entries.append(entry)
        manifest.append({"slug": s["slug"], "title": s["title"], "photos": entries})
        print(f"{s['slug']}: {len(entries)} photos")

    # prune
    if OUT.exists():
        for p in OUT.rglob("*.jpg"):
            if p not in keep:
                p.unlink(); print(f"  pruned {p.relative_to(ROOT)}")
        for d in sorted(OUT.rglob("*"), reverse=True):
            if d.is_dir() and not any(d.iterdir()):
                d.rmdir()

    # write data.js
    lines = ["// ============================================================",
             "// GENERATED by scripts/ingest.py — do not edit by hand.",
             "// Series order & titles come from the folder names on disk;",
             "// taglines and site text live in js/site.js.",
             "// ============================================================",
             "", "const SERIES = ["]
    for s in manifest:
        lines.append("  {")
        lines.append(f"    slug: {json.dumps(s['slug'])},")
        lines.append(f"    title: {json.dumps(s['title'], ensure_ascii=False)},")
        lines.append("    photos: [")
        for e in s["photos"]:
            lines.append("      " + json.dumps(e, ensure_ascii=False, separators=(", ", ": ")) + ",")
        lines.append("    ],")
        lines.append("  },")
    lines.append("];")
    DATA.write_text("\n".join(lines) + "\n")
    total = sum(len(s["photos"]) for s in manifest)
    print(f"\nwrote {DATA.relative_to(ROOT)}: {len(manifest)} series, {total} photos")
    # version-stamp the asset links so browsers never mix old CSS/JS with new HTML
    sys.path.insert(0, str(ROOT / "scripts"))
    import stamp; stamp.stamp()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Build js/map.js: a compact Mercator outline of the world from Lisbon to Japan
plus projected coordinates for every place that appears in the library.

    python3 scripts/build_map.py NE_DIR

NE_DIR holds Natural Earth (public domain) GeoJSON from
github.com/nvkelso/natural-earth-vector/tree/master/geojson:
ne_50m_land, ne_50m_lakes and ne_50m_admin_0_boundary_lines_land.
Everything is clipped to each plate's window, simplified with Douglas-Peucker
and rounded. Country and sea names are placed by hand in LABELS below.
Add a place here when a new city shows up in js/data.js and re-run.
"""
import json, math, sys, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# two plates, like an atlas spread: Europe large, Southeast Asia & Japan as a companion
PLATES = [
    {"name": "Europe",                  "bbox": (-12.0, 33.5, 32.0, 60.5), "w": 1100.0},
    {"name": "Southeast Asia & Japan",  "bbox": (94.0, -7.0, 146.0, 44.0), "w": 800.0, "lat_side": "right"},
]
TOL = 1.0                                             # simplify tolerance (svg units)

# hand-placed names, atlas style: (text, lon, lat, rotation°); "|" breaks a line
LABELS = {
    "Europe": {
        "countries": [
            ("Spain", -3.6, 39.9, 0), ("Portugal", -7.8, 41.0, -80), ("France", 2.4, 46.9, 0),
            ("Germany", 9.6, 51.7, 0), ("Italy", 16.6, 40.35, 45), ("United|Kingdom", -1.9, 53.2, 0),
            ("Ireland", -8.0, 53.1, 0), ("Netherlands", 5.7, 52.75, 0), ("Belgium", 4.5, 50.45, 0),
            ("Switzerland", 7.9, 46.75, 0), ("Austria", 14.6, 47.4, 0), ("Czechia", 15.3, 49.85, 0),
            ("Poland", 19.3, 52.2, 0), ("Denmark", 9.1, 56.05, 0), ("Sweden", 15.0, 59.4, 0),
            ("Norway", 8.6, 59.9, 0), ("Slovakia", 19.6, 48.75, 0), ("Hungary", 19.3, 47.05, 0),
            ("Croatia", 16.5, 45.2, 0), ("Bosnia", 17.8, 44.15, 0), ("Serbia", 20.9, 43.9, 0),
            ("Romania", 24.9, 45.9, 0), ("Bulgaria", 25.3, 42.75, 0), ("Greece", 21.8, 39.5, 0),
            ("Türkiye", 30.0, 39.3, 0), ("Ukraine", 28.5, 49.3, 0), ("Belarus", 27.6, 53.5, 0),
            ("Lithuania", 23.8, 55.35, 0), ("Latvia", 25.6, 56.85, 0), ("Estonia", 25.8, 58.75, 0),
            ("Algeria", 3.0, 35.0, 0), ("Tunisia", 9.5, 35.1, 0), ("Morocco", -5.3, 34.7, 0),
        ],
        "seas": [
            ("Atlantic|Ocean", -8.0, 47.4, 0), ("Bay of|Biscay", -4.6, 45.4, 0), ("North Sea", 3.4, 56.2, 0),
            ("Baltic Sea", 18.7, 55.4, 0), ("Mediterranean Sea", 5.6, 38.4, 0), ("Tyrrhenian|Sea", 12.0, 39.9, 0),
            ("Adriatic Sea", 15.0, 43.45, 36), ("Ionian Sea", 18.6, 37.4, 0), ("Aegean|Sea", 25.0, 39.4, 0),
            ("Black|Sea", 30.7, 43.2, 0),
        ],
    },
    "Southeast Asia & Japan": {
        "countries": [
            ("China", 106.5, 31.0, 0), ("Japan", 139.0, 37.6, -40), ("South|Korea", 128.1, 36.3, 0),
            ("North|Korea", 126.9, 40.0, 0), ("Taiwan", 121.0, 23.7, -70), ("Vietnam", 106.3, 16.3, -55),
            ("Laos", 102.7, 19.6, 0), ("Thailand", 101.0, 16.4, 0), ("Cambodia", 105.3, 12.25, 0),
            ("Myanmar", 96.9, 22.6, -90), ("Malaysia", 115.0, 3.0, 0), ("Indonesia", 114.6, -1.2, 0),
            ("Philippines", 122.6, 12.3, -60),
        ],
        "seas": [
            ("South|China Sea", 114.2, 13.6, 0), ("East|China Sea", 126.0, 29.3, 0), ("Yellow|Sea", 123.5, 33.3, 0),
            ("Sea of|Japan", 134.4, 40.4, 0), ("Philippine Sea", 133.0, 21.0, 0), ("Pacific|Ocean", 140.6, 27.5, 0),
            ("Andaman Sea", 96.0, 11.5, -90), ("Gulf of|Thailand", 102.1, 9.75, 0), ("Java Sea", 115.6, -4.9, 0),
            ("Celebes|Sea", 122.0, 3.4, 0), ("Sulu Sea", 120.2, 8.6, 0),
        ],
    },
}

PLACES = {  # name: (lon, lat)
    "Bangkok": (100.50, 13.75), "Barcelona": (2.17, 41.39), "Berlin": (13.40, 52.52),
    "Dubrovnik": (18.09, 42.65), "Florence": (11.26, 43.77), "Frankfurt": (8.68, 50.11),
    "Freising": (11.75, 48.40), "Füssen": (10.70, 47.57), "Schwangau": (10.74, 47.58), "Kufstein": (12.17, 47.58), "Sintra": (-9.39, 38.8), "Heidelberg": (8.69, 49.40),
    "Lindau": (9.69, 47.55), "Lisbon": (-9.14, 38.72), "Ljubljana": (14.51, 46.06),
    "Manarola": (9.73, 44.11), "Mannheim": (8.47, 49.49), "Munich": (11.58, 48.14),
    "Naxos": (25.38, 37.10), "Nürnberg": (11.08, 49.45), "Osaka": (135.50, 34.69),
    "Paris": (2.35, 48.86), "Phuket": (98.39, 7.88), "Pisa": (10.40, 43.72),
    "Regensburg": (12.10, 49.01), "Santorini": (25.43, 36.39), "Stuttgart": (9.18, 48.78),
    "Tossa de Mar": (2.93, 41.72), "Valletta": (14.51, 35.90), "Gozo": (14.24, 36.04), "Vatican": (12.45, 41.90),
    "Bodensee": (9.40, 47.63), "Eibsee": (10.98, 47.46), "Wallberg": (11.76, 47.66),
    "Tokyo": (139.69, 35.69), "Singapore": (103.82, 1.35), "Rome": (12.50, 41.90),
    "Milan": (9.19, 45.46), "Hong Kong": (114.17, 22.32), "Shanghai": (121.47, 31.23), "Qingdao": (120.38, 36.07),
    "Beijing": (116.40, 39.90), "Seoul": (126.98, 37.57), "Kyoto": (135.77, 35.01),
    "Vienna": (16.37, 48.21), "Prague": (14.42, 50.08), "Amsterdam": (4.90, 52.37),
    "London": (-0.13, 51.51), "Zurich": (8.54, 47.38), "Salzburg": (13.05, 47.81),
    "Innsbruck": (11.40, 47.27), "Venice": (12.32, 45.44), "Athens": (23.73, 37.98),
    "Istanbul": (28.98, 41.01), "Copenhagen": (12.57, 55.68), "Hamburg": (9.99, 53.55),
    "Cologne": (6.96, 50.94), "Dresden": (13.74, 51.05), "Bratislava": (17.11, 48.15),
    "Budapest": (19.04, 47.50), "Zagreb": (15.98, 45.81), "Split": (16.44, 43.51),
    "Madrid": (-3.70, 40.42), "Porto": (-8.61, 41.15), "Seville": (-5.98, 37.39),
    "Nice": (7.26, 43.71), "Lyon": (4.83, 45.76), "Brussels": (4.35, 50.85),
    "Luxembourg": (6.13, 49.61), "Strasbourg": (7.75, 48.57), "Chiang Mai": (98.99, 18.79),
    "Kuala Lumpur": (101.69, 3.14), "Bali": (115.19, -8.41), "Taipei": (121.57, 25.03),
    "Garmisch-Partenkirchen": (11.10, 47.49), "Zugspitze": (10.98, 47.42),
    "Neuschwanstein": (10.75, 47.56), "Chiemsee": (12.45, 47.87), "Königssee": (12.97, 47.55),
    "Tegernsee": (11.75, 47.71), "Starnberger See": (11.30, 47.90),
}

BIG = {"Spain", "France", "Germany", "Italy", "Poland", "Ukraine", "Romania", "Türkiye", "China", "Thailand", "Indonesia", "Myanmar"}
SMALL = {"Netherlands", "Belgium", "Switzerland", "Czechia", "Slovakia", "Croatia", "Bosnia", "Serbia", "Lithuania", "Latvia",
         "Estonia", "Denmark", "Austria", "Hungary", "Laos", "Cambodia", "Taiwan", "Tunisia", "Ireland", "North|Korea", "South|Korea"}

def merc(lat): return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))

class Plate:
    def __init__(self, spec):
        self.name = spec["name"]; self.lon0, self.lat0, self.lon1, self.lat1 = spec["bbox"]
        self.w = spec["w"]; self.lat_side = spec.get("lat_side", "left")   # which edge carries the latitude labels
        self.k = self.w / math.radians(self.lon1 - self.lon0)
        self.top = merc(self.lat1)
        self.h = (self.top - merc(self.lat0)) * self.k
    def project(self, lon, lat):
        return ((lon - self.lon0) * math.pi / 180 * self.k, (self.top - merc(lat)) * self.k)
    def contains(self, lon, lat):
        return self.lon0 <= lon <= self.lon1 and self.lat0 <= lat <= self.lat1

def clip(ring, pl):
    """Sutherland-Hodgman against the plate's lon/lat window."""
    LON0, LON1, LAT0, LAT1 = pl.lon0, pl.lon1, pl.lat0, pl.lat1
    def cut(pts, inside, intersect):
        out = []
        for i, cur in enumerate(pts):
            prev = pts[i - 1]
            if inside(cur):
                if not inside(prev): out.append(intersect(prev, cur))
                out.append(cur)
            elif inside(prev): out.append(intersect(prev, cur))
        return out
    def x_at(p, q, x):
        t = (x - p[0]) / (q[0] - p[0]); return (x, p[1] + t * (q[1] - p[1]))
    def y_at(p, q, y):
        t = (y - p[1]) / (q[1] - p[1]); return (p[0] + t * (q[0] - p[0]), y)
    pts = ring
    for edge in (
        (lambda p: p[0] >= LON0, lambda p, q: x_at(p, q, LON0)),
        (lambda p: p[0] <= LON1, lambda p, q: x_at(p, q, LON1)),
        (lambda p: p[1] >= LAT0, lambda p, q: y_at(p, q, LAT0)),
        (lambda p: p[1] <= LAT1, lambda p, q: y_at(p, q, LAT1)),
    ):
        if not pts: return []
        pts = cut(pts, *edge)
    return pts

def simplify(pts, tol):
    if len(pts) < 3: return pts
    def dist(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx - ax, by - ay
        if dx == dy == 0: return math.hypot(px - ax, py - ay)
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - (ax + t * dx), py - (ay + t * dy))
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1: continue
        best, bi = 0, -1
        for k in range(i + 1, j):
            d = dist(pts[k], pts[i], pts[j])
            if d > best: best, bi = d, k
        if best > tol:
            keep[bi] = True; stack.append((i, bi)); stack.append((bi, j))
    return [p for p, k in zip(pts, keep) if k]

def clip_line(line, pl):
    """Cut a polyline to the plate's window (Liang-Barsky per segment); returns the runs inside."""
    runs, cur = [], []
    for (x0, y0), (x1, y1) in zip(line, line[1:]):
        t0, t1, dx, dy = 0.0, 1.0, x1 - x0, y1 - y0
        ok = True
        for p, q in ((-dx, x0 - pl.lon0), (dx, pl.lon1 - x0), (-dy, y0 - pl.lat0), (dy, pl.lat1 - y0)):
            if p == 0:
                if q < 0: ok = False; break
            else:
                t = q / p
                if p < 0: t0 = max(t0, t)
                else: t1 = min(t1, t)
        if not ok or t0 > t1:
            if cur: runs.append(cur); cur = []
            continue
        a = (x0 + t0 * dx, y0 + t0 * dy); b = (x0 + t1 * dx, y0 + t1 * dy)
        if not cur: cur = [a]
        cur.append(b)
        if t1 < 1: runs.append(cur); cur = []
    if cur: runs.append(cur)
    return runs

def to_d(lines, close):
    d = "".join("M" + " ".join(f"{x:.1f},{y:.1f}" for x, y in pr) + ("Z" if close else "") for pr in lines)
    return re.sub(r"\.0(?=[, MZ]|$)", "", d)

def polys(pl, gj, keep=lambda props: True):
    rings = []
    for feat in gj["features"]:
        if not keep(feat["properties"]): continue
        g = feat["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            for ring in poly:                       # outer + holes, all drawn (evenodd)
                pts = clip([(x, y) for x, y in ring], pl)
                if len(pts) < 4: continue
                pr = simplify([pl.project(x, y) for x, y in pts], TOL)
                xs = [p[0] for p in pr]; ys = [p[1] for p in pr]
                if len(pr) < 4 or (max(xs) - min(xs) < 2.5 and max(ys) - min(ys) < 2.5):
                    continue                        # specks
                rings.append(pr)
    return to_d(rings, True)

def lines(pl, gj, tol):
    out = []
    for feat in gj["features"]:
        g = feat["geometry"]
        for line in (g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]):
            for run in clip_line([tuple(p) for p in line], pl):
                pr = simplify([pl.project(x, y) for x, y in run], tol)
                if len(pr) >= 2: out.append(pr)
    return to_d(out, False)

def build(pl, ne):
    places = {n: [round(v, 1) for v in pl.project(*ll)] for n, ll in PLACES.items() if pl.contains(*ll)}
    labels = []
    def tier(kind, text):                       # C/c/k: large/normal/small country; O/s/g: ocean/sea/gulf
        if kind == "c": return "C" if text in BIG else "k" if text in SMALL else "c"
        return "O" if "Ocean" in text else "g" if text.split("|")[0] in ("Bay of", "Gulf of") else "s"
    for kind, items in (("c", LABELS[pl.name]["countries"]), ("s", LABELS[pl.name]["seas"])):
        for text, lon, lat, rot in items:
            kind_ = tier(kind, text)
            assert pl.contains(lon, lat), (pl.name, text)
            x, y = pl.project(lon, lat)
            labels.append([kind_, text, round(x, 1), round(y, 1), rot])
    return {"name": pl.name, "w": round(pl.w), "h": round(pl.h), "bbox": [pl.lon0, pl.lat0, pl.lon1, pl.lat1], "latSide": pl.lat_side,
            "land": polys(pl, ne["land"]),
            "lakes": polys(pl, ne["lakes"], lambda p: p.get("featurecla") != "Reservoir"),
            "borders": lines(pl, ne["borders"], 0.8),
            "labels": labels, "places": places}

def main():
    src = Path(sys.argv[1]).expanduser()
    ne = {k: json.load(open(src / f"ne_50m_{f}.geojson")) for k, f in
          (("land", "land"), ("lakes", "lakes"), ("borders", "admin_0_boundary_lines_land"))}
    plates = [build(Plate(spec), ne) for spec in PLATES]
    js = lambda v: json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    body = ",\n".join(
        f'  {{ name: {json.dumps(p["name"])}, w: {p["w"]}, h: {p["h"]}, bbox: {p["bbox"]}, latSide: "{p["latSide"]}",\n'
        f'    land: {json.dumps(p["land"])},\n'
        f'    lakes: {json.dumps(p["lakes"])},\n'
        f'    borders: {json.dumps(p["borders"])},\n'
        f'    labels: {js(p["labels"])},\n'
        f'    places: {js(p["places"])} }}'
        for p in plates)
    (ROOT / "js" / "map.js").write_text(
        "// GENERATED by scripts/build_map.py from Natural Earth 50m land, lakes and borders — do not edit.\n"
        f"const MAP = {{ plates: [\n{body}\n] }};\n")
    for p in plates:
        print(f'{p["name"]:24s} {p["w"]}x{p["h"]}  land {len(p["land"])//1024} KB  borders {len(p["borders"])//1024} KB'
              f'  lakes {len(p["lakes"])//1024} KB  {len(p["places"])} places')

if __name__ == "__main__":
    main()

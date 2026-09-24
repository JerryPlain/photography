#!/usr/bin/env python3
"""
Build js/map.js: a compact Mercator outline of the world from Lisbon to Japan
plus projected coordinates for every place that appears in the library.

    python3 scripts/build_map.py NE_LAND.geojson

Land comes from Natural Earth (public domain), clipped to the window below,
simplified with Douglas-Peucker and rounded so the whole thing is ~100 KB.
Add a place here when a new city shows up in js/data.js and re-run.
"""
import json, math, sys, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# two plates, like an atlas spread: Europe large, Southeast Asia & Japan as a companion
PLATES = [
    {"name": "Europe",                  "bbox": (-12.0, 33.5, 32.0, 60.5), "w": 1100.0},
    {"name": "Southeast Asia & Japan",  "bbox": (94.0, -7.0, 146.0, 44.0), "w": 800.0},
]
TOL = 1.0                                             # simplify tolerance (svg units)

PLACES = {  # name: (lon, lat)
    "Bangkok": (100.50, 13.75), "Barcelona": (2.17, 41.39), "Berlin": (13.40, 52.52),
    "Dubrovnik": (18.09, 42.65), "Florence": (11.26, 43.77), "Frankfurt": (8.68, 50.11),
    "Freising": (11.75, 48.40), "Füssen": (10.70, 47.57), "Heidelberg": (8.69, 49.40),
    "Lindau": (9.69, 47.55), "Lisbon": (-9.14, 38.72), "Ljubljana": (14.51, 46.06),
    "Manarola": (9.73, 44.11), "Mannheim": (8.47, 49.49), "Munich": (11.58, 48.14),
    "Naxos": (25.38, 37.10), "Nürnberg": (11.08, 49.45), "Osaka": (135.50, 34.69),
    "Paris": (2.35, 48.86), "Phuket": (98.39, 7.88), "Pisa": (10.40, 43.72),
    "Regensburg": (12.10, 49.01), "Santorini": (25.43, 36.39), "Stuttgart": (9.18, 48.78),
    "Tossa de Mar": (2.93, 41.72), "Valletta": (14.51, 35.90), "Vatican": (12.45, 41.90),
    "Bodensee": (9.40, 47.63), "Eibsee": (10.98, 47.46), "Wallberg": (11.76, 47.66),
    "Tokyo": (139.69, 35.69), "Singapore": (103.82, 1.35), "Rome": (12.50, 41.90),
    "Milan": (9.19, 45.46), "Hong Kong": (114.17, 22.32), "Shanghai": (121.47, 31.23),
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

def merc(lat): return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))

class Plate:
    def __init__(self, spec):
        self.name = spec["name"]; self.lon0, self.lat0, self.lon1, self.lat1 = spec["bbox"]
        self.w = spec["w"]
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

def build(pl, gj):
    rings = []
    for feat in gj["features"]:
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
    path = "".join("M" + " ".join(f"{x:.1f},{y:.1f}" for x, y in pr) + "Z" for pr in rings)
    path = path.replace(".0,", ",").replace(".0Z", "Z").replace(".0 ", " ")
    places = {n: [round(v, 1) for v in pl.project(*ll)] for n, ll in PLACES.items() if pl.contains(*ll)}
    return {"name": pl.name, "w": round(pl.w), "h": round(pl.h),
            "bbox": [pl.lon0, pl.lat0, pl.lon1, pl.lat1], "land": path, "places": places}

def main():
    gj = json.load(open(Path(sys.argv[1]).expanduser()))
    plates = [build(Plate(spec), gj) for spec in PLATES]
    body = ",\n".join(
        f'  {{ name: {json.dumps(p["name"])}, w: {p["w"]}, h: {p["h"]}, bbox: {p["bbox"]},\n'
        f'    land: {json.dumps(p["land"])},\n'
        f'    places: {json.dumps(p["places"], ensure_ascii=False, separators=(",", ":"))} }}'
        for p in plates)
    (ROOT / "js" / "map.js").write_text(
        "// GENERATED by scripts/build_map.py from Natural Earth 50m land — do not edit.\n"
        f"const MAP = {{ plates: [\n{body}\n] }};\n")
    for p in plates:
        print(f'{p["name"]:24s} {p["w"]}x{p["h"]}  {len(p["land"])//1024} KB  {len(p["places"])} places')

if __name__ == "__main__":
    main()

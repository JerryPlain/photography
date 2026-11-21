#!/usr/bin/env python3
"""
Build js/map.js: compact atlas plates of the world from Lisbon to Japan
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
# two plates, like an atlas spread: Europe large, Southeast Asia & Japan as a companion.
# Europe uses Lambert azimuthal equal-area centred on 52°N 10°E (the EU's EPSG:3035), so Scandinavia
# keeps its true size from Lisbon to Lofoten; `xy` is the window in km around that centre.
# Southeast Asia & Japan stays Mercator: near the equator it is all but undistorted.
PLATES = [
    {"name": "Europe", "proj": "laea", "center": (10.0, 52.0), "xy": (-1950, -1990, 1850, 2110),
     "ll": (-45.0, 22.0, 60.0, 80.0), "w": 1100.0},
    {"name": "Southeast Asia & Japan",  "bbox": (94.0, -7.0, 146.0, 44.0), "w": 800.0, "lat_side": "right"},
]
R_EARTH = 6371.0
TOL = 1.0                                             # simplify tolerance (svg units)

# hand-placed names, atlas style: (text, lon, lat, rotation°); "|" breaks a line
LABELS = {
    "Europe": {
        "countries": [
            ("Spain", -3.6, 39.9, 0), ("Portugal", -7.8, 41.0, -80), ("France", 2.4, 46.9, 0),
            ("Germany", 9.6, 51.7, 0), ("Italy", 16.6, 40.35, 45), ("United|Kingdom", -1.9, 53.2, 0),
            ("Ireland", -8.0, 53.1, 0), ("Netherlands", 5.7, 52.75, 0), ("Belgium", 4.5, 50.45, 0),
            ("Switzerland", 7.9, 46.75, 0), ("Austria", 14.6, 47.4, 0), ("Czechia", 15.3, 49.85, 0),
            ("Poland", 20.4, 51.9, 0), ("Denmark", 9.1, 56.05, 0), ("Sweden", 14.6, 61.6, 0),
            ("Norway", 9.0, 61.6, 0), ("Finland", 27.0, 62.5, 0), ("Iceland", -18.6, 64.9, 0), ("Russia", 34.5, 61.0, 0), ("Slovakia", 19.6, 48.75, 0), ("Hungary", 19.3, 47.05, 0),
            ("Croatia", 16.5, 45.2, 0), ("Bosnia", 17.8, 44.15, 0), ("Serbia", 20.9, 43.9, 0),
            ("Romania", 24.9, 45.9, 0), ("Bulgaria", 25.3, 42.75, 0), ("Greece", 21.8, 39.5, 0),
            ("Türkiye", 30.0, 39.3, 0), ("Ukraine", 28.5, 49.3, 0), ("Belarus", 27.6, 53.5, 0),
            ("Lithuania", 23.8, 55.35, 0), ("Latvia", 25.6, 56.85, 0), ("Estonia", 25.8, 58.75, 0),
            ("Algeria", 3.0, 35.0, 0), ("Tunisia", 9.5, 35.1, 0), ("Morocco", -5.3, 34.7, 0),
        ],
        "seas": [
            ("Atlantic|Ocean", -8.0, 47.4, 0), ("Bay of|Biscay", -4.6, 45.4, 0), ("North Sea", 3.4, 56.2, 0),
            ("Baltic Sea", 18.7, 55.4, 0), ("Norwegian|Sea", 3.0, 66.6, 0), ("Gulf of|Bothnia", 20.3, 62.9, 0), ("Mediterranean Sea", 5.6, 38.4, 0), ("Tyrrhenian|Sea", 12.0, 39.9, 0),
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
    "London": (-0.13, 51.51), "Zurich": (8.54, 47.38), "Interlaken": (7.86, 46.69), "Ringgenberg": (7.9, 46.7), "Mürren": (7.89, 46.56), "Lauterbrunnen": (7.91, 46.59), "Kleine Scheidegg": (7.96, 46.585), "Oslo": (10.75, 59.91), "Svolvær": (14.57, 68.23), "Tromsø": (18.96, 69.65), "Bergen": (5.32, 60.39), "Stockholm": (18.07, 59.33), "Helsinki": (24.94, 60.17), "Grindelwald": (8.04, 46.62), "Salzburg": (13.05, 47.81),
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
    """Mercator over a lon/lat window."""
    def __init__(self, spec):
        self.name = spec["name"]; self.lon0, self.lat0, self.lon1, self.lat1 = spec["bbox"]
        self.ll = spec["bbox"]
        self.w = spec["w"]; self.lat_side = spec.get("lat_side", "left")   # which edge carries the latitude labels
        self.k = self.w / math.radians(self.lon1 - self.lon0)
        self.top = merc(self.lat1)
        self.h = (self.top - merc(self.lat0)) * self.k
    def project(self, lon, lat):
        return ((lon - self.lon0) * math.pi / 180 * self.k, (self.top - merc(lat)) * self.k)
    def inverse(self, x, y):
        return (self.lon0 + math.degrees(x / self.k), math.degrees(2 * math.atan(math.exp(self.top - y / self.k)) - math.pi / 2))
    def contains(self, lon, lat):
        return self.lon0 <= lon <= self.lon1 and self.lat0 <= lat <= self.lat1

class LaeaPlate:
    """Lambert azimuthal equal-area (spherical) over a rectangular window in km."""
    def __init__(self, spec):
        self.name = spec["name"]; self.lat_side = spec.get("lat_side", "left")
        self.L0, self.P0 = (math.radians(v) for v in spec["center"])
        self.x0, self.y0, self.x1, self.y1 = spec["xy"]
        self.ll = spec["ll"]
        self.w = spec["w"]; self.s = self.w / (self.x1 - self.x0)
        self.h = (self.y1 - self.y0) * self.s
    def km(self, lon, lat):
        l, p = math.radians(lon), math.radians(lat)
        c = 1 + math.sin(self.P0) * math.sin(p) + math.cos(self.P0) * math.cos(p) * math.cos(l - self.L0)
        k = math.sqrt(2 / max(c, 1e-12))
        return (R_EARTH * k * math.cos(p) * math.sin(l - self.L0),
                R_EARTH * k * (math.cos(self.P0) * math.sin(p) - math.sin(self.P0) * math.cos(p) * math.cos(l - self.L0)))
    def project(self, lon, lat):
        x, y = self.km(lon, lat)
        return ((x - self.x0) * self.s, (self.y1 - y) * self.s)
    def inverse(self, X, Y):
        x, y = X / self.s + self.x0, self.y1 - Y / self.s
        rho = math.hypot(x, y)
        if rho < 1e-9: return (math.degrees(self.L0), math.degrees(self.P0))
        c = 2 * math.asin(min(1, rho / (2 * R_EARTH)))
        lat = math.asin(math.cos(c) * math.sin(self.P0) + y * math.sin(c) * math.cos(self.P0) / rho)
        lon = self.L0 + math.atan2(x * math.sin(c), rho * math.cos(self.P0) * math.cos(c) - y * math.sin(self.P0) * math.sin(c))
        return (math.degrees(lon), math.degrees(lat))
    def contains(self, lon, lat):
        X, Y = self.project(lon, lat)
        return 0 <= X <= self.w and 0 <= Y <= self.h

def make_plate(spec):
    return LaeaPlate(spec) if spec.get("proj") == "laea" else Plate(spec)

def clip(ring, box):
    """Sutherland-Hodgman against an axis-aligned box (x0, y0, x1, y1)."""
    LON0, LAT0, LON1, LAT1 = box
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

def clip_line(line, box):
    """Cut a polyline to an axis-aligned box (x0, y0, x1, y1) (Liang-Barsky per segment); returns the runs inside."""
    class pl: pass
    pl.lon0, pl.lat0, pl.lon1, pl.lat1 = box
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
    rings, rect = [], (0, 0, pl.w, pl.h)
    for feat in gj["features"]:
        if not keep(feat["properties"]): continue
        g = feat["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            for ring in poly:                       # outer + holes, all drawn (evenodd)
                pts = clip([(x, y) for x, y in ring], pl.ll)
                if len(pts) < 4: continue
                pts = clip(densify([pl.project(x, y) for x, y in pts]), rect)
                if len(pts) < 4: continue
                pr = simplify(pts, TOL)
                xs = [p[0] for p in pr]; ys = [p[1] for p in pr]
                if len(pr) < 4 or (max(xs) - min(xs) < 2.5 and max(ys) - min(ys) < 2.5):
                    continue                        # specks
                rings.append(pr)
    return to_d(rings, True)

def densify(pts, step=6.0):
    """Long straight runs (clip edges) bend under a non-cylindrical projection; keep them short."""
    out = []
    for a, b in zip(pts, pts[1:] + pts[:1]):
        out.append(a)
        n = int(math.hypot(b[0] - a[0], b[1] - a[1]) // step)
        out += [(a[0] + (b[0] - a[0]) * i / (n + 1), a[1] + (b[1] - a[1]) * i / (n + 1)) for i in range(1, n + 1)]
    return out

def lines(pl, gj, tol):
    out, rect = [], (0, 0, pl.w, pl.h)
    for feat in gj["features"]:
        g = feat["geometry"]
        for line in (g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]):
            for run in clip_line([tuple(p) for p in line], pl.ll):
                for r2 in clip_line([pl.project(x, y) for x, y in run], rect):
                    pr = simplify(r2, tol)
                    if len(pr) >= 2: out.append(pr)
    return to_d(out, False)

def graticule(pl, every=5):
    """Meridians and parallels every 5°, sampled finely so they curve with the projection."""
    lon0, lat0, lon1, lat1 = pl.ll
    rect, out = (0, 0, pl.w, pl.h), []
    frange = lambda a, b, d: [a + i * d for i in range(int((b - a) / d) + 1)]
    for lon in range(math.ceil(lon0 / every) * every, int(lon1) + 1, every):
        out += clip_line([pl.project(lon, la) for la in frange(max(lat0, -84), min(lat1, 84), 0.25)], rect)
    for lat in range(math.ceil(lat0 / every) * every, int(lat1) + 1, every):
        out += clip_line([pl.project(lo, lat) for lo in frange(lon0, lon1, 0.25)], rect)
    return to_d([simplify(r, 0.3) for r in out if len(r) >= 2], False)

def frame(pl, B0=6, B1=11):
    """Along the neatline: alternate whole degrees (longitude on top and bottom, latitude on the sides),
    and name every 10°: longitudes along the top, latitudes on the plate's label side."""
    mid = (B0 + B1) / 2
    def runs(edge):
        horizontal = edge in ("top", "bottom")
        n = int((pl.w if horizontal else pl.h) * 2)
        def val(t):
            if horizontal: lon, lat = pl.inverse(t, mid if edge == "top" else pl.h - mid); return lon
            lon, lat = pl.inverse(mid if edge == "left" else pl.w - mid, t); return lat
        ts = [i / 2 for i in range(n + 1)]
        vs = [val(t) for t in ts]
        bands, start, ticks = [], None, []
        for t, v, tp, vp in zip(ts[1:], vs[1:], ts, vs):
            if math.floor(v) % 2 == 0 and start is None: start = tp
            if math.floor(v) % 2 != 0 and start is not None: bands.append([round(start, 1), round(tp, 1)]); start = None
            for d in range(math.ceil(min(v, vp)), math.floor(max(v, vp)) + 1):
                if d % 10 == 0 and min(v, vp) <= d <= max(v, vp) and (v != vp):
                    ticks.append([round(tp + (t - tp) * (d - vp) / (v - vp), 1), d])
        if start is not None: bands.append([round(start, 1), round(ts[-1], 1)])
        seen = set(); ticks = [t for t in ticks if not (t[1] in seen or seen.add(t[1]))]
        return bands, ticks
    out = {}
    for e in ("top", "bottom", "left", "right"):
        out[e], ticks = runs(e)
        if e == "top": out["lonTicks"] = ticks
        if e == pl.lat_side: out["latTicks"] = ticks
    return out

def per_km(pl, X, Y, d=12.0):
    """Pixels per kilometre around (X, Y), east-west."""
    (lo1, la1), (lo2, la2) = pl.inverse(X - d, Y), pl.inverse(X + d, Y)
    p1, p2, dl = math.radians(la1), math.radians(la2), math.radians(lo2 - lo1)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * d / (2 * R_EARTH * math.asin(math.sqrt(a)))

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
    B1 = 11
    return {"name": pl.name, "w": round(pl.w), "h": round(pl.h), "latSide": pl.lat_side,
            "grat": graticule(pl), "frame": frame(pl), "perKm": round(per_km(pl, pl.w - B1 - 90, pl.h - B1 - 26), 5),
            "land": polys(pl, ne["land"]),
            "lakes": polys(pl, ne["lakes"], lambda p: p.get("featurecla") != "Reservoir"),
            "borders": lines(pl, ne["borders"], 0.8),
            "labels": labels, "places": places}

def main():
    src = Path(sys.argv[1]).expanduser()
    ne = {k: json.load(open(src / f"ne_50m_{f}.geojson")) for k, f in
          (("land", "land"), ("lakes", "lakes"), ("borders", "admin_0_boundary_lines_land"))}
    plates = [build(make_plate(spec), ne) for spec in PLATES]
    js = lambda v: json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    body = ",\n".join(
        f'  {{ name: {json.dumps(p["name"])}, w: {p["w"]}, h: {p["h"]}, latSide: "{p["latSide"]}", perKm: {p["perKm"]},\n'
        f'    grat: {json.dumps(p["grat"])},\n'
        f'    frame: {js(p["frame"])},\n'
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

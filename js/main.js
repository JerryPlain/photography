// ============================================================
// Render the site from SITE / TAGLINES / HIGHLIGHTS (site.js) + SERIES (data.js)
// Home: intro + contents + a few highlights per series (masonry).
// #/slug: the whole series as a masonry grid.
// ============================================================

const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fullSrc = (p) => `photos/${p.file}`;
const thumbSrc = (p) => { const i = p.file.lastIndexOf("/"); return `photos/${p.file.slice(0, i)}/thumbs/${p.file.slice(i + 1)}`; };
const videoSrc = (p) => `photos/${p.video}`;
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
const caption = (p) => [p.title, p.location].filter(Boolean).join(", ");
const PLURALS = { series: "series", photograph: "photographs", place: "places",
                  country: "countries", model: "models", act: "acts", campus: "campuses", site: "sites",
                  scene: "scenes", city: "cities", moment: "moments" };
const plural = (n, w) => `${n} ${n === 1 ? w : PLURALS[w] || w + "s"}`;
const subjectOf = (s) => (typeof SUBJECT !== "undefined" && SUBJECT[s.slug]) || "place";

// debug flags for screenshots: ?noreveal ?nohero ?from=N ?theme=dark
const Q = new URLSearchParams(location.search);
if (Q.get("theme") === "dark") document.documentElement.dataset.theme = "dark";
const NO_REVEAL = Q.has("noreveal");
if (NO_REVEAL) document.documentElement.classList.add("noreveal");   // also freezes keyframe entrances

SERIES.forEach((s, si) => { s.num = pad2(si + 1); s.photos.forEach((p, pi) => { p._series = s; p._index = pi; }); });
const TOTAL = SERIES.reduce((a, s) => a + s.photos.length, 0);
const bySlug = Object.fromEntries(SERIES.map((s) => [s.slug, s]));

function placesOf(s) {
  const seen = new Set(), out = [];
  s.photos.forEach((p) => { if (p.title && !seen.has(p.title)) { seen.add(p.title); out.push(p); } });
  return out;
}
// places grouped under their label: GERMANY  Berlin · Frankfurt · …
const GROUPED = new Set(["place", "country", "act", "site"]);
function placesHTML(s, cls) {
  if (subjectOf(s) === "model") {
    // cars: the maker in red, the models after it (BMW  Vision EfficientDynamics)
    const TWO_WORD = ["Aston Martin", "Alfa Romeo", "Land Rover", "Range Rover", "Rolls Royce"];
    const split = (t) => {
      const two = TWO_WORD.find((b) => t.toLowerCase().startsWith(b.toLowerCase() + " "));
      const brand = two || t.split(" ")[0];
      return [brand, t.slice(brand.length).trim() || t];
    };
    const byBrand = new Map();
    placesOf(s).forEach((p) => {
      const [brand, model] = split(p.title);
      if (!byBrand.has(brand)) byBrand.set(brand, []);
      byBrand.get(brand).push(model);
    });
    if (placesOf(s).length < 2) return "";
    return `<div class="series-places ${cls}">${[...byBrand.entries()].map(([brand, names]) => `
      <div class="pl${names.join("").length + names.length * 2 > 30 ? " wide" : ""}"><span class="pl-label">${esc(brand)}</span><span class="pl-names">${names.map((n) => `<span class="nm">${esc(n)}</span>`).join('&nbsp;<span class="sep">·</span> ')}</span></div>`).join("")}</div>`;
  }
  if (!GROUPED.has(subjectOf(s))) {
    // photos titled by filename still belong to a folder (a university, an office): group by it in red
    if (s.photos.some((p) => p.group)) {
      const byGroup = new Map();
      placesOf(s).forEach((p) => {
        const k = p.group || p.location || "";
        if (!byGroup.has(k)) byGroup.set(k, []);
        byGroup.get(k).push(p.title);
      });
      return `<div class="series-places ${cls}">${[...byGroup.entries()].map(([label, names]) => `
        <div class="pl wide">${label ? `<span class="pl-label">${esc(label)}</span>` : ""}<span class="pl-names">${names.map((n) => `<span class="nm">${esc(n)}</span>`).join('&nbsp;<span class="sep">·</span> ')}</span></div>`).join("")}</div>`;
    }
    const names = placesOf(s).map((p) => p.title);
    return names.length < 2 ? "" : `<div class="series-places ${cls}"><div class="pl wide"><span class="pl-names">${names.map((n) => `<span class="nm">${esc(n)}</span>`).join('&nbsp;<span class="sep">·</span> ')}</span></div></div>`;
  }
  const groups = new Map();
  placesOf(s).forEach((p) => {
    const k = p.location || "";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p.title);
  });
  const total = [...groups.values()].reduce((a, v) => a + v.length, 0);
  if (total < 2 && !(subjectOf(s) === "site" && !groups.has(""))) return "";
  const rows = [...groups.entries()].sort((a, b) => (a[0] === "") - (b[0] === "") || b[1].length - a[1].length);
  return `<div class="series-places ${cls}">${rows.map(([label, names]) => `
    <div class="pl${names.join("").length + names.length * 2 > 30 ? " wide" : ""}">${label ? `<span class="pl-label">${esc(label)}</span>` : ""}<span class="pl-names">${names.map((n) => `<span class="nm">${esc(n)}</span>`).join('&nbsp;<span class="sep">·</span> ')}</span></div>`).join("")}</div>`;
}

const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function poolOf(s) {
  const want = (typeof HIGHLIGHTS !== "undefined" && HIGHLIGHTS[s.slug]) || [];
  const picked = want.map((stem) => s.photos.find((p) => p.src === stem)).filter(Boolean);
  return picked.length ? picked : s.photos;
}
function homeCount(s) {
  const base = (typeof HOME_COUNT !== "undefined" && HOME_COUNT[s.slug]) || 4;
  const w = innerWidth, k = w >= 1400 ? 1.5 : w >= 1000 ? 1.25 : w >= 640 ? 1 : 0.75;
  return Math.max(2, Math.min(s.photos.length, Math.round(base * k)));
}
function highlightsOf(s) {
  const n = homeCount(s);
  const pool = shuffle(poolOf(s)), seen = new Set(), out = [];
  pool.forEach((p) => { if (out.length < n && !seen.has(p.title)) { seen.add(p.title); out.push(p); } });
  pool.forEach((p) => { if (out.length < n && !out.includes(p)) out.push(p); });
  return out;
}

// ---------- header / intro ----------
document.getElementById("brandName").textContent = SITE.author;
document.getElementById("homeLink").href = SITE.home;
document.getElementById("introTitle").innerHTML = SITE.title.split(" ")
  .map((w, i) => `<span class="w"><span style="--d:${i * 90}ms">${esc(w)}</span></span>`).join(" ");
document.getElementById("introStatement").textContent = SITE.statement;
const quoteBy = SITE.statementBy
  ? `<span class="dash" aria-hidden="true">—</span>${esc(SITE.statementBy)}${SITE.statementSource ? `, <cite>${esc(SITE.statementSource)}</cite>` : ""}`
  : "";
document.getElementById("introQuoteBy").innerHTML = quoteBy;
const places = new Set();
SERIES.filter((s) => subjectOf(s) === "place")
  .forEach((s) => s.photos.forEach((p) => p.location && places.add(p.title)));
document.getElementById("introStats").innerHTML =
  `<span class="n" data-n="${TOTAL}">${TOTAL}</span> photographs<span class="dot">·</span><span class="n" data-n="${SERIES.length}">${SERIES.length}</span> series` +
  (places.size ? `<span class="dot">·</span><span class="n" data-n="${places.size}">${places.size}</span> places` : "");
// count the intro numbers up from zero, eased, once fonts are ready
if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !NO_REVEAL) {
  document.querySelectorAll("#introStats .n").forEach((el) => {
    const target = Number(el.dataset.n), t0 = performance.now() + 500, dur = 1400;
    el.textContent = "0";
    const step = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(target * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// ---------- contents / index overlay / rail ----------
const contentsList = document.getElementById("contentsList");
const indexList = document.getElementById("indexList");
const rail = document.getElementById("rail");
SERIES.forEach((s, i) => {
  const id = `series-${s.num}`, n = s.photos.length;
  contentsList.insertAdjacentHTML("beforeend",
    `<li class="reveal" style="--d:${300 + i * 55}ms"><a href="#${id}"><span class="num">${s.num}</span><span class="name">${esc(s.title)}</span><span class="count">${n}</span></a></li>`);
  indexList.insertAdjacentHTML("beforeend",
    `<li><a href="#${id}"><span class="num">${s.num}</span>${esc(s.title)}<span class="count">${n}</span></a></li>`);
  rail.insertAdjacentHTML("beforeend",
    `<a href="#${id}" data-series="${i}"><span class="rail-title">${esc(s.title)}</span><span class="rail-num">${s.num}</span></a>`);
});

function masonryHTML(s, photos) {
  return `<div class="masonry">${photos.map((p, i) => `
    <figure class="photo-card reveal${p.video ? " is-video" : ""}" style="--d:${Math.min(i, 8) * 70}ms" data-slug="${s.slug}" data-index="${p._index}" tabindex="0" role="button" aria-label="View ${esc(caption(p) || s.title)}">
      <div class="photo-frame" style="--ar:${p.w} / ${p.h}">
        <img src="${thumbSrc(p)}" alt="${esc(caption(p) || `${s.title} ${pad2(p._index + 1)}`)}" loading="lazy" decoding="async" width="${p.w}" height="${p.h}">
        ${p.video ? `<video class="clip" muted loop playsinline preload="none" data-src="${videoSrc(p)}" aria-hidden="true"></video><span class="clip-badge" aria-hidden="true"><i></i>${clock(p.duration || 0)}</span>` : ""}
      </div>
      <figcaption class="photo-caption"><span class="t">${esc(p.title || `${s.title} ${pad2(p._index + 1)}`)}</span>${p.location ? `<span class="l">${esc(p.location)}</span>` : ""}</figcaption>
    </figure>`).join("")}</div>`;
}

function seriesHead(s, cls = "") {
  const n = s.photos.length, pl = placesOf(s), tag = TAGLINES[s.slug];
  return `
    <header class="series-head ${cls}">
      <div>
        <span class="series-num">Series ${s.num}</span>
        <h2 class="series-title">${esc(s.title)}</h2>
        ${tag ? `<p class="series-tagline">${esc(tag)}</p>` : ""}
      </div>
      <p class="series-meta">${plural(n, "photograph")}${pl.length > 1 ? `<br>${plural(pl.length, subjectOf(s))}` : ""}</p>
    </header>
    ${placesHTML(s, cls)}`;
}

// ---------- home: series sections with highlights ----------
const root = document.getElementById("seriesRoot");
SERIES.forEach((s, si) => {
  const picks = highlightsOf(s);
  const section = document.createElement("section");
  section.className = "series"; section.id = `series-${s.num}`; section.dataset.series = si;
  section.innerHTML = `
    ${seriesHead(s, "reveal")}
    ${masonryHTML(s, picks)}
    <a class="view-all reveal" href="#/${s.slug}">${s.photos.length > picks.length ? `View all ${plural(s.photos.length, "photograph")}` : "Open series"} <span aria-hidden="true">→</span></a>`;
  root.appendChild(section);
});

// ---------- series page (#/slug) ----------
const home = document.getElementById("home");
const page = document.getElementById("seriesPage");
let pageSlug = null;
function renderSeriesPage(s) {
  page.innerHTML = `
    <a class="back-link" href="#"><span aria-hidden="true">←</span> All series</a>
    ${seriesHead(s)}
    ${masonryHTML(s, s.photos)}`;
  wireCards(page);
  watchImages(page);
  page.querySelectorAll(".reveal").forEach((el) => (NO_REVEAL ? el.classList.add("visible") : revealObserver.observe(el)));
}
function swapView(show, hide) {
  hide.hidden = true;
  show.hidden = false;
  show.classList.remove("page-in"); void show.offsetWidth; show.classList.add("page-in");
}
function route() {
  const m = location.hash.match(/^#\/([a-z0-9-]+)$/);
  const s = m && bySlug[m[1]];
  if (s) {
    if (pageSlug !== s.slug) { renderSeriesPage(s); pageSlug = s.slug; }
    swapView(page, home); rail.hidden = true;
    document.title = `${s.title} — ${SITE.author}`;
    scrollTo({ top: 0, behavior: "instant" });
  } else {
    if (home.hidden) swapView(home, page); rail.hidden = false;
    document.title = `Photography — ${SITE.author}`;
    if (location.hash && location.hash !== "#") {
      const el = document.querySelector(location.hash);
      // arriving from a link lands straight on the section; in-page jumps keep the smooth scroll
      if (el) el.scrollIntoView({ behavior: routedOnce ? "smooth" : "instant" });
    }
  }
}
let routedOnce = false;
addEventListener("hashchange", route);

// ---------- image load state ----------
const clipObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      v.play().then(() => v.closest(".photo-frame").classList.add("playing")).catch(() => {});
    } else v.pause();
  });
}, { threshold: 0.35 });
function watchClips(scope) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || NO_REVEAL) return;
  scope.querySelectorAll("video.clip").forEach((v) => clipObserver.observe(v));
}
function watchImages(scope) {
  watchClips(scope);
  scope.querySelectorAll(".photo-frame img").forEach((img) => {
    const box = img.closest(".photo-frame");
    const done = () => box.classList.add("loaded");
    if (img.complete && img.naturalWidth) done(); else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
  });
}
watchImages(document);

// ---------- footer ----------
document.getElementById("footerName").textContent = SITE.author;
document.getElementById("footerStatement").textContent = SITE.statement;
document.getElementById("footerQuoteBy").innerHTML = quoteBy;
document.getElementById("footerLinks").innerHTML = SITE.footerLinks
  .map((l) => `<a href="${esc(l.url)}"${l.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)}</a>`).join("");
document.getElementById("footerCopy").textContent = SITE.copyright;

// ---------- atlas: every city photographed, on two map plates, replayed as a journey ----------
(function atlas() {
  if (typeof MAP === "undefined") return;
  const frame = document.querySelector(".atlas-frame");
  const mapEl = document.getElementById("atlasMap");
  const tip = document.getElementById("atlasTip");
  const stats = document.getElementById("atlasStats");
  const onMap = new Set(typeof ATLAS_SERIES !== "undefined" ? ATLAS_SERIES : ["city"]);
  // a photograph's city: its title in City; for concerts the venue city ("Munich 2025" → Munich)
  const placeOf = (p) => {
    if (!onMap.has(p._series.slug)) return "";
    const n = subjectOf(p._series) === "act" ? (p.location || "").replace(/\s+\d{4}$/, "") : p.title;
    return n ? n.normalize("NFC") : "";
  };
  const plateOf = {};
  MAP.plates.forEach((pl, k) => Object.keys(pl.places).forEach((n) => { plateOf[n] = k; }));
  const byPlace = new Map(), missing = new Set();
  SERIES.forEach((s) => s.photos.forEach((p) => {
    const name = placeOf(p);
    if (!name) return;
    if (plateOf[name] === undefined) { missing.add(name); return; }
    if (!byPlace.has(name)) byPlace.set(name, { name, photos: [], country: "", first: "" });
    const v = byPlace.get(name);
    v.photos.push(p);
    if (subjectOf(p._series) === "place" && p.location && !v.country) v.country = p.location;
    if (!v.country && typeof PASSPORT !== "undefined" && PASSPORT.VENUE_COUNTRY[name]) v.country = PASSPORT.VENUE_COUNTRY[name];
    if (p.date && (!v.first || p.date < v.first)) v.first = p.date;
  }));
  if (missing.size) console.warn("atlas: no coordinates for", [...missing].join(", "), "— add them in scripts/build_map.py");

  // the journey: cities in the order they were first photographed
  const visits = [...byPlace.values()].sort((a, b) => (a.first || "9999").localeCompare(b.first || "9999") || a.name.localeCompare(b.name));
  const N = visits.length;
  visits.forEach((v, k) => { v.k = k; v.plate = plateOf[v.name]; v.xy = MAP.plates[v.plate].places[v.name].slice(); });
  // neighbours closer than a pin's width (Rome & Vatican are 4 km apart) get nudged apart so both stay reachable
  const MIN = 17;
  for (let pass = 0; pass < 12; pass++) {
    let moved = false;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const a = visits[i], b = visits[j];
      if (a.plate !== b.plate) continue;
      let dx = b.xy[0] - a.xy[0], dy = b.xy[1] - a.xy[1], d = Math.hypot(dx, dy);
      if (d >= MIN) continue;
      if (d < 0.01) { dx = 1; dy = 0; d = 1; }
      const push = (MIN - d) / 2, ux = dx / d, uy = dy / d;
      a.xy[0] -= ux * push; a.xy[1] -= uy * push; b.xy[0] += ux * push; b.xy[1] += uy * push;
      moved = true;
    }
    if (!moved) break;
  }
  visits.forEach((v) => { v.xy = v.xy.map((n) => Math.round(n * 10) / 10); });

  const countries = new Set(visits.map((v) => v.country).filter(Boolean));
  const years = visits.map((v) => v.first && Number(v.first.slice(0, 4))).filter(Boolean);
  const span = years.length ? (Math.min(...years) === Math.max(...years) ? `${years[0]}` : `${Math.min(...years)}–${Math.max(...years)}`) : "";
  stats.innerHTML = `${plural(N, "city")}<br>${plural(countries.size, "country")}${span ? `<br>${span}` : ""}`;

  // permanent labels: most photographed first, skipping any that would collide with one already placed
  const named = new Set();
  MAP.plates.forEach((pl, k) => {
    const placed = [];
    visits.filter((v) => v.plate === k)
      .sort((a, b) => b.photos.length - a.photos.length || a.name.localeCompare(b.name))
      .forEach((v) => {
        const [x, y] = v.xy;
        if (placed.every(([px, py]) => Math.abs(y - py) > 24 || Math.abs(x - px) > 150)) { named.add(v.name); placed.push([x, y]); }
      });
  });

  // a gentle upward arc from one city to the next
  const arcPath = ([x0, y0], [x1, y1]) => {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
    let nx = -dy / d, ny = dx / d;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const off = Math.min(d * 0.28, 140);
    const cx = (x0 + x1) / 2 + nx * off, cy = (y0 + y1) / 2 + ny * off;
    return `M${x0},${y0} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1},${y1}`;
  };

  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
  mapEl.innerHTML = MAP.plates.map((pl, pk) => {
    const [lon0, lat0, lon1, lat1] = pl.bbox;
    const K = pl.w / ((lon1 - lon0) * Math.PI / 180), TOP = merc(lat1);
    const px = (lon) => ((lon - lon0) * Math.PI / 180) * K, py = (lat) => (TOP - merc(lat)) * K;
    let grat = "";
    for (let lon = Math.ceil(lon0 / 5) * 5; lon <= lon1; lon += 5) grat += `M${px(lon).toFixed(1)},0V${pl.h}`;
    for (let lat = Math.ceil(lat0 / 5) * 5; lat <= lat1; lat += 5) grat += `M0,${py(lat).toFixed(1)}H${pl.w}`;
    const here = visits.filter((v) => v.plate === pk);
    const arcs = visits.filter((v) => v.k > 0 && v.plate === pk && visits[v.k - 1].plate === pk);
    const { w: W, h: H } = pl;

    // neatline: a paper margin, a band of alternating whole degrees between two rules, and every 10° named
    const B0 = 6, B1 = 11, clampX = (x) => Math.min(Math.max(x, B0), W - B0), clampY = (y) => Math.min(Math.max(y, B0), H - B0);
    let band = "", deg = "";
    for (let lon = Math.floor(lon0); lon < lon1; lon++) if (lon % 2 === 0) {
      const a = clampX(px(lon)), b = clampX(px(lon + 1));
      if (b > a) band += `M${a.toFixed(1)},${B0}H${b.toFixed(1)}V${B1}H${a.toFixed(1)}ZM${a.toFixed(1)},${H - B1}H${b.toFixed(1)}V${H - B0}H${a.toFixed(1)}Z`;
    }
    for (let lat = Math.floor(lat0); lat < lat1; lat++) if (lat % 2 === 0) {
      const a = clampY(py(lat + 1)), b = clampY(py(lat));
      if (b > a) band += `M${B0},${a.toFixed(1)}H${B1}V${b.toFixed(1)}H${B0}ZM${W - B1},${a.toFixed(1)}H${W - B0}V${b.toFixed(1)}H${W - B1}Z`;
    }
    const fmt = (v, pos, neg) => (v === 0 ? "0°" : `${Math.abs(v)}°${v > 0 ? pos : neg}`);
    for (let lon = Math.ceil(lon0 / 10) * 10; lon <= lon1; lon += 10)
      if (px(lon) > 40 && px(lon) < W - 40) deg += `<text x="${px(lon).toFixed(1)}" y="${B1 + 14}" text-anchor="middle">${fmt(lon, "E", "W")}</text>`;
    for (let lat = Math.ceil(lat0 / 10) * 10; lat <= lat1; lat += 10)
      if (py(lat) > 40 && py(lat) < H - 60) deg += pl.latSide === "right"
        ? `<text x="${W - B1 - 6}" y="${(py(lat) + 4).toFixed(1)}" text-anchor="end">${fmt(lat, "N", "S")}</text>`
        : `<text x="${B1 + 6}" y="${(py(lat) + 4).toFixed(1)}">${fmt(lat, "N", "S")}</text>`;

    // scale bar for the latitude it sits at (Mercator stretches toward the poles)
    const sx = W - B1 - 22, sy = H - B1 - 26, latS = lat0 + (lat1 - lat0) * 0.04;
    const perKm = K / (6371 * Math.cos(latS * Math.PI / 180));
    const km = [250, 500, 1000, 2000].find((k) => k * perKm >= 110) || 2000, len = km * perKm;
    const scale = `<g class="scale" transform="translate(${(sx - len).toFixed(1)},${sy})">
      <rect class="card" x="-16" y="-22" width="${(len + 40).toFixed(1)}" height="34" rx="3"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="${(i * len / 4).toFixed(1)}" y="0" width="${(len / 4).toFixed(1)}" height="4" class="${i % 2 ? "o" : "f"}"/>`).join("")}
      <text x="0" y="-6" text-anchor="middle">0</text><text x="${(len / 2).toFixed(1)}" y="-6" text-anchor="middle">${km / 2}</text>
      <text x="${len.toFixed(1)}" y="-6" text-anchor="middle">${km} km</text></g>`;

    // water-lining: three fine rings that follow the coast outward, each fainter than the last
    const rings = [[26, 0.3], [17, 0.55], [9, 0.9]].map(([w, o]) =>
      `<use href="#coast${pk}" class="ring" stroke-width="${w}" style="opacity:${o}"/><use href="#coast${pk}" stroke-width="${w - 1.6}" style="stroke:url(#sea${pk})"/>`).join("");

    return `
    <div class="plate" style="flex-grow:${(W / H).toFixed(3)}">
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(pl.name)}: ${plural(here.length, "city")}">
        <defs>
          <radialGradient id="sea${pk}" gradientUnits="userSpaceOnUse" cx="${W / 2}" cy="${H * 0.45}" r="${Math.max(W, H) * 0.75}"><stop offset="0" class="sea-hi"/><stop offset="1" class="sea-lo"/></radialGradient>
          <path id="coast${pk}" d="${pl.land}"/>
        </defs>
        <rect class="sea" width="${W}" height="${H}" fill="url(#sea${pk})"/>
        <path class="grat" d="${grat}"/>
        <g class="ripples">${rings}</g>
        <use class="land" href="#coast${pk}"/>
        <path class="lake" d="${pl.lakes || ""}"/>
        <path class="border" d="${pl.borders || ""}"/>
        <g class="names" aria-hidden="true">${(pl.labels || []).map(([kind, text, x, y, rot]) => {
          const lines = text.split("|"), sea = "Osg".includes(kind), lh = kind === "O" ? 21 : sea ? 18 : kind === "C" ? 17 : 14;
          return `<text class="${sea ? "sea-name" : "country"} t-${kind}" text-anchor="middle" transform="translate(${x},${y})${rot ? ` rotate(${rot})` : ""}">${lines.map((t, i) =>
            `<tspan x="0" y="${((i - (lines.length - 1) / 2) * lh + 5).toFixed(1)}">${esc(t)}</tspan>`).join("")}</text>`; }).join("")}</g>
        <g class="frame" aria-hidden="true">
          <path class="margin" d="M0,0H${W}V${H}H0ZM${B0},${B0}V${H - B0}H${W - B0}V${B0}Z"/>
          <path class="band" d="${band}"/>
          <rect class="rule" x="${B0}" y="${B0}" width="${W - 2 * B0}" height="${H - 2 * B0}"/>
          <rect class="rule thin" x="${B1}" y="${B1}" width="${W - 2 * B1}" height="${H - 2 * B1}"/>
          <g class="deg">${deg}</g>
          ${scale}
        </g>
        <g class="routes">${arcs.map((v) => `<path class="arc" data-k="${v.k}" d="${arcPath(visits[v.k - 1].xy, v.xy)}"/>`).join("")}</g>
        ${here.map((v) => {
          const [x, y] = v.xy, n = v.photos.length;
          const r = 5.5 + Math.min(n, 12) * 0.45;
          const right = x + r + 12 + v.name.length * 11.5 < pl.w;
          return `<g transform="translate(${x},${y})"><g class="pin${named.has(v.name) ? " named" : ""}" data-place="${esc(v.name)}" data-k="${v.k}" tabindex="0" role="button"
                   aria-label="${esc(v.name)}, ${plural(n, "photograph")}" style="--j:${v.k % 5}">
            <circle class="halo" r="6"/>
            <circle class="dot" r="${r.toFixed(1)}"/>
            <text class="lbl" x="${right ? r + 9 : -(r + 9)}" y="7" text-anchor="${right ? "start" : "end"}">${esc(v.name)}</text>
          </g></g>`; }).join("")}
        <circle class="comet" r="7" opacity="0"/>
      </svg>
      <span class="plate-name">${esc(pl.name)}</span>
    </div>`;
  }).join("");

  // ---- wire the journey ----
  visits.forEach((v) => { v.el = mapEl.querySelector(`.pin[data-k="${v.k}"]`); v.on = null; });
  const arcs = [...mapEl.querySelectorAll(".arc")].map((el) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    return { el, k: Number(el.dataset.k), len, comet: el.closest("svg").querySelector(".comet") };
  });
  const comets = [...mapEl.querySelectorAll(".comet")];

  const jrDate = document.getElementById("jrDate"), jrPlace = document.getElementById("jrPlace");
  const jrFill = document.getElementById("jrFill"), jrRange = document.getElementById("jrRange");
  const jrMarks = document.getElementById("jrMarks"), jrPlay = document.getElementById("jrPlay");
  const month = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";
  // a tick per city, a year label where each year begins
  let lastYear = "";
  const yearAt = [];
  const ticks = visits.map((v, k) => {
    const at = (k + 1) / N * 100, y = (v.first || "").slice(0, 4);
    if (y && y !== lastYear) yearAt.push({ y, at });
    lastYear = y || lastYear;
    return `<i style="left:${at.toFixed(3)}%"></i>`;
  });
  // years that begin close together (a lone early visit) split apart: the earlier one ends at its tick
  const yearLabels = yearAt.map((o, k) => {
    const next = yearAt[k + 1], tight = next && next.at - o.at < 7, after = k > 0 && o.at - yearAt[k - 1].at < 7;
    return `<span class="jr-year${tight ? " end" : after ? " start" : ""}" style="left:${o.at.toFixed(3)}%">${o.y}</span>`;
  });
  jrMarks.innerHTML = ticks.join("") + yearLabels.join("");

  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  let p = 0, playing = false, raf = 0, last = 0;
  // visit k arrives at p = k + 1; the arc into it draws over [k, k + 1]
  function render() {
    const cur = Math.min(N - 1, Math.floor(p + 1e-6) - 1);
    visits.forEach((v, k) => {
      const on = p >= k + 1 - 1e-6;
      if (on !== v.on) {
        v.on = on;
        v.el.classList.toggle("on", on);
        if (on && playing) { v.el.classList.remove("pop"); v.el.getBoundingClientRect(); v.el.classList.add("pop"); }
      }
      v.el.classList.toggle("current", playing && k === cur);
    });
    comets.forEach((c) => c.setAttribute("opacity", "0"));
    const done = p >= N - 1e-6;
    arcs.forEach((a) => {
      const f = ease(Math.max(0, Math.min(1, p - a.k)));
      a.el.style.strokeDashoffset = `${a.len * (1 - f)}`;
      const live = f > 0 && f < 1;
      a.el.classList.toggle("live", live);
      // a short wake: arcs fade over the next three cities, and the finished map is left clean
      const age = p - (a.k + 1);
      a.el.style.opacity = done ? "0" : live ? "0.95" : age >= 0 ? String(Math.max(0, 0.55 - age * 0.18).toFixed(3)) : "0";
      if (live) {
        const pt = a.el.getPointAtLength(a.len * f);
        a.comet.setAttribute("cx", pt.x.toFixed(1)); a.comet.setAttribute("cy", pt.y.toFixed(1)); a.comet.setAttribute("opacity", "1");
      }
    });
    const v = visits[Math.max(0, cur)];
    jrDate.textContent = cur < 0 ? month(visits[0].first) : month(v.first);
    jrPlace.textContent = cur < 0 ? "" : v.name;
    jrFill.style.width = `${(p / N * 100).toFixed(2)}%`;
    if (document.activeElement !== jrRange) jrRange.value = String(Math.round(p / N * 1000));
    frame.classList.toggle("done", done);
    jrPlay.dataset.state = playing ? "pause" : p >= N - 1e-6 ? "replay" : "play";
    jrPlay.setAttribute("aria-label", playing ? "Pause the journey" : p >= N - 1e-6 ? "Replay the journey" : "Play the journey");
  }
  const STEP = 380;   // ms per city
  function tick(now) {
    p = Math.min(N, p + (now - last) / STEP); last = now;
    if (p >= N) { playing = false; frame.classList.remove("playing"); }
    render();
    if (playing) raf = requestAnimationFrame(tick);
  }
  function play(from) {
    cancelAnimationFrame(raf);
    if (from !== undefined) p = from;
    playing = true; frame.classList.add("playing"); tip.hidden = true;
    last = performance.now(); raf = requestAnimationFrame(tick);
  }
  function pause() { playing = false; frame.classList.remove("playing"); cancelAnimationFrame(raf); render(); }
  jrPlay.addEventListener("click", () => (playing ? pause() : play(p >= N - 1e-6 ? 0 : p)));
  jrRange.addEventListener("input", () => { pause(); p = Number(jrRange.value) / 1000 * N; render(); });

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (Q.has("journey")) { p = Math.max(0, Math.min(1, Number(Q.get("journey")))) * N; render(); }
  else if (reduced || NO_REVEAL) { p = N; render(); }
  else {
    render();
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); setTimeout(() => play(0), 450); }
    }, { threshold: 0.35 });
    io.observe(frame);
  }

  // tooltip follows the hovered city; click opens its photographs
  const tipImg = tip.querySelector("img"), tipB = tip.querySelector("b"), tipS = tip.querySelector("span");
  function showTip(g) {
    if (playing || !g.classList.contains("on")) return;
    const v = byPlace.get(g.dataset.place);
    const r = g.querySelector(".dot").getBoundingClientRect(), fr = frame.getBoundingClientRect();
    tipImg.src = thumbSrc(v.photos[0]);
    tipB.textContent = v.name;
    tipS.textContent = [v.country, month(v.first), plural(v.photos.length, "photograph")].filter(Boolean).join(" · ");
    tip.style.left = `${r.left + r.width / 2 - fr.left}px`;
    tip.style.top = `${r.top - fr.top}px`;
    tip.hidden = false;
  }
  mapEl.addEventListener("pointerover", (e) => { const g = e.target.closest(".pin"); if (g) showTip(g); });
  mapEl.addEventListener("pointerout", (e) => { if (e.target.closest(".pin") && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".pin"))) tip.hidden = true; });
  mapEl.addEventListener("focusin", (e) => { const g = e.target.closest(".pin"); if (g) showTip(g); });
  mapEl.addEventListener("focusout", () => { tip.hidden = true; });
  const open = (g) => { if (!g.classList.contains("on")) return; const v = byPlace.get(g.dataset.place); tip.hidden = true; openLightbox(v.photos, 0, null); };
  mapEl.addEventListener("click", (e) => { const g = e.target.closest(".pin"); if (g) open(g); });
  mapEl.addEventListener("keydown", (e) => { const g = e.target.closest(".pin"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(g); } });

  // ---- by continent: tabs, a single enlarged plate, and the continent's own index beside it ----
  const PLATE_CONTINENT = { "Europe": "Europe", "Southeast Asia & Japan": "Asia" };
  const ALL_CONTINENTS = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"];
  const plateEls = [...mapEl.querySelectorAll(".plate")];
  const contOf = (v) => PLATE_CONTINENT[MAP.plates[v.plate].name] || "";
  const tabs = document.getElementById("continents"), side = document.getElementById("atlasSide");
  const tally = (list) => ({ cities: list.length, countries: new Set(list.map((v) => v.country).filter(Boolean)).size,
    photos: list.reduce((a, v) => a + v.photos.length, 0), since: list.map((v) => v.first).filter(Boolean).sort()[0] || "" });
  const allTally = tally(visits);
  tabs.innerHTML = [["All", visits], ...ALL_CONTINENTS.map((c) => [c, visits.filter((v) => contOf(v) === c)])].map(([name, list]) => {
    const st = name === "All" ? allTally : tally(list), empty = !list.length;
    return `<button type="button" role="tab" class="ct${empty ? " empty" : ""}" data-c="${name}" aria-selected="${name === "All"}"${empty ? ' aria-disabled="true" title="No stamps yet — someday"' : ""}>
      <span class="ct-name">${name === "All" ? "The world" : name}</span>
      <span class="ct-num">${empty ? "someday" : `${st.cities} ${st.cities === 1 ? "city" : "cities"} · ${st.countries} ${st.countries === 1 ? "country" : "countries"}`}</span>
    </button>`;
  }).join("");
  function sideHTML(c) {
    const list = visits.filter((v) => contOf(v) === c), st = tally(list);
    const byCountry = new Map();
    list.slice().sort((a, b) => (a.first || "9").localeCompare(b.first || "9")).forEach((v) => {
      const k = v.country || "Elsewhere"; if (!byCountry.has(k)) byCountry.set(k, []); byCountry.get(k).push(v);
    });
    const rows = [...byCountry.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    return `
      <p class="as-kicker">${esc(c)}</p>
      <div class="as-figs">
        <div><b>${st.cities}</b><span>cities</span></div>
        <div><b>${st.countries}</b><span>countries</span></div>
        <div><b>${st.photos}</b><span>frames</span></div>
      </div>
      <p class="as-since">${st.since ? `First light in ${month(st.since)}` : ""}</p>
      <div class="as-list">${rows.map(([country, vs]) => `
        <div class="as-country"><span class="as-cn">${esc(country)}</span>
          <div class="as-cities">${vs.map((v) => `<button type="button" class="as-city" data-place="${esc(v.name)}"><span>${esc(v.name)}</span><i>${v.photos.length}</i></button>`).join("")}</div>
        </div>`).join("")}</div>`;
  }
  function select(c) {
    tabs.querySelectorAll(".ct").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.c === c)));
    const solo = c !== "All";
    frame.classList.toggle("solo", solo);
    plateEls.forEach((el, k) => { el.hidden = solo && PLATE_CONTINENT[MAP.plates[k].name] !== c; });
    side.hidden = !solo;
    if (solo) { side.innerHTML = sideHTML(c); side.classList.remove("in"); void side.offsetWidth; side.classList.add("in"); }
    tip.hidden = true;
    fitSide();
  }
  // beside the map the list never runs taller than the plate; it scrolls instead
  function fitSide() {
    const shown = plateEls.find((el) => !el.hidden);
    side.style.maxHeight = frame.classList.contains("solo") && innerWidth > 900 && shown ? `${shown.offsetHeight}px` : "";
  }
  addEventListener("resize", fitSide, { passive: true });
  tabs.addEventListener("click", (e) => { const b = e.target.closest(".ct"); if (b && !b.classList.contains("empty")) select(b.dataset.c); });
  // city list ↔ map: hovering a city lights its pin; clicking opens its photographs
  const pinOf = (name) => mapEl.querySelector(`.pin[data-place="${CSS.escape(name)}"]`);
  side.addEventListener("pointerover", (e) => { const b = e.target.closest(".as-city"); mapEl.querySelectorAll(".pin.hl").forEach((g) => g.classList.remove("hl")); if (b) { const g = pinOf(b.dataset.place); if (g) g.classList.add("hl"); } });
  side.addEventListener("pointerleave", () => mapEl.querySelectorAll(".pin.hl").forEach((g) => g.classList.remove("hl")));
  side.addEventListener("click", (e) => { const b = e.target.closest(".as-city"); if (b) openLightbox(byPlace.get(b.dataset.place).photos, 0, null); });
  if (Q.has("continent")) select(Q.get("continent"));
})();

// ---------- visitors: the RevolverMaps2 globe counts the visit when its script runs ----------
(function visitors() {
  if (typeof VISITORS === "undefined" || !VISITORS.id) return;
  // embed.js mounts a lazy globe iframe into every .rm2-globe[data-site] it finds
  const box = document.getElementById("visitorsGlobe");
  box.classList.add("rm2-globe");
  box.dataset.site = VISITORS.id;
  box.dataset.size = "300";
  box.dataset.theme = VISITORS.theme || "night";
  if (VISITORS.color) box.dataset.color = VISITORS.color;
  const s = document.createElement("script");
  s.src = "https://revolvermaps2.com/embed.js";
  s.async = true;
  document.body.appendChild(s);
  document.getElementById("visitors").hidden = false;
})();

// ---------- passport: countries visited, on the way to all of them ----------
(function passport() {
  const root = document.getElementById("passport");
  if (!root || typeof PASSPORT === "undefined") return;
  // ISO code + continent for every country that can appear (add more as the journey grows)
  const C = {
    Germany: ["DEU", "Europe"], Italy: ["ITA", "Europe"], Greece: ["GRC", "Europe"], Malta: ["MLT", "Europe"],
    Portugal: ["PRT", "Europe"], Spain: ["ESP", "Europe"], France: ["FRA", "Europe"], Croatia: ["HRV", "Europe"],
    Slovenia: ["SVN", "Europe"], Austria: ["AUT", "Europe"], "Vatican City": ["VAT", "Europe"],
    Switzerland: ["CHE", "Europe"], Netherlands: ["NLD", "Europe"], Belgium: ["BEL", "Europe"], Czechia: ["CZE", "Europe"],
    Hungary: ["HUN", "Europe"], Poland: ["POL", "Europe"], Denmark: ["DNK", "Europe"], Sweden: ["SWE", "Europe"],
    Norway: ["NOR", "Europe"], Finland: ["FIN", "Europe"], Iceland: ["ISL", "Europe"], Ireland: ["IRL", "Europe"],
    "United Kingdom": ["GBR", "Europe"], Luxembourg: ["LUX", "Europe"], Monaco: ["MCO", "Europe"], Liechtenstein: ["LIE", "Europe"],
    "San Marino": ["SMR", "Europe"], Montenegro: ["MNE", "Europe"], Albania: ["ALB", "Europe"], Turkey: ["TUR", "Asia"],
    China: ["CHN", "Asia"], Japan: ["JPN", "Asia"], Thailand: ["THA", "Asia"], Singapore: ["SGP", "Asia"],
    "South Korea": ["KOR", "Asia"], Vietnam: ["VNM", "Asia"], Malaysia: ["MYS", "Asia"], Indonesia: ["IDN", "Asia"],
    "United States": ["USA", "North America"], Canada: ["CAN", "North America"], Mexico: ["MEX", "North America"],
    Australia: ["AUS", "Oceania"], "New Zealand": ["NZL", "Oceania"], Egypt: ["EGY", "Africa"], Morocco: ["MAR", "Africa"],
    Brazil: ["BRA", "South America"], Argentina: ["ARG", "South America"], Peru: ["PER", "South America"],
  };
  const CONTINENTS = [["Europe", 44], ["Asia", 48], ["Africa", 54], ["North America", 23], ["South America", 12], ["Oceania", 14]];
  const seen = new Map();   // country -> first date
  const note = (country, date) => {
    if (!country || !C[country]) return;
    const prev = seen.get(country);
    if (prev === undefined || (date && (!prev || date < prev))) seen.set(country, date || prev || "");
  };
  SERIES.forEach((s) => s.photos.forEach((p) => {
    if (subjectOf(s) === "act") note(PASSPORT.VENUE_COUNTRY[(p.location || "").replace(/\s+\d{4}$/, "")], p.date);
    else if (subjectOf(s) === "place") note(p.location, p.date);
  }));
  const list = [...seen.entries()].sort((a, b) => (a[1] || "9").localeCompare(b[1] || "9"));
  const n = list.length, goal = PASSPORT.goal || 195;
  const pct = n / goal * 100;
  document.getElementById("ppTotal").textContent = goal;
  document.getElementById("ppDream").innerHTML = `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}% of the world so far<span class="sep">·</span>${esc(PASSPORT.dream || "")}`;
  // continents: a compact strip — ring, name, visited / total, and the countries in small caps
  const byCont = {};
  list.forEach(([c, date]) => { const k = C[c][1]; (byCont[k] = byCont[k] || []).push([c, date]); });
  const R = 20, CIRC = 2 * Math.PI * R;
  document.getElementById("ppCont").innerHTML = CONTINENTS
    .map(([name, total], k) => ({ name, total, k, got: (byCont[name] || []).sort((a, b) => (a[1] || "9").localeCompare(b[1] || "9")) }))
    .sort((a, b) => b.got.length - a.got.length || a.k - b.k)
    .map(({ name, total, got }, row) => {
      const v = got.length, p = v / total * 100;
      const ptxt = v === 0 ? "—" : p < 10 ? `${p.toFixed(1)}%` : `${Math.round(p)}%`;
      const codes = got.map(([c, d]) => `<span title="${esc(c)}${d ? `, ${d.slice(0, 4)}` : ""}">${C[c][0]}</span>`).join("");
      return `<div class="pp-c${v ? "" : " none"}" style="--row:${row}">
        <svg class="pp-ring" viewBox="0 0 48 48" aria-hidden="true">
          <circle class="pp-ring-bg" cx="24" cy="24" r="${R}"/>
          <circle class="pp-ring-fg" cx="24" cy="24" r="${R}" style="--len:${CIRC.toFixed(2)};--to:${(CIRC * (1 - v / total)).toFixed(2)}"/>
          <text class="pp-ring-t" x="24" y="24">${ptxt}</text>
        </svg>
        <div class="pp-ch">
          <span class="pp-cn">${name}</span>
          <span class="pp-cv"><b>${v}</b> / ${total}</span>
        </div>
        <div class="pp-codes">${v ? codes : '<em>someday</em>'}</div>
      </div>`;
    }).join("");
  // count up, fill the bars and drop the stamps when the passport scrolls into view
  const ppN = document.getElementById("ppN"), fill = document.getElementById("ppFill");
  const finish = () => { ppN.textContent = n; fill.style.width = `${Math.max(pct, 0.6)}%`; root.classList.add("open"); };
  if (NO_REVEAL || matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    root.classList.add("open");
    fill.style.width = `${Math.max(pct, 0.6)}%`;
    const t0 = performance.now() + 250, dur = 1300;
    const step = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      ppN.textContent = String(Math.round(n * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.3 });
  io.observe(root);
})();

// ---------- compass: the needle follows the pointer, and drifts when left alone ----------
(function compass() {
  const el = document.getElementById("compass"), needle = document.getElementById("needle");
  if (!el || !needle) return;
  const ticks = el.querySelector(".c-ticks");
  ticks.innerHTML = Array.from({ length: 72 }, (_, i) => {
    const a = i * 5 * Math.PI / 180, major = i % 18 === 0, mid = i % 6 === 0;
    const r1 = 46, r0 = major ? 39 : mid ? 42 : 44;
    return `<line x1="${(50 + r0 * Math.sin(a)).toFixed(2)}" y1="${(50 - r0 * Math.cos(a)).toFixed(2)}" x2="${(50 + r1 * Math.sin(a)).toFixed(2)}" y2="${(50 - r1 * Math.cos(a)).toFixed(2)}"${major ? ' class="major"' : ""}/>`;
  }).join("");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || NO_REVEAL) return;
  let target = 0, angle = 0, vel = 0, lastMove = 0, raf = 0;
  const fine = matchMedia("(pointer: fine)").matches;
  addEventListener("pointermove", (e) => {
    if (!fine) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    target = Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180 / Math.PI;
    lastMove = performance.now();
  }, { passive: true });
  function tick(now) {
    // a real needle: springy, slightly under-damped, and it never quite sits still
    const idle = now - lastMove > 1800 || !fine;
    const goal = idle ? (fine ? target : now / 40) + Math.sin(now / 900) * 4 + Math.sin(now / 230) * 0.8 : target;
    let d = ((goal - angle + 540) % 360) - 180;
    vel = vel * 0.86 + d * 0.035;
    angle += vel;
    needle.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(tick); });
})();

// ---------- soundtrack: a record that spins while the Spotify player plays ----------
(function soundtrack() {
  if (typeof SOUNDTRACK === "undefined" || !SOUNDTRACK.spotify) return;
  const root = document.getElementById("soundtrack"), disc = document.getElementById("stDisc");
  const panel = document.getElementById("stPanel"), embed = document.getElementById("stEmbed");
  document.getElementById("stTitle").textContent = SOUNDTRACK.title || "";
  document.getElementById("stArtist").textContent = SOUNDTRACK.artist || "";
  const alt = document.getElementById("stAlt");
  if (SOUNDTRACK.youtube) alt.href = `https://www.youtube.com/watch?v=${encodeURIComponent(SOUNDTRACK.youtube)}`;
  else { alt.href = `https://open.spotify.com/track/${encodeURIComponent(SOUNDTRACK.spotify)}`; alt.firstChild.textContent = "Open on Spotify "; }
  root.hidden = false;
  let ctrl = null, loading = false, wantPlay = false;
  const setPlaying = (p) => { root.classList.toggle("playing", p); disc.setAttribute("aria-pressed", String(p)); disc.setAttribute("aria-label", p ? "Pause the soundtrack" : "Play the soundtrack"); };
  function loadPlayer() {
    if (loading) return; loading = true;
    window.onSpotifyIframeApiReady = (API) => {
      API.createController(embed, { uri: `spotify:track:${SOUNDTRACK.spotify}`, width: "100%", height: 80 }, (c) => {
        ctrl = c;
        c.addListener("playback_update", (e) => setPlaying(!e.data.isPaused));
        c.addListener("ready", () => { if (wantPlay) c.play(); });
      });
    };
    const sc = document.createElement("script"); sc.src = "https://open.spotify.com/embed/iframe-api/v1"; sc.async = true;
    document.head.appendChild(sc);
  }
  const open = () => { panel.hidden = false; root.classList.add("open"); };
  disc.addEventListener("click", () => {
    open();
    if (!ctrl) { wantPlay = true; loadPlayer(); return; }
    ctrl.togglePlay();
  });
  document.getElementById("stClose").addEventListener("click", () => { panel.hidden = true; root.classList.remove("open"); });
  if (Q.has("st")) { open(); loadPlayer(); }   // debug: show the player without playing
})();

// ---------- intro: on arrival a run of photographs sweeps across once (nothing follows the mouse) ----------
(function trail() {
  const intro = document.getElementById("hero");
  if (!intro || matchMedia("(prefers-reduced-motion: reduce)").matches || NO_REVEAL) return;
  const layer = document.createElement("div");
  layer.className = "trail"; layer.setAttribute("aria-hidden", "true");
  intro.prepend(layer);
  // preload a shuffled pool so frames never appear blank
  const skip = new Set(typeof TRAIL_SKIP !== "undefined" ? TRAIL_SKIP : []);
  const pool = shuffle(SERIES.filter((s) => !skip.has(s.slug)).flatMap((s) => s.photos)).slice(0, 16).map((p) => {
    const im = new Image(); im.decoding = "async"; im.src = thumbSrc(p); return { p, im };
  });
  let n = 0, z = 0, live = 0;
  function drop(x, y) {
    const ready = pool.filter((o) => o.im.complete && o.im.naturalWidth);
    if (!ready.length || live > 10) return;
    const { p, im } = ready[n++ % ready.length];
    const small = innerWidth < 640;
    let H = small ? 150 : 230, W = H * p.w / p.h;
    const maxW = small ? 190 : 300;
    if (W > maxW) { W = maxW; H = W * p.h / p.w; }
    const el = document.createElement("img");
    el.src = im.src; el.alt = "";
    el.style.cssText = `left:${x}px;top:${y}px;width:${W.toFixed(0)}px;height:${H.toFixed(0)}px;z-index:${++z}`;
    layer.appendChild(el); live++;
    el.addEventListener("animationend", () => { el.remove(); live--; }, { once: true });
  }
  // on arrival: one sweep across the intro, as if someone flipped through the prints
  setTimeout(() => {
    // on phones the intro stacks the contents below the text, so the sweep stays within the text block
    const box = innerWidth < 640 ? intro.querySelector(".intro-text") || intro : intro;
    const W = intro.clientWidth, H = box.offsetHeight, steps = innerWidth < 640 ? 7 : 11;
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        const t = i / (steps - 1);
        drop(W * (0.1 + 0.8 * t), H * (0.7 + 0.08 * Math.sin(t * Math.PI * 1.6)));
      }, i * 115);
    }
  }, 1150);
})();

// ---------- intro parallax (desktop) ----------
const intro = document.getElementById("hero");
if (intro && matchMedia("(min-width: 900px) and (prefers-reduced-motion: no-preference)").matches) {
  let ticking = false;
  const px = () => {
    const y = scrollY, h = intro.offsetHeight || 1;
    intro.style.transform = `translateY(${Math.min(y, h) * 0.18}px)`;
    intro.style.opacity = String(Math.max(0, 1 - y / (h * 1.1)));
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(px); } }, { passive: true });
}

// ---------- topbar + rail scrollspy ----------
const topbar = document.getElementById("topbar");
const progress = document.getElementById("progress");
addEventListener("scroll", () => {
  topbar.classList.toggle("scrolled", scrollY > 8);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}, { passive: true });
const railLinks = rail.querySelectorAll("a");
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    railLinks.forEach((a) => a.classList.toggle("active", a.dataset.series === e.target.dataset.series));
  });
}, { rootMargin: "-35% 0px -60% 0px" });
document.querySelectorAll(".series").forEach((el) => spy.observe(el));

// ---------- theme toggle (circular reveal) ----------
const themeToggle = document.getElementById("themeToggle");
const rootEl = document.documentElement;
const isDark = () => rootEl.dataset.theme === "dark";
const syncToggleIcon = () => document.body.classList.toggle("dark-active", isDark());
function applyTheme(next) {
  rootEl.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
  syncToggleIcon();
}
themeToggle.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) { applyTheme(next); return; }
  const r = themeToggle.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(() => applyTheme(next));
  vt.ready.then(() => rootEl.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
    { duration: 650, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
  ));
});
syncToggleIcon();

// ---------- index overlay ----------
const overlay = document.getElementById("indexOverlay");
const toggle = document.getElementById("indexToggle");
function setOverlay(open) {
  overlay.classList.toggle("open", open);
  overlay.setAttribute("aria-hidden", String(!open));
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "Close" : "Index";
  document.body.classList.toggle("no-scroll", open);
}
toggle.addEventListener("click", () => setOverlay(!overlay.classList.contains("open")));
overlay.addEventListener("click", (e) => { if (e.target.closest("a") || e.target === overlay) setOverlay(false); });

// ---------- scroll reveal ----------
if (Q.has("nohero")) document.getElementById("hero").style.display = "none";
if (Q.has("noatlas")) document.getElementById("atlas").style.display = "none";
if (Q.has("nopassport")) { const pp = document.getElementById("passport"); if (pp) pp.style.display = "none"; }
if (Q.has("from")) document.querySelectorAll(".series").forEach((el, i) => { if (i < Number(Q.get("from"))) el.style.display = "none"; });
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); } });
}, { rootMargin: "0px 0px -5% 0px" });
document.querySelectorAll(".reveal").forEach((el) => (NO_REVEAL ? el.classList.add("visible") : revealObserver.observe(el)));

// ---------- lightbox (navigates within one series) ----------
const lightbox = document.getElementById("lightbox");
const lbMedia = document.getElementById("lbMedia");
const lbTitle = document.getElementById("lbTitle");
const lbMeta = document.getElementById("lbMeta");
const lbExif = document.getElementById("lbExif");
const lbStrip = document.getElementById("lbStrip");
function buildStrip(list) {
  lbStrip.innerHTML = list.map((p, i) =>
    `<button type="button" data-i="${i}" aria-label="${p.video ? "Video" : "Photograph"} ${i + 1}" style="--ar:${p.w} / ${p.h}"${p.video ? ' class="vid"' : ""}><img src="${thumbSrc(p)}" alt="" loading="lazy" decoding="async"></button>`).join("");
}
lbStrip.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showPhoto(Number(b.dataset.i)); });
let lbList = [], current = -1, lastFocus = null;
const preload = (i) => { const im = new Image(); im.src = fullSrc(lbList[(i + lbList.length) % lbList.length]); };
function showPhoto(i, fromCard) {
  current = (i + lbList.length) % lbList.length;
  const photo = lbList[current], s = photo._series;
  if (photo.video) {
    const v = document.createElement("video");
    v.className = "lb-video"; v.controls = true; v.autoplay = true; v.loop = true; v.playsInline = true;
    v.poster = fullSrc(photo); v.src = videoSrc(photo);
    v.width = photo.w; v.height = photo.h;
    lbMedia.innerHTML = ""; lbMedia.appendChild(v);
    requestAnimationFrame(() => v.classList.add("in"));
    v.play().catch(() => {});
  } else {
  // show the (cached) thumbnail at once, then upgrade to the full file
  const img = new Image();
  img.alt = caption(photo) || `${s.title} ${pad2(current + 1)}`;
  img.src = thumbSrc(photo);
  img.width = photo.w; img.height = photo.h;
  lbMedia.innerHTML = ""; lbMedia.appendChild(img);
  if (fromCard) img.style.viewTransitionName = "lb-photo";
  requestAnimationFrame(() => img.classList.add("in"));
  const full = new Image();
  full.onload = () => { if (lbList[current] === photo) img.src = full.src; };
  full.src = fullSrc(photo);
  }
  lbTitle.textContent = photo.title || s.title;
  lbMeta.textContent = [photo.location, s.title, `${current + 1} / ${lbList.length}`].filter(Boolean).join("  ·  ");
  const when = photo.date ? new Date(photo.date + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";
  lbExif.innerHTML = [photo.video && `<span class="cam">Video · ${clock(photo.duration || 0)}</span>`, photo.camera && `<span class="cam">${esc(photo.camera)}</span>`, photo.exif && esc(photo.exif), when]
    .filter(Boolean).join('<span class="sep">·</span>');
  // filmstrip: mark the current frame and keep it in view
  [...lbStrip.children].forEach((b, i) => b.classList.toggle("on", i === current));
  const on = lbStrip.children[current];
  if (on) on.scrollIntoView({ block: "nearest", inline: "center", behavior: lightbox.classList.contains("open") ? "smooth" : "instant" });
  preload(current + 1); preload(current - 1);
}
function openLightbox(list, i, card) {
  if (list !== lbList) buildStrip(list);
  lbList = list; lastFocus = document.activeElement;
  const thumb = card && card.querySelector(".photo-frame img:last-of-type");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doOpen = () => {
    showPhoto(i, !!thumb);
    lightbox.classList.add("open"); lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };
  if (document.startViewTransition && thumb && !reduced) {
    thumb.style.viewTransitionName = "lb-photo";
    lightbox.classList.add("vt");
    const vt = document.startViewTransition(doOpen);
    vt.finished.finally(() => { thumb.style.viewTransitionName = ""; lightbox.classList.remove("vt"); });
  } else doOpen();
  document.getElementById("lbClose").focus();
}
function closeLightbox() {
  lbMedia.querySelectorAll("video").forEach((v) => v.pause());
  lightbox.classList.remove("open"); lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  if (lastFocus) lastFocus.focus();
}
function wireCards(scope) {
  scope.querySelectorAll("[data-slug][data-index]").forEach((card) => {
    const open = () => openLightbox(bySlug[card.dataset.slug].photos, Number(card.dataset.index), card);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
}
wireCards(home);
document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbPrev").addEventListener("click", () => showPhoto(current - 1));
document.getElementById("lbNext").addEventListener("click", () => showPhoto(current + 1));
lightbox.addEventListener("click", (e) => { if (e.target === lightbox || e.target === lbMedia) closeLightbox(); });
document.addEventListener("keydown", (e) => {
  if (overlay.classList.contains("open") && e.key === "Escape") { setOverlay(false); return; }
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showPhoto(current - 1);
  if (e.key === "ArrowRight") showPhoto(current + 1);
});
let touchX = null;
lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
  touchX = null;
}, { passive: true });

// ---------- home: one card quietly swaps every few seconds ----------
(function liveSwap() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const orient = (p) => (p.w >= p.h ? "l" : "p");
  function tick() {
    if (document.hidden || !home || home.hidden || lightbox.classList.contains("open")) return;
    const cards = [...home.querySelectorAll(".photo-card")].filter((c) => {
      const r = c.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && !c.matches(":hover") && !c.classList.contains("swapping") && !c.classList.contains("is-video");
    });
    if (!cards.length) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const s = bySlug[card.dataset.slug];
    const cur = s.photos[Number(card.dataset.index)];
    const shown = new Set([...home.querySelectorAll(`.photo-card[data-slug="${s.slug}"]`)].map((c) => Number(c.dataset.index)));
    const shownTitles = new Set([...shown].filter((i) => i !== cur._index).map((i) => s.photos[i].title));
    let options = poolOf(s).filter((p) => !p.video && !shown.has(p._index) && orient(p) === orient(cur));
    if (options.some((p) => !shownTitles.has(p.title))) options = options.filter((p) => !shownTitles.has(p.title));
    if (!options.length) return;
    const next = options[Math.floor(Math.random() * options.length)];
    const frame = card.querySelector(".photo-frame");
    const old = frame.querySelector("img");
    const cap = card.querySelector(".photo-caption");
    // claim the slot at once so concurrent swaps never pick the same photo
    card.classList.add("swapping");
    card.dataset.index = next._index;
    card.setAttribute("aria-label", `View ${caption(next) || s.title}`);
    const img = new Image();
    img.alt = caption(next) || `${s.title} ${pad2(next._index + 1)}`;
    img.decoding = "async";
    img.className = "swap-in";
    img.src = thumbSrc(next);
    const finish = () => card.classList.remove("swapping");
    (img.decode ? img.decode() : new Promise((r) => { img.onload = r; })).then(() => {
      frame.appendChild(img);
      setTimeout(() => img.classList.add("in"), 40);
      cap.classList.add("fade");
      setTimeout(() => {
        cap.innerHTML = `<span class="t">${esc(next.title || `${s.title} ${pad2(next._index + 1)}`)}</span>${next.location ? `<span class="l">${esc(next.location)}</span>` : ""}`;
        cap.classList.remove("fade");
      }, 350);
      setTimeout(() => { old.remove(); img.className = ""; finish(); }, 2200);
    }).catch(() => { card.dataset.index = cur._index; finish(); });
  }
  setTimeout(() => { tick(); setInterval(tick, 4200); }, 6000);
})();

route();
routedOnce = true;
// debug: ?lb=slug:index opens the lightbox on load (screenshots)
if (Q.has("lb")) { const [sl, ix] = Q.get("lb").split(":"); if (bySlug[sl]) openLightbox(bySlug[sl].photos, Number(ix || 0)); }

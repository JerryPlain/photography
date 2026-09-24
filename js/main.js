// ============================================================
// Render the site from SITE / TAGLINES / HIGHLIGHTS (site.js) + SERIES (data.js)
// Home: intro + contents + a few highlights per series (masonry).
// #/slug: the whole series as a masonry grid.
// ============================================================

const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fullSrc = (p) => `photos/${p.file}`;
const thumbSrc = (p) => { const i = p.file.lastIndexOf("/"); return `photos/${p.file.slice(0, i)}/thumbs/${p.file.slice(i + 1)}`; };
const caption = (p) => [p.title, p.location].filter(Boolean).join(", ");
const PLURALS = { series: "series", photograph: "photographs", place: "places",
                  country: "countries", model: "models", act: "acts", campus: "campuses", site: "sites" };
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
function placesHTML(s, cls) {
  const groups = new Map();
  placesOf(s).forEach((p) => {
    const k = p.location || "";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p.title);
  });
  if ([...groups.values()].reduce((a, v) => a + v.length, 0) < 2) return "";
  const rows = [...groups.entries()].sort((a, b) => (a[0] === "") - (b[0] === "") || b[1].length - a[1].length);
  return `<div class="series-places ${cls}">${rows.map(([label, names]) => `
    <div class="pl${names.length > 5 ? " wide" : ""}">${label ? `<span class="pl-label">${esc(label)}</span>` : ""}<span class="pl-names">${names.map(esc).join('&nbsp;<span class="sep">·</span> ')}</span></div>`).join("")}</div>`;
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
const places = new Set();
SERIES.filter((s) => subjectOf(s) === "place")
  .forEach((s) => s.photos.forEach((p) => p.location && places.add(p.title)));
document.getElementById("introStats").innerHTML =
  `<span class="n" data-n="${TOTAL}">${TOTAL}</span> photographs<span class="dot">·</span><span class="n" data-n="${SERIES.length}">${SERIES.length}</span> series` +
  (places.size ? `<span class="dot">·</span><span class="n" data-n="${places.size}">${places.size}</span> places` : "");
// count the intro numbers up from zero, eased, once fonts are ready
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  const peek = s.photos[Math.floor(Math.random() * s.photos.length)];
  contentsList.insertAdjacentHTML("beforeend",
    `<li class="reveal" style="--d:${300 + i * 55}ms"><a href="#${id}"><span class="num">${s.num}</span><span class="name">${esc(s.title)}</span><span class="count">${n}</span><img class="peek" src="${thumbSrc(peek)}" alt="" loading="lazy" style="--ar:${peek.w} / ${peek.h}"></a></li>`);
  indexList.insertAdjacentHTML("beforeend",
    `<li><a href="#${id}"><span class="num">${s.num}</span>${esc(s.title)}<span class="count">${n}</span></a></li>`);
  rail.insertAdjacentHTML("beforeend",
    `<a href="#${id}" data-series="${i}"><span class="rail-title">${esc(s.title)}</span><span class="rail-num">${s.num}</span></a>`);
});

function masonryHTML(s, photos) {
  return `<div class="masonry">${photos.map((p, i) => `
    <figure class="photo-card reveal" style="--d:${Math.min(i, 8) * 70}ms" data-slug="${s.slug}" data-index="${p._index}" tabindex="0" role="button" aria-label="View ${esc(caption(p) || s.title)}">
      <div class="photo-frame" style="--ar:${p.w} / ${p.h}">
        <img src="${thumbSrc(p)}" alt="${esc(caption(p) || `${s.title} ${pad2(p._index + 1)}`)}" loading="lazy" decoding="async" width="${p.w}" height="${p.h}">
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
      if (el) el.scrollIntoView();
    }
  }
}
addEventListener("hashchange", route);

// ---------- image load state ----------
function watchImages(scope) {
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
document.getElementById("footerLinks").innerHTML = SITE.footerLinks
  .map((l) => `<a href="${esc(l.url)}"${l.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)}</a>`).join("");
document.getElementById("footerCopy").textContent = SITE.copyright;

// ---------- atlas: every place with a photograph, on two map plates ----------
(function atlas() {
  if (typeof MAP === "undefined") return;
  const frame = document.querySelector(".atlas-frame");
  const mapEl = document.getElementById("atlasMap");
  const tip = document.getElementById("atlasTip");
  const stats = document.getElementById("atlasStats");
  // a photograph's place: its title in place series; for concerts the venue city
  const placeOf = (p) => {
    const kind = subjectOf(p._series);
    const n = kind === "place" ? p.title : kind === "act" ? (p.location || "").replace(/\s+\d{4}$/, "") : "";
    return n ? n.normalize("NFC") : "";
  };
  const coords = Object.assign({}, ...MAP.plates.map((pl) => pl.places));
  const byPlace = new Map();
  const missing = new Set();
  SERIES.forEach((s) => s.photos.forEach((p) => {
    const name = placeOf(p);
    if (!name) return;
    if (!coords[name]) { missing.add(name); return; }
    if (!byPlace.has(name)) byPlace.set(name, { name, photos: [], country: subjectOf(p._series) === "place" ? p.location : "" });
    byPlace.get(name).photos.push(p);
  }));
  if (missing.size) console.warn("atlas: no coordinates for", [...missing].join(", "), "— add them in scripts/build_map.py");
  const countries = new Set();
  byPlace.forEach((pl) => pl.photos.forEach((p) => { if (subjectOf(p._series) === "place" && p.location) countries.add(p.location); }));
  stats.innerHTML = `${plural(byPlace.size, "place")}<br>${plural(countries.size, "country")}`;

  // the most photographed places carry a permanent label; the rest name themselves on hover
  const named = new Set([...byPlace.values()].sort((a, b) => b.photos.length - a.photos.length).slice(0, 8).map((p) => p.name));
  ["Lisbon", "Paris", "Berlin", "Santorini", "Bangkok", "Singapore", "Osaka", "Tokyo", "Barcelona", "Dubrovnik"].forEach((n) => byPlace.has(n) && named.add(n));

  const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
  let i = 0;
  mapEl.innerHTML = MAP.plates.map((pl) => {
    const [lon0, lat0, lon1, lat1] = pl.bbox;
    const K = pl.w / ((lon1 - lon0) * Math.PI / 180), TOP = merc(lat1);
    const px = (lon) => ((lon - lon0) * Math.PI / 180) * K, py = (lat) => (TOP - merc(lat)) * K;
    let grat = "";
    for (let lon = Math.ceil(lon0 / 5) * 5; lon <= lon1; lon += 5) grat += `M${px(lon).toFixed(1)},0V${pl.h}`;
    for (let lat = Math.ceil(lat0 / 5) * 5; lat <= lat1; lat += 5) grat += `M0,${py(lat).toFixed(1)}H${pl.w}`;
    const pins = [...byPlace.values()].filter((p) => pl.places[p.name]).sort((a, b) => pl.places[a.name][0] - pl.places[b.name][0]);
    return `
    <div class="plate" style="--w:${pl.w};--h:${pl.h};flex-grow:${(pl.w / pl.h).toFixed(3)}">
      <svg viewBox="0 0 ${pl.w} ${pl.h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(pl.name)}: ${plural(pins.length, "place")}">
        <rect class="sea" width="${pl.w}" height="${pl.h}"/>
        <path class="grat" d="${grat}"/>
        <path class="land" d="${pl.land}"/>
        ${pins.map((p) => {
          const [x, y] = pl.places[p.name], n = p.photos.length;
          const r = 5.5 + Math.min(n, 12) * 0.45;
          const right = x < pl.w * 0.82;
          return `<g transform="translate(${x},${y})"><g class="pin${named.has(p.name) ? " named" : ""}" data-place="${esc(p.name)}" tabindex="0" role="button"
                   aria-label="${esc(p.name)}, ${plural(n, "photograph")}" style="--i:${i++};--j:${i % 5}">
            <circle class="halo" r="6"/>
            <circle class="dot" r="${r.toFixed(1)}"/>
            <text class="lbl" x="${right ? r + 9 : -(r + 9)}" y="7" text-anchor="${right ? "start" : "end"}">${esc(p.name)}</text>
          </g></g>`; }).join("")}
      </svg>
      <span class="plate-name">${esc(pl.name)}</span>
    </div>`;
  }).join("");

  // tooltip follows the hovered pin; click opens that place's photographs
  const tipImg = tip.querySelector("img"), tipB = tip.querySelector("b"), tipS = tip.querySelector("span");
  function showTip(g) {
    const pl = byPlace.get(g.dataset.place);
    const r = g.querySelector(".dot").getBoundingClientRect(), fr = frame.getBoundingClientRect();
    tipImg.src = thumbSrc(pl.photos[0]);
    tipB.textContent = pl.name;
    tipS.textContent = [pl.country, plural(pl.photos.length, "photograph")].filter(Boolean).join(" · ");
    tip.style.left = `${r.left + r.width / 2 - fr.left}px`;
    tip.style.top = `${r.top - fr.top}px`;
    tip.hidden = false;
  }
  mapEl.addEventListener("pointerover", (e) => { const g = e.target.closest(".pin"); if (g) showTip(g); });
  mapEl.addEventListener("pointerout", (e) => { if (e.target.closest(".pin") && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".pin"))) tip.hidden = true; });
  mapEl.addEventListener("focusin", (e) => { const g = e.target.closest(".pin"); if (g) showTip(g); });
  mapEl.addEventListener("focusout", () => { tip.hidden = true; });
  const open = (g) => { const pl = byPlace.get(g.dataset.place); tip.hidden = true; openLightbox(pl.photos, 0, null); };
  mapEl.addEventListener("click", (e) => { const g = e.target.closest(".pin"); if (g) open(g); });
  mapEl.addEventListener("keydown", (e) => { const g = e.target.closest(".pin"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(g); } });
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
addEventListener("scroll", () => topbar.classList.toggle("scrolled", scrollY > 8), { passive: true });
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
    `<button type="button" data-i="${i}" aria-label="Photograph ${i + 1}" style="--ar:${p.w} / ${p.h}"><img src="${thumbSrc(p)}" alt="" loading="lazy" decoding="async"></button>`).join("");
}
lbStrip.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showPhoto(Number(b.dataset.i)); });
let lbList = [], current = -1, lastFocus = null;
const preload = (i) => { const im = new Image(); im.src = fullSrc(lbList[(i + lbList.length) % lbList.length]); };
function showPhoto(i, fromCard) {
  current = (i + lbList.length) % lbList.length;
  const photo = lbList[current], s = photo._series;
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
  lbTitle.textContent = photo.title || s.title;
  lbMeta.textContent = [photo.location, s.title, `${current + 1} / ${lbList.length}`].filter(Boolean).join("  ·  ");
  const when = photo.date ? new Date(photo.date + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";
  lbExif.innerHTML = [photo.camera && `<span class="cam">${esc(photo.camera)}</span>`, photo.exif && esc(photo.exif), when]
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
      return r.bottom > 0 && r.top < innerHeight && !c.matches(":hover") && !c.classList.contains("swapping");
    });
    if (!cards.length) return;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const s = bySlug[card.dataset.slug];
    const cur = s.photos[Number(card.dataset.index)];
    const shown = new Set([...home.querySelectorAll(`.photo-card[data-slug="${s.slug}"]`)].map((c) => Number(c.dataset.index)));
    const shownTitles = new Set([...shown].filter((i) => i !== cur._index).map((i) => s.photos[i].title));
    let options = poolOf(s).filter((p) => !shown.has(p._index) && orient(p) === orient(cur));
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
// debug: ?lb=slug:index opens the lightbox on load (screenshots)
if (Q.has("lb")) { const [sl, ix] = Q.get("lb").split(":"); if (bySlug[sl]) openLightbox(bySlug[sl].photos, Number(ix || 0)); }

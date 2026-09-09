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
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

// debug flags for screenshots: ?noreveal ?nohero ?from=N ?theme=dark
const Q = new URLSearchParams(location.search);
if (Q.get("theme") === "dark") document.documentElement.dataset.theme = "dark";
const NO_REVEAL = Q.has("noreveal");

SERIES.forEach((s, si) => { s.num = pad2(si + 1); s.photos.forEach((p, pi) => { p._series = s; p._index = pi; }); });
const TOTAL = SERIES.reduce((a, s) => a + s.photos.length, 0);
const bySlug = Object.fromEntries(SERIES.map((s) => [s.slug, s]));

function placesOf(s) {
  const seen = new Set(), out = [];
  s.photos.forEach((p) => { if (p.title && !seen.has(p.title)) { seen.add(p.title); out.push(p.title); } });
  return out;
}
function highlightsOf(s) {
  const want = (typeof HIGHLIGHTS !== "undefined" && HIGHLIGHTS[s.slug]) || [];
  const picked = want.map((stem) => s.photos.find((p) => p.src === stem)).filter(Boolean);
  const rest = s.photos.filter((p) => !picked.includes(p));
  return picked.concat(rest).slice(0, Math.min(6, want.length || 4, s.photos.length));
}

// ---------- header / intro ----------
document.getElementById("brandName").textContent = SITE.author;
document.getElementById("homeLink").href = SITE.home;
document.getElementById("introTitle").textContent = SITE.title;
document.getElementById("introStatement").textContent = SITE.statement;
const places = new Set();
SERIES.forEach((s) => s.photos.forEach((p) => p.location && places.add(p.title)));
document.getElementById("introStats").innerHTML =
  `${plural(TOTAL, "photograph")}<span class="dot">·</span>${plural(SERIES.length, "series").replace("seriess", "series")}` +
  (places.size ? `<span class="dot">·</span>${plural(places.size, "place")}` : "");

// ---------- contents / index overlay / rail ----------
const contentsList = document.getElementById("contentsList");
const indexList = document.getElementById("indexList");
const rail = document.getElementById("rail");
SERIES.forEach((s, i) => {
  const id = `series-${s.num}`, n = s.photos.length;
  contentsList.insertAdjacentHTML("beforeend",
    `<li><a href="#${id}"><span class="num">${s.num}</span><span class="name">${esc(s.title)}</span><span class="count">${n}</span></a></li>`);
  indexList.insertAdjacentHTML("beforeend",
    `<li><a href="#${id}"><span class="num">${s.num}</span>${esc(s.title)}<span class="count">${n}</span></a></li>`);
  rail.insertAdjacentHTML("beforeend",
    `<a href="#${id}" data-series="${i}"><span class="rail-title">${esc(s.title)}</span><span class="rail-num">${s.num}</span></a>`);
});

function masonryHTML(s, photos) {
  return `<div class="masonry">${photos.map((p) => `
    <figure class="photo-card" data-slug="${s.slug}" data-index="${p._index}" tabindex="0" role="button" aria-label="View ${esc(caption(p) || s.title)}">
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
      <p class="series-meta">${plural(n, "photograph")}${pl.length > 1 ? `<br>${plural(pl.length, "place")}` : ""}</p>
    </header>
    ${pl.length > 1 ? `<p class="series-places ${cls}">${pl.map(esc).join('&nbsp;<span class="sep">·</span> ')}</p>` : ""}`;
}

// ---------- home: series sections with highlights ----------
const root = document.getElementById("seriesRoot");
SERIES.forEach((s, si) => {
  const picks = highlightsOf(s);
  const section = document.createElement("section");
  section.className = "series"; section.id = `series-${s.num}`; section.dataset.series = si;
  section.innerHTML = `
    ${seriesHead(s, "reveal")}
    <div class="reveal">${masonryHTML(s, picks)}</div>
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
}
function route() {
  const m = location.hash.match(/^#\/([a-z0-9-]+)$/);
  const s = m && bySlug[m[1]];
  if (s) {
    if (pageSlug !== s.slug) { renderSeriesPage(s); pageSlug = s.slug; }
    home.hidden = true; page.hidden = false; rail.hidden = true;
    document.title = `${s.title} — ${SITE.author}`;
    scrollTo({ top: 0, behavior: "instant" });
  } else {
    home.hidden = false; page.hidden = true; rail.hidden = false;
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
let lbList = [], current = -1, lastFocus = null;
const preload = (i) => { const im = new Image(); im.src = fullSrc(lbList[(i + lbList.length) % lbList.length]); };
function showPhoto(i) {
  current = (i + lbList.length) % lbList.length;
  const photo = lbList[current], s = photo._series;
  const img = new Image();
  img.alt = caption(photo) || `${s.title} ${pad2(current + 1)}`;
  img.src = fullSrc(photo);
  const swap = () => { lbMedia.innerHTML = ""; lbMedia.appendChild(img); requestAnimationFrame(() => img.classList.add("in")); };
  if (img.complete) swap(); else { img.onload = swap; img.onerror = swap; }
  lbTitle.textContent = photo.title || s.title;
  lbMeta.textContent = [photo.location, s.title, `${current + 1} / ${lbList.length}`].filter(Boolean).join("  ·  ");
  preload(current + 1); preload(current - 1);
}
function openLightbox(list, i) {
  lbList = list; lastFocus = document.activeElement;
  showPhoto(i);
  lightbox.classList.add("open"); lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  document.getElementById("lbClose").focus();
}
function closeLightbox() {
  lightbox.classList.remove("open"); lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  if (lastFocus) lastFocus.focus();
}
function wireCards(scope) {
  scope.querySelectorAll("[data-slug][data-index]").forEach((card) => {
    const open = () => openLightbox(bySlug[card.dataset.slug].photos, Number(card.dataset.index));
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

route();

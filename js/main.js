// ============================================================
// Render the site from SITE / TAGLINES (site.js) + SERIES (data.js)
// ============================================================

const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fullSrc = (p) => `photos/${p.file}`;
const thumbSrc = (p) => { const i = p.file.lastIndexOf("/"); return `photos/${p.file.slice(0, i)}/thumbs/${p.file.slice(i + 1)}`; };
const caption = (p) => [p.title, p.location].filter(Boolean).join(", ");

// debug flags for screenshots: ?noreveal  ?nohero  ?from=N
const Q = new URLSearchParams(location.search);
if (Q.get("theme") === "dark") document.documentElement.dataset.theme = "dark";

// ---------- flat list for the lightbox ----------
const FLAT = [];
SERIES.forEach((s, si) => s.photos.forEach((p, pi) => { p._flat = FLAT.length; FLAT.push({ series: s, si, photo: p, pi }); }));
const TOTAL = FLAT.length;

// ---------- header / intro ----------
document.getElementById("brandName").textContent = SITE.author;
document.getElementById("homeLink").href = SITE.home;
document.getElementById("introTitle").textContent = SITE.title;
document.getElementById("introStatement").textContent = SITE.statement;
const places = new Set();
SERIES.forEach((s) => s.photos.forEach((p) => p.location && places.add(p.title)));
document.getElementById("introStats").innerHTML =
  `${TOTAL} photographs<span class="dot">·</span>${SERIES.length} series` + (places.size ? `<span class="dot">·</span>${places.size} places` : "");

// ---------- contents / index overlay / rail ----------
const contentsList = document.getElementById("contentsList");
const indexList = document.getElementById("indexList");
const rail = document.getElementById("rail");
SERIES.forEach((s, i) => {
  const id = `series-${pad2(i + 1)}`, n = s.photos.length;
  const li = document.createElement("li");
  li.innerHTML = `<a href="#${id}"><span class="num">${pad2(i + 1)}</span><span class="name">${esc(s.title)}</span><span class="count">${n}</span></a>`;
  contentsList.appendChild(li);
  const li2 = document.createElement("li");
  li2.innerHTML = `<a href="#${id}"><span class="num">${pad2(i + 1)}</span>${esc(s.title)}<span class="count">${n}</span></a>`;
  indexList.appendChild(li2);
  const a = document.createElement("a");
  a.href = `#${id}`; a.dataset.series = i;
  a.innerHTML = `<span class="rail-title">${esc(s.title)}</span><span class="rail-num">${pad2(i + 1)}</span>`;
  rail.appendChild(a);
});

// ---------- series sections ----------
const root = document.getElementById("seriesRoot");
SERIES.forEach((s, si) => {
  const num = pad2(si + 1), n = s.photos.length;
  const seen = new Set(), placeList = [];
  s.photos.forEach((p) => { if (p.title && !seen.has(p.title)) { seen.add(p.title); placeList.push(p.title); } });
  const tag = TAGLINES[s.slug];
  const section = document.createElement("section");
  section.className = "series"; section.id = `series-${num}`; section.dataset.series = si;
  section.innerHTML = `
    <header class="series-head reveal">
      <div>
        <span class="series-num">Series ${num}</span>
        <h2 class="series-title">${esc(s.title)}</h2>
        ${tag ? `<p class="series-tagline">${esc(tag)}</p>` : ""}
      </div>
      <p class="series-meta">${n} photograph${n === 1 ? "" : "s"}${placeList.length > 1 ? `<br>${placeList.length} places` : ""}</p>
    </header>
    ${placeList.length > 1 ? `<p class="series-places reveal">${placeList.map(esc).join('&nbsp;<span class="sep">·</span> ')}</p>` : ""}
    <div class="photo-grid" data-count="${n}">
      ${s.photos.map((p, pi) => `
        <figure class="photo-card" data-flat="${p._flat}" data-ar="${(p.w / p.h).toFixed(4)}" tabindex="0" role="button" aria-label="View ${esc(caption(p) || s.title)}">
          <img src="${thumbSrc(p)}" alt="${esc(caption(p) || `${s.title} ${pad2(pi + 1)}`)}" loading="lazy" decoding="async" width="${p.w}" height="${p.h}">
          <figcaption class="photo-cap">
            <span class="t">${esc(p.title || `${s.title} ${pad2(pi + 1)}`)}</span>
            ${p.location ? `<span class="l">${esc(p.location)}</span>` : ""}
          </figcaption>
        </figure>`).join("")}
    </div>`;
  root.appendChild(section);
});

// ---------- justified rows ----------
function layoutGrid(grid) {
  const W = grid.clientWidth;
  if (!W) return;
  const gap = parseFloat(getComputedStyle(grid).gap) || 10;
  const target = W < 640 ? 160 : W < 1000 ? 210 : 250;
  const maxPer = W < 640 ? 3 : W < 1000 ? 4 : 6;
  const cards = [...grid.children];
  let row = [], sum = 0;
  const apply = (items, h) => items.forEach((c) => {
    const w = Number(c.dataset.ar) * h;
    c.style.width = `${w}px`; c.style.height = `${h}px`;
  });
  cards.forEach((c) => {
    row.push(c); sum += Number(c.dataset.ar);
    const h = (W - gap * (row.length - 1)) / sum;
    if (h <= target || row.length >= maxPer) { apply(row, h); row = []; sum = 0; }
  });
  if (row.length) {
    // last row: don't stretch; a lone photo may sit a little taller
    const cap = row.length === 1 ? target * 1.5 : target;
    apply(row, Math.min(cap, (W - gap * (row.length - 1)) / sum));
  }
}
const grids = document.querySelectorAll(".photo-grid");
const relayout = () => grids.forEach(layoutGrid);
relayout();
let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(relayout, 80); }, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

// ---------- image load state ----------
document.querySelectorAll(".photo-card img").forEach((img) => {
  const done = () => img.closest(".photo-card").classList.add("loaded");
  if (img.complete && img.naturalWidth) done(); else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
});

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
const NO_REVEAL = Q.has("noreveal");
if (Q.has("nohero")) document.getElementById("hero").style.display = "none";
if (Q.has("from")) document.querySelectorAll(".series").forEach((el, i) => { if (i < Number(Q.get("from"))) el.style.display = "none"; });
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); } });
}, { rootMargin: "0px 0px -5% 0px" });
document.querySelectorAll(".reveal").forEach((el) => (NO_REVEAL ? el.classList.add("visible") : revealObserver.observe(el)));

// ---------- lightbox ----------
const lightbox = document.getElementById("lightbox");
const lbMedia = document.getElementById("lbMedia");
const lbTitle = document.getElementById("lbTitle");
const lbMeta = document.getElementById("lbMeta");
let current = -1, lastFocus = null;
const preload = (i) => { const im = new Image(); im.src = fullSrc(FLAT[(i + TOTAL) % TOTAL].photo); };
function showPhoto(i) {
  current = (i + TOTAL) % TOTAL;
  const { series, si, photo, pi } = FLAT[current];
  const img = new Image();
  img.alt = caption(photo) || `${series.title} ${pad2(pi + 1)}`;
  img.src = fullSrc(photo);
  const swap = () => { lbMedia.innerHTML = ""; lbMedia.appendChild(img); requestAnimationFrame(() => img.classList.add("in")); };
  if (img.complete) swap(); else { img.onload = swap; img.onerror = swap; }
  lbTitle.textContent = photo.title || series.title;
  lbMeta.textContent = [photo.location, `${series.title} ${pad2(si + 1)}.${pad2(pi + 1)}`, `${current + 1} / ${TOTAL}`].filter(Boolean).join("  ·  ");
  preload(current + 1); preload(current - 1);
}
function openLightbox(i) {
  lastFocus = document.activeElement;
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
document.querySelectorAll(".photo-card").forEach((card) => {
  const open = () => openLightbox(Number(card.dataset.flat));
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
});
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

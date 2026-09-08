// ============================================================
// Render the monograph from SITE / TAGLINES / SERIES (site.js + data.js)
// ============================================================

const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const fullSrc = (p) => `photos/${p.file}`;
const thumbSrc = (p) => {
  const i = p.file.lastIndexOf("/");
  return `photos/${p.file.slice(0, i)}/thumbs/${p.file.slice(i + 1)}`;
};
const caption = (p) => [p.title, p.location].filter(Boolean).join(", ");

// ---------- flatten photo list for the lightbox ----------
const FLAT = [];
SERIES.forEach((s, si) => {
  s.photos.forEach((p, pi) => {
    p._flat = FLAT.length;
    FLAT.push({ series: s, si, photo: p, pi });
  });
});
const TOTAL = FLAT.length;

// pick the opening image of a series
function leadIndex(s) {
  const want = (LEADS || {})[s.slug];
  if (want) {
    const i = s.photos.findIndex((p) => p.file.includes(want));
    if (i >= 0) return i;
  }
  const i = s.photos.findIndex((p) => p.w >= p.h);
  return i >= 0 ? i : 0;
}

function figureHTML(p, si, pi, cls, i) {
  const ar = `${p.w} / ${p.h}`;
  const plate = `${pad2(si + 1)}.${pad2(pi + 1)}`;
  const right = p.location
    ? `<span class="p-location">${esc(p.location)}</span>`
    : `<span class="p-plate">Plate ${pad2(pi + 1)}</span>`;
  const title = p.title ? `<span class="p-title">${esc(p.title)}</span>` : `<span class="p-title">Untitled</span>`;
  return `
    <figure class="${cls} reveal" data-flat="${p._flat}" tabindex="0" role="button"
            aria-label="View ${esc(p.title || "photograph")}" style="--i:${i}">
      <div class="photo-frame" style="--ar:${ar}">
        <img src="${thumbSrc(p)}" alt="${esc(caption(p) || `Plate ${plate}`)}" loading="lazy" decoding="async" width="${p.w}" height="${p.h}">
      </div>
      <figcaption class="photo-caption">${title}${right}</figcaption>
    </figure>`;
}

// ---------- hero ----------
document.getElementById("wordmark").textContent = SITE.author;
document.getElementById("heroKicker").textContent = SITE.kicker || "Selected Photographs";
document.getElementById("heroAuthor").textContent = SITE.author;
document.getElementById("heroSub").textContent = SITE.subtitle;
document.getElementById("heroStatement").textContent = SITE.statement;
const places = new Set();
SERIES.forEach((s) => s.photos.forEach((p) => p.location && places.add(p.title)));
document.getElementById("heroStats").innerHTML =
  `${TOTAL} photographs<span class="dot">·</span>${SERIES.length} series` +
  (places.size ? `<span class="dot">·</span>${places.size} places` : "");
document.querySelectorAll(".hero .reveal").forEach((el, i) => el.style.setProperty("--i", i));

// ---------- contents + overlay index ----------
const contentsList = document.getElementById("contentsList");
const indexList = document.getElementById("indexList");
SERIES.forEach((s, i) => {
  const id = `series-${pad2(i + 1)}`;
  const n = s.photos.length;
  const tag = TAGLINES[s.slug] || "";
  const li1 = document.createElement("li");
  li1.innerHTML = `
    <a href="#${id}" data-series="${i}">
      <span class="num">${pad2(i + 1)}</span>
      <span class="name">${esc(s.title)}${tag ? `<span class="tag">${esc(tag)}</span>` : ""}</span>
      <span class="count">${n} photograph${n === 1 ? "" : "s"}</span>
    </a>`;
  contentsList.appendChild(li1);
  const li2 = document.createElement("li");
  li2.style.transitionDelay = `${80 + i * 45}ms`;
  li2.innerHTML = `<span class="num">${pad2(i + 1)}</span><a href="#${id}">${esc(s.title)}</a><span class="count">${n}</span>`;
  indexList.appendChild(li2);
});
document.getElementById("indexFoot").textContent = `${TOTAL} photographs · ${SERIES.length} series`;

// ---------- series sections ----------
const root = document.getElementById("seriesRoot");
SERIES.forEach((s, si) => {
  const num = pad2(si + 1);
  const section = document.createElement("section");
  section.className = "series";
  section.id = `series-${num}`;
  section.dataset.series = si;

  const li = leadIndex(s);
  const lead = s.photos[li];
  const rest = s.photos.filter((_, i) => i !== li);
  const n = s.photos.length;

  // unique titled places, in order
  const seen = new Set();
  const placeList = [];
  s.photos.forEach((p) => { if (p.title && !seen.has(p.title)) { seen.add(p.title); placeList.push(p.title); } });
  const placesHTML = placeList.length > 1
    ? `<p class="series-places reveal">${placeList.map(esc).join('&nbsp;<span class="sep">·</span> ')}</p>`
    : "";
  const tag = TAGLINES[s.slug];

  section.innerHTML = `
    <header class="series-head">
      <span class="series-ghost" aria-hidden="true">${num}</span>
      <div class="reveal">
        <span class="series-num">Series ${num}</span>
        <h2 class="series-title">${esc(s.title)}</h2>
        ${tag ? `<p class="series-tagline">${esc(tag)}</p>` : ""}
      </div>
      <p class="series-meta reveal">${n} photograph${n === 1 ? "" : "s"}${placeList.length > 1 ? `<br>${placeList.length} places` : ""}</p>
    </header>
    ${placesHTML}
    ${figureHTML(lead, si, li, `lead${lead.w < lead.h ? " portrait" : ""}`, 0)}
    ${rest.length ? `<div class="photo-grid">${rest.map((p, i) => figureHTML(p, si, s.photos.indexOf(p), "photo-card", i)).join("")}</div>` : ""}`;
  root.appendChild(section);
});

// ---------- image load state ----------
document.querySelectorAll(".photo-frame img").forEach((img) => {
  const done = () => img.closest(".photo-frame").classList.add("loaded");
  if (img.complete && img.naturalWidth) done(); else img.addEventListener("load", done, { once: true });
  img.addEventListener("error", done, { once: true });
});

// ---------- footer ----------
document.getElementById("footerName").textContent = SITE.author;
document.getElementById("footerStatement").textContent = SITE.statement;
document.getElementById("footerLinks").innerHTML = SITE.footerLinks
  .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
  .join("");
document.getElementById("footerCopy").textContent = SITE.copyright;

// ---------- topbar: scrolled state + current series ----------
const topbar = document.getElementById("topbar");
const topbarNow = document.getElementById("topbarNow");
addEventListener("scroll", () => topbar.classList.toggle("scrolled", scrollY > innerHeight * 0.6), { passive: true });

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const s = SERIES[Number(e.target.dataset.series)];
    topbarNow.innerHTML = `<span class="n">${pad2(Number(e.target.dataset.series) + 1)}</span>${esc(s.title)}`;
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll(".series").forEach((el) => sectionObserver.observe(el));

// ---------- contents hover preview ----------
const peek = document.getElementById("peek");
const peekImg = peek.querySelector("img");
let peekX = 0, peekY = 0, peekTX = 0, peekTY = 0, peekRaf = 0;
function peekLoop() {
  peekX += (peekTX - peekX) * 0.14;
  peekY += (peekTY - peekY) * 0.14;
  peek.style.transform = `translate(${peekX}px, ${peekY}px) translate(-50%, -50%)`;
  if (peek.classList.contains("on") || Math.abs(peekTX - peekX) > 0.5) peekRaf = requestAnimationFrame(peekLoop);
}
contentsList.querySelectorAll("a").forEach((a) => {
  const s = SERIES[Number(a.dataset.series)];
  const p = s.photos[leadIndex(s)];
  a.addEventListener("pointerenter", (e) => {
    peekImg.src = thumbSrc(p);
    peekTX = peekX = e.clientX + 120; peekTY = peekY = e.clientY;
    peek.classList.add("on");
    cancelAnimationFrame(peekRaf); peekLoop();
  });
  a.addEventListener("pointermove", (e) => { peekTX = e.clientX + 120; peekTY = e.clientY; });
  a.addEventListener("pointerleave", () => peek.classList.remove("on"));
});

// ---------- theme toggle (circular reveal) ----------
const themeToggle = document.getElementById("themeToggle");
const rootEl = document.documentElement;
const isDark = () => rootEl.dataset.theme !== "light";
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
  const rect = themeToggle.getBoundingClientRect();
  const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(() => applyTheme(next));
  vt.ready.then(() => {
    rootEl.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 700, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
});
syncToggleIcon();

// ---------- index overlay ----------
const overlay = document.getElementById("indexOverlay");
const toggle = document.getElementById("indexToggle");
function setOverlay(open) {
  overlay.classList.toggle("open", open);
  overlay.setAttribute("aria-hidden", String(!open));
  toggle.setAttribute("aria-expanded", String(open));
  toggle.querySelector(".index-toggle-label").textContent = open ? "Close" : "Index";
  document.body.classList.toggle("no-scroll", open);
}
toggle.addEventListener("click", () => setOverlay(!overlay.classList.contains("open")));
overlay.addEventListener("click", (e) => { if (e.target.closest("a") || e.target === overlay) setOverlay(false); });

// ---------- scroll reveal ----------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visible"); revealObserver.unobserve(e.target); }
  });
}, { rootMargin: "0px 0px -6% 0px" });
// debug flags for screenshots: ?noreveal  ?nohero  ?from=N (hide series before N)
const Q = new URLSearchParams(location.search);
const NO_REVEAL = Q.has("noreveal");
if (Q.has("nohero")) document.getElementById("hero").style.display = "none";
if (Q.has("from")) document.querySelectorAll(".series").forEach((el, i) => { if (i < Number(Q.get("from"))) el.style.display = "none"; });
document.querySelectorAll(".reveal").forEach((el) => (NO_REVEAL ? el.classList.add("visible") : revealObserver.observe(el)));

// ---------- lightbox ----------
const lightbox = document.getElementById("lightbox");
const lbMedia = document.getElementById("lbMedia");
const lbTitle = document.getElementById("lbTitle");
const lbMeta = document.getElementById("lbMeta");
let current = -1;
let lastFocus = null;

function preload(i) {
  const { photo } = FLAT[(i + TOTAL) % TOTAL];
  const im = new Image(); im.src = fullSrc(photo);
}

function showPhoto(i) {
  current = (i + TOTAL) % TOTAL;
  const { series, si, photo, pi } = FLAT[current];
  const img = new Image();
  img.alt = caption(photo) || `Plate ${pad2(pi + 1)}`;
  img.src = fullSrc(photo);
  const swap = () => {
    lbMedia.innerHTML = "";
    lbMedia.appendChild(img);
    requestAnimationFrame(() => img.classList.add("in"));
  };
  if (img.complete) swap(); else { img.onload = swap; img.onerror = swap; }
  lbTitle.textContent = photo.title || series.title;
  lbMeta.textContent = [photo.location, `${pad2(si + 1)}.${pad2(pi + 1)}`, `${current + 1} / ${TOTAL}`].filter(Boolean).join("  ·  ");
  preload(current + 1); preload(current - 1);
}
function openLightbox(i) {
  lastFocus = document.activeElement;
  showPhoto(i);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  document.getElementById("lbClose").focus();
}
function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  if (lastFocus) lastFocus.focus();
}

document.querySelectorAll("[data-flat]").forEach((card) => {
  const open = () => openLightbox(Number(card.dataset.flat));
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });
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

// swipe
let touchX = null;
lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) showPhoto(current + (dx < 0 ? 1 : -1));
  touchX = null;
}, { passive: true });

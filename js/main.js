// ============================================================
// Render the monograph from SITE / SERIES data (see data.js)
// ============================================================

const pad2 = (n) => String(n).padStart(2, "0");

// Varied aspect ratios so the placeholder grid feels like real photos
const RATIOS = [
  [3, 2],
  [4, 5],
  [1, 1],
  [16, 10],
  [2, 3],
];

function placeholderSVG(seriesNum, photo, idx) {
  const [w, h] = RATIOS[idx % RATIOS.length];
  const W = w * 120;
  const H = h * 120;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${photo.title}">
      <rect width="${W}" height="${H}" fill="var(--paper)"/>
      <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="var(--hairline)"/>
      <text x="50%" y="47%" text-anchor="middle" fill="var(--ink-soft)"
            font-family="Helvetica Neue, Arial, sans-serif" font-size="${Math.round(W * 0.028)}"
            letter-spacing="4" style="text-transform:uppercase">${seriesNum} · ${photo.title}</text>
      <text x="50%" y="55%" text-anchor="middle" fill="var(--ink-soft)" opacity="0.55"
            font-family="Helvetica Neue, Arial, sans-serif" font-size="${Math.round(W * 0.02)}"
            letter-spacing="3">PHOTOGRAPH FORTHCOMING</text>
    </svg>`;
}

function mediaHTML(series, seriesIdx, photo, photoIdx) {
  if (photo.file) {
    const cap = [photo.title, photo.location].filter(Boolean).join(", ");
    return `<img src="photos/${photo.file}" alt="${cap}" loading="lazy">`;
  }
  return placeholderSVG(pad2(seriesIdx + 1), photo, photoIdx);
}

// ---------- flatten photo list for the lightbox ----------
const FLAT = [];
SERIES.forEach((s, si) => {
  s.photos.forEach((p, pi) => FLAT.push({ series: s, si, photo: p, pi }));
});

// ---------- hero ----------
document.getElementById("heroAuthor").textContent = SITE.author;
document.getElementById("heroSub").textContent = SITE.subtitle;
document.getElementById("heroStatement").textContent = SITE.statement;
document.getElementById("heroStats").textContent =
  `${FLAT.length} photographs · ${SERIES.length} series`;

// ---------- contents + overlay index ----------
const contentsList = document.getElementById("contentsList");
const indexList = document.getElementById("indexList");
SERIES.forEach((s, i) => {
  const id = `series-${pad2(i + 1)}`;
  const item = `<span class="num">${pad2(i + 1)}</span><a href="#${id}">${s.title}</a>`;
  const li1 = document.createElement("li");
  li1.innerHTML = item;
  contentsList.appendChild(li1);
  const li2 = document.createElement("li");
  li2.innerHTML = item;
  indexList.appendChild(li2);
});

// ---------- series sections ----------
const root = document.getElementById("seriesRoot");
let flatCursor = 0;
SERIES.forEach((s, si) => {
  const num = pad2(si + 1);
  const section = document.createElement("section");
  section.className = "series";
  section.id = `series-${num}`;

  const grid = s.photos
    .map((p, pi) => {
      const flatIndex = flatCursor++;
      return `
        <figure class="photo-card reveal" data-flat="${flatIndex}" tabindex="0" role="button"
                aria-label="View ${p.title}">
          <div class="photo-frame">${mediaHTML(s, si, p, pi)}</div>
          <figcaption class="photo-caption">
            <div class="p-title">${p.title}</div>
            ${p.location ? `<div class="p-location">${p.location}</div>` : ""}
          </figcaption>
        </figure>`;
    })
    .join("");

  section.innerHTML = `
    <div class="series-head reveal">
      <span class="series-num">${num}</span>
      <h2 class="series-title">${s.title}</h2>
    </div>
    <p class="series-tagline reveal">${s.tagline}</p>
    <p class="series-count reveal">${s.photos.length} photograph${s.photos.length === 1 ? "" : "s"}</p>
    <div class="photo-grid">${grid}</div>`;
  root.appendChild(section);
});

// ---------- footer ----------
document.getElementById("footerName").textContent = SITE.author;
document.getElementById("footerLinks").innerHTML = SITE.footerLinks
  .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`)
  .join("");
document.getElementById("footerCopy").textContent = SITE.copyright;

// ---------- theme toggle (circular reveal) ----------
const themeToggle = document.getElementById("themeToggle");
const rootEl = document.documentElement;

function isDark() {
  return rootEl.dataset.theme !== "light"; // 默认深色
}

function syncToggleIcon() {
  document.body.classList.toggle("dark-active", isDark());
}

function applyTheme(next) {
  rootEl.dataset.theme = next;
  localStorage.setItem("theme", next);
  syncToggleIcon();
}

themeToggle.addEventListener("click", (e) => {
  const next = isDark() ? "light" : "dark";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || reduced) {
    applyTheme(next);
    return;
  }

  // 以按钮为圆心，向全屏扩散揭开新主题
  const rect = themeToggle.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  );

  const vt = document.startViewTransition(() => applyTheme(next));
  vt.ready.then(() => {
    rootEl.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 650,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  });
});

syncToggleIcon();

// ---------- index overlay toggle ----------
const overlay = document.getElementById("indexOverlay");
const toggle = document.getElementById("indexToggle");
function setOverlay(open) {
  overlay.classList.toggle("open", open);
  overlay.setAttribute("aria-hidden", String(!open));
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "Close" : "Index";
}
toggle.addEventListener("click", () => setOverlay(!overlay.classList.contains("open")));
overlay.addEventListener("click", (e) => {
  if (e.target.closest("a")) setOverlay(false);
});

// ---------- scroll reveal ----------
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  },
  { rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ---------- lightbox ----------
const lightbox = document.getElementById("lightbox");
const lbMedia = document.getElementById("lbMedia");
const lbCaption = document.getElementById("lbCaption");
let current = -1;

function showPhoto(i) {
  current = (i + FLAT.length) % FLAT.length;
  const { series, si, photo, pi } = FLAT[current];
  lbMedia.innerHTML = mediaHTML(series, si, photo, pi);
  lbCaption.textContent = [photo.title, photo.location].filter(Boolean).join(" — ");
}

function openLightbox(i) {
  showPhoto(i);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll(".photo-card").forEach((card) => {
  const open = () => openLightbox(Number(card.dataset.flat));
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
});

document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbPrev").addEventListener("click", () => showPhoto(current - 1));
document.getElementById("lbNext").addEventListener("click", () => showPhoto(current + 1));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showPhoto(current - 1);
  if (e.key === "ArrowRight") showPhoto(current + 1);
});

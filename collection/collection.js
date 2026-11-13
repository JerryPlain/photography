// ============================================================
// The Collection: a curated, downloadable, tip-able gallery.
// Reads SERIES (../js/data.js) and COLLECTION (config.js).
// ============================================================
(function () {
  const C = COLLECTION;
  const Q = new URLSearchParams(location.search);
  if (Q.get("theme") === "dark") document.documentElement.dataset.theme = "dark";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const slug = (s) => String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const full = (p) => `../photos/${p.file}`;
  const thumb = (p) => { const i = p.file.lastIndexOf("/"); return `../photos/${p.file.slice(0, i)}/thumbs/${p.file.slice(i + 1)}`; };
  const month = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";

  // ---- resolve picks against the library ----
  // picks come from the Collection folder on disk (picks.js); config.js picks are the fallback
  const bySrc = new Map();
  SERIES.forEach((s) => s.photos.forEach((p) => { if (!p.video) bySrc.set(p.src, { ...p, series: s.slug }); }));
  const items = [];
  const missing = [];
  const source = typeof COLLECTION_PICKS !== "undefined" && COLLECTION_PICKS.length
    ? COLLECTION_PICKS.map((e) => [e, e.topic])
    : C.picks.map(([src, topic]) => [bySrc.get(src) || src, topic]);
  source.forEach(([p, topic]) => {
    if (typeof p === "string") { missing.push(p); return; }
    const where = [p.title, p.location].filter(Boolean).join(", ");
    items.push({ ...p, topic, id: `${slug(p.title)}-${p.file.match(/-([0-9a-f]{8})\.jpg$/)[1]}`, where });
  });
  if (missing.length) console.warn("collection: not in the library any more:", missing.join(", "));
  const byId = new Map(items.map((p) => [p.id, p]));

  // ---- hero, stats, license, footer ----
  document.getElementById("clTitle").textContent = C.title;
  document.getElementById("clLede").textContent = C.lede;
  const places = new Set(items.map((p) => p.title)), countries = new Set(items.map((p) => p.location).filter(Boolean));
  document.getElementById("clStats").innerHTML =
    `<b>${items.length}</b> photographs<span class="dot">·</span><b>${places.size}</b> places<span class="dot">·</span><b>${countries.size}</b> countries<span class="dot">·</span>${esc(C.license.name)}`;
  document.getElementById("licName").innerHTML = `<a href="${esc(C.license.url)}" target="_blank" rel="noopener">${esc(C.license.name)}</a>`;
  document.getElementById("licShort").textContent = C.license.short;
  document.getElementById("licCommercial").innerHTML = `${esc(C.license.commercial)} <a href="mailto:${esc(C.contact)}?subject=${encodeURIComponent("Licensing a photograph")}">${esc(C.contact)}</a>`;
  document.getElementById("footerMail").href = `mailto:${C.contact}`;
  document.getElementById("footerCopy").textContent = `© ${new Date().getFullYear()} Shijie Zhou · ${C.license.name}`;

  // ---- support: buy me a coffee ----
  const SUP = C.support || {}, methods = (SUP.methods || []).filter((m) => m && (m.url || m.qr));
  const CUP = `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 4.5c0 1 1 1.2 1 2.2M11.5 4.5c0 1 1 1.2 1 2.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const supportBtn = document.getElementById("clSupportBtn");
  if (methods.length) supportBtn.innerHTML = `${CUP}${esc(SUP.title || "Buy me a coffee")}`; else supportBtn.remove();
  function supportHTML() {
    return `<div class="cl-cup" aria-hidden="true">${CUP}</div>
      <h3 class="cl-h3">${esc(SUP.title || "Buy me a coffee")}</h3>
      <p class="cl-p">${esc(SUP.text || "")}</p>
      <div class="cl-methods">${methods.map((m, i) => m.url
        ? `<a class="cl-method" href="${esc(m.url)}" target="_blank" rel="noopener"><span class="m-label">${esc(m.label)}</span><span class="m-note">${esc(m.note || "")}</span><span class="m-go" aria-hidden="true">↗</span></a>`
        : `<button class="cl-method" type="button" data-qr="${i}"><span class="m-label">${esc(m.label)}</span><span class="m-note">${esc(m.note || "")}</span><span class="m-go" aria-hidden="true">⌗</span></button>`).join("")}</div>
      <div class="cl-qr" id="qrBox" hidden></div>`;
  }
  const supportEl = document.getElementById("support"), supportBody = document.getElementById("supportBody");
  function openSupport() {
    if (!methods.length) return;
    supportBody.innerHTML = supportHTML();
    supportEl.hidden = false; requestAnimationFrame(() => supportEl.classList.add("on"));
    document.body.classList.add("no-scroll");
  }
  function closeSupport() {
    supportEl.classList.remove("on"); setTimeout(() => { supportEl.hidden = true; }, 250);
    if (sheet.hidden) document.body.classList.remove("no-scroll");
  }
  supportBtn.addEventListener("click", openSupport);
  document.getElementById("supportClose").addEventListener("click", closeSupport);
  supportEl.addEventListener("click", (e) => {
    if (e.target === supportEl) closeSupport();
    const q = e.target.closest("[data-qr]");
    if (q) {
      const m = methods[Number(q.dataset.qr)], box = document.getElementById("qrBox");
      box.innerHTML = `<img src="${esc(m.qr)}" alt="${esc(m.label)} QR code"><span>${esc(m.label)} · scan to send</span>`;
      box.hidden = false;
    }
  });

  // ---- topics + grid ----
  const topics = document.getElementById("clTopics"), grid = document.getElementById("clGrid");
  grid.dataset.n = items.length <= 4 ? "few" : items.length <= 9 ? "some" : "many";
  if (items.length < 9) topics.hidden = true;
  const counts = items.reduce((a, p) => (a[p.topic] = (a[p.topic] || 0) + 1, a), {});
  topics.innerHTML = [["all", "All", items.length], ...Object.entries(C.topics).map(([k, v]) => [k, v, counts[k] || 0])]
    .filter(([, , n]) => n).map(([k, v, n], i) =>
      `<button class="cl-topic" type="button" role="tab" data-t="${k}" aria-selected="${i === 0}">${esc(v)}<span>${n}</span></button>`).join("");
  const dlName = (p) => `shijie-zhou-${slug(p.title)}-${p.id.slice(-8)}.jpg`;
  const DL = `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function cardHTML(p, i) { return `
      <figure class="cl-card" data-id="${p.id}" style="--ar:${p.w} / ${p.h};--i:${Math.min(i, 12)}" tabindex="0" role="button" aria-label="${esc(p.where)}">
        <img src="${thumb(p)}" alt="${esc(p.where)}" loading="${i < 6 ? "eager" : "lazy"}"${i < 3 ? ' fetchpriority="high"' : ""} decoding="async" width="${p.w}" height="${p.h}">
        <figcaption class="cl-cap">
          <span class="cl-cap-t"><b>${esc(p.title)}</b>${p.location ? `<i>${esc(p.location)}</i>` : ""}</span>
          <a class="cl-dl" href="${full(p)}" download="${dlName(p)}" aria-label="Download ${esc(p.title)}" title="Download">${DL}</a>
        </figcaption>
      </figure>`; }
  function renderGrid(t) {
    const list = items.filter((p) => t === "all" || p.topic === t);
    if (grid.dataset.n === "few") {
      // a handful: justified rows of two, every photograph at its own shape and the same height per row
      const rows = [];
      for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
      grid.innerHTML = rows.map((r, ri) => `<div class="cl-row">${r.map((p, j) => cardHTML(p, ri * 2 + j)).join("")}</div>`).join("");
      grid.querySelectorAll(".cl-card").forEach((c) => { const p = byId.get(c.dataset.id); c.style.flexGrow = (p.w / p.h).toFixed(4); });
      // no row taller than ~72% of the screen: narrow and centre it instead
      grid.querySelectorAll(".cl-row").forEach((row) => {
        const sum = [...row.children].reduce((a, c) => a + Number(c.style.flexGrow), 0);
        row.style.maxWidth = `calc(72vh * ${sum.toFixed(4)} + ${row.children.length - 1}rem)`;
      });
    } else grid.innerHTML = list.map(cardHTML).join("");
    grid.querySelectorAll("img").forEach((im) => { const done = () => im.closest(".cl-card").classList.add("loaded"); im.complete && im.naturalWidth ? done() : im.addEventListener("load", done, { once: true }); });
  }
  let topic = "all"; renderGrid(topic);
  topics.addEventListener("click", (e) => {
    const b = e.target.closest(".cl-topic"); if (!b || b.dataset.t === topic) return;
    topic = b.dataset.t; topics.querySelectorAll(".cl-topic").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    grid.classList.add("fade"); setTimeout(() => { renderGrid(topic); grid.classList.remove("fade"); }, 180);
  });
  grid.addEventListener("click", (e) => {
    if (e.target.closest(".cl-dl")) return;            // download straight away
    const c = e.target.closest(".cl-card"); if (c) openSheet(c.dataset.id);
  });
  grid.addEventListener("keydown", (e) => { const c = e.target.closest(".cl-card"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openSheet(c.dataset.id); } });

  // ---- photo sheet ----
  const sheet = document.getElementById("sheet"), media = document.getElementById("sheetMedia"), info = document.getElementById("sheetInfo");
  let cur = null;
  const visible = () => items.filter((p) => topic === "all" || p.topic === topic);
  function fill(p) {
    cur = p;
    media.innerHTML = `<img src="${thumb(p)}" alt="${esc(p.where)}" width="${p.w}" height="${p.h}">`;
    const im = media.querySelector("img"), hi = new Image();
    hi.onload = () => { if (cur === p) im.src = hi.src; }; hi.src = full(p);
    info.innerHTML = `
      <p class="eyebrow">${esc(C.topics[p.topic] || "")}</p>
      <h2 class="cl-h2">${esc(p.title)}</h2>
      <p class="cl-where">${esc(p.location || "")}${p.date ? ` · ${month(p.date)}` : ""}</p>
      <a class="cl-btn primary wide" href="${full(p)}" download="${dlName(p)}">${DL}Download<span class="cl-btn-note">JPEG · ${p.w} × ${p.h}</span></a>
      ${methods.length ? `<button class="cl-btn wide" type="button" data-support>${CUP}${esc(SUP.title || "Buy me a coffee")}</button>` : ""}
      ${p.camera || p.exif ? `<dl class="cl-exif">${p.camera ? `<div><dt>Camera</dt><dd>${esc(p.camera)}</dd></div>` : ""}${p.exif ? `<div><dt>Settings</dt><dd>${esc(p.exif)}</dd></div>` : ""}</dl>` : ""}
      <div class="cl-lic">
        <p><a href="${esc(C.license.url)}" target="_blank" rel="noopener">${esc(C.license.name)}</a> · ${esc(C.license.short)}</p>
        <button class="cl-link" type="button" data-share>Copy link to this photo</button>
      </div>`;
    history.replaceState(null, "", `#${p.id}`);
  }
  function openSheet(id) {
    const p = byId.get(id); if (!p) return;
    fill(p);
    sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add("on"));
    document.body.classList.add("no-scroll");
  }
  function closeSheet() {
    sheet.classList.remove("on"); setTimeout(() => { sheet.hidden = true; }, 250);
    document.body.classList.remove("no-scroll");
    history.replaceState(null, "", location.pathname + location.search);
  }
  const step = (d) => { const v = visible(), i = v.indexOf(cur); fill(v[(i + d + v.length) % v.length]); };
  document.getElementById("sheetClose").addEventListener("click", closeSheet);
  document.getElementById("sheetPrev").addEventListener("click", () => step(-1));
  document.getElementById("sheetNext").addEventListener("click", () => step(1));
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet || e.target === media) closeSheet();
    if (e.target.closest("[data-support]")) openSupport();
    if (e.target.closest("[data-share]")) copy(location.href, e.target.closest("[data-share]"), "Link copied");
  });
  document.addEventListener("keydown", (e) => {
    if (!supportEl.hidden && e.key === "Escape") { closeSupport(); return; }
    if (sheet.hidden) return;
    if (e.key === "Escape") closeSheet();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  let tx = null;
  sheet.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  sheet.addEventListener("touchend", (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; }, { passive: true });

  // ---- copy helpers ----
  function copy(text, btn, done) {
    const ok = () => { const t = btn.textContent; btn.textContent = done; btn.classList.add("ok"); setTimeout(() => { btn.textContent = t; btn.classList.remove("ok"); }, 1400); };
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(ok, () => {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) {} ta.remove();
    });
  }

  // ---- theme toggle (same key as the main site) ----
  const root = document.documentElement, tt = document.getElementById("themeToggle");
  const sync = () => document.body.classList.toggle("dark-active", root.dataset.theme === "dark");
  tt.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next; try { localStorage.setItem("theme", next); } catch (e) {}
    sync();
  });
  sync();
  const topbar = document.getElementById("topbar");
  addEventListener("scroll", () => topbar.classList.toggle("scrolled", scrollY > 8), { passive: true });
  topbar.classList.toggle("scrolled", scrollY > 8);

  // deep link: /collection/#<photo-id>
  if (location.hash && byId.has(location.hash.slice(1))) openSheet(location.hash.slice(1));
  if (Q.has("support")) openSupport();
})();

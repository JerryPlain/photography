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
  const bySrc = new Map();
  SERIES.forEach((s) => s.photos.forEach((p) => { if (!p.video) bySrc.set(p.src, { ...p, series: s.slug }); }));
  const items = [];
  const missing = [];
  C.picks.forEach(([src, topic]) => {
    const p = bySrc.get(src);
    if (!p) { missing.push(src); return; }
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
  document.getElementById("creditLine").textContent = C.credit;
  document.getElementById("footerMail").href = `mailto:${C.contact}`;
  document.getElementById("footerCopy").textContent = `© ${new Date().getFullYear()} Shijie Zhou · ${C.license.name}`;

  // ---- support: tip methods from config, or a plain "say thanks" ----
  const methods = (Q.has("tipsdemo") ? [
    { label: "Buy me a coffee", note: "Card · Apple Pay · PayPal", url: "#" },
    { label: "PayPal", note: "Any amount", url: "#" },
    { label: "WeChat", note: "微信赞赏", qr: "" },
  ] : C.support || []).filter((m) => m && (m.url || m.qr !== undefined));
  const supportBtn = document.getElementById("clSupportBtn");
  supportBtn.innerHTML = methods.length
    ? `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z" fill="currentColor"/></svg>Support my work`
    : `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z" fill="currentColor"/></svg>Say thanks`;
  function supportHTML(photo) {
    const head = `<p class="eyebrow">Support</p><h3 class="cl-h3">${photo ? `Enjoyed <em>${esc(photo.title)}</em>?` : "Keep the shutter clicking"}</h3>
      <p class="cl-p">Every photograph here is free. If one found its way into your work or your day, a coffee goes straight into the next trip.</p>`;
    const list = methods.length ? `<div class="cl-methods">${methods.map((m, i) => m.url
      ? `<a class="cl-method" href="${esc(m.url)}" target="_blank" rel="noopener"><span class="m-label">${esc(m.label)}</span><span class="m-note">${esc(m.note || "")}</span><span class="m-go" aria-hidden="true">↗</span></a>`
      : `<button class="cl-method" type="button" data-qr="${i}"><span class="m-label">${esc(m.label)}</span><span class="m-note">${esc(m.note || "")}</span><span class="m-go" aria-hidden="true">⌗</span></button>`).join("")}</div><div class="cl-qr" id="qrBox" hidden></div>`
      : "";
    const thanks = `<a class="cl-method soft" href="mailto:${esc(C.contact)}?subject=${encodeURIComponent(photo ? `About “${photo.title}”` : "About your photographs")}"><span class="m-label">Say thanks</span><span class="m-note">Tell me where a photo ended up</span><span class="m-go" aria-hidden="true">✉</span></a>`;
    return head + list + `<div class="cl-methods">${thanks}</div>`;
  }
  const supportEl = document.getElementById("support"), supportBody = document.getElementById("supportBody");
  function openSupport(photo) {
    supportBody.innerHTML = supportHTML(photo);
    supportEl.hidden = false; requestAnimationFrame(() => supportEl.classList.add("on"));
    document.body.classList.add("no-scroll");
  }
  function closeSupport() {
    supportEl.classList.remove("on"); setTimeout(() => { supportEl.hidden = true; }, 250);
    if (sheet.hidden) document.body.classList.remove("no-scroll");
  }
  supportBtn.addEventListener("click", () => openSupport(null));
  document.getElementById("supportClose").addEventListener("click", closeSupport);
  supportEl.addEventListener("click", (e) => {
    if (e.target === supportEl) closeSupport();
    const q = e.target.closest("[data-qr]");
    if (q) {
      const m = methods[Number(q.dataset.qr)], box = document.getElementById("qrBox");
      box.innerHTML = m.qr ? `<img src="${esc(m.qr)}" alt="${esc(m.label)} QR code"><span>${esc(m.label)} · scan to send</span>` : `<span>QR code goes here</span>`;
      box.hidden = false;
    }
  });

  // ---- topics + grid ----
  const topics = document.getElementById("clTopics"), grid = document.getElementById("clGrid");
  const counts = items.reduce((a, p) => (a[p.topic] = (a[p.topic] || 0) + 1, a), {});
  topics.innerHTML = [["all", "All", items.length], ...Object.entries(C.topics).map(([k, v]) => [k, v, counts[k] || 0])]
    .filter(([, , n]) => n).map(([k, v, n], i) =>
      `<button class="cl-topic" type="button" role="tab" data-t="${k}" aria-selected="${i === 0}">${esc(v)}<span>${n}</span></button>`).join("");
  const dlName = (p) => `shijie-zhou-${slug(p.title)}-${p.id.slice(-8)}.jpg`;
  const DL = `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function renderGrid(t) {
    const list = items.filter((p) => t === "all" || p.topic === t);
    grid.innerHTML = list.map((p, i) => `
      <figure class="cl-card" data-id="${p.id}" style="--ar:${p.w} / ${p.h};--i:${Math.min(i, 12)}" tabindex="0" role="button" aria-label="${esc(p.where)}">
        <img src="${thumb(p)}" alt="${esc(p.where)}" loading="${i < 6 ? "eager" : "lazy"}"${i < 3 ? ' fetchpriority="high"' : ""} decoding="async" width="${p.w}" height="${p.h}">
        <figcaption class="cl-cap">
          <span class="cl-cap-t"><b>${esc(p.title)}</b>${p.location ? `<i>${esc(p.location)}</i>` : ""}</span>
          <a class="cl-dl" href="${full(p)}" download="${dlName(p)}" aria-label="Download ${esc(p.title)}" title="Download">${DL}</a>
        </figcaption>
      </figure>`).join("");
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
      <button class="cl-btn wide" type="button" data-support>${methods.length ? "Support my work" : "Say thanks"}</button>
      ${p.camera || p.exif ? `<dl class="cl-exif">${p.camera ? `<div><dt>Camera</dt><dd>${esc(p.camera)}</dd></div>` : ""}${p.exif ? `<div><dt>Settings</dt><dd>${esc(p.exif)}</dd></div>` : ""}</dl>` : ""}
      <div class="cl-lic">
        <p><a href="${esc(C.license.url)}" target="_blank" rel="noopener">${esc(C.license.name)}</a> · ${esc(C.license.short)}</p>
        <div class="cl-credit"><code>${esc(C.credit)}</code><button class="cl-copy" type="button" data-copy-credit>Copy</button></div>
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
    if (e.target.closest("[data-support]")) openSupport(cur);
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
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-copy-credit]"); if (b) copy(C.credit, b, "Copied"); });

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

  // deep link: /collection/#<photo-id>
  if (location.hash && byId.has(location.hash.slice(1))) openSheet(location.hash.slice(1));
  if (Q.has("support")) openSupport(null);
})();

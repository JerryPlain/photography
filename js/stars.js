// ============================================================
// Starfield — a quiet night sky behind the monograph.
// Fixed full-page canvas; brightest over the hero, dimmed after scrolling.
// Twinkling stars, soft nebula haze, an occasional meteor, slight parallax.
// ============================================================

(function () {
  const canvas = document.getElementById("stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, DPR = 1;
  let stars = [];
  let meteors = [];
  let haze = null;          // offscreen canvas with static nebula glow
  let glow = null;          // pre-rendered soft sprite for bright stars
  let mouseX = 0, mouseY = 0, px = 0, py = 0;
  let running = false, raf = 0, nextMeteor = 0;

  const rand = (a, b) => a + Math.random() * (b - a);

  function isDark() {
    return document.documentElement.dataset.theme === "dark";
  }

  function makeGlow() {
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, "rgba(255,255,255,0.9)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.25)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    return c;
  }

  function makeHaze() {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    // a diagonal band of faint "milky way" plus two soft pools of colour
    const band = g.createLinearGradient(0, H * 0.15, W, H * 0.85);
    band.addColorStop(0, "rgba(120,140,190,0)");
    band.addColorStop(0.45, "rgba(150,165,210,0.055)");
    band.addColorStop(0.55, "rgba(190,170,150,0.05)");
    band.addColorStop(1, "rgba(120,140,190,0)");
    g.fillStyle = band;
    g.fillRect(0, 0, W, H);
    const pools = [
      [W * 0.2, H * 0.3, Math.max(W, H) * 0.35, "rgba(90,110,170,0.07)"],
      [W * 0.8, H * 0.65, Math.max(W, H) * 0.3, "rgba(190,150,110,0.05)"],
    ];
    for (const [x, y, r, col] of pools) {
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, col);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
    }
    return c;
  }

  function seed() {
    const count = Math.round((W * H) / 5200);
    stars = [];
    for (let i = 0; i < count; i++) {
      const depth = Math.random();                 // 0 far … 1 near
      const r = 0.25 + Math.pow(depth, 2.4) * 1.5; // most are tiny
      // colour temperature: mostly white, some warm, a few blue
      const t = Math.random();
      const col = t < 0.7 ? [255, 255, 255] : t < 0.9 ? [255, 228, 190] : [190, 210, 255];
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r,
        depth,
        col,
        base: 0.35 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.4,
        twinkle: Math.random() < 0.35,           // only some stars visibly twinkle
      });
    }
  }

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    glow = glow || makeGlow();
    haze = makeHaze();
    seed();
    if (!running) draw(performance.now());
  }

  function spawnMeteor(now) {
    const fromLeft = Math.random() < 0.5;
    const angle = (fromLeft ? 1 : -1) * rand(0.35, 0.6) + (fromLeft ? 0 : Math.PI);
    meteors.push({
      x: fromLeft ? rand(-0.1, 0.5) * W : rand(0.5, 1.1) * W,
      y: rand(-0.05, 0.45) * H,
      vx: Math.cos(angle) * rand(900, 1400),
      vy: Math.abs(Math.sin(angle)) * rand(900, 1400),
      len: rand(120, 260),
      life: 0,
      ttl: rand(0.7, 1.1),
      born: now,
    });
    nextMeteor = now + rand(4000, 9000);
  }

  let last = 0;
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const t = now / 1000;

    // parallax eases toward pointer
    px += (mouseX - px) * 0.04;
    py += (mouseY - py) * 0.04;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(haze, 0, 0);

    for (const s of stars) {
      let a = s.base;
      if (s.twinkle) a *= 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
      const ox = px * (6 + s.depth * 14);
      const oy = py * (4 + s.depth * 10);
      // slow drift so the sky never feels frozen
      const x = (s.x + ox + t * 1.2 * (0.2 + s.depth)) % (W + 40) - 20;
      const y = s.y + oy;
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${s.col[0]},${s.col[1]},${s.col[2]})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.25) {
        const g = s.r * 9;
        ctx.globalAlpha = a * 0.35;
        ctx.drawImage(glow, x - g / 2, y - g / 2, g, g);
      }
    }

    // meteors
    if (!reduced) {
      if (now > nextMeteor && meteors.length < 2) spawnMeteor(now);
      meteors = meteors.filter((m) => m.life < m.ttl);
      for (const m of meteors) {
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const k = m.life / m.ttl;
        const fade = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
        const nx = m.vx, ny = m.vy, n = Math.hypot(nx, ny);
        const tx = m.x - (nx / n) * m.len, ty = m.y - (ny / n) * m.len;
        const grd = ctx.createLinearGradient(tx, ty, m.x, m.y);
        grd.addColorStop(0, "rgba(255,255,255,0)");
        grd.addColorStop(1, `rgba(255,245,230,${0.85 * fade})`);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grd;
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
        ctx.globalAlpha = 0.9 * fade;
        ctx.drawImage(glow, m.x - 9, m.y - 9, 18, 18);
      }
    }
    ctx.globalAlpha = 1;

    if (running && !reduced) raf = requestAnimationFrame(draw);
  }

  function start() {
    if (running || !isDark() || document.hidden) return;
    running = true;
    last = performance.now();
    nextMeteor = last + rand(1500, 4000);
    raf = requestAnimationFrame(draw);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // hooks -----------------------------------------------------------
  addEventListener("resize", () => { resize(); }, { passive: true });
  addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / W - 0.5);
    mouseY = (e.clientY / H - 0.5);
  }, { passive: true });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // dim after the hero
  function onScroll() {
    const hero = document.getElementById("hero");
    const hh = hero ? hero.offsetHeight : innerHeight;
    const k = Math.min(1, scrollY / Math.max(1, hh * 0.9));
    document.documentElement.style.setProperty("--stars-alpha", (1 - k * 0.7).toFixed(3));
  }
  addEventListener("scroll", onScroll, { passive: true });

  // theme changes toggle the loop
  new MutationObserver(() => (isDark() ? start() : stop())).observe(
    document.documentElement, { attributes: true, attributeFilter: ["data-theme"] }
  );

  resize();
  onScroll();
  if (reduced) draw(performance.now()); else start();
})();

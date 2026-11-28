// Stardust: the homepage's night sky, star for star (assets/js/stardust.js
// there, which this copies; styled in css/style.css under "Stardust").
// Fifteen stars placed by hand in the strip of open sky under the bar and in
// the margins, clear of the intro, the contents list and the series rail at
// desktop width, and now and then a meteor. Night only: by day the sky is
// left clear. x is a share of the window's width, y px from the top, s the
// size in px; "g" marks a four-point glint, "w" a star left off small
// screens. Each twinkles on a period and phase of its own.
(function () {
  var STARS = [
    [4.2, 118, 3, ""],
    [2.6, 520, 2, "w"],
    [7.8, 286, 2.5, ""],
    [13.5, 92, 2, "w"],
    [31.2, 86, 2, "w"],
    [52.6, 94, 3, ""],
    [72.4, 128, 2, "w"],
    [82.1, 82, 3, ""],
    [89.2, 170, 2, "w"],
    [97.4, 146, 2, "w"],
    [92.4, 548, 2.5, ""],
    [61.8, 100, 18, "g"],
    [8.4, 206, 12, "g"],
    [93.8, 252, 16, "g"],
    [5.4, 392, 11, "gw"],
  ];

  function build() {
    var sky = document.createElement("div");
    sky.className = "pg-stars";
    sky.setAttribute("aria-hidden", "true");
    STARS.forEach(function (p, i) {
      var star = document.createElement("i");
      var period = 4.5 + ((i * 37) % 45) / 10; // 4.5–8.9 s
      star.className = "pg-star";
      if (p[3].indexOf("g") > -1) star.classList.add("pg-star--glint");
      if (p[3].indexOf("w") > -1) star.classList.add("pg-star--wide");
      star.style.cssText =
        "--x:" + p[0] + "%;--y:" + p[1] + "px;--s:" + p[2] + "px;--t:" + period.toFixed(1) + "s;--phase:-" + ((i * 2.3) % period).toFixed(1) + "s";
      sky.appendChild(star);
    });
    document.body.prepend(sky);
    meteors(sky);
  }

  // At night a meteor now and then crosses the strip: one at a time, every
  // 4–9 s, diving down and away from either side. Only while the strip is in
  // view and the tab is visible; by day the sky is clear, and reduced motion
  // gets none. Each is a CSS-animated streak, removed when it fades out.
  function meteors(sky) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    function rand(a, b) {
      return a + Math.random() * (b - a);
    }
    function fly() {
      var night = document.documentElement.getAttribute("data-theme") === "dark";
      if (night && !document.hidden && window.scrollY < 480) {
        var k = Math.min(1, sky.clientWidth / 1200); // shorter flights on phones
        var fromLeft = Math.random() < 0.5;
        var dip = rand(18, 32);
        var m = document.createElement("i");
        m.className = "pg-meteor";
        m.style.cssText =
          "--x:" +
          (fromLeft ? rand(4, 55) : rand(45, 96)).toFixed(1) +
          "%;--y:" +
          Math.round(rand(40, 230)) +
          "px;--a:" +
          (fromLeft ? dip : 180 - dip).toFixed(1) +
          "deg;--len:" +
          Math.round(rand(90, 160) * k) +
          "px;--d:" +
          Math.round(rand(300, 460) * k) +
          "px;--t:" +
          rand(0.9, 1.3).toFixed(2) +
          "s";
        m.addEventListener("animationend", function () {
          m.remove();
        });
        sky.appendChild(m);
      }
      setTimeout(fly, rand(4000, 9000));
    }
    setTimeout(fly, rand(1500, 4000));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

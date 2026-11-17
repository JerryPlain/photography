// Stardust: a handful of stars caught in the baby-blue sky at the top of
// the page, the same fifteen as on the homepage (assets/js/stardust.js
// there; styled in css/style.css under "Stardust"). Placed by hand in the
// strip of open sky under the bar and in the margins, clear of the intro,
// the contents list and the series rail at desktop width. x is a share of
// the window's width, y px from the top, s the size in px; "g" marks a
// four-point glint, "w" a star left off small screens. Each twinkles on a
// period and phase of its own. By day only: at night stars.js draws the
// full sky.
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
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

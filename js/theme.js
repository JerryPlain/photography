// Theme by the clock, loaded in the <head> of both pages so the first paint
// is already right. Light by day and dark by night on the visitor's own
// clock (night is 18:00–06:00, as on the homepage), and an open page turns
// over by itself when the hour comes. The toggle still works: setTheme()
// flips it for the rest of the visit only (sessionStorage, which the
// homepage on this origin shares), and flipping back to what the clock says
// hands the theme back to the clock. Choices the old toggle saved for good
// (localStorage) are dropped so they no longer pin the theme.
// ?theme=dark or ?theme=light pins a theme for screenshots.
(function () {
  var NIGHT_FROM = 18;
  var NIGHT_UNTIL = 6;
  var root = document.documentElement;
  var pinned = new URLSearchParams(location.search).get("theme");
  if (pinned !== "dark" && pinned !== "light") pinned = null;

  function clock() {
    var h = new Date().getHours();
    return h >= NIGHT_FROM || h < NIGHT_UNTIL ? "dark" : "light";
  }
  function chosen() {
    try {
      var s = sessionStorage.getItem("theme");
      return s === "dark" || s === "light" ? s : null;
    } catch (e) {
      return null;
    }
  }
  function follow() {
    var t = pinned || chosen() || clock();
    if (root.dataset.theme !== t) root.dataset.theme = t;
  }

  try {
    localStorage.removeItem("theme");
  } catch (e) {}
  follow();
  setInterval(follow, 60000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) follow();
  });

  window.setTheme = function (next) {
    pinned = null;
    try {
      if (next === clock()) sessionStorage.removeItem("theme");
      else sessionStorage.setItem("theme", next);
    } catch (e) {}
    root.dataset.theme = next;
  };
})();

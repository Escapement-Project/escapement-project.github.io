// The header compacts once the page has scrolled: a marker at the top of the page says when it has
// left the screen. Without this script the header stays at its full height, which still fits.
(() => {
  const marker = document.createElement("div");
  marker.setAttribute("aria-hidden", "true");
  marker.style.cssText = "position: absolute; top: 0; left: 0; width: 1px; height: 24px; pointer-events: none;";
  document.body.prepend(marker);
  new IntersectionObserver(([e]) => document.documentElement.classList.toggle("scrolled", !e.isIntersecting)).observe(marker);
})();

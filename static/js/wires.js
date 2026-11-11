// Verge's page: the Wires section's recordings. tickwave's elements load as the section nears the
// view, from tickwave's own site at the version the site pins; until then, and without scripts, a
// reference reads as its plain figure.
const box = document.getElementById("wire-box");
if (box) {
  const io = new IntersectionObserver((seen) => {
    if (!seen.some((x) => x.isIntersecting)) return;
    io.disconnect();
    import(`${box.dataset.tickwave}tickwave.js`).catch((e) => console.warn("tickwave did not load:", e));
  }, { rootMargin: "600px 0px" });
  io.observe(box);
}

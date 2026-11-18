// tickwave's elements, for the pages that show recordings: Verge's Wires section and the landing's
// tickwave section. They load as the first part that holds them nears the view, from tickwave's own
// site at the version the site pins (the part's data-tickwave); until then, and without scripts, a
// reference reads as its plain figure.
(() => {
  const parts = document.querySelectorAll("[data-tickwave]");
  if (!parts.length) return;
  const io = new IntersectionObserver((seen) => {
    const part = seen.find((x) => x.isIntersecting)?.target;
    if (!part) return;
    io.disconnect();
    import(`${part.dataset.tickwave}tickwave.js`).catch((e) => console.warn("tickwave did not load:", e));
  }, { rootMargin: "600px 0px" });
  for (const part of parts) io.observe(part);
})();

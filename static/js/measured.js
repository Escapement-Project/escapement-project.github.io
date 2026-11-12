// Figure 1 and Table 1 on Verge's page: the measured headline as a chart and a table, and the links
// between them and the claim's numbers. tickwave's <tickwave-chart> draws Figure 1. The figures come
// from data/landing.json (mculink-bench's extract.py writes it) through the page.
(() => {
  const DATA = JSON.parse(document.getElementById("data").textContent);

  // What the pointer, a tap or the keyboard is on: a clock (i), a series (s), the values the text points
  // at (refs, as "series@MHz"). Figure 1 and the table both show it. Figure 1 rings the refs through
  // `highlight`, and picks the clock and series as a reader would; a pick the reader made in the chart
  // is not handed back.
  // The chart takes its data and these once it is defined: a property set before then would hide its own.
  const figure = document.getElementById("chart");
  const chartReady = customElements.whenDefined("tickwave-chart");
  chartReady.then(() => { figure.data = DATA.figure1; });
  let hl = {};
  function highlight(next, fromChart = false) {
    hl = next;
    tableHighlight();
    if (fromChart) return;
    chartReady.then(() => {
      if (hl.refs?.length) figure.setAttribute("highlight", hl.refs.join(" "));
      else figure.removeAttribute("highlight");
      // A clock is named by its setting in the chart's data, "50" for 50 MHz.
      if (hl.i != null || hl.s) figure.pick(hl.i != null ? String(DATA.clocks[hl.i]) : null, hl.s ?? null);
      else figure.pick();
    });
  }
  figure.addEventListener("tickwave-pick", (e) => {
    const { x, series } = e.detail;
    highlight({ ...(x != null && { i: DATA.clocks.findIndex((m) => String(m) === x) }), ...(series && { s: series }) }, true);
  });
  // Focus shows the last clock, as before; the arrow keys then step through the clocks.
  figure.addEventListener("focus", () => { if (hl.i == null) highlight({ i: DATA.clocks.length - 1 }); });
  figure.addEventListener("blur", () => highlight({}));

  function tableHighlight() {
    const el = document.getElementById("table");
    for (const tr of el.querySelectorAll("tr[data-i]")) tr.classList.toggle("on", hl.i === +tr.dataset.i);
    for (const c of el.querySelectorAll("[data-s]")) {
      c.classList.toggle("dim", hl.s != null && c.dataset.s !== hl.s);
      c.classList.toggle("sel", c.matches("td") && (hl.refs || []).includes(c.dataset.ref));
    }
  }

  // Hover, focus or a tap on el highlights what what() names; leaving it, or a tap elsewhere, clears it.
  // A finger's pointer leaves as it lifts, so only a mouse's leaving clears. Pointer only for an SVG
  // element: Chromium puts one with a focus listener in the tab order.
  function linkOn(el, what, focus = true) {
    el.addEventListener("pointerenter", () => highlight(what()));
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") highlight({}); });
    if (!focus) return;
    el.addEventListener("focus", () => highlight(what()));
    el.addEventListener("blur", () => highlight({}));
  }
  // A table cell names its clock and its series; a column's header names the series.
  const tableEl = document.getElementById("table");
  tableEl.addEventListener("pointerover", (e) => {
    const cell = e.target.closest("td, th[data-s]");
    if (!cell) return;
    const row = cell.closest("tr[data-i]");
    highlight({ ...(row && { i: +row.dataset.i }), ...(cell.dataset.s && { s: cell.dataset.s }) });
  });
  tableEl.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") highlight({}); });
  for (const ref of document.querySelectorAll(".claim .ref")) linkOn(ref, () => (ref.dataset.refs ? { refs: ref.dataset.refs.split(" ") } : {}));
  document.addEventListener("pointerdown", (e) => { if (!e.target.closest(".chart, #table, .claim .ref")) highlight({}); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") highlight({}); });
})();

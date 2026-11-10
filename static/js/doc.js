// A doc page's contents (templates/verge-doc.html). It marks the section the reader is in, in the
// contents and in the bar narrow screens keep at the top, and opens and closes the bar's sheet of
// contents. Without it the contents still work: every link is there, the reader's group open.
(() => {
  const wrap = document.querySelector(".doc-wrap");
  if (!wrap) return;
  const nav = wrap.querySelector(".doc-nav"), bar = wrap.querySelector(".doc-bar"), where = bar.querySelector(".where");
  const title = where.textContent;

  // Each section link and its heading, in the page's order.
  const spots = [...nav.querySelectorAll(".toc a")]
    .map((a) => [a, document.getElementById(decodeURIComponent(a.hash.slice(1)))])
    .filter(([, h]) => h);
  const narrow = matchMedia("(max-width: 999px)");
  const toc = nav.querySelector(".toc"), pulse = document.createElement("span");
  pulse.className = "pulse";
  pulse.setAttribute("aria-hidden", "true");
  if (toc) toc.append(pulse);

  // The section in view is the last one whose heading has passed a reading line: a little under
  // whatever stays at the top of the window (the header wide, the bar narrow).
  const mark = () => {
    const top = narrow.matches ? bar.getBoundingClientRect().bottom
      : document.querySelector("header").getBoundingClientRect().bottom;
    const line = Math.max(0, top) + Math.min(120, innerHeight * 0.2);
    let here = null;
    for (const [a, h] of spots) {
      if (h.getBoundingClientRect().top <= line) here = a;
      else break;
    }
    for (const [a] of spots) {
      if (a === here) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
    // A subsection's section opens its list, so the subsection shows.
    for (const li of nav.querySelectorAll(".toc li.here")) li.classList.remove("here");
    const section = here && here.closest(".toc > li");
    if (section) section.classList.add("here");
    where.textContent = here ? here.textContent : title;
    // The pulse beside the section, once its list is laid out; none while the contents are hidden.
    pulse.classList.toggle("on", Boolean(here) && here.offsetHeight > 0);
    if (here && here.offsetHeight > 0) {
      pulse.style.top = `${here.offsetTop + 4}px`;
      pulse.style.height = `${here.offsetHeight - 8}px`;
    }
    // Keep the mark in sight in a rail taller than the window, without moving the page.
    if (here && !narrow.matches && nav.scrollHeight > nav.clientHeight) {
      const r = here.getBoundingClientRect(), n = nav.getBoundingClientRect();
      if (r.top < n.top + 40 || r.bottom > n.bottom - 48) nav.scrollTop += r.top - n.top - nav.clientHeight / 3;
    }
  };
  // A rail taller than the window fades at an edge with more past it.
  const edges = () => {
    nav.classList.toggle("more-above", nav.scrollTop > 2);
    nav.classList.toggle("more-below", nav.scrollTop + nav.clientHeight < nav.scrollHeight - 2);
  };
  nav.addEventListener("scroll", edges, { passive: true });
  addEventListener("resize", edges);
  nav.addEventListener("toggle", edges, true);
  edges();
  if (spots.length) {
    mark();
    // Placed first where it belongs, then moving from there.
    requestAnimationFrame(() => nav.classList.add("moving"));
    addEventListener("scroll", mark, { passive: true });
    addEventListener("resize", mark);
  }

  // The sheet, narrow only. It opens under the bar, wherever the bar is; a link, Escape, or a
  // click or focus outside the bar and the sheet closes it.
  const open = () => wrap.classList.contains("open");
  const set = (to, refocus = false) => {
    if (to) wrap.style.setProperty("--bar-bottom", `${Math.ceil(bar.getBoundingClientRect().bottom)}px`);
    wrap.classList.toggle("open", to);
    bar.setAttribute("aria-expanded", String(to));
    if (to) {
      nav.classList.remove("moving");
      mark();
      requestAnimationFrame(() => nav.classList.add("moving"));
      const here = nav.querySelector('[aria-current="location"]') || nav.querySelector('[aria-current="page"]');
      if (here) nav.scrollTop += here.getBoundingClientRect().top - nav.getBoundingClientRect().top - nav.clientHeight / 3;
    }
    if (!to && refocus) bar.focus();
  };
  bar.addEventListener("click", () => set(!open()));
  nav.addEventListener("click", (e) => { if (open() && e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open()) set(false, true); });
  const inside = (el) => el instanceof Node && (bar.contains(el) || nav.contains(el));
  document.addEventListener("pointerdown", (e) => { if (open() && !inside(e.target)) set(false); });
  document.addEventListener("focusin", (e) => { if (open() && !inside(e.target)) set(false); });
  narrow.addEventListener("change", () => { set(false); mark(); });
})();

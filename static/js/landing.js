// The landing page: the hero dial and its one-time entry, Figure 1 and its sweep, the links between
// the claim, the figure, the table and the dial, and the Verge section's traces and commands. The
// figures come from data/landing.json through the page; colours and type from tokens.css.
const DATA = JSON.parse(document.getElementById("data").textContent);
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const fmt = (v) => v.toLocaleString("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f1 = (v) => v.toFixed(1);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// Two sequences, each played once when it first comes into view, both smooth and timed in
// milliseconds. Highlights snap. Reduced motion and printing show each sequence's end at once.
const seq = {
  hero: { pos: -1, end: 0, at: (ms) => ms, frame: () => heroFrame() },
  chart: { pos: -1, end: 0, at: (ms) => ms, frame: () => chartFrame() },
};
function advance(s, p) { if (p > s.pos) { s.pos = Math.min(p, s.end); s.frame(); } }
const finish = (s) => advance(s, s.end);
function start(s, delay = 0) {
  if (s.pos >= 0) return;
  if (reduced.matches) return finish(s);
  const t0 = performance.now() + delay;
  const tick = (now) => {
    if (now >= t0) advance(s, s.at(now - t0));
    if (s.pos < s.end) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// The hero: the headline as a dial. The project's step is printed across the face, its top edge
// traced as a capture would be: NXP's firmware on the low run, Verge on the high one. The readings
// sit on the face's centre line, mirrored about the riser as the step is about the centre. The outer
// scale turns until the ratio sits at a red index at six, under the window that prints it, so the
// centre carries nothing but the step and the readings.
const C = 200, K = 158 / 23, lv = (u) => C + (u - 32) * K;
const LOW = lv(38), RISER = lv(29), RISER_RIGHT = lv(35), HIGH = lv(20);
const chord = (y) => Math.sqrt(158 ** 2 - (y - C) ** 2);
// The scale's own layout: 0x to 5x over 270 degrees, a ratio below 1 having its place too. It turns
// as a whole, so the value v sits at the index once the scale is turned by INDEX - scaleAt(v).
const SCALE = { max: 5, from: 225, span: 270 };
const scaleAt = (v) => SCALE.from + v / SCALE.max * SCALE.span;
const INDEX = 180;
// A number within this many degrees of six would crowd the window: it passes behind it, hidden.
// The window's corners sit 21.8 degrees either side of six at the numbers' radius, and a number
// is about 4 degrees wide there.
const UNDER_WINDOW = 28;
const RATIO = parseFloat(DATA.headline.ratio);
// The sequence in milliseconds. The sweep crosses the face at a steady rate, as a scope's time base
// does: it draws the trace, and each reading's characters show once it is past them. The scale
// leaves 0x at the index as the edge rises and slows into the ratio, out-cubic and no overshoot,
// since every value it passes is a reading; the window and the scale's ink follow its value. Each
// part follows the sweep's position or the reading, never a timer of its own, so none can lead or lag.
const SWEEP = { from: C - chord(LOW), to: 360, ms: 560 };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const sweepX = (t) => t < 0 ? -Infinity : SWEEP.from + (SWEEP.to - SWEEP.from) * clamp01(t / SWEEP.ms);
const passes = (x) => Math.round((x - SWEEP.from) / (SWEEP.to - SWEEP.from) * SWEEP.ms);
const TURN = { from: passes(RISER), ms: 1000 };
const readingAt = (t) => RATIO * (1 - (1 - clamp01((t - TURN.from) / TURN.ms)) ** 3);
seq.hero.end = TURN.from + TURN.ms;

function dial() {
  const ink = css("--ink"), muted = css("--ink-2"), ring = css("--ring"), face = css("--face"), hair = css("--hair");
  // Text sizes in the dial's 400 units, raised so nothing shows smaller than 11 px.
  const host = document.getElementById("dialface");
  const shown = host.clientWidth || 400, fs = (base) => Math.max(base, 11 * 400 / Math.min(shown, 480));
  const pt = (deg, r) => { const a = deg * Math.PI / 180; return [C + r * Math.sin(a), C - r * Math.cos(a)]; };
  const ours = DATA.series[0], h = DATA.headline;
  const s = [`<svg viewBox="0 0 400 400" role="group" aria-label="The headline as a dial"><g aria-hidden="true">`];
  s.push(`<circle cx="${C}" cy="${C}" r="198" fill="${ring}" stroke="${hair}"/><circle cx="${C}" cy="${C}" r="158" fill="${face}"/>`);
  // The outer scale, a tick every tenth, those up to the reading drawn in ink. It turns as one group;
  // each number turns back about its own place, so it stays upright wherever the scale stops.
  s.push(`<g id="scale">`);
  for (let i = 0; i <= SCALE.max * 10; i++) {
    const v = i / 10, major = i % 10 === 0, half = i % 5 === 0;
    const [x1, y1] = pt(scaleAt(v), 194), [x2, y2] = pt(scaleAt(v), major ? 172 : half ? 180 : 186);
    s.push(`<line class="tick" data-v="${v}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke-width="${major ? 2.4 : 1}"/>`);
    if (major) { const [tx, ty] = pt(scaleAt(v), 150); s.push(`<text class="number" data-at="${scaleAt(v)}" data-x="${f1(tx)}" data-y="${f1(ty)}" x="${f1(tx)}" y="${f1(ty + 5)}" text-anchor="middle" font-family='${css("--font-display")}' font-weight="${css("--display-weight")}" font-stretch="${css("--display-stretch")}" font-size="${fs(13)}" fill="${ink}">${v}×</text>`); }
  }
  s.push(`</g>`);
  // The logo's step itself, scaled so the logo's inner circle (r 23 of its 64) is the face (r 158).
  // The clip goes on a group: on the scaled path it would scale with it.
  s.push(`<clipPath id="face"><circle cx="${C}" cy="${C}" r="158"/></clipPath><clipPath id="dial-sweep"><rect x="0" y="0" width="0" height="400"/></clipPath>`);
  s.push(`<g clip-path="url(#face)"><path transform="translate(${C} ${C}) scale(${K}) translate(-32 -32)" d="M4,38 H29 V20 H60 V26 H35 V44 H4 Z" fill="${ink}" fill-opacity="${css("color-scheme") === "dark" ? 0.16 : 0.13}"/></g>`);
  // Its top edge, traced: NXP's blue along the low run, the riser in ink, Verge's teal along the high
  // run, one width throughout. Butt ends at a corner would leave half the corner's square bare, so
  // each run reaches half a width past the riser's line to fill it, and the riser stops at the runs'
  // edges: drawn under them, its ink showed through their antialiased edges. The face clips the ends.
  const TRACE = 2.5, half = TRACE / 2;
  s.push(`<g clip-path="url(#face)"><g clip-path="url(#dial-sweep)" fill="none" stroke-width="${TRACE}">`
    + `<path d="M${RISER.toFixed(2)},${(LOW - half).toFixed(2)} V${(HIGH + half).toFixed(2)}" stroke="${ink}"/>`
    + `<path d="M0,${LOW.toFixed(2)} H${(RISER + half).toFixed(2)}" stroke="${css("--series-nxp")}"/>`
    + `<path d="M${(RISER - half).toFixed(2)},${HIGH.toFixed(2)} H400" stroke="${css("--series-verge")}"/></g></g>`);
  s.push(`<rect x="144" y="300" width="112" height="40" rx="4" fill="${css("--lume")}" stroke="${css("--window-edge")}"/>`);
  s.push("</g>");
  // The readings, each a focusable group that says what it is. A reading's text shows a whole
  // character at a time as the sweep passes, through a clip with a band per line.
  const reading = (id, label, tip, body) => s.push(`<g class="reading" id="${id}" tabindex="0" role="img" aria-label="${label}" data-tip="${tip}">`
    + `<rect class="hit" fill="transparent"/><rect class="focus" fill="none" stroke="${ink}" stroke-width="2" rx="4"/>`
    + `<clipPath id="${id}-shown"><rect/><rect/></clipPath><g clip-path="url(#${id}-shown)">${body}</g></g>`);
  const figures = `font-family='${css("--font-figures")}' font-weight="${css("--figures-weight")}" font-stretch="${css("--figures-stretch")}"`;
  const lines = (x, anchor, name, value) => `<text x="${f1(x)}" y="${C - 6}" text-anchor="${anchor}" font-family='${css("--font-text")}' font-weight="600" font-size="${fs(11)}" letter-spacing="1.2" fill="${muted}">${name}</text>`
    + `<text x="${f1(x)}" y="${f1(C + 6 + fs(17) * .72)}" text-anchor="${anchor}" fill="${ink}"><tspan ${figures} font-size="${fs(17)}">${value}</tspan><tspan font-family='${css("--font-text")}' font-size="${fs(12)}" font-weight="500" fill="${muted}" dx="4">KiB/s</tspan></text>`;
  reading("r-nxp", `NXP's firmware V3.174: ${h.stock} KiB/s at ${h.stockAt} MHz, the fastest clock it reads right at`,
    `<b>NXP's firmware V3.174</b><br>${h.stock} KiB/s at ${h.stockAt} MHz, the fastest<br>clock it reads right at`, lines(RISER - 16, "end", "NXP 3.174", h.stock));
  reading("r-verge", `Verge, ${ours.name}: ${h.ours} KiB/s at ${h.oursAt} MHz`,
    `<b>Verge, ${ours.name}</b><br>${h.ours} KiB/s at ${h.oursAt} MHz`, lines(RISER_RIGHT + 16, "start", "VERGE", h.ours));
  s.push(`<g class="reading" id="r-ratio" tabindex="0" role="img" aria-label="${h.ratio} times: Verge's ${h.ours} KiB/s over NXP's ${h.stock}" data-tip="<b>${h.ratio}×</b><br>Verge's ${h.ours} KiB/s over NXP's ${h.stock}">`
    + `<rect class="hit" fill="transparent" x="141" y="297" width="118" height="46" rx="6"/><rect class="focus" fill="none" stroke="${ink}" stroke-width="2" x="141" y="297" width="118" height="46" rx="6"/>`
    + `<text id="ratio" x="200" y="${300 + 20 + 22 * .36}" text-anchor="middle" ${figures} font-size="22" fill="${css("--on-lume")}">${h.ratio}×</text></g>`);
  // The red index at six, in the ring's band inside the ticks, pointing out at the reading.
  s.push(`<path aria-hidden="true" transform="rotate(${INDEX} ${C} ${C})" d="M${C - 7},${C - 159} L${C + 7},${C - 159} L${C},${C - 171} Z" fill="${css("--hand")}"/>`);
  s.push(`</svg><div class="tip" id="dialtip" hidden></div>`);
  host.innerHTML = s.join("");
  for (const id of ["r-nxp", "r-verge"]) {
    const g = host.querySelector(`#${id}`), texts = [...g.querySelectorAll(":scope > g > text")], pad = 5;
    const boxes = texts.map((t) => t.getBBox());
    const x0 = Math.min(...boxes.map((q) => q.x)), y0 = Math.min(...boxes.map((q) => q.y));
    const x1 = Math.max(...boxes.map((q) => q.x + q.width)), y1 = Math.max(...boxes.map((q) => q.y + q.height));
    for (const r of g.querySelectorAll(":scope > rect")) {
      r.setAttribute("x", f1(x0 - pad)); r.setAttribute("y", f1(y0 - pad));
      r.setAttribute("width", f1(x1 - x0 + 2 * pad)); r.setAttribute("height", f1(y1 - y0 + 2 * pad));
    }
    // A band per line, its height the line's, and the right edge of each character on it in order.
    texts.forEach((t, i) => {
      const band = g.querySelectorAll("clipPath rect")[i], b = boxes[i];
      band.setAttribute("y", f1(b.y - 2)); band.setAttribute("height", f1(b.height + 4)); band.setAttribute("x", 0);
      band.dataset.edges = [...Array(t.getNumberOfChars()).keys()].map((c) => { const e = t.getExtentOfChar(c); return f1(e.x + e.width); }).join(" ");
    });
    g.dataset.at = passes(x0);
  }
  heroFrame();
}
function heroFrame() {
  const svg = document.querySelector("#dialface svg");
  if (!svg) return;
  const t = seq.hero.pos, x = sweepX(t), v = readingAt(t), done = t >= SWEEP.ms;
  svg.querySelector("#dial-sweep rect").setAttribute("width", t < 0 ? 0 : f1(x));
  for (const band of svg.querySelectorAll("[data-edges]")) {
    const edges = band.dataset.edges.split(" ").map(Number).filter((e) => e <= x);
    band.setAttribute("width", done ? 400 : edges.length ? f1(Math.max(...edges)) : 0);
  }
  for (const g of svg.querySelectorAll(".reading[data-at]")) g.style.visibility = t >= +g.dataset.at ? "" : "hidden";
  for (const tick of svg.querySelectorAll(".tick")) tick.classList.toggle("on", +tick.dataset.v <= v + 1e-9);
  const turn = INDEX - scaleAt(v);
  svg.querySelector("#scale").setAttribute("transform", `rotate(${turn.toFixed(2)} ${C} ${C})`);
  for (const n of svg.querySelectorAll("#scale .number")) {
    n.setAttribute("transform", `rotate(${(-turn).toFixed(2)} ${n.dataset.x} ${n.dataset.y})`);
    const off = Math.abs((((+n.dataset.at + turn - INDEX) % 360) + 540) % 360 - 180);
    n.style.visibility = off < UNDER_WINDOW ? "hidden" : "";
  }
  svg.querySelector("#ratio").textContent = `${v.toFixed(DATA.headline.ratio.split(".")[1]?.length ?? 0)}×`;
}
// A reading's tip sits under it, or over it where under would leave the dial.
function dialTip(g) {
  const host = document.getElementById("dialface"), tip = document.getElementById("dialtip");
  if (!g) { tip.hidden = true; return; }
  tip.innerHTML = g.dataset.tip; tip.hidden = false;
  const box = g.querySelector(".hit").getBoundingClientRect(), at = host.getBoundingClientRect();
  const left = box.left - at.left + box.width / 2 - tip.offsetWidth / 2;
  tip.style.left = `${f1(Math.max(0, Math.min(host.clientWidth - tip.offsetWidth, left)))}px`;
  const below = box.bottom - at.top + 6;
  tip.style.top = `${f1(below + tip.offsetHeight < host.querySelector("svg").clientHeight ? below : box.top - at.top - 6 - tip.offsetHeight)}px`;
}

// What the pointer, a tap or the keyboard is on: a clock (i), a series (s), the values the text points
// at (refs, as "series@MHz"), or the clock NXP's firmware reads right up to (limit). The figure and
// the table both draw it.
let hl = {};
function highlight(next) {
  hl = next;
  if (Object.keys(next).length) finish(seq.chart);
  chartHighlight(); tableHighlight();
}

// Figure 1: two series, ours and stock, one axis. Lines 2 px, markers 8 px, the legend above and
// each line labelled at its end; a crosshair and a tooltip at the nearest clock. The lines sweep in
// with a cubic ease-out when the figure first comes into view: quick across the low clocks, slowing
// over the high ones, where the lines part. The GCC build is drawn only while it is
// pointed at in the table.
let geom = null;
// The chart's sequence: the lines sweep in over LINES ms, eased; then the end labels show a whole
// character at a time over LABELS ms. The 20 MHz line grows out of NXP's 20 MHz point as the sweep
// goes from that point to NXP's last, so it lands with the sweep.
const CHART = { lines: 750, labels: 200 };
seq.chart.end = CHART.lines + CHART.labels;
function chart() {
  const host = document.getElementById("chart");
  const series = [
    { id: "clang", name: "Verge, Clang build", short: "Verge", kib: DATA.series[0].kib, color: css("--series-verge") },
    { id: "stock", name: "NXP's firmware V3.174", short: "NXP", kib: DATA.series[2].kib, color: css("--series-nxp"), rightUpTo: 20 },
    { id: "gcc", name: "Verge, GCC build", short: "GCC", kib: DATA.series[1].kib, color: css("--series-verge"), onDemand: true },
  ];
  const W = Math.max(320, Math.min(620, host.clientWidth - 16 || 620)), H = 330, L = 52, R = 64, T = 28, B = 44;
  const xs = DATA.clocks, max = 2500;
  const X = (m) => L + Math.log(m) / Math.log(50) * (W - L - R);
  const Y = (k) => T + (1 - k / max) * (H - T - B);
  geom = { W, X, Y, xs, series };
  const s = [`<ul class="legend">${series.filter((x) => !x.onDemand).map((x) => `<li tabindex="0" data-s="${x.id}"><i style="background:${x.color}"></i>${x.name}</li>`).join("")}<li tabindex="0" data-limit><i class="limit"></i>NXP's firmware reads right up to 20 MHz</li></ul>`];
  s.push(`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Write throughput against SWD clock, Verge and NXP's firmware; Table 1 has the same figures" aria-describedby="fig1" font-family='${css("--font-text")}' font-size="12">`);
  for (const k of [0, 500, 1000, 1500, 2000, 2500]) s.push(`<line x1="${L}" x2="${W - R}" y1="${Y(k)}" y2="${Y(k)}" stroke="currentColor" stroke-opacity=".2"/><text x="${L - 8}" y="${Y(k) + 4}" text-anchor="end" fill="currentColor" fill-opacity=".72">${k.toLocaleString("en")}</text>`);
  for (const m of xs) s.push(`<text x="${X(m)}" y="${H - B + 18}" text-anchor="middle" fill="currentColor" fill-opacity=".72">${m}</text>`);
  s.push(`<text x="${W - R}" y="${H - 6}" text-anchor="end" fill="currentColor" fill-opacity=".72">SWD clock asked for, MHz</text><text x="${L - 8}" y="${T - 14}" text-anchor="end" fill="currentColor" fill-opacity=".72">KiB/s</text>`);
  const nxp = series.find((q) => q.rightUpTo), lastNxp = xs.filter((m, i) => nxp.kib[i] != null).at(-1);
  s.push(`<clipPath id="limit-grow"><rect x="0" width="${W}" y="0" height="0" data-y="${f1(Y(nxp.kib[xs.indexOf(nxp.rightUpTo)]))}" data-top="${T}" data-bottom="${H - B}" data-from="${f1(X(nxp.rightUpTo))}" data-to="${f1(X(lastNxp))}"/></clipPath>`);
  s.push(`<line id="limit" data-clip="limit-grow" x1="${X(20)}" x2="${X(20)}" y1="${T}" y2="${H - B}" stroke="currentColor" stroke-opacity=".72" stroke-dasharray="3 4"/>`);
  // The sweep's clip, from just before the first clock's markers to just past the last's; the end
  // labels show whole once it lands.
  s.push(`<clipPath id="chart-sweep"><rect x="0" y="0" width="0" height="${H}" data-from="${f1(X(xs[0]) - 6)}" data-to="${f1(X(xs.at(-1)) + 6)}" data-all="${W}"/></clipPath><g class="sweep" data-clip="chart-sweep">`);
  for (const x of series) {
    const pts = xs.map((m, i) => [m, x.kib[i]]).filter(([, k]) => k != null);
    const path = (p) => p.map(([m, k], i) => `${i ? "L" : "M"}${X(m).toFixed(1)},${Y(k).toFixed(1)}`).join("");
    const right = pts.filter(([m]) => !x.rightUpTo || m <= x.rightUpTo), wrong = x.rightUpTo ? pts.filter(([m]) => m >= x.rightUpTo) : [];
    s.push(`<g data-s="${x.id}"${x.onDemand ? ' class="on-demand" display="none"' : ""}><path d="${path(right)}" fill="none" stroke="${x.color}" stroke-width="2"/>`);
    if (wrong.length > 1) s.push(`<path d="${path(wrong)}" fill="none" stroke="${x.color}" stroke-width="2" stroke-dasharray="2 4"/>`);
    for (const [m, k] of pts) {
      const bad = x.rightUpTo && m > x.rightUpTo;
      // The ring that parts a point from what it overlaps, and a hollow point's middle, are the
      // surface's colour, set in CSS: without it they drop rather than take a stale colour.
      s.push(`<circle class="${bad ? "hollow" : "pt"}" cx="${X(m)}" cy="${Y(k)}" r="4" fill="${bad ? "none" : x.color}" stroke="${bad ? x.color : "none"}" stroke-width="2"/>`);
    }
    const [lm, lk] = pts.at(-1);
    // An end label shows a character at a time through its own clip; one drawn on demand shows whole.
    if (!x.onDemand) s.push(`<clipPath id="end-${x.id}"><rect class="end-shown" x="0" y="0" width="0" height="${H}"/></clipPath>`);
    s.push(`<text class="end"${x.onDemand ? "" : ` data-clip="end-${x.id}"`} x="${X(lm) + 14}" y="${Y(lk) + 4}" fill="currentColor" font-weight="600">${x.short}</text></g>`);
  }
  s.push(`</g><g id="rings" fill="none" stroke="currentColor" stroke-width="2"></g>`);
  s.push(`<line id="cross" x1="0" x2="0" y1="${T}" y2="${H - B}" stroke="currentColor" stroke-opacity=".35" visibility="hidden"/>`);
  s.push(`<rect id="hit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/>`);
  s.push("</svg><div class=\"tip\" id=\"tip\" aria-live=\"polite\" hidden></div>");
  host.innerHTML = s.join("");
  const svg = host.querySelector("svg"), hit = host.querySelector("#hit");
  // The right edge of each character of an end label, for its reveal.
  for (const t of svg.querySelectorAll("text.end[data-clip]")) {
    svg.querySelector(`#${t.dataset.clip} rect`).dataset.edges =
      [...Array(t.getNumberOfChars()).keys()].map((c) => { const e = t.getExtentOfChar(c); return f1(e.x + e.width); }).join(" ");
  }
  const nearest = (e) => {
    const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
    let best = 0; xs.forEach((m, i) => { if (Math.abs(X(m) - x) < Math.abs(X(xs[best]) - x)) best = i; });
    return best;
  };
  // A mouse hovers; a finger taps, which fires no move.
  hit.addEventListener("pointermove", (e) => highlight({ i: nearest(e) }));
  hit.addEventListener("pointerdown", (e) => highlight({ i: nearest(e) }));
  hit.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") highlight({}); });
  // The end labels name their series, as the legend does.
  for (const t of host.querySelectorAll("svg [data-s] .end")) linkOn(t, () => ({ s: t.parentNode.dataset.s }), false);
  for (const el of host.querySelectorAll(".legend [data-s]")) linkOn(el, () => ({ s: el.dataset.s }));
  linkOn(host.querySelector(".legend [data-limit]"), () => ({ limit: true }));
  chartFrame(); chartHighlight();
}
function chartFrame() {
  const svg = document.querySelector("#chart svg");
  if (!svg) return;
  const t = seq.chart.pos, clip = svg.querySelector("#chart-sweep rect"), landed = t >= CHART.lines;
  const host = svg.parentNode, waiting = t < 0;
  if (waiting) host.dataset.pending = ""; else delete host.dataset.pending;
  // The clips apply only while the chart moves. At rest nothing refers to them: a reader view sets a
  // base URL, against which Firefox resolves url(#id) to another document and draws nothing.
  const moving = !waiting && t < seq.chart.end;
  for (const el of svg.querySelectorAll("[data-clip]")) {
    if (moving) el.setAttribute("clip-path", `url(#${el.dataset.clip})`); else el.removeAttribute("clip-path");
  }
  const eased = 1 - (1 - clamp01(t / CHART.lines)) ** 3;
  const from = +clip.dataset.from, x = t < 0 ? -Infinity : from + (+clip.dataset.to - from) * eased;
  clip.setAttribute("width", landed || waiting ? clip.dataset.all : f1(x));
  // The 20 MHz line, grown from NXP's point in step with the sweep's position.
  const grow = svg.querySelector("#limit-grow rect"), g = grow.dataset;
  const k = landed || waiting ? 1 : clamp01((x - +g.from) / (+g.to - +g.from));
  grow.setAttribute("y", f1(+g.y - k * (+g.y - +g.top)));
  grow.setAttribute("height", f1(k * (+g.bottom - +g.top)));
  // The end labels, after the lines land: a sweep of their own across them, each character shown
  // once it is past.
  const all = +clip.dataset.all, lx = landed ? +clip.dataset.to + (all - +clip.dataset.to) * clamp01((t - CHART.lines) / CHART.labels) : -Infinity;
  for (const r of svg.querySelectorAll(".end-shown")) {
    const edges = (r.dataset.edges || "").split(" ").map(Number).filter((e) => e <= lx);
    r.setAttribute("width", t >= seq.chart.end || waiting ? all : edges.length ? f1(Math.max(...edges)) : 0);
  }
}
function chartHighlight() {
  const host = document.getElementById("chart"), svg = host.querySelector("svg");
  if (!svg) return;
  const { W, X, Y, xs, series } = geom, cross = svg.querySelector("#cross"), tip = host.querySelector("#tip");
  // One series at a time: the others dim while a series is named, and one drawn on demand shows.
  const named = hl.s && series.some((q) => q.id === hl.s) ? hl.s : null;
  for (const g of svg.querySelectorAll("g[data-s]")) {
    g.classList.toggle("dim", named != null && g.dataset.s !== named);
    if (g.classList.contains("on-demand")) g.setAttribute("display", g.dataset.s === named ? "inline" : "none");
  }
  for (const el of host.querySelectorAll(".legend [data-s]")) el.classList.toggle("dim", named != null && el.dataset.s !== named);
  // The values the text points at, ringed; the limit drawn in ink.
  svg.querySelector("#rings").innerHTML = (hl.refs || []).map((r) => {
    const [id, m] = r.split("@"), x = series.find((q) => q.id === id), k = x.kib[xs.indexOf(+m)];
    return `<circle cx="${f1(X(+m))}" cy="${f1(Y(k))}" r="9"/>`;
  }).join("");
  const limit = svg.querySelector("#limit");
  limit.setAttribute("stroke-opacity", hl.limit ? 1 : .72);
  limit.setAttribute("stroke-width", hl.limit ? 2 : 1);
  if (hl.i == null) { tip.hidden = true; cross.setAttribute("visibility", "hidden"); return; }
  const m = xs[hl.i];
  cross.setAttribute("x1", X(m)); cross.setAttribute("x2", X(m)); cross.setAttribute("visibility", "visible");
  tip.innerHTML = `<b>${m} MHz</b><br>` + series.filter((x) => !x.onDemand || x.id === named).map((x) => {
    const v = x.kib[hl.i], bad = x.rightUpTo && m > x.rightUpTo;
    return `<i style="background:${x.color}"></i>${x.short} ${v == null ? "failed" : `${fmt(v)} KiB/s`}${bad && v != null ? ", reads wrong" : ""}`;
  }).join("<br>");
  tip.hidden = false;
  // Right of the crosshair, or left of it where the right would cover the lines' ends.
  const at = X(m) * svg.getBoundingClientRect().width / W + 8;
  const right = at + 12, left = at - 12 - tip.offsetWidth;
  tip.style.left = `${Math.max(4, right + tip.offsetWidth < host.clientWidth * 0.8 ? right : left)}px`;
  tip.style.top = "40px";
}

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
for (const ref of document.querySelectorAll(".claim .ref")) linkOn(ref, () => ({ ...(ref.dataset.refs && { refs: ref.dataset.refs.split(" ") }), ...("limit" in ref.dataset && { limit: true }) }));
const HL = ".chart, #table, .ref, #dialface .reading";
document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest(HL)) highlight({});
  if (!e.target.closest("#dialface .reading")) dialTip(null);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { highlight({}); dialTip(null); } });
// The dial's readings, by delegation: the dial is redrawn on a change of face or width.
const dialface = document.getElementById("dialface");
dialface.addEventListener("pointerover", (e) => { const g = e.target.closest(".reading"); if (g) dialTip(g); });
dialface.addEventListener("pointerout", (e) => { const g = e.target.closest(".reading"); if (g && e.pointerType === "mouse" && !g.contains(e.relatedTarget)) dialTip(null); });
dialface.addEventListener("focusin", (e) => { const g = e.target.closest(".reading"); if (g) dialTip(g); });
dialface.addEventListener("focusout", () => dialTip(null));
// The chart: focus shows the clock last read, the arrow keys step through the clocks.
const chartHost = document.getElementById("chart");
chartHost.tabIndex = 0;
chartHost.setAttribute("aria-label", "Figure 1. Use the arrow keys to read each clock");
let current = DATA.clocks.length - 1;
chartHost.addEventListener("focus", (e) => { if (e.target === chartHost) highlight({ i: current }); });
chartHost.addEventListener("blur", (e) => { if (e.target === chartHost) highlight({}); });
chartHost.addEventListener("keydown", (e) => {
  if (e.target !== chartHost || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
  e.preventDefault();
  current = Math.max(0, Math.min(DATA.clocks.length - 1, (hl.i ?? current) + (e.key === "ArrowRight" ? 1 : -1)));
  highlight({ i: current });
});

// The Verge section. A term names a wire, which opens that wire's trace under the Wires row, or a
// feature; either way the verge command that drives it shows under the list, described in the
// tool's own help text.
const READS = "Read target memory over SWD, JTAG or cJTAG, as probe-rs's read does.";
const COMMANDS = {
  list: ["verge list", "Say what every attached MCU-Link runs, and how each can be updated."],
  swd: ["verge read --chip <chip> --protocol swd b32 0x20000000 4", READS],
  jtag: ["verge read --chip <chip> --protocol jtag b32 0x20000000 4", READS],
  cjtag: ["verge read --chip <chip> --protocol cjtag b32 0x20000000 4", READS],
  oscan: ["verge cjtag", "Show or limit the cJTAG scan formats a unit running Verge offers a host."],
  power: ["verge power on", "Read or switch the target supply of an MCU-Link Pro running Verge."],
  energy: ["verge energy watch", "Show the capture live: the newest pair, the total, and graphs of current and power."],
  dio: ["verge dio --high 0,1", "Drive and read the four DIO pins on an MCU-Link Pro's J19 header, on a unit running Verge."],
  update: ["verge update", "Install a firmware on a unit, the best way its state allows."],
};
let commandShown = "list";
function showCommand(key) {
  commandShown = key;
  document.getElementById("cmd").replaceChildren(...COMMANDS[key][0].split(" ").flatMap((arg, i) =>
    [...(i ? [" "] : []), Object.assign(document.createElement("i"), { textContent: arg })]));
  document.getElementById("cmd-what").textContent = COMMANDS[key][1];
}
// The console keeps the height of its tallest command at this width, so pointing at a term moves
// nothing on the page.
function sizeConsole() {
  const el = document.getElementById("console"), keep = commandShown;
  el.style.minHeight = "";
  let tallest = 0;
  for (const key in COMMANDS) { showCommand(key); tallest = Math.max(tallest, el.offsetHeight); }
  el.style.minHeight = `${tallest}px`;
  showCommand(keep);
}

// Each wire a cycle at a time: 0 or 1 driven by the probe, a or b (0 or 1) by the target, z released,
// x the probe's don't-care; a clock is low then high in each cycle. Notes name spans of cycles.
const WIRES = {
  swd: { title: "SWD reading the debug port's ID register", wires: [["SWCLK", "clock"], ["SWDIO", "10100101zbaabbbabbba"]],
    notes: [[0, 8, "request"], [9, 12, "ack"], [12, 20, "data"]] },
  jtag: { title: "JTAG shifting six bits through a data register", wires: [["TCK", "clock"], ["TMS", "10000000110"], ["TDI", "xxx101100xx"], ["TDO", "zzzabbabazz"]],
    notes: [[0, 3, "enter"], [3, 9, "shift"], [9, 11, "leave"]] },
  cjtag: { title: "cJTAG in OScan1: three bits on TMSC for each JTAG clock", wires: [["TCKC", "clock"], ["TMSC", "00b11a"]],
    notes: [[0, 1, "nTDI"], [1, 2, "TMS"], [2, 3, "TDO"], [3, 4, "nTDI"], [4, 5, "TMS"], [5, 6, "TDO"]] },
};
const SCOPE = { left: 54, notes: 16, row: 26, key: 22, ms: 420 };
function scopeSVG(key, W) {
  const spec = WIRES[key], n = spec.wires.find(([, v]) => v !== "clock")[1].length;
  const L = SCOPE.left, R = W - 6, cw = (R - L) / n, X = (i) => L + i * cw;
  const top = SCOPE.notes, H = top + spec.wires.length * SCOPE.row + SCOPE.key;
  const probe = css("--series-verge"), target = css("--ink"), muted = css("--ink-2"), hair = css("--hair");
  const s = [`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${spec.title}" style='font-family:${css("--font-text")};font-size:11px'>`];
  for (const m of new Set(spec.notes.flat().filter((v) => typeof v === "number"))) s.push(`<line x1="${f1(X(m))}" x2="${f1(X(m))}" y1="${top - 2}" y2="${top + spec.wires.length * SCOPE.row}" stroke="${hair}"/>`);
  s.push(`<clipPath id="scope-sweep"><rect x="0" y="0" width="0" height="${H}"/></clipPath>`);
  for (const [a, b, text] of spec.notes) s.push(`<text class="note" x="${f1((X(a) + X(b)) / 2)}" y="11" text-anchor="middle" fill="${muted}">${text}</text>`);
  s.push(`<g clip-path="url(#scope-sweep)" fill="none" stroke-width="1.6">`);
  spec.wires.forEach(([name, v], w) => {
    const y0 = top + w * SCOPE.row, hi = y0 + 6, lo = y0 + 20, mid = y0 + 13;
    if (v === "clock") {
      let d = `M${L},${lo}`;
      for (let i = 0; i < n; i++) d += `H${f1(X(i) + cw / 2)}V${hi}H${f1(X(i + 1))}V${lo}`;
      s.push(`<path d="${d}" stroke="${probe}"/>`);
      return;
    }
    let prev = null;
    for (let i = 0; i < n; i++) {
      const c = v[i], y = "1b".includes(c) ? hi : c === "z" ? mid : lo;
      const stroke = c === "z" ? muted : "ab".includes(c) ? target : probe;
      const extra = c === "z" ? ` stroke-dasharray="2 3" stroke-width="1.2"` : c === "x" ? ` stroke-opacity=".35"` : "";
      const rise = prev != null && prev !== y && c !== "z" && v[i - 1] !== "z" ? `M${f1(X(i))},${prev}V${y}` : "";
      s.push(`<path d="${rise}M${f1(X(i))},${y}H${f1(X(i + 1))}" stroke="${stroke}"${extra}/>`);
      prev = y;
    }
  });
  s.push("</g>");
  spec.wires.forEach(([name], w) => s.push(`<text x="4" y="${top + w * SCOPE.row + 17}" fill="${muted}">${name}</text>`));
  const ky = H - 7;
  s.push(`<line x1="4" x2="18" y1="${ky - 4}" y2="${ky - 4}" stroke="${probe}" stroke-width="2"/><text x="22" y="${ky}" fill="${muted}">probe drives</text>`);
  s.push(`<line x1="104" x2="118" y1="${ky - 4}" y2="${ky - 4}" stroke="${target}" stroke-width="2"/><text x="122" y="${ky}" fill="${muted}">target drives</text>`);
  s.push("</svg>");
  return s.join("");
}
// The trace sweeps in when it opens, and each note shows once the sweep is past it. A touch can be
// followed by emulated mouse events that close the trace and open it again as the finger lifts
// (seen with Firefox's touch emulation): a trace reopened that soon shows drawn, without a second
// sweep.
let scopeToken = 0, lastClosed = { key: null, at: -Infinity };
function openScope(key) {
  const box = document.getElementById("scope");
  if (!box.hidden && box.dataset.key === key) return;
  const again = lastClosed.key === key && performance.now() - lastClosed.at < 800;
  const token = ++scopeToken, W = Math.min(box.parentNode.clientWidth, 440) - 14;
  box.dataset.key = key;
  // The title is HTML, so it wraps on a narrow screen.
  box.innerHTML = `<p>${WIRES[key].title}</p>${scopeSVG(key, W)}`;
  box.hidden = false;
  const wires = document.getElementById("wires");
  box.style.top = `${wires.offsetTop + wires.offsetHeight + 4}px`;
  const notes = [...box.querySelectorAll(".note")].map((t) => { const b = t.getBBox(); return [t, b.x + b.width]; });
  const clip = box.querySelector("#scope-sweep rect"), L = SCOPE.left, R = W - 6, t0 = performance.now();
  const frame = (now) => {
    if (token !== scopeToken) return;
    const x = reduced.matches || again ? W : L + (R - L) * clamp01((now - t0) / SCOPE.ms);
    clip.setAttribute("width", f1(x));
    for (const [t, right] of notes) t.style.visibility = x >= right ? "" : "hidden";
    if (x < R) requestAnimationFrame(frame);
  };
  frame(t0);
}
function closeScope() {
  const box = document.getElementById("scope");
  if (!box.hidden) lastClosed = { key: box.dataset.key, at: performance.now() };
  scopeToken++;
  box.hidden = true;
}
const vergeOff = () => { showCommand("list"); closeScope(); };
for (const ref of document.querySelectorAll("#verge .ref")) {
  const on = () => { showCommand(ref.dataset.cmd); if (ref.dataset.wire) openScope(ref.dataset.wire); else closeScope(); };
  ref.addEventListener("pointerenter", on);
  ref.addEventListener("focus", on);
  ref.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") vergeOff(); });
  ref.addEventListener("blur", vergeOff);
}
document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#verge .ref")) vergeOff(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") vergeOff(); });

// Verge's mark, played once when its section arrives and again when the pointer or a tap reaches
// it: a beam sweeps the plate and each sample moves from the V to the project's step as the beam
// passes it, grey stems rising from the floor; a hold on the step; the next sweep wipes back to the
// V. Every number comes from the design tokens (design/tokens.toml's [motion.mark] and
// design/marks/verge.svg, built into design/out/mark.json and embedded by the template), as
// verge-gui's does: this is only how to draw it, into the plate's own 64-unit box. The stems, the
// step's trace and the beam live in groups of their own, removed at the end, so at rest the plate
// holds the mark and nothing else.
const MARK = JSON.parse(document.getElementById("mark").textContent);
function markAt(t) {
  const m = MARK, g = m.geometry, ease = (x) => 1 - (1 - clamp01(x)) ** m.ease;
  const wipe = (t0, a, b) => m.grid_x.map((x, i) => a[i] + (b[i] - a[i]) * ease((t - t0 - x / 64 * m.sweep) / m.move));
  const y = t < m.back ? wipe(0, g.v, g.step) : wipe(m.back, g.step, g.v);
  const across = (t0) => (t - t0) / m.sweep * 64;
  const beam = t < m.sweep ? across(0) : t >= m.back && t < m.back + m.sweep ? across(m.back) : null;
  // The step's edge, drawn behind the first beam and wiped by the second.
  const [start, finish] = m.floor_run;
  const from = t < m.back ? start : Math.max(start, beam ?? finish), to = t < m.sweep ? Math.max(start, beam) : t < m.back + m.sweep ? finish : start;
  const lines = clamp01(Math.min(t / m.grow, (m.end - t) / m.grow));
  return { y, beam, trace: to > from ? [from, to] : null, lines };
}
function playMark() {
  const plate = document.getElementById("app"), svg = plate.querySelector("svg"), dots = [...svg.querySelectorAll("circle")];
  if (reduced.matches || plate.dataset.playing) return;
  plate.dataset.playing = "1";
  const NS = "http://www.w3.org/2000/svg", m = MARK, g = m.geometry, x = (grid) => g.x0 + g.k * grid;
  // The trace, floor and stems under the samples, the beam over them.
  const group = (where) => {
    const el = document.createElementNS(NS, "g");
    el.setAttribute("fill", "none"); el.setAttribute("stroke", css("--plate-line"));
    return where(el);
  };
  const under = group((el) => svg.insertBefore(el, dots[0])), over = group((el) => svg.appendChild(el));
  const line = (x1, y1, x2, y2, w, o) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke-width="${w}" stroke-opacity="${o}"/>`;
  const draw = (t) => {
    const { y, beam, trace, lines } = markAt(t), parts = [];
    if (trace) {
      const [a, b] = trace, level = a < m.riser ? g.floor : g.top;
      const rises = a < m.riser && b > m.riser ? `H${f1(x(m.riser))}V${f1(g.top)}` : "";
      parts.push(`<path d="M${f1(x(a))},${f1(level)}${rises}H${f1(x(b))}" stroke-width="${g.line}" stroke-opacity="${m.line_opacity}"/>`);
    }
    if (lines > 0) {
      const [start, finish] = m.floor_run;
      parts.push(line(x(start), g.floor, x(start + (finish - start) * lines), g.floor, g.line, m.line_opacity));
      g.x.forEach((cx, i) => parts.push(line(cx, g.floor, cx, g.floor + (y[i] - g.floor) * lines, g.stem, m.line_opacity)));
    }
    under.innerHTML = parts.join("");
    over.innerHTML = beam != null ? line(x(beam), g.beam[0], x(beam), g.beam[1], g.beam_width, m.beam_opacity) : "";
    dots.forEach((d, i) => d.setAttribute("cy", f1(y[i])));
  };
  const t0 = performance.now();
  const step = (now) => {
    const t = Math.max(0, now - t0) / 1000;
    if (t < m.end) { draw(t); requestAnimationFrame(step); return; }
    under.remove(); over.remove();
    // Back to the mark's own markup, as design/marks/verge.svg writes it.
    dots.forEach((d, i) => d.setAttribute("cy", String(g.v[i])));
    delete plate.dataset.playing;
  };
  step(t0);
}
document.getElementById("app").addEventListener("pointerenter", playMark);

// Redrawn for a change of face: the dial and the chart draw in the face's colours.
function render() {
  dial(); chart(); tableHighlight(); closeScope(); sizeConsole();
}
document.addEventListener("facechange", render);
window.addEventListener("resize", () => { chart(); dial(); closeScope(); sizeConsole(); });
if (reduced.matches) { finish(seq.hero); finish(seq.chart); }
reduced.addEventListener("change", () => { if (reduced.matches) { finish(seq.hero); finish(seq.chart); } });
window.addEventListener("beforeprint", () => { finish(seq.hero); finish(seq.chart); });
render();
// Each sequence starts when it is first mostly in view, once the type it draws in has loaded.
const whenSeen = (el, s, threshold, delay) => {
  const io = new IntersectionObserver((seen) => { if (seen.some((x) => x.isIntersecting)) { io.disconnect(); start(s, delay); } }, { threshold });
  io.observe(el);
};
document.fonts.ready.then(() => { render(); whenSeen(dialface, seq.hero, 0.5, 250); whenSeen(chartHost, seq.chart, 0.6, 0); });
// The mark plays when its plate is first wholly in view below the header, which can cover it.
new IntersectionObserver((seen, io) => { if (seen.some((x) => x.isIntersecting)) { io.disconnect(); setTimeout(playMark, 200); } },
  { threshold: 1, rootMargin: `-${document.querySelector("header")?.offsetHeight ?? 0}px 0px 0px 0px` })
  .observe(document.getElementById("app"));

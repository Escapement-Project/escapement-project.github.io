// Verge's headline as a dial, in the figure at the head of Verge's page, played once when it first
// comes into view. The headline comes from data/landing.json (mculink-bench's extract.py writes it)
// through the page; colours and type from tokens.css.
(() => {
const DATA = JSON.parse(document.getElementById("data").textContent);
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const f1 = (v) => v.toFixed(1);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// The dial's sequence, played once when it first comes into view, smooth and timed in milliseconds.
// Reduced motion and printing show its end at once. Figure 1 sweeps in by itself.
const seq = {
  dial: { pos: -1, end: 0, at: (ms) => ms, frame: () => dialFrame() },
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

// The headline as a dial. The project's step is printed across the face, its top edge
// traced as a capture would be: NXP's firmware on the low run, Verge on the high one. The readings
// sit on the face's centre line, mirrored about the riser as the step is about the centre. The outer
// scale turns until the ratio sits at a red index at six, under the window that prints it, so the
// centre carries nothing but the step and the readings. The window prints the ratio from the start:
// the result is fixed, and only the scale moves to show it.
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
// leaves 0x at the index as the edge rises and slows into the ratio, out-cubic and no overshoot, so
// the index never points past the result; the scale's ink follows it. Each part follows the sweep's
// position or the scale's value, never a timer of its own, so none can lead or lag.
const SWEEP = { from: C - chord(LOW), to: 360, ms: 560 };
const sweepX = (t) => t < 0 ? -Infinity : SWEEP.from + (SWEEP.to - SWEEP.from) * clamp01(t / SWEEP.ms);
const passes = (x) => Math.round((x - SWEEP.from) / (SWEEP.to - SWEEP.from) * SWEEP.ms);
const TURN = { from: passes(RISER), ms: 1000 };
const readingAt = (t) => RATIO * (1 - (1 - clamp01((t - TURN.from) / TURN.ms)) ** 3);
seq.dial.end = TURN.from + TURN.ms;

const stepOpacity = () => css("color-scheme") === "dark" ? 0.16 : 0.13;
function dial() {
  // Its colours are the face's own variables, so a change of face recolours the drawing in place
  // without drawing it again; only the step's opacity is set per face.
  // Text sizes in the dial's 400 units, raised so nothing shows smaller than 11 px.
  const host = document.getElementById("dialface");
  const shown = host.clientWidth || 400, fs = (base) => Math.max(base, 11 * 400 / Math.min(shown, 480));
  const pt = (deg, r) => { const a = deg * Math.PI / 180; return [C + r * Math.sin(a), C - r * Math.cos(a)]; };
  const h = DATA.headline;
  const s = [`<svg viewBox="0 0 400 400" role="group" aria-label="The headline as a dial"><g aria-hidden="true">`];
  s.push(`<circle cx="${C}" cy="${C}" r="198" style="fill: var(--ring); stroke: var(--hair)"/><circle cx="${C}" cy="${C}" r="158" style="fill: var(--face)"/>`);
  // The outer scale, a tick every tenth, those up to the reading drawn in ink. It turns as one group;
  // each number turns back about its own place, so it stays upright wherever the scale stops.
  s.push(`<g id="scale">`);
  for (let i = 0; i <= SCALE.max * 10; i++) {
    const v = i / 10, major = i % 10 === 0, half = i % 5 === 0;
    const [x1, y1] = pt(scaleAt(v), 194), [x2, y2] = pt(scaleAt(v), major ? 172 : half ? 180 : 186);
    s.push(`<line class="tick" data-v="${v}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke-width="${major ? 2.4 : 1}"/>`);
    if (major) { const [tx, ty] = pt(scaleAt(v), 150); s.push(`<text class="number" data-at="${scaleAt(v)}" data-x="${f1(tx)}" data-y="${f1(ty)}" x="${f1(tx)}" y="${f1(ty + 5)}" text-anchor="middle" font-family='${css("--font-display")}' font-weight="${css("--display-weight")}" font-stretch="${css("--display-stretch")}" font-size="${fs(13)}" style="fill: var(--ink)">${v}×</text>`); }
  }
  s.push(`</g>`);
  // The logo's step itself, scaled so the logo's inner circle (r 23 of its 64) is the face (r 158):
  // design/marks/dial.svg's low run, riser and high run, each run ending on the circle.
  s.push(`<path transform="translate(${C} ${C}) scale(${K}) translate(-32 -32)" d="M9.796,38 H29 V20 H51.621 A23,23 0 0,1 54.204,26 H35 V44 H12.379 A23,23 0 0,1 9.796,38 Z" class="step" style="fill: var(--ink)" fill-opacity="${stepOpacity()}"/>`);
  // Its top edge, traced: NXP's blue along the low run, the riser in ink, Verge's teal along the high
  // run, one width throughout. Butt ends at a corner would leave half the corner's square bare, so
  // each run reaches half a width past the riser's line to fill it, and the riser stops at the runs'
  // edges: drawn under them, its ink showed through their antialiased edges. Each run is a band that
  // ends on the face's circle. The sweep draws it from the left (dialFrame).
  const TRACE = 2.5, half = TRACE / 2, f2 = (v) => v.toFixed(2);
  const fromLeft = (y, to) => `M${f2(C - chord(y + half))},${f2(y + half)} A158,158 0 0,1 ${f2(C - chord(y - half))},${f2(y - half)} H${f2(to)} V${f2(y + half)} Z`;
  const toRight = (y, from) => `M${f2(from)},${f2(y - half)} H${f2(C + chord(y - half))} A158,158 0 0,1 ${f2(C + chord(y + half))},${f2(y + half)} H${f2(from)} Z`;
  s.push(`<g class="sweep">`
    + `<path d="M${f2(RISER)},${f2(LOW - half)} V${f2(HIGH + half)}" fill="none" stroke-width="${TRACE}" style="stroke: var(--ink)"/>`
    + `<path d="${fromLeft(LOW, RISER + half)}" style="fill: var(--series-nxp)"/>`
    + `<path d="${toRight(HIGH, RISER - half)}" style="fill: var(--series-verge)"/></g>`);
  s.push(`<rect x="144" y="300" width="112" height="40" rx="4" style="fill: var(--lume); stroke: var(--window-edge)"/>`);
  s.push("</g>");
  // The readings, each a focusable group that says what it is. A reading's text shows a whole
  // character at a time as the sweep passes (dialFrame).
  const reading = (id, label, tip, body) => s.push(`<g class="reading" id="${id}" tabindex="0" role="img" aria-label="${label}" data-tip="${tip}">`
    + `<rect class="hit" fill="transparent"/><rect class="focus" fill="none" style="stroke: var(--ink)" stroke-width="2" rx="4"/>`
    + `<g class="shown">${body}</g></g>`);
  const figures = `font-family='${css("--font-figures")}' font-weight="${css("--figures-weight")}" font-stretch="${css("--figures-stretch")}"`;
  // A reading's name in two lines over its figure: the firmware, then which of it.
  const lines = (x, anchor, name, which, value) => [[name, C - 6 - fs(11) * 1.35], [which, C - 6]].map(([text, y]) =>
    `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family='${css("--font-text")}' font-weight="600" font-size="${fs(11)}" style="fill: var(--ink-2)">${text}</text>`).join("")
    + `<text x="${f1(x)}" y="${f1(C + 6 + fs(17) * .72)}" text-anchor="${anchor}" style="fill: var(--ink)"><tspan ${figures} font-size="${fs(17)}">${value}</tspan><tspan font-family='${css("--font-text")}' font-size="${fs(12)}" font-weight="500" style="fill: var(--ink-2)" dx="4">KiB/s</tspan></text>`;
  reading("r-nxp", `NXP's firmware V3.174: ${h.stock} KiB/s at ${h.stockAt} MHz, the fastest clock it reads right at`,
    `<b>NXP's firmware V3.174</b><br>${h.stock} KiB/s at ${h.stockAt} MHz, the fastest<br>clock it reads right at`, lines(RISER - 16, "end", "NXP's firmware", "V3.174", h.stock));
  reading("r-verge", `Verge, ${h.oursName}: ${h.ours} KiB/s at ${h.oursAt} MHz`,
    `<b>Verge, ${h.oursName}</b><br>${h.ours} KiB/s at ${h.oursAt} MHz`, lines(RISER_RIGHT + 16, "start", "Verge", h.oursName, h.ours));
  s.push(`<g class="reading" id="r-ratio" tabindex="0" role="img" aria-label="${h.ratio} times: Verge's ${h.ours} KiB/s over NXP's ${h.stock}" data-tip="<b>${h.ratio}×</b><br>Verge's ${h.ours} KiB/s over NXP's ${h.stock}">`
    + `<rect class="hit" fill="transparent" x="141" y="297" width="118" height="46" rx="6"/><rect class="focus" fill="none" style="stroke: var(--ink)" stroke-width="2" x="141" y="297" width="118" height="46" rx="6"/>`
    + `<text id="ratio" x="200" y="${300 + 20 + 22 * .36}" text-anchor="middle" ${figures} font-size="22" style="fill: var(--on-lume)">${h.ratio}×</text></g>`);
  // The red index at six, in the ring's band inside the ticks, pointing out at the reading.
  s.push(`<path aria-hidden="true" transform="rotate(${INDEX} ${C} ${C})" d="M${C - 7},${C - 159} L${C + 7},${C - 159} L${C},${C - 171} Z" style="fill: var(--hand)"/>`);
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
    // Each line's band, its height the line's, and the right edge of each character on it in order.
    texts.forEach((t, i) => {
      const b = boxes[i];
      t.dataset.band = `${f1(b.y - 2)} ${f1(b.height + 4)}`;
      t.dataset.edges = [...Array(t.getNumberOfChars()).keys()].map((c) => { const e = t.getExtentOfChar(c); return f1(e.x + e.width); }).join(" ");
    });
    g.dataset.at = passes(x0);
  }
  dialFrame();
}
// The sweep's clips: the trace drawn up to the sweep, and each reading's characters it has passed. They
// exist only while it sweeps, so the dial at rest refers to nothing by id, as reader view needs.
function sweepClips(svg, on) {
  const NS = "http://www.w3.org/2000/svg", clips = [...svg.querySelectorAll("clipPath")];
  if (!on) {
    for (const c of clips) c.remove();
    for (const g of svg.querySelectorAll("[clip-path]")) g.removeAttribute("clip-path");
    return;
  }
  if (clips.length) return;
  const clip = (id, rects, g) => {
    const c = svg.appendChild(document.createElementNS(NS, "clipPath"));
    c.id = id;
    for (const [y, height] of rects) {
      const r = c.appendChild(document.createElementNS(NS, "rect"));
      for (const [k, v] of Object.entries({ x: 0, y, width: 0, height })) r.setAttribute(k, v);
    }
    g.setAttribute("clip-path", `url(#${id})`);
  };
  clip("dial-sweep", [[0, 400]], svg.querySelector(".sweep"));
  for (const g of svg.querySelectorAll(".reading[data-at] .shown")) {
    clip(`${g.parentNode.id}-shown`, [...g.querySelectorAll("text")].map((t) => t.dataset.band.split(" ")), g);
  }
}
function dialFrame() {
  const svg = document.querySelector("#dialface svg");
  if (!svg) return;
  const t = seq.dial.pos, x = sweepX(t), v = readingAt(t), sweeping = t >= 0 && t < SWEEP.ms;
  svg.querySelector(".sweep").style.visibility = t < 0 ? "hidden" : "";
  sweepClips(svg, sweeping);
  if (sweeping) {
    svg.querySelector("#dial-sweep rect").setAttribute("width", f1(x));
    for (const g of svg.querySelectorAll(".reading[data-at] .shown")) {
      const bands = svg.querySelectorAll(`#${g.parentNode.id}-shown rect`);
      [...g.querySelectorAll("text")].forEach((text, i) => {
        const edges = text.dataset.edges.split(" ").map(Number).filter((e) => e <= x);
        bands[i].setAttribute("width", edges.length ? f1(Math.max(...edges)) : 0);
      });
    }
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

document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#dialface .reading")) dialTip(null); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") dialTip(null); });
// The dial's readings, by delegation: the dial is redrawn on a change of face or width.
const dialface = document.getElementById("dialface");
dialface.addEventListener("pointerover", (e) => { const g = e.target.closest(".reading"); if (g) dialTip(g); });
dialface.addEventListener("pointerout", (e) => { const g = e.target.closest(".reading"); if (g && e.pointerType === "mouse" && !g.contains(e.relatedTarget)) dialTip(null); });
dialface.addEventListener("focusin", (e) => { const g = e.target.closest(".reading"); if (g) dialTip(g); });
dialface.addEventListener("focusout", () => dialTip(null));


// A change of face: the dial takes its new colours from the page's, as it names the face's
// variables; nothing changes size, so nothing is drawn again. Only the step's opacity is per face.
document.addEventListener("facechange", () => {
  document.querySelector("#dialface .step")?.setAttribute("fill-opacity", stepOpacity());
});
window.addEventListener("resize", dial);
if (reduced.matches) finish(seq.dial);
reduced.addEventListener("change", () => { if (reduced.matches) finish(seq.dial); });
window.addEventListener("beforeprint", () => finish(seq.dial));
dial();
// The sequence starts when the dial is first mostly in view, once the type it draws in has loaded.
const whenSeen = (el, s, threshold, delay) => {
  const io = new IntersectionObserver((seen) => { if (seen.some((x) => x.isIntersecting)) { io.disconnect(); start(s, delay); } }, { threshold });
  io.observe(el);
};
document.fonts.ready.then(() => { dial(); whenSeen(dialface, seq.dial, 0.5, 250); });
})();

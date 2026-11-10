// The landing page: the hero dial and its one-time entry, and the Verge section's traces and
// commands. The headline comes from data/landing.json (mculink-bench's extract.py writes it) through
// the page; colours and type from tokens.css. Figure 1 and Table 1 are on Verge's page (measured.js).
const DATA = JSON.parse(document.getElementById("data").textContent);
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const f1 = (v) => v.toFixed(1);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// The hero's sequence, played once when it first comes into view, smooth and timed in milliseconds.
// Reduced motion and printing show its end at once. Figure 1 sweeps in by itself.
const seq = {
  hero: { pos: -1, end: 0, at: (ms) => ms, frame: () => heroFrame() },
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
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const sweepX = (t) => t < 0 ? -Infinity : SWEEP.from + (SWEEP.to - SWEEP.from) * clamp01(t / SWEEP.ms);
const passes = (x) => Math.round((x - SWEEP.from) / (SWEEP.to - SWEEP.from) * SWEEP.ms);
const TURN = { from: passes(RISER), ms: 1000 };
const readingAt = (t) => RATIO * (1 - (1 - clamp01((t - TURN.from) / TURN.ms)) ** 3);
seq.hero.end = TURN.from + TURN.ms;

const stepOpacity = () => css("color-scheme") === "dark" ? 0.16 : 0.13;
function dial() {
  // Its colours are the face's own variables, so a change of face recolours the drawing in place
  // (and fades it with the page) without drawing it again; only the step's opacity is set per face.
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
  // The logo's step itself, scaled so the logo's inner circle (r 23 of its 64) is the face (r 158).
  // The clip goes on a group: on the scaled path it would scale with it.
  s.push(`<clipPath id="face"><circle cx="${C}" cy="${C}" r="158"/></clipPath><clipPath id="dial-sweep"><rect x="0" y="0" width="0" height="400"/></clipPath>`);
  s.push(`<g clip-path="url(#face)"><path transform="translate(${C} ${C}) scale(${K}) translate(-32 -32)" d="M4,38 H29 V20 H60 V26 H35 V44 H4 Z" class="step" style="fill: var(--ink)" fill-opacity="${stepOpacity()}"/></g>`);
  // Its top edge, traced: NXP's blue along the low run, the riser in ink, Verge's teal along the high
  // run, one width throughout. Butt ends at a corner would leave half the corner's square bare, so
  // each run reaches half a width past the riser's line to fill it, and the riser stops at the runs'
  // edges: drawn under them, its ink showed through their antialiased edges. The face clips the ends.
  const TRACE = 2.5, half = TRACE / 2;
  s.push(`<g clip-path="url(#face)"><g clip-path="url(#dial-sweep)" fill="none" stroke-width="${TRACE}">`
    + `<path d="M${RISER.toFixed(2)},${(LOW - half).toFixed(2)} V${(HIGH + half).toFixed(2)}" style="stroke: var(--ink)"/>`
    + `<path d="M0,${LOW.toFixed(2)} H${(RISER + half).toFixed(2)}" style="stroke: var(--series-nxp)"/>`
    + `<path d="M${(RISER - half).toFixed(2)},${HIGH.toFixed(2)} H400" style="stroke: var(--series-verge)"/></g></g>`);
  s.push(`<rect x="144" y="300" width="112" height="40" rx="4" style="fill: var(--lume); stroke: var(--window-edge)"/>`);
  s.push("</g>");
  // The readings, each a focusable group that says what it is. A reading's text shows a whole
  // character at a time as the sweep passes, through a clip with a band per line.
  const reading = (id, label, tip, body) => s.push(`<g class="reading" id="${id}" tabindex="0" role="img" aria-label="${label}" data-tip="${tip}">`
    + `<rect class="hit" fill="transparent"/><rect class="focus" fill="none" style="stroke: var(--ink)" stroke-width="2" rx="4"/>`
    + `<clipPath id="${id}-shown"><rect/><rect/></clipPath><g clip-path="url(#${id}-shown)">${body}</g></g>`);
  const figures = `font-family='${css("--font-figures")}' font-weight="${css("--figures-weight")}" font-stretch="${css("--figures-stretch")}"`;
  const lines = (x, anchor, name, value) => `<text x="${f1(x)}" y="${C - 6}" text-anchor="${anchor}" font-family='${css("--font-text")}' font-weight="600" font-size="${fs(11)}" letter-spacing="1.2" style="fill: var(--ink-2)">${name}</text>`
    + `<text x="${f1(x)}" y="${f1(C + 6 + fs(17) * .72)}" text-anchor="${anchor}" style="fill: var(--ink)"><tspan ${figures} font-size="${fs(17)}">${value}</tspan><tspan font-family='${css("--font-text")}' font-size="${fs(12)}" font-weight="500" style="fill: var(--ink-2)" dx="4">KiB/s</tspan></text>`;
  reading("r-nxp", `NXP's firmware V3.174: ${h.stock} KiB/s at ${h.stockAt} MHz, the fastest clock it reads right at`,
    `<b>NXP's firmware V3.174</b><br>${h.stock} KiB/s at ${h.stockAt} MHz, the fastest<br>clock it reads right at`, lines(RISER - 16, "end", "NXP 3.174", h.stock));
  reading("r-verge", `Verge, ${h.oursName}: ${h.ours} KiB/s at ${h.oursAt} MHz`,
    `<b>Verge, ${h.oursName}</b><br>${h.ours} KiB/s at ${h.oursAt} MHz`, lines(RISER_RIGHT + 16, "start", "VERGE", h.ours));
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

// The Verge section. A term names a wire, which opens that wire's trace under the Wires row, or a
// feature; either way the verge command that drives it shows under the list, described in the
// tool's own help text. The page itself shows verge list, for a reader without scripts.
const READS = "Read target memory over SWD, JTAG or cJTAG, as probe-rs's read does.";
const COMMANDS = {
  list: [document.getElementById("cmd").textContent, document.getElementById("cmd-what").textContent],
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
  // The face's own variables, as the dial's: a change of face recolours an open trace in place.
  const probe = "var(--series-verge)", target = "var(--ink)", muted = "var(--ink-2)", hair = "var(--hair)";
  const s = [`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${spec.title}" style='font-family:${css("--font-text")};font-size:11px'>`];
  for (const m of new Set(spec.notes.flat().filter((v) => typeof v === "number"))) s.push(`<line x1="${f1(X(m))}" x2="${f1(X(m))}" y1="${top - 2}" y2="${top + spec.wires.length * SCOPE.row}" style="stroke: ${hair}"/>`);
  s.push(`<clipPath id="scope-sweep"><rect x="0" y="0" width="0" height="${H}"/></clipPath>`);
  for (const [a, b, text] of spec.notes) s.push(`<text class="note" x="${f1((X(a) + X(b)) / 2)}" y="11" text-anchor="middle" style="fill: ${muted}">${text}</text>`);
  s.push(`<g clip-path="url(#scope-sweep)" fill="none" stroke-width="1.6">`);
  spec.wires.forEach(([name, v], w) => {
    const y0 = top + w * SCOPE.row, hi = y0 + 6, lo = y0 + 20, mid = y0 + 13;
    if (v === "clock") {
      let d = `M${L},${lo}`;
      for (let i = 0; i < n; i++) d += `H${f1(X(i) + cw / 2)}V${hi}H${f1(X(i + 1))}V${lo}`;
      s.push(`<path d="${d}" style="stroke: ${probe}"/>`);
      return;
    }
    let prev = null;
    for (let i = 0; i < n; i++) {
      const c = v[i], y = "1b".includes(c) ? hi : c === "z" ? mid : lo;
      const stroke = c === "z" ? muted : "ab".includes(c) ? target : probe;
      const extra = c === "z" ? ` stroke-dasharray="2 3" stroke-width="1.2"` : c === "x" ? ` stroke-opacity=".35"` : "";
      const rise = prev != null && prev !== y && c !== "z" && v[i - 1] !== "z" ? `M${f1(X(i))},${prev}V${y}` : "";
      s.push(`<path d="${rise}M${f1(X(i))},${y}H${f1(X(i + 1))}" style="stroke: ${stroke}"${extra}/>`);
      prev = y;
    }
  });
  s.push("</g>");
  spec.wires.forEach(([name], w) => s.push(`<text x="4" y="${top + w * SCOPE.row + 17}" style="fill: ${muted}">${name}</text>`));
  const ky = H - 7;
  s.push(`<line x1="4" x2="18" y1="${ky - 4}" y2="${ky - 4}" style="stroke: ${probe}" stroke-width="2"/><text x="22" y="${ky}" style="fill: ${muted}">probe drives</text>`);
  s.push(`<line x1="104" x2="118" y1="${ky - 4}" y2="${ky - 4}" style="stroke: ${target}" stroke-width="2"/><text x="122" y="${ky}" style="fill: ${muted}">target drives</text>`);
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
// Pointing at a term previews its command. A click, or Enter, pins it, so the command stays to be
// selected or copied, and copies it (static/js/copy.js); leaving a term goes back to the pinned one,
// or to verge list. Escape, or a click anywhere but a term or the console, unpins.
let pinned = null;
const show = (ref) => { showCommand(ref?.dataset.cmd ?? "list"); if (ref?.dataset.wire) openScope(ref.dataset.wire); else closeScope(); };
const vergeOff = () => show(pinned);
const unpin = () => { pinned?.classList.remove("pinned"); pinned = null; vergeOff(); };
const pin = (ref) => {
  pinned?.classList.remove("pinned");
  pinned = ref;
  ref.classList.add("pinned");
  show(ref);
  window.copyCommand?.(document.getElementById("console"));
};
for (const ref of document.querySelectorAll("#verge .ref")) {
  ref.addEventListener("pointerenter", () => show(ref));
  ref.addEventListener("focus", () => show(ref));
  ref.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") vergeOff(); });
  ref.addEventListener("blur", vergeOff);
  ref.addEventListener("click", () => pin(ref));
  ref.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pin(ref); } });
}
document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#verge .ref, #console")) unpin(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") unpin(); });

function render() {
  dial(); closeScope(); sizeConsole();
}
// A change of face: the dial and an open trace take their new colours from the page's, and fade with
// it; nothing changes size, so nothing is drawn or measured again. Only the step's opacity is per face.
document.addEventListener("facechange", () => {
  document.querySelector("#dialface .step")?.setAttribute("fill-opacity", stepOpacity());
});
window.addEventListener("resize", () => { dial(); closeScope(); sizeConsole(); });
if (reduced.matches) finish(seq.hero);
reduced.addEventListener("change", () => { if (reduced.matches) finish(seq.hero); });
window.addEventListener("beforeprint", () => finish(seq.hero));
render();
// The hero's sequence starts when it is first mostly in view, once the type it draws in has loaded.
const whenSeen = (el, s, threshold, delay) => {
  const io = new IntersectionObserver((seen) => { if (seen.some((x) => x.isIntersecting)) { io.disconnect(); start(s, delay); } }, { threshold });
  io.observe(el);
};
document.fonts.ready.then(() => { render(); whenSeen(dialface, seq.hero, 0.5, 250); });

// The landing page: the Verge section's traces and commands. Colours and type from tokens.css.
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const f1 = (v) => v.toFixed(1);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const clamp01 = (v) => Math.max(0, Math.min(1, v));

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
  // The face's own variables: a change of face recolours an open trace in place.
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

// An open trace takes its new colours from the page's on a change of face, as it names the face's
// variables: nothing changes size, so nothing is drawn or measured again.
function render() {
  closeScope(); sizeConsole();
}
window.addEventListener("resize", render);
render();
document.fonts.ready.then(render);

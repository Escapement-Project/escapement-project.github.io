// The landing page: the hero's mark, and the Verge section's commands.

// The hero's mark plays Lock once, as the hero comes into view and its type has loaded: header.js's
// ProjectMark, which holds Lock's first frame until then. The plates' marks (mark.js) wait for it,
// so two marks never play at once: until Lock is still, or at once where the page opens with the
// hero out of view.
const heroMark = document.querySelector(".hero-mark svg"), hero = heroMark && window.ProjectMark?.mount(heroMark);
let heroStill;
window.marksWait = new Promise((resolve) => { heroStill = resolve; });
if (hero) {
  hero.ready();
  let first = true;
  const io = new IntersectionObserver((seen) => {
    const seenNow = seen.some((x) => x.isIntersecting);
    if (first && !seenNow) heroStill();
    first = false;
    if (!seenNow) return;
    io.disconnect();
    document.fonts.ready.then(() => setTimeout(() => hero.arrive().then(heroStill), 250));
  }, { threshold: 0.4 });
  io.observe(heroMark);
} else heroStill();

// The Verge section. A term names a wire or a feature, and the verge command that drives it shows
// under the list, described in the tool's own help text. The page itself shows verge list, for a
// reader without scripts.
const READS = "Read target memory over SWD, JTAG or cJTAG, as probe-rs's read does.";
const COMMANDS = {
  list: [document.getElementById("cmd").textContent, document.getElementById("cmd-what").textContent],
  swd: ["verge read --chip MSPM0L1306 b32 0x20000000 4", READS],
  jtag: ["verge read --chip CC1312R --protocol jtag b32 0 64", READS],
  cjtag: ["verge read --chip CC1312R --protocol cjtag b32 0 64", READS],
  oscan: ["verge read --chip CC1312R --protocol cjtag --cjtag-format oscan5 b32 0 64", "Read target memory over cJTAG in the scan format you ask for; OScan1 when left out."],
  power: ["verge power on", "Read or switch the target supply of an MCU-Link Pro running Verge."],
  energy: ["verge energy watch", "Show the capture live: the newest pair, the total, and graphs of current and power."],
  dio: ["verge dio --high 0,1,2", "Drive and read the four DIO pins of an MCU-Link or MCU-Link Pro running Verge."],
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

// Pointing at a term previews its command. A click, or Enter, pins it, so the command stays to be
// selected or copied with the console's Copy button; leaving a term goes back to the pinned one, or
// to verge list. Escape, or a click anywhere but a term or the console, unpins. The terms are plain
// words without scripts: this makes them terms and puts them in the tab order.
let pinned = null;
const show = (term) => showCommand(term?.dataset.cmd ?? "list");
const vergeOff = () => show(pinned);
const unpin = () => { pinned?.classList.remove("pinned"); pinned = null; vergeOff(); };
const pin = (term) => {
  pinned?.classList.remove("pinned");
  pinned = term;
  term.classList.add("pinned");
  show(term);
};
for (const term of document.querySelectorAll("#verge [data-cmd]")) {
  term.classList.add("term");
  term.tabIndex = 0;
  term.addEventListener("pointerenter", () => show(term));
  term.addEventListener("focus", () => show(term));
  term.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") vergeOff(); });
  term.addEventListener("blur", vergeOff);
  term.addEventListener("click", () => pin(term));
  term.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pin(term); } });
}
document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#verge .term, #console")) unpin(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") unpin(); });

window.addEventListener("resize", sizeConsole);
sizeConsole();
document.fonts.ready.then(sizeConsole);

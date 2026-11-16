// The landing page: the hero's mark, and the Verge section's commands.

// The hero's mark plays Lock once, as the hero comes into view and its type has loaded: header.js's
// ProjectMark, which holds Lock's first frame until then.
const heroMark = document.querySelector(".hero-mark svg"), hero = heroMark && window.ProjectMark?.mount(heroMark);
if (hero) {
  hero.ready();
  const io = new IntersectionObserver((seen) => {
    if (seen.some((x) => x.isIntersecting)) { io.disconnect(); document.fonts.ready.then(() => setTimeout(() => hero.arrive(), 250)); }
  }, { threshold: 0.4 });
  io.observe(heroMark);
}

// The Verge section. A term names a wire or a feature, and the verge command that drives it shows
// under the list, described in the tool's own help text. The page itself shows verge list, for a
// reader without scripts.
const READS = "Read target memory over SWD, JTAG or cJTAG, as probe-rs's read does.";
const COMMANDS = {
  list: [document.getElementById("cmd").textContent, document.getElementById("cmd-what").textContent],
  swd: ["verge read --chip <chip> --protocol swd b32 0x20000000 4", READS],
  jtag: ["verge read --chip <chip> --protocol jtag b32 0x20000000 4", READS],
  cjtag: ["verge read --chip <chip> --protocol cjtag b32 0x20000000 4", READS],
  oscan: ["verge cjtag", "Show or limit the cJTAG scan formats a unit running Verge offers a host."],
  power: ["verge power on", "Read or switch the target supply of an MCU-Link Pro running Verge."],
  energy: ["verge energy watch", "Show the capture live: the newest pair, the total, and graphs of current and power."],
  dio: ["verge dio --high 0,1", "Drive and read the four DIO pins of an MCU-Link or MCU-Link Pro running Verge."],
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
// selected or copied, and copies it (static/js/copy.js); leaving a term goes back to the pinned one,
// or to verge list. Escape, or a click anywhere but a term or the console, unpins.
let pinned = null;
const show = (ref) => showCommand(ref?.dataset.cmd ?? "list");
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

window.addEventListener("resize", sizeConsole);
sizeConsole();
document.fonts.ready.then(sizeConsole);

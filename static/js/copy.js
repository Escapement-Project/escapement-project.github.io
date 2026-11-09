// Click-to-copy for the command lines on the site's pages: a console (.console: a drawn prompt and
// a command) and a code block in a doc. Each gets a Copy button; a click on the command copies too,
// unless the reader is selecting part of it. The button says what happened for a moment, and a
// status line tells a screen reader. Where the clipboard refuses, the command is selected instead,
// for the reader to copy. The landing page's script copies its console through window.copyCommand.
(() => {
  const status = Object.assign(document.createElement("p"), { className: "sr-only" });
  status.setAttribute("role", "status");
  document.body.append(status);

  // The command as a reader would type it: the prompt is drawn, not part of it.
  const textOf = (box) => {
    const code = box.querySelector("code") ?? box;
    if (box.tagName === "PRE" || box.classList.contains("codeblock")) return code.textContent.replace(/\n$/, "");
    return [...code.childNodes].filter((n) => !(n.nodeType === 1 && n.getAttribute("aria-hidden") === "true"))
      .map((n) => n.textContent).join("").trim();
  };

  async function copy(box) {
    const button = box.querySelector(":scope > .copy"), text = textOf(box);
    let said = "Copied";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(box.querySelector("code") ?? box);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      said = "Selected";
    }
    box.classList.add("copied");
    if (button) button.textContent = said;
    status.textContent = `${said}: ${text}`;
    clearTimeout(box.copyTimer);
    box.copyTimer = setTimeout(() => { box.classList.remove("copied"); if (button) button.textContent = "Copy"; }, 1600);
  }
  window.copyCommand = copy;

  const boxes = [...document.querySelectorAll(".console")];
  // A doc's code block scrolls sideways, so its button sits on a wrapper that does not.
  for (const pre of document.querySelectorAll(".doc pre")) {
    const wrap = Object.assign(document.createElement("div"), { className: "codeblock" });
    pre.before(wrap);
    wrap.append(pre);
    boxes.push(wrap);
  }
  for (const box of boxes) {
    const button = Object.assign(document.createElement("button"), { type: "button", className: "copy", textContent: "Copy" });
    box.append(button);
    button.addEventListener("click", () => copy(box));
    box.querySelector("code")?.addEventListener("click", () => { if (!getSelection().toString()) copy(box); });
  }
})();

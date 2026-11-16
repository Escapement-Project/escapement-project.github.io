+++
title = "Verge"
description = "Open CMSIS-DAP firmware for NXP's MCU-Link and MCU-Link Pro, and verge, the tool that installs and updates it."
template = "verge.html"

# The docs, in the order the page lists them. Each lives in its code repository, beside the code it
# describes; .github/verge-docs.py copies them into content/verge/docs/ before the build. `name` is
# the page's address under /verge/docs/; a doc whose file does not exist yet shows as coming.
# `about` is the line under its link; a group's `about` is its row on the overview.
[[extra.groups]]
title = "Using Verge"
about = "Getting started, updating and recovering a probe, the wires and their clocks, trace and serial ports, the Pro and its energy capture, and every verge command."
docs = [
  { name = "getting-started", title = "Getting started", repo = "verge", path = "docs/getting-started.md", about = "Which probes it runs on, installing verge, and the first update." },
  { name = "updating", title = "Updating and recovery", repo = "verge", path = "docs/updating.md", about = "How each firmware updates, the jumpers, ISP mode, and updating many probes." },
  { name = "desktop-app", title = "The desktop app", repo = "verge", path = "docs/desktop-app.md", about = "verge-gui: updating, the DIO pins, the Pro's supply, and watching and recording energy." },
  { name = "wires", title = "Wires and clocks", repo = "mculink-verge", path = "docs/wires.md", about = "SWD, JTAG and cJTAG, the clock you get for the one you ask, and each wire's limits." },
  { name = "trace-and-serial", title = "Trace and serial ports", repo = "mculink-verge", path = "docs/trace-and-serial.md", about = "SWO capture and the target's serial ports." },
  { name = "probes", title = "Probes and jumpers", repo = "mculink-verge", path = "docs/probes.md", about = "What each probe has, and what each jumper turns off." },
  { name = "pro", title = "The Pro", repo = "mculink-verge", path = "docs/pro.md", about = "Target supply, DIO pins, the SPI and I2C bridges, and Verge Aux." },
  { name = "energy", title = "Energy capture", repo = "verge", path = "docs/energy.md", about = "Measuring a target's current and energy on the Pro, live or to a file." },
  { name = "verge-command", title = "The verge command", repo = "verge", path = "docs/command.md", about = "Every command, and the doc for each." },
]

[[extra.groups]]
title = "For host authors"
about = "For a tool that drives the probe: how it identifies itself, its vendor commands, Verge Aux and the energy stream, bringing up a cJTAG target, and the Rust library verge is built on."
docs = [
  { name = "host-interface", title = "Host interface", repo = "mculink-verge", path = "docs/host-interface.md", about = "How the probe identifies itself, its vendor commands, Verge Aux and the energy stream." },
  { name = "cjtag-targets", title = "cJTAG targets", repo = "mculink-verge", path = "docs/cjtag-targets.md", about = "Bringing up a TI cJTAG target: power, the activation, other formats and detach." },
  { name = "library", title = "The verge-probe library", repo = "verge-probe", path = "docs/library.md", about = "Finding probes, debugging with Verge's commands beside probe-rs, and the Pro's supply, pins, bridges and energy, from Rust." },
]

[[extra.groups]]
title = "Building it yourself"
about = "Building, checking and releasing the firmware and verge."
docs = [
  { name = "building-the-firmware", title = "Building the firmware", repo = "mculink-verge", path = "README.md", about = "Building, checking and releasing mculink-verge, and what a failure looks like." },
  { name = "building-verge", title = "Building verge", repo = "verge", path = "README.md", about = "Building verge and making its releases." },
]

[[extra.groups]]
title = "Internals"
about = "How the firmware works inside: the two cores, concurrency, the buses, timing, code generation, cJTAG, the boards and the stacks."
docs = [
  { name = "architecture", title = "Architecture", repo = "mculink-verge", path = "ARCHITECTURE.md", about = "What each core runs, and the path from each USB interface to its feature." },
  { name = "concurrency", title = "Concurrency", repo = "mculink-verge", path = "CONCURRENCY.md", about = "The state the cores, interrupts and DMA share, and what orders each access." },
  { name = "buses", title = "Buses", repo = "mculink-verge", path = "BUSES.md", about = "Which code uses which bus port, and when." },
  { name = "timing", title = "Timing", repo = "mculink-verge", path = "TIMING.md", about = "The timing rules the SWD generator places instructions by." },
  { name = "code-generation", title = "Code generation", repo = "mculink-verge", path = "CODEGEN.md", about = "Generating the SWD, JTAG and cJTAG transfers at run time." },
  { name = "cjtag", title = "cJTAG", repo = "mculink-verge", path = "CJTAG.md", about = "cJTAG as the firmware uses it: the standard, the wire, and ARM's paths." },
  { name = "boards", title = "Boards", repo = "mculink-verge", path = "BOARDS.md", about = "Both boards' pins and straps, and the Pro's circuits." },
  { name = "stacks", title = "Stacks", repo = "mculink-verge", path = "STACK.md", about = "Where each core's stack sits, and how an overflow is caught." },
]

[[extra.groups]]
title = "Measurement log"
about = "The evidence behind the figures on the other pages: what the bench measured, newest first."
docs = [
  { name = "measurement-log", title = "Measurement log", repo = "mculink-verge", path = "MEASUREMENTS.md", about = "What the bench measured, each entry dated and true of the build it names." },
]
+++

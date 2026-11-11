+++
title = "Escapement Project"
description = "Open debug tools that are correct, fast and easy to use. The first is Verge, open firmware for NXP's MCU-Link debug probes; tickwave is a web viewer for mixed-signal captures."

# The hero's statement and its lede, which the link preview carries too (design/build.py).
# The Source section's index, in this order. A repository without a language is not published yet
# and shows as coming. `summary` is the line on its link preview (design/build.py), `icon` an icon
# from design/tokens.toml's [icon] that the preview carries, and `licence` one that differs from
# the default below.
[extra]
statement = "Open debug tools that are correct, fast and easy to use"
lede = "We build tools for debugging embedded targets, starting with Verge and tickwave. We publish the measurements behind every claim we make, with the code that takes them."
licence = "Apache License 2.0"

[[extra.repos]]
name = "mculink-verge"
summary = "Open CMSIS-DAP firmware for NXP's MCU-Link and MCU-Link Pro, with SWD, JTAG and cJTAG."
icon = "verge"
language = "C"
about = "The firmware: open CMSIS-DAP firmware for the MCU-Link and MCU-Link Pro. It speaks SWD, JTAG and cJTAG in four formats, captures SWO and runs the serial ports. On the Pro it adds GPIO, SPI and I2C bridges, switched target power and energy measurement."

[[extra.repos]]
name = "verge"
summary = "Install, update and control Verge on NXP's MCU-Link, from the command line or a desktop app."
icon = "verge"
language = "Rust"
about = "A command-line tool and a desktop app to install, update and control the firmware. A unit running Verge, or NXP's firmware from V3.122, updates without the ISP jumper. The app also records energy captures."

[[extra.repos]]
name = "verge-probe"
summary = "The Rust library under verge: probe discovery, updates, the Pro's bridges and energy monitoring."
icon = "verge"
language = "Rust"
about = "The library under verge: probe discovery, firmware identification and updates, the Pro's bridges and energy monitoring. Target debugging goes through probe-rs."

[[extra.repos]]
name = "mculink-bench"
summary = "How Verge compares with NXP's firmware, and the tools that measure it."
language = "Python, Rust"
about = "The measurements, and the tools that take them: throughput through probe-rs and our own host, requested clocks checked on the wire, flash programming times. It builds the measurements page."

[[extra.repos]]
name = "mculink-stock-notes"
summary = "What NXP's firmware for the MCU-Link does, observed on running units."
language = "Notes"
about = "What NXP's firmware does, observed on running units: how it identifies itself, how it updates, and the clocks it puts on the wire. Each note says how it was observed."

[[extra.repos]]
name = "tickwave"
icon = "tickwave"
licence = "MIT or Apache License 2.0"
about = "A logic and MSO capture viewer for the web, to show wire recordings inside a page."
+++

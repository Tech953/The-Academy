---
name: Deck export safe areas
description: Layout rules for preventing dense legacy slides from clipping or overlapping at the fixed export size.
---

For legacy slides rendered into a fixed 1920×1080 export frame, reserve a shared bounded content viewport below the title and keep explanatory notes in normal flow beneath their cards. Dense grids and panels need explicit minimum-height constraints and copy that fits the available rows.

**Why:** Browser previews can make a slide appear to have more vertical room than the export frame. Intrinsic grid minimum sizes and absolutely positioned notes then push content into the footer or clip the last rows.

**How to apply:** When editing a dense slide, validate at 1920×1080, use a shared content height with hidden outer overflow only as a boundary, and reduce spacing or copy before relying on clipping. Keep footer-adjacent notes out of absolute positioning unless their bounds are explicitly proven.
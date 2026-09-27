---
name: Slide export freshness
description: How directory-discovered PPTX/PDF pairs are checked when no shared export-run metadata exists.
---

Directory-discovered pairs use filesystem modification times as the available provenance signal. Treat exports more than 15 minutes apart as ambiguous, and require both exports to be at least as new as the latest current slide input. Explicit `--pptx` and `--pdf` paths intentionally bypass freshness checks while retaining content validation.

**Why:** The current handoff does not record a shared export-run identifier, while explicit paths are operator-selected reviewed files. Modification times are a low-impact proxy for the default directory workflow.

**How to apply:** Keep freshness tests aligned with the 15-minute heuristic and current-source scan. Prefer a shared export fingerprint if the export workflow gains a reliable way to write one.
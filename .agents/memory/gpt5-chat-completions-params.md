---
name: GPT-5 family chat completions params
description: How to call gpt-5 / gpt-5-mini / gpt-5.1 via the OpenAI Chat Completions API without empty/truncated responses.
---

When switching a Chat Completions call from a non-reasoning model (e.g. gpt-4.1-mini) to a gpt-5-family reasoning model (gpt-5, gpt-5-mini, gpt-5.1), a plain model-string swap is not enough:

- Use `max_completion_tokens` instead of `max_tokens` — the API rejects/ignores `max_tokens` for these models.
- Don't pass a custom `temperature`; gpt-5-family models via Chat Completions only support the default value. Just omit the param.
- Pass `reasoning_effort: "low"` (or "minimal") for latency-sensitive/short-output use cases (dialogue lines, short descriptions, JSON parsing). Reasoning tokens are drawn from the same `max_completion_tokens` budget as the visible output.
- Increase token budgets meaningfully above what the old model needed (roughly 2-3x), because reasoning tokens eat into the same budget. Symptom of too-low a budget: `finish_reason: "length"` with an empty/truncated `message.content`, even though the request "succeeded."

**Why:** Discovered while migrating this app's 5 OpenAI call sites from gpt-4.1-mini to gpt-5-mini — every endpoint returned empty content until max_completion_tokens was raised and reasoning_effort was set to low.

**How to apply:** Any time a task asks to upgrade a chat-completions call to a gpt-5-family model, apply all of the above together, then manually test each affected endpoint (don't just trust type-checking) since failures show up as runtime empty-response errors, not compile errors.

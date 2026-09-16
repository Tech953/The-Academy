# Learning Adventure deck build

The deck release check validates the portable deck exports after the code and
route checks complete:

```bash
pnpm --filter @workspace/academy-learning-adventure run release-check
```

The final step runs `validate-exports` against the one PPTX and one PDF in
`.local/outputs`. A missing, malformed, unreadable, or short export stops the
handoff with the validator's actionable error.

When reviewed files live somewhere else, pass both paths through the release
check. They are forwarded to the export validator after all preceding checks:

```bash
pnpm --filter @workspace/academy-learning-adventure run release-check -- \
  --pptx /path/to/reviewed/academy.pptx \
  --pdf /path/to/reviewed/academy.pdf
```

The workflow is fail-fast: it does not run export validation if typecheck,
slide validation, build, base-path, bundle, or route validation fails.
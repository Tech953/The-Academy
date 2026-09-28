---
name: GitHub Actions write scope
description: Permission boundary when adding or editing workflow files through a connected GitHub OAuth integration
---

GitHub requires the separate `workflow` OAuth scope to create or update files under `.github/workflows`; `repo` alone is insufficient for the Contents API.

**Why:** Repository access and Actions workflow authoring are separately protected. Retrying through lower-level Git APIs or another route to evade the scope is not appropriate.

**How to apply:** If a connected integration does not grant `workflow`, ask the user to publish the workflow through an authorized GitHub account or provide an existing runner/job. Do not claim a workflow ran until a real run is confirmed.
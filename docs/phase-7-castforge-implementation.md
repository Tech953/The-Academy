# Phase 7 — CastForge: implementation record

Companion to the design brief (`docs/phase-7-castforge-brief.md`,
landed separately by PR #12) and the roadmap
(`docs/GED_REMEDIATION_ROADMAP.md`, landed by this phase). This file
records what was actually built, where, and in what order — so the
owner can merge the stack with receipts and audit it later.

## Merge order (stacked branches — merge in this order, owner only)

| Sub-phase | Branch | PR | Scope |
|---|---|---|---|
| 7.0 Schema + faculty seed slots | `phase-7/7.0-schema` | #13 | §4 schema, faculty slots (all EMPTY), CastAuditor skeleton |
| 7.1 Generator | `phase-7/7.1-generator` | #14 | Pure, deterministic seeded generation |
| 7.2 CastAuditor gate | `phase-7/7.2-gate` | #15 | All six §7 rules + one failing fixture per rule |
| 7.3 Chat layer | `phase-7/7.3-chat` | #16 | Prompt builder, one entry point, memory-log wiring |
| 7.4 Differential memory | `phase-7/7.4-memory` | #17 | Read-side unification + §9.1 divergence proof |
| 7.5 Mentor teaching wiring | `phase-7/7.5-mentor` | #18 | Mentor → CourseWeaver → same mastery record (§9.2) |
| 7.6 Docs + CI | `phase-7/7.6-docs-ci` | (this PR) | Roadmap, this record, vitest workflow |

Each PR is based on the previous sub-phase branch, not `main`,
because the earlier PRs were unmerged when the later ones were
written — stacking keeps each diff exactly its own scope with green
tests on its branch. Merge #13 → #14 → #15 → #16 → #17 → #18 → 7.6,
in order. Nothing in this stack is merged by the author.

## Where the code lives

All CastForge code is additive under `artifacts/academy/src/lib/cast/`:

- `schema.ts` — §4 engram record, `validateEngramSchema`
- `fixtures.ts` — shared valid-engram test fixture
- `generated/README.md` — bank home (banks land only after gate pass)
- `seeds/faculty/slots.ts` — four EMPTY mentor slots, `facultyIds()`
- `locations.ts` — shared academy location registry
- `generator.ts` — pure/deterministic generation, `generateCastBank`
- `castAuditor.ts` — the §7 gate + `auditCastBank`
- `chat.ts` — `buildCastPrompt`, `openCastChat`, `recordCastExchange`
- `memory.ts` — `toRadiantMemories` (unified read view)
- `mentor.ts` — `assignMentorWork`, `submitMentorWork`,
  `mentorAssignmentMessage`

Two pre-existing files were touched, both flagged in their PR bodies:

- `npcMemoryStore.ts` (7.4): `getOrCreateNPCLog` now saves after
  bumping `sessionCount` on a new session — the bump was previously
  lost, so multi-session divergence was unobservable.
- `generator.ts` (7.2): import-only refactor to the shared location
  registry; behavior unchanged.

## Owner-unconfirmed decisions (flagged, not settled)

- **D3 chat surface:** the brief's proposed default was implemented —
  a CastForge-native prompt builder over the existing memory log, NOT
  an extension of the Replit-integrated chat surface. If the owner
  prefers extending the Replit chat, that is a follow-up change.
- **D1 faculty roster:** slots stay EMPTY. No names, no personalities
  invented. The test-local faculty fixture in `mentor.test.ts` is not
  a roster entry.
- **Mentor subject scoping:** not implemented — the schema carries no
  subject field, and the weave picks weakest targets regardless of
  mentor. Add it when the slots are filled, if wanted.
- **Brief landing:** PR #12 (`docs/phase-7-castforge-brief.md`) is
  open and mergeable. This phase deliberately does NOT re-add the
  brief file, to avoid a duplicate/conflict with #12. If #12 is closed
  without merging, the brief still needs landing.

## Rules that held through the build

- Faculty = hand-authored seeds only; generated and faculty engrams
  never share an id (gate rejects collisions).
- Generator pure and deterministic; no LLM in the generator path.
  Runtime LLM only for chat phrasing, never for un-audited assessment,
  never for generating GED content, never for inventing a lesson.
- Voice profiles are descriptors only (tone, cadence, register tags).
- Mentors teach from the audited store only; chat never scores.
- No GED content inside engrams (no lesson text, item bank, keys).
- Gaps are reported, never filled by fabrication (the SS Civics &
  Government shortfall — 12 items vs 15 quota — carries forward).
- Memory observes and represents; relationship state is per-student;
  no view leaks into another student's record.
- Consent-processing is explicit (chat guardrails carry the consent
  line). The Rebecca engram (Black_Sakura_Project) is untouched.

## Running the tests

The repo's own command (CI runs this on every PR):

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/academy run test
```

Local verification during this build used a temp alias config
(vitest 4.1.12) because the clone had no installed deps; the temp
config could not transform JSX, so the three `.tsx` component tests
and the pnpm-dependent event-registry test failed under it — both
pre-existing and unrelated to CastForge. The CI workflow runs the
repo's own Vite setup, so component tests run as intended there.
First CI run happens on this PR's checks; it was not observable from
the build environment.

## Acceptance status

- §9.1 (per-student divergence): proven in `memory.test.ts` — same
  NPC, two students, three sessions each, demonstrably different
  memory and relationship state.
- §9.2 (mentor end-to-end): proven in `mentor.test.ts` — mentor
  assignment → grade → same mastery record as portal work, plus
  byte-identical parity with direct CourseWeaver grading.
- §9.3 (bank audit): `auditCastBank` helper + tests in
  `castAuditor.test.ts`.

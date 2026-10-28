# Phase 7 — CastForge: Design Brief (DRAFT for owner review)

**Repo:** The-Academy · **Base:** `main` @ `b72a076` (Phase 6 Examwright merged)
**Status:** DRAFT — nothing in this brief is approved until the owner says so.
Nothing here lands in the repo except by branch + PR on the owner's word.
**Precedent rule (roadmap §6):** no phase begins without owner clearance of
the previous phase's PR. Phase 6 is merged; Phase 7 starts here.

---

## 1. What Phase 7 is

From the roadmap (§4, Phase 7), verbatim in spirit:

> CastForge generates full engram seeds for students/ambient cast (BSP seed
> pattern: drives, baseline, voice, anchor); `radiantAI.ts`' numeric body
> (Big Five, emotions, decay, schedules) becomes the generated engram's
> physiology — full integration, not replacement.

The design law from the original brief still governs: **full engram spectrum,
GED program fidelity first**. CastForge serves the GED program; it does not
bend the program around the cast.

Two populations, two treatments (the No Man's Sky correction):

- **Faculty — fixed, hand-authored seeds only.** The four GED subject mentors
  (RLA, Math, Science, Social Studies) plus any faculty the owner names.
  Each faculty seed is authored/cleared individually.
- **Everyone else — generated.** Student NPCs and ambient cast get full
  engrams generated from a seed, and every one of them is chat-accessible
  (real conversation, not dialogue trees).

## 2. What the current tree already gives us (verified at `b72a076`)

| Piece | Location | What Phase 7 reuses |
|---|---|---|
| Radiant engine | `artifacts/academy/src/lib/radiantAI.ts` (1,993 lines) | `NPCPersonality`, `NPCEmotions`, `NPCStats`, `MemoryEntry`, `NPCGoal`, `NPCRelationship`, `ScheduleEntry`, `WorldEvent` — the generated engram's physiology, as the roadmap says |
| Per-character memory | `artifacts/academy/src/lib/npcMemoryStore.ts` (372 lines) | `loadNPCLog` / `getOrCreateNPCLog` / `appendConversationEntries` / `getMemorySummary` — the per-(student, NPC) log |
| Dialogue modulation | `artifacts/academy/src/lib/dialogueModulator.ts` (566 lines) | Tone/personality shaping of generated lines |
| Dialogue templates | `lib/game-engine/src/dialogueTemplates.ts` (1,192 lines) | Template fallback layer under generated chat |
| Determinism | `lib/game-engine/src/seededRandom.ts` | Seeded RNG; the `studentSeed(studentId, skillNodeId, attempt)` pattern in CourseWeaver and `examSeed(studentId, subject, attempt)` in Examwright are the model for per-student cast seeds |
| Auditor gate | `artifacts/academy/src/lib/auditor.ts` (+ test) | The gate model: pure, deterministic, reads data and returns a report; changes nothing. CastForge gets a sibling gate, not a rewrite of this one |
| Per-student coursework | `artifacts/academy/src/lib/courseWeaver.ts` | `weaveAssignments` / `applyWovenGrade` — what a mentor assigns in chat must land in this same mastery record |
| Exam machinery | `artifacts/academy/src/lib/examwright.ts` | `assembleExam` / `gradeExam` — mentor-assigned work grades through existing paths only |
| World sync | `artifacts/academy/src/lib/resonanceRadiantBridge.ts` | NPC ↔ world-state sync (`syncNPCToResonance`, `npcActionToResonance`) |
| Cast UI | `artifacts/academy/src/components/desktop/apps/NPCDirectoryPanel.tsx` | The directory surface a generated cast appears in |
| Chat surface | `artifacts/api-server/src/replit_integrations/chat/` + `artifacts/academy/src/shared/models/chat.ts` | Exists, but is Replit-integrated — see decision D4 |

**What does not exist yet:** no cast/engram generation code, no faculty seed
files, no per-NPC voice profiles, no CastForge scaffolding, no `docs/`
roadmap in the repo. Faculty is mentioned in UI strings only — there is no
faculty data model.

## 3. Architecture: Seed → Generator → Auditor, extended to cast

Phases 0–6 established Seed → Generator → Auditor for *content*. Phase 7
applies the same shape to *people*:

```
faculty seed (authored) ──┐
                           ├─► CastForge generator (seeded, deterministic)
student/ambient seed ──────┘         │
                                     ▼
                              generated engram
                                     │
                                     ▼
                              CastAuditor gate ──► PASS → cast bank
                                     │                (seed + provenance recorded)
                                     └─ FAIL → report, never silent fix
```

- **Generator** is pure and deterministic: same `(studentId, npcId, seed)`
  always yields the same engram. No LLM in the generator path.
- **CastAuditor** is pure and deterministic like `auditor.ts`: it reads a
  generated engram and returns a pass/fail report. It changes nothing.
- **Runtime chat** is the only place an LLM may appear, and only for
  phrasing — never for un-audited assessment, never for generating GED
  content, never for inventing a mentor's lesson.

## 4. The generated-engram schema (proposal)

One generated engram = one record, versioned, with seed + provenance:

```ts
interface GeneratedEngram {
  id: string;                 // stable per (castId)
  kind: 'student' | 'ambient';
  seed: number;               // reproduces this engram exactly
  provenance: string;         // generator version + inputs, for audit
  drives: Drive[];            // BSP seed pattern: what moves this person
  baseline: NPCPersonality    // radiantAI.ts: Big Five + traits
    & NPCEmotions;            // ...emotional baseline + decay params
  voiceProfile: VoiceProfile; // descriptor only — see honesty limit §8
  anchor: EnvironmentAnchor;  // where they live in the Academy world
  schedule: ScheduleEntry[];  // radiantAI.ts schedules
  relationships: NPCRelationship[]; // seeded defaults, per-student overridden
  memory: MemoryEntry[];      // starts empty; grows per student (§6)
}
```

Faculty seeds use the same schema, but their `provenance` reads
`authored:<owner>` and their content is hand-written, never generated.
Faculty and generated engrams must never share an id, and the CastAuditor
rejects any generated engram that collides with a faculty id.

## 5. Decisions for the owner (nothing here is assumed)

- **D1 — Faculty roster.** Roadmap says four subject mentors. Wider set
  (administration, counselor)? The owner's list governs; the brief ships
  with four mentor slots and empty names until the owner fills them.
- **D2 — Faculty seed home.** Proposed:
  `artifacts/academy/src/lib/cast/seeds/faculty/` for authored seeds,
  `artifacts/academy/src/lib/cast/generated/` for CastAuditor-passed banks,
  `artifacts/academy/src/lib/cast/schema.ts` for the schema, and
  `artifacts/academy/src/lib/castAuditor.ts` for the gate — beside the
  engine it serves, not in a new top-level tree.
- **D3 — Chat surface.** Proposed: build a CastForge-native prompt builder
  (the BSP pattern from the roadmap) over the existing chat storage model,
  rather than extending the Replit-integrated chat surface — the Replit
  coupling is platform-specific, and the prompt builder is the piece the
  roadmap actually names. Owner decides; either way, every cast member
  gets the same chat entry point.
- **D4 — Generation runtime.** Roadmap recommendation, adopted unless the
  owner overrides: hybrid — seeded, pre-generated, Auditor-passed banks
  for anything assessed (auditable, reproducible); runtime LLM only for
  chat phrasing, hints, and flavor.
- **D5 — Persistence.** Roadmap recommendation, adopted unless overridden:
  generated banks live in the DB with seed + provenance per artifact;
  nothing student-facing lives only in localStorage.
- **D6 — Mentor teaching rule (non-negotiable, from the roadmap).** Mentors
  teach from the audited store only. Their hints, explanations, and
  assigned work draw from ItemForge/CourseWeaver output, so teaching
  content inherits GED fidelity. A mentor never improvises curriculum.

## 6. Differential processing (the No Man's Sky requirement)

Same seed → unique histories. Implementation shape, following the existing
`studentSeed` / `examSeed` precedent:

- Cast seed = `hash(studentId, npcId, castGeneration)` — one NPC, different
  student, different relationship arc, memory, and schedule drift.
- Per-student memory unification: `npcMemoryStore.ts` (per-character logs)
  and radiant `MemoryEntry` become **one system** — a single log per
  (student, NPC) pair that both the chat layer and the radiant engine read.
- **Memory observes and represents — it does not claim causal privilege**
  (Aurora audit, dialogue branch). The log records what happened; it never
  asserts why an NPC acted.
- Relationship state is per-student: two students can know the same NPC
  differently, and neither view leaks into the other's record.

## 7. CastAuditor gate criteria (frozen per phase, per roadmap §6)

A generated engram passes only if all of these hold; a failure is reported,
never quietly redefined:

1. Schema-valid against §4, all required fields present.
2. Deterministic: regenerating from the recorded seed reproduces it
   byte-for-byte.
3. No id collision with any faculty seed.
4. No GED content embedded: no lesson text, no item bank, no answer keys
   inside an engram — teaching content comes from the audited store at
   chat time, never from the cast bank.
5. Voice profile is a descriptor (tone, cadence, register tags) — it
   contains no audio, no voice-clone reference, no performer data.
6. Schedule + anchor resolve to real Academy locations; relationships
   reference real cast ids.

## 8. Honesty limits (stated up front, as in every phase)

- **Voice profiles are descriptors, not voices.** No synthesis, no cloning,
  no external voice packs. If a future voice feature arrives, it is a
  separate phase with its own consent review.
- **Mentor-assigned work is graded by existing paths only**
  (`gradeWovenAssignment`, `itemGrading`, `gradeExam`). Chat never scores.
- **Extended Response scoring stays simulated** (Phase 6 disclosure carries
  forward): only GED's own scorers are authoritative.
- **The Rebecca engram (Black_Sakura_Project) is untouched by this program**
  — different repo, soul-seed rules unchanged. CastForge faculty seeds are
  Academy characters, not engram imports.
- **SS Civics & Government shortfall carries forward:** bank holds 12 items
  vs the 15 blueprint quota (Phase 6 disclosure). Mentors teaching Civics
  draw from the same bank; nothing is fabricated to fill it.

## 9. Acceptance criteria (roadmap, made checkable)

1. A generated student-NPC holds a multi-session, per-student-divergent
   conversation: same NPC, two students, demonstrably different memory
   and relationship state after three sessions each.
2. A faculty mentor assigns audited coursework in chat, and the student's
   results land in the same mastery record as portal work (CourseWeaver
   standings, not a parallel chat-only record).
3. CastAuditor passes the full generated bank with zero failures, and
   regenerating the bank from recorded seeds reproduces it exactly.
4. Every cast member is chat-accessible through one entry point; no
   dialogue-tree-only NPCs remain in the generated cast.
5. Test suite: generator determinism tests, gate-criteria tests (one per
   §7 rule, including a failing fixture per rule), and a
   per-student-divergence test — all green, run through the repo's test
   runner (see §10).

## 10. Suggested work breakdown (sub-phases, each its own PR)

- **7.0 — Schema + faculty seed slots.** §4 schema, §2 directory layout,
  four empty faculty slots, CastAuditor skeleton. No generation yet.
- **7.1 — Generator.** Seeded generation of student/ambient engrams from
  `radiantAI.ts` physiology; determinism tests.
- **7.2 — CastAuditor gate.** All §7 criteria + failing fixtures.
- **7.3 — Chat layer.** Prompt builder (D3 decision), one entry point for
  every cast member, wired to the unified memory log.
- **7.4 — Differential memory.** `npcMemoryStore` + `MemoryEntry`
  unification; per-student divergence tests.
- **7.5 — Mentor teaching wiring.** Mentor chat → CourseWeaver assignments
  → same mastery record; acceptance test §9.2 end to end.
- **7.6 — Docs + CI.** Roadmap + this brief committed to `docs/`;
  vitest workflow so the suite gates itself (audit action #7) — or sooner
  if the owner wants it first.

## 11. Open threads this brief does not settle

- Faculty mentor names, personalities, and subject assignments (D1).
- Chat surface decision (D3) — CastForge-native vs extending Replit chat.
- Whether the Android bulletin-lane branch and `master` are deleted
  before 7.0 (cleanup leftovers, owner's call).
- The BSP red main CI — separate track, not a CastForge dependency.

---

*Draft prepared Oct 24, 2026, from the live tree at `b72a076` and the
roadmap at `~/workspace/the-academy/GED_REMEDIATION_ROADMAP.md`. Awaiting
owner review, correction, and clearance before any of it becomes a PR.*

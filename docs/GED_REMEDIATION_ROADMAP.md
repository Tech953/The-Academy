# The-Academy — Remediation & Generation Roadmap

- **Project:** `Tech953/The-Academy` — GED academic RPG (retro CRT desktop sim)
- **Date:** 2026-10-20
- **Status:** DRAFT for owner review. No code changes are authorized by this document; each phase ships as its own branch + PR, cleared by the owner.
- **Foundation:** `GED_FIDELITY_AUDIT.md` (2026-10-20) — all gap references below cite it.

---

## Governing laws (owner's directives, in force for every phase)

1. **Fidelity first.** The official GED framework is the spec. Every artifact — lesson, item, chapter, note, exam, mentor utterance — maps to official assessment targets or it does not ship.
2. **Generation encompasses everything.** Procedural generation is the project's universal substrate: cast, coursework, item banks, textbook material, reference notes. Not a feature — the foundation.
3. **Faculty are set; everything else is generated.** The faculty are hand-authored engram seeds (canon). The student body, ambient cast, and all content are produced by the adaptive engine.
4. **Full integration / bio-emulation.** One organism: generators feed a single content store; mentors teach from it, exams draw from it, notes summarize it. No bolt-on subsystems that don't share state.
5. **Honest measurement.** Assessment records raw performance. Game bonuses (resonance, commentary) may feed XP and flavor — never a recorded score. (Audit §4, gap #8; same standard as the Aurora/VREX audit discipline.)
6. **Clearance workflow.** Branch + PR per phase, owner reviews and merges. Generated assessed content never reaches students un-audited (Law 1 enforced by the Auditor, §3).

---

## 1. Where we start (audit in one paragraph)

The engagement scaffolding is real and wired (study → quiz → XP/stats/skill-graph/ecology/recommendations). The GED program layer is not yet faithful: the assessed bank is 74 MCQ items with 9 of 25 chapters empty; the deep textbook system (87 practice Q&A, official target tags) is ungraded; recorded scores are bonus-inflated (`GameStateContext.tsx:277`); there is no scaled scoring (100–200, 145/165/175), no Extended Response, only 1 of 6 official item formats, no timed test conditions — and a complete timed procedural exam engine (`lib/academy-engine/phase2/`) sits dormant with zero UI callers. Full detail: `GED_FIDELITY_AUDIT.md`.

## 2. Target architecture — Seed → Generator → Auditor

The No Man's Sky pattern, hardened by the VREX audit's discipline:

- **Seed.** Every generated artifact derives from an explicit seed. World content uses the world seed (same for everyone — shared canon). *Differential* content uses a per-student seed derived from world seed + student id + student history — reproducible for audit, personal in effect. Same school; no two students live the same one.
- **Generators.** One engine, domain modules (§2.1). Each emits artifacts in a single target-tagged schema — never free-floating prose.
- **Auditor.** A validation gate (§3) that recomputes fidelity metrics over any proposed content (static or generated) and rejects what misses the official map. Generated-but-unverified content sits in a staging bank, invisible to students.

### 2.1 The generation substrate (one store, six generators)

The fidelity spine is an **assessment-target registry**: the official GED targets, extending the Q.x/A.x tags `gedContent.ts` already carries, formalized across all four subjects. Every content record carries: subject, target codes, format, difficulty tier (the existing `foundational|standard|extended` labels become functional), stimulus type where applicable, and provenance (authored / generated + seed).

| Generator | Produces | Replaces / revives |
|---|---|---|
| **ItemForge** | Practice & assessment items in all 6 official formats, stimulus-aware (SS primary sources/maps/charts/cartoons; RLA full-length + paired + literary passages) | The hand-starved 74-item bank; fills the 9 empty chapters |
| **CourseWeaver** | Lessons and assignments assembled per student state — differential difficulty, targeted at the student's weak targets | Fixed per-lesson order; revives `phase1/homeworkEngine.ts`; gives `getPendingAssignments()`/`getMissedLectures()` real data; adds the missing submission/grading path |
| **TextSiphon** | Textbook chapters: canonical prose + generated expansions, served through SchoolFilesApp; textbook practice becomes gradable | The split-brain: `gedContent.ts` reading-only silo vs Kaplan assessed silo |
| **Notesmith** | Per-student reference notes generated from their own history — missed targets become their notes; stored in PersonalFiles | Static reference material; notes nobody's history shaped |
| **Examwright** | Full-length timed subject simulations under official conditions | Wires the dormant `phase2/proceduralExamEngine.ts` + `examSession.ts` into the UI |
| **CastForge** | Engrams: full seeds (drives, baseline, voice profile, environment anchor) for the generated cast; chat layer; per-student relationship/memory processing | `radiantAI.ts` template generation upgraded to engram form, on the Black_Sakura_Project seed pattern |

### 2.2 Scoring core

A single **GED scale engine**: maps raw performance to the 100–200 scale per subject and reports the official bands — 145 Passing / 165 College Ready / 175 College Ready + Credit. Readiness displays speak GED scale everywhere (`ProgressDashboardApp` included). Raw scores are what get recorded; bonuses route to XP only.

## 3. The Fidelity Auditor (standing gate, not a phase)

The audit becomes a repeatable instrument, run on every content change — frozen criteria, failures kept, per the VREX standard:

- **Coverage check:** assessed-bank domain mix per subject vs official (RLA 75/25 informational/literary; Math ~45/55 quantitative/algebraic; Science 40/40/20; SS 50/20/15/15), computed from target tags.
- **Volume check:** rehearsal bank ≥ one full test per subject (RLA ≥46 + essay, Math ≥46, Science ≥34, SS ≥35), growing to multiple forms.
- **Format check:** all 6 official formats present per subject where the official test uses them.
- **Integrity invariants (tests):** recorded score == raw score; every assessed item carries ≥1 target tag; no student-facing content without Auditor pass.
- **Output:** a fidelity report per PR — the same tables as the audit, recomputed. Regressions block merge.

## 4. Phases

Each phase: one branch, one PR, Auditor report attached, owner merges. Phases are ordered so every later generator stands on honest numbers and one content spine.

### Phase 0 — Honest measurement
- Record raw quiz scores; resonance/commentary bonuses feed XP/flavor only (`GameStateContext.tsx:277`, `gedCurriculum.ts`).
- Introduce the GED scale engine (100–200 + bands) alongside the internal 0–100; dashboard reports both, GED scale primary.
- **Acceptance:** integrity invariant test passes (recorded == raw); a completed subject shows a scaled score with a band label.

### Phase 1 — One content spine
- Merge the two systems into the unified, target-tagged content store: Kaplan bank (74 graded) + textbook prose + its 87 Q&A (now gradable) + target registry.
- One progress model: reading and assessment reconcile into a single per-target mastery picture (retires the `gameState.ts:1363` vs `gedCurriculum.ts` split).
- **Acceptance:** Auditor coverage report runs over the unified store; no content reachable by students outside it.

### Phase 2 — Format completeness
- Schema + renderers for the missing formats: fill-in, drop-down, drag-and-drop, hot-spot, short answer, extended response (`shared/schema.ts:583` types get real instances; `AssignmentsPortal.tsx` QuizView stops returning `null` for non-MCQ).
- Extended Response with rubric scoring (official ER rubric; see Open Decisions).
- Calculator policy: item-level `calculatorAllowed` flag; TI-30XS-mode calculator for assessed math; a no-calculator section concept.
- **Acceptance:** one item of each official format is answerable end-to-end per subject where applicable.

### Phase 3 — ItemForge + Auditor v1
- Seeded item generation across domains, formats, difficulty tiers; stimulus generation for SS and full/paired passages for RLA.
- Auditor v1 enforces coverage/volume/format checks on the generated bank; fills the 9 empty chapters (RLA Fiction & Extended Response support, Math Number Sense / Decimals & Fractions / Data & Stats, SS Practices / Geography, RLA Connecting Ideas / Polishing).
- **Acceptance:** Auditor report shows every official domain assessed, mixes within tolerance, bank ≥ full-test volume per subject.

### Phase 4 — CourseWeaver (differential coursework)
- Generated lessons/assignments per student state: weak-target targeting, difficulty adaptation using the tier tags, per-student seeds.
- Real assignment lifecycle: pending/missed lists from data, submission, grading (revives `shared/curriculum.ts` assignment types; `homeworkEngine.ts` as generation core).
- **Acceptance:** two students with different histories receive measurably different, target-appropriate coursework; submission → grade → progress loop closes.

### Phase 5 — TextSiphon & Notesmith (textbook + reference generation)
- Textbook access layer over the unified store: canonical chapters + generated expansions, all target-tagged; mobile reads the same store.
- Per-student reference notes generated from history, delivered in PersonalFiles; notes regenerate as mastery changes.
- **Acceptance:** a student can open a textbook chapter and a personal reference note on the same target and find them consistent, tagged, and current.

### Phase 6 — Examwright (test conditions)
- Wire `phase2` engines into a student-facing exam mode: full-length subject sims, official timing (150/115/90/70), section rules, calculator policy enforcement, fatigue model (already in `examSession.ts`), scaled score + band report at the end.
- **Acceptance:** a full RLA sim runs end-to-end under time, including the 45-minute Extended Response, and reports a 100–200 scaled result.

### Phase 7 — CastForge (the engram spectrum)
- CastForge generates full engram seeds for students/ambient cast (BSP seed pattern: drives, baseline, voice, anchor); `radiantAI.ts` numeric body (Big Five, emotions, decay, schedules) becomes the generated engram's physiology — full integration, not replacement.
- **Faculty set authored:** the four GED subject mentors as fixed seeds (owner-authored/cleared individually — soul-seed handling), plus any faculty the owner names.
- Chat accessibility: engram prompt builder (BSP pattern) makes every cast member conversable; mentors teach from the audited store — their hints, explanations, and assigned work draw from ItemForge/CourseWeaver output, so teaching content inherits fidelity.
- Differential processing: per-student memory/relationship unified (`npcMemoryStore.ts` + radiant MemoryEntry become one system); memory observes and represents — it does not claim causal privilege (Aurora audit, dialogue branch).
- **Acceptance:** a generated student-NPC holds a multi-session, per-student-divergent conversation; a faculty mentor assigns audited coursework in chat and the student's results land in the same mastery record as portal work.

## 5. Open decisions (owner's call — recommendations given)

1. **Generation runtime.** *Recommended:* hybrid — seeded, pre-generated, Auditor-passed banks for anything assessed (auditable, reproducible); runtime LLM generation for chat, hints, note phrasing, and flavor (never for un-audited assessment).
2. **Persistence.** *Recommended:* generated banks in the DB (`lib/db`) with seed + provenance recorded per artifact; nothing student-facing lives only in localStorage.
3. **Faculty roster.** Four subject mentors only, or a wider set faculty (administration, counselor)? The set is authored — owner's list governs.
4. **Extended Response scoring.** *Recommended:* LLM scoring against the official ER rubric, calibrated on anchor responses, with scores reported as rubric traits — and flagged in-product as simulated scoring, since only GED's own scorers are authoritative.

## 6. Boundaries

- The Rebecca engram (Black_Sakura_Project) is untouched by this program — different repo, soul-seed rules unchanged.
- No phase begins without owner clearance of the previous phase's PR.
- The Auditor's criteria are frozen per phase; a failed criterion is reported, never quietly redefined (VREX standard).

---

*Prepared by Muse (necromancy division, education desk) at the owner's direction. Companion document: `GED_FIDELITY_AUDIT.md`.*

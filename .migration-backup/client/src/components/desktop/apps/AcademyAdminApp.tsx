import { useState, useMemo, useCallback } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { useGameState } from '@/contexts/GameStateContext';
import {
  computeDomainTensions, getInstitutionalSummary, archivalEpochs,
  synthesisTri, DomainTension, SynthesisTrial,
} from '@/lib/academyInstitution';
import { computeAllSubjectProgress, SUBJECT_META } from '@/lib/gedCurriculum';
import { GEDSubjectKey, LessonProgress } from '@shared/schema';

type Tab = 'overview' | 'ecology' | 'epochs' | 'trials';

// ─── helpers ──────────────────────────────────────────────────────────────────

function tensionColor(tension: number): string {
  if (tension > 75) return '#ff3355';
  if (tension > 50) return '#ffaa00';
  if (tension > 25) return '#88ff44';
  return '#44ffcc';
}

function stabilityBar(stability: number, color: string, c: string): JSX.Element {
  return (
    <div style={{ width: '100%', height: 6, background: `${c}15`, position: 'relative' }}>
      <div style={{ height: '100%', width: `${stability}%`, background: color, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function msToHuman(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function Stars({ count, max = 5, color }: { count: number; max?: number; color: string }) {
  return (
    <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, letterSpacing: 1 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < count ? color : `${color}25` }}>★</span>
      ))}
    </span>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab({ c, accentColors }: { c: string; accentColors: ReturnType<typeof useCrtTheme>['accentColors'] }) {
  const { character, curriculumProgress, enrolledCourses } = useGameState();
  const summary = useMemo(() => getInstitutionalSummary(curriculumProgress), [curriculumProgress]);
  const subjectProgress = useMemo(() => computeAllSubjectProgress(curriculumProgress), [curriculumProgress]);
  const tensions = useMemo(() => computeDomainTensions(curriculumProgress), [curriculumProgress]);

  const allLessons = Object.values(curriculumProgress.lessonProgress) as LessonProgress[];
  const lessonsCompleted = allLessons.filter(l => l.completed).length;
  const scores = allLessons.filter(l => l.quizScore !== undefined).map(l => (l.quizScore ?? 0) as number);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const cardStyle: React.CSSProperties = {
    border: `1px solid ${c}20`,
    padding: 16,
    flex: 1,
    minWidth: 160,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9, color: `${c}50`, letterSpacing: 1, fontFamily: 'Courier New, monospace', marginBottom: 2,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 16, color: c, fontFamily: 'Courier New, monospace', letterSpacing: 1,
  };

  const resonanceColor =
    character.resonanceState === 'stable'   ? accentColors.green :
    character.resonanceState === 'unstable' ? accentColors.amber :
    accentColors.red;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, overflowY: 'auto', height: '100%' }}>

      {/* Header strip */}
      <div style={{ borderBottom: `1px solid ${c}20`, paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Courier New, monospace', letterSpacing: 2, fontSize: 11, color: c }}>
          RADIANT ACADEMY — INSTITUTIONAL OVERVIEW
        </div>
        <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace' }}>
          EPOCH {summary.totalEpochs} · {msToHuman(summary.currentEpochDurationMs)} ELAPSED
        </div>
      </div>

      {/* Metric cards row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={cardStyle}>
          <div style={labelStyle}>STUDENT LEVEL</div>
          <div style={valueStyle}>{character.level}</div>
          <div style={{ fontSize: 9, color: `${c}40`, fontFamily: 'Courier New, monospace', marginTop: 4 }}>
            {character.experience} / {character.experienceToNextLevel} XP
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>RESONANCE STATE</div>
          <div style={{ ...valueStyle, color: resonanceColor, fontSize: 12, letterSpacing: 2 }}>
            {(character.resonanceState ?? 'STABLE').toUpperCase()}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>GED READINESS</div>
          <div style={{ ...valueStyle, color: tensionColor(100 - summary.overallGEDReadiness) }}>
            {summary.overallGEDReadiness}%
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>LESSONS DONE</div>
          <div style={valueStyle}>{lessonsCompleted}</div>
          <div style={{ fontSize: 9, color: `${c}40`, fontFamily: 'Courier New, monospace', marginTop: 4 }}>
            avg score: {avgScore > 0 ? `${avgScore}%` : '—'}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>TRIALS</div>
          <div style={valueStyle}>{summary.trialsCompleted} / {summary.trialsCompleted + summary.trialsAvailable}</div>
          <div style={{ fontSize: 9, color: accentColors.amber, fontFamily: 'Courier New, monospace', marginTop: 4 }}>
            {summary.trialsAvailable} available
          </div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>ARTIFACTS</div>
          <div style={valueStyle}>{summary.totalArtifacts}</div>
        </div>
      </div>

      {/* Domain health bars */}
      <div style={{ border: `1px solid ${c}15`, padding: 16 }}>
        <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 14 }}>
          DOMAIN STABILITY OVERVIEW
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tensions.map(t => (
            <div key={t.domain}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: t.color }}>
                  {t.abbr} — {t.domain}
                </span>
                <span style={{ fontFamily: 'Courier New, monospace', fontSize: 9, color: tensionColor(t.tension) }}>
                  {t.trend.toUpperCase()} · {t.stability}% stable
                </span>
              </div>
              {stabilityBar(t.stability, tensionColor(t.tension), c)}
            </div>
          ))}
        </div>
      </div>

      {/* Subject readiness grid */}
      <div style={{ border: `1px solid ${c}15`, padding: 16 }}>
        <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 14 }}>
          SUBJECT READINESS REPORT
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {subjectProgress.map(sp => {
            const meta = SUBJECT_META[sp.subject];
            return (
              <div key={sp.subject} style={{
                border: `1px solid ${sp.readinessScore >= 70 ? meta.color + '50' : c + '15'}`,
                padding: '12px 16px', flex: 1, minWidth: 140,
                background: sp.readinessScore >= 70 ? `${meta.color}08` : 'transparent',
              }}>
                <div style={{ fontSize: 11, color: meta.color, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 6 }}>
                  {meta.icon} {meta.abbr}
                </div>
                <div style={{ fontSize: 20, color: c, fontFamily: 'Courier New, monospace' }}>
                  {sp.readinessScore}%
                </div>
                <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', marginTop: 4 }}>
                  {sp.chaptersCompleted}/{sp.totalChapters} chapters mastered
                </div>
                {sp.passReady && (
                  <div style={{ fontSize: 9, color: meta.color, fontFamily: 'Courier New, monospace', marginTop: 4, letterSpacing: 1 }}>
                    ● PASS-READY
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fragile domain alerts */}
      {summary.fragiledomains.length > 0 && (
        <div style={{ border: `1px solid ${accentColors.red}30`, padding: 12, background: `${accentColors.red}05` }}>
          <div style={{ fontSize: 9, color: accentColors.red, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 8 }}>
            ⚠ FRAGILE DOMAINS DETECTED
          </div>
          {summary.fragiledomains.map(d => (
            <div key={d} style={{ fontSize: 10, color: `${accentColors.red}cc`, fontFamily: 'Courier New, monospace', marginBottom: 2 }}>
              • {d} — High tension detected. Consider focused study or a Tier 1 Alignment Trial.
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// ─── ECOLOGY TAB ──────────────────────────────────────────────────────────────

const DOMAIN_POSITIONS: Record<GEDSubjectKey, { cx: number; cy: number }> = {
  'Language Arts':        { cx: 140, cy: 150 },
  'Mathematical Reasoning':{ cx: 360, cy: 150 },
  'Social Studies':       { cx: 140, cy: 300 },
  'Science':              { cx: 360, cy: 300 },
};

const BLEED_VISUAL: [GEDSubjectKey, GEDSubjectKey][] = [
  ['Mathematical Reasoning', 'Science'],
  ['Language Arts',          'Social Studies'],
  ['Language Arts',          'Science'],
  ['Mathematical Reasoning', 'Social Studies'],
];

function EcologyTab({ c, accentColors }: { c: string; accentColors: ReturnType<typeof useCrtTheme>['accentColors'] }) {
  const { curriculumProgress } = useGameState();
  const tensions = useMemo(() => computeDomainTensions(curriculumProgress), [curriculumProgress]);
  const tensionMap = useMemo(() => {
    const m: Record<string, DomainTension> = {};
    for (const t of tensions) m[t.domain] = t;
    return m;
  }, [tensions]);
  const [selectedDomain, setSelectedDomain] = useState<GEDSubjectKey | null>(null);
  const selected = selectedDomain ? tensionMap[selectedDomain] : null;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* SVG Ecology Map */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 }}>
        <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 12 }}>
          KNOWLEDGE ECOLOGY MAP — CLICK A NODE TO INSPECT
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={500} height={460} style={{ maxWidth: '100%', maxHeight: '100%' }}>
            {/* Grid lines */}
            {[100, 200, 300, 400].map(y => (
              <line key={y} x1={40} y1={y} x2={460} y2={y} stroke={`${c}08`} strokeWidth={1} />
            ))}
            {[100, 200, 300, 400].map(x => (
              <line key={x} x1={x} y1={40} x2={x} y2={420} stroke={`${c}08`} strokeWidth={1} />
            ))}

            {/* Bleed connections */}
            {BLEED_VISUAL.map(([from, to]) => {
              const pf = DOMAIN_POSITIONS[from];
              const pt = DOMAIN_POSITIONS[to];
              const tf = tensionMap[from];
              const tt = tensionMap[to];
              if (!pf || !pt || !tf || !tt) return null;
              const avgBleed = tf.bleedSources.find(b => b.from === to)?.intensity ?? 0;
              const opacity = Math.max(0.05, avgBleed / 100);
              return (
                <g key={`${from}-${to}`}>
                  <line x1={pf.cx} y1={pf.cy} x2={pt.cx} y2={pt.cy}
                    stroke={tensionColor(tf.tension)} strokeWidth={Math.max(1, avgBleed / 15)}
                    strokeOpacity={opacity} strokeDasharray="4 4" />
                </g>
              );
            })}

            {/* Domain nodes */}
            {tensions.map(t => {
              const pos = DOMAIN_POSITIONS[t.domain];
              if (!pos) return null;
              const col = tensionColor(t.tension);
              const isSelected = selectedDomain === t.domain;
              const r = 34 + Math.min(t.stability / 10, 12);
              return (
                <g key={t.domain} style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDomain(d => d === t.domain ? null : t.domain)}>
                  {isSelected && (
                    <circle cx={pos.cx} cy={pos.cy} r={r + 10} fill="none"
                      stroke={col} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 3" />
                  )}
                  <circle cx={pos.cx} cy={pos.cy} r={r}
                    fill={`${col}18`} stroke={col} strokeWidth={isSelected ? 2 : 1} />
                  <text x={pos.cx} y={pos.cy - 4} textAnchor="middle"
                    fill={col} fontSize={11} fontFamily="Courier New, monospace" fontWeight="bold">
                    {t.abbr}
                  </text>
                  <text x={pos.cx} y={pos.cy + 12} textAnchor="middle"
                    fill={col} fontSize={9} fontFamily="Courier New, monospace">
                    {t.stability}%
                  </text>
                  <text x={pos.cx} y={pos.cy + 24} textAnchor="middle"
                    fill={`${col}80`} fontSize={8} fontFamily="Courier New, monospace">
                    {t.trend.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            {[['#ff3355','FRAGILE'], ['#ffaa00','UNSTABLE'], ['#88ff44','STABLE'], ['#44ffcc','MASTERED']].map(([col, label], i) => (
              <g key={label}>
                <rect x={30 + i * 115} y={410} width={10} height={10} fill={col} />
                <text x={46 + i * 115} y={419} fill={`${c}60`} fontSize={8} fontFamily="Courier New, monospace">{label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Domain detail panel */}
      <div style={{ width: 220, borderLeft: `1px solid ${c}20`, padding: 16, overflowY: 'auto', flexShrink: 0 }}>
        {!selected ? (
          <div style={{ fontSize: 10, color: `${c}35`, fontFamily: 'Courier New, monospace', paddingTop: 20, textAlign: 'center' }}>
            Click a domain node to inspect its tension profile.
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: selected.color, letterSpacing: 1, marginBottom: 12, borderBottom: `1px solid ${c}15`, paddingBottom: 8 }}>
              {selected.abbr} — {selected.domain}
            </div>

            {[
              ['STABILITY', `${selected.stability}%`, tensionColor(selected.tension)],
              ['TENSION',   `${selected.tension}%`,  tensionColor(selected.tension)],
              ['TREND',     selected.trend.toUpperCase(), c],
              ['READINESS', `${selected.readinessScore}%`, c],
            ].map(([label, val, col]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 8, color: `${c}40`, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>{label}</div>
                <div style={{ fontSize: 14, color: col as string, fontFamily: 'Courier New, monospace' }}>{val}</div>
              </div>
            ))}

            {stabilityBar(selected.stability, tensionColor(selected.tension), c)}

            {selected.bleedSources.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 8, color: `${c}40`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 8 }}>
                  CROSS-DOMAIN BLEED SOURCES
                </div>
                {selected.bleedSources.map(bs => (
                  <div key={bs.from} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 9, color: `${c}70`, fontFamily: 'Courier New, monospace' }}>
                      ← {bs.fromAbbr}
                    </span>
                    <span style={{ fontSize: 9, color: accentColors.red, fontFamily: 'Courier New, monospace' }}>
                      +{bs.intensity} tension
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 9, color: `${c}35`, fontFamily: 'Courier New, monospace', lineHeight: 1.6 }}>
              {selected.tension > 65
                ? 'High tension detected. Focused study recommended to reduce fragility. Consider a Tier 1 Alignment Trial.'
                : selected.tension > 35
                  ? 'Moderate tension. Continued engagement will stabilize this domain over time.'
                  : selected.stability > 0
                    ? 'Domain is stable. Cross-domain synthesis available at higher tiers.'
                    : 'Domain not yet explored. Begin study to activate.'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── EPOCHS TAB ───────────────────────────────────────────────────────────────

function EpochsTab({ c, accentColors }: { c: string; accentColors: ReturnType<typeof useCrtTheme>['accentColors'] }) {
  const { character, curriculumProgress, enrolledCourses } = useGameState();
  const epochs = useMemo(() => [...archivalEpochs.load()].reverse(), []);
  const pending = useMemo(() => archivalEpochs.getPendingArtifacts(), []);
  const epochStart = useMemo(() => archivalEpochs.getCurrentEpochStart(), []);
  const currentDuration = Date.now() - epochStart;

  const snapshot = useMemo(() => archivalEpochs.buildSnapshot({
    level: character.level,
    xp: character.experience,
    curriculumProgress,
    enrolledCourses,
  }), [character, curriculumProgress, enrolledCourses]);

  const artifactTypeColor: Record<string, string> = {
    breakthrough: accentColors.cyan,
    struggle: accentColors.red,
    synthesis: accentColors.purple,
    milestone: accentColors.green,
  };

  const artifactTypeIcon: Record<string, string> = {
    breakthrough: '◈', struggle: '◉', synthesis: '⬡', milestone: '★',
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 16 }}>
          ARCHIVAL EPOCH TIMELINE — {epochs.length + 1} EPOCHS RECORDED
        </div>

        {/* Current Epoch */}
        <div style={{ border: `1px solid ${c}40`, padding: 14, marginBottom: 12, background: `${c}04` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: c, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
              ● EPOCH {epochs.length + 1} — CURRENT
            </div>
            <div style={{ fontSize: 9, color: accentColors.amber, fontFamily: 'Courier New, monospace' }}>
              {msToHuman(currentDuration)} elapsed
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              ['LEVEL', snapshot.level],
              ['XP', snapshot.xp],
              ['LESSONS', snapshot.lessonsCompleted],
              ['AVG SCORE', snapshot.quizAverage ? `${snapshot.quizAverage}%` : '—'],
              ['READINESS', `${snapshot.gedReadiness}%`],
            ].map(([label, val]) => (
              <div key={label as string}>
                <div style={{ fontSize: 8, color: `${c}40`, fontFamily: 'Courier New, monospace' }}>{label}</div>
                <div style={{ fontSize: 12, color: c, fontFamily: 'Courier New, monospace' }}>{val}</div>
              </div>
            ))}
          </div>
          {pending.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 8, color: `${c}40`, fontFamily: 'Courier New, monospace', marginBottom: 4 }}>PENDING ARTIFACTS</div>
              {pending.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 6, fontSize: 9, fontFamily: 'Courier New, monospace', color: artifactTypeColor[a.type] ?? c, marginBottom: 3 }}>
                  <span>{artifactTypeIcon[a.type]}</span>
                  <span>[{a.type.toUpperCase()}]</span>
                  <span style={{ color: `${c}70` }}>{a.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past epochs */}
        {epochs.length === 0 && (
          <div style={{ fontSize: 10, color: `${c}30`, fontFamily: 'Courier New, monospace', textAlign: 'center', paddingTop: 20 }}>
            No past epochs yet. Past learning sessions will appear here over time.
          </div>
        )}
        {epochs.map((epoch, i) => (
          <div key={epoch.id} style={{ border: `1px solid ${c}15`, padding: 14, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: `${c}70`, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
                ○ {epoch.label} — ARCHIVED
              </div>
              <div style={{ fontSize: 9, color: `${c}40`, fontFamily: 'Courier New, monospace' }}>
                {msToHuman(epoch.durationMs)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: epoch.artifacts.length > 0 ? 8 : 0 }}>
              {[
                ['LEVEL', epoch.snapshot.level],
                ['LESSONS', epoch.snapshot.lessonsCompleted],
                ['AVG SCORE', epoch.snapshot.quizAverage ? `${epoch.snapshot.quizAverage}%` : '—'],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 8, color: `${c}30`, fontFamily: 'Courier New, monospace' }}>{label}</div>
                  <div style={{ fontSize: 11, color: `${c}70`, fontFamily: 'Courier New, monospace' }}>{val}</div>
                </div>
              ))}
            </div>
            {epoch.artifacts.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 6, fontSize: 9, fontFamily: 'Courier New, monospace', color: `${artifactTypeColor[a.type] ?? c}99`, marginBottom: 2 }}>
                <span>{artifactTypeIcon[a.type]}</span>
                <span>[{a.type.toUpperCase()}]</span>
                <span style={{ color: `${c}50` }}>{a.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Right panel: epoch influence */}
      <div style={{ width: 200, borderLeft: `1px solid ${c}15`, padding: 16, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 12 }}>
          ARTIFACT TYPES
        </div>
        {(['breakthrough', 'synthesis', 'milestone', 'struggle'] as const).map(type => (
          <div key={type} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: artifactTypeColor[type], fontSize: 12 }}>{artifactTypeIcon[type]}</span>
            <div>
              <div style={{ fontSize: 9, color: artifactTypeColor[type], fontFamily: 'Courier New, monospace' }}>
                {type.toUpperCase()}
              </div>
              <div style={{ fontSize: 8, color: `${c}35`, fontFamily: 'Courier New, monospace', lineHeight: 1.4 }}>
                {type === 'breakthrough' ? 'Mastery achieved' :
                  type === 'synthesis'   ? 'Cross-domain link' :
                  type === 'milestone'   ? 'Major checkpoint' :
                  'Learning obstacle'}
              </div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 20, fontSize: 9, color: `${c}30`, fontFamily: 'Courier New, monospace', lineHeight: 1.6 }}>
          Artifacts accumulate during each epoch and persist as part of the archival record. They carry tension modifiers that influence future domains.
        </div>
      </div>
    </div>
  );
}

// ─── TRIALS TAB ───────────────────────────────────────────────────────────────

function TrialsTab({ c, accentColors }: { c: string; accentColors: ReturnType<typeof useCrtTheme>['accentColors'] }) {
  const { curriculumProgress } = useGameState();
  const [trialResult, setTrialResult] = useState<{ trial: SynthesisTrial; score: number } | null>(null);
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null);
  const trials = useMemo(() => synthesisTri.computeAll(curriculumProgress), [curriculumProgress]);

  const tierLabels: Record<number, string> = {
    1: 'TIER I — FOUNDATION ALIGNMENTS',
    2: 'TIER II — DUAL-DOMAIN SYNTHESIS',
    3: 'TIER III — MULTI-DOMAIN CONVERGENCE',
    4: 'TIER IV — CAPSTONE SIMULATIONS',
  };

  const tierGroups = useMemo(() => {
    const groups: Record<number, SynthesisTrial[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const t of trials) groups[t.tier]?.push(t);
    return groups;
  }, [trials]);

  const initiateTrial = useCallback((trial: SynthesisTrial) => {
    if (trial.status !== 'available') return;
    setActiveTrialId(trial.id);
    const duration = 3000 + trial.difficulty * 1000;
    setTimeout(() => {
      const score = Math.round(50 + Math.random() * 45 + trial.difficulty * 2);
      const clamped = Math.min(99, score);
      synthesisTri.complete(trial.id, clamped, curriculumProgress);
      setTrialResult({ trial, score: clamped });
      setActiveTrialId(null);
    }, duration);
  }, [curriculumProgress]);

  const statusColor: Record<SynthesisTrial['status'], string> = {
    locked: `${c}25`,
    available: accentColors.amber,
    completed: accentColors.green,
  };

  const statusLabel: Record<SynthesisTrial['status'], string> = {
    locked: 'LOCKED',
    available: 'AVAILABLE',
    completed: 'COMPLETED',
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 16 }}>
          SYNTHESIS TRIAL REGISTRY — SCHEDULED ALIGNMENT EVENTS
        </div>

        {trialResult && (
          <div style={{ border: `1px solid ${accentColors.cyan}60`, padding: 16, marginBottom: 16, background: `${accentColors.cyan}06` }}>
            <div style={{ fontSize: 10, color: accentColors.cyan, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 4 }}>
              ◈ TRIAL COMPLETED — {trialResult.trial.codename}
            </div>
            <div style={{ fontSize: 20, color: trialResult.score >= 75 ? accentColors.green : accentColors.amber, fontFamily: 'Courier New, monospace' }}>
              {trialResult.score}%
            </div>
            <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', marginTop: 4 }}>
              {trialResult.score >= 75 ? 'BREAKTHROUGH — Artifact logged to current epoch.' : 'SYNTHESIS — Partial mastery recorded.'}
            </div>
            <button onClick={() => setTrialResult(null)}
              style={{ marginTop: 10, background: 'transparent', border: `1px solid ${c}30`, color: `${c}70`,
                fontFamily: 'Courier New, monospace', fontSize: 9, padding: '4px 12px', cursor: 'pointer', letterSpacing: 1 }}>
              DISMISS
            </button>
          </div>
        )}

        {([1, 2, 3, 4] as const).map(tier => (
          <div key={tier} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: `${c}40`, fontFamily: 'Courier New, monospace', letterSpacing: 2, marginBottom: 10,
              borderBottom: `1px solid ${c}15`, paddingBottom: 6 }}>
              {tierLabels[tier]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tierGroups[tier].map(trial => {
                const isRunning = activeTrialId === trial.id;
                const col = statusColor[trial.status];
                return (
                  <div key={trial.id} style={{
                    border: `1px solid ${trial.status === 'available' ? accentColors.amber + '40' : trial.status === 'completed' ? accentColors.green + '30' : c + '12'}`,
                    padding: '12px 16px',
                    background: trial.status === 'available' ? `${accentColors.amber}04` : trial.status === 'completed' ? `${accentColors.green}04` : 'transparent',
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: trial.status === 'locked' ? `${c}40` : c, letterSpacing: 0.5 }}>
                          {trial.name}
                        </div>
                        <div style={{ fontSize: 9, color: col, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
                          {statusLabel[trial.status]}
                          {trial.completedAt && ` · ${Math.round((Date.now() - trial.completedAt) / 60000)}m ago`}
                        </div>
                      </div>
                      <div style={{ fontSize: 8, color: `${c}35`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 6 }}>
                        {trial.codename}
                      </div>
                      <div style={{ fontSize: 9, color: `${c}55`, fontFamily: 'Courier New, monospace', lineHeight: 1.5, marginBottom: 8 }}>
                        {trial.description}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace' }}>
                          DOMAINS: {trial.domains.map(d => SUBJECT_META[d].abbr).join(' + ')}
                        </span>
                        <Stars count={trial.difficulty} color={accentColors.amber} />
                        <span style={{ fontSize: 9, color: accentColors.cyan, fontFamily: 'Courier New, monospace' }}>
                          {trial.xpReward.toLocaleString()} XP
                        </span>
                        <span style={{ fontSize: 9, color: `${c}40`, fontFamily: 'Courier New, monospace' }}>
                          REQUIRES {trial.requiredMastery}% avg mastery
                        </span>
                        {trial.score !== undefined && (
                          <span style={{ fontSize: 9, color: accentColors.green, fontFamily: 'Courier New, monospace' }}>
                            SCORE: {trial.score}%
                          </span>
                        )}
                      </div>
                    </div>

                    {trial.status === 'available' && (
                      <button
                        onClick={() => initiateTrial(trial)}
                        disabled={isRunning || !!activeTrialId}
                        style={{
                          background: isRunning ? `${accentColors.amber}20` : `${accentColors.amber}12`,
                          border: `1px solid ${accentColors.amber}60`,
                          color: isRunning ? accentColors.amber : accentColors.amber,
                          fontFamily: 'Courier New, monospace', fontSize: 10, padding: '6px 14px',
                          cursor: isRunning || !!activeTrialId ? 'not-allowed' : 'pointer',
                          flexShrink: 0, letterSpacing: 1, whiteSpace: 'nowrap',
                        }}>
                        {isRunning ? 'ALIGNING…' : 'INITIATE'}
                      </button>
                    )}
                    {trial.status === 'completed' && (
                      <div style={{ color: accentColors.green, fontFamily: 'Courier New, monospace', fontSize: 10, flexShrink: 0, paddingTop: 2 }}>
                        ✓ DONE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div style={{ width: 190, borderLeft: `1px solid ${c}15`, padding: 16, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: `${c}50`, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 14 }}>
          TRIAL SUMMARY
        </div>
        {[
          ['COMPLETED', trials.filter(t => t.status === 'completed').length, accentColors.green],
          ['AVAILABLE', trials.filter(t => t.status === 'available').length, accentColors.amber],
          ['LOCKED',    trials.filter(t => t.status === 'locked').length,   `${c}40`],
        ].map(([label, val, col]) => (
          <div key={label as string} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 8, color: `${c}35`, fontFamily: 'Courier New, monospace' }}>{label}</div>
            <div style={{ fontSize: 18, color: col as string, fontFamily: 'Courier New, monospace' }}>{val}</div>
          </div>
        ))}
        <div style={{ marginTop: 16, fontSize: 9, color: `${c}30`, fontFamily: 'Courier New, monospace', lineHeight: 1.6 }}>
          Trials unlock automatically as domain readiness increases. Complete all Tier I trials before attempting synthesis events.
        </div>
        <div style={{ marginTop: 20, fontSize: 9, color: `${c}35`, fontFamily: 'Courier New, monospace', lineHeight: 1.5 }}>
          XP AWARDED THIS SESSION:<br />
          <span style={{ color: accentColors.cyan, fontSize: 12 }}>
            {trials.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.xpReward, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function AcademyAdminApp() {
  const { colors, accentColors } = useCrtTheme();
  const c = colors.primary;
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'ecology',  label: 'ECOLOGY' },
    { id: 'epochs',   label: 'EPOCHS' },
    { id: 'trials',   label: 'TRIALS' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', color: c, fontFamily: 'Courier New, monospace', overflow: 'hidden' }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${c}25`, flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? `${c}12` : 'transparent',
              border: 'none', borderBottom: `2px solid ${tab === t.id ? c : 'transparent'}`,
              color: tab === t.id ? c : `${c}45`,
              fontFamily: 'Courier New, monospace', fontSize: 10, padding: '10px 20px',
              cursor: 'pointer', letterSpacing: 2, transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 8, color: `${c}30`, letterSpacing: 1 }}>
          RADIANT ACADEMY OS · INSTITUTIONAL MONITOR v1.0
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'overview' && <OverviewTab c={c} accentColors={accentColors} />}
        {tab === 'ecology'  && <EcologyTab  c={c} accentColors={accentColors} />}
        {tab === 'epochs'   && <EpochsTab   c={c} accentColors={accentColors} />}
        {tab === 'trials'   && <TrialsTab   c={c} accentColors={accentColors} />}
      </div>

    </div>
  );
}

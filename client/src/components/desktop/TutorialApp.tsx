import { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { ALL_STATS } from '@shared/stats';

const TUTORIAL_PROGRESS_KEY = 'academy-tutorial-progress';

interface Chapter {
  id: string;
  title: string;
  tag: string;
}

const CHAPTERS: Chapter[] = [
  { id: 'welcome',      title: 'Welcome',         tag: 'INIT'   },
  { id: 'resonance',    title: 'Resonance',        tag: 'CORE'   },
  { id: 'cycle',        title: 'The Cycle',        tag: 'SYS'    },
  { id: 'pillars',      title: 'Three Pillars',    tag: 'CORE'   },
  { id: 'disciplines',  title: 'Disciplines',      tag: 'DATA'   },
  { id: 'living',       title: 'Living Academy',   tag: 'WORLD'  },
  { id: 'hidden',       title: 'Hidden Systems',   tag: 'DEPTH'  },
  { id: 'begin',        title: 'Begin',            tag: 'EXEC'   },
];

function Divider({ color }: { color: string }) {
  return (
    <div style={{ borderTop: `1px solid ${color}25`, margin: '14px 0' }} />
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      background: `${color}18`, border: `1px solid ${color}40`,
      color: color, fontSize: 9, fontFamily: 'monospace', padding: '1px 6px',
      letterSpacing: 1, marginLeft: 6,
    }}>
      {text}
    </span>
  );
}

function StatBar({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: `${color}90`, fontFamily: 'monospace', marginBottom: 2 }}>
        <span>{label.toUpperCase()}</span>
        <span>{value}/{max}</span>
      </div>
      <div style={{ height: 4, background: `${color}15`, border: `1px solid ${color}25` }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `${color}70`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function ResonanceDemo({ color }: { color: string }) {
  const [step, setStep] = useState(0);
  const nodes = [
    { id: 'action', label: 'YOU STUDY\nLOGIC', x: 50, y: 80 },
    { id: 'skill',  label: 'MATH LOGIC\n+3',   x: 200, y: 30 },
    { id: 'npc',    label: 'ARCHIVIST\nNOTICES', x: 200, y: 130 },
    { id: 'world',  label: 'RUMOR\nSPREADS',    x: 350, y: 30 },
    { id: 'opp',    label: 'NEW DOOR\nUNLOCKS', x: 350, y: 130 },
  ];
  const edges = [
    { from: 0, to: 1 }, { from: 0, to: 2 },
    { from: 1, to: 3 }, { from: 2, to: 4 },
  ];
  const activeEdges  = edges.filter((_, i) => step > i);
  const activeNodes  = new Set<number>();
  activeNodes.add(0);
  activeEdges.forEach(e => { activeNodes.add(e.from); activeNodes.add(e.to); });

  return (
    <div style={{ marginTop: 12 }}>
      <svg width="420" height="170" style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}>
        {edges.map((e, i) => {
          const s = nodes[e.from]; const t = nodes[e.to];
          const active = activeEdges.includes(e);
          return (
            <line key={i} x1={s.x + 44} y1={s.y + 20} x2={t.x} y2={t.y + 20}
              stroke={active ? color : `${color}20`}
              strokeWidth={active ? 1.5 : 1}
              strokeDasharray={active ? 'none' : '4 3'}
              style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
            />
          );
        })}
        {nodes.map((n, i) => {
          const active = activeNodes.has(i);
          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              <rect width={88} height={40} rx={2}
                fill={active ? `${color}12` : 'transparent'}
                stroke={active ? `${color}70` : `${color}20`}
                strokeWidth={active ? 1.5 : 1}
                style={{ transition: 'fill 0.4s, stroke 0.4s' }}
              />
              {n.label.split('\n').map((line, li) => (
                <text key={li} x={44} y={16 + li * 13}
                  textAnchor="middle" fontSize={9}
                  fontFamily="Courier New, monospace"
                  fill={active ? color : `${color}30`}
                  style={{ transition: 'fill 0.4s' }}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {step < edges.length
          ? <button onClick={() => setStep(s => s + 1)} style={{
              background: `${color}15`, border: `1px solid ${color}50`, color,
              fontFamily: 'monospace', fontSize: 10, padding: '4px 14px', cursor: 'pointer', letterSpacing: 1,
            }}>PROPAGATE →</button>
          : <button onClick={() => setStep(0)} style={{
              background: `${color}08`, border: `1px solid ${color}30`, color: `${color}70`,
              fontFamily: 'monospace', fontSize: 10, padding: '4px 14px', cursor: 'pointer', letterSpacing: 1,
            }}>RESET</button>
        }
        <span style={{ fontSize: 10, color: `${color}50`, fontFamily: 'monospace', alignSelf: 'center' }}>
          STEP {step}/{edges.length}
        </span>
      </div>
    </div>
  );
}

function CycleWheel({ color }: { color: string }) {
  const [active, setActive] = useState<string | null>(null);
  const actions = [
    { id: 'study',    label: 'STUDY',     desc: 'Advance a discipline. Slow and compounding.',     cost: 2 },
    { id: 'train',    label: 'TRAIN',     desc: 'Build physical or mental capacity.',               cost: 2 },
    { id: 'maintain', label: 'MAINTAIN',  desc: 'Stabilize Academy infrastructure. Invisible work.', cost: 1 },
    { id: 'interact', label: 'INTERACT',  desc: 'Engage an NPC. Plant seeds of relationship.',      cost: 1 },
    { id: 'explore',  label: 'EXPLORE',   desc: 'Discover hidden systems. High variance.',           cost: 2 },
    { id: 'rest',     label: 'REST',      desc: 'Integrate knowledge. Restore energy.',              cost: 0 },
  ];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {actions.map(a => (
          <button
            key={a.id}
            onClick={() => setActive(active === a.id ? null : a.id)}
            style={{
              background: active === a.id ? `${color}20` : `${color}08`,
              border: `1px solid ${active === a.id ? color : color + '30'}`,
              color: active === a.id ? color : `${color}60`,
              fontFamily: 'monospace', fontSize: 10, padding: '5px 12px', cursor: 'pointer', letterSpacing: 1,
              transition: 'all 0.2s',
            }}
          >
            {a.label}
            <span style={{ fontSize: 8, marginLeft: 4, opacity: 0.6 }}>
              [{a.cost > 0 ? `-${a.cost}E` : 'FREE'}]
            </span>
          </button>
        ))}
      </div>
      {active && (() => {
        const a = actions.find(x => x.id === active)!;
        return (
          <div style={{ marginTop: 8, padding: '8px 12px', background: `${color}08`, border: `1px solid ${color}25`, fontFamily: 'monospace', fontSize: 11, color: `${color}90` }}>
            <span style={{ color, fontWeight: 'bold' }}>{a.label}: </span>{a.desc}
          </div>
        );
      })()}
    </div>
  );
}

function PillarGauge({ color, stats }: { color: string; stats: Record<string, number> }) {
  const pillars = [
    {
      name: 'EXCELLENCE',
      desc: 'Quality of mastery. Depth over speed.',
      keys: ['mathLogic', 'linguistic', 'musicCreative', 'fortitude'],
      accent: '#00ffaa',
    },
    {
      name: 'EFFICACY',
      desc: 'Practical impact. Efficient output.',
      keys: ['quickness', 'strength', 'endurance', 'agility', 'speed'],
      accent: color,
    },
    {
      name: 'PERCEPTION',
      desc: 'How your actions are interpreted.',
      keys: ['presence', 'faith', 'karma', 'resonance', 'luck', 'chi', 'nagual', 'ashe'],
      accent: '#ff66ff',
    },
  ];

  return (
    <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {pillars.map(p => {
        const vals = p.keys.map(k => (stats[k] ?? 10));
        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        const pct = avg;
        return (
          <div key={p.name} style={{ flex: '1 1 120px', background: `${p.accent}08`, border: `1px solid ${p.accent}25`, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: p.accent, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 }}>{p.name}</div>
            <div style={{ height: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', background: `${p.accent}20` }}>
                  <div style={{ height: `${pct}%`, maxHeight: '100%', background: `${p.accent}60`, minHeight: 2, transition: 'height 0.6s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: 16, color: p.accent, fontFamily: 'monospace', marginTop: 4 }}>{avg}</div>
            <div style={{ fontSize: 9, color: `${p.accent}50`, fontFamily: 'monospace', marginTop: 2 }}>{p.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function ChapterContent({ chapterId, color, character }: { chapterId: string; color: string; character: ReturnType<typeof useGameState>['character'] }) {
  const stats = character.stats as Record<string, number>;

  switch (chapterId) {
    case 'welcome':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
            ORIENTATION FILE: STUDENT INTAKE — CYCLE 001
          </div>
          <Divider color={color} />
          <p>Welcome, <span style={{ color }}>{character.name || 'Cadet'}</span>.</p>
          <p style={{ marginTop: 10 }}>
            This document is your orientation to <span style={{ color }}>The Academy</span> — a living institution that responds to, remembers, and is shaped by your presence within it.
          </p>
          <p style={{ marginTop: 10 }}>
            Before you navigate to any application on your desktop, read this file completely. The systems you interact with are designed to be felt before they are understood.
          </p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}60`, fontFamily: 'monospace', lineHeight: 1.8 }}>
            {[
              '> What you will encounter:',
              '  — A school that decays without attention',
              '  — Students who remember what you do',
              '  — Disciplines that cross-contaminate each other',
              '  — Consequences with delayed arrival',
              '  — Rewards that require pattern recognition',
              '',
              '> What this is NOT:',
              '  — A linear quest chain',
              '  — A skill tree to max',
              '  — A game with a win screen',
            ].map((line, i) => <div key={i}>{line || <br />}</div>)}
          </div>
          <Divider color={color} />
          <p>Navigate using the chapter list on the left. Each section contains both explanation and interactive elements derived from your live character data.</p>
          <p style={{ marginTop: 8, color: `${color}60`, fontSize: 11 }}>
            Your current level is <span style={{ color }}>{character.level}</span>. Your experience: <span style={{ color }}>{character.experience}</span> XP.
          </p>
        </div>
      );

    case 'resonance':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
            CORE PRINCIPLE: RESONANCE
          </div>
          <Divider color={color} />
          <p>Nothing in The Academy happens in isolation.</p>
          <p style={{ marginTop: 10 }}>
            Every action you take emits energy along multiple axes. That energy propagates outward through a network of people, places, and systems — arriving at destinations you may never directly observe.
          </p>
          <p style={{ marginTop: 10 }}>
            This is not metaphor. It is the architecture of the simulation.
          </p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}80`, fontFamily: 'monospace' }}>
            INTERACTIVE — TRACE A SINGLE DECISION:
          </div>
          <ResonanceDemo color={color} />
          <Divider color={color} />
          <p style={{ fontSize: 11, color: `${color}70` }}>
            The same cascade applies when you skip class, repair a system, or speak harshly to a mentor. Direction and magnitude vary. The principle does not.
          </p>
          <p style={{ marginTop: 8, fontSize: 11, color: `${color}70` }}>
            Think less: <em>"What do I gain?"</em><br />
            Think more: <em>"What does this set in motion?"</em>
          </p>
        </div>
      );

    case 'cycle':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
            SYSTEM: THE CYCLE
          </div>
          <Divider color={color} />
          <p>Time in The Academy moves in <span style={{ color }}>Cycles</span>. A Cycle is a meaningful unit of progression — a day, a week, or a phase, depending on context.</p>
          <p style={{ marginTop: 10 }}>
            During each Cycle, you have limited energy. You cannot do everything. <span style={{ color }}>Choice is the engine.</span>
          </p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}80`, fontFamily: 'monospace', marginBottom: 6 }}>
            AVAILABLE CYCLE ACTIONS — SELECT TO INSPECT:
          </div>
          <CycleWheel color={color} />
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.8 }}>
            <div>IMPORTANT NOTES:</div>
            <div>— Rest is never wasted. Integration is invisible growth.</div>
            <div>— Maintenance has no visible reward. Infrastructure decay does not announce itself.</div>
            <div>— Interaction costs less than study, but compounds socially.</div>
            <div>— Exploration is the highest-variance option. Variance is not random.</div>
          </div>
        </div>
      );

    case 'pillars':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
            FRAMEWORK: THE THREE PILLARS
          </div>
          <Divider color={color} />
          <p>All Academy actions are evaluated against three foundational pillars. These are not meters to fill — they are orientations that color every outcome.</p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}80`, fontFamily: 'monospace', marginBottom: 4 }}>
            YOUR CURRENT PILLAR BALANCE (LIVE):
          </div>
          <PillarGauge color={color} stats={stats} />
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: `${color}70`, lineHeight: 1.9 }}>
            <div><span style={{ color }}>EXCELLENCE</span> — Quality of mastery. High excellence creates breakthroughs and rare opportunities. Neglect creates fragile competence.</div>
            <div style={{ marginTop: 8 }}><span style={{ color: '#00ffaa' }}>EFFICACY</span> — Practical impact. Efficient systems reduce decay. Poor efficacy creates hidden technical debt.</div>
            <div style={{ marginTop: 8 }}><span style={{ color: '#ff66ff' }}>PERCEPTION</span> — Reputation and narrative. The same action can be heroic, reckless, or ominous depending on context.</div>
          </div>
          <Divider color={color} />
          <p style={{ fontSize: 11, color: `${color}60` }}>Balancing all three is more important than maximizing one.</p>
        </div>
      );

    case 'disciplines': {
      const cats: Array<{ label: string; keys: string[]; color: string }> = [
        { label: 'PHYSICAL', color: '#ff4444', keys: ['quickness', 'endurance', 'agility', 'speed', 'strength'] },
        { label: 'MENTAL',   color: color,     keys: ['mathLogic', 'linguistic', 'presence', 'fortitude', 'musicCreative'] },
        { label: 'SPIRITUAL',color: '#aa44ff', keys: ['faith', 'karma', 'resonance', 'luck', 'chi', 'nagual', 'ashe'] },
      ];
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
            DATA: DISCIPLINES & STATS
          </div>
          <Divider color={color} />
          <p>The Academy tracks 17 active disciplines across three domains. They are not independent — they interact, amplify, and sometimes oppose each other.</p>
          <p style={{ marginTop: 8 }}>Cross-training creates emergent abilities not available through single-track study.</p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}80`, fontFamily: 'monospace', marginBottom: 8 }}>
            YOUR CURRENT DISCIPLINES (LIVE — from {character.name || 'your profile'}):
          </div>
          {cats.map(cat => (
            <div key={cat.label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: cat.color, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>
                — {cat.label} —
              </div>
              {cat.keys.map(k => {
                const def = ALL_STATS.find(s => s.id === k);
                return (
                  <StatBar key={k} label={def?.label ?? k} value={stats[k] ?? 10} color={cat.color} />
                );
              })}
            </div>
          ))}
          <Divider color={color} />
          <p style={{ fontSize: 11, color: `${color}60` }}>
            Stats grow through study, through GED curriculum completion, and through hidden resonance chains. Not all growth is explicit.
          </p>
        </div>
      );
    }

    case 'living':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
            WORLD: THE LIVING ACADEMY
          </div>
          <Divider color={color} />
          <div style={{ fontSize: 11, color: `${color}80`, fontFamily: 'monospace', lineHeight: 1.8 }}>
            <div style={{ color, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>[ INFRASTRUCTURE ]</div>
            <p>Classrooms decay. Power systems drift. Archives fragment.</p>
            <p style={{ marginTop: 6 }}>You may repair existing systems, upgrade facilities, or unlock forgotten wings. Neglecting infrastructure does not cause immediate failure — but it reshapes future options. The Academy will silently close doors you did not know were open.</p>
          </div>
          <Divider color={color} />
          <div style={{ fontSize: 10, color, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>[ RADIANT AI — NPC FIELD ]</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: `${color}70`, lineHeight: 1.8 }}>
            <p>Students, mentors, and external observers are not decorations. They:</p>
            <div style={{ marginLeft: 12, color: `${color}60` }}>
              <div>— Remember your actions</div>
              <div>— Share information with each other</div>
              <div>— Act independently when you are absent</div>
              <div>— Form alliances or resistance based on your behavior</div>
            </div>
            <p style={{ marginTop: 8 }}>Pay attention to dialogue. It often encodes future system states.</p>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.8 }}>
            <div style={{ color, letterSpacing: 1 }}>NOTABLE FIGURES IN YOUR FIRST CYCLE:</div>
            {[
              { name: 'ARCHIVIST ILYRA', role: 'Notices intellectual patterns. Values rigor.',           trust: 'neutral' },
              { name: 'GROUNDSKEEPER TOMAS', role: 'Values maintenance and continuity. Watches quietly.', trust: 'neutral' },
              { name: 'RESONANCE ADEPT SABLE', role: 'Sensitive to behavioral rhythm. Hard to read.',    trust: 'neutral' },
            ].map(npc => (
              <div key={npc.name} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: `1px solid ${color}10` }}>
                <div style={{ width: 6, background: `${color}30`, flexShrink: 0, alignSelf: 'stretch' }} />
                <div>
                  <div style={{ color, fontSize: 10 }}>{npc.name}</div>
                  <div style={{ color: `${color}60`, fontSize: 10 }}>{npc.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'hidden':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
            DEPTH: HIDDEN SYSTEMS
          </div>
          <Divider color={color} />
          <p>Not everything in The Academy is visible. Certain mechanics only emerge through:</p>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: `${color}60`, marginTop: 8, lineHeight: 1.9 }}>
            <div>— Pattern recognition across multiple cycles</div>
            <div>— Repeated symbolic actions in specific locations</div>
            <div>— Spiritual alignment across multiple stats</div>
            <div>— Environmental resonance at threshold states</div>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: `${color}70`, lineHeight: 1.8 }}>
            <p>Some systems will not reveal themselves until you have demonstrated you are ready to see them. Others respond only to combinations — a specific stat threshold paired with a specific NPC relationship and a specific location.</p>
            <p style={{ marginTop: 8 }}>If something feels intentional, it probably is.</p>
          </div>
          <Divider color={color} />
          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, padding: '12px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1, marginBottom: 4 }}>NOTE FROM THE ARCHIVIST</div>
            <div style={{ fontSize: 11, color: `${color}80` }}>
              "The Academy has been here longer than most of its current students realize. What you call 'hidden systems' — we call unread chapters. Read more carefully."
            </div>
            <div style={{ fontSize: 9, color: `${color}40`, marginTop: 6 }}>— Ilyra, Third Archivist</div>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}50` }}>
            KNOWN DEEP SYSTEMS (PARTIAL DISCLOSURE):
            <div style={{ marginLeft: 12, marginTop: 4, lineHeight: 1.9 }}>
              <div>· Confluence Hall — accessible after GED readiness threshold</div>
              <div>· Resonance Lattice — emerges at high spiritual stat variance</div>
              <div>· Faction Emergence — forms when NPC affinity thresholds cross</div>
              <div>· [REDACTED] — requires simultaneous conditions not listed here</div>
            </div>
          </div>
        </div>
      );

    case 'begin':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
            EXECUTE: BEGIN YOUR FIRST CYCLE
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: `${color}90`, lineHeight: 1.9 }}>
            <div>STUDENT:   <span style={{ color }}>{character.name || 'UNREGISTERED'}</span></div>
            <div>LEVEL:     <span style={{ color }}>{character.level}</span></div>
            <div>XP:        <span style={{ color }}>{character.experience}</span> / {character.experienceToNextLevel}</div>
            <div>PERKS:     <span style={{ color }}>{character.unlockedPerks?.length ?? 0}</span> active</div>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: `${color}70`, lineHeight: 1.9 }}>
            <p>Your early objectives — there is no single win condition, but these provide orientation:</p>
            <div style={{ marginLeft: 12, marginTop: 6, color: `${color}60` }}>
              <div>[ ] Establish a sustainable rhythm</div>
              <div>[ ] Develop at least one deep competency</div>
              <div>[ ] Maintain Academy stability</div>
              <div>[ ] Begin shaping how the world perceives you</div>
            </div>
          </div>
          <Divider color={color} />
          <div style={{ background: `${color}08`, border: `1px solid ${color}30`, padding: '14px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 11, color: `${color}80`, lineHeight: 1.8 }}>
              Move deliberately. Observe consequences. Trust resonance.
            </div>
            <div style={{ fontSize: 11, color, marginTop: 6 }}>
              The Academy is watching — but it is also learning from you.
            </div>
            <div style={{ fontSize: 11, color: `${color}70`, marginTop: 6 }}>
              Welcome.
            </div>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}50` }}>
            <div>START POINTS:</div>
            <div style={{ marginLeft: 12, marginTop: 4, lineHeight: 1.9 }}>
              <div>→ THE ACADEMY — main game terminal (double-click desktop icon)</div>
              <div>→ ASSIGNMENTS — begin your GED curriculum</div>
              <div>→ NOTEBOOK — document discoveries as they emerge</div>
              <div>→ RESONANCE DASHBOARD — monitor your cascade state</div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function TutorialApp() {
  const { character } = useGameState();
  const { theme } = useCrtTheme();
  const color = theme === 'green' ? '#00ff41' : theme === 'amber' ? '#ffb000' : theme === 'cyan' ? '#00ffff' : '#00ff41';
  const [chapter, setChapter] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const [read, setRead] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(TUTORIAL_PROGRESS_KEY);
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });

  useEffect(() => {
    setRead(prev => {
      const next = new Set(prev).add(chapter);
      localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, [chapter]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [chapter]);

  const progress = Math.round((read.size / CHAPTERS.length) * 100);

  return (
    <div style={{
      display: 'flex', height: '100%', background: '#050505',
      fontFamily: '"Courier New", monospace', color: `${color}90`,
      fontSize: 12, lineHeight: 1.7,
    }}>
      {/* Left nav */}
      <div style={{
        width: 148, flexShrink: 0, borderRight: `1px solid ${color}20`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${color}20` }}>
          <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1 }}>ORIENTATION SYS</div>
          <div style={{ fontSize: 9, color: `${color}30`, marginTop: 2 }}>v2.3 — STUDENT INTAKE</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {CHAPTERS.map((ch, i) => {
            const isActive = chapter === i;
            const isRead = read.has(i);
            return (
              <button
                key={ch.id}
                onClick={() => setChapter(i)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'transparent',
                  border: 'none', borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
                  padding: '7px 10px 7px 12px', cursor: 'pointer',
                  color: isActive ? color : isRead ? `${color}70` : `${color}40`,
                  fontFamily: 'monospace', fontSize: 10,
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                <div style={{ fontSize: 8, color: isActive ? `${color}60` : `${color}25`, letterSpacing: 1, marginBottom: 1 }}>
                  {String(i).padStart(2, '0')} [{ch.tag}]
                </div>
                <div>{ch.title.toUpperCase()}</div>
                {isRead && !isActive && (
                  <div style={{ fontSize: 8, color: `${color}35`, marginTop: 1 }}>✓ READ</div>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ padding: '8px 10px', borderTop: `1px solid ${color}20` }}>
          <div style={{ fontSize: 9, color: `${color}40`, letterSpacing: 1, marginBottom: 4 }}>PROGRESS</div>
          <div style={{ height: 3, background: `${color}15`, border: `1px solid ${color}20` }}>
            <div style={{ width: `${progress}%`, height: '100%', background: `${color}60`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 9, color: `${color}40`, marginTop: 3 }}>{progress}% REVIEWED</div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Content header */}
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${color}20`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 9, color: `${color}40`, letterSpacing: 1 }}>
              CHAPTER {String(chapter).padStart(2, '0')} /
            </span>
            <span style={{ fontSize: 11, color, marginLeft: 6, letterSpacing: 1 }}>
              {CHAPTERS[chapter].title.toUpperCase()}
            </span>
            <Tag text={CHAPTERS[chapter].tag} color={color} />
          </div>
          <div style={{ fontSize: 9, color: `${color}30`, fontFamily: 'monospace' }}>
            {character.name || '???'} · LVL {character.level}
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', color: `${color}85` }}
        >
          <ChapterContent chapterId={CHAPTERS[chapter].id} color={color} character={character} />
        </div>

        {/* Navigation footer */}
        <div style={{
          padding: '8px 16px', borderTop: `1px solid ${color}20`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <button
            onClick={() => setChapter(c => Math.max(0, c - 1))}
            disabled={chapter === 0}
            style={{
              background: 'transparent', border: `1px solid ${chapter === 0 ? color + '15' : color + '40'}`,
              color: chapter === 0 ? `${color}25` : `${color}80`,
              fontFamily: 'monospace', fontSize: 10, padding: '4px 14px', cursor: chapter === 0 ? 'default' : 'pointer', letterSpacing: 1,
            }}
          >
            ← PREV
          </button>
          <div style={{ fontSize: 9, color: `${color}35`, fontFamily: 'monospace', letterSpacing: 1 }}>
            {chapter + 1} / {CHAPTERS.length}
          </div>
          <button
            onClick={() => setChapter(c => Math.min(CHAPTERS.length - 1, c + 1))}
            disabled={chapter === CHAPTERS.length - 1}
            style={{
              background: chapter === CHAPTERS.length - 1 ? 'transparent' : `${color}12`,
              border: `1px solid ${chapter === CHAPTERS.length - 1 ? color + '15' : color + '50'}`,
              color: chapter === CHAPTERS.length - 1 ? `${color}25` : color,
              fontFamily: 'monospace', fontSize: 10, padding: '4px 14px',
              cursor: chapter === CHAPTERS.length - 1 ? 'default' : 'pointer', letterSpacing: 1,
            }}
          >
            NEXT →
          </button>
        </div>
      </div>
    </div>
  );
}

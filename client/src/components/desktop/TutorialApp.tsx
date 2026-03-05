import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { ALL_STATS } from '@shared/stats';

const TUTORIAL_PROGRESS_KEY = 'academy-tutorial-progress';
const ATRIUM_COMPLETE_KEY   = 'academy-atrium-complete';

interface Chapter {
  id: string;
  title: string;
  tag: string;
}

const CHAPTERS: Chapter[] = [
  { id: 'welcome',       title: 'Welcome',             tag: 'INIT'   },
  { id: 'terminal',      title: 'Command Terminal',    tag: 'CMD'    },
  { id: 'atrium',        title: 'Atrium Rite',          tag: 'LIVE'   },
  { id: 'resonance',     title: 'Resonance',            tag: 'CORE'   },
  { id: 'cycle',         title: 'The Cycle',            tag: 'SYS'    },
  { id: 'assignments-guide', title: 'Assignments & GED',tag: 'STUDY'  },
  { id: 'pillars',       title: 'Three Pillars',        tag: 'CORE'   },
  { id: 'disciplines',   title: 'Disciplines',          tag: 'DATA'   },
  { id: 'constellation', title: 'Your Constellation',   tag: 'MAP'    },
  { id: 'npc-guide',     title: 'NPC Interface',        tag: 'SOCIAL' },
  { id: 'living',        title: 'Living Academy',       tag: 'WORLD'  },
  { id: 'hidden',        title: 'Hidden Systems',       tag: 'DEPTH'  },
  { id: 'begin',         title: 'Begin',                tag: 'EXEC'   },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function seededRand(seed: number, n: number): number {
  const x = Math.sin(seed * 9301 + n * 49297 + 233) * 10000;
  return x - Math.floor(x);
}
function nameSeed(name: string): number {
  return name.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0) || 1337;
}
function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Divider({ color }: { color: string }) {
  return <div style={{ borderTop: `1px solid ${color}25`, margin: '14px 0' }} />;
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      background: `${color}18`, border: `1px solid ${color}40`, color,
      fontSize: 9, fontFamily: 'monospace', padding: '1px 6px', letterSpacing: 1, marginLeft: 6,
    }}>{text}</span>
  );
}

function StatBar({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: `${color}90`, fontFamily: 'monospace', marginBottom: 2 }}>
        <span>{label.toUpperCase()}</span><span>{value}/{max}</span>
      </div>
      <div style={{ height: 4, background: `${color}15`, border: `1px solid ${color}25` }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `${color}70`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ─── Resonance Demo ───────────────────────────────────────────────────────────

function ResonanceDemo({ color }: { color: string }) {
  const [step, setStep] = useState(0);
  const nodes = [
    { id: 'action', label: 'YOU STUDY\nLOGIC',      x: 50,  y: 80  },
    { id: 'skill',  label: 'MATH LOGIC\n+3',         x: 200, y: 30  },
    { id: 'npc',    label: 'ARCHIVIST\nNOTICES',     x: 200, y: 130 },
    { id: 'world',  label: 'RUMOR\nSPREADS',         x: 350, y: 30  },
    { id: 'opp',    label: 'NEW DOOR\nUNLOCKS',      x: 350, y: 130 },
  ];
  const edges = [{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 4 }];
  const activeEdges = edges.filter((_, i) => step > i);
  const activeNodes = new Set<number>([0]);
  activeEdges.forEach(e => { activeNodes.add(e.from); activeNodes.add(e.to); });
  return (
    <div style={{ marginTop: 12 }}>
      <svg width="420" height="170" style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}>
        {edges.map((e, i) => {
          const s = nodes[e.from], t = nodes[e.to];
          const active = activeEdges.includes(e);
          return <line key={i} x1={s.x + 44} y1={s.y + 20} x2={t.x} y2={t.y + 20}
            stroke={active ? color : `${color}20`} strokeWidth={active ? 1.5 : 1}
            strokeDasharray={active ? 'none' : '4 3'} style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }} />;
        })}
        {nodes.map((n, i) => {
          const active = activeNodes.has(i);
          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              <rect width={88} height={40} rx={2}
                fill={active ? `${color}12` : 'transparent'}
                stroke={active ? `${color}70` : `${color}20`} strokeWidth={active ? 1.5 : 1}
                style={{ transition: 'fill 0.4s, stroke 0.4s' }} />
              {n.label.split('\n').map((line, li) => (
                <text key={li} x={44} y={16 + li * 13} textAnchor="middle" fontSize={9}
                  fontFamily="Courier New, monospace" fill={active ? color : `${color}30`}
                  style={{ transition: 'fill 0.4s' }}>{line}</text>
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {step < edges.length
          ? <button onClick={() => setStep(s => s + 1)} style={{ background: `${color}15`, border: `1px solid ${color}50`, color, fontFamily: 'monospace', fontSize: 10, padding: '4px 14px', cursor: 'pointer', letterSpacing: 1 }}>PROPAGATE →</button>
          : <button onClick={() => setStep(0)} style={{ background: `${color}08`, border: `1px solid ${color}30`, color: `${color}70`, fontFamily: 'monospace', fontSize: 10, padding: '4px 14px', cursor: 'pointer', letterSpacing: 1 }}>RESET</button>}
        <span style={{ fontSize: 10, color: `${color}50`, fontFamily: 'monospace', alignSelf: 'center' }}>STEP {step}/{edges.length}</span>
      </div>
    </div>
  );
}

// ─── Cycle Wheel ──────────────────────────────────────────────────────────────

function CycleWheel({ color }: { color: string }) {
  const [active, setActive] = useState<string | null>(null);
  const actions = [
    { id: 'study',    label: 'STUDY',    desc: 'Advance a discipline. Slow and compounding.',        cost: 2 },
    { id: 'train',    label: 'TRAIN',    desc: 'Build physical or mental capacity.',                  cost: 2 },
    { id: 'maintain', label: 'MAINTAIN', desc: 'Stabilize Academy infrastructure. Invisible work.',   cost: 1 },
    { id: 'interact', label: 'INTERACT', desc: 'Engage an NPC. Plant seeds of relationship.',         cost: 1 },
    { id: 'explore',  label: 'EXPLORE',  desc: 'Discover hidden systems. High variance.',              cost: 2 },
    { id: 'rest',     label: 'REST',     desc: 'Integrate knowledge. Restore energy.',                 cost: 0 },
  ];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {actions.map(a => (
          <button key={a.id} onClick={() => setActive(active === a.id ? null : a.id)} style={{
            background: active === a.id ? `${color}20` : `${color}08`,
            border: `1px solid ${active === a.id ? color : color + '30'}`,
            color: active === a.id ? color : `${color}60`,
            fontFamily: 'monospace', fontSize: 10, padding: '5px 12px', cursor: 'pointer', letterSpacing: 1, transition: 'all 0.2s',
          }}>
            {a.label}<span style={{ fontSize: 8, marginLeft: 4, opacity: 0.6 }}>[{a.cost > 0 ? `-${a.cost}E` : 'FREE'}]</span>
          </button>
        ))}
      </div>
      {active && (() => {
        const a = actions.find(x => x.id === active)!;
        return <div style={{ marginTop: 8, padding: '8px 12px', background: `${color}08`, border: `1px solid ${color}25`, fontFamily: 'monospace', fontSize: 11, color: `${color}90` }}>
          <span style={{ color, fontWeight: 'bold' }}>{a.label}: </span>{a.desc}
        </div>;
      })()}
    </div>
  );
}

// ─── Pillar Gauge ─────────────────────────────────────────────────────────────

function PillarGauge({ color, stats }: { color: string; stats: Record<string, number> }) {
  const pillars = [
    { name: 'EXCELLENCE', desc: 'Quality of mastery. Depth over speed.',        keys: ['mathLogic', 'linguistic', 'musicCreative', 'fortitude'],                    accent: '#00ffaa' },
    { name: 'EFFICACY',   desc: 'Practical impact. Efficient output.',           keys: ['quickness', 'strength', 'endurance', 'agility', 'speed'],                   accent: color     },
    { name: 'PERCEPTION', desc: 'How your actions are interpreted.',             keys: ['presence', 'faith', 'karma', 'resonance', 'luck', 'chi', 'nagual', 'ashe'], accent: '#ff66ff' },
  ];
  return (
    <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {pillars.map(p => {
        const vals = p.keys.map(k => (stats[k] ?? 10));
        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        return (
          <div key={p.name} style={{ flex: '1 1 120px', background: `${p.accent}08`, border: `1px solid ${p.accent}25`, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: p.accent, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 }}>{p.name}</div>
            <div style={{ height: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', background: `${p.accent}20` }}>
                  <div style={{ height: `${avg}%`, maxHeight: '100%', background: `${p.accent}60`, minHeight: 2, transition: 'height 0.6s ease' }} />
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

// ─── Divine Geometry ──────────────────────────────────────────────────────────

type GeoAction = 'observe' | 'wait' | 'intent';

interface GeoState {
  alignment:   number;   // raw accumulator
  harmony:     number;
  dissonance:  number;
  pattern:     GeoAction[];
  log:         string[];
  totalRes:    number;
  attuned:     boolean;
}

const GEO_MESSAGES: Record<string, string[]> = {
  harmonic_growth: [
    'The architecture breathes with you.',
    'Something in the walls responds.',
    'Light refracts differently here.',
    'The Atrium adjusts to your cadence.',
  ],
  dissonance: [
    'Angles resist you. The space refuses haste.',
    'A low hum — not approval.',
    'The geometry tightens against repeated force.',
    'Rushing is noticed. Everything is noticed.',
  ],
  alignment: [
    'Lines converge. A path reveals itself.',
    'Precision has weight here.',
    'Intent followed by intent: the space grows brittle.',
    'Force without observation strains the lattice.',
  ],
  deep_harmony: [
    'Stillness amplifies. The Academy listens.',
    'Your restraint is noted.',
    'The space opens — slightly.',
    'Observation deepens what waits beneath.',
  ],
  neutral: [
    'The Academy waits.',
    'Nothing is lost. Everything is recorded.',
    'You exist within its attention.',
    'The Atrium has no urgency. Only pattern.',
  ],
};

function geoEvaluate(prev: GeoState, action: GeoAction): GeoState {
  const pattern = [...prev.pattern, action];
  let a = prev.alignment, h = prev.harmony, d = prev.dissonance;
  let res = 0;
  let msgKey = 'neutral';

  if (pattern.length >= 2) {
    const [p, q] = pattern.slice(-2) as [GeoAction, GeoAction];
    if      (p === 'observe' && q === 'intent')  { a += 1.2; h += 0.8; res += 0.8; msgKey = 'alignment';     }
    else if (p === 'intent'  && q === 'intent')  { d += 1.0;            res -= 0.2; msgKey = 'dissonance';    }
    else if (p === 'observe' && q === 'wait')     { h += 1.5;            res += 0.5; msgKey = 'deep_harmony';  }
    else if (p === 'wait'    && q === 'observe')  { a += 0.8; h += 0.3; res += 0.3; msgKey = 'harmonic_growth';}
    else if (p === 'wait'    && q === 'intent')   { a += 0.6; h += 0.3; res += 0.4; msgKey = 'alignment';     }
    else if (p === 'intent'  && q === 'wait')     { h += 0.5;            res += 0.2; msgKey = 'harmonic_growth';}
    else if (p === 'observe' && q === 'observe')  { h += 0.6; a += 0.4; res += 0.3; msgKey = 'harmonic_growth';}
    else if (p === 'wait'    && q === 'wait')     { h += 1.0;            res += 0.4; msgKey = 'deep_harmony';  }
  } else {
    if (action === 'observe') { h += 0.4; a += 0.2; res += 0.1; msgKey = 'harmonic_growth'; }
    if (action === 'wait')    { h += 0.5; res += 0.1;              msgKey = 'deep_harmony';  }
    if (action === 'intent')  { a += 0.3; d += 0.3; res += 0.0;   msgKey = 'neutral';        }
  }

  const totalRes = prev.totalRes + res;
  const msgs = GEO_MESSAGES[msgKey];
  const msgIdx = Math.floor(Math.random() * msgs.length);
  const newLog = [msgs[msgIdx], ...prev.log].slice(0, 6);

  // Attunement condition: enough harmony, low dissonance, enough actions
  const attuned = h >= 2.5 && d <= 1.0 && pattern.length >= 5;

  return { alignment: a, harmony: h, dissonance: d, pattern, log: newLog, totalRes, attuned };
}

function GeoRadar({ geo, color }: { geo: GeoState; color: string }) {
  const cx = 100, cy = 100, maxR = 72;
  const cap = (v: number) => Math.min(v / 4, 1);   // scale 0-4 → 0-1 for radius
  const hR = cap(geo.harmony)   * maxR;
  const aR = cap(geo.alignment) * maxR;
  const dR = cap(geo.dissonance)* maxR;

  // Axes: harmony=top (-90°), alignment=lower-right (30°), dissonance=lower-left (150°)
  const axes = [
    { label: 'HARMONY',    angle: -Math.PI / 2, color: '#00ffaa', value: hR },
    { label: 'ALIGNMENT',  angle:  Math.PI / 6, color: color,      value: aR },
    { label: 'DISSONANCE', angle:  5*Math.PI/6, color: '#ff4444',  value: dR },
  ];

  const pt = (r: number, angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const poly = axes.map(ax => pt(ax.value, ax.angle));
  const polyStr = poly.map(p => `${p.x},${p.y}`).join(' ');

  // Grid circles at 25/50/75/100%
  const gridRadii = [maxR * 0.25, maxR * 0.5, maxR * 0.75, maxR];

  return (
    <svg width={200} height={200} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      {/* grid rings */}
      {gridRadii.map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={`${color}15`} strokeWidth={1} />
      ))}
      {/* axis lines */}
      {axes.map((ax, i) => {
        const end = pt(maxR, ax.angle);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={`${ax.color}30`} strokeWidth={1} />;
      })}
      {/* filled area */}
      <polygon points={polyStr} fill={`${color}18`} stroke={color} strokeWidth={1.5} style={{ transition: 'all 0.5s ease' }} />
      {/* dots at each axis value */}
      {axes.map((ax, i) => {
        const p = pt(ax.value, ax.angle);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill={ax.color} style={{ transition: 'all 0.5s ease' }} />;
      })}
      {/* labels */}
      {axes.map((ax, i) => {
        const labelR = maxR + 18;
        const lp = pt(labelR, ax.angle);
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={8} fontFamily="Courier New, monospace" fill={ax.color} letterSpacing={1}>
            {ax.label}
          </text>
        );
      })}
      {/* center glyph */}
      <circle cx={cx} cy={cy} r={geo.attuned ? 18 : 6}
        fill={geo.attuned ? `${color}30` : 'transparent'}
        stroke={geo.attuned ? color : `${color}40`}
        strokeWidth={geo.attuned ? 1.5 : 1}
        style={{ transition: 'all 0.6s ease' }}
      />
      {geo.attuned && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize={7} fontFamily="Courier New, monospace" fill={color} letterSpacing={0.5}>
          ATTUNED
        </text>
      )}
    </svg>
  );
}

function AtriumExperience({ color }: { color: string }) {
  const { addExperience, updateCharacter, character } = useGameState();
  const [geo, setGeo] = useState<GeoState>({
    alignment: 0, harmony: 0, dissonance: 0, pattern: [], log: [], totalRes: 0, attuned: false,
  });
  const [rewardGiven, setRewardGiven] = useState(() => !!localStorage.getItem(ATRIUM_COMPLETE_KEY));

  const act = useCallback((action: GeoAction) => {
    setGeo(prev => {
      const next = geoEvaluate(prev, action);
      return next;
    });
  }, []);

  useEffect(() => {
    if (geo.attuned && !rewardGiven) {
      setRewardGiven(true);
      localStorage.setItem(ATRIUM_COMPLETE_KEY, '1');
      addExperience(75);
      const currentStats = character.stats as unknown as Record<string, number>;
      updateCharacter({
        stats: {
          ...currentStats,
          resonance: Math.min(100, (currentStats.resonance ?? 10) + 2),
          perception: Math.min(100, (currentStats.perception ?? 10) + 1),
        } as unknown as typeof character.stats,
      });
    }
  }, [geo.attuned, rewardGiven, addExperience, updateCharacter, character.stats]);

  const actionBtn = (label: string, action: GeoAction, desc: string) => (
    <button onClick={() => act(action)} style={{
      flex: '1 1 0',
      background: `${color}10`, border: `1px solid ${color}35`, color,
      fontFamily: 'monospace', fontSize: 10, padding: '8px 6px', cursor: 'pointer', letterSpacing: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.2s',
    }}>
      <span style={{ fontSize: 11 }}>{label}</span>
      <span style={{ fontSize: 8, color: `${color}60`, letterSpacing: 0.5 }}>{desc}</span>
    </button>
  );

  const statusLine = () => {
    if (geo.attuned) return { text: 'ATTUNEMENT ACHIEVED — The Atrium recognizes your pattern.', c: '#00ffaa' };
    if (geo.dissonance > 1.5) return { text: 'The geometry resists. Consider stillness.', c: '#ff4444' };
    if (geo.harmony > 1.5) return { text: 'The space is opening. Continue with care.', c: '#00ffaa' };
    if (geo.pattern.length === 0) return { text: 'You stand in the Atrium of Stillness. The Academy waits.', c: `${color}70` };
    return { text: 'The Academy observes. Pattern: ' + geo.pattern.slice(-3).join(' → '), c: `${color}80` };
  };

  const status = statusLine();

  return (
    <div>
      <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>
        LIVE: ATRIUM OF STILLNESS — GEOMETRIC INITIATION
      </div>
      <Divider color={color} />
      <p style={{ fontFamily: 'monospace', fontSize: 11, color: `${color}80`, lineHeight: 1.8 }}>
        The Academy is not built. It is <span style={{ color }}>patterned</span>.<br />
        Correct understanding is not a choice — it is a harmonic alignment.<br />
        Choose your actions. Watch the geometry respond.
      </p>
      <Divider color={color} />

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 200px' }}>
          <div style={{ fontSize: 9, color: `${color}50`, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6, textAlign: 'center' }}>
            GEOMETRIC STATE
          </div>
          <GeoRadar geo={geo} color={color} />
          <div style={{ display: 'flex', gap: 4, marginTop: 8, fontFamily: 'monospace', fontSize: 8, color: `${color}50`, justifyContent: 'center' }}>
            <span>ACTIONS: {geo.pattern.length}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>RES: {geo.totalRes.toFixed(1)}</span>
          </div>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ fontSize: 9, color: `${color}50`, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>
            SACRED INTERACTIONS
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {actionBtn('OBSERVE',        'observe', 'Slow perception')}
            {actionBtn('WAIT',           'wait',    'Choose stillness')}
            {actionBtn('ACT WITH INTENT','intent',  'Deliberate force')}
          </div>

          <div style={{ fontSize: 9, color: `${color}50`, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>
            ACADEMY RESPONSE
          </div>
          <div style={{ minHeight: 120, background: `${color}05`, border: `1px solid ${color}20`, padding: '8px 10px', fontFamily: 'monospace' }}>
            {geo.log.length === 0
              ? <div style={{ fontSize: 10, color: `${color}30`, fontStyle: 'italic' }}>Awaiting first action…</div>
              : geo.log.map((msg, i) => (
                <div key={i} style={{ fontSize: 10, color: `${color}${i === 0 ? 'cc' : Math.max(20, 80 - i * 15).toString(16)}`, marginBottom: 4, transition: 'color 0.4s' }}>
                  {i === 0 ? '› ' : '  '}{msg}
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <Divider color={color} />
      <div style={{ background: `${status.c}12`, border: `1px solid ${status.c}35`, padding: '8px 12px', fontFamily: 'monospace', fontSize: 10, color: status.c, letterSpacing: 0.5 }}>
        {status.text}
      </div>

      {geo.attuned && !rewardGiven && (
        <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 10, color: '#00ffaa', padding: '6px 12px', background: '#00ffaa10', border: '1px solid #00ffaa30' }}>
          REWARD: +75 XP · RESONANCE +2 · PERCEPTION +1
        </div>
      )}
      {geo.attuned && rewardGiven && (
        <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 10, color: `${color}50`, padding: '6px 12px', background: `${color}05`, border: `1px solid ${color}20` }}>
          Atrium rite already completed. Rewards recorded.
        </div>
      )}

      <Divider color={color} />
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}40`, lineHeight: 1.8 }}>
        <div>SEQUENCE GUIDE (do not follow mechanically — discover the pattern):</div>
        <div style={{ marginLeft: 8, marginTop: 4, color: `${color}30` }}>
          <div>· Rushing breaks systems.&nbsp;&nbsp;· Stillness is a mechanic.</div>
          <div>· Order matters more than selection.&nbsp;&nbsp;· Non-binary success.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Constellation Viewer ─────────────────────────────────────────────────────

const DISCIPLINES = [
  'Systems Thinking', 'Material Fabrication', 'Ethical Reasoning',
  'Perceptual Geometry', 'Temporal Mechanics', 'Social Architecture',
  'Linguistic Analysis', 'Mathematical Logic', 'Spiritual Practice',
  'Environmental Design', 'Historical Pattern', 'Creative Expression',
];

const ROLES = ['anchor', 'bridge', 'harmonic', 'fracture'] as const;
type Role = typeof ROLES[number];

const ROLE_COLOR: Record<Role, string> = {
  anchor:   '#00ccff',
  bridge:   '#00ffaa',
  harmonic: '#ff66ff',
  fracture: '#ff4444',
};

const ROLE_DESC: Record<Role, string> = {
  anchor:   'Foundational node. Learning here stabilizes the constellation.',
  bridge:   'Connector. Mastery here amplifies adjacent disciplines.',
  harmonic: 'Resonance amplifier. Creates chain reactions across the map.',
  fracture: 'High-variance. Breakthrough or disruption — never neutral.',
};

const BEHAVIORS = [
  'Inertial — slow to move, slow to stop.',
  'Amplifying — doubles adjacent signals.',
  'Dampening — absorbs and diffuses energy.',
  'Reflective — bounces energy back to source.',
  'Catalytic — unlocks dormant connections.',
  'Absorptive — stores energy, releases slowly.',
];

interface ConstellationNode {
  id: number;
  discipline: string;
  role: Role;
  behavior: string;
  x: number;
  y: number;
}

function buildConstellation(name: string): ConstellationNode[] {
  const seed = nameSeed(name);
  const NODE_COUNT = 7;
  const cx = 190, cy = 110, baseR = 75;
  const nodes: ConstellationNode[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * 2 * Math.PI + seededRand(seed, i + 300) * 0.4 - 0.2;
    const radius = baseR + seededRand(seed, i + 400) * 28;
    nodes.push({
      id: i,
      discipline: DISCIPLINES[Math.floor(seededRand(seed, i) * DISCIPLINES.length)],
      role:       ROLES[Math.floor(seededRand(seed, i + 100) * ROLES.length)],
      behavior:   BEHAVIORS[Math.floor(seededRand(seed, i + 200) * BEHAVIORS.length)],
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return nodes;
}

function buildEdges(nodes: ConstellationNode[], seed: number): [number, number][] {
  const edges: [number, number][] = [];
  const N = nodes.length;
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    edges.push([i, next]);
  }
  // add a few cross-edges seeded by name
  for (let k = 0; k < 3; k++) {
    const a = Math.floor(seededRand(seed, k + 700) * N);
    const b = Math.floor(seededRand(seed, k + 800) * N);
    if (a !== b && !edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) {
      edges.push([a, b]);
    }
  }
  return edges;
}

function ConstellationViewer({ color, characterName }: { color: string; characterName: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const seed = nameSeed(characterName);
  const nodes = buildConstellation(characterName);
  const edges = buildEdges(nodes, seed);
  const sel = selected !== null ? nodes[selected] : null;

  return (
    <div>
      <div style={{ fontSize: 9, color: `${color}50`, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>
        PERSONAL LEARNING MAP — SEED: {characterName.toUpperCase() || 'UNKNOWN'} — CLICK NODES TO INSPECT
      </div>
      <div style={{ background: `${color}04`, border: `1px solid ${color}15`, padding: 8 }}>
        <svg width="380" height="220" style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}>
          {/* Background grid dots */}
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 12 }).map((_, col) => (
              <circle key={`${row}-${col}`} cx={col * 32 + 10} cy={row * 28 + 10} r={1} fill={`${color}10`} />
            ))
          )}
          {/* Edges */}
          {edges.map(([a, b], i) => {
            const na = nodes[a], nb = nodes[b];
            const isActive = selected === a || selected === b;
            return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={isActive ? `${color}60` : `${color}20`}
              strokeWidth={isActive ? 1.5 : 1}
              strokeDasharray={isActive ? 'none' : '3 4'}
              style={{ transition: 'all 0.3s' }} />;
          })}
          {/* Nodes */}
          {nodes.map(n => {
            const rc = ROLE_COLOR[n.role];
            const isSelected = selected === n.id;
            const boxW = 84, boxH = 34;
            return (
              <g key={n.id} transform={`translate(${n.x - boxW/2},${n.y - boxH/2})`}
                style={{ cursor: 'pointer' }} onClick={() => setSelected(isSelected ? null : n.id)}>
                <rect width={boxW} height={boxH} rx={2}
                  fill={isSelected ? `${rc}22` : `${rc}0a`}
                  stroke={isSelected ? rc : `${rc}40`}
                  strokeWidth={isSelected ? 1.5 : 1}
                  style={{ transition: 'all 0.3s' }} />
                <text x={boxW/2} y={12} textAnchor="middle" fontSize={7.5}
                  fontFamily="Courier New, monospace" fill={isSelected ? rc : `${rc}80`}
                  style={{ transition: 'fill 0.3s', pointerEvents: 'none' }}>
                  {n.discipline.length > 14 ? n.discipline.slice(0, 13) + '…' : n.discipline}
                </text>
                <text x={boxW/2} y={26} textAnchor="middle" fontSize={6.5}
                  fontFamily="Courier New, monospace" fill={isSelected ? `${rc}cc` : `${rc}50`}
                  style={{ transition: 'fill 0.3s', pointerEvents: 'none' }}>
                  [{n.role.toUpperCase()}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {sel && (
        <div style={{ marginTop: 8, background: `${ROLE_COLOR[sel.role]}0c`, border: `1px solid ${ROLE_COLOR[sel.role]}30`, padding: '10px 14px', fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: ROLE_COLOR[sel.role] }}>{sel.discipline}</div>
            <span style={{ fontSize: 8, background: `${ROLE_COLOR[sel.role]}20`, border: `1px solid ${ROLE_COLOR[sel.role]}40`, color: ROLE_COLOR[sel.role], padding: '2px 7px', letterSpacing: 1 }}>
              {sel.role.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 10, color: `${ROLE_COLOR[sel.role]}80`, marginBottom: 4 }}>{ROLE_DESC[sel.role]}</div>
          <div style={{ fontSize: 9, color: `${color}50`, borderTop: `1px solid ${color}15`, paddingTop: 6, marginTop: 4 }}>
            RESONANCE BEHAVIOR: {sel.behavior}
          </div>
        </div>
      )}
      <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {ROLES.map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'monospace', fontSize: 9, color: `${ROLE_COLOR[r]}80` }}>
            <div style={{ width: 8, height: 8, background: `${ROLE_COLOR[r]}40`, border: `1px solid ${ROLE_COLOR[r]}70` }} />
            {r.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chapter Content ───────────────────────────────────────────────────────────

function ChapterContent({ chapterId, color, character }: {
  chapterId: string;
  color: string;
  character: ReturnType<typeof useGameState>['character'];
}) {
  const stats = character.stats as unknown as Record<string, number>;

  switch (chapterId) {
    case 'welcome':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>ORIENTATION FILE: STUDENT INTAKE — CYCLE 001</div>
          <Divider color={color} />
          <p>Welcome, <span style={{ color }}>{character.name || 'Cadet'}</span>.</p>
          <p style={{ marginTop: 10 }}>This document is your orientation to <span style={{ color }}>The Academy</span> — a living institution that responds to, remembers, and is shaped by your presence within it.</p>
          <p style={{ marginTop: 10 }}>Before you navigate to any application on your desktop, read this file. The systems you interact with are designed to be <span style={{ color }}>felt before they are understood</span>.</p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}60`, fontFamily: 'monospace', lineHeight: 1.8 }}>
            {['> What you will encounter:','  — A school that decays without attention','  — Students who remember what you do','  — Disciplines that cross-contaminate each other','  — Consequences with delayed arrival','  — Rewards that require pattern recognition','','> What this is NOT:','  — A linear quest chain','  — A skill tree to max','  — A game with a win screen',].map((line, i) => <div key={i}>{line || <br />}</div>)}
          </div>
          <Divider color={color} />
          <p>Navigate using the chapter list on the left. <span style={{ color }}>Visit the Atrium Rite chapter next</span> — it is interactive and must be experienced, not read.</p>
          <p style={{ marginTop: 8, color: `${color}60`, fontSize: 11 }}>Current level: <span style={{ color }}>{character.level}</span>. Experience: <span style={{ color }}>{character.experience}</span> XP.</p>
        </div>
      );

    case 'atrium':
      return <AtriumExperience color={color} />;

    case 'resonance':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>CORE PRINCIPLE: RESONANCE</div>
          <Divider color={color} />
          <p>Nothing in The Academy happens in isolation.</p>
          <p style={{ marginTop: 10 }}>Every action you take emits energy along multiple axes. That energy propagates outward through a network of people, places, and systems — arriving at destinations you may never directly observe.</p>
          <p style={{ marginTop: 10 }}>This is not metaphor. It is the architecture of the simulation.</p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}80`, fontFamily: 'monospace' }}>INTERACTIVE — TRACE A SINGLE DECISION:</div>
          <ResonanceDemo color={color} />
          <Divider color={color} />
          <p style={{ fontSize: 11, color: `${color}70` }}>The same cascade applies when you skip class, repair a system, or speak harshly to a mentor. Direction and magnitude vary. The principle does not.</p>
          <p style={{ marginTop: 8, fontSize: 11, color: `${color}70` }}>
            Think less: <em>"What do I gain?"</em><br />
            Think more: <em>"What does this set in motion?"</em>
          </p>
        </div>
      );

    case 'cycle':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>SYSTEM: THE CYCLE</div>
          <Divider color={color} />
          <p>Time in The Academy moves in <span style={{ color }}>Cycles</span>. A Cycle is a meaningful unit of progression — a day, a week, or a phase, depending on context.</p>
          <p style={{ marginTop: 10 }}>During each Cycle, you have limited energy. You cannot do everything. <span style={{ color }}>Choice is the engine.</span></p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}80`, fontFamily: 'monospace', marginBottom: 6 }}>AVAILABLE CYCLE ACTIONS — SELECT TO INSPECT:</div>
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
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>FRAMEWORK: THE THREE PILLARS</div>
          <Divider color={color} />
          <p>All Academy actions are evaluated against three foundational pillars. These are not meters to fill — they are orientations that color every outcome.</p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}80`, fontFamily: 'monospace', marginBottom: 4 }}>YOUR CURRENT PILLAR BALANCE (LIVE):</div>
          <PillarGauge color={color} stats={stats} />
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: `${color}70`, lineHeight: 1.9 }}>
            <div><span style={{ color }}>EXCELLENCE</span> — Quality of mastery. High excellence creates breakthroughs and rare opportunities.</div>
            <div style={{ marginTop: 8 }}><span style={{ color: '#00ffaa' }}>EFFICACY</span> — Practical impact. Efficient systems reduce decay.</div>
            <div style={{ marginTop: 8 }}><span style={{ color: '#ff66ff' }}>PERCEPTION</span> — Reputation and narrative. The same action can be heroic or ominous depending on context.</div>
          </div>
          <Divider color={color} />
          <p style={{ fontSize: 11, color: `${color}60` }}>Balancing all three is more important than maximizing one.</p>
        </div>
      );

    case 'disciplines': {
      const cats = [
        { label: 'PHYSICAL',  color: '#ff4444', keys: ['quickness', 'endurance', 'agility', 'speed', 'strength'] },
        { label: 'MENTAL',    color: color,     keys: ['mathLogic', 'linguistic', 'presence', 'fortitude', 'musicCreative'] },
        { label: 'SPIRITUAL', color: '#aa44ff', keys: ['faith', 'karma', 'resonance', 'luck', 'chi', 'nagual', 'ashe'] },
      ];
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>DATA: DISCIPLINES & STATS</div>
          <Divider color={color} />
          <p>The Academy tracks 17 active disciplines across three domains. They interact, amplify, and sometimes oppose each other.</p>
          <p style={{ marginTop: 8 }}>Cross-training creates emergent abilities not available through single-track study.</p>
          <Divider color={color} />
          <div style={{ fontSize: 10, color: `${color}80`, fontFamily: 'monospace', marginBottom: 8 }}>
            YOUR CURRENT DISCIPLINES (LIVE — {character.name || 'your profile'}):
          </div>
          {cats.map(cat => (
            <div key={cat.label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: cat.color, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 }}>— {cat.label} —</div>
              {cat.keys.map(k => {
                const def = ALL_STATS.find(s => s.id === k);
                return <StatBar key={k} label={def?.name ?? k} value={stats[k] ?? 10} color={cat.color} />;
              })}
            </div>
          ))}
          <Divider color={color} />
          <p style={{ fontSize: 11, color: `${color}60` }}>Stats grow through study, GED curriculum completion, and hidden resonance chains. Not all growth is explicit.</p>
        </div>
      );
    }

    case 'constellation':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>MAP: YOUR CURRICULA CONSTELLATION</div>
          <Divider color={color} />
          <p>No two students share the same learning map. Your constellation is derived from your identity within The Academy — a geometric signature of your potential learning trajectory.</p>
          <p style={{ marginTop: 8 }}>Each node is a <span style={{ color }}>Discipline Expression</span> with a geometric role that determines how mastery propagates through your personal field.</p>
          <Divider color={color} />
          <ConstellationViewer color={color} characterName={character.name || 'Cadet'} />
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}50`, lineHeight: 1.8 }}>
            <div>READING YOUR MAP:</div>
            <div style={{ marginLeft: 8, marginTop: 4 }}>
              <div>· <span style={{ color: ROLE_COLOR.anchor }}>Anchors</span> stabilize — prioritize these early for structural confidence.</div>
              <div>· <span style={{ color: ROLE_COLOR.bridge }}>Bridges</span> multiply — mastering one unlocks adjacent disciplines faster.</div>
              <div>· <span style={{ color: ROLE_COLOR.harmonic }}>Harmonics</span> cascade — high-reward nodes that trigger chain reactions.</div>
              <div>· <span style={{ color: ROLE_COLOR.fracture }}>Fractures</span> disrupt — breakthrough or failure, always transformative.</div>
            </div>
          </div>
        </div>
      );

    case 'living':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>WORLD: THE LIVING ACADEMY</div>
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
              { name: 'ARCHIVIST ILYRA',       role: 'Notices intellectual patterns. Values rigor.' },
              { name: 'GROUNDSKEEPER TOMAS',    role: 'Values maintenance and continuity. Watches quietly.' },
              { name: 'RESONANCE ADEPT SABLE',  role: 'Sensitive to behavioral rhythm. Hard to read.' },
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
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>DEPTH: HIDDEN SYSTEMS</div>
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
            <p>Some systems will not reveal themselves until you have demonstrated you are ready to see them.</p>
            <p style={{ marginTop: 8 }}>If something feels intentional, it probably is.</p>
          </div>
          <Divider color={color} />
          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, padding: '12px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1, marginBottom: 4 }}>NOTE FROM THE ARCHIVIST</div>
            <div style={{ fontSize: 11, color: `${color}80` }}>"The Academy has been here longer than most of its current students realize. What you call 'hidden systems' — we call unread chapters. Read more carefully."</div>
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
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>EXECUTE: BEGIN YOUR FIRST CYCLE</div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: `${color}90`, lineHeight: 1.9 }}>
            <div>STUDENT:   <span style={{ color }}>{character.name || 'UNREGISTERED'}</span></div>
            <div>LEVEL:     <span style={{ color }}>{character.level}</span></div>
            <div>XP:        <span style={{ color }}>{character.experience}</span> / {character.experienceToNextLevel}</div>
            <div>PERKS:     <span style={{ color }}>{character.unlockedPerks?.length ?? 0}</span> active</div>
            <div>ATRIUM:    <span style={{ color: localStorage.getItem(ATRIUM_COMPLETE_KEY) ? '#00ffaa' : `${color}40` }}>{localStorage.getItem(ATRIUM_COMPLETE_KEY) ? 'ATTUNED' : 'PENDING'}</span></div>
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
            <div style={{ fontSize: 11, color: `${color}80`, lineHeight: 1.8 }}>Move deliberately. Observe consequences. Trust resonance.</div>
            <div style={{ fontSize: 11, color, marginTop: 6 }}>The Academy is watching — but it is also learning from you.</div>
            <div style={{ fontSize: 11, color: `${color}70`, marginTop: 6 }}>Welcome.</div>
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

    case 'terminal':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>CMD: THE COMMAND TERMINAL</div>
          <Divider color={color} />
          <p>Open the terminal by double-clicking <span style={{ color }}>THE ACADEMY</span> on your desktop. Type at the <span style={{ color }}>&gt;</span> prompt and press <span style={{ color }}>ENTER</span>. Commands are not case-sensitive — you can type in lowercase, uppercase, or mixed.</p>
          <p style={{ marginTop: 8 }}>A <span style={{ color }}>Quick Command Bar</span> appears above the input. It shows clickable buttons for exits, nearby objects, and utility actions — updated automatically every time you move or look around.</p>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>MOVEMENT:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.85, marginBottom: 12 }}>
            <div>After each <span style={{ color }}>LOOK</span>, the terminal prints <span style={{ color }}>Exits: NORTH, SOUTH...</span> — those are your available directions.</div>
            <div style={{ marginTop: 6 }}>Type the direction name <em>or</em> its abbreviation to move:</div>
            {[
              ['NORTH / N',          'SOUTH / S',   'EAST / E',    'WEST / W'],
              ['NORTHEAST / NE',     'NORTHWEST / NW', 'SOUTHEAST / SE', 'SOUTHWEST / SW'],
              ['UP / U',             'DOWN / DN',   'ENTER [place]',''],
            ].map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                {row.filter(Boolean).map(d => (
                  <span key={d} style={{ color }}>{d}</span>
                ))}
              </div>
            ))}
            <div style={{ marginTop: 6, color: `${color}50` }}>You can also click the cyan direction buttons in the Quick Command Bar.</div>
          </div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>OBSERVATION:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.85, marginBottom: 12 }}>
            {[
              ['LOOK  (L)',           'Describe your current room, NPCs, exits, and examinables'],
              ['EXAMINE [object]',    'Inspect something closely: EXAMINE FOUNTAIN · X STATUE · EX DESK'],
              ['LIST / WHO / PEOPLE', 'List all NPCs currently present in this location'],
              ['TIME',               'Show current in-game time of day'],
            ].map(([cmd, desc]) => (
              <div key={cmd} style={{ marginBottom: 4 }}>
                <span style={{ color, display: 'inline-block', minWidth: 200 }}>&gt; {cmd}</span>
                <span style={{ color: `${color}50` }}>{desc}</span>
              </div>
            ))}
            <div style={{ marginTop: 4, color: `${color}45` }}>Tip: After LOOK, the terminal lists <em>You can examine: ITEM, ITEM...</em> — click the amber X: buttons to examine without typing.</div>
          </div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>TALKING TO NPCs:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.85, marginBottom: 12 }}>
            {[
              ['TALK [name]',          'Start a conversation: TALK NIARDIR · TALK ARCHIVIST'],
              ['TALK [name] [topic]',  'Ask about a topic: TALK NIARDIR STUDIES · TALK ZARA COMMUNITY'],
              ['LIST',                 'See who is here before you start talking'],
            ].map(([cmd, desc]) => (
              <div key={cmd} style={{ marginBottom: 4 }}>
                <span style={{ color, display: 'inline-block', minWidth: 200 }}>&gt; {cmd}</span>
                <span style={{ color: `${color}50` }}>{desc}</span>
              </div>
            ))}
            <div style={{ marginTop: 6, background: `${color}08`, border: `1px solid ${color}18`, padding: '8px 12px' }}>
              <div style={{ color: `${color}50`, fontSize: 9, marginBottom: 4 }}>EXAMPLE SESSION:</div>
              <div style={{ color }}>{'> look'}</div>
              <div style={{ color: `${color}70` }}>{'CENTRAL PLAZA'}</div>
              <div style={{ color: `${color}70` }}>{'You see: - Niardir Isardian (Staff)'}</div>
              <div style={{ color: `${color}70` }}>{'Exits: NORTH, SOUTH, EAST, ENTER'}</div>
              <div style={{ color: `${color}70` }}>{'You can examine: FOUNTAIN, NOTICE_BOARD'}</div>
              <div style={{ color, marginTop: 4 }}>{'> talk niardir'}</div>
              <div style={{ color: `${color}70` }}>{'Niardir Isardian: "You could ask me about: INTRODUCTION, STUDIES, COMMUNITY"'}</div>
              <div style={{ color, marginTop: 4 }}>{'> talk niardir studies'}</div>
              <div style={{ color: `${color}70` }}>{'Niardir begins explaining the academic track...'}</div>
            </div>
          </div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>CHARACTER & ACADEMIC COMMANDS:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.85, marginBottom: 12 }}>
            {[
              ['STATUS / STAT',        'View your full character stats and energy'],
              ['INVENTORY / I',        'Check what items you are carrying'],
              ['GRADES',               'View your current course grades and GPA'],
              ['PROGRESS',             'View GED readiness per subject domain'],
              ['GRADUATION',           'Check eligibility and begin the graduation ceremony'],
              ['ENROLL [course]',      'Enroll in a course, or list available courses (no argument)'],
              ['ATTEND [course]',      'Mark attendance for a class this cycle'],
              ['NOTES',                'List your research notebook entries'],
              ['NOTE NEW [title]',     'Create a new notebook entry'],
              ['STUDY',                'Get a study recommendation from the system'],
            ].map(([cmd, desc]) => (
              <div key={cmd} style={{ marginBottom: 4 }}>
                <span style={{ color, display: 'inline-block', minWidth: 200 }}>&gt; {cmd}</span>
                <span style={{ color: `${color}50` }}>{desc}</span>
              </div>
            ))}
          </div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>SYSTEM COMMANDS:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.85, marginBottom: 14 }}>
            {[
              ['HELP',                 'Show all available commands'],
              ['HELP MOVEMENT',        'Context-specific help: also HELP EXAMINE, HELP TALK'],
              ['SAVE',                 'Save your game progress'],
              ['CLEAR',                'Clear the terminal output'],
              ['TUTORIAL',             'Open this orientation document from within the terminal'],
              ['QUIT / EXIT',          'Return to the desktop'],
            ].map(([cmd, desc]) => (
              <div key={cmd} style={{ marginBottom: 4 }}>
                <span style={{ color, display: 'inline-block', minWidth: 200 }}>&gt; {cmd}</span>
                <span style={{ color: `${color}50` }}>{desc}</span>
              </div>
            ))}
          </div>
          <Divider color={color} />

          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, padding: '12px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1, marginBottom: 6 }}>KEYBOARD SHORTCUTS & TIPS</div>
            <div style={{ fontSize: 10, color: `${color}70`, lineHeight: 1.8 }}>
              <div>· <span style={{ color }}>↑ / ↓ arrow keys</span> — scroll through your previous commands</div>
              <div>· <span style={{ color }}>Ctrl + K</span> — open the Command Palette for structured browsing</div>
              <div>· The game supports <span style={{ color }}>natural language</span> for most actions (e.g. "What mysteries are here?") — but explicit commands are more reliable</div>
              <div>· If something doesn't work, type <span style={{ color }}>HELP</span> to see what's valid in this location</div>
              <div>· NPC names appearing in the terminal can be used directly: <span style={{ color }}>TALK NIARDIR</span> (not "talk to Niardir Isardian")</div>
            </div>
          </div>
        </div>
      );

    case 'assignments-guide':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>STUDY: ASSIGNMENTS & GED CURRICULUM</div>
          <Divider color={color} />
          <p>The <span style={{ color }}>ASSIGNMENTS</span> desktop app is your primary academic workspace. It houses the full GED curriculum aligned to Kaplan 2022–2023 across four subjects.</p>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>HOW TO OPEN A LESSON:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 2, marginBottom: 14 }}>
            {[
              '1. Double-click ASSIGNMENTS on the desktop',
              '2. Select a GED subject: RLA · Math · Social Studies · Science',
              '3. Choose a chapter from the subject index',
              '4. Pick a lesson — the lesson card shows difficulty and GED code',
              '5. Read the lesson content and review key terms',
              '6. Click START QUIZ when ready — do not skip the reading',
            ].map((step, i) => (
              <div key={i} style={{ color: i === 5 ? color : `${color}60` }}>{step}</div>
            ))}
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>HOW QUIZZES WORK:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.9, marginBottom: 14 }}>
            <div>· Each quiz has multiple-choice questions (4 options: A B C D).</div>
            <div>· Select an answer and press <span style={{ color }}>CHECK ANSWER</span> to see if you were right.</div>
            <div>· Correct answers show in green. Wrong answers show in red.</div>
            <div>· After all questions, the quiz calculates your <span style={{ color }}>score percentage</span>.</div>
            <div>· Scores of 70%+ grant full XP. Partial scores grant partial XP.</div>
            <div>· You can retake quizzes — each attempt is recorded separately.</div>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>WHAT YOU EARN FROM ASSIGNMENTS:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.9, marginBottom: 14 }}>
            {[
              { label: 'XP',            col: '#00ff00', desc: 'Progress your character level' },
              { label: 'Stat bonuses',  col: '#00ffaa', desc: 'Math boosts mathLogic; RLA boosts linguistic' },
              { label: 'GED readiness',col: '#ffaa00', desc: 'Tracked in PROGRESS dashboard per domain' },
              { label: 'Skill nodes',  col: '#aa44ff', desc: 'Unlocks branches on your constellation map' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
                <span style={{ color: item.col, minWidth: 130, fontFamily: 'monospace' }}>{item.label}</span>
                <span style={{ color: `${color}60` }}>{item.desc}</span>
              </div>
            ))}
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>TRACKING YOUR PROGRESS:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.9 }}>
            <div>· Open the <span style={{ color }}>PROGRESS</span> app to see per-domain GED readiness.</div>
            <div>· The <span style={{ color }}>INSTITUTION</span> app shows class-wide metrics and fragile domains.</div>
            <div>· Completing 3+ stable skills per domain makes you GED-eligible.</div>
            <div>· When all four domains reach readiness, the GRADUATION CEREMONY unlocks.</div>
          </div>
          <Divider color={color} />
          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, padding: '12px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1, marginBottom: 6 }}>MENTOR NOTE</div>
            <div style={{ fontSize: 11, color: `${color}80` }}>"Reading the lesson first is not optional. The quiz is designed to reinforce what you just read — not to test guessing. If you skip the lesson, you will fail the quiz and miss the comprehension."</div>
            <div style={{ fontSize: 9, color: `${color}40`, marginTop: 6 }}>— Prof. Chen, Mathematics</div>
          </div>
        </div>
      );

    case 'npc-guide':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>SOCIAL: THE NPC INTERFACE</div>
          <Divider color={color} />
          <p>The Academy's NPCs are <span style={{ color }}>autonomous agents</span>. They have schedules, memories, affiliations, and they react to your behavior over time.</p>
          <p style={{ marginTop: 8 }}>There are three ways to engage with them: the <span style={{ color }}>command terminal</span>, the <span style={{ color }}>ChatLink</span> messaging app, and <span style={{ color }}>Academy Email</span>.</p>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>METHOD 1 — COMMAND TERMINAL (live interactions):</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.9, marginBottom: 14 }}>
            <div>When an NPC is present in your current location:</div>
            <div style={{ marginLeft: 12, marginTop: 4 }}>
              <div><span style={{ color }}>&gt; talk [name]</span>  — Opens dialogue. Choose responses carefully.</div>
              <div><span style={{ color }}>&gt; ask [name] about [topic]</span>  — Targeted questions; may unlock hints.</div>
              <div><span style={{ color }}>&gt; observe [name]</span>  — Watch without speaking; earns Perception.</div>
            </div>
            <div style={{ marginTop: 8, color: `${color}40` }}>Tip: Dialogue choices affect NPC affinity and Resonance simultaneously.</div>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>METHOD 2 — CHATLINK (asynchronous messaging):</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.9, marginBottom: 14 }}>
            <div>· Open <span style={{ color }}>CHATLINK</span> from the taskbar or desktop.</div>
            <div>· The NPC Directory lists all available contacts with their affinity level.</div>
            <div>· Click an NPC to open a chat thread — send freeform messages.</div>
            <div>· Responses are generated based on NPC personality and your relationship history.</div>
            <div>· <span style={{ color }}>Affinity Gates</span> determine what topics an NPC will discuss.</div>
            <div style={{ marginLeft: 12, color: `${color}40` }}>Low affinity: surface topics only</div>
            <div style={{ marginLeft: 12, color: `${color}40` }}>Medium affinity: academic support + personal history</div>
            <div style={{ marginLeft: 12, color: `${color}40` }}>High affinity: hidden curriculum, faction info, deep lore</div>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>METHOD 3 — ACADEMY EMAIL (formal correspondence):</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.9, marginBottom: 14 }}>
            <div>· Open <span style={{ color }}>ACADEMY EMAIL</span> from the desktop.</div>
            <div>· Compose messages to staff, faculty, or fellow students.</div>
            <div>· Email is slower than chat — NPC replies arrive on a delay (simulating async).</div>
            <div>· Some NPCs <span style={{ color }}>only respond to formal email</span> — they ignore chat.</div>
            <div>· Email exchanges can unlock assignment extensions, special quests, and referrals.</div>
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>KEY ACADEMY CONTACTS:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1, marginBottom: 14 }}>
            {[
              { name: 'PROF. CHEN',           subject: 'Math',           trait: 'Values precision. Responds to logic.' },
              { name: 'MS. RIVERA',           subject: 'Language Arts',  trait: 'Values voice. Responds to written effort.' },
              { name: 'DR. OKAFOR',           subject: 'Social Studies', trait: 'Values evidence. Skeptical of shortcuts.' },
              { name: 'INSTRUCTOR VASQUEZ',   subject: 'Science',        trait: 'Values curiosity. Rewards questions.' },
              { name: 'ARCHIVIST ILYRA',      subject: 'Lore / Library', trait: 'Notices patterns. Speaks in implication.' },
              { name: 'GROUNDSKEEPER TOMAS',  subject: 'Facilities',     trait: 'Watches. Rarely speaks first.' },
            ].map(npc => (
              <div key={npc.name} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${color}10` }}>
                <div style={{ width: 5, background: `${color}25`, flexShrink: 0, alignSelf: 'stretch' }} />
                <div>
                  <div style={{ color, fontSize: 10 }}>{npc.name} <span style={{ color: `${color}40`, fontSize: 9 }}>· {npc.subject}</span></div>
                  <div style={{ color: `${color}55`, fontSize: 10, marginTop: 2 }}>{npc.trait}</div>
                </div>
              </div>
            ))}
          </div>
          <Divider color={color} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.8 }}>
            <div><span style={{ color }}>AFFINITY</span> rises through: consistent interaction, correct answers, respectful tone, attending relevant classes.</div>
            <div style={{ marginTop: 4 }}><span style={{ color }}>AFFINITY</span> falls through: ignoring scheduled events, rude dialogue choices, repeated academic failure.</div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export function TutorialApp() {
  const { character } = useGameState();
  const { colors } = useCrtTheme();
  const color = colors.primary;
  const [chapter, setChapter] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const [readSet, setReadSet] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(TUTORIAL_PROGRESS_KEY);
      return raw ? new Set(JSON.parse(raw) as number[]) : new Set<number>();
    } catch { return new Set<number>(); }
  });

  useEffect(() => {
    setReadSet(prev => {
      const next = new Set(prev);
      next.add(chapter);
      localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chapter]);

  const mono: React.CSSProperties = { fontFamily: 'Courier New, monospace' };

  return (
    <div style={{ display: 'flex', height: '100%', background: '#000', color: `${color}cc`, ...mono, fontSize: 12, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 172, flexShrink: 0, borderRight: `1px solid ${color}20`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${color}15` }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: `${color}50` }}>ORIENTATION</div>
          <div style={{ fontSize: 10, color, marginTop: 2 }}>SYSTEM v1.0</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {CHAPTERS.map((ch, i) => {
            const isRead = readSet.has(i);
            const isActive = chapter === i;
            return (
              <button key={ch.id} onClick={() => setChapter(i)} style={{
                width: '100%', textAlign: 'left', background: isActive ? `${color}12` : 'transparent',
                border: 'none', borderLeft: `2px solid ${isActive ? color : 'transparent'}`,
                color: isActive ? color : isRead ? `${color}70` : `${color}45`,
                fontFamily: 'Courier New, monospace', fontSize: 10, padding: '7px 12px',
                cursor: 'pointer', letterSpacing: 0.5, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{ch.title}</span>
                <span style={{ fontSize: 7, letterSpacing: 1, opacity: 0.6 }}>
                  {isRead ? ch.tag : '···'}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${color}15`, fontSize: 9, color: `${color}30`, letterSpacing: 0.5 }}>
          {readSet.size}/{CHAPTERS.length} READ
          {localStorage.getItem(ATRIUM_COMPLETE_KEY) && (
            <div style={{ color: '#00ffaa', marginTop: 2 }}>ATTUNED</div>
          )}
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', lineHeight: 1.75 }}>
        <div style={{ maxWidth: 580 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <div style={{ fontSize: 9, color: `${color}40`, letterSpacing: 1 }}>
              CH.{String(chapter + 1).padStart(2, '0')}
            </div>
            <Tag text={CHAPTERS[chapter].tag} color={color} />
          </div>
          <ChapterContent chapterId={CHAPTERS[chapter].id} color={color} character={character} />
          <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {chapter > 0 && (
              <button onClick={() => setChapter(c => c - 1)} style={{ background: 'transparent', border: `1px solid ${color}30`, color: `${color}60`, fontFamily: 'Courier New, monospace', fontSize: 10, padding: '5px 14px', cursor: 'pointer', letterSpacing: 1 }}>
                ← PREV
              </button>
            )}
            {chapter < CHAPTERS.length - 1 && (
              <button onClick={() => setChapter(c => c + 1)} style={{ background: `${color}10`, border: `1px solid ${color}50`, color, fontFamily: 'Courier New, monospace', fontSize: 10, padding: '5px 14px', cursor: 'pointer', letterSpacing: 1 }}>
                NEXT →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

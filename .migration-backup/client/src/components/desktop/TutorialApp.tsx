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
  { id: 'welcome',           title: 'Welcome',             tag: 'INIT'   },
  { id: 'terminal',          title: 'Command Terminal',    tag: 'CMD'    },
  { id: 'explore',           title: 'Exploring the Academy', tag: 'NAV'  },
  { id: 'assignments-guide', title: 'Assignments & GED',  tag: 'STUDY'  },
  { id: 'npc-guide',         title: 'NPC Interface',       tag: 'SOCIAL' },
  { id: 'atrium',            title: 'Atrium Rite',         tag: 'LIVE'   },
  { id: 'resonance',         title: 'Resonance',           tag: 'CORE'   },
  { id: 'cycle',             title: 'The Cycle',           tag: 'SYS'    },
  { id: 'pillars',           title: 'Three Pillars',       tag: 'CORE'   },
  { id: 'disciplines',       title: 'Disciplines',         tag: 'DATA'   },
  { id: 'constellation',     title: 'Your Constellation',  tag: 'MAP'    },
  { id: 'living',            title: 'Living Academy',      tag: 'WORLD'  },
  { id: 'hidden',            title: 'Hidden Systems',      tag: 'DEPTH'  },
  { id: 'begin',             title: 'Begin',               tag: 'EXEC'   },
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

// ─── Terminal Mockup ──────────────────────────────────────────────────────────

interface TerminalLine { type: 'cmd' | 'out' | 'sep'; text: string; }

function TerminalMockup({ lines, color }: { lines: TerminalLine[]; color: string }) {
  return (
    <div style={{ background: '#040a04', border: `1px solid ${color}30`, padding: '12px 14px', fontFamily: 'Courier New, monospace', fontSize: 10, lineHeight: 1.9, marginBottom: 14 }}>
      {lines.map((l, i) => {
        if (l.type === 'sep') return <div key={i} style={{ borderTop: `1px solid ${color}10`, margin: '6px 0' }} />;
        return (
          <div key={i} style={{ color: l.type === 'cmd' ? color : `${color}70`, paddingLeft: l.type === 'cmd' ? 0 : 12 }}>
            {l.type === 'cmd' && <span style={{ color: `${color}40`, marginRight: 6 }}>&gt;</span>}
            {l.text}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step List ────────────────────────────────────────────────────────────────

function StepList({ steps, color }: { steps: { num: string; title: string; detail: string }[]; color: string }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
      {steps.map(s => (
        <div key={s.num} style={{ border: `1px solid ${color}${open === s.num ? '50' : '18'}`, background: open === s.num ? `${color}08` : 'transparent', transition: 'all 0.2s' }}>
          <button
            onClick={() => setOpen(open === s.num ? null : s.num)}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: open === s.num ? color : `${color}70`, fontFamily: 'Courier New, monospace', fontSize: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
          >
            <span style={{ color: `${color}40`, minWidth: 24, fontWeight: 'bold' }}>{s.num}.</span>
            <span style={{ letterSpacing: 0.5 }}>{s.title}</span>
            <span style={{ marginLeft: 'auto', opacity: 0.5 }}>{open === s.num ? '▲' : '▼'}</span>
          </button>
          {open === s.num && (
            <div style={{ padding: '0 12px 10px 46px', fontFamily: 'Courier New, monospace', fontSize: 10, color: `${color}65`, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {s.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Command Quick-Ref ────────────────────────────────────────────────────────

function CmdRef({ cmds, color }: { cmds: [string, string][]; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
      {cmds.map(([cmd, desc]) => (
        <div key={cmd} style={{ display: 'flex', alignItems: 'baseline', gap: 0, fontFamily: 'Courier New, monospace', fontSize: 10 }}>
          <span style={{ color, minWidth: 210, flexShrink: 0 }}>&gt; {cmd}</span>
          <span style={{ color: `${color}50` }}>{desc}</span>
        </div>
      ))}
    </div>
  );
}

// ─── NPC Affinity Ladder ──────────────────────────────────────────────────────

function AffinityLadder({ color }: { color: string }) {
  const [level, setLevel] = useState(0);
  const rungs = [
    { label: 'STRANGER',   range: '0–19',   unlock: 'Name and role only. Will not engage deeply.',                            c: `${color}30` },
    { label: 'ACQUAINTED', range: '20–39',  unlock: 'Surface topics. General Academy information.',                           c: `${color}55` },
    { label: 'FAMILIAR',   range: '40–59',  unlock: 'Academic assistance. Personal history. Study tips.',                     c: `${color}80` },
    { label: 'TRUSTED',    range: '60–79',  unlock: 'Hidden curriculum. Faction affiliations. Quest triggers.',               c: color        },
    { label: 'BONDED',     range: '80–100', unlock: 'Deep lore. Rare items. Emergency assistance. Narrative secrets.',        c: '#00ffaa'    },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
        {rungs.map((r, i) => (
          <button key={r.label} onClick={() => setLevel(i)} style={{
            flex: 1, background: level === i ? `${r.c}20` : 'transparent',
            border: `1px solid ${level === i ? r.c : `${r.c}40`}`,
            color: level === i ? r.c : `${r.c}70`,
            fontFamily: 'Courier New, monospace', fontSize: 8, padding: '5px 2px', cursor: 'pointer',
            letterSpacing: 0.5, transition: 'all 0.2s',
          }}>
            {r.label}
          </button>
        ))}
      </div>
      <div style={{ background: `${rungs[level].c}0a`, border: `1px solid ${rungs[level].c}25`, padding: '10px 14px', fontFamily: 'Courier New, monospace' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: rungs[level].c, fontSize: 11 }}>{rungs[level].label}</span>
          <span style={{ color: `${color}40`, fontSize: 9 }}>AFFINITY {rungs[level].range}</span>
        </div>
        <div style={{ fontSize: 10, color: `${color}70`, lineHeight: 1.7 }}>{rungs[level].unlock}</div>
      </div>
      <div style={{ fontSize: 9, color: `${color}35`, fontFamily: 'Courier New, monospace', marginTop: 6 }}>
        Click each tier to preview what unlocks at that relationship level.
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
          <p>The text adventure terminal is your primary interface with The Academy world. Open it by <span style={{ color }}>double-clicking THE ACADEMY</span> on your desktop, or clicking it in the taskbar.</p>
          <p style={{ marginTop: 8 }}>Type at the <span style={{ color }}>&gt;</span> prompt and press <span style={{ color }}>ENTER</span>. Commands are not case-sensitive. The <span style={{ color }}>Quick Command Bar</span> above the input shows clickable shortcut buttons for exits, nearby objects, and common actions — these update automatically each time your location changes.</p>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>YOUR FIRST THREE COMMANDS (do these now):</div>
          <StepList color={color} steps={[
            { num: '1', title: 'LOOK — See where you are', detail: 'Type: look\n\nThis prints a full description of your current room: what it looks like, which NPCs are present, what items can be examined, and which exits lead out. Do this every time you arrive somewhere new.' },
            { num: '2', title: 'STATUS — Check your character', detail: 'Type: status  (or just: stat)\n\nDisplays your 17 stats, current energy, level, and XP. Your energy pool resets each cycle. Heavy actions (STUDY, TRAIN) cost more energy than light ones (EXAMINE, OBSERVE).' },
            { num: '3', title: 'HELP — See all commands', detail: 'Type: help\n\nPrints a full list of commands available in your current context. Some commands only appear when you are in specific locations or have met certain conditions.' },
          ]} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>MOVEMENT:</div>
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, marginBottom: 8 }}>After LOOK, the output shows <span style={{ color }}>Exits: NORTH, EAST...</span> — type the direction or abbreviation to move. You can also click the cyan buttons in the Quick Command Bar.</p>
          <TerminalMockup color={color} lines={[
            { type: 'cmd', text: 'look' },
            { type: 'out', text: 'CENTRAL PLAZA — The heart of the Academy grounds.' },
            { type: 'out', text: 'Exits: NORTH (Library), SOUTH (Dormitories), EAST (Science Wing), ENTER (Admin Block)' },
            { type: 'out', text: 'You can examine: FOUNTAIN, NOTICE_BOARD, MEMORIAL_PLAQUE' },
            { type: 'sep', text: '' },
            { type: 'cmd', text: 'north' },
            { type: 'out', text: 'You walk north toward the Library.' },
            { type: 'out', text: 'LIBRARY ENTRANCE — Tall shelves line every wall...' },
            { type: 'out', text: 'Exits: SOUTH (Plaza), ENTER (Reading Room), UP (Archive Level)' },
          ]} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {[['N / NORTH','S / SOUTH'],['E / EAST','W / WEST'],['NE / NW / SE / SW','diagonals'],['U / UP','DN / DOWN'],['ENTER [place]','enter named location']].map(([a,b]) => (
              <div key={a} style={{ background: `${color}08`, border: `1px solid ${color}18`, padding: '4px 10px', fontFamily: 'Courier New, monospace', fontSize: 9, color: `${color}70` }}>
                <span style={{ color }}>{a}</span> — {b}
              </div>
            ))}
          </div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>OBSERVATION COMMANDS:</div>
          <CmdRef color={color} cmds={[
            ['LOOK  (L)',           'Full room description — NPCs, exits, examinable objects'],
            ['EXAMINE [thing]',     'Inspect an object: EXAMINE FOUNTAIN  or  X FOUNTAIN  or  EX DESK'],
            ['LIST / WHO / PEOPLE', 'List every NPC currently present in this room'],
            ['OBSERVE [name]',      'Watch an NPC without speaking — earns Perception slowly'],
            ['TIME',                'Show current in-game time of day'],
            ['MAP',                 'Print a text map of nearby connected locations'],
          ]} />
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: `${color}40`, marginBottom: 14 }}>After LOOK, amber "X: ITEM" buttons appear in the Quick Command Bar — click them to examine without typing.</div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>TALKING TO NPCs:</div>
          <CmdRef color={color} cmds={[
            ['TALK [name]',         'Start a dialogue: TALK CHEN · TALK ARCHIVIST · TALK RIVERA'],
            ['TALK [name] [topic]', 'Ask about a specific topic: TALK CHEN MATH · TALK ILYRA LORE'],
            ['ASK [name] ABOUT [topic]', 'Alternative to TALK — same effect, more natural phrasing'],
            ['LIST',               'See who is in the room before starting a conversation'],
          ]} />
          <TerminalMockup color={color} lines={[
            { type: 'cmd', text: 'list' },
            { type: 'out', text: 'Present: Prof. Chen (Faculty), Zara Mehta (Student), Groundskeeper Tomas (Staff)' },
            { type: 'sep', text: '' },
            { type: 'cmd', text: 'talk chen' },
            { type: 'out', text: 'Prof. Chen: "Good to see you. You could ask me about: GRADES, MATH, ASSIGNMENTS, TUTORING."' },
            { type: 'sep', text: '' },
            { type: 'cmd', text: 'talk chen math' },
            { type: 'out', text: 'Prof. Chen: "Mathematical logic is the backbone of the GED exam. Start with number operations — the test is deceptively conceptual."' },
            { type: 'out', text: '[Affinity +1 · mathLogic resonance noted]' },
          ]} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>CHARACTER & ACADEMIC COMMANDS:</div>
          <CmdRef color={color} cmds={[
            ['STATUS / STAT',      'Full stat sheet and energy bar'],
            ['INVENTORY / I',      'Items you are carrying'],
            ['GRADES',             'GPA, course grades, and assignment history'],
            ['PROGRESS',           'GED readiness per domain (RLA, Math, Social Studies, Science)'],
            ['STUDY',              'AI-generated study recommendation based on your weakest domain'],
            ['ENROLL [course]',    'Enroll in a course. No argument = list all available courses'],
            ['ATTEND [course]',    'Mark attendance for a class this cycle (costs energy)'],
            ['GRADUATION',         'Check GED eligibility and begin the graduation sequence'],
            ['NOTES',              'List all research notebook entries'],
            ['NOTE NEW [title]',   'Create a new notebook entry by title'],
          ]} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>SYSTEM COMMANDS:</div>
          <CmdRef color={color} cmds={[
            ['HELP',               'All commands — context-sensitive (changes by location)'],
            ['HELP [topic]',       'Focused help: HELP MOVEMENT  · HELP EXAMINE  · HELP TALK'],
            ['SAVE',               'Save your progress to the session store'],
            ['CLEAR',              'Clear terminal output'],
            ['TUTORIAL',           'Open this orientation document'],
            ['QUIT / EXIT',        'Return to the desktop OS without losing progress'],
          ]} />
          <Divider color={color} />

          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, padding: '12px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1, marginBottom: 8 }}>KEYBOARD SHORTCUTS & TIPS</div>
            <div style={{ fontSize: 10, color: `${color}70`, lineHeight: 1.9 }}>
              <div>· <span style={{ color }}>↑ / ↓ arrow keys</span> — cycle through your previous commands (command history)</div>
              <div>· <span style={{ color }}>Ctrl + K</span> — open the Command Palette for structured command browsing</div>
              <div>· The terminal understands <span style={{ color }}>natural language</span> for most actions — e.g. "What's in the library?" or "I want to study math" — but explicit commands are more reliable</div>
              <div>· NPC first names work directly: <span style={{ color }}>TALK CHEN</span>, not "talk to Professor Chen"</div>
              <div>· Type <span style={{ color }}>HELP</span> whenever nothing works — the list changes depending on your location</div>
              <div>· If you see a named object in a room description, you can almost always EXAMINE it</div>
            </div>
          </div>
        </div>
      );

    case 'explore':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>NAV: EXPLORING THE ACADEMY</div>
          <Divider color={color} />
          <p>The Academy is a living world with over <span style={{ color }}>120 named locations</span>. Each location has its own narrative, examinable objects, resident NPCs, and hidden states. Exploring is not optional — many quest triggers, NPC encounters, and academic bonuses only appear when you physically visit a location.</p>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>THE CORE EXPLORATION LOOP:</div>
          <StepList color={color} steps={[
            { num: '1', title: 'LOOK — Read the room carefully', detail: 'Every room description contains information. Read it in full, not just the exit list.\n\nKey things to notice:\n· Named objects (EXAMINE them — almost all reward investigation)\n· NPC names (note their role in parentheses)\n· Atmospheric details that hint at hidden systems\n· "You can examine: ..." near the bottom of the description' },
            { num: '2', title: 'EXAMINE everything listed', detail: 'The terminal shows "You can examine: ITEM1, ITEM2..." after LOOK.\n\nType: examine item1\n  or: x item1\n  or: ex item1\n\nExamining objects:\n· Sometimes gives you clues or lore items\n· Can trigger NPC dialogue when done near them\n· Earns small amounts of Perception\n· Occasionally unlocks SEARCH on that object' },
            { num: '3', title: 'SEARCH — Look deeper (not always available)', detail: 'After examining an object, SEARCH may become available:\n  Type: search [object]\n\nSEARCH goes deeper than EXAMINE. It reveals:\n· Hidden items\n· Secret passages\n· Lore fragments not visible to a casual observer\n· NPC schedules and context clues\n\nSEARCH costs more energy than EXAMINE and is not available everywhere.' },
            { num: '4', title: 'LIST / WHO — Engage with NPCs present', detail: 'Type: list  (or: who, or: people)\n\nThis prints every NPC currently in the room with their role. NPC presence changes by time of day — some faculty are only in their offices during morning hours, some students only appear at night.\n\nOnce you see who is here:\n  talk [name]  — start a general dialogue\n  talk [name] [topic]  — ask about something specific' },
            { num: '5', title: 'Move via exits or ENTER', detail: 'Type a direction: north, south, east, west, up, down (or abbreviations: n, s, e, w, u, dn)\n\nFor named sub-locations inside a larger area, use:\n  enter [place]\n  e.g.: enter reading room · enter lab · enter office\n\nThese ENTER locations appear in exit lists as "ENTER (Reading Room)". They are often where key NPCs and interactive content live.' },
          ]} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>KEY ACADEMY LOCATIONS:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
            {[
              { name: 'CENTRAL PLAZA',      how: 'Starting location',         desc: 'Hub connecting all wings. Notice board has daily updates.' },
              { name: 'LIBRARY',            how: 'north from Plaza',           desc: 'Reading Room inside. Archivist Ilyra can be found here mornings.' },
              { name: 'SCIENCE WING',       how: 'east from Plaza',            desc: 'Labs and lecture halls. Instructor Vasquez office is inside.' },
              { name: 'MATH BLOCK',         how: 'northeast from Plaza',       desc: 'Prof. Chen holds office hours here during afternoons.' },
              { name: 'HUMANITIES HALL',    how: 'west from Plaza',            desc: 'RLA and Social Studies. Ms. Rivera and Dr. Okafor.' },
              { name: 'DORMITORIES',        how: 'south from Plaza',           desc: 'Student rooms. Quiet hours create Resonance bonuses for study.' },
              { name: 'ATRIUM OF STILLNESS','how': 'deep north, requires key', desc: 'Sacred space. Enter after completing the Geometric Initiation rite.' },
              { name: 'ARCHIVE LEVEL',      how: 'up from Library',            desc: 'Rare books, hidden lore. Unlocked at Archivist affinity 40+.' },
            ].map(loc => (
              <div key={loc.name} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: `1px solid ${color}10` }}>
                <div style={{ width: 4, background: `${color}25`, flexShrink: 0, alignSelf: 'stretch' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ color, fontFamily: 'Courier New, monospace', fontSize: 10 }}>{loc.name}</span>
                    <span style={{ color: `${color}35`, fontFamily: 'Courier New, monospace', fontSize: 9 }}>· {loc.how}</span>
                  </div>
                  <div style={{ color: `${color}55`, fontFamily: 'Courier New, monospace', fontSize: 9, marginTop: 1 }}>{loc.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>A COMPLETE EXPLORATION SESSION:</div>
          <TerminalMockup color={color} lines={[
            { type: 'cmd', text: 'look' },
            { type: 'out', text: 'LIBRARY ENTRANCE — Bookshelves rise to the ceiling. Dust motes drift in slanted light.' },
            { type: 'out', text: 'You see: Archivist Ilyra (Staff — Third Archivist)' },
            { type: 'out', text: 'Exits: SOUTH (Plaza), ENTER (Reading Room), UP (Archive Level)' },
            { type: 'out', text: 'You can examine: SHELF_A, CARD_CATALOG, DISPLAY_CASE' },
            { type: 'sep', text: '' },
            { type: 'cmd', text: 'examine card_catalog' },
            { type: 'out', text: 'A worn wooden cabinet with hundreds of index cards. One drawer is partially open.' },
            { type: 'out', text: '[Perception +0.1 — you notice the open drawer]' },
            { type: 'sep', text: '' },
            { type: 'cmd', text: 'search card_catalog' },
            { type: 'out', text: 'You find a handwritten note tucked behind the "R" divider. It references "the reading room ledger."' },
            { type: 'out', text: '[Lore fragment acquired: READING ROOM LEDGER]' },
            { type: 'sep', text: '' },
            { type: 'cmd', text: 'enter reading room' },
            { type: 'out', text: 'You push open a heavy oak door. READING ROOM — Long tables, oil lamps, absolute silence.' },
            { type: 'out', text: 'Exits: OUT (Library Entrance)  |  You can examine: LEDGER, STUDY_TABLE, LAMP' },
          ]} />
          <Divider color={color} />

          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, padding: '12px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1, marginBottom: 6 }}>EXPLORATION TIPS</div>
            <div style={{ fontSize: 10, color: `${color}70`, lineHeight: 1.9 }}>
              <div>· NPCs move on schedules — visit the same location at different times to find different people</div>
              <div>· Examining the same object multiple times can yield different results after story events</div>
              <div>· <span style={{ color }}>SEARCH</span> is not available everywhere — it unlocks based on your Perception stat and prior EXAMINE actions</div>
              <div>· Some locations only become accessible after specific NPC conversations or quest stages</div>
              <div>· The <span style={{ color }}>MAP</span> command prints a text overview of nearby exits — useful if you get disoriented</div>
            </div>
          </div>
        </div>
      );

    case 'assignments-guide':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>STUDY: ASSIGNMENTS & GED CURRICULUM</div>
          <Divider color={color} />
          <p>The <span style={{ color }}>ASSIGNMENTS</span> desktop app is your primary academic workspace. It contains the full GED curriculum aligned to Kaplan 2022–2023 across four subject domains. Completing lessons and quizzes is the main way to raise your GED readiness and earn stat bonuses.</p>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>COMPLETE WALKTHROUGH — FROM DESKTOP TO SUBMITTED QUIZ:</div>
          <StepList color={color} steps={[
            { num: '1', title: 'Open the Assignments Portal', detail: 'Double-click the ASSIGNMENTS icon on the desktop, or click it in the taskbar.\n\nThe portal opens to the GED PREP tab by default. You will see four subject tiles:\n  · RLA (Reading, Language & Arts)\n  · MATH\n  · SOCIAL STUDIES\n  · SCIENCE\n\nA LANGUAGES tab and a CONSTELLATION tab are also accessible from the top navigation.' },
            { num: '2', title: 'Select a subject', detail: 'Click any subject tile to open its chapter list.\n\nEach subject is divided into chapters (there are 25 total across all four subjects). Chapters that are locked show a padlock — you must complete earlier chapters first.\n\nChapters have a progress bar showing how many lessons you have completed.' },
            { num: '3', title: 'Choose a chapter, then a lesson', detail: 'Click a chapter to expand its lesson list. Each lesson card shows:\n  · Lesson title and GED alignment code\n  · Estimated reading time\n  · Difficulty indicator\n  · Your completion status (dot color: grey = untouched, amber = started, green = complete)\n\nClick a lesson card to enter the lesson.' },
            { num: '4', title: 'Read the lesson — do not skip this', detail: 'The lesson view shows:\n  · A MENTOR COMMENTARY panel at the top (collapse it after reading)\n  · Full lesson text with key terms highlighted\n  · A reflection textarea at the bottom (optional — writing here earns bonus Resonance)\n\nRead the full lesson before attempting the quiz. The quiz is designed to reinforce the reading, not to test guessing. Skipping the lesson will result in a lower score.\n\nThe Constellation tab at the top shows this lesson\'s node in your personal learning map.' },
            { num: '5', title: 'Start and complete the quiz', detail: 'Click START QUIZ (or the quiz tab within the lesson).\n\nEach quiz has multiple-choice questions (A B C D):\n1. Click your chosen answer option\n2. Click CHECK ANSWER to confirm — you cannot change after confirming\n3. Correct answers highlight green, wrong answers highlight red with the correct answer shown\n4. Click NEXT QUESTION to continue\n5. After the final question, your score percentage is calculated and displayed\n\nYou can retake quizzes — each attempt is tracked separately.' },
            { num: '6', title: 'Review your results and rewards', detail: 'After quiz submission, the results screen shows:\n  · Your score percentage\n  · XP earned (70%+ = full XP, below 70% = partial XP)\n  · Stat bonuses applied (subject-specific)\n  · GED readiness change for this domain\n  · Skill node status update on your Constellation\n\nClick BACK TO LESSONS to return to the chapter, or NEXT LESSON to proceed in sequence.\n\nYour progress is saved automatically — no manual submit button needed.' },
            { num: '7', title: 'Track your GED readiness', detail: 'Open the PROGRESS app (taskbar or desktop icon) to see your overall GED readiness.\n\nEach domain shows:\n  · Readiness percentage bar\n  · Number of skills at each stage: UNTOUCHED → EMERGING → STABLE/MASTERED\n  · A recommendation for which area to study next\n\nYou need 3+ STABLE or MASTERED skills per domain to become GED-eligible.\nWhen all four domains reach eligibility, the GRADUATION CEREMONY command unlocks in the terminal.' },
          ]} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>WHAT EACH SUBJECT TEACHES YOUR CHARACTER:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
            {[
              { subj: 'RLA — Reading, Language & Arts', stat: 'linguistic', bonus: 'also boosts: presence, resonance', c: '#00aaff' },
              { subj: 'MATH',                          stat: 'mathLogic',  bonus: 'also boosts: fortitude, quickness', c: color },
              { subj: 'SOCIAL STUDIES',                stat: 'karma',      bonus: 'also boosts: faith, perception', c: '#ffaa00' },
              { subj: 'SCIENCE',                       stat: 'chi',        bonus: 'also boosts: nagual, ashe', c: '#00ffaa' },
            ].map(s => (
              <div key={s.subj} style={{ background: `${s.c}08`, border: `1px solid ${s.c}20`, padding: '8px 12px', fontFamily: 'Courier New, monospace', fontSize: 10 }}>
                <div style={{ color: s.c, marginBottom: 2 }}>{s.subj}</div>
                <div style={{ color: `${color}60` }}>Primary stat: <span style={{ color: s.c }}>{s.stat}</span> · {s.bonus}</div>
              </div>
            ))}
          </div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>THE MENTOR COMMENTARY PANEL:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.9, marginBottom: 14 }}>
            <div>At the top of every lesson you'll find a <span style={{ color }}>Mentor Commentary</span> panel. It shows:</div>
            <div style={{ marginLeft: 12, marginTop: 4 }}>
              <div>· A subject-specific mentor quote calibrated to this lesson's content</div>
              <div>· A reading focus prompt — a question to hold in your mind while reading</div>
              <div>· A cognitive state indicator showing your current learning ecology</div>
            </div>
            <div style={{ marginTop: 6 }}>The panel is expanded by default and can be collapsed. Your collapse preference is saved. Pay attention to the reading focus prompt — quiz questions often reflect it directly.</div>
          </div>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>THE CONSTELLATION TAB:</div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, lineHeight: 1.9, marginBottom: 14 }}>
            <div>Inside the Assignments Portal, the <span style={{ color }}>✦ CONSTELLATION</span> tab shows your spatial knowledge map — a star-field where each lesson is a glowing node.</div>
            <div style={{ marginLeft: 12, marginTop: 4 }}>
              <div>· <span style={{ color }}>Node color</span> encodes cognitive state: grey (untouched), amber (integrating), green (internalized)</div>
              <div>· <span style={{ color }}>Node brightness</span> reflects your Resonance score for that lesson</div>
              <div>· <span style={{ color }}>Lines between nodes</span> are prerequisite relationships</div>
              <div>· Hover over a node for a tooltip. Click it to jump directly to that lesson.</div>
              <div>· Use the domain filter buttons to focus on one subject area at a time.</div>
            </div>
          </div>
          <Divider color={color} />

          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, padding: '12px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1, marginBottom: 6 }}>MENTOR NOTE — PROF. CHEN</div>
            <div style={{ fontSize: 11, color: `${color}80` }}>"Reading the lesson first is not optional. The quiz is designed to reinforce comprehension, not test guessing. If you skip the reading, you will score below 70% and miss both the XP and the stat bonuses. Read first. Always."</div>
          </div>
        </div>
      );

    case 'npc-guide':
      return (
        <div>
          <div style={{ fontSize: 13, color, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 14 }}>SOCIAL: THE NPC INTERFACE</div>
          <Divider color={color} />
          <p>The Academy has <span style={{ color }}>100 autonomous NPCs</span> — faculty, students, staff, and hidden figures. They have schedules, memories, personality models, and they communicate with each other about you when you are not present.</p>
          <p style={{ marginTop: 8 }}>There are <span style={{ color }}>three ways to engage with NPCs</span>: the command terminal (live, in-world), ChatLink (asynchronous messaging), and Academy Email (formal correspondence). Each method affects Affinity differently.</p>
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>METHOD 1 — THE COMMAND TERMINAL (live, in-world):</div>
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}60`, marginBottom: 8 }}>Use this when an NPC is physically present in your current location. First type LIST to see who is here, then TALK to engage them.</p>
          <StepList color={color} steps={[
            { num: 'A', title: 'LIST — See who is in the room', detail: 'Type: list  (or: who, or: people)\n\nThis prints every NPC currently in your location and their role:\n  Present: Prof. Chen (Faculty), Zara Mehta (Student)\n\nNPC presence changes by time of day. If someone is not here, visit later or try their office.' },
            { num: 'B', title: 'TALK [name] — Start a conversation', detail: 'Type: talk chen\n\nThe NPC greets you and offers a list of topics:\n  Prof. Chen: "You could ask me about: GRADES, MATH, ASSIGNMENTS, TUTORING."\n\nYou can then type:\n  talk chen math\n  talk chen grades\n  ask chen about tutoring\n\nChoose your follow-up topic thoughtfully — some responses affect your Affinity score.' },
            { num: 'C', title: 'OBSERVE [name] — Watch without speaking', detail: 'Type: observe chen\n\nYou watch the NPC without initiating dialogue. This earns a small Perception boost and is the lowest-risk interaction.\n\nSome NPCs react to being observed — notably Archivist Ilyra, who may initiate dialogue if you observe her long enough.' },
            { num: 'D', title: 'ASK [name] ABOUT [topic] — Targeted questions', detail: 'Type: ask ilyra about archive\n\nThis is an alternative phrasing to TALK that is more direct. Use it when you know exactly what you want to ask.\n\nIf the NPC knows about the topic and your Affinity is high enough, they will give a detailed answer that may contain quest triggers, hints, or lore.' },
          ]} />
          <TerminalMockup color={color} lines={[
            { type: 'cmd', text: 'list' },
            { type: 'out', text: 'Present: Archivist Ilyra (Staff), two unnamed students (background)' },
            { type: 'sep', text: '' },
            { type: 'cmd', text: 'talk ilyra' },
            { type: 'out', text: 'Ilyra: "You could ask me about: ARCHIVE, LIBRARY, HISTORY, RESONANCE."' },
            { type: 'sep', text: '' },
            { type: 'cmd', text: 'ask ilyra about resonance' },
            { type: 'out', text: 'Ilyra pauses, considering you. "Resonance is not a score. It is a signature. Your signature is... developing."' },
            { type: 'out', text: '[Affinity +2 · Lore fragment: ILYRA_ON_RESONANCE added to notes]' },
          ]} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>METHOD 2 — CHATLINK (asynchronous NPC messaging):</div>
          <StepList color={color} steps={[
            { num: 'A', title: 'Open ChatLink', detail: 'Click the CHATLINK icon on the desktop or taskbar.\n\nThe app opens with two panels:\n  LEFT: NPC Directory — all available contacts\n  RIGHT: The active conversation thread\n\nUse the search bar at the top of the directory to find NPCs by name. Use the filter buttons to sort by: All, Faculty, Students, Staff, Unknown.' },
            { num: 'B', title: 'Browse the NPC Directory', detail: 'Each NPC entry in the directory shows:\n  · Name and role\n  · Current Affinity level (shown as a colored bar or number)\n  · Availability status\n\nAffinity level determines what topics they will discuss. NPCs with very low affinity may not respond to messages at all.' },
            { num: 'C', title: 'Open a conversation and send a message', detail: 'Click any NPC entry to open their conversation thread.\n\nType your message in the input at the bottom and press ENTER or click SEND.\n\nMessages can be:\n  · Questions ("Can you help me with the math assignment?")\n  · Follow-ups on in-world events ("I saw you in the library earlier...")\n  · Academic requests ("What topics will be on the next test?")\n\nThe NPC\'s response is generated based on their personality model and your relationship history. Responses arrive after a short delay.' },
            { num: 'D', title: 'Understand Affinity Gates', detail: 'Each NPC has invisible thresholds that unlock new conversation topics as your Affinity rises:\n\n  Stranger (0–19): Basic greetings only\n  Acquainted (20–39): General Academy topics\n  Familiar (40–59): Academic help and personal background\n  Trusted (60–79): Hidden curriculum, quest triggers, faction info\n  Bonded (80–100): Deep lore, rare items, narrative secrets\n\nAffinity rises through: regular messages, respectful tone, showing progress in their subject area.\nAffinity falls through: rude tone, ignoring promises, repeated failures in their subject.' },
          ]} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>AFFINITY GATES — INTERACTIVE REFERENCE:</div>
          <AffinityLadder color={color} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 6 }}>METHOD 3 — ACADEMY EMAIL (formal correspondence):</div>
          <StepList color={color} steps={[
            { num: 'A', title: 'Open Academy Email', detail: 'Double-click the EMAIL icon on the desktop.\n\nThe interface has an inbox and a compose view. New messages from NPCs arrive here (denoted by a badge count on the desktop icon).\n\nCheck your inbox regularly — some NPCs send unsolicited messages when your actions trigger their attention.' },
            { num: 'B', title: 'Compose a new message', detail: 'Click COMPOSE (or NEW MESSAGE).\n\nSelect the recipient from the NPC list. Only NPCs you have met at least once appear here.\n\nWrite a subject line and body. Email is evaluated differently than chat:\n  · Formal tone earns more Affinity with faculty\n  · Longer, detailed messages earn more response depth\n  · Some NPCs (e.g. Archivist Ilyra, Dr. Okafor) only respond to email — they do not use ChatLink' },
            { num: 'C', title: 'Wait for replies', detail: 'Email responses arrive on a delay — NPC replies simulate asynchronous communication.\n\nCheck your inbox periodically. Some replies arrive within minutes of in-game time, others take longer depending on the NPC\'s schedule.\n\nReplies often unlock:\n  · Assignment extensions\n  · Special study materials\n  · Quest invitations\n  · Referrals to other NPCs' },
          ]} />
          <Divider color={color} />

          <div style={{ fontFamily: 'monospace', fontSize: 10, color: `${color}80`, marginBottom: 8 }}>KEY CONTACTS — WHO TO APPROACH FIRST:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
            {[
              { name: 'PROF. CHEN',           subject: 'Math',           trait: 'Values precision and shown work. Best engaged via email for tutoring.', pref: 'Email + Terminal' },
              { name: 'MS. RIVERA',           subject: 'Language Arts',  trait: 'Values voice and creative effort. Open to ChatLink daily.', pref: 'ChatLink' },
              { name: 'DR. OKAFOR',           subject: 'Social Studies', trait: 'Values evidence and citations. Formal email only.', pref: 'Email only' },
              { name: 'INSTRUCTOR VASQUEZ',   subject: 'Science',        trait: 'Values curiosity. Ask questions — they always reward.', pref: 'Terminal + ChatLink' },
              { name: 'ARCHIVIST ILYRA',      subject: 'Lore / Library', trait: 'Notices behavioral patterns. Speaks in implication. Observe her before talking.', pref: 'Terminal (observe first)' },
              { name: 'GROUNDSKEEPER TOMAS',  subject: 'Facilities',     trait: 'Watches. Rarely speaks first. Finds you if infrastructure is neglected.', pref: 'Terminal (rare)' },
            ].map(npc => (
              <div key={npc.name} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${color}10` }}>
                <div style={{ width: 4, background: `${color}25`, flexShrink: 0, alignSelf: 'stretch' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ color, fontFamily: 'Courier New, monospace', fontSize: 10 }}>{npc.name}</span>
                    <span style={{ color: `${color}35`, fontFamily: 'Courier New, monospace', fontSize: 9 }}>· {npc.subject}</span>
                    <span style={{ color: `${color}50`, fontFamily: 'Courier New, monospace', fontSize: 8, marginLeft: 'auto' }}>[{npc.pref}]</span>
                  </div>
                  <div style={{ color: `${color}55`, fontFamily: 'Courier New, monospace', fontSize: 9 }}>{npc.trait}</div>
                </div>
              </div>
            ))}
          </div>
          <Divider color={color} />

          <div style={{ background: `${color}08`, border: `1px solid ${color}20`, padding: '12px 16px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: 9, color: `${color}50`, letterSpacing: 1, marginBottom: 6 }}>HOW AFFINITY CHANGES</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 9, color: '#00ffaa', letterSpacing: 1, marginBottom: 4 }}>RISES THROUGH:</div>
                <div style={{ fontSize: 10, color: `${color}70`, lineHeight: 1.8 }}>
                  <div>· Consistent, regular contact</div>
                  <div>· Respectful, thoughtful tone</div>
                  <div>· Academic progress in their subject</div>
                  <div>· Attending their class sessions</div>
                  <div>· Completing quests they assigned</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#ff4444', letterSpacing: 1, marginBottom: 4 }}>FALLS THROUGH:</div>
                <div style={{ fontSize: 10, color: `${color}70`, lineHeight: 1.8 }}>
                  <div>· Long silences after establishing contact</div>
                  <div>· Rude or dismissive dialogue choices</div>
                  <div>· Repeated academic failure</div>
                  <div>· Breaking commitments made in dialogue</div>
                  <div>· Ignoring their scheduled events</div>
                </div>
              </div>
            </div>
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

import { useState, useEffect } from 'react';
import { Star, Check, ChevronRight, Zap, Brain, Shield, Users, Sparkles, Award } from 'lucide-react';
import { STARTER_PERKS, StarterPerk, PerkEffect } from '@shared/perks';
import { useGameState } from '@/contexts/GameStateContext';
import StatIcon from '@/components/ui/stat-icon';
import { PHYSICAL_STATS, MENTAL_STATS, SPIRITUAL_STATS } from '@shared/stats';
import type { StatKey } from '@shared/stats';

const G = '#00ff00';
const GOLD = '#ffaa00';
const CYAN = '#00ffff';
const PURPLE = '#cc66ff';
const RED = '#ff6666';

const CATEGORY_COLORS: Record<string, string> = {
  combat: RED, social: CYAN, academic: GOLD, survival: '#66ff88', mystical: PURPLE,
};
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  combat:  <Shield size={12} />,
  social:  <Users size={12} />,
  academic:<Brain size={12} />,
  survival:<Zap size={12} />,
  mystical:<Sparkles size={12} />,
};

const MAX_SELECTIONS = 2;

// Map old-style stat target names to new StatKey system for icon display
const STAT_NAME_MAP: Record<string, StatKey> = {
  intelligence: 'mathLogic', perception: 'fortitude', charisma: 'presence',
  strength: 'strength', endurance: 'endurance', dexterity: 'agility',
  luck: 'luck', faith: 'faith', chi: 'chi', karma: 'karma',
  resonance: 'resonance', quickness: 'quickness', agility: 'agility',
  speed: 'speed', mathLogic: 'mathLogic', linguistic: 'linguistic',
  fortitude: 'fortitude', musicCreative: 'musicCreative', nagual: 'nagual', ashe: 'ashe',
};

function EffectChip({ effect, perkColor }: { effect: PerkEffect; perkColor: string }) {
  const statKey = effect.target ? STAT_NAME_MAP[effect.target] : null;
  const isBonus = effect.type === 'stat_bonus' && effect.value !== undefined;
  const isNegative = isBonus && (effect.value ?? 0) < 0;
  const chipColor = isNegative ? RED : perkColor;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: `${chipColor}10`, border: `1px solid ${chipColor}35`, borderRadius: 3 }}>
      {statKey && <StatIcon statKey={statKey} size="xs" showTooltip={false} />}
      {isBonus && (
        <span style={{ fontSize: 13, fontWeight: 'bold', color: chipColor, fontFamily: '"Courier New", monospace', textShadow: `0 0 8px ${chipColor}80` }}>
          {(effect.value ?? 0) > 0 ? `+${effect.value}` : effect.value}
        </span>
      )}
      {!isBonus && effect.type === 'special_ability' && <Star size={10} color={chipColor} />}
      <span style={{ fontSize: 9, color: `${chipColor}cc`, lineHeight: 1.3 }}>{effect.description}</span>
    </div>
  );
}

function PerkCard({ perk, selected, selectable, onClick }: {
  perk: StarterPerk; selected: boolean; selectable: boolean; onClick: () => void;
}) {
  const color = perk.effects[0]?.type === 'stat_bonus' ? G :
    perk.effects.some(e => e.type === 'special_ability') ? PURPLE : GOLD;
  const border = selected ? `2px solid ${color}` : `1px solid ${color}30`;
  const bg = selected ? `${color}12` : '#0d0d0d';

  return (
    <button
      onClick={onClick}
      disabled={!selectable && !selected}
      style={{
        background: bg,
        border,
        borderRadius: 4,
        padding: '12px 14px',
        cursor: selectable || selected ? 'pointer' : 'not-allowed',
        textAlign: 'left',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'all 0.15s ease',
        opacity: !selectable && !selected ? 0.45 : 1,
        boxShadow: selected ? `0 0 16px ${color}30, inset 0 0 12px ${color}08` : 'none',
        position: 'relative',
      }}
    >
      {selected && (
        <div style={{ position: 'absolute', top: 8, right: 10, background: color, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={11} color="#000" strokeWidth={3} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Award size={14} color={color} style={{ filter: `drop-shadow(0 0 4px ${color})`, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 'bold', color: selected ? color : '#ffffffcc', fontFamily: '"Courier New", monospace', textShadow: selected ? `0 0 8px ${color}60` : 'none' }}>
          {perk.name}
        </span>
      </div>
      <div style={{ fontSize: 9.5, color: '#ffffff60', lineHeight: 1.5 }}>{perk.description}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {perk.effects.map((e, i) => <EffectChip key={i} effect={e} perkColor={color} />)}
        {perk.drawbacks && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: `${RED}0a`, border: `1px solid ${RED}30`, borderRadius: 3 }}>
            <span style={{ fontSize: 9, color: `${RED}cc` }}>DRAWBACK: {perk.drawbacks}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function StatSummaryRow({ label, statKey, baseVal, bonus }: { label: string; statKey: StatKey; baseVal: number; bonus: number }) {
  const total = baseVal + bonus;
  const color = PHYSICAL_STATS.some(s => s.id === statKey) ? '#00ff88' :
    MENTAL_STATS.some(s => s.id === statKey) ? '#00ccff' : '#cc66ff';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <StatIcon statKey={statKey} size="xs" showTooltip={false} />
      <span style={{ fontSize: 9, color: '#ffffff50', minWidth: 70, fontFamily: '"Courier New", monospace' }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(total, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${color}50, ${color})`, borderRadius: 2, transition: 'width 0.8s ease 0.3s' }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: '"Courier New", monospace', color, minWidth: 22, textAlign: 'right' }}>{total}</span>
      {bonus > 0 && (
        <span style={{ fontSize: 10, fontFamily: '"Courier New", monospace', color: GOLD, minWidth: 30, textAlign: 'right', textShadow: `0 0 8px ${GOLD}80` }}>
          +{bonus}
        </span>
      )}
    </div>
  );
}

function ScanLine() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)', pointerEvents: 'none', zIndex: 0 }} />
  );
}

type Phase = 'picking' | 'summary';

export default function StarterPerkFlow() {
  const { character, chooseStarterPerks } = useGameState();
  const [phase, setPhase] = useState<Phase>('picking');
  const [selected, setSelected] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const togglePerk = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < MAX_SELECTIONS ? [...prev, id] : prev
    );
  };

  const selectedPerks = STARTER_PERKS.filter(p => selected.includes(p.id));

  const computeStatBonuses = (): Record<string, number> => {
    const bonuses: Record<string, number> = {};
    selectedPerks.forEach(perk => {
      perk.effects.forEach(e => {
        if (e.type === 'stat_bonus' && e.target && e.value !== undefined) {
          const key = STAT_NAME_MAP[e.target] ?? e.target;
          bonuses[key] = (bonuses[key] ?? 0) + e.value;
        }
      });
    });
    return bonuses;
  };

  const handleConfirm = () => {
    setPhase('summary');
  };

  const handleBegin = () => {
    chooseStarterPerks(selected.length > 0 ? selected : ['jocked']);
  };

  const statBonuses = computeStatBonuses();
  const allStats = [...PHYSICAL_STATS, ...MENTAL_STATS, ...SPIRITUAL_STATS];
  const charStats = character.stats as unknown as Record<string, number>;

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: '"Courier New", monospace',
      overflowY: 'auto',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <ScanLine />
      <div style={{ width: '100%', maxWidth: 900, padding: '40px 24px 60px', position: 'relative', zIndex: 1 }}>

        {phase === 'picking' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 9, color: `${G}50`, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 6 }}>
                ACADEMY OS — INITIATION SEQUENCE
              </div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: G, letterSpacing: '2px', textShadow: `0 0 20px ${G}60`, marginBottom: 10 }}>
                SELECT YOUR STARTING TRAITS
              </div>
              <div style={{ fontSize: 10, color: '#ffffff50', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
                Choose <span style={{ color: GOLD, fontWeight: 'bold' }}>2 perks</span> that define who you are entering the Academy.
                These traits are <span style={{ color: RED }}>permanent</span> — they will shape every interaction ahead.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
              {[0, 1].map(i => (
                <div key={i} style={{
                  width: 120, height: 36, border: `1px solid ${selected[i] ? GOLD : G + '25'}`,
                  borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selected[i] ? `${GOLD}10` : '#0a0a0a',
                  transition: 'all 0.2s',
                }}>
                  {selected[i] ? (
                    <span style={{ fontSize: 9, color: GOLD, letterSpacing: '0.5px' }}>
                      {STARTER_PERKS.find(p => p.id === selected[i])?.name.slice(0, 14)}...
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, color: `${G}30`, letterSpacing: '0.5px' }}>SLOT {i + 1}</span>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', border: `1px solid ${G}20`, borderRadius: 3, background: '#0a0a0a' }}>
                <span style={{ fontSize: 10, color: selected.length === MAX_SELECTIONS ? GOLD : `${G}60` }}>
                  {selected.length} / {MAX_SELECTIONS} selected
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 32 }}>
              {STARTER_PERKS.map(perk => (
                <PerkCard
                  key={perk.id}
                  perk={perk}
                  selected={selected.includes(perk.id)}
                  selectable={selected.length < MAX_SELECTIONS || selected.includes(perk.id)}
                  onClick={() => togglePerk(perk.id)}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleConfirm}
                disabled={selected.length !== MAX_SELECTIONS}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 32px',
                  background: selected.length === MAX_SELECTIONS ? `${G}18` : '#0a0a0a',
                  border: `2px solid ${selected.length === MAX_SELECTIONS ? G : G + '25'}`,
                  color: selected.length === MAX_SELECTIONS ? G : `${G}40`,
                  fontSize: 12, fontWeight: 'bold', fontFamily: '"Courier New", monospace',
                  letterSpacing: '2px', textTransform: 'uppercase',
                  cursor: selected.length === MAX_SELECTIONS ? 'pointer' : 'not-allowed',
                  borderRadius: 3,
                  boxShadow: selected.length === MAX_SELECTIONS ? `0 0 20px ${G}30` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                CONFIRM SELECTION
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 9, color: `${GOLD}70`, letterSpacing: '3px', marginBottom: 6 }}>INITIALIZATION COMPLETE</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: GOLD, letterSpacing: '2px', textShadow: `0 0 20px ${GOLD}60`, marginBottom: 8 }}>
                {character.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 9, color: '#ffffff40', letterSpacing: '1px' }}>ACADEMY OS — BASE PROFILE SCAN</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: `${GOLD}80`, letterSpacing: '1px', marginBottom: 12, textTransform: 'uppercase' }}>Chosen Traits</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedPerks.map(perk => {
                    const color = perk.effects[0]?.type === 'stat_bonus' ? G : PURPLE;
                    return (
                      <div key={perk.id} style={{ border: `1px solid ${color}40`, background: `${color}08`, borderRadius: 4, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <Award size={16} color={GOLD} style={{ filter: `drop-shadow(0 0 6px ${GOLD})` }} />
                          <span style={{ fontSize: 13, fontWeight: 'bold', color: GOLD, textShadow: `0 0 10px ${GOLD}60` }}>{perk.name}</span>
                        </div>
                        <div style={{ fontSize: 9, color: '#ffffff50', marginBottom: 10, lineHeight: 1.5 }}>{perk.description}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {perk.effects.map((e, i) => <EffectChip key={i} effect={e} perkColor={color} />)}
                          {perk.drawbacks && (
                            <div style={{ padding: '4px 8px', background: `${RED}0a`, border: `1px solid ${RED}25`, borderRadius: 3, fontSize: 9, color: `${RED}cc` }}>
                              DRAWBACK: {perk.drawbacks}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: `${CYAN}80`, letterSpacing: '1px', marginBottom: 12, textTransform: 'uppercase' }}>Base Stat Profile</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 9, color: '#00ff8870', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Physical</div>
                  {PHYSICAL_STATS.map(s => (
                    <StatSummaryRow key={s.id} label={s.abbreviation} statKey={s.iconKey as StatKey} baseVal={charStats[s.id] ?? 10} bonus={statBonuses[s.id] ?? 0} />
                  ))}
                  <div style={{ fontSize: 9, color: '#00ccff70', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '8px 0 4px' }}>Mental</div>
                  {MENTAL_STATS.map(s => (
                    <StatSummaryRow key={s.id} label={s.abbreviation} statKey={s.iconKey as StatKey} baseVal={charStats[s.id] ?? 10} bonus={statBonuses[s.id] ?? 0} />
                  ))}
                  <div style={{ fontSize: 9, color: '#cc66ff70', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '8px 0 4px' }}>Spiritual</div>
                  {SPIRITUAL_STATS.map(s => (
                    <StatSummaryRow key={s.id} label={s.abbreviation} statKey={s.iconKey as StatKey} baseVal={charStats[s.id] ?? 10} bonus={statBonuses[s.id] ?? 0} />
                  ))}
                </div>
                {Object.keys(statBonuses).length > 0 && (
                  <div style={{ marginTop: 12, padding: '8px 10px', border: `1px solid ${GOLD}30`, background: `${GOLD}08`, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={12} color={GOLD} fill={GOLD} />
                    <span style={{ fontSize: 9, color: `${GOLD}cc` }}>
                      Perk bonuses are highlighted in <span style={{ color: GOLD, fontWeight: 'bold' }}>gold</span>. These are applied permanently.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <button
                onClick={handleBegin}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 40px',
                  background: `${GOLD}18`,
                  border: `2px solid ${GOLD}`,
                  color: GOLD, fontSize: 13, fontWeight: 'bold',
                  fontFamily: '"Courier New", monospace',
                  letterSpacing: '3px', textTransform: 'uppercase',
                  cursor: 'pointer', borderRadius: 3,
                  boxShadow: `0 0 24px ${GOLD}40, inset 0 0 16px ${GOLD}08`,
                  animation: 'pulse-gold 2s ease infinite',
                }}
              >
                ENTER THE ACADEMY
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 24px ${GOLD}40, inset 0 0 16px ${GOLD}08; }
          50% { box-shadow: 0 0 40px ${GOLD}60, inset 0 0 24px ${GOLD}14; }
        }
      `}</style>
    </div>
  );
}

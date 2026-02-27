import { useState, useMemo } from 'react';
import { Star, Lock, Zap, Brain, Shield, Users, Sparkles, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { STARTER_PERKS, LEVELUP_PERKS, StarterPerk, LevelUpPerk, PerkEffect } from '@shared/perks';
import { useGameState } from '@/contexts/GameStateContext';
import StatIcon from '@/components/ui/stat-icon';
import type { StatKey } from '@shared/stats';

const G = '#00ff00';
const GOLD = '#ffaa00';
const CYAN = '#00ffff';
const PURPLE = '#cc66ff';
const RED = '#ff6666';
const DIM = '#ffffff18';

const RARITY_LEVEL: Record<string, number> = { common: 1, uncommon: 3, rare: 5, legendary: 8 };
const RARITY_COLOR: Record<string, string> = { common: G, uncommon: CYAN, rare: PURPLE, legendary: GOLD };

const CATEGORY_COLORS: Record<string, string> = {
  combat: RED, social: CYAN, academic: GOLD, survival: '#66ff88', mystical: PURPLE,
};
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  combat: <Shield size={11} />, social: <Users size={11} />,
  academic: <Brain size={11} />, survival: <Zap size={11} />, mystical: <Sparkles size={11} />,
};

const STAT_MAP: Record<string, StatKey> = {
  intelligence: 'mathLogic', perception: 'fortitude', charisma: 'presence',
  strength: 'strength', endurance: 'endurance', dexterity: 'agility',
  luck: 'luck', faith: 'faith', chi: 'chi', karma: 'karma',
  resonance: 'resonance', quickness: 'quickness', agility: 'agility', speed: 'speed',
  mathLogic: 'mathLogic', linguistic: 'linguistic', fortitude: 'fortitude',
  musicCreative: 'musicCreative', nagual: 'nagual', ashe: 'ashe',
};

function getMinLevel(perk: LevelUpPerk): number {
  return perk.levelRequired ?? perk.prerequisites?.level ?? RARITY_LEVEL[perk.rarity ?? 'common'] ?? 1;
}

function meetsStatReqs(perk: LevelUpPerk, charStats: Record<string, number>): { met: boolean; failures: string[] } {
  const reqs = perk.prerequisites?.stats;
  if (!reqs) return { met: true, failures: [] };
  const failures: string[] = [];
  Object.entries(reqs).forEach(([stat, required]) => {
    const actual = charStats[stat] ?? charStats[STAT_MAP[stat]] ?? 10;
    if (actual < (required as number)) failures.push(`${stat.toUpperCase()} ≥ ${required} (have ${actual})`);
  });
  return { met: failures.length === 0, failures };
}

function EffectDisplay({ effect, compact = false }: { effect: PerkEffect; compact?: boolean }) {
  const statKey = effect.target ? STAT_MAP[effect.target] : null;
  const isBonus = effect.type === 'stat_bonus' && effect.value !== undefined;
  const isNeg = isBonus && (effect.value ?? 0) < 0;
  const color = isNeg ? RED : effect.type === 'special_ability' ? PURPLE : CYAN;
  const size = effect.value ?? 0;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: `${color}0c`, border: `1px solid ${color}25`, borderRadius: 2 }}>
        {statKey && <StatIcon statKey={statKey} size="xs" showTooltip={false} />}
        {isBonus && (
          <span style={{ fontSize: 11, fontWeight: 'bold', color, fontFamily: '"Courier New", monospace', textShadow: `0 0 6px ${color}70` }}>
            {size > 0 ? `+${size}` : size}
          </span>
        )}
        {!isBonus && <span style={{ fontSize: 8, color: `${color}aa` }}>{effect.description.slice(0, 32)}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: `${color}08`, border: `1px solid ${color}30`, borderRadius: 3 }}>
      {statKey && <StatIcon statKey={statKey} size="xs" showTooltip={false} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isBonus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 'bold', color, fontFamily: '"Courier New", monospace', textShadow: `0 0 14px ${color}`, lineHeight: 1 }}>
              {size > 0 ? `+${size}` : size}
            </span>
            {effect.target && (
              <span style={{ fontSize: 9, color: `${color}90`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {effect.target}
              </span>
            )}
          </div>
        )}
        {effect.type === 'special_ability' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <Star size={9} color={PURPLE} fill={PURPLE} />
            <span style={{ fontSize: 8, color: `${PURPLE}90`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Special Ability</span>
          </div>
        )}
        {effect.type === 'passive_bonus' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <Zap size={9} color={GOLD} fill={GOLD} />
            <span style={{ fontSize: 8, color: `${GOLD}90`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passive Bonus</span>
          </div>
        )}
        <div style={{ fontSize: 9.5, color: '#ffffffaa', lineHeight: 1.5 }}>{effect.description}</div>
      </div>
    </div>
  );
}

type Tab = 'available' | 'active' | 'locked' | 'starter';

function PerkListItem({ label, rarity, category, isUnlocked, isLocked, selected, onClick }: {
  label: string; rarity?: string; category?: string; isUnlocked?: boolean; isLocked?: boolean; selected: boolean; onClick: () => void;
}) {
  const rarityColor = rarity ? RARITY_COLOR[rarity] ?? G : G;
  const catColor = category ? CATEGORY_COLORS[category] ?? G : G;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 10px', textAlign: 'left',
        background: selected ? `${rarityColor}10` : 'transparent',
        border: selected ? `1px solid ${rarityColor}45` : '1px solid transparent',
        borderRadius: 3, cursor: 'pointer', transition: 'background 0.12s',
      }}
    >
      {isUnlocked
        ? <CheckCircle size={11} color={G} style={{ flexShrink: 0 }} />
        : isLocked
        ? <Lock size={11} color={`${RED}60`} style={{ flexShrink: 0 }} />
        : <Award size={11} color={rarityColor} style={{ flexShrink: 0, filter: `drop-shadow(0 0 3px ${rarityColor}50)` }} />
      }
      <span style={{
        flex: 1, fontSize: 10.5, fontFamily: '"Courier New", monospace',
        color: isLocked ? '#ffffff28' : selected ? rarityColor : '#ffffffc0',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textShadow: selected ? `0 0 8px ${rarityColor}50` : 'none',
      }}>
        {label}
      </span>
      {rarity && rarity !== 'common' && (
        <span style={{ fontSize: 7, color: rarityColor, border: `1px solid ${rarityColor}40`, padding: '1px 4px', borderRadius: 2, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {rarity}
        </span>
      )}
      {category && (
        <span style={{ color: catColor, flexShrink: 0, opacity: 0.7 }}>{CATEGORY_ICONS[category]}</span>
      )}
    </button>
  );
}

function DetailPanel({ perk, isLevelUp, charLevel, charStats, isUnlocked }: {
  perk: StarterPerk | LevelUpPerk; isLevelUp: boolean; charLevel: number;
  charStats: Record<string, number>; isUnlocked: boolean;
}) {
  const lp = perk as LevelUpPerk;
  const rarityColor = isLevelUp && lp.rarity ? RARITY_COLOR[lp.rarity] ?? G : GOLD;
  const catColor = isLevelUp && lp.category ? CATEGORY_COLORS[lp.category] ?? G : CYAN;
  const minLevel = isLevelUp ? getMinLevel(lp) : 0;
  const levelMet = !isLevelUp || charLevel >= minLevel;
  const { met: statsMet, failures } = isLevelUp ? meetsStatReqs(lp, charStats) : { met: true, failures: [] };
  const fullyLocked = !levelMet || !statsMet;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ padding: '12px 14px', background: `${rarityColor}07`, border: `1px solid ${rarityColor}30`, borderRadius: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <Award size={16} color={rarityColor} style={{ filter: `drop-shadow(0 0 7px ${rarityColor}80)`, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 'bold', color: rarityColor, fontFamily: '"Courier New", monospace', textShadow: `0 0 10px ${rarityColor}60` }}>
            {perk.name}
          </span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {isLevelUp && lp.rarity && (
              <span style={{ fontSize: 7, color: rarityColor, border: `1px solid ${rarityColor}50`, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lp.rarity}
              </span>
            )}
            {isLevelUp && lp.category && (
              <span style={{ fontSize: 7, color: catColor, border: `1px solid ${catColor}50`, padding: '2px 6px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 3 }}>
                {CATEGORY_ICONS[lp.category]} {lp.category}
              </span>
            )}
            {isUnlocked && (
              <span style={{ fontSize: 7, color: G, border: `1px solid ${G}50`, padding: '2px 6px', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <CheckCircle size={7} /> ACTIVE
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#ffffff70', lineHeight: 1.6 }}>{perk.description}</div>
      </div>

      <div>
        <div style={{ fontSize: 8, color: '#ffffff30', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Effects</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {perk.effects.map((e, i) => <EffectDisplay key={i} effect={e} />)}
          {'drawbacks' in perk && (perk as StarterPerk).drawbacks && (
            <div style={{ padding: '8px 10px', background: `${RED}08`, border: `1px solid ${RED}30`, borderRadius: 3 }}>
              <div style={{ fontSize: 8, color: `${RED}80`, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Drawback</div>
              <div style={{ fontSize: 9.5, color: `${RED}cc`, lineHeight: 1.5 }}>{(perk as StarterPerk).drawbacks}</div>
            </div>
          )}
        </div>
      </div>

      {isLevelUp && (minLevel > 1 || failures.length > 0 || !levelMet) && (
        <div>
          <div style={{ fontSize: 8, color: '#ffffff30', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Requirements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {minLevel > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: levelMet ? `${G}08` : `${RED}08`, border: `1px solid ${levelMet ? G : RED}28`, borderRadius: 3 }}>
                {levelMet ? <CheckCircle size={11} color={G} /> : <AlertCircle size={11} color={RED} />}
                <span style={{ fontSize: 9, color: levelMet ? `${G}cc` : `${RED}cc` }}>
                  Level {minLevel} required — you are level {charLevel}
                </span>
              </div>
            )}
            {failures.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: `${RED}08`, border: `1px solid ${RED}28`, borderRadius: 3 }}>
                <AlertCircle size={11} color={RED} />
                <span style={{ fontSize: 9, color: `${RED}cc` }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerksViewer() {
  const { character } = useGameState();
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const charStats = character.stats as unknown as Record<string, number>;
  const unlockedIds = useMemo(() => new Set([...character.starterPerks, ...character.unlockedPerks]), [character.starterPerks, character.unlockedPerks]);

  const categorized = useMemo(() => {
    const active: LevelUpPerk[] = [];
    const available: LevelUpPerk[] = [];
    const locked: LevelUpPerk[] = [];
    LEVELUP_PERKS.forEach(p => {
      if (unlockedIds.has(p.id)) { active.push(p); return; }
      const minLv = getMinLevel(p);
      const { met: sMet } = meetsStatReqs(p, charStats);
      if (character.level >= minLv && sMet) available.push(p);
      else locked.push(p);
    });
    return { active, available, locked };
  }, [character.level, unlockedIds, charStats]);

  const starterActive = useMemo(() => STARTER_PERKS.filter(p => character.starterPerks.includes(p.id)), [character.starterPerks]);

  const tabDefs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: 'available', label: 'AVAILABLE', count: categorized.available.length, color: G },
    { key: 'active',    label: 'ACTIVE',    count: categorized.active.length + starterActive.length, color: GOLD },
    { key: 'locked',    label: 'LOCKED',    count: categorized.locked.length, color: RED },
    { key: 'starter',   label: 'ALL STARTER', count: STARTER_PERKS.length, color: CYAN },
  ];

  const currentList = useMemo((): (StarterPerk | LevelUpPerk)[] => {
    if (activeTab === 'available') return categorized.available;
    if (activeTab === 'active') return [...starterActive, ...categorized.active];
    if (activeTab === 'locked') return categorized.locked;
    return STARTER_PERKS;
  }, [activeTab, categorized, starterActive]);

  const selectedPerk = selectedId ? (currentList.find(p => p.id === selectedId) ?? null) : null;
  const isLevelUp = selectedPerk ? !STARTER_PERKS.some(p => p.id === selectedPerk.id) : false;

  const tabStyle = (t: typeof tabDefs[0]): React.CSSProperties => ({
    flex: 1, padding: '5px 2px', cursor: 'pointer', fontFamily: '"Courier New", monospace',
    fontSize: 7.5, letterSpacing: '0.4px', textTransform: 'uppercase', borderRadius: 3,
    background: activeTab === t.key ? `${t.color}14` : 'transparent',
    border: `1px solid ${activeTab === t.key ? t.color : DIM}`,
    color: activeTab === t.key ? t.color : '#ffffff35',
    textShadow: activeTab === t.key ? `0 0 8px ${t.color}50` : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#06060a', color: '#fff', fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #ffffff10', background: '#0a0a12', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={13} color={GOLD} fill={GOLD} style={{ filter: `drop-shadow(0 0 5px ${GOLD})` }} />
          <span style={{ fontSize: 12, fontWeight: 'bold', color: GOLD, letterSpacing: '1px', textShadow: `0 0 10px ${GOLD}60` }}>PERKS</span>
          <span style={{ fontSize: 9, color: '#ffffff30', marginLeft: 'auto' }}>
            Lv.{character.level} · {unlockedIds.size} earned
          </span>
        </div>
        <div style={{ fontSize: 9, color: '#ffffff30', marginTop: 4, lineHeight: 1.4 }}>
          Perks unlock with level and stat milestones. Earned every other level.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, padding: '6px 8px', borderBottom: '1px solid #ffffff08', flexShrink: 0 }}>
        {tabDefs.map(t => (
          <button key={t.key} style={tabStyle(t)} onClick={() => { setActiveTab(t.key); setSelectedId(null); }}>
            {t.label}
            <span style={{ background: activeTab === t.key ? `${t.color}22` : '#ffffff0a', padding: '0 4px', borderRadius: 2, fontSize: 7 }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ width: '42%', borderRight: '1px solid #ffffff08', overflow: 'auto', flexShrink: 0 }}>
          {currentList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.5, padding: 16 }}>
              <Lock size={28} color={G} />
              <span style={{ fontSize: 9, color: G, textAlign: 'center', lineHeight: 1.6 }}>
                {activeTab === 'active' ? 'No perks earned yet.\nComplete levels to earn perks.' :
                 activeTab === 'available' ? 'No perks available at your level yet.' :
                 'No entries in this category.'}
              </span>
            </div>
          ) : (
            <div style={{ padding: '4px 4px' }}>
              {currentList.map(perk => {
                const lp = perk as LevelUpPerk;
                const isStarter = STARTER_PERKS.some(s => s.id === perk.id);
                return (
                  <PerkListItem
                    key={perk.id}
                    label={perk.name}
                    rarity={!isStarter ? lp.rarity : undefined}
                    category={!isStarter ? lp.category : undefined}
                    isUnlocked={unlockedIds.has(perk.id)}
                    isLocked={activeTab === 'locked'}
                    selected={selectedId === perk.id}
                    onClick={() => setSelectedId(perk.id === selectedId ? null : perk.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {selectedPerk ? (
            <DetailPanel
              perk={selectedPerk}
              isLevelUp={isLevelUp}
              charLevel={character.level}
              charStats={charStats}
              isUnlocked={unlockedIds.has(selectedPerk.id)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
              <Award size={28} color={`${G}35`} />
              <span style={{ fontSize: 9, color: `${G}40`, letterSpacing: '0.8px', textTransform: 'uppercase', textAlign: 'center' }}>Select a perk to view details</span>
              {activeTab === 'locked' && (
                <div style={{ fontSize: 8.5, color: '#ffffff25', textAlign: 'center', maxWidth: 160, lineHeight: 1.6, marginTop: 6 }}>
                  Locked perks show the exact stats and level needed to unlock them.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '4px 14px', borderTop: '1px solid #ffffff06', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        {Object.entries(RARITY_COLOR).map(([r, c]) => (
          <span key={r} style={{ fontSize: 7, color: c, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: c, display: 'inline-block' }} />
            {r}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 7.5, color: '#ffffff18' }}>earned every other level</span>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { X, Search, UserPlus, MessageCircle, Mail, Lock, Shield, Users, Star, Wifi, WifiOff, Clock } from 'lucide-react';
import { useRadiantAI } from '@/hooks/useRadiantAI';
import { NPCEntity } from '@/lib/radiantAI';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_PURPLE = '#cc66ff';
const NEON_RED = '#ff3366';
const NEON_GOLD = '#ffd700';

export type DirectoryMode = 'chat' | 'email';

export interface NPCContactStatus {
  label: string;
  color: string;
  canConnect: boolean;
  isCold: boolean;
  affinityNote: string;
  tier: number;
}

function getContactStatus(affinity: number | null, trust: number | null): NPCContactStatus {
  const aff = affinity ?? 0;
  const trs = trust ?? 0;
  if (aff < -20) {
    return { label: 'RIVAL', color: NEON_RED, canConnect: false, isCold: false, affinityNote: 'Affinity too low — contact blocked', tier: 0 };
  }
  if (aff < 0) {
    return { label: 'STRANGER', color: '#888888', canConnect: true, isCold: true, affinityNote: 'Cold introduction — response not guaranteed', tier: 1 };
  }
  if (aff < 20) {
    return { label: 'ACQUAINTANCE', color: NEON_GREEN, canConnect: true, isCold: false, affinityNote: `Affinity: ${Math.round(aff)}`, tier: 2 };
  }
  if (aff < 50) {
    return { label: 'FRIEND', color: NEON_CYAN, canConnect: true, isCold: false, affinityNote: `Affinity: ${Math.round(aff)} · Trust: ${Math.round(trs)}`, tier: 3 };
  }
  return { label: 'ALLY', color: NEON_GOLD, canConnect: true, isCold: false, affinityNote: `Affinity: ${Math.round(aff)} · Trust: ${Math.round(trs)}`, tier: 4 };
}

function getRoleColor(role: string): string {
  if (role === 'Teacher') return NEON_AMBER;
  if (role === 'Staff') return NEON_PURPLE;
  return NEON_GREEN;
}

function getRoleLabel(role: string): string {
  if (role === 'Teacher') return 'Faculty';
  if (role === 'Staff') return 'Staff';
  return 'Student';
}

function getAffinityBar(affinity: number | null) {
  const aff = Math.max(-100, Math.min(100, affinity ?? 0));
  const pct = ((aff + 100) / 200) * 100;
  const color = aff < -20 ? NEON_RED : aff < 0 ? '#666' : aff < 20 ? NEON_GREEN : aff < 50 ? NEON_CYAN : NEON_GOLD;
  return { pct, color };
}

function NPCAvatar({ npc, size = 36 }: { npc: NPCEntity; size?: number }) {
  const initials = npc.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const roleColor = getRoleColor(npc.role);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${roleColor}18`,
      border: `1px solid ${roleColor}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontSize: size * 0.35,
      color: roleColor,
      fontFamily: '"Courier New", monospace',
      fontWeight: 'bold',
      letterSpacing: 0,
    }}>
      {initials}
    </div>
  );
}

interface NPCDirectoryPanelProps {
  mode: DirectoryMode;
  onClose: () => void;
  onSelectNPC: (npc: NPCEntity, status: NPCContactStatus) => void;
  alreadyConnected?: string[];
}

export default function NPCDirectoryPanel({ mode, onClose, onSelectNPC, alreadyConnected = [] }: NPCDirectoryPanelProps) {
  const { getAllNPCs, getRelationshipWithPlayer, processInteraction } = useRadiantAI();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Student' | 'Teacher' | 'Staff'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'connected' | 'available' | 'locked'>('all');
  const [hovered, setHovered] = useState<string | null>(null);

  const allNPCs = useMemo(() => getAllNPCs(), [getAllNPCs]);

  const enrichedNPCs = useMemo(() => {
    return allNPCs.map(npc => {
      const rel = getRelationshipWithPlayer(npc.id);
      const status = getContactStatus(rel?.affinity ?? null, rel?.trust ?? null);
      const connected = alreadyConnected.includes(npc.name);
      return { npc, status, rel, connected };
    });
  }, [allNPCs, getRelationshipWithPlayer, alreadyConnected]);

  const filtered = useMemo(() => {
    return enrichedNPCs
      .filter(({ npc, status, connected }) => {
        if (search && !npc.name.toLowerCase().includes(search.toLowerCase()) &&
          !(npc.faction ?? '').toLowerCase().includes(search.toLowerCase()) &&
          !(npc.club ?? '').toLowerCase().includes(search.toLowerCase()) &&
          !(npc.specialty ?? '').toLowerCase().includes(search.toLowerCase())) return false;
        if (roleFilter !== 'all' && npc.role !== roleFilter) return false;
        if (tierFilter === 'connected' && !connected) return false;
        if (tierFilter === 'available' && (connected || !status.canConnect)) return false;
        if (tierFilter === 'locked' && status.canConnect) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.connected !== b.connected) return a.connected ? -1 : 1;
        return b.status.tier - a.status.tier;
      });
  }, [enrichedNPCs, search, roleFilter, tierFilter]);

  const accentColor = mode === 'chat' ? NEON_GREEN : NEON_AMBER;
  const ModeIcon = mode === 'chat' ? MessageCircle : Mail;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#050505',
      zIndex: 300,
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Courier New", monospace',
      color: accentColor,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        borderBottom: `1px solid ${accentColor}40`,
        background: `${accentColor}08`,
        flexShrink: 0,
      }}>
        <UserPlus size={15} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>
          {mode === 'chat' ? 'Add Contact — ChatLink' : 'Add Contact — Academy Mail'}
        </span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: `${accentColor}60`, cursor: 'pointer', padding: 4 }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${accentColor}20`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: `${accentColor}60` }} />
          <input
            type="text"
            placeholder="Search by name, faction, club, specialty..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: `${accentColor}08`,
              border: `1px solid ${accentColor}30`,
              color: accentColor,
              padding: '7px 10px 7px 28px',
              fontFamily: 'inherit', fontSize: 11,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'Student', 'Teacher', 'Staff'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              background: roleFilter === r ? `${accentColor}25` : 'transparent',
              border: `1px solid ${roleFilter === r ? accentColor : accentColor + '30'}`,
              color: roleFilter === r ? accentColor : `${accentColor}60`,
              padding: '3px 9px', fontSize: 10, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.5px',
            }}>
              {r === 'all' ? 'ALL' : r === 'Teacher' ? 'FACULTY' : r.toUpperCase()}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {(['all', 'connected', 'available', 'locked'] as const).map(f => (
              <button key={f} onClick={() => setTierFilter(f)} style={{
                background: tierFilter === f ? `${accentColor}20` : 'transparent',
                border: `1px solid ${tierFilter === f ? accentColor + '80' : accentColor + '20'}`,
                color: tierFilter === f ? accentColor : `${accentColor}50`,
                padding: '3px 8px', fontSize: 9, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '0.5px', textTransform: 'uppercase',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 9, padding: '4px 14px', color: `${accentColor}40`, borderBottom: `1px solid ${accentColor}15`, flexShrink: 0, letterSpacing: '0.5px' }}>
        {filtered.length} contacts found · RadiantAI-driven social network
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.4, fontSize: 12 }}>
            No contacts match your filter
          </div>
        ) : (
          filtered.map(({ npc, status, connected }) => {
            const bar = getAffinityBar(status.tier > 0 ? (status.tier - 1) * 25 : -50);
            const isHovered = hovered === npc.id;

            return (
              <div
                key={npc.id}
                onMouseEnter={() => setHovered(npc.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  marginBottom: 4,
                  background: isHovered ? `${accentColor}10` : connected ? `${accentColor}06` : 'transparent',
                  border: `1px solid ${connected ? accentColor + '40' : isHovered ? accentColor + '25' : accentColor + '15'}`,
                  opacity: !status.canConnect ? 0.45 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <NPCAvatar npc={npc} size={36} />
                  {connected && (
                    <div style={{
                      position: 'absolute', bottom: -1, right: -1,
                      width: 10, height: 10, borderRadius: '50%',
                      background: NEON_GREEN,
                      border: '1px solid #050505',
                      boxShadow: `0 0 4px ${NEON_GREEN}`,
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>
                      {npc.name}
                    </span>
                    {npc.secretSociety && (
                      <Shield size={9} style={{ color: NEON_PURPLE, opacity: 0.7 }} />
                    )}
                    {npc.mentorship && (
                      <Star size={9} style={{ color: NEON_AMBER, opacity: 0.7 }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, color: getRoleColor(npc.role), letterSpacing: '0.5px' }}>
                      {getRoleLabel(npc.role)}
                    </span>
                    {npc.specialty && (
                      <span style={{ fontSize: 9, color: `${accentColor}80`, fontStyle: 'italic' }}>
                        {npc.specialty}
                      </span>
                    )}
                    {npc.faction && (
                      <span style={{ fontSize: 9, color: NEON_PURPLE, opacity: 0.7 }}>
                        {npc.faction}
                      </span>
                    )}
                    {npc.club && (
                      <span style={{ fontSize: 9, color: `${accentColor}50` }}>
                        {npc.club}
                      </span>
                    )}
                  </div>
                  {isHovered && npc.quirks && npc.quirks.length > 0 && (
                    <div style={{
                      fontSize: 8, color: '#ffffff45', marginBottom: 3,
                      fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {npc.quirks[0]}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 2, background: `${accentColor}15`, position: 'relative', maxWidth: 80 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${bar.pct}%`, background: bar.color, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 9, color: status.color, letterSpacing: '0.5px', fontWeight: 'bold' }}>
                      {status.label}
                    </span>
                    <span style={{ fontSize: 8, color: `${accentColor}40` }}>
                      @ {npc.currentLocation}
                    </span>
                  </div>
                  {status.isCold && (
                    <div style={{ fontSize: 8, color: '#ffffff30', marginTop: 2 }}>
                      {status.affinityNote}
                    </div>
                  )}
                </div>

                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {!status.canConnect ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: NEON_RED + '80', fontSize: 9 }}>
                      <Lock size={10} />
                      BLOCKED
                    </div>
                  ) : connected ? (
                    <button
                      onClick={() => onSelectNPC(npc, status)}
                      style={{
                        background: `${accentColor}20`,
                        border: `1px solid ${accentColor}60`,
                        color: accentColor,
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4,
                        letterSpacing: '0.5px',
                      }}
                    >
                      <ModeIcon size={10} />
                      OPEN
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectNPC(npc, status)}
                      style={{
                        background: status.isCold ? `#ffffff08` : `${accentColor}18`,
                        border: `1px solid ${status.isCold ? '#ffffff25' : accentColor + '50'}`,
                        color: status.isCold ? '#ffffff60' : accentColor,
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontSize: 10,
                        fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4,
                        letterSpacing: '0.5px',
                      }}
                    >
                      <UserPlus size={10} />
                      {status.isCold ? 'INTRODUCE' : 'CONNECT'}
                    </button>
                  )}
                  {status.tier > 1 && (
                    <div style={{ fontSize: 8, color: `${accentColor}40`, textAlign: 'right' }}>
                      {status.affinityNote}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{
        padding: '8px 14px',
        borderTop: `1px solid ${accentColor}20`,
        fontSize: 9,
        color: `${accentColor}30`,
        display: 'flex', gap: 14, flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: NEON_RED }}>■</span> Rival — Blocked
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#888' }}>■</span> Stranger — Cold intro
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: NEON_GREEN }}>■</span> Acquaintance
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: NEON_CYAN }}>■</span> Friend
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: NEON_GOLD }}>■</span> Ally
        </span>
      </div>
    </div>
  );
}

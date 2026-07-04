/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — WORLD EVENTS FEED
 *  Displays the weekly content pack: theme, active events,
 *  NPC mood shifts, and featured GED focus areas.
 *  Consumed in the desktop shell as a persistent sidebar feed.
 * ═══════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useContentPack } from '@/hooks/useContentPack';
import type { PackWorldEvent, PackNpcMood, PackGEDFocus } from '@shared/contentPack';
import { Wifi, WifiOff, RefreshCw, ChevronDown, ChevronRight, Zap, Users, BookOpen, Globe } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  academic:      'text-blue-400 border-blue-400/30 bg-blue-400/10',
  social:        'text-purple-400 border-purple-400/30 bg-purple-400/10',
  discovery:     'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  mystery:       'text-amber-400 border-amber-400/30 bg-amber-400/10',
  competition:   'text-green-400 border-green-400/30 bg-green-400/10',
  crisis:        'text-red-400 border-red-400/30 bg-red-400/10',
  institutional: 'text-slate-400 border-slate-400/30 bg-slate-400/10',
};

const EMOTION_BADGES: Record<string, string> = {
  happy:     'text-green-300 bg-green-300/10',
  excited:   'text-yellow-300 bg-yellow-300/10',
  focused:   'text-blue-300 bg-blue-300/10',
  neutral:   'text-slate-300 bg-slate-300/10',
  anxious:   'text-amber-300 bg-amber-300/10',
  sad:       'text-indigo-300 bg-indigo-300/10',
  angry:     'text-red-300 bg-red-300/10',
  distracted:'text-orange-300 bg-orange-300/10',
};

const GED_SUBJECT_LABELS: Record<string, string> = {
  math:           'MATH',
  language_arts:  'LANG ARTS',
  science:        'SCIENCE',
  social_studies: 'SOC STUDIES',
};

// ─────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: PackWorldEvent }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.academic;

  return (
    <div className="border border-white/5 rounded-md overflow-hidden">
      <button
        className="w-full text-left px-3 py-2 flex items-start gap-2 hover-elevate"
        onClick={() => setExpanded(v => !v)}
      >
        <span className={`mt-0.5 shrink-0 text-[10px] font-mono font-bold border rounded px-1 py-0 ${colorClass}`}>
          {event.category.toUpperCase().slice(0, 4)}
        </span>
        <span className="flex-1 text-xs font-medium text-foreground leading-snug">{event.title}</span>
        {expanded ? <ChevronDown className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
          {event.npcReaction && (
            <div className="border-l-2 border-green-500/40 pl-2">
              <p className="text-[11px] italic text-green-400/80">"{event.npcReaction}"</p>
            </div>
          )}
          {event.playerHook && (
            <div className="flex items-start gap-1.5">
              <Zap className="w-3 h-3 shrink-0 mt-0.5 text-amber-400" />
              <p className="text-[11px] text-amber-300/90">{event.playerHook}</p>
            </div>
          )}
          <div className="flex items-center gap-1 flex-wrap">
            {event.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[9px] font-mono text-muted-foreground/60 border border-white/5 rounded px-1">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NpcMoodRow({ mood }: { mood: PackNpcMood }) {
  const badgeClass = EMOTION_BADGES[mood.emotionState] ?? EMOTION_BADGES.neutral;
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 shrink-0" />
      <span className="text-xs text-foreground flex-1 truncate">{mood.npcName}</span>
      <span className={`text-[9px] font-mono font-bold rounded px-1.5 py-0.5 ${badgeClass}`}>
        {mood.emotionState.toUpperCase()}
      </span>
    </div>
  );
}

function GEDFocusRow({ focus }: { focus: PackGEDFocus }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded px-1 mt-0.5 shrink-0">
        {GED_SUBJECT_LABELS[focus.subject] ?? focus.subject}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{focus.topic}</p>
        <p className="text-[10px] text-muted-foreground leading-snug">{focus.whyNow}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

export function WorldEventsFeed() {
  const { pack, loading, isOffline, refresh } = useContentPack();
  const [activeTab, setActiveTab] = useState<'events' | 'npcs' | 'study'>('events');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="flex flex-col h-full font-mono text-foreground bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <Globe className="w-3.5 h-3.5 text-green-400" />
        <span className="text-[11px] font-bold tracking-widest text-green-400 uppercase flex-1">Academy Live Feed</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-muted-foreground hover-elevate rounded p-0.5"
          title="Refresh content pack"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        {isOffline
          ? <WifiOff className="w-3 h-3 text-amber-400" title="Offline mode" />
          : <Wifi className="w-3 h-3 text-green-400" title="Connected" />}
      </div>

      {/* Theme banner */}
      {pack && (
        <div className="px-3 py-2 border-b border-white/5 bg-green-400/5">
          <p className="text-[9px] font-mono uppercase tracking-widest text-green-400/60 mb-0.5">
            {pack.version} {pack.generatedBy === 'deterministic' ? '· OFFLINE' : '· LIVE'}
          </p>
          <p className="text-[11px] text-green-300 italic leading-snug">{pack.weeklyTheme}</p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-white/5">
        {([['events', Zap, 'Events'], ['npcs', Users, 'Mood'], ['study', BookOpen, 'Study']] as const).map(([tab, Icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold tracking-wide uppercase transition-colors
              ${activeTab === tab ? 'text-green-400 border-b-2 border-green-400' : 'text-muted-foreground hover-elevate'}`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-green-400/50 mb-2" />
            <p className="text-[10px] text-muted-foreground">Syncing content pack...</p>
          </div>
        )}

        {!loading && !pack && (
          <p className="text-[11px] text-muted-foreground text-center py-6">No content pack available.</p>
        )}

        {!loading && pack && activeTab === 'events' && (
          <>
            {pack.themeContext && (
              <p className="text-[10px] text-muted-foreground leading-relaxed px-1 pb-1 border-b border-white/5">
                {pack.themeContext}
              </p>
            )}
            {pack.activeEvents.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">No active events this week.</p>
            )}
            {pack.activeEvents.map(ev => <EventCard key={ev.id} event={ev} />)}
            {pack.rssHeadlines && pack.rssHeadlines.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40 mb-1.5 px-1">
                  Real-world seeds
                </p>
                <div className="space-y-0.5">
                  {pack.rssHeadlines.map((h, i) => (
                    <p key={i} className="text-[9px] text-muted-foreground/50 leading-snug px-1 truncate" title={h}>
                      · {h}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!loading && pack && activeTab === 'npcs' && (
          <>
            <p className="text-[10px] text-muted-foreground px-1 pb-1 border-b border-white/5">
              NPCs with shifted emotional states this week.
            </p>
            {pack.npcMoodShifts.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">No mood shifts this week.</p>
            )}
            {pack.npcMoodShifts.map(m => <NpcMoodRow key={m.npcId} mood={m} />)}
          </>
        )}

        {!loading && pack && activeTab === 'study' && (
          <>
            <p className="text-[10px] text-muted-foreground px-1 pb-1 border-b border-white/5">
              GED focus areas selected for this week.
            </p>
            {pack.gedFocusAreas.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">No featured study areas this week.</p>
            )}
            {pack.gedFocusAreas.map((f, i) => <GEDFocusRow key={i} focus={f} />)}
          </>
        )}
      </div>

      {/* Footer */}
      {pack && (
        <div className="px-3 py-1.5 border-t border-white/5">
          <p className="text-[9px] font-mono text-muted-foreground/40 text-center">
            {isOffline ? 'OFFLINE · DETERMINISTIC MODE' : `SYNCED · ${new Date(pack.generatedAt).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
}

export default WorldEventsFeed;

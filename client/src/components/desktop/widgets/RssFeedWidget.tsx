import { useState, useEffect, useCallback } from 'react';

interface FeedItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
}

interface RssFeedWidgetProps {
  primaryColor: string;
  accentCyan: string;
  accentAmber: string;
}

const FEED_NODES: { id: string; label: string; url: string; tag: string }[] = [
  { id: 'nasa',    label: 'NASA SPACE',   url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',                      tag: 'SPACE' },
  { id: 'science', label: 'SCI DAILY',    url: 'https://www.sciencedaily.com/rss/top/science.xml',                    tag: 'SCI' },
  { id: 'wiki',    label: 'WIKI FEED',    url: 'https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=featured&feedformat=rss', tag: 'WIKI' },
  { id: 'hn',      label: 'HACKER NEWS',  url: 'https://hnrss.org/frontpage',                                         tag: 'TECH' },
  { id: 'geo',     label: 'NAT GEO',      url: 'https://www.nationalgeographic.com/content/natgeo/en_US/news.rss',    tag: 'GEO' },
  { id: 'mittr',   label: 'MIT TECH REV', url: 'https://www.technologyreview.com/feed/',                              tag: 'TECH' },
  { id: 'aps',     label: 'PHYS.ORG',     url: 'https://phys.org/rss-feed/breaking/',                                  tag: 'PHYS' },
];

const STORAGE_KEY = 'academy-rss-node';
const CACHE_KEY = 'academy-rss-cache';

interface CacheEntry { node: string; items: FeedItem[]; ts: number; }

export function RssFeedWidget({ primaryColor, accentCyan, accentAmber }: RssFeedWidgetProps) {
  const [activeNode, setActiveNode] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? 'nasa');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const node = FEED_NODES.find(f => f.id === activeNode) ?? FEED_NODES[0];

  const fetchFeed = useCallback(async (nodeId: string) => {
    const n = FEED_NODES.find(f => f.id === nodeId);
    if (!n) return;
    try {
      const cache: CacheEntry | null = (() => {
        try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null'); } catch { return null; }
      })();
      if (cache && cache.node === nodeId && Date.now() - cache.ts < 5 * 60 * 1000) {
        setItems(cache.items);
        return;
      }
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/rss?url=${encodeURIComponent(n.url)}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: { items: FeedItem[] } = await res.json();
      setItems(data.items.slice(0, 6));
      localStorage.setItem(CACHE_KEY, JSON.stringify({ node: nodeId, items: data.items.slice(0, 6), ts: Date.now() }));
    } catch (e: unknown) {
      setError((e as Error).message ?? 'fetch error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(activeNode);
  }, [activeNode, fetchFeed]);

  const selectNode = (id: string) => {
    setActiveNode(id);
    setShowSelector(false);
    setItems([]);
    localStorage.setItem(STORAGE_KEY, id);
    localStorage.removeItem(CACHE_KEY);
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: 210,
        height: 200,
        background: '#060606',
        border: `1px solid ${primaryColor}60`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.8), 0 0 10px ${primaryColor}10`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"Courier New", monospace',
        position: 'relative',
      }}
    >
      <div style={{
        height: 22,
        background: `${primaryColor}18`,
        borderBottom: `1px solid ${primaryColor}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 7, background: accentAmber, color: '#000',
            padding: '0 3px', fontWeight: 'bold', letterSpacing: 0.5,
          }}>{node.tag}</span>
          <span style={{ fontSize: 9, color: primaryColor, letterSpacing: 0.5 }}>{node.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => { setItems([]); localStorage.removeItem(CACHE_KEY); fetchFeed(activeNode); }}
            title="Refresh"
            style={{ background: 'none', border: 'none', color: `${primaryColor}60`, fontSize: 9, cursor: 'pointer', padding: '0 2px', fontFamily: 'monospace' }}
          >⟳</button>
          <button
            onClick={() => setShowSelector(s => !s)}
            title="Select data node"
            style={{ background: 'none', border: `1px solid ${primaryColor}40`, color: primaryColor, fontSize: 7, cursor: 'pointer', padding: '0 4px', fontFamily: 'monospace', letterSpacing: 0.5 }}
          >NODE ▾</button>
        </div>
      </div>

      {showSelector && (
        <div style={{
          position: 'absolute',
          top: 22,
          right: 0,
          width: '100%',
          background: '#0a0a0a',
          border: `1px solid ${primaryColor}50`,
          zIndex: 10,
          boxShadow: `0 4px 20px rgba(0,0,0,0.9)`,
        }}>
          {FEED_NODES.map(fn => (
            <button
              key={fn.id}
              onClick={() => selectNode(fn.id)}
              style={{
                display: 'flex', width: '100%', textAlign: 'left',
                background: fn.id === activeNode ? `${primaryColor}15` : 'transparent',
                border: 'none', borderBottom: `1px solid ${primaryColor}10`,
                padding: '5px 8px', cursor: 'pointer',
                fontFamily: 'monospace', color: primaryColor,
                alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 7, background: accentAmber, color: '#000', padding: '0 3px', fontWeight: 'bold' }}>{fn.tag}</span>
              <span style={{ fontSize: 9 }}>{fn.label}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
        {loading && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: `${primaryColor}50`, fontSize: 9 }}>
            RECEIVING SIGNAL...
          </div>
        )}
        {error && !loading && (
          <div style={{ padding: '8px', color: '#ff4444', fontSize: 8 }}>
            SIGNAL LOST: {error}
            <button onClick={() => fetchFeed(activeNode)} style={{ display: 'block', marginTop: 4, background: 'none', border: `1px solid #ff4444`, color: '#ff4444', fontSize: 7, cursor: 'pointer', padding: '2px 6px', fontFamily: 'monospace' }}>RETRY</button>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: `${primaryColor}30`, fontSize: 9 }}>NO SIGNAL</div>
        )}
        {!loading && items.map((item, i) => (
          <div key={i} style={{
            borderBottom: `1px solid ${primaryColor}12`,
            padding: '4px 2px',
            marginBottom: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <span style={{ color: accentCyan, fontSize: 7, lineHeight: '14px', flexShrink: 0 }}>▸</span>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 9,
                  color: primaryColor,
                  fontFamily: 'monospace',
                  textDecoration: 'none',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.title}
              </a>
            </div>
            {item.pubDate && (
              <div style={{ fontSize: 7, color: `${primaryColor}35`, marginTop: 1, marginLeft: 10 }}>
                {new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        height: 14,
        borderTop: `1px solid ${primaryColor}15`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 6px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 7, color: `${primaryColor}30`, letterSpacing: 0.5 }}>
          {loading ? 'FETCHING...' : items.length > 0 ? `${items.length} ITEMS — LIVE FEED` : 'READY'}
        </span>
      </div>
    </div>
  );
}

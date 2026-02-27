import { useState, useCallback } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { virtualFS } from '@/lib/virtualFilesystem';
import { getTrashItems, restoreFromTrash, permanentlyDelete, emptyTrash, TrashItem } from '@/lib/trashStore';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';

interface RecycleBinProps {
  onRestoreFile?: (path: string, content?: string) => void;
}

export default function RecycleBin({ onRestoreFile }: RecycleBinProps) {
  const { colors, accentColors } = useCrtTheme();
  const [items, setItems] = useState<TrashItem[]>(() => getTrashItems());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const refresh = () => setItems(getTrashItems());

  const handleRestore = useCallback((item: TrashItem) => {
    const restored = restoreFromTrash(item.id);
    if (!restored) return;
    if (restored.type === 'file' && restored.content !== undefined) {
      const result = virtualFS.writeFile(restored.originalPath, restored.content);
      if (!result.success) {
        const fallback = `/home/student/documents/notes/${restored.name}`;
        virtualFS.writeFile(fallback, restored.content ?? '');
        onRestoreFile?.(fallback, restored.content);
      } else {
        onRestoreFile?.(restored.originalPath, restored.content);
      }
    }
    refresh();
    setSelectedId(null);
  }, [onRestoreFile]);

  const handlePermanentDelete = useCallback((id: string) => {
    permanentlyDelete(id);
    refresh();
    setSelectedId(null);
  }, []);

  const handleEmptyTrash = () => {
    emptyTrash();
    refresh();
    setConfirmEmpty(false);
    setSelectedId(null);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const selected = items.find(i => i.id === selectedId);

  const rowStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    background: active ? `${colors.primary}18` : 'transparent',
    border: active ? `1px solid ${colors.primary}40` : '1px solid transparent',
    cursor: 'pointer',
    transition: 'background 0.1s',
  });

  const btnStyle = (danger = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: danger ? `${accentColors.red}15` : `${colors.primary}10`,
    border: `1px solid ${danger ? accentColors.red : colors.primary}50`,
    color: danger ? accentColors.red : colors.primary,
    padding: '5px 12px',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: '"Courier New", monospace',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colors.background, color: colors.primary, fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${colors.primary}30`, background: `${colors.primary}06`, flexShrink: 0 }}>
        <Trash2 size={14} color={accentColors.red} />
        <span style={{ fontSize: 11, letterSpacing: '0.5px', textTransform: 'uppercase', flex: 1 }}>Recycle Bin</span>
        <span style={{ fontSize: 10, color: `${colors.primary}60` }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
        {items.length > 0 && (
          <button onClick={() => setConfirmEmpty(true)} style={btnStyle(true)}>
            <Trash2 size={12} />Empty
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: `${colors.primary}40` }}>
            <Trash2 size={36} strokeWidth={1} />
            <span style={{ fontSize: 12, letterSpacing: '0.5px' }}>Recycle Bin is empty</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={rowStyle(selectedId === item.id)}
                onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
              >
                <Trash2 size={13} color={item.type === 'directory' ? accentColors.amber : accentColors.cyan} />
                <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                <span style={{ fontSize: 10, color: `${colors.primary}50`, whiteSpace: 'nowrap' }}>{formatDate(item.deletedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ flexShrink: 0, padding: '8px 12px', borderTop: `1px solid ${colors.primary}30`, background: `${colors.primary}05` }}>
          <div style={{ fontSize: 10, color: `${colors.primary}60`, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.originalPath}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnStyle()} onClick={() => handleRestore(selected)}>
              <RotateCcw size={12} />Restore
            </button>
            <button style={btnStyle(true)} onClick={() => handlePermanentDelete(selected.id)}>
              <X size={12} />Delete Permanently
            </button>
          </div>
        </div>
      )}

      {!selected && items.length > 0 && (
        <div style={{ flexShrink: 0, padding: '6px 12px', borderTop: `1px solid ${colors.primary}20`, background: `${colors.primary}03`, fontSize: 10, color: `${colors.primary}45` }}>
          Click an item to select · Restore sends it back to its original location
        </div>
      )}

      {confirmEmpty && (
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmEmpty(false)}
        >
          <div
            style={{ background: colors.background, border: `1px solid ${accentColors.red}70`, padding: 20, width: 300, boxShadow: `0 0 30px ${accentColors.red}20` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: accentColors.red, fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              <AlertTriangle size={14} />
              Empty Recycle Bin?
            </div>
            <div style={{ fontSize: 11, color: `${colors.primary}80`, marginBottom: 16 }}>
              This permanently deletes all {items.length} item{items.length !== 1 ? 's' : ''}. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmEmpty(false)} style={{ background: 'transparent', border: `1px solid ${colors.primary}40`, color: `${colors.primary}70`, padding: '5px 14px', cursor: 'pointer', fontSize: 11, fontFamily: '"Courier New", monospace' }}>Cancel</button>
              <button onClick={handleEmptyTrash} style={{ background: `${accentColors.red}20`, border: `1px solid ${accentColors.red}70`, color: accentColors.red, padding: '5px 14px', cursor: 'pointer', fontSize: 11, fontFamily: '"Courier New", monospace' }}>Empty Bin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

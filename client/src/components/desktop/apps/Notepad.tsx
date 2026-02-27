import { useState, useRef, useEffect } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { virtualFS } from '@/lib/virtualFilesystem';
import { Save, FileText, ChevronDown } from 'lucide-react';

export interface NotepadProps {
  initialContent?: string;
  initialFileName?: string;
  filePath?: string;
  onSave?: (path: string, content: string) => void;
}

export default function Notepad({ initialContent = '', initialFileName = 'Untitled', filePath, onSave }: NotepadProps) {
  const { colors, accentColors } = useCrtTheme();
  const [content, setContent] = useState(initialContent);
  const [fileName, setFileName] = useState(initialFileName);
  const [currentPath, setCurrentPath] = useState(filePath ?? '');
  const [hasChanges, setHasChanges] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [openMenu, setOpenMenu] = useState<'file' | 'edit' | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savePathInput, setSavePathInput] = useState('');
  const [findQuery, setFindQuery] = useState('');
  const [showFind, setShowFind] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (filePath && !initialContent) {
      const result = virtualFS.readFile(filePath);
      if (result.success && result.content) {
        setContent(result.content);
        setFileName(filePath.split('/').pop() ?? 'Untitled');
      }
    }
  }, [filePath]);

  const updateCursor = (ta: HTMLTextAreaElement) => {
    const before = ta.value.substring(0, ta.selectionStart);
    const lines = before.split('\n');
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
  };

  const handleNew = () => {
    if (hasChanges && !confirm('You have unsaved changes. Continue?')) return;
    setContent('');
    setFileName('Untitled');
    setCurrentPath('');
    setHasChanges(false);
    setOpenMenu(null);
  };

  const handleSave = () => {
    setOpenMenu(null);
    if (!currentPath) {
      setSavePathInput('/home/student/documents/notes/');
      setShowSaveDialog(true);
      return;
    }
    doSave(currentPath);
  };

  const handleSaveAs = () => {
    setOpenMenu(null);
    setSavePathInput(currentPath || '/home/student/documents/notes/');
    setShowSaveDialog(true);
  };

  const doSave = (path: string) => {
    const result = virtualFS.writeFile(path, content);
    if (result.success) {
      setCurrentPath(path);
      setFileName(path.split('/').pop() ?? 'Untitled');
      setHasChanges(false);
      onSave?.(path, content);
    } else {
      alert(`Save failed: ${result.error}`);
    }
  };

  const handleSelectAll = () => {
    textareaRef.current?.select();
    setOpenMenu(null);
  };

  const handleFind = () => {
    setOpenMenu(null);
    setShowFind(true);
  };

  const doFind = () => {
    if (!findQuery || !textareaRef.current) return;
    const idx = content.indexOf(findQuery, textareaRef.current.selectionEnd);
    if (idx === -1) {
      const fromStart = content.indexOf(findQuery);
      if (fromStart !== -1) {
        textareaRef.current.setSelectionRange(fromStart, fromStart + findQuery.length);
        textareaRef.current.focus();
      }
    } else {
      textareaRef.current.setSelectionRange(idx, idx + findQuery.length);
      textareaRef.current.focus();
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.split('\n').length;

  const menuBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? `${colors.primary}20` : 'transparent',
    border: active ? `1px solid ${colors.primary}40` : '1px solid transparent',
    color: colors.primary,
    padding: '3px 10px',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.5px',
  });

  const dropdownItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '7px 16px',
    background: 'transparent',
    border: 'none',
    color: colors.primary,
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: '"Courier New", monospace',
    textAlign: 'left',
    gap: 24,
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colors.background, color: colors.primary, fontFamily: '"Courier New", monospace', position: 'relative', overflow: 'hidden' }}
      onClick={() => setOpenMenu(null)}
    >
      <div
        style={{ display: 'flex', gap: 0, padding: '4px 8px', borderBottom: `1px solid ${colors.primary}30`, background: `${colors.primary}06`, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button style={menuBtnStyle(openMenu === 'file')} onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}>File</button>
        <button style={menuBtnStyle(openMenu === 'edit')} onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}>Edit</button>
      </div>

      {openMenu === 'file' && (
        <div
          style={{ position: 'absolute', top: 29, left: 8, background: colors.background, border: `1px solid ${colors.primary}60`, boxShadow: `0 6px 20px rgba(0,0,0,0.7), 0 0 12px ${colors.primary}20`, zIndex: 200, minWidth: 180 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button style={dropdownItemStyle} onClick={handleNew}>
            <span>New</span><span style={{ color: `${colors.primary}50`, fontSize: 10 }}>Ctrl+N</span>
          </button>
          <div style={{ height: 1, background: `${colors.primary}20`, margin: '2px 0' }} />
          <button style={dropdownItemStyle} onClick={handleSave}>
            <span>Save</span><span style={{ color: `${colors.primary}50`, fontSize: 10 }}>Ctrl+S</span>
          </button>
          <button style={dropdownItemStyle} onClick={handleSaveAs}>
            <span>Save As...</span>
          </button>
        </div>
      )}

      {openMenu === 'edit' && (
        <div
          style={{ position: 'absolute', top: 29, left: 44, background: colors.background, border: `1px solid ${colors.primary}60`, boxShadow: `0 6px 20px rgba(0,0,0,0.7), 0 0 12px ${colors.primary}20`, zIndex: 200, minWidth: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button style={dropdownItemStyle} onClick={handleSelectAll}>
            <span>Select All</span><span style={{ color: `${colors.primary}50`, fontSize: 10 }}>Ctrl+A</span>
          </button>
          <button style={dropdownItemStyle} onClick={handleFind}>
            <span>Find...</span><span style={{ color: `${colors.primary}50`, fontSize: 10 }}>Ctrl+F</span>
          </button>
        </div>
      )}

      {showFind && (
        <div
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: `1px solid ${colors.primary}30`, background: `${colors.primary}08` }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: 10, color: `${colors.primary}70`, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Find:</span>
          <input
            autoFocus
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doFind(); if (e.key === 'Escape') setShowFind(false); }}
            style={{ flex: 1, background: `${colors.primary}10`, border: `1px solid ${colors.primary}40`, color: colors.primary, fontFamily: '"Courier New", monospace', fontSize: 11, padding: '3px 8px', outline: 'none' }}
          />
          <button onClick={doFind} style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}40`, color: colors.primary, padding: '3px 10px', cursor: 'pointer', fontSize: 10, fontFamily: '"Courier New", monospace' }}>Next</button>
          <button onClick={() => setShowFind(false)} style={{ background: 'transparent', border: `1px solid ${colors.primary}30`, color: `${colors.primary}70`, padding: '3px 8px', cursor: 'pointer', fontSize: 10, fontFamily: '"Courier New", monospace' }}>✕</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{ padding: '8px 6px 8px 8px', borderRight: `1px solid ${colors.primary}18`, background: `${colors.primary}03`, textAlign: 'right', minWidth: 38, overflow: 'hidden', userSelect: 'none', fontSize: 11, lineHeight: '18px', color: `${colors.primary}35` }}
        >
          {Array.from({ length: lineCount }, (_, i) => i + 1).map(n => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); setHasChanges(true); }}
          onKeyUp={(e) => updateCursor(e.currentTarget)}
          onClick={(e) => updateCursor(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
            if (e.ctrlKey && e.key === 'n') { e.preventDefault(); handleNew(); }
            if (e.ctrlKey && e.key === 'f') { e.preventDefault(); handleFind(); }
            if (e.ctrlKey && e.key === 'a') { e.preventDefault(); handleSelectAll(); }
          }}
          placeholder={`${fileName} — start typing…`}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: colors.primary, fontFamily: '"Courier New", monospace', fontSize: 12, lineHeight: '18px', padding: '8px', resize: 'none', caretColor: colors.primary }}
        />
      </div>

      <div style={{ padding: '4px 12px', borderTop: `1px solid ${colors.primary}30`, background: `${colors.primary}05`, fontSize: 10, color: `${colors.primary}55`, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
          {currentPath || fileName}{hasChanges ? ' ●' : ''}
        </span>
        <span style={{ whiteSpace: 'nowrap' }}>Ln {cursorLine} Col {cursorCol} · {wordCount}w · {content.length}ch</span>
      </div>

      {showSaveDialog && (
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            style={{ background: colors.background, border: `1px solid ${colors.primary}70`, padding: 20, width: 360, boxShadow: `0 0 40px ${colors.primary}25` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 12, marginBottom: 10, color: colors.primary, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={14} />
              Save File
            </div>
            <div style={{ fontSize: 10, color: `${colors.primary}60`, marginBottom: 8 }}>
              Path must be inside a writable directory (e.g. ~/documents/notes/)
            </div>
            <input
              autoFocus
              value={savePathInput}
              onChange={(e) => setSavePathInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { doSave(savePathInput.trim()); setShowSaveDialog(false); } if (e.key === 'Escape') setShowSaveDialog(false); }}
              style={{ width: '100%', background: `${colors.primary}10`, border: `1px solid ${colors.primary}50`, color: colors.primary, fontFamily: '"Courier New", monospace', fontSize: 12, padding: '7px 10px', boxSizing: 'border-box', marginBottom: 14, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSaveDialog(false)} style={{ background: 'transparent', border: `1px solid ${colors.primary}40`, color: `${colors.primary}70`, padding: '5px 16px', cursor: 'pointer', fontSize: 11, fontFamily: '"Courier New", monospace' }}>Cancel</button>
              <button onClick={() => { doSave(savePathInput.trim()); setShowSaveDialog(false); }} style={{ background: `${colors.primary}18`, border: `1px solid ${colors.primary}70`, color: colors.primary, padding: '5px 16px', cursor: 'pointer', fontSize: 11, fontFamily: '"Courier New", monospace' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

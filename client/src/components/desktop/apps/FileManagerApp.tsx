import { useState, useCallback } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { virtualFS, VirtualFile } from '@/lib/virtualFilesystem';
import { moveToTrash } from '@/lib/trashStore';
import {
  Folder, FileText, ArrowUp, Home, RefreshCw, Lock,
  Terminal as TerminalIcon, Plus, Trash2, Edit2, X, Check
} from 'lucide-react';

export interface FileManagerAppProps {
  windowId: string;
  onOpenFile?: (filePath: string, content: string) => void;
}

export function FileManagerApp({ windowId, onOpenFile }: FileManagerAppProps) {
  const { colors, accentColors } = useCrtTheme();
  const [currentPath, setCurrentPath] = useState('/home/student');
  const [files, setFiles] = useState<VirtualFile[]>(() => virtualFS.listDirectory('/home/student'));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const refreshFiles = useCallback((path?: string) => {
    const target = path ?? currentPath;
    const list = virtualFS.listDirectory(target);
    setFiles(list);
  }, [currentPath]);

  const flash = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const navigateTo = (path: string) => {
    const result = virtualFS.changeDirectory(path);
    if (result.success) {
      const newPath = virtualFS.getCurrentPath();
      setCurrentPath(newPath);
      setFiles(virtualFS.listDirectory());
      setSelectedPath(null);
    }
  };

  const handleDoubleClick = (file: VirtualFile) => {
    if (file.type === 'directory') {
      navigateTo(file.path);
    } else if (file.type === 'file' || file.type === 'executable') {
      const result = virtualFS.readFile(file.path);
      if (result.success && onOpenFile) {
        onOpenFile(file.path, result.content ?? '');
      } else if (!onOpenFile) {
        flash(`Cannot open: no viewer registered`);
      } else {
        flash(result.error ?? 'Cannot read file');
      }
    }
  };

  const handleDelete = useCallback((file: VirtualFile) => {
    if (file.permissions === 'locked' || file.permissions === 'read') {
      flash(`Permission denied: ${file.name}`);
      return;
    }
    const readResult = virtualFS.readFile(file.path);
    moveToTrash({ name: file.name, path: file.path, content: readResult.success ? readResult.content : undefined, type: file.type === 'directory' ? 'directory' : 'file' });
    const deleteResult = virtualFS.deleteFile(file.path);
    if (deleteResult.success) {
      flash(`Moved "${file.name}" to Recycle Bin`);
    } else {
      flash(`Could not delete: ${deleteResult.error}`);
    }
    setSelectedPath(null);
    refreshFiles();
  }, [refreshFiles]);

  const handleCreateFile = () => {
    const name = newFileName.trim();
    if (!name) return;
    const path = `${currentPath}/${name}`;
    const result = virtualFS.writeFile(path, '');
    if (result.success) {
      flash(`Created "${name}"`);
      refreshFiles();
    } else {
      flash(result.error ?? 'Could not create file');
    }
    setNewFileName('');
    setShowNewFile(false);
  };

  const startRename = (file: VirtualFile) => {
    setRenamingPath(file.path);
    setRenameValue(file.name);
  };

  const confirmRename = (file: VirtualFile) => {
    const newName = renameValue.trim();
    if (!newName || newName === file.name) { setRenamingPath(null); return; }
    const newPath = `${currentPath}/${newName}`;
    const readResult = virtualFS.readFile(file.path);
    const writeResult = virtualFS.writeFile(newPath, readResult.content ?? '');
    if (writeResult.success) {
      virtualFS.deleteFile(file.path);
      flash(`Renamed to "${newName}"`);
      refreshFiles();
    } else {
      flash(`Rename failed: ${writeResult.error}`);
    }
    setRenamingPath(null);
  };

  const filteredFiles = showHidden ? files : files.filter(f => !f.name.startsWith('.'));

  const formatPath = (path: string) => path.replace('/home/student', '~');

  const getIcon = (file: VirtualFile) => {
    if (file.permissions === 'locked') return <Lock size={15} color={accentColors.red} />;
    switch (file.type) {
      case 'directory': return <Folder size={15} color={accentColors.amber} />;
      case 'executable': return <TerminalIcon size={15} color={accentColors.green} />;
      default: return <FileText size={15} color={accentColors.cyan} />;
    }
  };

  const toolBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${colors.primary}40`,
    color: colors.primary,
    padding: '4px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontFamily: '"Courier New", monospace',
    flexShrink: 0,
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colors.background, color: colors.primary, fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderBottom: `1px solid ${colors.primary}30`, background: `${colors.primary}06`, flexShrink: 0, flexWrap: 'wrap' }}>
        <button title="Up" onClick={() => navigateTo('..')} disabled={currentPath === '/'} style={{ ...toolBtnStyle, opacity: currentPath === '/' ? 0.4 : 1 }}><ArrowUp size={13} /></button>
        <button title="Home" onClick={() => navigateTo('/home/student')} style={toolBtnStyle}><Home size={13} /></button>
        <button title="Refresh" onClick={() => refreshFiles()} style={toolBtnStyle}><RefreshCw size={13} /></button>

        <div style={{ flex: 1, minWidth: 80, padding: '3px 10px', background: `${colors.primary}08`, border: `1px solid ${colors.primary}25`, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatPath(currentPath)}
        </div>

        <button title="New file" onClick={() => setShowNewFile(!showNewFile)} style={{ ...toolBtnStyle, color: accentColors.green, borderColor: `${accentColors.green}50` }}>
          <Plus size={13} />New
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: `${colors.primary}70`, cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} style={{ accentColor: colors.primary }} />
          Hidden
        </label>
      </div>

      {showNewFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderBottom: `1px solid ${colors.primary}20`, background: `${accentColors.green}08`, flexShrink: 0 }}>
          <Plus size={12} color={accentColors.green} />
          <input
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFile(); if (e.key === 'Escape') setShowNewFile(false); }}
            placeholder="filename.txt"
            style={{ flex: 1, background: `${colors.primary}10`, border: `1px solid ${accentColors.green}50`, color: colors.primary, fontFamily: '"Courier New", monospace', fontSize: 12, padding: '4px 8px', outline: 'none' }}
          />
          <button onClick={handleCreateFile} style={{ ...toolBtnStyle, color: accentColors.green, borderColor: `${accentColors.green}50` }}><Check size={12} /></button>
          <button onClick={() => setShowNewFile(false)} style={{ ...toolBtnStyle, color: `${colors.primary}60` }}><X size={12} /></button>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
        {filteredFiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: `${colors.primary}45`, fontSize: 12 }}>Directory is empty</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => setSelectedPath(selectedPath === file.path ? null : file.path)}
                onDoubleClick={() => handleDoubleClick(file)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  background: selectedPath === file.path ? `${colors.primary}18` : 'transparent',
                  border: selectedPath === file.path ? `1px solid ${colors.primary}40` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                {getIcon(file)}

                {renamingPath === file.path ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(file); if (e.key === 'Escape') setRenamingPath(null); }}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => confirmRename(file)}
                    style={{ flex: 1, background: `${colors.primary}15`, border: `1px solid ${colors.primary}50`, color: colors.primary, fontFamily: '"Courier New", monospace', fontSize: 12, padding: '2px 6px', outline: 'none' }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: 12, color: file.type === 'directory' ? accentColors.amber : colors.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}{file.type === 'directory' ? '/' : ''}
                  </span>
                )}

                <span style={{ fontSize: 10, color: `${colors.primary}50`, flexShrink: 0 }}>
                  {file.type === 'directory' ? 'DIR' : file.metadata?.size != null ? `${file.metadata.size}B` : 'FILE'}
                </span>

                {selectedPath === file.path && renamingPath !== file.path && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {file.type === 'file' && onOpenFile && (
                      <button
                        title="Open in Notepad"
                        onClick={() => handleDoubleClick(file)}
                        style={{ background: `${accentColors.cyan}15`, border: `1px solid ${accentColors.cyan}40`, color: accentColors.cyan, padding: '2px 7px', cursor: 'pointer', fontSize: 10, fontFamily: '"Courier New", monospace' }}
                      >
                        Open
                      </button>
                    )}
                    {file.permissions === 'write' && (
                      <>
                        <button
                          title="Rename"
                          onClick={() => startRename(file)}
                          style={{ background: 'transparent', border: `1px solid ${colors.primary}40`, color: `${colors.primary}80`, padding: '2px 6px', cursor: 'pointer', fontSize: 10 }}
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          title="Move to Recycle Bin"
                          onClick={() => handleDelete(file)}
                          style={{ background: `${accentColors.red}10`, border: `1px solid ${accentColors.red}40`, color: accentColors.red, padding: '2px 6px', cursor: 'pointer', fontSize: 10 }}
                        >
                          <Trash2 size={10} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '5px 12px', borderTop: `1px solid ${colors.primary}30`, background: `${colors.primary}05`, fontSize: 10, color: `${colors.primary}60`, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span>{statusMsg || `${filteredFiles.length} item${filteredFiles.length !== 1 ? 's' : ''}`}</span>
        <span>Double-click to open · Del icon to trash</span>
      </div>
    </div>
  );
}

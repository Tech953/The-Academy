import { useState, useCallback, useEffect, useRef } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { virtualFS, VirtualFile } from '@/lib/virtualFilesystem';
import { moveToTrash } from '@/lib/trashStore';
import {
  Folder, FileText, ArrowUp, Home, RefreshCw, Lock, FolderPlus,
  Terminal as TerminalIcon, Plus, Trash2, Edit2, X, Check, Copy, Eye, EyeOff,
  Upload, Download,
} from 'lucide-react';

export interface FileManagerAppProps {
  windowId: string;
  onOpenFile?: (filePath: string, content: string) => void;
  onOpenInWordProcessor?: (filePath: string) => void;
}

type SortKey = 'name' | 'type' | 'size';

export function FileManagerApp({ windowId, onOpenFile, onOpenInWordProcessor }: FileManagerAppProps) {
  const { colors, accentColors } = useCrtTheme();
  const c = colors.primary;

  const [currentPath, setCurrentPath] = useState('/home/student');
  const [files, setFiles] = useState<VirtualFile[]>(() => virtualFS.listDirectory('/home/student'));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [showPreview, setShowPreview] = useState(true);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [copySource, setCopySource] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

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
      setPreviewContent(null);
      setPreviewPath(null);
    }
  };

  const loadPreview = useCallback((file: VirtualFile) => {
    if (file.type === 'directory' || file.type === 'locked') { setPreviewContent(null); setPreviewPath(null); return; }
    const result = virtualFS.readFile(file.path);
    if (result.success && result.content) {
      setPreviewPath(file.path);
      // For .acd files, try to parse and show title + preview
      if (file.name.endsWith('.acd')) {
        try {
          const doc = JSON.parse(result.content);
          const title = doc.title ?? '(untitled)';
          const blocks = (doc.blocks ?? []).map((b: { content?: string }) => b.content ?? '').filter(Boolean).join('\n');
          setPreviewContent(`[ACADEMY DOC] ${title}\n\n${blocks.slice(0, 600)}${blocks.length > 600 ? '\n…' : ''}`);
        } catch {
          setPreviewContent(result.content.slice(0, 800));
        }
      } else {
        setPreviewContent(result.content.slice(0, 800));
      }
    } else {
      setPreviewContent(null);
      setPreviewPath(null);
    }
  }, []);

  const handleSelect = useCallback((file: VirtualFile) => {
    setSelectedPath(selectedPath === file.path ? null : file.path);
    if (file.type !== 'directory') loadPreview(file);
  }, [selectedPath, loadPreview]);

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
      if (selectedPath === file.path) { setSelectedPath(null); setPreviewContent(null); }
    } else {
      flash(`Could not delete: ${deleteResult.error}`);
    }
    refreshFiles();
  }, [refreshFiles, selectedPath]);

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

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const path = `${currentPath}/${name}`;
    const result = virtualFS.mkdir(path);
    if (result.success) {
      flash(`Created folder "${name}"`);
      refreshFiles();
    } else {
      flash(result.error ?? 'Could not create folder');
    }
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleCopy = useCallback((file: VirtualFile) => {
    setCopySource(file.path);
    flash(`Copied "${file.name}" — navigate to destination and Paste`);
  }, []);

  const handlePaste = useCallback(() => {
    if (!copySource) return;
    const srcName = copySource.split('/').pop() ?? 'copy';
    const destPath = `${currentPath}/${srcName}`;
    const readResult = virtualFS.readFile(copySource);
    if (!readResult.success) { flash('Cannot read source file'); return; }
    const writeResult = virtualFS.writeFile(destPath, readResult.content ?? '');
    if (writeResult.success) {
      flash(`Pasted "${srcName}"`);
      refreshFiles();
    } else {
      flash(writeResult.error ?? 'Paste failed');
    }
  }, [copySource, currentPath, refreshFiles]);

  const handleUploadFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    let imported = 0;
    let failed = 0;
    const promises = Array.from(fileList).map(file => {
      return new Promise<void>(resolve => {
        const reader = new FileReader();
        reader.onload = ev => {
          const content = ev.target?.result as string ?? '';
          const destPath = `${currentPath}/${file.name}`;
          const result = virtualFS.writeFile(destPath, content);
          if (result.success) imported++;
          else failed++;
          resolve();
        };
        reader.onerror = () => { failed++; resolve(); };
        reader.readAsText(file);
      });
    });
    Promise.all(promises).then(() => {
      refreshFiles();
      flash(failed > 0
        ? `Imported ${imported} file${imported !== 1 ? 's' : ''}, ${failed} failed`
        : `Imported ${imported} file${imported !== 1 ? 's' : ''}`);
    });
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  }, [currentPath, refreshFiles]);

  const handleDownload = useCallback((file: VirtualFile) => {
    const result = virtualFS.readFile(file.path);
    if (!result.success || result.content == null) { flash('Cannot read file for download'); return; }
    const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    flash(`Downloaded "${file.name}"`);
  }, []);

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

  const sorted = [...(showHidden ? files : files.filter(f => !f.name.startsWith('.')))].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (b.type === 'directory' && a.type !== 'directory') return 1;
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    if (sortKey === 'size') return (a.metadata?.size ?? 0) - (b.metadata?.size ?? 0);
    if (sortKey === 'type') return a.type.localeCompare(b.type);
    return 0;
  });

  const formatPath = (path: string) => path.replace('/home/student', '~');

  const getIcon = (file: VirtualFile) => {
    if (file.permissions === 'locked') return <Lock size={14} color={accentColors.red} />;
    if (file.type === 'directory') return <Folder size={14} color={accentColors.amber} />;
    if (file.type === 'executable') return <TerminalIcon size={14} color={accentColors.green} />;
    if (file.name.endsWith('.acd')) return <FileText size={14} color={accentColors.purple} />;
    return <FileText size={14} color={accentColors.cyan} />;
  };

  const toolBtnStyle: React.CSSProperties = {
    background: 'transparent', border: `1px solid ${c}40`, color: c,
    padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: 4, fontSize: 11, fontFamily: '"Courier New", monospace', flexShrink: 0,
  };

  const selectedFile = sorted.find(f => f.path === selectedPath) ?? null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colors.background, color: c, fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>

      {/* Hidden file input for upload */}
      <input
        ref={uploadInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleUploadFiles}
      />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', borderBottom: `1px solid ${c}30`, background: `${c}06`, flexShrink: 0, flexWrap: 'wrap' }}>
        <button title="Up" onClick={() => navigateTo('..')} disabled={currentPath === '/'} style={{ ...toolBtnStyle, opacity: currentPath === '/' ? 0.4 : 1 }}><ArrowUp size={13} /></button>
        <button title="Home" onClick={() => navigateTo('/home/student')} style={toolBtnStyle}><Home size={13} /></button>
        <button title="Refresh" onClick={() => refreshFiles()} style={toolBtnStyle}><RefreshCw size={13} /></button>

        <div style={{ flex: 1, minWidth: 60, padding: '3px 8px', background: `${c}08`, border: `1px solid ${c}25`, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatPath(currentPath)}
        </div>

        {copySource && (
          <button title="Paste copy here" onClick={handlePaste} style={{ ...toolBtnStyle, color: accentColors.amber, borderColor: `${accentColors.amber}50` }}>
            <Copy size={12} />PASTE
          </button>
        )}

        <button title="Upload files from your computer" onClick={() => uploadInputRef.current?.click()} style={{ ...toolBtnStyle, color: accentColors.cyan, borderColor: `${accentColors.cyan}50` }}>
          <Upload size={12} />UPLOAD
        </button>
        <button title="New file" onClick={() => { setShowNewFile(!showNewFile); setShowNewFolder(false); }} style={{ ...toolBtnStyle, color: accentColors.green, borderColor: `${accentColors.green}50` }}>
          <Plus size={12} />FILE
        </button>
        <button title="New folder" onClick={() => { setShowNewFolder(!showNewFolder); setShowNewFile(false); }} style={{ ...toolBtnStyle, color: accentColors.amber, borderColor: `${accentColors.amber}50` }}>
          <FolderPlus size={12} />DIR
        </button>
        <button title="Toggle preview" onClick={() => setShowPreview(p => !p)} style={{ ...toolBtnStyle, color: showPreview ? c : `${c}50` }}>
          {showPreview ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        {/* Sort */}
        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
          style={{ background: `${c}08`, border: `1px solid ${c}30`, color: c,
            fontFamily: '"Courier New", monospace', fontSize: 10, padding: '3px 5px', cursor: 'pointer' }}>
          <option value="name">A-Z</option>
          <option value="size">Size</option>
          <option value="type">Type</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: `${c}60`, cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} style={{ accentColor: c }} />
          Hidden
        </label>
      </div>

      {/* New file row */}
      {showNewFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderBottom: `1px solid ${c}20`, background: `${accentColors.green}08`, flexShrink: 0 }}>
          <Plus size={12} color={accentColors.green} />
          <input autoFocus value={newFileName} onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateFile(); if (e.key === 'Escape') setShowNewFile(false); }}
            placeholder="filename.txt"
            style={{ flex: 1, background: `${c}10`, border: `1px solid ${accentColors.green}50`, color: c,
              fontFamily: '"Courier New", monospace', fontSize: 11, padding: '4px 8px', outline: 'none' }} />
          <button onClick={handleCreateFile} style={{ ...toolBtnStyle, color: accentColors.green, borderColor: `${accentColors.green}50` }}><Check size={12} /></button>
          <button onClick={() => setShowNewFile(false)} style={{ ...toolBtnStyle, color: `${c}60` }}><X size={12} /></button>
        </div>
      )}

      {/* New folder row */}
      {showNewFolder && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderBottom: `1px solid ${c}20`, background: `${accentColors.amber}08`, flexShrink: 0 }}>
          <FolderPlus size={12} color={accentColors.amber} />
          <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
            placeholder="folder-name"
            style={{ flex: 1, background: `${c}10`, border: `1px solid ${accentColors.amber}50`, color: c,
              fontFamily: '"Courier New", monospace', fontSize: 11, padding: '4px 8px', outline: 'none' }} />
          <button onClick={handleCreateFolder} style={{ ...toolBtnStyle, color: accentColors.amber, borderColor: `${accentColors.amber}50` }}><Check size={12} /></button>
          <button onClick={() => setShowNewFolder(false)} style={{ ...toolBtnStyle, color: `${c}60` }}><X size={12} /></button>
        </div>
      )}

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* File list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 5 }}>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px',
            borderBottom: `1px solid ${c}15`, fontSize: 9, color: `${c}40`, letterSpacing: 1, marginBottom: 2 }}>
            <span style={{ flex: 1 }}>NAME</span>
            <span style={{ width: 48, textAlign: 'right' }}>SIZE</span>
            <span style={{ width: 44, textAlign: 'right' }}>TYPE</span>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: `${c}35`, fontSize: 11 }}>Directory is empty</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sorted.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleSelect(file)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px',
                    background: selectedPath === file.path ? `${c}18` : 'transparent',
                    border: selectedPath === file.path ? `1px solid ${c}40` : '1px solid transparent',
                    cursor: 'pointer',
                  }}>
                  {getIcon(file)}

                  {renamingPath === file.path ? (
                    <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmRename(file); if (e.key === 'Escape') setRenamingPath(null); }}
                      onClick={e => e.stopPropagation()} onBlur={() => confirmRename(file)}
                      style={{ flex: 1, background: `${c}15`, border: `1px solid ${c}50`, color: c,
                        fontFamily: '"Courier New", monospace', fontSize: 11, padding: '2px 5px', outline: 'none' }} />
                  ) : (
                    <span style={{ flex: 1, fontSize: 11, color: file.type === 'directory' ? accentColors.amber : c,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}{file.type === 'directory' ? '/' : ''}
                    </span>
                  )}

                  <span style={{ fontSize: 9, color: `${c}40`, width: 48, textAlign: 'right', flexShrink: 0 }}>
                    {file.type === 'directory' ? 'DIR' : file.metadata?.size != null ? `${file.metadata.size}B` : '—'}
                  </span>
                  <span style={{ fontSize: 9, color: `${c}35`, width: 44, textAlign: 'right', flexShrink: 0 }}>
                    {file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() ?? 'FILE' : file.type.toUpperCase()}
                  </span>

                  {selectedPath === file.path && renamingPath !== file.path && (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {file.type === 'file' && onOpenFile && (
                        <button onClick={() => handleDoubleClick(file)}
                          style={{ background: `${accentColors.cyan}15`, border: `1px solid ${accentColors.cyan}40`,
                            color: accentColors.cyan, padding: '2px 7px', cursor: 'pointer', fontSize: 9,
                            fontFamily: '"Courier New", monospace' }}>
                          Open
                        </button>
                      )}
                      {file.type === 'file' && file.name.endsWith('.acd') && onOpenInWordProcessor && (
                        <button onClick={() => onOpenInWordProcessor(file.path)}
                          style={{ background: `${accentColors.amber}10`, border: `1px solid ${accentColors.amber}40`,
                            color: accentColors.amber, padding: '2px 7px', cursor: 'pointer', fontSize: 9,
                            fontFamily: '"Courier New", monospace' }}>
                          WProc
                        </button>
                      )}
                      {file.type === 'file' && (
                        <button onClick={() => handleCopy(file)} title="Copy"
                          style={{ background: 'transparent', border: `1px solid ${c}35`, color: `${c}70`,
                            padding: '2px 5px', cursor: 'pointer' }}>
                          <Copy size={10} />
                        </button>
                      )}
                      {file.type === 'file' && (
                        <button onClick={() => handleDownload(file)} title="Download to computer"
                          style={{ background: `${accentColors.cyan}10`, border: `1px solid ${accentColors.cyan}35`,
                            color: accentColors.cyan, padding: '2px 5px', cursor: 'pointer' }}>
                          <Download size={10} />
                        </button>
                      )}
                      {file.permissions === 'write' && (
                        <>
                          <button onClick={() => startRename(file)} title="Rename"
                            style={{ background: 'transparent', border: `1px solid ${c}35`, color: `${c}70`,
                              padding: '2px 5px', cursor: 'pointer' }}>
                            <Edit2 size={10} />
                          </button>
                          <button onClick={() => handleDelete(file)} title="Trash"
                            style={{ background: `${accentColors.red}10`, border: `1px solid ${accentColors.red}35`,
                              color: accentColors.red, padding: '2px 5px', cursor: 'pointer' }}>
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

        {/* Preview pane */}
        {showPreview && (
          <div style={{ width: 200, borderLeft: `1px solid ${c}20`, display: 'flex', flexDirection: 'column',
            background: `${c}04`, flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ padding: '5px 10px', borderBottom: `1px solid ${c}15`, fontSize: 9,
              color: `${c}50`, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={11} color={`${c}50`} />PREVIEW
            </div>

            {selectedFile && (
              <div style={{ padding: '8px 10px', borderBottom: `1px solid ${c}10`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {getIcon(selectedFile)}
                  <span style={{ fontSize: 11, color: c, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </span>
                </div>
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    ['Type', selectedFile.type],
                    ['Perm', selectedFile.permissions],
                    ['Size', selectedFile.metadata?.size != null ? `${selectedFile.metadata.size} B` : '—'],
                    ['Modified', selectedFile.metadata?.modifiedAt ? new Date(selectedFile.metadata.modifiedAt).toLocaleDateString() : '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 6, fontSize: 9 }}>
                      <span style={{ color: `${c}45`, width: 44 }}>{k}:</span>
                      <span style={{ color: `${c}80`, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
              {previewContent ? (
                <pre style={{ margin: 0, fontSize: 9, color: `${c}70`, fontFamily: '"Courier New", monospace',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                  {previewContent}
                </pre>
              ) : selectedFile && selectedFile.type !== 'directory' ? (
                <div style={{ fontSize: 9, color: `${c}30`, textAlign: 'center', paddingTop: 20 }}>
                  {selectedFile.permissions === 'locked' ? 'LOCKED — cannot preview' : 'No preview available'}
                </div>
              ) : (
                <div style={{ fontSize: 9, color: `${c}25`, textAlign: 'center', paddingTop: 20 }}>
                  Select a file to preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ padding: '4px 12px', borderTop: `1px solid ${c}25`, background: `${c}05`,
        fontSize: 9, color: `${c}55`, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexShrink: 0, gap: 8, flexWrap: 'wrap' }}>
        <span>{statusMsg || `${sorted.length} item${sorted.length !== 1 ? 's' : ''}`}</span>
        {copySource && <span style={{ color: accentColors.amber }}>CLIPBOARD: {copySource.split('/').pop()}</span>}
        <span>Dbl-click to open · Del to trash</span>
      </div>
    </div>
  );
}

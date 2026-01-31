import { useState, useEffect } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { virtualFS, VirtualFile } from '@/lib/virtualFilesystem';
import { 
  Folder, 
  File, 
  FileText, 
  ArrowUp, 
  Home, 
  RefreshCw,
  Lock,
  Terminal as TerminalIcon
} from 'lucide-react';

interface FileManagerAppProps {
  windowId: string;
}

export function FileManagerApp({ windowId }: FileManagerAppProps) {
  const { colors, accentColors } = useCrtTheme();
  const [currentPath, setCurrentPath] = useState(virtualFS.getCurrentPath());
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    refreshFiles();
  }, [currentPath, showHidden]);

  const refreshFiles = () => {
    const result = virtualFS.changeDirectory(currentPath);
    if (result.success) {
      setFiles(virtualFS.listDirectory());
    }
  };

  const navigateTo = (path: string) => {
    const result = virtualFS.changeDirectory(path);
    if (result.success) {
      setCurrentPath(virtualFS.getCurrentPath());
      setSelectedFile(null);
    }
  };

  const goUp = () => {
    navigateTo('..');
  };

  const goHome = () => {
    navigateTo('/home/student');
  };

  const handleFileClick = (file: VirtualFile) => {
    setSelectedFile(file.path);
  };

  const handleFileDoubleClick = (file: VirtualFile) => {
    if (file.type === 'directory') {
      navigateTo(file.path);
    }
  };

  const getFileIcon = (file: VirtualFile) => {
    if (file.permissions === 'locked') {
      return <Lock size={16} color={accentColors.red} />;
    }
    switch (file.type) {
      case 'directory':
        return <Folder size={16} color={accentColors.amber} />;
      case 'executable':
        return <TerminalIcon size={16} color={accentColors.green} />;
      case 'file':
        return <FileText size={16} color={accentColors.cyan} />;
      default:
        return <File size={16} color={colors.primary} />;
    }
  };

  const filteredFiles = showHidden ? files : files.filter(f => !f.name.startsWith('.'));

  const formatPath = (path: string) => {
    return path.replace('/home/student', '~');
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: colors.background,
      color: colors.primary,
      fontFamily: '"Courier New", monospace',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderBottom: `1px solid ${colors.primary}40`,
        background: `${colors.primary}08`,
      }}>
        <button
          onClick={goUp}
          style={{
            background: 'transparent',
            border: `1px solid ${colors.primary}40`,
            color: colors.primary,
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
          }}
          title="Go up"
        >
          <ArrowUp size={14} />
        </button>
        <button
          onClick={goHome}
          style={{
            background: 'transparent',
            border: `1px solid ${colors.primary}40`,
            color: colors.primary,
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
          }}
          title="Home"
        >
          <Home size={14} />
        </button>
        <button
          onClick={refreshFiles}
          style={{
            background: 'transparent',
            border: `1px solid ${colors.primary}40`,
            color: colors.primary,
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
          }}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
        
        <div style={{
          flex: 1,
          padding: '4px 12px',
          background: `${colors.primary}10`,
          border: `1px solid ${colors.primary}30`,
          fontSize: '12px',
          color: colors.primary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {formatPath(currentPath)}
        </div>
        
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          color: `${colors.primary}80`,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            style={{ accentColor: colors.primary }}
          />
          Hidden
        </label>
      </div>
      
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px',
      }}>
        {filteredFiles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: `${colors.primary}60`,
            fontSize: '12px',
          }}>
            Directory is empty
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            {filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => handleFileClick(file)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  background: selectedFile === file.path ? `${colors.primary}20` : 'transparent',
                  border: selectedFile === file.path ? `1px solid ${colors.primary}40` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s ease',
                }}
              >
                {getFileIcon(file)}
                <span style={{ 
                  flex: 1,
                  fontSize: '12px',
                  color: file.type === 'directory' ? accentColors.amber : colors.primary,
                }}>
                  {file.name}
                  {file.type === 'directory' && '/'}
                  {file.type === 'executable' && '*'}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: `${colors.primary}60`,
                  textTransform: 'uppercase',
                }}>
                  {file.type === 'directory' ? 'DIR' : 
                   file.type === 'executable' ? 'EXE' : 
                   file.metadata?.size ? `${file.metadata.size}B` : 'FILE'}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: file.permissions === 'locked' ? accentColors.red :
                         file.permissions === 'write' ? accentColors.green :
                         `${colors.primary}60`,
                }}>
                  [{file.permissions === 'locked' ? 'L' : 
                    file.permissions === 'write' ? 'RW' : 
                    file.permissions === 'execute' ? 'X' : 'R'}]
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{
        padding: '6px 12px',
        borderTop: `1px solid ${colors.primary}40`,
        background: `${colors.primary}05`,
        fontSize: '10px',
        color: `${colors.primary}80`,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{filteredFiles.length} items</span>
        <span>Academy OS File System v1.0</span>
      </div>
    </div>
  );
}

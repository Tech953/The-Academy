import { useState } from 'react';
import { getIconComponent, IconType } from '../DesktopShell';
import { ArrowUp } from 'lucide-react';

interface FileItem {
  name: string;
  type: 'folder' | 'file' | 'app';
  iconType: IconType;
  children?: FileItem[];
  appId?: string;
}

interface FileExplorerProps {
  onOpenApp?: (appId: string) => void;
}

const FILE_SYSTEM: FileItem[] = [
  {
    name: 'My Documents',
    type: 'folder',
    iconType: 'folder',
    children: [
      { name: 'homework.txt', type: 'file', iconType: 'file' },
      { name: 'notes.txt', type: 'file', iconType: 'file' },
      { name: 'schedule.txt', type: 'file', iconType: 'file' },
    ],
  },
  {
    name: 'Programs',
    type: 'folder',
    iconType: 'folder',
    children: [
      { name: 'The Academy', type: 'app', iconType: 'academy', appId: 'academy' },
      { name: 'Calculator', type: 'app', iconType: 'calculator', appId: 'calculator' },
      { name: 'Notepad', type: 'app', iconType: 'notepad', appId: 'notepad' },
    ],
  },
  {
    name: 'Pictures',
    type: 'folder',
    iconType: 'folder',
    children: [
      { name: 'selfie.bmp', type: 'file', iconType: 'image' },
      { name: 'campus.bmp', type: 'file', iconType: 'image' },
    ],
  },
  {
    name: 'Music',
    type: 'folder',
    iconType: 'folder',
    children: [
      { name: 'playlist.m3u', type: 'file', iconType: 'music' },
    ],
  },
];

export default function FileExplorer({ onOpenApp }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const getCurrentFolder = (): FileItem[] => {
    let folder = FILE_SYSTEM;
    for (const segment of currentPath) {
      const found = folder.find(f => f.name === segment && f.type === 'folder');
      if (found?.children) {
        folder = found.children;
      }
    }
    return folder;
  };

  const navigateToFolder = (name: string) => {
    setCurrentPath([...currentPath, name]);
    setSelectedItem(null);
  };

  const navigateUp = () => {
    setCurrentPath(currentPath.slice(0, -1));
    setSelectedItem(null);
  };

  const handleDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.name);
    } else if (item.type === 'app' && item.appId && onOpenApp) {
      onOpenApp(item.appId);
    }
  };

  const currentFolder = getCurrentFolder();
  const pathString = 'C:\\' + currentPath.join('\\');

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#c0c0c0',
      fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
      fontSize: '11px',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        borderBottom: '1px solid #808080',
      }}>
        <button
          onClick={navigateUp}
          disabled={currentPath.length === 0}
          style={{
            width: '24px',
            height: '22px',
            background: 'linear-gradient(180deg, #c0c0c0 0%, #dfdfdf 50%, #c0c0c0 100%)',
            border: '2px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
            cursor: currentPath.length > 0 ? 'pointer' : 'default',
            opacity: currentPath.length > 0 ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowUp size={12} />
        </button>
        <div style={{
          flex: 1,
          padding: '2px 6px',
          background: '#ffffff',
          border: '2px solid',
          borderColor: '#808080 #ffffff #ffffff #808080',
          fontSize: '11px',
        }}>
          {pathString}
        </div>
      </div>

      {/* File List */}
      <div style={{
        flex: 1,
        background: '#ffffff',
        border: '2px solid',
        borderColor: '#808080 #ffffff #ffffff #808080',
        margin: '4px',
        overflow: 'auto',
        padding: '4px',
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignContent: 'flex-start',
        }}>
          {currentFolder.map((item) => (
            <div
              key={item.name}
              onClick={() => setSelectedItem(item.name)}
              onDoubleClick={() => handleDoubleClick(item)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '70px',
                padding: '4px',
                cursor: 'pointer',
                background: selectedItem === item.name ? '#000080' : 'transparent',
              }}
            >
              <span style={{ 
                color: selectedItem === item.name ? '#ffffff' : '#000000',
                marginBottom: '4px',
              }}>
                {getIconComponent(item.iconType, 28)}
              </span>
              <span style={{
                fontSize: '11px',
                color: selectedItem === item.name ? '#ffffff' : '#000000',
                textAlign: 'center',
                wordBreak: 'break-word',
              }}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '2px 8px',
        borderTop: '1px solid #808080',
        fontSize: '10px',
      }}>
        {currentFolder.length} object(s)
      </div>
    </div>
  );
}

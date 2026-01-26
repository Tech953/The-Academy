import { useState } from 'react';

interface NotepadProps {
  initialContent?: string;
  fileName?: string;
}

export default function Notepad({ initialContent = '', fileName = 'Untitled' }: NotepadProps) {
  const [content, setContent] = useState(initialContent);
  const [currentFileName, setCurrentFileName] = useState(fileName);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleNew = () => {
    if (hasChanges && !confirm('You have unsaved changes. Continue?')) return;
    setContent('');
    setCurrentFileName('Untitled');
    setHasChanges(false);
  };

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
      {/* Menu Bar */}
      <div style={{
        display: 'flex',
        gap: '0',
        padding: '2px 4px',
        borderBottom: '1px solid #808080',
      }}>
        <button style={{
          background: 'transparent',
          border: 'none',
          padding: '2px 8px',
          cursor: 'pointer',
          fontSize: '11px',
        }}>
          <u>F</u>ile
        </button>
        <button style={{
          background: 'transparent',
          border: 'none',
          padding: '2px 8px',
          cursor: 'pointer',
          fontSize: '11px',
        }}>
          <u>E</u>dit
        </button>
        <button style={{
          background: 'transparent',
          border: 'none',
          padding: '2px 8px',
          cursor: 'pointer',
          fontSize: '11px',
        }}>
          <u>H</u>elp
        </button>
      </div>

      {/* Text Area */}
      <div style={{ flex: 1, padding: '2px' }}>
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Type here..."
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid',
            borderColor: '#808080 #ffffff #ffffff #808080',
            background: '#ffffff',
            resize: 'none',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '12px',
            padding: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '2px 8px',
        borderTop: '1px solid #808080',
        fontSize: '10px',
        color: '#000000',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{currentFileName}{hasChanges ? ' *' : ''}</span>
        <span>Ln 1, Col 1</span>
      </div>
    </div>
  );
}

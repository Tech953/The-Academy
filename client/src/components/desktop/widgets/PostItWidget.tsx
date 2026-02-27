import { useState, useEffect, useRef } from 'react';

interface PostItWidgetProps {
  primaryColor: string;
  widgetId?: string;
}

export function PostItWidget({ primaryColor, widgetId = 'w-note' }: PostItWidgetProps) {
  const storageKey = `academy-postit-${widgetId}`;
  const [text, setText] = useState<string>(() => localStorage.getItem(storageKey) ?? '');
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    localStorage.setItem(storageKey, text);
    setEditing(false);
  };

  const preview = text.trim() || '[ click to write a note ]';
  const lines = preview.split('\n').slice(0, 4);

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); if (!editing) setEditing(true); }}
      style={{
        width: 130,
        height: 120,
        background: `linear-gradient(135deg, #1a1a0a 0%, #0f0f05 100%)`,
        border: `1px solid ${primaryColor}60`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.7), inset 0 1px 0 ${primaryColor}20`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: editing ? 'text' : 'pointer',
        position: 'relative',
      }}
    >
      <div style={{
        height: 20,
        background: `${primaryColor}22`,
        borderBottom: `1px solid ${primaryColor}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 8, color: `${primaryColor}80`, letterSpacing: 1, fontFamily: 'monospace' }}>
          POST-IT NOTE
        </span>
        {editing && (
          <button
            onMouseDown={e => { e.stopPropagation(); e.preventDefault(); handleSave(); }}
            style={{
              background: `${primaryColor}30`, border: `1px solid ${primaryColor}60`,
              color: primaryColor, fontSize: 7, padding: '1px 5px',
              cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 0.5,
            }}
          >
            SAVE
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') handleSave(); if (e.key === 'Enter' && e.ctrlKey) handleSave(); }}
          onBlur={handleSave}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: primaryColor,
            fontFamily: '"Courier New", monospace',
            fontSize: 10,
            padding: '6px',
            lineHeight: 1.4,
          }}
          placeholder="Type your note..."
        />
      ) : (
        <div style={{
          flex: 1,
          padding: '6px',
          overflow: 'hidden',
        }}>
          {lines.map((line, i) => (
            <div key={i} style={{
              fontSize: 10,
              color: text.trim() ? primaryColor : `${primaryColor}40`,
              fontFamily: '"Courier New", monospace',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {line || '\u00a0'}
            </div>
          ))}
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 4,
        right: 5,
        fontSize: 7,
        color: `${primaryColor}30`,
        fontFamily: 'monospace',
      }}>
        {text.length > 0 ? `${text.length}ch` : 'ESC/CTRL+↵ to save'}
      </div>
    </div>
  );
}

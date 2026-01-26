import { useCrtTheme, CrtMode, CRT_MODE_LABELS } from '@/contexts/CrtThemeContext';
import { Sun, Sunrise, Moon, Monitor, Check } from 'lucide-react';

const MODE_ICONS: Record<CrtMode, typeof Sun> = {
  dawn: Sunrise,
  day: Sun,
  night: Moon,
};

const MODE_DESCRIPTIONS: Record<CrtMode, string> = {
  dawn: 'Soft mint tones for early morning sessions',
  day: 'Classic bright green for standard operation',
  night: 'Deep emerald for reduced eye strain',
};

export default function SettingsApp() {
  const { mode, setMode, colors, accentColors } = useCrtTheme();

  const modes: CrtMode[] = ['dawn', 'day', 'night'];

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: '#0a0a0a',
        color: colors.primary,
        fontFamily: '"Courier New", monospace',
        padding: '20px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          borderBottom: `1px solid ${colors.primary}40`,
          paddingBottom: '15px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Monitor size={24} color={colors.primary} />
        <h2
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: `0 0 10px ${colors.primaryGlow}`,
          }}
        >
          Display Settings
        </h2>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3
          style={{
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '15px',
            opacity: 0.8,
          }}
        >
          CRT Shader Mode
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {modes.map((m) => {
            const Icon = MODE_ICONS[m];
            const isSelected = mode === m;

            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="hover-elevate"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px 20px',
                  backgroundColor: isSelected ? `${colors.primary}15` : 'transparent',
                  border: `1px solid ${isSelected ? colors.primary : colors.primary + '40'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? `${colors.primary}20` : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${colors.primary}60`,
                  }}
                >
                  <Icon size={20} color={colors.primary} />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: colors.primary,
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    {CRT_MODE_LABELS[m]}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.primaryDim,
                      opacity: 0.8,
                    }}
                  >
                    {MODE_DESCRIPTIONS[m]}
                  </div>
                </div>

                {isSelected && (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={14} color="#000" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: '15px',
          backgroundColor: `${colors.primary}08`,
          border: `1px solid ${colors.primary}30`,
          borderRadius: '4px',
        }}
      >
        <h4
          style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12px',
            opacity: 0.7,
          }}
        >
          Color Preview
        </h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(accentColors).map(([name, color]) => (
            <div
              key={name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '4px',
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}60`,
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  opacity: 0.6,
                }}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: '25px',
          padding: '12px',
          backgroundColor: `${accentColors.amber}10`,
          border: `1px solid ${accentColors.amber}30`,
          borderRadius: '4px',
          fontSize: '12px',
          color: accentColors.amber,
        }}
      >
        Settings are saved automatically and will persist between sessions.
      </div>
    </div>
  );
}

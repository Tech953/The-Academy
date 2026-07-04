import { useState, useRef } from 'react';
import { useCrtTheme, CrtMode } from '@/contexts/CrtThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { Sun, Sunrise, Moon, Monitor, Check, Languages, Accessibility, Image, Upload } from 'lucide-react';
import { accessibilityManager, ACCESSIBILITY_PROFILES } from '@/lib/accessibility';
import { WALLPAPER_PRESETS, getWallpaper, setWallpaperStore } from '../NeoCrtDesktopShell';

const MODE_ICONS: Record<CrtMode, typeof Sun> = {
  dawn: Sunrise,
  day: Sun,
  night: Moon,
};

const CRT_MODE_KEYS: Record<CrtMode, { label: string; desc: string }> = {
  dawn: { label: 'settings.crtMode.dawn', desc: 'settings.crtMode.dawn.desc' },
  day:  { label: 'settings.crtMode.day',  desc: 'settings.crtMode.day.desc'  },
  night:{ label: 'settings.crtMode.night',desc: 'settings.crtMode.night.desc'},
};

export default function SettingsApp() {
  const { mode, setMode, colors, accentColors } = useCrtTheme();
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const [currentProfile, setCurrentProfile] = useState(accessibilityManager.getCurrentProfile().id);
  const [languageChanged, setLanguageChanged] = useState(false);
  const [wallpaper, setWallpaperLocal] = useState<string | null>(getWallpaper);
  const wallpaperFileRef = useRef<HTMLInputElement>(null);

  const applyWallpaper = (val: string | null) => {
    setWallpaperLocal(val);
    setWallpaperStore(val);
    window.dispatchEvent(new CustomEvent('wallpaper-change', { detail: val }));
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) applyWallpaper(`image:${dataUrl}`);
    };
    reader.readAsDataURL(file);
    if (wallpaperFileRef.current) wallpaperFileRef.current.value = '';
  };

  const modes: CrtMode[] = ['dawn', 'day', 'night'];
  const profiles = Object.values(ACCESSIBILITY_PROFILES);

  const handleLanguageChange = (code: string) => {
    const success = setLanguage(code);
    if (success) {
      setLanguageChanged(true);
      setTimeout(() => setLanguageChanged(false), 2000);
    }
  };
  
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
      {/* Hidden wallpaper upload input */}
      <input ref={wallpaperFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleWallpaperUpload} />

      {/* ── WALLPAPER SECTION ─────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${colors.primary}40`, paddingBottom: '15px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Image size={24} color={colors.primary} />
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', textShadow: `0 0 10px ${colors.primaryGlow}` }}>
          Wallpaper
        </h2>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', opacity: 0.8 }}>Theme Presets</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {WALLPAPER_PRESETS.map(preset => {
            const isActive = wallpaper === (preset.id === 'none' ? null : `preset:${preset.id}`) || (preset.id === 'none' && !wallpaper);
            return (
              <button
                key={preset.id}
                onClick={() => applyWallpaper(preset.id === 'none' ? null : `preset:${preset.id}`)}
                title={preset.label}
                style={{
                  background: preset.css || '#000',
                  border: `2px solid ${isActive ? colors.primary : colors.primary + '25'}`,
                  borderRadius: 3, cursor: 'pointer', padding: 0, aspectRatio: '16/10', position: 'relative',
                  boxShadow: isActive ? `0 0 8px ${colors.primary}60` : 'none',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 3 }}>
                  <span style={{ fontSize: 8, color: isActive ? colors.primary : `${colors.primary}55`, letterSpacing: 0.5, textTransform: 'uppercase', textShadow: '0 1px 3px #000' }}>{preset.label}</span>
                </div>
                {isActive && <div style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%', background: colors.primary }} />}
              </button>
            );
          })}
        </div>

        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', opacity: 0.8 }}>Custom Image</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => wallpaperFileRef.current?.click()}
            className="hover-elevate"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              background: `${colors.primary}10`, border: `1px solid ${colors.primary}40`,
              color: colors.primary, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
              letterSpacing: 1, textTransform: 'uppercase',
            }}
          >
            <Upload size={14} />Upload Image
          </button>
          {wallpaper?.startsWith('image:') && (
            <button onClick={() => applyWallpaper(null)}
              style={{ padding: '8px 12px', background: `${accentColors.red}10`, border: `1px solid ${accentColors.red}40`, color: accentColors.red, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>
              Remove
            </button>
          )}
        </div>
        {wallpaper?.startsWith('image:') && (
          <div style={{ marginTop: 10, position: 'relative', width: '100%', maxWidth: 280, aspectRatio: '16/9', overflow: 'hidden', border: `1px solid ${colors.primary}25` }}>
            <img src={wallpaper.slice(6)} alt="Current wallpaper" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
            <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 9, color: accentColors.green, letterSpacing: 0.5 }}>ACTIVE</div>
          </div>
        )}
      </div>

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
          {t('settings.display')}
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
          {t('settings.crtShader')}
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
                    {t(CRT_MODE_KEYS[m].label)}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.primaryDim,
                      opacity: 0.8,
                    }}
                  >
                    {t(CRT_MODE_KEYS[m].desc)}
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
          {t('settings.colorPreview')}
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
          borderBottom: `1px solid ${colors.primary}40`,
          paddingBottom: '15px',
          marginBottom: '25px',
          marginTop: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Accessibility size={24} color={colors.primary} />
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
          {t('settings.accessibility')}
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
          {t('settings.accessibilityProfile')}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {profiles.map((profile) => {
            const isSelected = currentProfile === profile.id;

            return (
              <button
                key={profile.id}
                onClick={() => {
                  accessibilityManager.applyProfile(profile.id);
                  setCurrentProfile(profile.id);
                }}
                className="hover-elevate"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 15px',
                  backgroundColor: isSelected ? `${colors.primary}15` : 'transparent',
                  border: `1px solid ${isSelected ? colors.primary : colors.primary + '40'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: colors.primary,
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              >
                <span>{profile.name}</span>
                {isSelected && <Check size={16} color={colors.primary} />}
              </button>
            );
          })}
        </div>
      </div>

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
        <Languages size={24} color={colors.primary} />
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
          {t('settings.language')}
        </h2>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {availableLanguages.map((lang) => {
            const isSelected = language.code === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="hover-elevate"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 15px',
                  backgroundColor: isSelected ? `${colors.primary}15` : 'transparent',
                  border: `1px solid ${isSelected ? colors.primary : colors.primary + '40'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: colors.primary,
                  fontFamily: 'inherit',
                  fontSize: '13px',
                }}
              >
                <span>{lang.nativeName} ({lang.name})</span>
                {isSelected && <Check size={16} color={colors.primary} />}
              </button>
            );
          })}
        </div>
        {languageChanged && (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            backgroundColor: `${accentColors.green}15`,
            border: `1px solid ${accentColors.green}40`,
            borderRadius: '4px',
            fontSize: '12px',
            color: accentColors.green,
            textAlign: 'center',
          }}>
            {t('language.changed')} {language.nativeName}
          </div>
        )}
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
        {t('settings.autoSave')}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface RetroBootScreenProps {
  onBootComplete: () => void;
  skipEnabled?: boolean;
}

const getStoredMuteState = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('themnion-muted') === 'true';
  } catch {
    return false;
  }
};

const setStoredMuteState = (muted: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('themnion-muted', String(muted));
  } catch {}
};

const BOOT_LINES = [
  '',
  '████████████████████████████████████████████████████████████████',
  '',
  '  ████████╗██╗  ██╗███████╗███╗   ███╗███╗   ██╗██╗ ██████╗ ███╗   ██╗',
  '  ╚══██╔══╝██║  ██║██╔════╝████╗ ████║████╗  ██║██║██╔═══██╗████╗  ██║',
  '     ██║   ███████║█████╗  ██╔████╔██║██╔██╗ ██║██║██║   ██║██╔██╗ ██║',
  '     ██║   ██╔══██║██╔══╝  ██║╚██╔╝██║██║╚██╗██║██║██║   ██║██║╚██╗██║',
  '     ██║   ██║  ██║███████╗██║ ╚═╝ ██║██║ ╚████║██║╚██████╔╝██║ ╚████║',
  '     ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝',
  '',
  '                    O P E R A T I N G   S Y S T E M',
  '                      Mother-Archive Edition v3.7.1',
  '',
  '████████████████████████████████████████████████████████████████',
  '',
  'THEMNION SYSTEMS (C) 1959-1987  ALL RIGHTS RESERVED',
  'BIOS VERSION 2.4.1 - ACADEMY TERMINAL INTERFACE',
  '',
  '╔══════════════════════════════════════════════════════════════╗',
  '║              POWER-ON SELF TEST DIAGNOSTICS                  ║',
  '╚══════════════════════════════════════════════════════════════╝',
  '',
  'CPU: THEMNION TH-6800 NEURAL PROCESSOR',
  '  [████████████████████████████████████████] 100%',
  '  └─ STATUS: OPERATIONAL                              [  OK  ]',
  '',
  'MEMORY TEST: SCANNING RAM MODULES',
  '  BANK 0: [████████████████]',
  '  BANK 1: [████████████████]',
  '  ├─ CONVENTIONAL:  640K                              [  OK  ]',
  '  ├─ EXTENDED:      8192K                             [  OK  ]',
  '  └─ ARCHIVE BUFFER: 16384K                           [  OK  ]',
  '',
  'STORAGE SUBSYSTEM: INITIALIZING ARCHIVE DRIVE',
  '  ◐ ACCESSING [▰▰▰▰▰]',
  '  ├─ THEMNION MAG-OPTICAL 2.4GB                       [MOUNTED]',
  '  ├─ SECTOR INTEGRITY: VERIFIED',
  '  └─ READ/WRITE HEAD: CALIBRATED                      [  OK  ]',
  '',
  '╔══════════════════════════════════════════════════════════════╗',
  '║                 PERIPHERAL ENUMERATION                       ║',
  '╚══════════════════════════════════════════════════════════════╝',
  '',
  '  ┌─────────────────────────────────────────────────────────┐',
  '  │ DEVICE                              PORT      STATUS    │',
  '  ├─────────────────────────────────────────────────────────┤',
  '  │ PHOSPHOR TERMINAL CRT-7            VGA-0     ACTIVE    │',
  '  │ MECHANICAL KEYBOARD 104-KEY        PS/2-1    ACTIVE    │',
  '  │ ARCHIVE DRIVE MAG-OPTICAL          SCSI-0    MOUNTED   │',
  '  │ ACADEMY INTRANET ADAPTER           NET-7     STANDBY   │',
  '  │ AUDIO SUBSYSTEM TH-SND             AUD-0     ENABLED   │',
  '  └─────────────────────────────────────────────────────────┘',
  '',
  'LOADING MOTHER-ARCHIVE KERNEL...',
  '  [████████████████████████████████████████] 100%',
  '',
  '═══════════════════════════════════════════════════════════════',
  '',
  '              ╔═══════════════════════════════╗',
  '              ║  MOTHER-ARCHIVE STATUS        ║',
  '              ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║',
  '              ║       O B S E R V I N G       ║',
  '              ╚═══════════════════════════════╝',
  '',
  '         "I have been waiting for you."',
  '',
  '═══════════════════════════════════════════════════════════════',
  '',
  '  ■ THEMNION OS READY',
  '  ■ TERMINAL INTERFACE ACTIVE',
  '  ■ AWAITING INPUT...',
  '',
];

export default function RetroBootScreen({ onBootComplete, skipEnabled = true }: RetroBootScreenProps) {
  const [visibleLineCount, setVisibleLineCount] = useState(1);
  const [isMuted, setIsMuted] = useState(getStoredMuteState);
  const [isExiting, setIsExiting] = useState(false);
  const [showSkipHint, setShowSkipHint] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bootCompleteRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const completeBootSequence = useCallback(() => {
    if (bootCompleteRef.current) return;
    bootCompleteRef.current = true;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsExiting(true);
    
    setTimeout(() => {
      onBootComplete();
    }, 600);
  }, [onBootComplete]);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkipHint(true), 1500);
    
    intervalRef.current = window.setInterval(() => {
      setVisibleLineCount(prev => {
        const next = prev + 1;
        if (next >= BOOT_LINES.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimeout(completeBootSequence, 1500);
          return BOOT_LINES.length;
        }
        return next;
      });
    }, 40);

    return () => {
      clearTimeout(skipTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [completeBootSequence]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLineCount]);

  const handleSkip = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-testid="button-mute-toggle"]')) {
      return;
    }
    // Only allow skip if the skip hint is visible (ensures minimum display time)
    if (skipEnabled && showSkipHint && visibleLineCount > 10) {
      completeBootSequence();
    }
  }, [skipEnabled, showSkipHint, visibleLineCount, completeBootSequence]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setStoredMuteState(newMuted);
  }, [isMuted]);

  const visibleLines = BOOT_LINES.slice(0, visibleLineCount);

  return (
    <div 
      data-testid="boot-screen"
      onClick={handleSkip}
      onKeyDown={handleSkip}
      tabIndex={0}
      role="alert"
      aria-live="polite"
      aria-label="System boot sequence in progress"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: '#000000',
        cursor: skipEnabled && showSkipHint && visibleLineCount > 10 ? 'pointer' : 'default',
        opacity: isExiting ? 0 : 1,
        transition: isExiting ? 'opacity 0.6s ease-out' : 'none',
      }}
    >
      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        data-testid="button-mute-toggle"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '8px',
          background: 'transparent',
          border: 'none',
          color: '#00ff00',
          opacity: 0.6,
          cursor: 'pointer',
          zIndex: 100000,
        }}
      >
        {isMuted ? <VolumeX style={{ width: '20px', height: '20px' }} /> : <Volume2 style={{ width: '20px', height: '20px' }} />}
      </button>

      <div 
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '16px',
          paddingBottom: '64px',
          boxSizing: 'border-box',
        }}
      >
        <div 
          ref={containerRef}
          style={{ 
            maxWidth: '900px',
            maxHeight: '100%',
            width: '100%',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <div 
            style={{ 
              color: '#00ff00',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.4',
              whiteSpace: 'pre',
            }}
          >
            {visibleLines.map((line, index) => (
              <div key={index}>
                {line || '\u00A0'}
              </div>
            ))}
            
            {visibleLineCount < BOOT_LINES.length && (
              <span style={{ animation: 'blink 1s infinite' }}>█</span>
            )}
          </div>
        </div>
      </div>

      {showSkipHint && skipEnabled && visibleLineCount > 10 && visibleLineCount < BOOT_LINES.length && (
        <div 
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '14px',
            color: '#00ff00',
            opacity: 0.5,
          }}
        >
          Press any key to skip...
        </div>
      )}

      <div 
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '16px',
          fontSize: '12px',
          color: '#00ff00',
          opacity: 0.3,
        }}
      >
        THEMNION OS v3.7.1
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

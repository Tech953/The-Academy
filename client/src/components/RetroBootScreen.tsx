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
      className={`fixed inset-0 z-50 ${isExiting ? 'boot-exit' : ''}`}
      style={{ 
        backgroundColor: '#000000',
        cursor: skipEnabled && showSkipHint && visibleLineCount > 10 ? 'pointer' : 'default',
      }}
      role="alert"
      aria-live="polite"
      aria-label="System boot sequence in progress"
      data-testid="boot-screen"
      onClick={handleSkip}
      onKeyDown={handleSkip}
      tabIndex={0}
    >
      <style>{`
        .boot-exit {
          animation: bootFadeOut 0.6s ease-out forwards;
        }
        
        @keyframes bootFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .boot-cursor {
          animation: blink 1s infinite;
        }
      `}</style>
      
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100 transition-opacity z-50"
        style={{ color: '#00ff00' }}
        aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        data-testid="button-mute-toggle"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      <div 
        className="h-full w-full flex flex-col justify-end items-center p-4 md:p-8 pb-16"
      >
        <div 
          ref={containerRef}
          className="overflow-y-auto"
          style={{ 
            maxWidth: '900px',
            maxHeight: '100%',
            width: '100%',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
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
              <span className="boot-cursor">█</span>
            )}
          </div>
        </div>
      </div>

      {showSkipHint && skipEnabled && visibleLineCount > 10 && visibleLineCount < BOOT_LINES.length && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm opacity-50 animate-pulse"
          style={{ color: '#00ff00' }}
        >
          Press any key to skip...
        </div>
      )}

      <div 
        className="absolute bottom-2 right-4 text-xs opacity-30"
        style={{ color: '#00ff00' }}
      >
        THEMNION OS v3.7.1
      </div>
    </div>
  );
}

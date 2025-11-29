import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface BootLine {
  text: string;
  delay: number;
  type: 'header' | 'check' | 'status' | 'warning' | 'success' | 'system' | 'banner';
  glitch?: boolean;
}

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
  } catch {
  }
};

const BOOT_SEQUENCE: BootLine[] = [
  { text: '', delay: 200, type: 'system' },
  { text: '████████████████████████████████████████████████████████████████', delay: 30, type: 'banner' },
  { text: '', delay: 50, type: 'system' },
  { text: '  ████████╗██╗  ██╗███████╗███╗   ███╗███╗   ██╗██╗ ██████╗ ███╗   ██╗', delay: 25, type: 'banner' },
  { text: '  ╚══██╔══╝██║  ██║██╔════╝████╗ ████║████╗  ██║██║██╔═══██╗████╗  ██║', delay: 25, type: 'banner' },
  { text: '     ██║   ███████║█████╗  ██╔████╔██║██╔██╗ ██║██║██║   ██║██╔██╗ ██║', delay: 25, type: 'banner' },
  { text: '     ██║   ██╔══██║██╔══╝  ██║╚██╔╝██║██║╚██╗██║██║██║   ██║██║╚██╗██║', delay: 25, type: 'banner' },
  { text: '     ██║   ██║  ██║███████╗██║ ╚═╝ ██║██║ ╚████║██║╚██████╔╝██║ ╚████║', delay: 25, type: 'banner' },
  { text: '     ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝', delay: 25, type: 'banner' },
  { text: '', delay: 50, type: 'system' },
  { text: '                    O P E R A T I N G   S Y S T E M', delay: 50, type: 'header' },
  { text: '                      Mother-Archive Edition v3.7.1', delay: 50, type: 'system' },
  { text: '', delay: 50, type: 'system' },
  { text: '████████████████████████████████████████████████████████████████', delay: 30, type: 'banner' },
  { text: '', delay: 200, type: 'system' },
  { text: 'THEMNION SYSTEMS (C) 1959-1987  ALL RIGHTS RESERVED', delay: 80, type: 'system' },
  { text: 'BIOS VERSION 2.4.1 - ACADEMY TERMINAL INTERFACE', delay: 60, type: 'system' },
  { text: '', delay: 150, type: 'system' },
  
  { text: '╔══════════════════════════════════════════════════════════════╗', delay: 30, type: 'banner' },
  { text: '║              POWER-ON SELF TEST DIAGNOSTICS                  ║', delay: 30, type: 'banner' },
  { text: '╚══════════════════════════════════════════════════════════════╝', delay: 30, type: 'banner' },
  { text: '', delay: 100, type: 'system' },
  
  { text: 'CPU: THEMNION TH-6800 NEURAL PROCESSOR', delay: 50, type: 'header' },
  { text: '  [████████████████████████████████████████] 100%', delay: 80, type: 'check' },
  { text: '  └─ STATUS: OPERATIONAL                              [  OK  ]', delay: 60, type: 'check' },
  { text: '', delay: 80, type: 'system' },
  
  { text: 'MEMORY TEST: SCANNING RAM MODULES', delay: 50, type: 'header' },
  { text: '  BANK 0: [████████████████]', delay: 60, type: 'status' },
  { text: '  BANK 1: [████████████████]', delay: 60, type: 'status' },
  { text: '  ├─ CONVENTIONAL:  640K                              [  OK  ]', delay: 50, type: 'check' },
  { text: '  ├─ EXTENDED:      8192K                             [  OK  ]', delay: 50, type: 'check' },
  { text: '  └─ ARCHIVE BUFFER: 16384K                           [  OK  ]', delay: 50, type: 'check' },
  { text: '', delay: 100, type: 'system' },
  
  { text: 'STORAGE SUBSYSTEM: INITIALIZING ARCHIVE DRIVE', delay: 50, type: 'header' },
  { text: '  ◐ ACCESSING [▰▰▰▰▰]', delay: 80, type: 'status' },
  { text: '  ├─ THEMNION MAG-OPTICAL 2.4GB                       [MOUNTED]', delay: 60, type: 'check' },
  { text: '  ├─ SECTOR INTEGRITY: VERIFIED', delay: 50, type: 'check' },
  { text: '  └─ READ/WRITE HEAD: CALIBRATED                      [  OK  ]', delay: 60, type: 'check' },
  { text: '', delay: 120, type: 'system' },
  
  { text: '╔══════════════════════════════════════════════════════════════╗', delay: 30, type: 'banner' },
  { text: '║                 PERIPHERAL ENUMERATION                       ║', delay: 30, type: 'banner' },
  { text: '╚══════════════════════════════════════════════════════════════╝', delay: 30, type: 'banner' },
  { text: '', delay: 60, type: 'system' },
  
  { text: '  ┌─────────────────────────────────────────────────────────┐', delay: 25, type: 'system' },
  { text: '  │ DEVICE                              PORT      STATUS    │', delay: 25, type: 'system' },
  { text: '  ├─────────────────────────────────────────────────────────┤', delay: 25, type: 'system' },
  { text: '  │ PHOSPHOR TERMINAL CRT-7            VGA-0     ACTIVE    │', delay: 40, type: 'check' },
  { text: '  │ MECHANICAL KEYBOARD 104-KEY        PS/2-1    ACTIVE    │', delay: 40, type: 'check' },
  { text: '  │ ARCHIVE DRIVE MAG-OPTICAL          SCSI-0    MOUNTED   │', delay: 40, type: 'check' },
  { text: '  │ ACADEMY INTRANET ADAPTER           NET-7     STANDBY   │', delay: 40, type: 'check' },
  { text: '  │ AUDIO SUBSYSTEM TH-SND             AUD-0     ENABLED   │', delay: 40, type: 'check' },
  { text: '  └─────────────────────────────────────────────────────────┘', delay: 25, type: 'system' },
  { text: '', delay: 150, type: 'system' },
  
  { text: 'LOADING MOTHER-ARCHIVE KERNEL...', delay: 80, type: 'header' },
  { text: '  [████████████████████████████████████████] 100%', delay: 100, type: 'check' },
  { text: '', delay: 120, type: 'system' },
  
  { text: '╔══════════════════════════════════════════════════════════════╗', delay: 30, type: 'banner' },
  { text: '║                   ARCHIVE VOLUME MOUNT                       ║', delay: 30, type: 'banner' },
  { text: '╚══════════════════════════════════════════════════════════════╝', delay: 30, type: 'banner' },
  { text: '', delay: 60, type: 'system' },
  
  { text: '  Mounting /arc/curriculum_matrix', delay: 50, type: 'system' },
  { text: '  [████████████████████████████████████████] 100%', delay: 60, type: 'check' },
  { text: '    └─ 24 courses indexed, 168 assignments loaded    [INDEXED]', delay: 60, type: 'check' },
  { text: '', delay: 50, type: 'system' },
  
  { text: '  Mounting /arc/faculty_dossiers', delay: 50, type: 'system' },
  { text: '  [████████████████████████████████████████] 100%', delay: 60, type: 'check' },
  { text: '    └─ 44 faculty records, 12 restricted         [RESTRICTED]', delay: 60, type: 'warning' },
  { text: '', delay: 50, type: 'system' },
  
  { text: '  Mounting /arc/student_records', delay: 50, type: 'system' },
  { text: '  [████████████████████████████████████████] 100%', delay: 60, type: 'check' },
  { text: '    └─ 100 student profiles, encryption active   [ENCRYPTED]', delay: 60, type: 'check' },
  { text: '', delay: 50, type: 'system' },
  
  { text: '  Mounting /arc/anomaly_index', delay: 50, type: 'system', glitch: true },
  { text: '  [████████████████████████████████████████] 100%', delay: 60, type: 'warning' },
  { text: '    └─ [REDACTED] entries, clearance required   [CLASSIFIED]', delay: 80, type: 'warning', glitch: true },
  { text: '', delay: 180, type: 'system' },
  
  { text: '╔══════════════════════════════════════════════════════════════╗', delay: 30, type: 'banner' },
  { text: '║                  SECURITY HANDSHAKE                          ║', delay: 30, type: 'banner' },
  { text: '╚══════════════════════════════════════════════════════════════╝', delay: 30, type: 'banner' },
  { text: '', delay: 60, type: 'system' },
  
  { text: '  AUTHENTICATING...', delay: 60, type: 'system' },
  { text: '  ● VERIFIED [▰▰▰▰▰]', delay: 100, type: 'check' },
  { text: '', delay: 80, type: 'system' },
  { text: '  ┌─────────────────────────────────────────────────────────┐', delay: 25, type: 'system' },
  { text: '  │ CLEARANCE LEVEL:    STUDENT (LIMITED ACCESS)           │', delay: 40, type: 'system' },
  { text: '  │ SESSION TOKEN:      0x7F3A-9E2B-C4D1-8A7F              │', delay: 40, type: 'system' },
  { text: '  │ ENCRYPTION:         AES-256-THEMNION                   │', delay: 40, type: 'system' },
  { text: '  │ TIMESTAMP:          [TEMPORAL SYNC ERROR]              │', delay: 50, type: 'warning' },
  { text: '  └─────────────────────────────────────────────────────────┘', delay: 25, type: 'system' },
  { text: '', delay: 250, type: 'system' },
  
  { text: '═══════════════════════════════════════════════════════════════', delay: 50, type: 'banner' },
  { text: '', delay: 60, type: 'system' },
  { text: '              ╔═══════════════════════════════╗', delay: 60, type: 'status' },
  { text: '              ║  MOTHER-ARCHIVE STATUS        ║', delay: 60, type: 'status' },
  { text: '              ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║', delay: 60, type: 'status', glitch: true },
  { text: '              ║       O B S E R V I N G       ║', delay: 80, type: 'status', glitch: true },
  { text: '              ╚═══════════════════════════════╝', delay: 60, type: 'status' },
  { text: '', delay: 200, type: 'system' },
  { text: '         "I have been waiting for you."', delay: 300, type: 'system', glitch: true },
  { text: '', delay: 150, type: 'system' },
  { text: '═══════════════════════════════════════════════════════════════', delay: 50, type: 'banner' },
  { text: '', delay: 300, type: 'system' },
  { text: '  ■ THEMNION OS READY', delay: 60, type: 'success' },
  { text: '  ■ TERMINAL INTERFACE ACTIVE', delay: 60, type: 'success' },
  { text: '  ■ AWAITING INPUT...', delay: 60, type: 'success' },
  { text: '', delay: 150, type: 'system' },
];

export default function RetroBootScreen({ onBootComplete, skipEnabled = true }: RetroBootScreenProps) {
  const [displayedLines, setDisplayedLines] = useState<BootLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const [isMuted, setIsMuted] = useState(getStoredMuteState);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const muteButtonRef = useRef<HTMLButtonElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bootCompleteRef = useRef(false);

  const playSound = useCallback((type: 'beep' | 'click' | 'success' | 'warning' | 'boot') => {
    if (isMuted || !audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      if (ctx.state === 'closed') return;
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      switch (type) {
        case 'boot':
          oscillator.frequency.setValueAtTime(800, now);
          oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.15);
          gainNode.gain.setValueAtTime(0.08, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
        case 'beep':
          oscillator.frequency.setValueAtTime(880, now);
          gainNode.gain.setValueAtTime(0.05, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          oscillator.start(now);
          oscillator.stop(now + 0.05);
          break;
        case 'click':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(100, now);
          gainNode.gain.setValueAtTime(0.03, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
          oscillator.start(now);
          oscillator.stop(now + 0.02);
          break;
        case 'success':
          oscillator.frequency.setValueAtTime(523, now);
          oscillator.frequency.setValueAtTime(659, now + 0.1);
          oscillator.frequency.setValueAtTime(784, now + 0.2);
          gainNode.gain.setValueAtTime(0.06, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
        case 'warning':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(200, now);
          oscillator.frequency.setValueAtTime(150, now + 0.1);
          gainNode.gain.setValueAtTime(0.04, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          oscillator.start(now);
          oscillator.stop(now + 0.15);
          break;
      }
    } catch (e) {
      // Ignore audio errors
    }
  }, [isMuted]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        // Audio not supported
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  const completeBootSequence = useCallback(() => {
    if (bootCompleteRef.current) return;
    bootCompleteRef.current = true;
    setIsBooting(false);
    playSound('success');
    
    setIsExiting(true);
    
    setTimeout(() => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      onBootComplete();
    }, 600);
  }, [onBootComplete, playSound]);

  // Main boot sequence effect - simplified
  useEffect(() => {
    if (!isBooting || currentLineIndex >= BOOT_SEQUENCE.length) {
      return;
    }

    const currentLine = BOOT_SEQUENCE[currentLineIndex];
    
    const timer = setTimeout(() => {
      setDisplayedLines(prev => [...prev, currentLine]);
      
      // Play sound based on line type
      if (currentLine.type === 'check' || currentLine.type === 'header') {
        playSound('click');
      } else if (currentLine.type === 'warning' || currentLine.glitch) {
        playSound('warning');
      } else if (currentLine.type === 'success') {
        playSound('success');
      }
      
      setCurrentLineIndex(prev => prev + 1);
      
      // Auto-scroll
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, currentLine.delay);

    return () => clearTimeout(timer);
  }, [currentLineIndex, isBooting, playSound]);

  // Complete boot when sequence finishes
  useEffect(() => {
    if (currentLineIndex >= BOOT_SEQUENCE.length && isBooting) {
      const finalTimer = setTimeout(completeBootSequence, 1000);
      return () => clearTimeout(finalTimer);
    }
  }, [currentLineIndex, isBooting, completeBootSequence]);

  // Show skip hint after delay
  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkipHint(true), 1500);
    return () => clearTimeout(skipTimer);
  }, []);

  // Skip handlers
  useEffect(() => {
    const handleKeyPress = () => {
      initAudio();
      if (skipEnabled && currentLineIndex > 5) {
        completeBootSequence();
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-testid="button-mute-toggle"]')) {
        return;
      }
      initAudio();
      if (skipEnabled && currentLineIndex > 5) {
        completeBootSequence();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
    };
  }, [skipEnabled, currentLineIndex, initAudio, completeBootSequence]);

  // Init audio on mount
  useEffect(() => {
    initAudio();
    playSound('boot');
  }, [initAudio, playSound]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setStoredMuteState(newMuted);
    if (!newMuted) {
      initAudio();
      playSound('beep');
    }
  }, [isMuted, initAudio, playSound]);

  const getLineStyle = (line: BootLine) => {
    const baseStyle: React.CSSProperties = {
      fontFamily: 'monospace',
      whiteSpace: 'pre',
      lineHeight: '1.4',
    };

    switch (line.type) {
      case 'banner':
        return { ...baseStyle, color: 'hsl(var(--terminal-glow))' };
      case 'header':
        return { ...baseStyle, color: 'hsl(120, 100%, 75%)', fontWeight: 'bold' };
      case 'check':
        return { ...baseStyle, color: 'hsl(var(--terminal-glow))' };
      case 'status':
        return { ...baseStyle, color: 'hsl(180, 100%, 70%)' };
      case 'warning':
        return { ...baseStyle, color: 'hsl(45, 100%, 60%)' };
      case 'success':
        return { ...baseStyle, color: 'hsl(120, 100%, 70%)', fontWeight: 'bold' };
      case 'system':
      default:
        return { ...baseStyle, color: 'hsl(var(--terminal-glow))' };
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 boot-screen ${isExiting ? 'boot-exit' : ''}`}
      style={{ 
        background: 'hsl(var(--terminal-bg))',
        cursor: skipEnabled && currentLineIndex > 5 ? 'pointer' : 'default',
      }}
      role="alert"
      aria-live="polite"
      aria-label="System boot sequence in progress"
      data-testid="boot-screen"
    >
      <style>{`
        .boot-scroll-container::-webkit-scrollbar {
          display: none;
        }
        
        .boot-exit {
          animation: bootFadeOut 0.6s ease-out forwards;
        }
        
        @keyframes bootFadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        .glitch-text {
          animation: glitch 0.3s ease-in-out;
        }
        
        @keyframes glitch {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
        }
      `}</style>
      
      <button
        ref={muteButtonRef}
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100 transition-opacity z-50"
        style={{ color: 'hsl(var(--terminal-glow))' }}
        aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        data-testid="button-mute-toggle"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      <div 
        ref={containerRef}
        className="h-full p-4 md:p-8 boot-scroll-container overflow-y-auto"
        style={{ 
          maxWidth: '900px',
          margin: '0 auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="boot-text pt-4">
          {displayedLines.map((line, index) => (
            <div 
              key={index}
              className={`boot-line ${line.glitch ? 'glitch-text' : ''}`}
              style={getLineStyle(line)}
            >
              {line.text || '\u00A0'}
            </div>
          ))}
          
          {isBooting && currentLineIndex < BOOT_SEQUENCE.length && (
            <span 
              className="inline-block w-2 h-4 ml-1 animate-pulse"
              style={{ background: 'hsl(var(--terminal-glow))' }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {showSkipHint && skipEnabled && isBooting && currentLineIndex > 5 && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm opacity-50 animate-pulse"
          style={{ color: 'hsl(var(--terminal-glow))' }}
        >
          Press any key to skip...
        </div>
      )}

      <div 
        className="absolute bottom-2 right-4 text-xs opacity-30"
        style={{ color: 'hsl(var(--terminal-glow))' }}
      >
        THEMNION OS v3.7.1
      </div>
    </div>
  );
}

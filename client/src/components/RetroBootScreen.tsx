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
    // localStorage unavailable, fail silently
  }
};

const BOOT_SEQUENCE: BootLine[] = [
  { text: '', delay: 300, type: 'system' },
  { text: '████████████████████████████████████████████████████████████████', delay: 50, type: 'banner' },
  { text: '', delay: 100, type: 'system' },
  { text: '  ████████╗██╗  ██╗███████╗███╗   ███╗███╗   ██╗██╗ ██████╗ ███╗   ██╗', delay: 40, type: 'banner' },
  { text: '  ╚══██╔══╝██║  ██║██╔════╝████╗ ████║████╗  ██║██║██╔═══██╗████╗  ██║', delay: 40, type: 'banner' },
  { text: '     ██║   ███████║█████╗  ██╔████╔██║██╔██╗ ██║██║██║   ██║██╔██╗ ██║', delay: 40, type: 'banner' },
  { text: '     ██║   ██╔══██║██╔══╝  ██║╚██╔╝██║██║╚██╗██║██║██║   ██║██║╚██╗██║', delay: 40, type: 'banner' },
  { text: '     ██║   ██║  ██║███████╗██║ ╚═╝ ██║██║ ╚████║██║╚██████╔╝██║ ╚████║', delay: 40, type: 'banner' },
  { text: '     ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝', delay: 40, type: 'banner' },
  { text: '', delay: 100, type: 'system' },
  { text: '                    O P E R A T I N G   S Y S T E M', delay: 80, type: 'header' },
  { text: '                      Mother-Archive Edition v3.7.1', delay: 80, type: 'system' },
  { text: '', delay: 100, type: 'system' },
  { text: '████████████████████████████████████████████████████████████████', delay: 50, type: 'banner' },
  { text: '', delay: 400, type: 'system' },
  { text: 'THEMNION SYSTEMS (C) 1959-1987  ALL RIGHTS RESERVED', delay: 120, type: 'system' },
  { text: 'BIOS VERSION 2.4.1 - ACADEMY TERMINAL INTERFACE', delay: 100, type: 'system' },
  { text: '', delay: 300, type: 'system' },
  { text: 'INITIALIZING POWER-ON SELF TEST...', delay: 200, type: 'header' },
  { text: '', delay: 150, type: 'system' },
  { text: 'CPU: THEMNION TH-6800 NEURAL PROCESSOR.............. [  OK  ]', delay: 180, type: 'check' },
  { text: 'FPU: MATH CO-PROCESSOR UNIT......................... [  OK  ]', delay: 120, type: 'check' },
  { text: 'CACHE: L1 64KB / L2 256KB........................... [  OK  ]', delay: 100, type: 'check' },
  { text: '', delay: 200, type: 'system' },
  { text: 'MEMORY TEST: EXTENDED MEMORY CHECK', delay: 150, type: 'header' },
  { text: '  CONVENTIONAL:  640K................................. [  OK  ]', delay: 120, type: 'check' },
  { text: '  EXTENDED:      8192K................................ [  OK  ]', delay: 180, type: 'check' },
  { text: '  ARCHIVE BUFFER: 16384K............................. [  OK  ]', delay: 150, type: 'check' },
  { text: '', delay: 250, type: 'system' },
  { text: 'PERIPHERAL SCAN:', delay: 120, type: 'header' },
  { text: '  PRIMARY DISPLAY: PHOSPHOR TERMINAL CRT-7........... [ACTIVE]', delay: 100, type: 'check' },
  { text: '  KEYBOARD INTERFACE: MECHANICAL 104-KEY............. [ACTIVE]', delay: 80, type: 'check' },
  { text: '  ARCHIVE DRIVE: THEMNION MAG-OPTICAL 2.4GB.......... [MOUNTED]', delay: 120, type: 'check' },
  { text: '  NETWORK ADAPTER: ACADEMY INTRANET NODE 7........... [STANDBY]', delay: 100, type: 'check' },
  { text: '', delay: 300, type: 'system' },
  { text: 'LOADING MOTHER-ARCHIVE SUBSYSTEMS...', delay: 250, type: 'header' },
  { text: '', delay: 150, type: 'system' },
  { text: '  [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■] 100%', delay: 800, type: 'status' },
  { text: '', delay: 200, type: 'system' },
  { text: 'MOUNTING ARCHIVE VOLUMES:', delay: 120, type: 'header' },
  { text: '  /arc/curriculum_matrix........................ [INDEXED]', delay: 150, type: 'check' },
  { text: '  /arc/faculty_dossiers......................... [RESTRICTED]', delay: 120, type: 'check' },
  { text: '  /arc/student_records.......................... [ENCRYPTED]', delay: 100, type: 'check' },
  { text: '  /arc/anomaly_index............................ [CLASSIFIED]', delay: 180, type: 'warning', glitch: true },
  { text: '', delay: 300, type: 'system' },
  { text: 'SECURITY PROTOCOL HANDSHAKE:', delay: 150, type: 'header' },
  { text: '  CLEARANCE LEVEL: STUDENT (LIMITED ACCESS)', delay: 120, type: 'system' },
  { text: '  SESSION TOKEN: 0x7F3A-9E2B-C4D1', delay: 100, type: 'system' },
  { text: '  TIMESTAMP: [TEMPORAL SYNC ERROR - USING LOCAL]', delay: 150, type: 'warning' },
  { text: '', delay: 400, type: 'system' },
  { text: '═══════════════════════════════════════════════════════════════', delay: 80, type: 'banner' },
  { text: '  MOTHER-ARCHIVE STATUS: OBSERVING', delay: 200, type: 'status', glitch: true },
  { text: '  "I have been waiting for you."', delay: 300, type: 'system', glitch: true },
  { text: '═══════════════════════════════════════════════════════════════', delay: 80, type: 'banner' },
  { text: '', delay: 500, type: 'system' },
  { text: 'THEMNION OS READY. TERMINAL INTERFACE ACTIVE.', delay: 200, type: 'success' },
  { text: '', delay: 100, type: 'system' },
  { text: 'Press any key to continue...', delay: 100, type: 'system' },
];

export default function RetroBootScreen({ onBootComplete, skipEnabled = true }: RetroBootScreenProps) {
  const [displayedLines, setDisplayedLines] = useState<BootLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const [isMuted, setIsMuted] = useState(getStoredMuteState);
  const [showSkipHint, setShowSkipHint] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const muteButtonRef = useRef<HTMLButtonElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bootCompleteRef = useRef(false);
  const cleanupRef = useRef(false);

  const playSound = useCallback((type: 'beep' | 'click' | 'hum' | 'success' | 'warning' | 'boot') => {
    if (isMuted || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
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
      case 'hum':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(60, now);
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
    }
  }, [isMuted]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const completeBootSequence = useCallback(() => {
    if (bootCompleteRef.current) return;
    bootCompleteRef.current = true;
    cleanupRef.current = true;
    setIsBooting(false);
    playSound('success');
    setTimeout(() => {
      cleanupAudio();
      onBootComplete();
    }, 500);
  }, [onBootComplete, playSound, cleanupAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current = true;
      cleanupAudio();
    };
  }, [cleanupAudio]);

  useEffect(() => {
    if (currentLineIndex >= BOOT_SEQUENCE.length) {
      return;
    }

    const currentLine = BOOT_SEQUENCE[currentLineIndex];
    
    const timer = setTimeout(() => {
      setDisplayedLines(prev => [...prev, currentLine]);
      
      if (currentLine.type === 'check' || currentLine.type === 'header') {
        playSound('click');
      } else if (currentLine.type === 'warning' || currentLine.glitch) {
        playSound('warning');
      } else if (currentLine.type === 'success') {
        playSound('success');
      }
      
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
      
      setCurrentLineIndex(prev => prev + 1);
    }, currentLine.delay);

    return () => clearTimeout(timer);
  }, [currentLineIndex, playSound]);

  useEffect(() => {
    if (currentLineIndex >= BOOT_SEQUENCE.length && isBooting) {
      const finalTimer = setTimeout(completeBootSequence, 1500);
      return () => clearTimeout(finalTimer);
    }
  }, [currentLineIndex, isBooting, completeBootSequence]);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkipHint(true), 2000);
    return () => clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    const handleKeyPress = () => {
      initAudio();
      if (skipEnabled && currentLineIndex > 5) {
        completeBootSequence();
      }
    };

    const handleClick = () => {
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

  useEffect(() => {
    initAudio();
    playSound('boot');
    playSound('hum');
  }, [initAudio, playSound]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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
      className="fixed inset-0 z-50 boot-screen"
      style={{ 
        background: 'hsl(var(--terminal-bg))',
        cursor: skipEnabled && currentLineIndex > 5 ? 'pointer' : 'default'
      }}
      role="alert"
      aria-live="polite"
      aria-label="System boot sequence in progress"
      data-testid="boot-screen"
    >
      <button
        ref={muteButtonRef}
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100 transition-opacity focus-visible-ring"
        style={{ 
          color: 'hsl(var(--terminal-glow))',
          zIndex: 10,
          position: 'relative'
        }}
        aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        data-testid="button-mute-toggle"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      <div 
        ref={containerRef}
        className="h-full overflow-y-auto p-4 md:p-8 pb-20"
        style={{ 
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <div className="boot-text">
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
              className="inline-block w-2 h-4 ml-1 terminal-cursor"
              style={{ background: 'hsl(var(--terminal-glow))' }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {showSkipHint && skipEnabled && isBooting && currentLineIndex > 5 && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm opacity-50 animate-pulse"
          style={{ 
            color: 'hsl(var(--terminal-glow))',
            zIndex: 10
          }}
        >
          Press any key to skip...
        </div>
      )}

      <div 
        className="absolute bottom-2 right-4 text-xs opacity-30"
        style={{ 
          color: 'hsl(var(--terminal-glow))',
          zIndex: 10
        }}
      >
        THEMNION OS v3.7.1
      </div>
    </div>
  );
}

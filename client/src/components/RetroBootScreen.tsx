import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface BootLine {
  text: string;
  delay: number;
  type: 'header' | 'check' | 'status' | 'warning' | 'success' | 'system' | 'banner' | 'progress' | 'memory' | 'spinner';
  glitch?: boolean;
  animationId?: string;
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
  
  { text: '╔══════════════════════════════════════════════════════════════╗', delay: 60, type: 'banner' },
  { text: '║              POWER-ON SELF TEST DIAGNOSTICS                  ║', delay: 60, type: 'banner' },
  { text: '╚══════════════════════════════════════════════════════════════╝', delay: 60, type: 'banner' },
  { text: '', delay: 150, type: 'system' },
  
  { text: 'CPU: THEMNION TH-6800 NEURAL PROCESSOR', delay: 80, type: 'header' },
  { text: '', delay: 50, type: 'progress', animationId: 'cpu' },
  { text: '  └─ STATUS: OPERATIONAL                              [  OK  ]', delay: 120, type: 'check' },
  { text: '', delay: 100, type: 'system' },
  
  { text: 'MEMORY TEST: SCANNING RAM MODULES', delay: 100, type: 'header' },
  { text: '', delay: 50, type: 'memory', animationId: 'ram' },
  { text: '  ├─ CONVENTIONAL:  640K                              [  OK  ]', delay: 80, type: 'check' },
  { text: '  ├─ EXTENDED:      8192K                             [  OK  ]', delay: 80, type: 'check' },
  { text: '  └─ ARCHIVE BUFFER: 16384K                           [  OK  ]', delay: 80, type: 'check' },
  { text: '', delay: 150, type: 'system' },
  
  { text: 'STORAGE SUBSYSTEM: INITIALIZING ARCHIVE DRIVE', delay: 100, type: 'header' },
  { text: '', delay: 50, type: 'spinner', animationId: 'disk' },
  { text: '  ├─ THEMNION MAG-OPTICAL 2.4GB                       [MOUNTED]', delay: 100, type: 'check' },
  { text: '  ├─ SECTOR INTEGRITY: VERIFIED', delay: 80, type: 'check' },
  { text: '  └─ READ/WRITE HEAD: CALIBRATED                      [  OK  ]', delay: 100, type: 'check' },
  { text: '', delay: 200, type: 'system' },
  
  { text: '╔══════════════════════════════════════════════════════════════╗', delay: 60, type: 'banner' },
  { text: '║                 PERIPHERAL ENUMERATION                       ║', delay: 60, type: 'banner' },
  { text: '╚══════════════════════════════════════════════════════════════╝', delay: 60, type: 'banner' },
  { text: '', delay: 100, type: 'system' },
  
  { text: '  ┌─────────────────────────────────────────────────────────┐', delay: 40, type: 'system' },
  { text: '  │ DEVICE                              PORT      STATUS    │', delay: 40, type: 'system' },
  { text: '  ├─────────────────────────────────────────────────────────┤', delay: 40, type: 'system' },
  { text: '  │ PHOSPHOR TERMINAL CRT-7            VGA-0     ACTIVE    │', delay: 60, type: 'check' },
  { text: '  │ MECHANICAL KEYBOARD 104-KEY        PS/2-1    ACTIVE    │', delay: 60, type: 'check' },
  { text: '  │ ARCHIVE DRIVE MAG-OPTICAL          SCSI-0    MOUNTED   │', delay: 60, type: 'check' },
  { text: '  │ ACADEMY INTRANET ADAPTER           NET-7     STANDBY   │', delay: 60, type: 'check' },
  { text: '  │ AUDIO SUBSYSTEM TH-SND             AUD-0     ENABLED   │', delay: 60, type: 'check' },
  { text: '  └─────────────────────────────────────────────────────────┘', delay: 40, type: 'system' },
  { text: '', delay: 250, type: 'system' },
  
  { text: 'LOADING MOTHER-ARCHIVE KERNEL...', delay: 150, type: 'header' },
  { text: '', delay: 50, type: 'progress', animationId: 'kernel' },
  { text: '', delay: 200, type: 'system' },
  
  { text: '╔══════════════════════════════════════════════════════════════╗', delay: 60, type: 'banner' },
  { text: '║                   ARCHIVE VOLUME MOUNT                       ║', delay: 60, type: 'banner' },
  { text: '╚══════════════════════════════════════════════════════════════╝', delay: 60, type: 'banner' },
  { text: '', delay: 100, type: 'system' },
  
  { text: '  Mounting /arc/curriculum_matrix', delay: 80, type: 'system' },
  { text: '', delay: 50, type: 'progress', animationId: 'mount1' },
  { text: '    └─ 24 courses indexed, 168 assignments loaded    [INDEXED]', delay: 100, type: 'check' },
  { text: '', delay: 80, type: 'system' },
  
  { text: '  Mounting /arc/faculty_dossiers', delay: 80, type: 'system' },
  { text: '', delay: 50, type: 'progress', animationId: 'mount2' },
  { text: '    └─ 44 faculty records, 12 restricted         [RESTRICTED]', delay: 100, type: 'warning' },
  { text: '', delay: 80, type: 'system' },
  
  { text: '  Mounting /arc/student_records', delay: 80, type: 'system' },
  { text: '', delay: 50, type: 'progress', animationId: 'mount3' },
  { text: '    └─ 100 student profiles, encryption active   [ENCRYPTED]', delay: 100, type: 'check' },
  { text: '', delay: 80, type: 'system' },
  
  { text: '  Mounting /arc/anomaly_index', delay: 80, type: 'system', glitch: true },
  { text: '', delay: 50, type: 'progress', animationId: 'mount4' },
  { text: '    └─ [REDACTED] entries, clearance required   [CLASSIFIED]', delay: 150, type: 'warning', glitch: true },
  { text: '', delay: 300, type: 'system' },
  
  { text: '╔══════════════════════════════════════════════════════════════╗', delay: 60, type: 'banner' },
  { text: '║                  SECURITY HANDSHAKE                          ║', delay: 60, type: 'banner' },
  { text: '╚══════════════════════════════════════════════════════════════╝', delay: 60, type: 'banner' },
  { text: '', delay: 100, type: 'system' },
  
  { text: '  AUTHENTICATING...', delay: 100, type: 'system' },
  { text: '', delay: 50, type: 'spinner', animationId: 'auth' },
  { text: '', delay: 150, type: 'system' },
  { text: '  ┌─────────────────────────────────────────────────────────┐', delay: 40, type: 'system' },
  { text: '  │ CLEARANCE LEVEL:    STUDENT (LIMITED ACCESS)           │', delay: 60, type: 'system' },
  { text: '  │ SESSION TOKEN:      0x7F3A-9E2B-C4D1-8A7F              │', delay: 60, type: 'system' },
  { text: '  │ ENCRYPTION:         AES-256-THEMNION                   │', delay: 60, type: 'system' },
  { text: '  │ TIMESTAMP:          [TEMPORAL SYNC ERROR]              │', delay: 80, type: 'warning' },
  { text: '  └─────────────────────────────────────────────────────────┘', delay: 40, type: 'system' },
  { text: '', delay: 400, type: 'system' },
  
  { text: '═══════════════════════════════════════════════════════════════', delay: 80, type: 'banner' },
  { text: '', delay: 100, type: 'system' },
  { text: '              ╔═══════════════════════════════╗', delay: 100, type: 'status' },
  { text: '              ║  MOTHER-ARCHIVE STATUS        ║', delay: 100, type: 'status' },
  { text: '              ║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║', delay: 100, type: 'status', glitch: true },
  { text: '              ║       O B S E R V I N G       ║', delay: 150, type: 'status', glitch: true },
  { text: '              ╚═══════════════════════════════╝', delay: 100, type: 'status' },
  { text: '', delay: 300, type: 'system' },
  { text: '         "I have been waiting for you."', delay: 400, type: 'system', glitch: true },
  { text: '', delay: 200, type: 'system' },
  { text: '═══════════════════════════════════════════════════════════════', delay: 80, type: 'banner' },
  { text: '', delay: 500, type: 'system' },
  { text: '  ■ THEMNION OS READY', delay: 100, type: 'success' },
  { text: '  ■ TERMINAL INTERFACE ACTIVE', delay: 100, type: 'success' },
  { text: '  ■ AWAITING INPUT...', delay: 100, type: 'success' },
  { text: '', delay: 200, type: 'system' },
];

function AnimatedProgressBar({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const chars = '░▒▓█';
  
  useEffect(() => {
    const totalSteps = 40;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgress(step);
      if (step >= totalSteps) {
        clearInterval(interval);
        onComplete();
      }
    }, 25);
    return () => clearInterval(interval);
  }, [onComplete]);
  
  const filled = Math.floor(progress);
  const partial = progress % 1;
  const empty = 40 - filled - (partial > 0 ? 1 : 0);
  
  const bar = '█'.repeat(filled) + 
              (partial > 0 ? chars[Math.floor(partial * 4)] : '') +
              '░'.repeat(Math.max(0, empty));
  
  const percent = Math.floor((progress / 40) * 100);
  
  return (
    <div style={{ color: 'hsl(var(--terminal-glow))', fontFamily: 'monospace' }}>
      {`  [${bar}] ${percent.toString().padStart(3)}%`}
    </div>
  );
}

function AnimatedMemoryBlocks({ onComplete }: { onComplete: () => void }) {
  const [blocks, setBlocks] = useState<string[]>(Array(32).fill('░'));
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index >= 32) {
        clearInterval(interval);
        onComplete();
        return;
      }
      setBlocks(prev => {
        const next = [...prev];
        next[index] = '█';
        return next;
      });
      index++;
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);
  
  const row1 = blocks.slice(0, 16).join('');
  const row2 = blocks.slice(16, 32).join('');
  
  return (
    <div style={{ color: 'hsl(180, 100%, 70%)', fontFamily: 'monospace' }}>
      <div>{`  BANK 0: [${row1}]`}</div>
      <div>{`  BANK 1: [${row2}]`}</div>
    </div>
  );
}

function AnimatedSpinner({ onComplete }: { onComplete: () => void }) {
  const [frame, setFrame] = useState(0);
  const spinnerFrames = ['◐', '◓', '◑', '◒'];
  const diskFrames = ['[▰▱▱▱▱]', '[▰▰▱▱▱]', '[▰▰▰▱▱]', '[▰▰▰▰▱]', '[▰▰▰▰▰]'];
  
  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setFrame(f => (f + 1) % spinnerFrames.length);
      if (count >= 12) {
        clearInterval(interval);
        onComplete();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [onComplete, spinnerFrames.length]);
  
  const diskProgress = diskFrames[Math.min(Math.floor(frame / 2), diskFrames.length - 1)];
  
  return (
    <div style={{ color: 'hsl(var(--terminal-glow))', fontFamily: 'monospace' }}>
      {`  ${spinnerFrames[frame]} ACCESSING ${diskProgress}`}
    </div>
  );
}

export default function RetroBootScreen({ onBootComplete, skipEnabled = true }: RetroBootScreenProps) {
  const [displayedLines, setDisplayedLines] = useState<BootLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const [isMuted, setIsMuted] = useState(getStoredMuteState);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [activeAnimations, setActiveAnimations] = useState<Set<string>>(new Set());
  const [completedAnimations, setCompletedAnimations] = useState<Set<string>>(new Set());
  const [isExiting, setIsExiting] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const muteButtonRef = useRef<HTMLButtonElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bootCompleteRef = useRef(false);
  const cleanupRef = useRef(false);

  const playSound = useCallback((type: 'beep' | 'click' | 'hum' | 'success' | 'warning' | 'boot' | 'disk') => {
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
      case 'disk':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(50, now);
        oscillator.frequency.setValueAtTime(80, now + 0.05);
        oscillator.frequency.setValueAtTime(50, now + 0.1);
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
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
    
    setIsExiting(true);
    
    setTimeout(() => {
      cleanupAudio();
      onBootComplete();
    }, 800);
  }, [onBootComplete, playSound, cleanupAudio]);

  useEffect(() => {
    return () => {
      cleanupRef.current = true;
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const handleAnimationComplete = useCallback((animationId: string) => {
    setCompletedAnimations(prev => new Set(Array.from(prev).concat(animationId)));
    setActiveAnimations(prev => {
      const next = new Set(Array.from(prev));
      next.delete(animationId);
      return next;
    });
    playSound('click');
    setCurrentLineIndex(prev => prev + 1);
  }, [playSound]);

  useEffect(() => {
    if (currentLineIndex >= BOOT_SEQUENCE.length) {
      return;
    }

    if (activeAnimations.size > 0) {
      return;
    }

    const currentLine = BOOT_SEQUENCE[currentLineIndex];
    
    const timer = setTimeout(() => {
      setDisplayedLines(prev => [...prev, currentLine]);
      
      if (currentLine.animationId && !completedAnimations.has(currentLine.animationId)) {
        setActiveAnimations(prev => new Set(Array.from(prev).concat(currentLine.animationId!)));
        if (currentLine.type === 'spinner') {
          playSound('disk');
        }
      } else {
        if (currentLine.type === 'check' || currentLine.type === 'header') {
          playSound('click');
        } else if (currentLine.type === 'warning' || currentLine.glitch) {
          playSound('warning');
        } else if (currentLine.type === 'success') {
          playSound('success');
        }
        setCurrentLineIndex(prev => prev + 1);
      }
      
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, currentLine.delay);

    return () => clearTimeout(timer);
  }, [currentLineIndex, playSound, activeAnimations, completedAnimations]);

  useEffect(() => {
    if (currentLineIndex >= BOOT_SEQUENCE.length && isBooting && activeAnimations.size === 0) {
      const finalTimer = setTimeout(completeBootSequence, 1500);
      return () => clearTimeout(finalTimer);
    }
  }, [currentLineIndex, isBooting, completeBootSequence, activeAnimations]);

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

  useEffect(() => {
    initAudio();
    playSound('boot');
    playSound('hum');
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
      lineHeight: '1.5',
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
      case 'progress':
      case 'memory':
      case 'spinner':
        return { ...baseStyle, color: 'hsl(var(--terminal-glow))' };
      case 'system':
      default:
        return { ...baseStyle, color: 'hsl(var(--terminal-glow))' };
    }
  };

  const renderLine = (line: BootLine, index: number) => {
    if (line.type === 'progress' && line.animationId) {
      if (activeAnimations.has(line.animationId)) {
        return (
          <div key={index} className="boot-line">
            <AnimatedProgressBar 
              onComplete={() => handleAnimationComplete(line.animationId!)} 
            />
          </div>
        );
      } else if (completedAnimations.has(line.animationId)) {
        return (
          <div key={index} className="boot-line" style={getLineStyle(line)}>
            {'  [████████████████████████████████████████] 100%'}
          </div>
        );
      }
      return null;
    }
    
    if (line.type === 'memory' && line.animationId) {
      if (activeAnimations.has(line.animationId)) {
        return (
          <div key={index} className="boot-line">
            <AnimatedMemoryBlocks 
              onComplete={() => handleAnimationComplete(line.animationId!)} 
            />
          </div>
        );
      } else if (completedAnimations.has(line.animationId)) {
        return (
          <div key={index} className="boot-line" style={{ color: 'hsl(180, 100%, 70%)', fontFamily: 'monospace' }}>
            <div>{'  BANK 0: [████████████████]'}</div>
            <div>{'  BANK 1: [████████████████]'}</div>
          </div>
        );
      }
      return null;
    }
    
    if (line.type === 'spinner' && line.animationId) {
      if (activeAnimations.has(line.animationId)) {
        return (
          <div key={index} className="boot-line">
            <AnimatedSpinner 
              onComplete={() => handleAnimationComplete(line.animationId!)} 
            />
          </div>
        );
      } else if (completedAnimations.has(line.animationId)) {
        return (
          <div key={index} className="boot-line" style={getLineStyle(line)}>
            {'  ● READY [▰▰▰▰▰]'}
          </div>
        );
      }
      return null;
    }
    
    return (
      <div 
        key={index}
        className={`boot-line ${line.glitch ? 'glitch-text' : ''}`}
        style={getLineStyle(line)}
      >
        {line.text || '\u00A0'}
      </div>
    );
  };

  return (
    <div 
      className={`fixed inset-0 z-50 boot-screen ${isExiting ? 'boot-exit' : ''}`}
      style={{ 
        background: 'hsl(var(--terminal-bg))',
        cursor: skipEnabled && currentLineIndex > 5 ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
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
          animation: bootFadeOut 0.8s ease-out forwards;
        }
        
        @keyframes bootFadeOut {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.98);
          }
          100% {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
        }
        
        .boot-content-centered {
          font-size: clamp(0.7rem, 1.2vw, 1rem);
          max-height: 85vh;
          max-width: min(95vw, 1000px);
          width: 100%;
        }
        
        @media (min-width: 768px) {
          .boot-content-centered {
            font-size: clamp(0.85rem, 1vw, 1.1rem);
          }
        }
        
        @media (min-width: 1200px) {
          .boot-content-centered {
            font-size: 1rem;
          }
        }
      `}</style>
      
      <button
        ref={muteButtonRef}
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 opacity-60 hover:opacity-100 transition-opacity"
        style={{ 
          color: 'hsl(var(--terminal-glow))',
          zIndex: 100,
          position: 'absolute'
        }}
        aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        data-testid="button-mute-toggle"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      <div 
        ref={containerRef}
        className="boot-scroll-container boot-content-centered p-4 md:p-6"
        style={{ 
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div className="boot-text">
          {displayedLines.map((line, index) => renderLine(line, index))}
          
          {isBooting && currentLineIndex < BOOT_SEQUENCE.length && activeAnimations.size === 0 && (
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
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm opacity-50 animate-pulse"
          style={{ 
            color: 'hsl(var(--terminal-glow))',
            zIndex: 100
          }}
        >
          Press any key to skip...
        </div>
      )}

      <div 
        className="absolute bottom-3 right-4 text-xs opacity-30"
        style={{ 
          color: 'hsl(var(--terminal-glow))',
          zIndex: 100
        }}
      >
        THEMNION OS v3.7.1
      </div>
    </div>
  );
}

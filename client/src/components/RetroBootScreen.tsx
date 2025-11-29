import { useState, useEffect, useRef, useCallback } from 'react';
import BearMascot from './BearMascot';

interface RetroBootScreenProps {
  onBootComplete: () => void;
  skipEnabled?: boolean;
}

const BOOT_LINES = [
  '═══════════════════════════════════════════════════════════════',
  '',
  '     █████╗ ██████╗  ██████╗██╗  ██╗██╗██╗   ██╗███████╗',
  '    ██╔══██╗██╔══██╗██╔════╝██║  ██║██║██║   ██║██╔════╝',
  '    ███████║██████╔╝██║     ███████║██║██║   ██║█████╗  ',
  '    ██╔══██║██╔══██╗██║     ██╔══██║██║╚██╗ ██╔╝██╔══╝  ',
  '    ██║  ██║██║  ██║╚██████╗██║  ██║██║ ╚████╔╝ ███████╗',
  '    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝',
  '',
  '              INSTITUTIONAL MANAGEMENT SYSTEM',
  '                     Build 1987.144.7',
  '',
  '═══════════════════════════════════════════════════════════════',
  '',
  '  SYSTEM INITIALIZATION',
  '  ─────────────────────',
  '',
  '  [DIAG] Running power-on diagnostics...',
  '  [PROC] Neural processor: ONLINE',
  '  [MEM]  Memory banks: 24576K VERIFIED',
  '  [STOR] Archive drive: MOUNTED',
  '  [NET]  Intranet adapter: STANDBY',
  '',
  '  ─────────────────────',
  '',
  '  [LOAD] Loading institutional kernel...',
  '  [LOAD] Mounting student records...',
  '  [LOAD] Initializing observation protocols...',
  '',
  '═══════════════════════════════════════════════════════════════',
  '',
  '            ┌─────────────────────────────┐',
  '            │   MOTHER-ARCHIVE            │',
  '            │   Status: OBSERVING         │',
  '            │   Subjects: 144             │',
  '            └─────────────────────────────┘',
  '',
  '              "Welcome to The Academy."',
  '',
  '═══════════════════════════════════════════════════════════════',
  '',
  '  ARCHIVE OS ready.',
  '  Terminal interface active.',
  '  Awaiting input...',
  '',
];

export default function RetroBootScreen({ onBootComplete, skipEnabled = true }: RetroBootScreenProps) {
  // Start with 1 line visible immediately
  const [visibleLineCount, setVisibleLineCount] = useState(1);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showIconConstruction, setShowIconConstruction] = useState(false);
  const [iconConstructionPhase, setIconConstructionPhase] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bootCompleteRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Debug: log when component mounts
  useEffect(() => {
    console.log('[BOOT] RetroBootScreen mounted');
    setMounted(true);
    return () => {
      console.log('[BOOT] RetroBootScreen unmounting');
    };
  }, []);

  const completeBootSequence = useCallback(() => {
    if (bootCompleteRef.current) return;
    bootCompleteRef.current = true;
    console.log('[BOOT] Completing boot sequence');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Instant transition - no fade, like a real computer
    onBootComplete();
  }, [onBootComplete]);

  // Icon construction animation - runs after boot text completes
  useEffect(() => {
    if (!showIconConstruction) return;
    
    console.log('[BOOT] Starting icon construction');
    let phase = 0;
    const constructionInterval = setInterval(() => {
      phase++;
      setIconConstructionPhase(phase);
      console.log('[BOOT] Construction phase', phase);
      
      if (phase >= 5) {
        clearInterval(constructionInterval);
        // Brief pause to show completed icon, then transition
        setTimeout(() => {
          console.log('[BOOT] Icon complete, transitioning...');
          completeBootSequence();
        }, 400);
      }
    }, 200);

    return () => clearInterval(constructionInterval);
  }, [showIconConstruction, completeBootSequence]);

  // Boot animation effect - starts immediately on mount
  useEffect(() => {
    console.log('[BOOT] Starting boot animation');
    const skipTimer = setTimeout(() => setShowSkipHint(true), 2000);
    
    // Slower animation: 100ms per line for better visibility
    intervalRef.current = setInterval(() => {
      setVisibleLineCount(prev => {
        const next = prev + 1;
        console.log('[BOOT] Line', next, 'of', BOOT_LINES.length);
        if (next >= BOOT_LINES.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Start icon construction after boot text completes
          setTimeout(() => setShowIconConstruction(true), 300);
          return BOOT_LINES.length;
        }
        return next;
      });
    }, 100);

    return () => {
      clearTimeout(skipTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLineCount]);

  const handleSkip = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    // Only allow skip if the skip hint is visible (ensures minimum display time)
    if (skipEnabled && showSkipHint && visibleLineCount > 10) {
      completeBootSequence();
    }
  }, [skipEnabled, showSkipHint, visibleLineCount, completeBootSequence]);

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
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: '#000000',
        cursor: skipEnabled && showSkipHint && visibleLineCount > 10 ? 'pointer' : 'default',
        opacity: 1,
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '3px solid #00ff00',
        boxShadow: 'inset 0 0 30px rgba(0, 255, 0, 0.3), inset 0 0 60px rgba(0, 255, 0, 0.1), 0 0 20px rgba(0, 255, 0, 0.5)',
      }}
    >
      {/* Header with loading text */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          color: '#00ff00',
          fontSize: '28px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '0 0 10px #00ff00, 0 0 20px #00ff0066',
          letterSpacing: '4px',
        }}>
          ARCHIVE OS
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '40px',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #00ff00)',
          }} />
          <div style={{
            color: '#00ff00',
            fontSize: '12px',
            fontFamily: 'monospace',
            opacity: 0.7,
            letterSpacing: '2px',
          }}>
            {showIconConstruction ? 'INITIALIZING INTERFACE' : 'LOADING SYSTEMS'}
          </div>
          <div style={{
            width: '40px',
            height: '1px',
            background: 'linear-gradient(to left, transparent, #00ff00)',
          }} />
        </div>
      </div>

      {/* Icon Construction Animation - appears after boot text */}
      {showIconConstruction && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          {/* Constructing icon container */}
          <div style={{
            width: '120px',
            height: '120px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Phase 1: Outer ring */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: `3px solid ${iconConstructionPhase >= 1 ? '#00ff00' : '#00ff0022'}`,
              borderRadius: '50%',
              boxShadow: iconConstructionPhase >= 1 ? '0 0 20px #00ff00, inset 0 0 10px #00ff0044' : 'none',
              transition: 'all 0.2s ease-out',
            }} />
            
            {/* Phase 2: Inner ring */}
            <div style={{
              position: 'absolute',
              width: '85%',
              height: '85%',
              border: `2px solid ${iconConstructionPhase >= 2 ? '#00ff00' : '#00ff0022'}`,
              borderRadius: '50%',
              opacity: iconConstructionPhase >= 2 ? 1 : 0.2,
              transition: 'all 0.2s ease-out',
            }} />
            
            {/* Phase 3: Corner brackets */}
            <div style={{
              position: 'absolute',
              width: '70%',
              height: '70%',
              opacity: iconConstructionPhase >= 3 ? 1 : 0,
              transition: 'all 0.2s ease-out',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', borderTop: '2px solid #00ff00', borderLeft: '2px solid #00ff00' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', borderTop: '2px solid #00ff00', borderRight: '2px solid #00ff00' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '12px', height: '12px', borderBottom: '2px solid #00ff00', borderLeft: '2px solid #00ff00' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderBottom: '2px solid #00ff00', borderRight: '2px solid #00ff00' }} />
            </div>
            
            {/* Phase 4: Mascot image fades in */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              overflow: 'hidden',
              opacity: iconConstructionPhase >= 4 ? 1 : 0,
              transform: iconConstructionPhase >= 4 ? 'scale(1)' : 'scale(0.5)',
              transition: 'all 0.3s ease-out',
              boxShadow: iconConstructionPhase >= 5 ? '0 0 30px #00ff00' : 'none',
            }}>
              <BearMascot 
                animation={iconConstructionPhase >= 5 ? "pulse" : "idle"}
                size="lg"
                glowIntensity={iconConstructionPhase >= 5 ? "high" : "low"}
              />
            </div>
          </div>
          
          {/* Status text */}
          <div style={{
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: '14px',
            textShadow: '0 0 10px #00ff00',
            opacity: iconConstructionPhase >= 5 ? 1 : 0.5,
            transition: 'opacity 0.2s',
          }}>
            {iconConstructionPhase < 5 ? `CONSTRUCTING... ${iconConstructionPhase * 20}%` : 'READY'}
          </div>
        </div>
      )}

      <div 
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div 
          ref={containerRef}
          style={{ 
            maxWidth: '900px',
            maxHeight: '80vh',
            width: '100%',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <div 
            style={{ 
              color: '#00ff00',
              fontFamily: 'Courier New, Courier, monospace',
              fontSize: '13px',
              lineHeight: '1.3',
              whiteSpace: 'pre',
              textAlign: 'left',
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
        ARCHIVE OS v1987.144
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

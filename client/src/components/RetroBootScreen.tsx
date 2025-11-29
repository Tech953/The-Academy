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
      <div 
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          padding: '20px',
          gap: '20px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Left side: Scrolling boot text */}
        <div 
          ref={containerRef}
          style={{ 
            flex: '1 1 auto',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <div 
            style={{ 
              color: '#00ff00',
              fontFamily: 'Courier New, Courier, monospace',
              fontSize: '12px',
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

        {/* Right side: Icon construction area */}
        <div 
          style={{
            flex: '0 0 auto',
            width: '220px',
            height: '220px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '30px',
          }}
        >
          {/* Icon constructs after boot text completes */}
          {showIconConstruction ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              opacity: iconConstructionPhase >= 1 ? 1 : 0,
              transform: `scale(${0.7 + iconConstructionPhase * 0.08})`,
              transition: 'all 0.25s ease-out',
            }}>
              {/* Icon container - larger and centered */}
              <div style={{
                width: '160px',
                height: '160px',
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
                  border: `3px solid ${iconConstructionPhase >= 1 ? '#00ff00' : 'transparent'}`,
                  borderRadius: '50%',
                  boxShadow: iconConstructionPhase >= 1 ? '0 0 25px #00ff00, inset 0 0 15px #00ff0044' : 'none',
                  transition: 'all 0.2s ease-out',
                }} />
                
                {/* Phase 2: Inner ring */}
                <div style={{
                  position: 'absolute',
                  width: '80%',
                  height: '80%',
                  border: `2px solid ${iconConstructionPhase >= 2 ? '#00ff00' : 'transparent'}`,
                  borderRadius: '50%',
                  opacity: iconConstructionPhase >= 2 ? 0.7 : 0,
                  transition: 'all 0.2s ease-out',
                }} />
                
                {/* Phase 3: Crosshairs */}
                {iconConstructionPhase >= 3 && (
                  <>
                    <div style={{ position: 'absolute', width: '2px', height: '85%', background: 'linear-gradient(to bottom, transparent, #00ff00, transparent)', opacity: 0.5 }} />
                    <div style={{ position: 'absolute', width: '85%', height: '2px', background: 'linear-gradient(to right, transparent, #00ff00, transparent)', opacity: 0.5 }} />
                  </>
                )}
                
                {/* Phase 4-5: Mascot - larger */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  opacity: iconConstructionPhase >= 4 ? 1 : 0,
                  transform: iconConstructionPhase >= 4 ? 'scale(1)' : 'scale(0.3)',
                  transition: 'all 0.3s ease-out',
                  boxShadow: iconConstructionPhase >= 5 ? '0 0 35px #00ff00, 0 0 60px #00ff0044' : '0 0 15px #00ff0044',
                  border: '3px solid #00ff00',
                }}>
                  <BearMascot 
                    animation={iconConstructionPhase >= 5 ? "pulse" : "idle"}
                    size="xl"
                    glowIntensity={iconConstructionPhase >= 5 ? "high" : "medium"}
                  />
                </div>
              </div>
              
              {/* Status text */}
              <div style={{
                color: '#00ff00',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '0 0 10px #00ff00',
                letterSpacing: '3px',
                textAlign: 'center',
              }}>
                {iconConstructionPhase < 5 ? 'LOADING' : 'READY'}
              </div>
            </div>
          ) : (
            /* Placeholder before construction - centered waiting indicator */
            <div style={{
              width: '140px',
              height: '140px',
              border: '2px dashed #00ff0044',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                color: '#00ff0055',
                fontFamily: 'monospace',
                fontSize: '10px',
                textAlign: 'center',
                letterSpacing: '2px',
              }}>
                STANDBY
              </div>
            </div>
          )}
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

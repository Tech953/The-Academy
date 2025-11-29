import { useState, useEffect, useRef, useCallback } from 'react';
import bearImage from '@assets/ChatGPT Image Nov 29, 2025, 01_44_34 AM_1764398698829.png';

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

// Pool of randomized loading messages for the initialization phase
const LOADING_MESSAGES = {
  // Early stage (0-25%)
  early: [
    'Initializing neural pathways...',
    'Loading core subsystems...',
    'Mounting archive sectors...',
    'Calibrating display matrix...',
    'Establishing memory banks...',
    'Parsing configuration files...',
    'Loading kernel modules...',
    'Initializing I/O handlers...',
  ],
  // Mid stage (25-50%)
  mid: [
    'Loading student database...',
    'Indexing academic records...',
    'Preparing curriculum data...',
    'Loading faculty profiles...',
    'Mounting location maps...',
    'Initializing NPC routines...',
    'Loading dialogue trees...',
    'Caching narrative elements...',
  ],
  // Late stage (50-75%)
  late: [
    'Compiling character systems...',
    'Loading perk definitions...',
    'Initializing stat trackers...',
    'Preparing inventory system...',
    'Loading item databases...',
    'Calibrating reputation engine...',
    'Mounting save handlers...',
    'Initializing event triggers...',
  ],
  // Final stage (75-100%)
  final: [
    'Preparing terminal interface...',
    'Loading command parser...',
    'Initializing input handlers...',
    'Finalizing boot sequence...',
    'Verifying system integrity...',
    'Establishing session...',
    'Activating observation mode...',
    'Ready for input...',
  ],
};

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate randomized loading sequence
function generateLoadingSequence(): string[] {
  return [
    ...shuffleArray(LOADING_MESSAGES.early).slice(0, 2),
    ...shuffleArray(LOADING_MESSAGES.mid).slice(0, 2),
    ...shuffleArray(LOADING_MESSAGES.late).slice(0, 2),
    ...shuffleArray(LOADING_MESSAGES.final).slice(0, 2),
  ];
}

export default function RetroBootScreen({ onBootComplete, skipEnabled = true }: RetroBootScreenProps) {
  // Boot sequence phases: 'icon' -> 'loading' -> 'finalizing' -> 'complete'
  const [bootPhase, setBootPhase] = useState<'icon' | 'loading' | 'finalizing' | 'complete'>('icon');
  const [iconPhase, setIconPhase] = useState(0); // 0-5 for icon construction
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0); // 0-100 for loading bar
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('');
  const [loadingSequence] = useState(() => generateLoadingSequence());
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [mounted, setMounted] = useState(false);
  
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

  // Phase 1: Icon construction (appears first)
  useEffect(() => {
    if (bootPhase !== 'icon') return;
    
    console.log('[BOOT] Phase 1: Icon construction');
    let phase = 0;
    
    const iconInterval = setInterval(() => {
      phase++;
      setIconPhase(phase);
      console.log('[BOOT] Icon phase', phase);
      
      if (phase >= 5) {
        clearInterval(iconInterval);
        // Hold the completed icon for a moment, then transition to loading
        setTimeout(() => {
          console.log('[BOOT] Icon complete, starting loading phase');
          setBootPhase('loading');
        }, 800);
      }
    }, 250);

    return () => clearInterval(iconInterval);
  }, [bootPhase]);

  // Phase 2: Loading text animation
  useEffect(() => {
    if (bootPhase !== 'loading') return;
    
    console.log('[BOOT] Phase 2: Loading text');
    const skipTimer = setTimeout(() => setShowSkipHint(true), 1500);
    
    intervalRef.current = setInterval(() => {
      setVisibleLineCount(prev => {
        const next = prev + 1;
        if (next >= BOOT_LINES.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Transition to finalizing phase
          setTimeout(() => {
            console.log('[BOOT] Text complete, starting finalizing phase');
            setBootPhase('finalizing');
          }, 300);
          return BOOT_LINES.length;
        }
        return next;
      });
    }, 80);

    return () => {
      clearTimeout(skipTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bootPhase]);

  // Phase 3: Finalizing with loading bar
  useEffect(() => {
    if (bootPhase !== 'finalizing') return;
    
    console.log('[BOOT] Phase 3: Finalizing');
    let progress = 0;
    let messageIndex = 0;
    
    // Set initial message
    setCurrentLoadingMessage(loadingSequence[0] || 'Initializing...');
    
    const progressInterval = setInterval(() => {
      progress += Math.random() * 12 + 4; // Random increments for retro feel
      
      // Update message based on progress thresholds
      const newMessageIndex = Math.min(
        Math.floor(progress / (100 / loadingSequence.length)),
        loadingSequence.length - 1
      );
      
      if (newMessageIndex !== messageIndex && loadingSequence[newMessageIndex]) {
        messageIndex = newMessageIndex;
        setCurrentLoadingMessage(loadingSequence[messageIndex]);
      }
      
      if (progress >= 100) {
        progress = 100;
        setLoadingProgress(100);
        setCurrentLoadingMessage('System ready');
        clearInterval(progressInterval);
        // Brief hold at 100%, then instant transition
        setTimeout(() => {
          console.log('[BOOT] Loading complete, transitioning to UI');
          completeBootSequence();
        }, 500);
      } else {
        setLoadingProgress(Math.floor(progress));
      }
    }, 180);

    return () => clearInterval(progressInterval);
  }, [bootPhase, completeBootSequence, loadingSequence]);

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
      {/* Phase 1: Icon appears first, centered */}
      {bootPhase === 'icon' && (
        <div 
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
          }}
        >
          {/* Large centered icon construction */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            opacity: iconPhase >= 1 ? 1 : 0,
            transform: `scale(${0.6 + iconPhase * 0.1})`,
            transition: 'all 0.3s ease-out',
          }}>
            {/* Icon container */}
            <div style={{
              width: '180px',
              height: '180px',
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
                border: `3px solid ${iconPhase >= 1 ? '#00ff00' : 'transparent'}`,
                borderRadius: '50%',
                boxShadow: iconPhase >= 1 ? '0 0 30px #00ff00, inset 0 0 20px #00ff0044' : 'none',
                transition: 'all 0.25s ease-out',
              }} />
              
              {/* Phase 2: Inner ring */}
              <div style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                border: `2px solid ${iconPhase >= 2 ? '#00ff00' : 'transparent'}`,
                borderRadius: '50%',
                opacity: iconPhase >= 2 ? 0.7 : 0,
                transition: 'all 0.25s ease-out',
              }} />
              
              {/* Phase 3: Crosshairs */}
              {iconPhase >= 3 && (
                <>
                  <div style={{ position: 'absolute', width: '2px', height: '90%', background: 'linear-gradient(to bottom, transparent, #00ff00, transparent)', opacity: 0.5 }} />
                  <div style={{ position: 'absolute', width: '90%', height: '2px', background: 'linear-gradient(to right, transparent, #00ff00, transparent)', opacity: 0.5 }} />
                </>
              )}
              
              {/* Phase 4-5: Mascot emerges */}
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                opacity: iconPhase >= 4 ? 1 : 0,
                transform: iconPhase >= 4 ? 'scale(1)' : 'scale(0.3)',
                transition: 'all 0.35s ease-out',
                boxShadow: iconPhase >= 5 ? '0 0 40px #00ff00, 0 0 80px #00ff0044' : '0 0 20px #00ff0044',
                border: '3px solid #00ff00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img 
                  src={bearImage}
                  alt="Academy Mascot"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: iconPhase >= 5 
                      ? 'drop-shadow(0 0 10px #00ff00) drop-shadow(0 0 20px #00ff0066)'
                      : 'drop-shadow(0 0 5px #00ff0044)',
                  }}
                />
              </div>
            </div>
            
            {/* Status text */}
            <div style={{
              color: '#00ff00',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 'bold',
              textShadow: '0 0 12px #00ff00',
              letterSpacing: '4px',
              textAlign: 'center',
            }}>
              {iconPhase < 5 ? 'INITIALIZING' : 'THE ACADEMY'}
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Loading text scrolls */}
      {bootPhase === 'loading' && (
        <div 
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div 
            ref={containerRef}
            style={{ 
              maxWidth: '700px',
              maxHeight: '85vh',
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
      )}

      {/* Phase 3: Finalizing with loading bar */}
      {bootPhase === 'finalizing' && (
        <div 
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            boxSizing: 'border-box',
          }}
        >
          {/* Center content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '30px',
            maxWidth: '500px',
            width: '100%',
          }}>
            {/* Status text */}
            <div style={{
              color: '#00ff00',
              fontFamily: 'Courier New, Courier, monospace',
              fontSize: '16px',
              fontWeight: 'bold',
              textShadow: '0 0 10px #00ff00',
              letterSpacing: '3px',
              textAlign: 'center',
            }}>
              INITIALIZING TERMINAL INTERFACE
            </div>

            {/* Loading bar container */}
            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {/* Bar border */}
              <div style={{
                width: '100%',
                height: '24px',
                border: '2px solid #00ff00',
                boxShadow: '0 0 10px #00ff0044, inset 0 0 10px #00ff0022',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Fill bar */}
                <div style={{
                  position: 'absolute',
                  left: '2px',
                  top: '2px',
                  height: 'calc(100% - 4px)',
                  width: `calc(${loadingProgress}% - 4px)`,
                  background: 'linear-gradient(90deg, #00ff00 0%, #00cc00 50%, #00ff00 100%)',
                  boxShadow: '0 0 15px #00ff00, 0 0 30px #00ff0066',
                  transition: 'width 0.1s ease-out',
                }}>
                  {/* Scanline effect on bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                  }} />
                </div>

                {/* Block segments for retro look */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  gap: '2px',
                  padding: '2px',
                }}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: i < Math.floor(loadingProgress / 5) 
                          ? '#00ff00' 
                          : 'transparent',
                        boxShadow: i < Math.floor(loadingProgress / 5)
                          ? '0 0 5px #00ff00'
                          : 'none',
                        opacity: i < Math.floor(loadingProgress / 5) ? 1 : 0.2,
                        border: '1px solid #00ff0044',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Current loading message */}
              <div style={{
                color: '#00ff00',
                fontFamily: 'Courier New, Courier, monospace',
                fontSize: '11px',
                minHeight: '18px',
                opacity: 0.8,
                textShadow: '0 0 5px #00ff0066',
                transition: 'opacity 0.15s ease',
              }}>
                {currentLoadingMessage}
              </div>

              {/* Percentage display */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                color: '#00ff00',
                fontFamily: 'Courier New, Courier, monospace',
                fontSize: '12px',
              }}>
                <span style={{ 
                  fontWeight: 'bold',
                  textShadow: '0 0 8px #00ff00',
                }}>
                  [{loadingProgress}%]
                </span>
              </div>
            </div>

            {/* Blinking ready indicator when complete */}
            {loadingProgress >= 100 && (
              <div style={{
                color: '#00ff00',
                fontFamily: 'Courier New, Courier, monospace',
                fontSize: '14px',
                animation: 'blink 0.5s infinite',
                textShadow: '0 0 15px #00ff00',
                letterSpacing: '4px',
              }}>
                READY
              </div>
            )}
          </div>
        </div>
      )}

      {showSkipHint && skipEnabled && bootPhase === 'loading' && visibleLineCount > 10 && visibleLineCount < BOOT_LINES.length && (
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

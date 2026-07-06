import { useState, useEffect } from 'react';
import bearImage from '@assets/ChatGPT Image Nov 29, 2025, 01_44_34 AM_1764398698829.png';

export type BearAnimation = 
  | 'idle'
  | 'salute'
  | 'wave'
  | 'think'
  | 'celebrate'
  | 'alert'
  | 'sleep'
  | 'entrance'
  | 'pulse'
  | 'bounce';

export type BearSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'title';

interface BearMascotProps {
  animation?: BearAnimation;
  size?: BearSize;
  className?: string;
  loop?: boolean;
  onAnimationEnd?: () => void;
  glowIntensity?: 'low' | 'medium' | 'high';
}

const sizeClasses: Record<BearSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
  title: 'w-48 h-48 md:w-64 md:h-64',
};

export default function BearMascot({
  animation = 'idle',
  size = 'md',
  className = '',
  loop = true,
  onAnimationEnd,
  glowIntensity = 'medium',
}: BearMascotProps) {
  const [animationClass, setAnimationClass] = useState('');
  
  useEffect(() => {
    setAnimationClass(`bear-${animation}`);
    
    if (!loop && onAnimationEnd) {
      const durations: Record<BearAnimation, number> = {
        idle: 2000,
        salute: 1500,
        wave: 2000,
        think: 3000,
        celebrate: 2500,
        alert: 1000,
        sleep: 4000,
        entrance: 1200,
        pulse: 1500,
        bounce: 800,
      };
      
      const timer = setTimeout(() => {
        onAnimationEnd();
      }, durations[animation]);
      
      return () => clearTimeout(timer);
    }
  }, [animation, loop, onAnimationEnd]);

  const glowStyles: Record<string, string> = {
    low: 'drop-shadow(0 0 3px hsl(var(--terminal-glow) / 0.3))',
    medium: 'drop-shadow(0 0 8px hsl(var(--terminal-glow) / 0.5)) drop-shadow(0 0 15px hsl(var(--terminal-glow) / 0.3))',
    high: 'drop-shadow(0 0 10px hsl(var(--terminal-glow) / 0.7)) drop-shadow(0 0 20px hsl(var(--terminal-glow) / 0.5)) drop-shadow(0 0 30px hsl(var(--terminal-glow) / 0.3))',
  };

  return (
    <>
      <style>{`
        .bear-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .bear-image {
          transition: transform 0.3s ease, filter 0.3s ease;
        }
        
        /* Idle - gentle floating */
        .bear-idle {
          animation: bearIdle 3s ease-in-out infinite;
        }
        
        @keyframes bearIdle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        
        /* Salute - snappy attention pose */
        .bear-salute {
          animation: bearSalute 1.5s ease-out infinite;
        }
        
        @keyframes bearSalute {
          0% { transform: scale(1) rotate(0deg); }
          15% { transform: scale(1.05) rotate(-2deg); }
          30% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        
        /* Wave - friendly greeting */
        .bear-wave {
          animation: bearWave 2s ease-in-out infinite;
        }
        
        @keyframes bearWave {
          0%, 100% { transform: rotate(0deg) scale(1); }
          10% { transform: rotate(-5deg) scale(1.02); }
          20% { transform: rotate(5deg) scale(1.02); }
          30% { transform: rotate(-5deg) scale(1.02); }
          40% { transform: rotate(5deg) scale(1.02); }
          50% { transform: rotate(0deg) scale(1); }
        }
        
        /* Think - contemplative head tilt */
        .bear-think {
          animation: bearThink 3s ease-in-out infinite;
        }
        
        @keyframes bearThink {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          25% { transform: rotate(-8deg) translateX(-3px); }
          75% { transform: rotate(-8deg) translateX(-3px); }
        }
        
        /* Celebrate - excited bounce */
        .bear-celebrate {
          animation: bearCelebrate 0.5s ease-in-out infinite;
        }
        
        @keyframes bearCelebrate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          50% { transform: scale(1) rotate(0deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        
        /* Alert - attention grabbing */
        .bear-alert {
          animation: bearAlert 0.5s ease-in-out infinite;
        }
        
        @keyframes bearAlert {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
        }
        
        /* Sleep - gentle breathing */
        .bear-sleep {
          animation: bearSleep 4s ease-in-out infinite;
        }
        
        @keyframes bearSleep {
          0%, 100% { transform: scale(1) rotate(-3deg); opacity: 0.7; }
          50% { transform: scale(1.02) rotate(-3deg); opacity: 0.9; }
        }
        
        /* Entrance - dramatic reveal */
        .bear-entrance {
          animation: bearEntrance 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        @keyframes bearEntrance {
          0% { 
            transform: scale(0) rotate(-180deg); 
            opacity: 0;
            filter: blur(10px);
          }
          60% {
            transform: scale(1.1) rotate(10deg);
            opacity: 1;
            filter: blur(0);
          }
          100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 1;
            filter: blur(0);
          }
        }
        
        /* Pulse - glowing effect */
        .bear-pulse {
          animation: bearPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes bearPulse {
          0%, 100% { 
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 5px hsl(var(--terminal-glow) / 0.5));
          }
          50% { 
            transform: scale(1.03);
            filter: brightness(1.2) drop-shadow(0 0 15px hsl(var(--terminal-glow) / 0.8));
          }
        }
        
        /* Bounce - quick hop */
        .bear-bounce {
          animation: bearBounce 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
        }
        
        @keyframes bearBounce {
          0%, 100% { transform: translateY(0) scaleY(1); }
          30% { transform: translateY(-15px) scaleY(1.05); }
          50% { transform: translateY(0) scaleY(0.95); }
          70% { transform: translateY(-5px) scaleY(1); }
        }
        
        /* Scanline overlay for extra retro feel */
        .bear-scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          );
          pointer-events: none;
          border-radius: 50%;
        }
      `}</style>
      
      <div 
        className={`bear-container bear-scanlines ${sizeClasses[size]} ${className}`}
        data-testid="bear-mascot"
      >
        <img 
          src={bearImage}
          alt="Academy Bear Mascot"
          className={`bear-image ${animationClass} w-full h-full object-contain`}
          style={{
            filter: glowStyles[glowIntensity],
          }}
        />
      </div>
    </>
  );
}

export function StatBear({ stat, value, maxValue }: { stat: string; value: number; maxValue: number }) {
  const getAnimation = (): BearAnimation => {
    const percentage = value / maxValue;
    if (percentage >= 0.8) return 'celebrate';
    if (percentage >= 0.5) return 'idle';
    if (percentage >= 0.3) return 'think';
    return 'sleep';
  };
  
  const statAnimations: Record<string, BearAnimation> = {
    strength: 'salute',
    intelligence: 'think',
    charisma: 'wave',
    endurance: 'pulse',
    energy: value > maxValue * 0.5 ? 'bounce' : 'sleep',
    health: value > maxValue * 0.5 ? 'idle' : 'alert',
  };
  
  const animation = statAnimations[stat.toLowerCase()] || getAnimation();
  
  return (
    <div className="flex items-center gap-2">
      <BearMascot 
        animation={animation} 
        size="xs" 
        glowIntensity="low"
      />
      <div className="flex flex-col">
        <span className="text-xs uppercase opacity-70">{stat}</span>
        <span className="font-bold">{value}/{maxValue}</span>
      </div>
    </div>
  );
}

export function PerkBear({ perkName, unlocked = true }: { perkName: string; unlocked?: boolean }) {
  const animation: BearAnimation = unlocked ? 'celebrate' : 'sleep';
  
  return (
    <div 
      className={`flex flex-col items-center gap-1 p-2 rounded ${unlocked ? 'opacity-100' : 'opacity-40'}`}
      data-testid={`perk-bear-${perkName.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <BearMascot 
        animation={animation} 
        size="sm" 
        glowIntensity={unlocked ? 'medium' : 'low'}
      />
      <span className="text-xs text-center max-w-[60px] truncate">{perkName}</span>
    </div>
  );
}

export function TitleBear({ onAnimationComplete }: { onAnimationComplete?: () => void }) {
  const [phase, setPhase] = useState<'entrance' | 'salute' | 'idle'>('entrance');
  
  useEffect(() => {
    const entranceTimer = setTimeout(() => {
      setPhase('salute');
    }, 1200);
    
    const saluteTimer = setTimeout(() => {
      setPhase('idle');
      onAnimationComplete?.();
    }, 2700);
    
    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(saluteTimer);
    };
  }, [onAnimationComplete]);
  
  return (
    <div className="flex flex-col items-center">
      <BearMascot 
        animation={phase} 
        size="title" 
        glowIntensity="high"
        loop={phase === 'idle'}
      />
      <div 
        className="mt-4 text-center opacity-0"
        style={{
          animation: phase !== 'entrance' ? 'fadeIn 0.5s ease-out forwards' : 'none',
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div 
          className="text-xs uppercase tracking-widest"
          style={{ color: 'hsl(var(--terminal-glow))' }}
        >
          Academy Guardian
        </div>
      </div>
    </div>
  );
}

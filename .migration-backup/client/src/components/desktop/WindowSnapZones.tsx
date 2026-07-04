import { useState, useCallback } from 'react';

export type SnapZone = 'left' | 'right' | 'full' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

interface WindowSnapZonesProps {
  activeZone: SnapZone;
  visible: boolean;
}

export function WindowSnapZones({ activeZone, visible }: WindowSnapZonesProps) {
  if (!visible) return null;

  const zones: { zone: SnapZone; style: React.CSSProperties }[] = [
    {
      zone: 'left',
      style: { left: 0, top: 0, width: '50%', height: '100%' },
    },
    {
      zone: 'right',
      style: { right: 0, top: 0, width: '50%', height: '100%' },
    },
    {
      zone: 'full',
      style: { inset: 0 },
    },
  ];

  return (
    <>
      {zones.map(({ zone, style }) => (
        <div
          key={zone}
          className={`snap-zone ${activeZone === zone ? 'visible' : ''}`}
          style={style}
        />
      ))}
    </>
  );
}

export function getSnapZone(x: number, y: number, screenWidth: number, screenHeight: number): SnapZone {
  const edgeThreshold = 30;
  const topThreshold = 10;

  if (y <= topThreshold) {
    return 'full';
  }

  if (x <= edgeThreshold) {
    return 'left';
  }

  if (x >= screenWidth - edgeThreshold) {
    return 'right';
  }

  return null;
}

export function getSnapDimensions(
  zone: SnapZone, 
  screenWidth: number, 
  screenHeight: number,
  taskbarHeight: number = 48,
  sidebarWidth: number = 100
): { x: number; y: number; width: number; height: number } | null {
  const availableWidth = screenWidth - sidebarWidth;
  const availableHeight = screenHeight - taskbarHeight;

  switch (zone) {
    case 'left':
      return { 
        x: sidebarWidth, 
        y: 0, 
        width: availableWidth / 2, 
        height: availableHeight 
      };
    case 'right':
      return { 
        x: sidebarWidth + availableWidth / 2, 
        y: 0, 
        width: availableWidth / 2, 
        height: availableHeight 
      };
    case 'full':
      return { 
        x: sidebarWidth, 
        y: 0, 
        width: availableWidth, 
        height: availableHeight 
      };
    case 'top-left':
      return { 
        x: sidebarWidth, 
        y: 0, 
        width: availableWidth / 2, 
        height: availableHeight / 2 
      };
    case 'top-right':
      return { 
        x: sidebarWidth + availableWidth / 2, 
        y: 0, 
        width: availableWidth / 2, 
        height: availableHeight / 2 
      };
    case 'bottom-left':
      return { 
        x: sidebarWidth, 
        y: availableHeight / 2, 
        width: availableWidth / 2, 
        height: availableHeight / 2 
      };
    case 'bottom-right':
      return { 
        x: sidebarWidth + availableWidth / 2, 
        y: availableHeight / 2, 
        width: availableWidth / 2, 
        height: availableHeight / 2 
      };
    default:
      return null;
  }
}

export function useWindowSnap() {
  const [activeZone, setActiveZone] = useState<SnapZone>(null);
  const [showZones, setShowZones] = useState(false);

  const startDrag = useCallback(() => {
    setShowZones(true);
  }, []);

  const updateDrag = useCallback((x: number, y: number) => {
    const zone = getSnapZone(x, y, window.innerWidth, window.innerHeight);
    setActiveZone(zone);
  }, []);

  const endDrag = useCallback(() => {
    setShowZones(false);
    const zone = activeZone;
    setActiveZone(null);
    return zone;
  }, [activeZone]);

  return {
    activeZone,
    showZones,
    startDrag,
    updateDrag,
    endDrag,
  };
}

export interface BrowserConnectionHints {
  effectiveType?: string;
  saveData?: boolean;
}

export type AdjacentSlidePrefetchMode = 'both' | 'next' | 'none';

type NavigatorWithConnection = Navigator & {
  connection?: BrowserConnectionHints;
};

export function getBrowserConnectionHints():
  | BrowserConnectionHints
  | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as NavigatorWithConnection).connection;
}

export function adjacentSlidePrefetchMode(
  connection: BrowserConnectionHints | null | undefined,
): AdjacentSlidePrefetchMode {
  if (!connection) return 'both';
  if (connection.saveData) return 'none';

  switch (connection.effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'none';
    case '3g':
      return 'next';
    default:
      return 'both';
  }
}
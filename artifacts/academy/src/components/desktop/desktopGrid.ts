export const DESKTOP_GRID = {
  cellWidth: 104,
  cellHeight: 96,
  marginX: 16,
  marginY: 12,
  taskbarReserve: 60,
  iconWidth: 92,
  iconHeight: 82,
  collisionGap: 8,
} as const;

export interface DesktopGridPosition {
  x: number;
  y: number;
}

export function gridToPixel(
  col: number,
  row: number,
): DesktopGridPosition {
  return {
    x: DESKTOP_GRID.marginX + col * DESKTOP_GRID.cellWidth,
    y: DESKTOP_GRID.marginY + row * DESKTOP_GRID.cellHeight,
  };
}

export function pixelToGrid(
  x: number,
  y: number,
): { col: number; row: number } {
  return {
    col: Math.max(
      0,
      Math.round((x - DESKTOP_GRID.marginX) / DESKTOP_GRID.cellWidth),
    ),
    row: Math.max(
      0,
      Math.round((y - DESKTOP_GRID.marginY) / DESKTOP_GRID.cellHeight),
    ),
  };
}

export function getResponsiveIconColumns(viewportWidth: number): number {
  const { cellWidth, iconWidth, marginX } = DESKTOP_GRID;
  return Math.max(
    1,
    Math.min(
      6,
      Math.floor(
        (viewportWidth - marginX * 2 + cellWidth - iconWidth) / cellWidth,
      ),
    ),
  );
}

export function getDefaultIconPositions(
  iconIds: readonly string[],
  viewportWidth: number,
): Record<string, DesktopGridPosition> {
  const columns = getResponsiveIconColumns(viewportWidth);
  const positions: Record<string, DesktopGridPosition> = {};
  iconIds.forEach((id, index) => {
    positions[id] = gridToPixel(index % columns, Math.floor(index / columns));
  });
  return positions;
}
import { describe, expect, it } from 'vitest';

import {
  DESKTOP_GRID,
  getDefaultIconPositions,
  getResponsiveIconColumns,
} from './desktopGrid';

describe('desktop launcher grid', () => {
  it('keeps the launcher clear of icon bounds and collision gaps', () => {
    const iconIds = Array.from({ length: 19 }, (_, index) => `icon-${index}`);
    const positions = getDefaultIconPositions(iconIds, 800);
    const positionList = Object.values(positions);

    expect(getResponsiveIconColumns(800)).toBe(6);

    for (let first = 0; first < positionList.length; first += 1) {
      for (let second = first + 1; second < positionList.length; second += 1) {
        const a = positionList[first];
        const b = positionList[second];
        const separated =
          a.x + DESKTOP_GRID.iconWidth + DESKTOP_GRID.collisionGap <= b.x ||
          b.x + DESKTOP_GRID.iconWidth + DESKTOP_GRID.collisionGap <= a.x ||
          a.y + DESKTOP_GRID.iconHeight + DESKTOP_GRID.collisionGap <= b.y ||
          b.y + DESKTOP_GRID.iconHeight + DESKTOP_GRID.collisionGap <= a.y;

        expect(separated).toBe(true);
      }
    }
  });

  it('only adds a column when the full grid cell fits', () => {
    expect(getResponsiveIconColumns(640)).toBe(5);
    expect(getResponsiveIconColumns(644)).toBe(6);
  });

  it('places the launcher in a compact row-major grid at screenshot width', () => {
    const iconIds = Array.from({ length: 19 }, (_, index) => `icon-${index}`);
    const positions = getDefaultIconPositions(iconIds, 800);

    expect(getResponsiveIconColumns(800)).toBe(6);
    expect(positions['icon-0']).toEqual({ x: 16, y: 12 });
    expect(positions['icon-5']).toEqual({ x: 536, y: 12 });
    expect(positions['icon-6']).toEqual({ x: 16, y: 108 });
    expect(positions['icon-17']).toEqual({ x: 536, y: 204 });
    expect(positions['icon-18']).toEqual({ x: 16, y: 300 });
    expect(Object.values(positions).every(({ x }) => x <= 536)).toBe(true);
  });
});
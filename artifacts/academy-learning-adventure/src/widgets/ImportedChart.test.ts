import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  chartRows,
  default as ImportedChart,
  pieData,
  scatterPoints,
  type ImportedChartModel,
  type ImportedSeries,
} from './ImportedChart';

test('percent-stacked rows scale non-null values around null points', () => {
  const chart: ImportedChartModel = {
    type: 'column',
    grouping: 'percentStacked',
    series: [
      {
        name: 'Completed',
        categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [30, null, 0, null],
      },
      {
        name: 'Remaining',
        values: [70, 20, null, null],
      },
    ],
  };

  assert.deepEqual(chartRows(chart), [
    { category: 'Week 1', 'series-0': 30, 'series-1': 70 },
    { category: 'Week 2', 'series-0': null, 'series-1': 100 },
    { category: 'Week 3', 'series-0': 0, 'series-1': null },
    { category: 'Week 4', 'series-0': null, 'series-1': null },
  ]);
});

test('percent-stacked mixed-sign rows preserve signs and normalize absolute totals', () => {
  const chart: ImportedChartModel = {
    type: 'column',
    grouping: 'percentStacked',
    series: [
      {
        name: 'Gains',
        categories: ['Net positive', 'Net negative'],
        values: [30, -60],
      },
      {
        name: 'Losses',
        values: [-20, 20],
      },
    ],
  };

  const rows = chartRows(chart);

  assert.deepEqual(rows, [
    { category: 'Net positive', 'series-0': 60, 'series-1': -40 },
    { category: 'Net negative', 'series-0': -75, 'series-1': 25 },
  ]);

  const expectedSigns = [
    [1, -1],
    [-1, 1],
  ];
  rows.forEach((row, index) => {
    const first = row['series-0'];
    const second = row['series-1'];
    assert.ok(typeof first === 'number', `${row.category}: first series stays numeric`);
    assert.ok(typeof second === 'number', `${row.category}: second series stays numeric`);
    assert.equal(
      Math.sign(first),
      expectedSigns[index]?.[0],
      `${row.category}: first series keeps its source sign`,
    );
    assert.equal(
      Math.sign(second),
      expectedSigns[index]?.[1],
      `${row.category}: second series keeps its source sign`,
    );
    assert.equal(
      Math.abs(first) + Math.abs(second),
      100,
      `${row.category}: absolute normalized values total 100%`,
    );
  });
});

test('categorical pie data omits null slices without shifting values', () => {
  const series: ImportedSeries = {
    name: 'Enrollment',
    categories: ['Foundations', 'Algebra', 'Writing'],
    values: [12, null, 8],
  };

  assert.deepEqual(pieData(series), [
    { name: 'Foundations', value: 12 },
    { name: 'Writing', value: 8 },
  ]);
});

test('scatter points omit null coordinates while defaulting missing bubble size', () => {
  const series: ImportedSeries = {
    name: 'Study hours',
    values: [10, null, 30, 40],
    xValues: [1, 2, null, 4],
    bubbleSizes: [5, 6, 7, null],
  };

  assert.deepEqual(scatterPoints(series, 'scatter'), [
    { x: 1, y: 10, z: 5 },
    { x: 4, y: 40, z: 1 },
  ]);
  assert.deepEqual(scatterPoints(series, 'bubble'), [
    { x: 1, y: 10, z: 5 },
  ]);
});

test('radar charts use categorical rows and render through the fallback', () => {
  const chart: ImportedChartModel = {
    type: 'radar',
    series: [
      {
        name: 'Current readiness',
        categories: ['Reasoning', 'Language', 'Science'],
        values: [72, null, 64],
      },
      {
        name: 'Target readiness',
        values: [90, 80, null],
      },
    ],
  };

  assert.deepEqual(chartRows(chart), [
    { category: 'Reasoning', 'series-0': 72, 'series-1': 90 },
    { category: 'Language', 'series-0': null, 'series-1': 80 },
    { category: 'Science', 'series-0': 64, 'series-1': null },
  ]);
  assert.doesNotThrow(() =>
    renderToStaticMarkup(createElement(ImportedChart, { chart })),
  );
});
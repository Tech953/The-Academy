import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

export interface ImportedSeries {
  name: string;
  categories?: Array<string>;
  values: Array<number | null>;
  xValues?: Array<number | null>;
  bubbleSizes?: Array<number | null>;
  color?: string;
}

export interface ImportedChartModel {
  type:
    | 'bar'
    | 'column'
    | 'line'
    | 'area'
    | 'pie'
    | 'doughnut'
    | 'scatter'
    | 'radar'
    | 'bubble';
  title?: string;
  series: Array<ImportedSeries>;
  grouping?: 'clustered' | 'stacked' | 'percentStacked' | 'standard';
  holeSize?: number;
}

const palette = [
  '#5470C6',
  '#91CC75',
  '#FAC858',
  '#EE6666',
  '#73C0DE',
  '#3BA272',
  '#FC8452',
  '#9A60B4',
  '#EA7CCC',
];

function seriesKey(index: number): string {
  return `series-${index}`;
}

function seriesColor(series: ImportedSeries, index: number): string {
  return series.color ?? palette[index % palette.length];
}

export interface ImportedChartRow {
  category: string;
  [key: string]: string | number | null;
}

export interface ImportedScatterPoint {
  x: number;
  y: number;
  z: number;
}

export interface ImportedPieDatum {
  name: string;
  value: number;
}

export function chartRows(chart: ImportedChartModel): Array<ImportedChartRow> {
  const categories = chart.series[0]?.categories ?? [];
  const percent = chart.grouping === 'percentStacked';

  return categories.map((category, index) => {
    const values = chart.series.map((series) => series.values[index] ?? null);
    const total = values.reduce<number>(
      (sum: number, value) => sum + Math.abs(value ?? 0),
      0,
    );
    // Percent-stacked rows normalize nonzero absolute magnitude to 100
    // while preserving source signs.
    const scale = percent && total > 0 ? 100 / total : 1;

    return {
      category,
      ...Object.fromEntries(
        values.map((value, seriesIndex) => [
          seriesKey(seriesIndex),
          value === null ? null : value * scale,
        ]),
      ),
    };
  });
}

export function scatterPoints(
  series: ImportedSeries,
  chartType: 'scatter' | 'bubble',
): Array<ImportedScatterPoint> {
  return series.values.flatMap((y, pointIndex) => {
    const x = series.xValues?.length
      ? (series.xValues[pointIndex] ?? null)
      : pointIndex + 1;
    const z = series.bubbleSizes?.length
      ? (series.bubbleSizes[pointIndex] ?? null)
      : 1;
    if (
      y === null ||
      x === null ||
      (chartType === 'bubble' && z === null)
    ) {
      return [];
    }

    return [{ x, y, z: z ?? 1 }];
  });
}

export function pieData(series?: ImportedSeries): Array<ImportedPieDatum> {
  return (series?.categories ?? []).flatMap((name, index) => {
    const value = series?.values[index] ?? null;

    return value === null ? [] : [{ name, value }];
  });
}

function wrapCategoryLabel(label: string, maxLineLength = 20): Array<string> {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: Array<string> = [];

  for (const word of words) {
    const currentLine = lines.at(-1);
    if (
      currentLine &&
      `${currentLine} ${word}`.length <= maxLineLength
    ) {
      lines[lines.length - 1] = `${currentLine} ${word}`;
    } else {
      lines.push(word);
    }
  }

  return lines.length > 0 ? lines : [''];
}

function RadarCategoryTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: unknown };
}) {
  const label = String(payload?.value ?? '');
  const lines = wrapCategoryLabel(label);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <text
        data-radar-category-label="true"
        aria-label={label}
        textAnchor="middle"
        fill="#334155"
        fontSize={26}
        fontWeight={500}
      >
        <title>{label}</title>
        {lines.map((line, index) => (
          <tspan
            key={`${index}-${line}`}
            x={0}
            dy={index === 0 ? '1.15em' : '1.1em'}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function RadarSeriesLegend({
  series,
}: {
  series: Array<ImportedSeries>;
}) {
  return (
    <div
      role="list"
      aria-label="Chart series"
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px 40px',
        padding: '8px 24px 0',
      }}
    >
      {series.map((item, index) => (
        <div
          key={seriesKey(index)}
          data-radar-series-item="true"
          role="listitem"
          style={{
            flex: '1 1 42%',
            minWidth: 0,
            maxWidth: '48%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              marginTop: 6,
              flex: '0 0 18px',
              borderRadius: 3,
              background: seriesColor(item, index),
            }}
          />
          <span
            data-radar-series-label="true"
            aria-label={item.name}
            style={{
              minWidth: 0,
              color: '#334155',
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.25,
              overflowWrap: 'anywhere',
            }}
          >
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function chartHasRenderableData(
  chart: ImportedChartModel,
  rows: Array<ImportedChartRow>,
): boolean {
  if (chart.type === 'pie' || chart.type === 'doughnut') {
    return pieData(chart.series[0]).length > 0;
  }

  if (chart.type === 'scatter' || chart.type === 'bubble') {
    const chartType = chart.type;
    return chart.series.some(
      (series) => scatterPoints(series, chartType).length > 0,
    );
  }

  return rows.some((row) =>
    chart.series.some(
      (_, index) => typeof row[seriesKey(index)] === 'number',
    ),
  );
}

export default function ImportedChart({
  chart,
}: {
  chart: ImportedChartModel;
}) {
  const isPercent = chart.grouping === 'percentStacked';
  const stackId =
    chart.grouping === 'stacked' || isPercent ? 'stack' : undefined;
  const rows = chartRows(chart);
  const hasRenderableData = chartHasRenderableData(chart, rows);
  const common = {
    data: rows,
    margin: { top: 12, right: 20, bottom: 12, left: 4 },
  };
  const percentTick = isPercent
    ? (value: number) => `${value}%`
    : undefined;
  const decorations = (
    <>
      <Tooltip animationDuration={0} />
      {chart.series.length > 1 ? <Legend /> : null}
    </>
  );

  let graphic: React.ReactNode;
  if (chart.type === 'scatter' || chart.type === 'bubble') {
    const scatterType = chart.type;
    graphic = (
      <ScatterChart margin={common.margin}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" />
        <XAxis type="number" dataKey="x" tickLine={false} axisLine={false} />
        <YAxis type="number" dataKey="y" tickLine={false} axisLine={false} />
        {chart.type === 'bubble' ? (
          <ZAxis dataKey="z" range={[64, 400]} />
        ) : null}
        {decorations}
        {chart.series.map((series, index) => (
          <Scatter
            key={seriesKey(index)}
            name={series.name}
            data={scatterPoints(series, scatterType)}
            fill={seriesColor(series, index)}
            isAnimationActive={false}
          />
        ))}
      </ScatterChart>
    );
  } else if (chart.type === 'line') {
    graphic = (
      <LineChart {...common}>
        <CartesianGrid
          stroke="#E2E8F0"
          strokeDasharray="4 4"
          vertical={false}
        />
        <XAxis dataKey="category" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={percentTick} />
        {decorations}
        {chart.series.map((series, index) => (
          <Line
            key={seriesKey(index)}
            dataKey={seriesKey(index)}
            name={series.name}
            stroke={seriesColor(series, index)}
            strokeWidth={3}
            dot
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    );
  } else if (chart.type === 'area') {
    graphic = (
      <AreaChart {...common}>
        <CartesianGrid
          stroke="#E2E8F0"
          strokeDasharray="4 4"
          vertical={false}
        />
        <XAxis dataKey="category" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={percentTick} />
        {decorations}
        {chart.series.map((series, index) => (
          <Area
            key={seriesKey(index)}
            dataKey={seriesKey(index)}
            name={series.name}
            stroke={seriesColor(series, index)}
            fill={seriesColor(series, index)}
            fillOpacity={0.24}
            stackId={stackId}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    );
  } else if (chart.type === 'pie' || chart.type === 'doughnut') {
    const series = chart.series[0];
    const data = pieData(series);
    graphic = (
      <PieChart>
        <Tooltip animationDuration={0} />
        <Legend />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={
            chart.type === 'doughnut'
              ? `${Math.min(chart.holeSize ?? 50, 75)}%`
              : 0
          }
          outerRadius="80%"
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`${entry.name}-${index}`}
              fill={palette[index % palette.length]}
            />
          ))}
        </Pie>
      </PieChart>
    );
  } else if (chart.type === 'bar') {
    graphic = (
      <BarChart {...common} layout="vertical">
        <CartesianGrid
          stroke="#E2E8F0"
          strokeDasharray="4 4"
          horizontal={false}
        />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={percentTick}
        />
        <YAxis
          type="category"
          dataKey="category"
          tickLine={false}
          axisLine={false}
        />
        {decorations}
        {chart.series.map((series, index) => (
          <Bar
            key={seriesKey(index)}
            dataKey={seriesKey(index)}
            name={series.name}
            fill={seriesColor(series, index)}
            stackId={stackId}
            radius={[0, 6, 6, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    );
  } else {
    if (chart.type !== 'column' && chart.type !== 'radar') {
      throw new Error(`Unsupported imported chart type: ${chart.type}`);
    }
    const isRadar = chart.type === 'radar';
    graphic = (
      <BarChart
        {...common}
        margin={
          isRadar
            ? { top: 12, right: 28, bottom: 12, left: 20 }
            : common.margin
        }
      >
        <CartesianGrid
          stroke="#E2E8F0"
          strokeDasharray="4 4"
          vertical={false}
        />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={false}
          interval={isRadar ? 0 : undefined}
          height={isRadar ? 144 : undefined}
          tickMargin={isRadar ? 6 : undefined}
          tick={isRadar ? <RadarCategoryTick /> : undefined}
        />
        <YAxis tickLine={false} axisLine={false} tickFormatter={percentTick} />
        {isRadar ? <Tooltip animationDuration={0} /> : decorations}
        {chart.series.map((series, index) => (
          <Bar
            key={seriesKey(index)}
            dataKey={seriesKey(index)}
            name={series.name}
            fill={seriesColor(series, index)}
            stackId={stackId}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    );
  }

  if (!hasRenderableData) {
    graphic = null;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {chart.title ? (
        <div
          style={{
            height: 44,
            fontSize: 24,
            fontWeight: 700,
            color: '#0F172A',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {chart.title}
        </div>
      ) : null}
      {graphic ? (
        chart.type === 'radar' ? (
          <div
            style={{
              width: '100%',
              height: chart.title ? 'calc(100% - 44px)' : '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ minHeight: 0, flex: '1 1 auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                {graphic}
              </ResponsiveContainer>
            </div>
            <div style={{ height: 136, flex: '0 0 136px' }}>
              <RadarSeriesLegend series={chart.series} />
            </div>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: chart.title ? 'calc(100% - 44px)' : '100%',
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {graphic}
            </ResponsiveContainer>
          </div>
        )
      ) : (
        <div
          role="status"
          aria-live="polite"
          style={{
            width: '100%',
            height: chart.title ? 'calc(100% - 44px)' : '100%',
            display: 'grid',
            placeItems: 'center',
            boxSizing: 'border-box',
            padding: 24,
            color: '#64748B',
            fontSize: 16,
            textAlign: 'center',
          }}
        >
          No chart data available
        </div>
      )}
    </div>
  );
}

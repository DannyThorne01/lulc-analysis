'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StackedAreaChartProps {
  // One object per x-axis point — must include xKey plus one numeric field per area key
  data: Record<string, number | string>[];
  // Which data fields to render as stacked areas (must match keys in data objects)
  keys: string[];
  // Maps each key to a hex color string WITHOUT the # prefix e.g. { "10": "6a4c93" }
  colors: Record<string, string>;
  // Which field in data represents the x axis (e.g. "year")
  xKey: string;
  height?: number;
}

/* StackedAreaChart — generic, purely presentational.
   No LULC-specific logic lives here.  Data shaping
   happens in the UI wrapper (LineChartUI). */
const StackedAreaChart = ({
  data,
  keys,
  colors,
  xKey,
  height = 280,
}: StackedAreaChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10 }}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 10 }}
          width={42}
          // Convert raw hectare values to "123k" for readability
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
        />

        <Tooltip
          formatter={(value: number, name: string) => [
            `${Number(value).toLocaleString()} ha`,
            name,
          ]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />

        {/* Render one Area per visible land cover class */}
        {keys.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="stack"                           // same stackId → stacked
            stroke={`#${colors[key] ?? '888888'}`}
            fill={`#${colors[key] ?? '888888'}`}
            fillOpacity={0.85}
            strokeWidth={0}
            dot={false}
            activeDot={false}
            isAnimationActive={false}                 // skip intro animation for performance
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default StackedAreaChart;

'use client';

import React, { useMemo } from 'react';
import HeatmapRecharts, { HeatmapCell } from './charts/HeatmapRecharts';
import { Props } from '../module/global';
import data from '../data/lc.json';

/* HeatMapUI — no filtering, shows all class→class transitions.
   Single useMemo computes everything from the raw GEE matrix.
   x = TO class (column), y = FROM class (row)                  */
const HeatMapUI = ({ matrix, uniqueKeys }: Props) => {

  const { cells, labels } = useMemo(() => {
    if (!matrix || !uniqueKeys || !Object.keys(matrix).length) {
      return { cells: [], labels: [] };
    }

    // Parse all "before_after" keys
    const entries = Object.entries(matrix).map(([key, count]) => {
      const [before, after] = key.split('_').map(Number);
      return { before, after, count: Number(count) };
    });

    // All unique class IDs appearing in the matrix (both axes use same set)
    const allKeys = Array.from(
      new Set([...entries.map(e => e.before), ...entries.map(e => e.after)])
    ).sort((a, b) => a - b);

    const keyIndex = Object.fromEntries(allKeys.map((k, i) => [k, i]));

    // Row totals include self-transitions so values are true proportions
    const rowTotals: Record<number, number> = {};
    entries.forEach(({ before, count }) => {
      rowTotals[before] = (rowTotals[before] ?? 0) + count;
    });

    // Build cells: x = TO (column), y = FROM (row)
    const cells: HeatmapCell[] = entries
      .map(({ before, after, count }) => {
        const total = rowTotals[before];
        if (!total) return null;
        const x = keyIndex[after];
        const y = keyIndex[before];
        if (x === undefined || y === undefined) return null;
        return { x, y, value: count / total };
      })
      .filter((c): c is HeatmapCell => c !== null);

    // Shortened display names for axis labels
    const labels = allKeys.map(k =>
      data.reductions[data.key_map[k.toString()]] ?? String(k)
    );

    return { cells, labels };
  }, [matrix, uniqueKeys]);

  if (!cells.length) {
    return (
      <p style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>
        No transition data available.
      </p>
    );
  }

  return (
    <HeatmapRecharts
      cells={cells}
      xLabels={labels}   // TO  — columns (x axis)
      yLabels={labels}   // FROM — rows   (y axis)
      // from = yLabel (FROM class), to = xLabel (TO class)
      getTooltip={(from, to, value) =>
        `${(value * 100).toFixed(1)}% of ${from} → ${to}`
      }
    />
  );
};

export default HeatMapUI;

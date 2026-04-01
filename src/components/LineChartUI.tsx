'use client';

import React, { useState, useMemo } from 'react';
import StackedAreaChart from './charts/StackedAreaChart';
import Dropdown from './molecules/dropdown';
import { LineGraphProps } from '../module/global';
import data from '../data/lc.json';

/* LineChartUI — bridges raw GEE analysisLulc output and StackedAreaChart.
   Responsibilities:
   ① Reshape GEE per-year groups into recharts row objects
   ② Track which land cover classes are currently visible
   ③ Provide add (Dropdown) and remove (buttons) controls per class     */
const LineChartUI = ({ info, vals }: LineGraphProps) => {

  // All land cover class IDs present in this country's dataset
  const availableClasses: number[] = useMemo(
    () => info[0].groups.map((g) => g.lc),
    [info]
  );

  // Initialise with up to 7 random classes so the chart isn't overwhelming
  const [visibleKeys, setVisibleKeys] = useState<number[]>(
    () => [...availableClasses].sort(() => 0.5 - Math.random()).slice(0, 7)
  );

  // ── ① Data shaping ────────────────────────────────────────────────────────
  // GEE returns: info[i] = { groups: [{ lc: 10, area: 12345 }, ...] }  (i = year index)
  // Recharts needs: [{ year: 2000, "10": 12345, "11": 678, ... }, ...]
  const chartData = useMemo(() => {
    return info.map((yearEntry, i) => {
      const row: Record<string, number | string> = { year: 2000 + i };
      yearEntry.groups.forEach((g) => {
        row[g.lc.toString()] = g.area;
      });
      return row;
    });
  }, [info]);

  // Build color lookup from lc.json for all available classes
  const colorMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    availableClasses.forEach((lc) => {
      map[lc.toString()] = data.class_color_map[lc.toString()] ?? '888888';
    });
    return map;
  }, [availableClasses]);

  // ── ② Handlers ────────────────────────────────────────────────────────────
  // Dropdown yields a display name e.g. "Cropland" → resolve to numeric LC ID
  const handleAdd = (selectedName: string) => {
    const lcId = Number(data.reductions_to_key[selectedName]);
    if (lcId && !visibleKeys.includes(lcId)) {
      setVisibleKeys((prev) => [...prev, lcId]);
    }
  };

  const handleRemove = (lcId: number) => {
    setVisibleKeys((prev) => prev.filter((k) => k !== lcId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* ③ Pure chart — only receives shaped data, no raw GEE types */}
      <StackedAreaChart
        data={chartData}
        keys={visibleKeys.map(String)}
        colors={colorMap}
        xKey="year"
        height={280}
      />

      {/* Add a class via the shared Dropdown component */}
      <Dropdown
        options={vals}
        onChange={handleAdd}
        label="Add class"
        isEditable={true}
        style={{
          borderRadius: '50px',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      />

      {/* Active class pills — clicking a button removes it from the chart */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {visibleKeys.map((lcId) => (
          <button
            key={lcId}
            onClick={() => handleRemove(lcId)}
            title="Click to remove"
            style={{
              backgroundColor: `#${colorMap[lcId.toString()]}`,
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {data.reductions_to_key_inverse[lcId.toString()] ?? lcId}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LineChartUI;

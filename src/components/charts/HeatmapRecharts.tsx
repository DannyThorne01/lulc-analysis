'use client';

import React, { useState } from 'react';

export interface HeatmapCell {
  x: number;     // column index — TO class
  y: number;     // row index    — FROM class
  value: number; // 0–1 proportion
}

interface TooltipState {
  left: number;
  top: number;
  text: string;
}

interface HeatmapRechartsProps {
  cells: HeatmapCell[];
  xLabels: string[];  // TO   axis — columns
  yLabels: string[];  // FROM axis — rows
  // Called as getTooltip(fromLabel, toLabel, value)
  getTooltip?: (from: string, to: string, value: number) => string;
}

// White → teal, clamped domain [0, 0.45] so minority transitions are visible
// even when self-transitions dominate at 80–99%
function valueToColor(v: number): string {
  const clamped = Math.min(v / 0.45, 1); // clamp at 45% like the original D3 scale
  const r = Math.round(255 + clamped * (42  - 255));
  const g = Math.round(255 + clamped * (179 - 255));
  const b = Math.round(255 + clamped * (162 - 255)); // target: #2ab3a2 teal
  return `rgb(${r},${g},${b})`;
}

/* HeatmapRecharts — fixed square SVG heatmap.
   500×500 viewBox with symmetric margins so the grid is always square.
   Cells are always square: cellSize = squareGridSize / n (n==m since
   both axes use the same class list).
   No legend — tooltip carries all the information.                      */
const HeatmapRecharts = ({ cells, xLabels, yLabels, getTooltip }: HeatmapRechartsProps) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Fixed 500×500 canvas — symmetric horizontal margins so grid is centred
  const SIZE = 750;
  // Left/right margins: left needs more room for Y labels, right just breathing room
  const M = { top: 20, right: 10, bottom: 20, left: 20 };

  // Chart area — W ≈ H so when n == m cells are naturally square
  const W = SIZE - M.left - M.right;  // 420
  const H = SIZE - M.top  - M.bottom; // 410

  const n = xLabels.length;
  const m = yLabels.length;

  // Square cells: use the smaller of W/n or H/m so cells never stretch
  const cellSize = n > 0 && m > 0 ? Math.min(W / n, H / m) : 20;

  // Actual grid dimensions (may be smaller than W×H if axes have different counts)
  const gridW = cellSize * n+2;
  const gridH = cellSize * m+2;

  return (
    <div style={{ position: 'relative' }}>
      {/*
        viewBox makes the SVG scale to fill container width while keeping aspect ratio.
        height="auto" → browser computes height from the 500×500 square viewBox.
      */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* subtle background behind the chart area */}
        <rect
          x={M.left} y={M.top}
          width={gridW} height={gridH}
          fill="#f5f5f5"
        />

        <g transform={`translate(${M.left},${M.top})`}>

          {/* ── Cells ──────────────────────────────────────────────────── */}
          {cells.map((cell, i) => (
            <rect
              key={i}
              x={cell.x * cellSize + 1}
              y={cell.y * cellSize + 1}
              width={Math.max(cellSize - 2, 0.5)}
              height={Math.max(cellSize - 2, 0.5)}
              fill={valueToColor(cell.value)}
              rx={Math.min(cellSize * 0.12, 50)}
              ry={Math.min(cellSize * 0.12, 50)}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                // FROM = y axis label, TO = x axis label
                const fromLabel = yLabels[cell.y] ?? String(cell.y);
                const toLabel   = xLabels[cell.x] ?? String(cell.x);
                const text = getTooltip
                  ? getTooltip(fromLabel, toLabel, cell.value)
                  : `${(cell.value * 100).toFixed(1)}% of ${fromLabel} → ${toLabel}`;

                // Clamp tooltip to viewport so it never goes off-screen
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                const estW = text.length * 7.5 + 24;
                const estH = 38;
                const rawLeft = e.pageX + 14;
                const rawTop  = e.pageY + 14;
                setTooltip({
                  left: rawLeft + estW > vw ? e.pageX - estW - 10 : rawLeft,
                  top:  rawTop  + estH > vh ? e.pageY - estH - 10 : rawTop,
                  text,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}

          {/* ── X axis — TO labels, rotated -90° below grid ───────────── */}
          {/* {xLabels.map((label, i) => (
            <text
              key={`x${i}`}
              x={(i + 0.5) * cellSize}
              y={gridH + 5}
              fontSize={Math.max(10, Math.min(cellSize * 0.7, 28))}
              textAnchor="end"
              fill="#4a4a4a"
              fontFamily="Arial, sans-poppins"
              
              transform={`rotate(-90, ${(i + 0.5) * cellSize}, ${gridH + 5})`}
            >
              {label}
            </text>
          ))} */}

          {/* ── Y axis — FROM labels, left of grid ───────────────────── */}
          {/* {yLabels.map((label, i) => (
            <text
              key={`y${i}`}
              x={-6}
              y={(i + 0.5) * cellSize}
              fontSize={Math.max(10, Math.min(cellSize * 0.7, 25))}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#4a4a4a"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              {label}
            </text>
          ))} */}

        </g>
      </svg>

      {/* ── Tooltip — clamped to viewport ──────────────────────────────── */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.left,
          top:  tooltip.top,
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 13,
          fontFamily: 'Arial, sans-serif',
          boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none',
          zIndex: 9999,
          whiteSpace: 'nowrap',
          color: '#222',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default HeatmapRecharts;

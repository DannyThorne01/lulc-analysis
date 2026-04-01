# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Environment Setup

Copy `.env.example` to `.env` and set `EE_API_KEY` to the Google Earth Engine service account private key JSON string.

## Architecture

This is a Next.js 14 app for visualizing Land Use/Land Cover (LULC) data via Google Earth Engine (GEE). All GEE calls are server-only (`'use server'`), protecting credentials from the client.

### Data Flow

1. User selects a country/year in the UI (state managed in `src/app/page.tsx` via React Context)
2. Client components call server functions in `src/module/ee.ts`
3. Server functions authenticate with GEE, query the **GLC-FCS30D** dataset, and return tile URLs or computed statistics
4. MapLibre renders tile URLs as raster overlays; D3.js renders charts

### Key Modules

- **`src/module/ee.ts`** — All server-side GEE functions (`lulcLayer`, `analysisLulc`, `transferMatrixLulc`, `bruv`, `insights`). This is where all Earth Engine computation happens.
- **`src/module/ee-server.ts`** — GEE authentication utilities (`authenticate`, `getMapId`, `evaluate`).
- **`src/module/global.ts`** — TypeScript types and React Context definition for global state.
- **`src/data/lc.json`** — Critical land cover class metadata: numeric IDs, display names, hex colors, and lookup maps. Referenced throughout the app for palette/legend generation.

### Component Structure

- **`src/app/page.tsx`** — Root client component; owns all global state and provides Context.
- **`src/components/worldmap.tsx`** — MapLibre map with LULC raster tiles and legend.
- **`src/components/sidepanel.tsx`** — Orchestrates data fetching and renders the three chart panels.
- **`src/components/charts/`** — D3 visualizations: `heatmap.tsx` (transition matrix), `line-graph.tsx` (stacked area over time), `insight.tsx` (inflow/outflow bars).
- **`src/components/molecules/`** — UI controls: `slider.tsx` (year), `dropdown.tsx` (country/class), `circle.tsx` (draggable map circle for area analysis).

### GEE Dataset Details

- Dataset: `projects/sat-io/open-datasets/GLC-FCS30D/annual` (30m resolution, 2000–2022)
- Country boundaries: `FAO/GAUL` feature collection
- Year bands: band `b1` = year 2000, `b23` = year 2022
- Path aliases: `@/*` maps to `src/*`

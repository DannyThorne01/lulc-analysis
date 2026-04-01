import React, { useContext, useEffect, useState } from 'react';
import HeatMapUI from './HeatMapUI';
import LineChartUI from './LineChartUI';
import Dropdown from './molecules/dropdown';
import { Context } from '../module/global';
import { analysisLulc, transferMatrixLulc } from '../module/ee';
import data from '../data/lc.json';

const SidePanel = () => {
  const context = useContext(Context);
  const [loading, setLoading] = useState(false);

  if (!context) {
    throw new Error('Context must be used within a ContextProvider');
  }

  const {
    heatmapData, setHeatMapData,
    linegraphData, setLineGraphData,
    country, setCountry,
  } = context;

  useEffect(() => {
    if (!country) return;

    async function loadCountryData() {
      setLoading(true);
      try {
        const [heatmap, linegraph] = await Promise.all([
          transferMatrixLulc(country),
          analysisLulc(country),
        ]);

        setHeatMapData(heatmap);

        if (linegraph.evaluatedAreas.length > 0) {
          const mappings: Record<number, number> = linegraph.evaluatedAreas[0].groups.reduce(
            (acc: Record<number, number>, e: { lc: number }, index: number) => {
              acc[index] = e.lc;
              return acc;
            },
            {}
          );
          const vals = Object.values(mappings).map(
            (lc) => data.reductions[data.key_map[lc.toString()]]
          );
          setLineGraphData({ info: linegraph.evaluatedAreas, vals });
        }
      } catch (error) {
        console.error('Error fetching country data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCountryData();
  }, [country]);

  return (
    <div className="fixed top-0 right-0 w-[30vw] h-screen bg-gray-50 border-l border-gray-200 flex flex-col z-[1000] shadow-2xl">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-slate-800 px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">GLC-FCS30D · 30 m</span>
        </div>
        <h1 className="text-white text-xl font-bold tracking-tight leading-none">LULC Analysis</h1>
        <p className="text-slate-400 text-xs mt-1">Land Use / Land Cover · 2000 – 2022</p>

        {/* Country search inside header */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Select Country
          </label>
          <Dropdown
            options={data.countries}
            value={country}
            onChange={setCountry}
            label="Search countries…"
            isEditable={true}
            style={{ width: '100%' }}
          />
        </div>

        {/* Active country badge */}
        {country && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-300">Viewing:</span>
            <span className="text-xs font-semibold text-white bg-slate-600 rounded-full px-3 py-0.5">
              {country}
            </span>
            {loading && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="inline-block w-3 h-3 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin"></span>
                Loading…
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Charts scroll area ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Transition Heatmap card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Transition Matrix</h2>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Heatmap</span>
          </div>
          <div className="p-3">
            {loading ? (
              <Placeholder message="Computing transitions…" />
            ) : !heatmapData ? (
              <Placeholder message="Select a country to begin." idle />
            ) : (
              <HeatMapUI matrix={heatmapData.matrix} uniqueKeys={heatmapData.uniqueKeys} />
            )}
          </div>
        </div>

        {/* Land Cover Over Time card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Land Cover Over Time</h2>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Stacked area</span>
          </div>
          <div className="p-3">
            {loading ? (
              <Placeholder message="Fetching time series…" />
            ) : !linegraphData ? (
              <Placeholder message="Select a country to begin." idle />
            ) : (
              <LineChartUI info={linegraphData.info} vals={linegraphData.vals} />
            )}
          </div>
        </div>

      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 py-2.5 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-400 text-center">
          Powered by Google Earth Engine · FAO/GAUL boundaries
        </p>
      </div>
    </div>
  );
};

const Placeholder = ({ message, idle = false }: { message: string; idle?: boolean }) => (
  <div className="flex flex-col items-center justify-center py-10 gap-3">
    {idle ? (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      </div>
    ) : (
      <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
    )}
    <p className="text-xs text-gray-400">{message}</p>
  </div>
);

export default SidePanel;

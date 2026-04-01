'use client';

import React, { useState } from 'react';
import MapCanvas from '../components/worldmap';
import SidePanel from '../components/sidepanel';
import { Context, Props, LineGraphProps } from '../module/global';
import { Map } from 'maplibre-gl';

const Page: React.FC = () => {
  const [map, setMap] = useState<Map>();
  const [tile, setTile] = useState<string | undefined>(undefined);
  const [heatmapData, setHeatMapData] = useState<Props | undefined>(undefined);
  const [linegraphData, setLineGraphData] = useState<LineGraphProps | undefined>(undefined);
  const [country, setCountry] = useState<string>('');
  const [circleData, setCircleData] = useState({
    center: { lng: -60, lat: 5 },
    radius: 50000,
  });
  const [year, setYear] = useState<number>(2022);
  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined);

  const contextDict = {
    map, setMap,
    tile, setTile,
    country, setCountry,
    year, setYear,
    selectedClass, setSelectedClass,
    heatmapData, setHeatMapData,
    linegraphData, setLineGraphData,
    circleData, setCircleData,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flex: 3 }}>
        <Context.Provider value={contextDict}>
          <MapCanvas />
        </Context.Provider>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Context.Provider value={contextDict}>
          <SidePanel />
        </Context.Provider>
      </div>
    </div>
  );
};

export default Page;

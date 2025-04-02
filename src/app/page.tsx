'use client'; // Ensure the page runs on the client side

import React, { useState, useEffect, useRef } from "react";
import MapCanvas from '../components/worldmap'; // Adjust path as needed
import SidePanel from '../components/sidepanel'; // Optional
import Dropdown from "../components/molecules/dropdown"
import evaluatedAreas from '../data/evaluated_areas.json';
import data from '../data/lc.json';
import { Context,Props, LineGraphProps} from '../module/global';
import { Map } from 'maplibre-gl'


const Page: React.FC = () => {
  const [map, setMap] = useState<Map>();
  const [tile, setTile] = useState<string | undefined>(undefined);
  const [heatmapData, setHeatMapData] = useState<Props | undefined>(undefined);
  const [insightsData, setInsightsData] = useState<Props | undefined>(undefined);
  const [linegraphData, setLineGraphData] = useState<LineGraphProps| undefined>(undefined);

  const [country,setCountry] = useState<string>("")
  const [circleData, setCircleData] = useState({
    center: { lng: -60, lat: 5 }, 
    radius: 50000, 
  });
  const [year, setYear] = useState<number>(2022);
  const [selectedClass, setSelectedClass] = useState<number|undefined>(undefined);
  const [showInsights, setShowInsights] = useState<boolean>(false)

  const contextDict = {
    map,setMap,
    tile,setTile,
    country,setCountry,
    year,setYear,
    selectedClass, setSelectedClass,
    heatmapData,setHeatMapData,
    linegraphData,setLineGraphData,
    insightsData,setInsightsData,
    circleData,setCircleData,
    showInsights, setShowInsights
  };
  
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Dropdown
        options={data.countries} 
        value={country}
        onChange={setCountry}
        label="Select a Country"
        isEditable={true} 
        style={{
          position: 'absolute', 
          top: '5%',           
          left: '30%',          
          transform: 'translateX(-50%)', 
          width: '400px',
          padding: '5px',
          fontSize: '16px',
          borderRadius: '50px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      />
      <div style={{ flex: 3 }}>
      <Context.Provider value={contextDict}><MapCanvas /></Context.Provider>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
      <Context.Provider value={contextDict}><SidePanel /></Context.Provider>
      </div>
    </div>
  );
};
export default Page;

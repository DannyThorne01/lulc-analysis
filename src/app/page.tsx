'use client'; // Ensure the page runs on the client side

import React, { useState, useEffect, useRef } from "react";
import MapCanvas from '../components/worldmap'; // Adjust path as needed
import SidePanel from '../components/sidepanel'; // Optional
import evaluatedAreas from '../data/evaluated_areas.json';
import data from '../data/lc.json';
import { Context,Props, LineGraphProps} from '../module/global';
import { Map } from 'maplibre-gl'


const Page: React.FC = () => {
  const [map, setMap] = useState<Map>();
  const [tile, setTile] = useState<string | undefined>(undefined);
  const [heatmapData, setHeatMapData] = useState<Props | undefined>(undefined);
  const [linegraphData, setLineGraphData] = useState<LineGraphProps| undefined>(undefined);
  const [country,setCountry] = useState<string>("")
  const contextDict = {
    map,setMap,tile,setTile,
    heatmapData,setHeatMapData,linegraphData,setLineGraphData,
    country,setCountry
  };

  const handleDropDownClick = (event) => {
    const selectedValue = event.target.value
    if(selectedValue){
      setCountry(selectedValue);
    }
  }
  // useEffect(() => {
  //   console.log("Updated Country State:", country);
  // }, [country]);
   
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>

      {/* Dropdown */}
    <select
      id="homepage-dropdown"
      onChange={handleDropDownClick}
      style={{
        position: 'absolute', // Makes it overlay on top of the map
        top: '5%',           // Adjusts the vertical position
        left: '50%',          // Centers horizontally
        transform: 'translateX(-50%)', // Ensures proper centering
        width: '500px',
        padding: '10px',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: '#f9f9f9',
        color: '#333',
        cursor: 'pointer',
        zIndex: 1000, // Ensures it stays on top of other elements
      }}
    >
      {
        data.countries.map((country, index) => (
          <option key={index} value={country}>
          {country}
          </option>
        ))
      }
    </select>
      {/* Map Canvas (Main Map View) */}
      <div style={{ flex: 3 }}>
      <Context.Provider value={contextDict}><MapCanvas /></Context.Provider>
        
      </div>

      {/* Side Panel (Optional) */}
      <div style={{ flex: 1, overflow: 'auto' }}>
      <Context.Provider value={contextDict}><SidePanel /></Context.Provider>
      </div>
    </div>
  );
};

export default Page;

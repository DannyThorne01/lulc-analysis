import React from 'react';
import HeatMap from './charts/heatmap'; // Assuming HeatMap is in the same directory
import StackLineGraph from './charts/line-graph'; // Assuming StackLineGraph is in the same 
import Insight from './charts/insight';
import { Context,Props, LineGraphProps} from '../module/global';
import { useContext, useEffect, useState } from "react";
import { analysisLulc, lulcLayer, transferMatrixLulc,bruv} from "../module/ee";
import Dropdown from './molecules/dropdown';
import data from "../data/lc.json";


const SidePanel = () => {
  const context = useContext(Context);
  const [loading, setLoading] = useState(false); // Loading states
  const [loadingInsights , setLoadingInsights] = useState(false)
  const [values, setValues] = useState<string[]>([]);

    if (!context) {
      throw new Error('Context must be used within a ContextProvider');
    }
    const { heatmapData,setHeatMapData,
            linegraphData,setLineGraphData,
            insightsData, setInsightsData,
            country, setCountry,
            circleData,setCircleData,
            year, setYear,
            selectedClass,setSelectedClass,
            showInsights,setShowInsights} = context;

    useEffect(() => {
      if (!country) return;
      async function loadHeatMap() {
        setLoading(true); 
        try {
          const heatmap = await transferMatrixLulc(country);
          const linegraph = await analysisLulc(country);
         
          console.log(linegraph.evaluatedAreas)
         
          setHeatMapData(heatmap); 
   
          // Find  the values in the linegraph
          if (linegraph.evaluatedAreas.length > 0) {
            const mappings: Record<number, number> = linegraph.evaluatedAreas[0].groups.reduce((acc, e, index) => {
              acc[index] = e.lc; // Use index as key, e.lc as value
              return acc;
            }, {});
            const temp = Object.values(mappings);
            const updatedValues = temp.map((value) => data.reductions[data.key_map[value.toString()]]);

            const lineGraphData: LineGraphProps = {
              info: linegraph.evaluatedAreas,
              vals: updatedValues
            };
            
            setLineGraphData(lineGraphData);
            setValues(updatedValues);
          }
        } catch (error) {
          console.error("Error fetching heatmap data:", error);
        } finally {
          setLoading(false);
        }
      }
      loadHeatMap();
    }, [country]);

    useEffect(() => {
      if (!showInsights) return;
      async function loadInsights() {
        setLoadingInsights(true)
        try {
          if (selectedClass){
            const insight = await bruv(country,data.values.indexOf(data.reductions_to_key[selectedClass]),year,circleData)
            setInsightsData(insight) 
          }
        }
        catch(error){
          console.error("Error fetching Bargraph data:", error);
        } finally {
          setLoadingInsights(false); 
        }
      }
      loadInsights()
    },[showInsights,year,circleData])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '30vw', 
        height: '100vh',
        borderLeft: '1px solid #ccc',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        zIndex: 1000,
    
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          overflowY: 'auto', 
          flex: 1, 
          maxHeight: '100%',
          paddingBottom: '120px'
        }}
      >
        <div
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            backgroundColor: '#fff',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>HeatMap</h3>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#888' }}>Generating...</p>
          ) : !heatmapData ? (
            <p style={{ textAlign: 'center', color: '#888' }}>NO DATA</p>
          ) : (
            <HeatMap matrix = {heatmapData.matrix} uniqueKeys = {heatmapData.uniqueKeys} 
                       />
          )}
        </div>
  
        <div
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#fff',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Stack Line Graph</h3>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#888' }}>Generating...</p>
          ) : !linegraphData ? (
            <p style={{ textAlign: 'center', color: '#888' }}>NO DATA</p>
          ) : (
            <StackLineGraph info={linegraphData.info} vals={linegraphData.vals} />
          )}
        </div>
        <div
          style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#fff',
            position: "relative",
            marginBottom: '20px',
          }}
        >
          <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
            Insights Graph
          </h3>
          {insightsData && (
            <button
              onClick={() => {
                setInsightsData(undefined);
                setShowInsights(false);
                setSelectedClass(undefined);
              }}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                color: "#333",
              }}
            >
              ← Back
            </button>
          )}
  
          {loadingInsights ? (
            <p style={{ textAlign: "center", color: "#888" }}>Generating...</p>
          ) : insightsData ? (
            <Insight matrix = {insightsData.matrix} uniqueKeys = {insightsData.uniqueKeys} />
          ) : (
            <>
              <Dropdown
                options={values}
                onChange={(selected) => {
                  setSelectedClass(selected)
                  setShowInsights(true)
                }}
                isEditable={true}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
  
};

export default SidePanel;

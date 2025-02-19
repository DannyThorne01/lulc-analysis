import React from 'react';
import HeatMap from './charts/heatmap'; // Assuming HeatMap is in the same directory
import StackLineGraph from './charts/line-graph'; // Assuming StackLineGraph is in the same 
import Insight from './charts/insight';
import { Context } from '../module/global';
import { useContext, useEffect, useState } from "react";
import { analysisLulc, lulcLayer, transferMatrixLulc,insights} from "../module/ee";
import evaluatedAreas from '../data/evaluated_areas.json';

const SidePanel = () => {
  const context = useContext(Context);
  const [loading, setLoading] = useState(false); // Loading states
  const [loadingInsights , setLoadingInsights] = useState(false)
    if (!context) {
      throw new Error('Context must be used within a ContextProvider');
    }
    const { heatmapData,setHeatMapData,
            linegraphData,setLineGraphData,insightsData, setInsightsData,
            country, circleData,year, setYear,selectedClass,seeInsight,setSeeInsight } = context;
    useEffect(() => {
      if (!country) return;
      async function loadHeatMap() {
        setLoading(true); // Start loading
        try {
          
          const heatmap = await transferMatrixLulc(country); // Slow function
          const linegraph = await analysisLulc(country);
          console.log(heatmap)
          // linegData = linegraph
          setLineGraphData(linegraph.evaluatedAreas)
          setHeatMapData(heatmap); // Update heatmap data
        } catch (error) {
          console.error("Error fetching heatmap data:", error);
        } finally {
          setLoading(false); // Stop loading
        }
      }
      loadHeatMap();
    }, [country]);
    useEffect(() => {
      if (!country) return;
      async function loadInsights() {
        setLoadingInsights(true)
        try {
          console.log("LOADING")
          const insight = await insights(country,selectedClass,year,circleData)
          setInsightsData(insight)
        }
        catch(error){
          console.error("Error fetching Bargraph data:", error);
        } finally {
          setLoadingInsights(false); 
        }
      }
      loadInsights()
    },[year])
  return (
    <div
      style={{
        position: 'fixed', // Anchors the panel to the viewport
        top: 0,
        right: 0, // Anchors it to the right side
        width: '30vw', // Takes up 30% of the viewport width
        height: '100vh', // Full height of the viewport
        overflowY: 'auto', // Scroll if content overflows
        backgroundColor: '#f9f9f9',
        borderLeft: '1px solid #ccc',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        zIndex: 1000, // Ensures it stays above other content
        boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)', // Subtle shadow for better appearance
        display: 'flex',
        flexDirection: 'column', // Stacks components vertically
        gap: '20px', // Adds spacing between components
      }}
    >
      {/* HeatMap Section */}
      <div
        style={{
          flex: '1',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '10px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>HeatMap</h3>
                {
                  loading ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Generating...</p>
                  ) : !heatmapData ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>NO DATA</p>
                  ) : (
                    <HeatMap info={heatmapData} />
                  )
                }
      </div>

      {/* StackLineGraph Section */}
      <div
        style={{
          flex: '1.5',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          backgroundColor: '#f9f9f9',
   
        }}
      >
        
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Stack Line Graph</h3>
       
        {
          
                  loading ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Generating...</p>
                  ) : !linegraphData ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>NO DATA</p>
                  ) : (
                    <StackLineGraph info={linegraphData} />
                  )
                }
        
      </div>
      <div style={{ position: "relative", textAlign: "center" }}>
      {!seeInsight && (
        <button
          onClick={() => setSeeInsight(true)}
          style={{
            
            padding: "20px",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#F4C542",
            color: "black",
            cursor: "pointer",
            marginBottom: "10px",
            
          }}
        >
          Show Insights
        </button>
      )}

      {seeInsight && (
        <div
          style={{
            flex: "1",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            backgroundColor: "#ececec",
            position: "relative",
            maxWidth: "400px",
            margin: "auto",
          }}
        >
          <button
            onClick={() => setSeeInsight(false)}
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              background: "transparent",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ✖
          </button>
          <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
            Insights Map
          </h3>
          {loadingInsights ? (
            <p style={{ textAlign: "center", color: "#888" }}>Generating...</p>
          ) : !insightsData ? (
            <p style={{ textAlign: "center", color: "#888" }}>NO DATA</p>
          ) : (
            <Insight info={insightsData} />
          )}
        </div>
      )}
    </div>
    <div></div>
    
    </div>
  );
};

export default SidePanel;

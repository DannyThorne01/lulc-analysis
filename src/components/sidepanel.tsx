import React from 'react';
import HeatMap from './charts/heatmap'; // Assuming HeatMap is in the same directory
import StackLineGraph from './charts/line-graph'; // Assuming StackLineGraph is in the same directory

const SidePanel = ({ heatmapData, evaluatedAreas }) => {
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
          borderRadius: '5px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>HeatMap</h3>
        <HeatMap info={heatmapData} />
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
        <StackLineGraph info={evaluatedAreas} />
      </div>
    </div>
  );
};

export default SidePanel;

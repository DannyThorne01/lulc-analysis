"use client";
import HeatMap from "../components/charts/heatmap";
import heatmap_data from '../data/example-heatmap.json';

/** An About page */
const Tester= () => {
  return (
    <div>
      <HeatMap info = {heatmap_data}/>
    </div>
  );
};

export default Tester;
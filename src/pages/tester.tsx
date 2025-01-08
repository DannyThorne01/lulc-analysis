"use client";
import HeatMap from "../components/charts/heatmap";
import StackLineGraph from "../components/charts/line-graph";
import SidePanel from "../components/sidepanel";
import heatmap_data from '../data/example-heatmap.json';
import evaluated_areas from "../data/evaluated_areas.json"

/** An About page */
const Tester= () => {
  return (
    <>
     <div>
      <SidePanel heatmapData={heatmap_data} evaluatedAreas={evaluated_areas}/>
    </div>
    </>
   
  );
};

export default Tester;
"use client";
import { Context } from '../module/global'; 
import HeatMap from "../components/charts/heatmap";
import StackLineGraph from "../components/charts/line-graph";
import SidePanel from "../components/sidepanel";
import MapCanvas from "../components/worldmap";
import heatmap_data from '../data/example-heatmap.json';
import evaluated_areas from "../data/evaluated_areas.json"

/** An About page */
const Tester= () => {
  return (
    <>
    
      {/* <MapCanvas /> */}
    
     {/* <div>
      <SidePanel heatmapData={heatmap_data} evaluatedAreas={evaluated_areas}/>
    </div> */}
    </>
   
  );
};

export default Tester;
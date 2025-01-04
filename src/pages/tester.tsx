"use client";
import HeatMap from "../components/charts/heatmap";
import StackLineGraph from "../components/charts/line-graph";
import heatmap_data from '../data/example-heatmap.json';
import evaluated_areas from "../data/evaluated_areas.json"

/** An About page */
const Tester= () => {
  return (
    <>
     {/* <div>
      <HeatMap info = {heatmap_data}/>
    </div> */}
    <div>
      <StackLineGraph info ={evaluated_areas}/>
    </div>
    </>
   
  );
};

export default Tester;

import * as d3 from "d3";
import data from "../../data/lc.json"
import { Context } from '../../module/global';
import { useContext, useEffect, useState, useRef } from "react";
import Dropdown from "../../components/molecules/dropdown"
interface Props {
  info: {
    uniqueKeys: number[];
    matrix: { [key: string]: number };
  };
}
interface Transition {
  before: number,
  after: number,
  value:number
}

const Insight = ({ info }: Props) => {

  const svgRef = useRef<SVGSVGElement | null>(null);

  const w = 500;
  const h = 500;
  const m = { top: 40, right: 30, bottom: 100, left: 100 };
  const insightWidth = w - m.left - m.right;
  const insightHeight = h - m.top - m.bottom;

  var coi:number;
  
  var transferMatrix :Transition[]= Object.entries(info['transferMatrix']).map(([key, value]) => {
    const [before, after] = key.split("_").map((num) => parseInt(num, 10));
      if (before === after) coi = before
      return { before, after, value: Number(value)};
  });

  transferMatrix = transferMatrix.filter(d => d.before !== d.after)
 
  var uniqueKeys = info.uniqueKeys.map((key) => {
    if (coi != key)
    return(data.key_map[key.toString()])
  })
  var uniqueChar = new Set(info.uniqueKeys.filter(key => key !== coi));


  function makeReductions(){
    var reductions: String[] =[]
    var discovered = new Set();
    uniqueKeys.forEach((key) => {
      if (!discovered.has(key)) {
        discovered.add(key);
        let red:String = data.reductions[key]
        if(red){
          reductions.push(red)
        }
      }
    })
    return reductions
  }
  // const reductions = makeReductions();
  // console.log("UNIQUE KEYS " + uniqueKeys)
  // console.log(transferMatrix)
  // console.log("REDUCTIONS " + reductions)

  const maxPositive = d3.max(transferMatrix.filter(d => d.before === coi), d => d.value) || 0;
  const maxNegative = d3.max(transferMatrix.filter(d => d.after === coi), d => d.value) || 0;
 


  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();
    const d3svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${w} ${h}`)
      .style("background-color", "#d9d9d9");

    // Scales
    const xScale = d3
    .scaleBand()
    .range([0, insightWidth])
    .domain(uniqueChar)
    .padding(.1);
   
    const yScale = d3.scaleLinear()
  .range([insightHeight, 0]) // Ensures correct positioning
  .domain([-maxNegative, maxPositive]); 
    

  // Axes
  const xAxis = d3.axisBottom(xScale);
  // const yAxis = d3.axisLeft(yScalePositive);
  const yAxis = d3.axisLeft(yScale);
  
  d3svg.append("g")
  .attr("transform", `translate(${m.left}, ${insightHeight + m.top})`)
  .call(xAxis);

// d3svg.append("g")
//   .attr("transform", `translate(${m.left}, ${m.top})`)
//   .call(yAxis);
d3svg.append("g")
  .attr("transform", `translate(${m.left}, ${m.top})`)
  .call(yAxis);

// Bars
d3svg.append("g")
  .attr("transform", `translate(${m.left}, ${m.top})`)
  .selectAll("rect")
  .data(transferMatrix)
  .enter()
  .append("rect")

  .attr("x", d => parseInt(d.before) === coi? xScale(parseInt(d.after))+ xScale.bandwidth()/4 :xScale(parseInt(d.before)) + xScale.bandwidth()/4)
  .attr("y", d => 
    parseInt(d.before) === coi
      ? yScale(parseInt(d.value)) // Bars grow UP
      : yScale(0) // Bars grow DOWN
  )
  .attr("width", xScale.bandwidth() * 0.6)
  .attr("height", d => 
    Math.abs(yScale(0) - yScale(parseInt(d.value))) // Compute correct bar height
  )
  .attr("fill", d => parseInt(d.before) === coi ? `#${data.class_color_map[d.after.toString()]}` : `#${data.class_color_map[d.before.toString()]}`)
  .attr("rx", 5)
  .attr("ry", 5);
   // Blue for 10 → X, Red for X → 10
    },[info])
    

  return(
    <>
   
   <svg ref={svgRef}></svg>;
    </>
   
  )
}
export default Insight;
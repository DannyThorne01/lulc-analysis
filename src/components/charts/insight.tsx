
import * as d3 from "d3";
import data from "../../data/lc.json"
import { useContext, useEffect, useState, useRef } from "react";

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
  const sectionHeight = insightHeight / 2;

  var coi:number;
  var transferMatrix :Transition[]= Object.entries(info['transferMatrix']).map(([key, value]) => {
    const [before, after] = key.split("_").map((num) => parseInt(num, 10));
      if (before === after) coi = before
      return { before, after, value: Number(value)};
  });

  transferMatrix = transferMatrix.filter(d => d.before !== d.after)
  var uniqueChar = new Set(info.uniqueKeys.filter(key => key !== coi));

  const inflows = transferMatrix.filter(d => d.after === coi);
  const outflows = transferMatrix.filter(d => d.before === coi);

  // Find max values for scaling
  const maxInflow = d3.max(inflows, d => d.value) || 1;
  const maxOutflow = d3.max(outflows, d => d.value) || 1;
 
  console.log(transferMatrix)
  console.log(inflows)
  console.log(outflows)
  console.log(maxInflow)
  console.log(maxOutflow)


  useEffect(() => {
    if (!svgRef.current) return;
    const d3svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${w} ${h}`)
      .style("background", "#f8f9fa");
    d3svg.selectAll("*").remove();
  
    // Prepare data with log adjustment
    const inflows = transferMatrix.filter(d => d.after === coi);
    const outflows = transferMatrix.filter(d => d.before === coi);
    
    // Add epsilon to handle zero values (if any)
    const logAdjust = (val: number) => val === 0 ? 0.1 : val;
  
    // Calculate domains with log adjustment
    const maxOutflow = d3.max(outflows, d => logAdjust(d.value)) || 1;
    // const minOutflow = d3.max(outflows, d => logAdjust(d.value)) || 1;
    const maxInflow = d3.max(inflows, d => logAdjust(d.value)) || 1;
  
    // Log scales
    const xScale = d3.scaleBand()
      .domain(uniqueChar)
      .range([0, insightWidth])
      .padding(0.2);
  
    const yScaleTop = d3.scaleLog()
      .domain([0.1, maxOutflow]) // Start above zero for log scale
      .range([sectionHeight, 0])
      .nice();
  
    const yScaleBottom = d3.scaleLog()
      .domain([0.1, maxInflow])
      .range([0, sectionHeight])
      .nice();
  
    // Create groups
    const topGroup = d3svg.append("g")
      .attr("transform", `translate(${m.left}, ${m.top})`);
    
    const bottomGroup = d3svg.append("g")
      .attr("transform", `translate(${m.left}, ${m.top + sectionHeight})`);
  
    // Draw bars with log scaling
    topGroup.selectAll("rect")
      .data(outflows)
      .enter().append("rect")
      .attr("x", d => xScale(d.after)!)
      .attr("y", d => yScaleTop(logAdjust(d.value)))
      .attr("width", xScale.bandwidth())
      .attr("height", d => sectionHeight - yScaleTop(logAdjust(d.value)))
      .attr("fill", d => `#${data.class_color_map[d.after]}`)
      .attr('rx', 5)
      .attr('ry', 5)
  
    bottomGroup.selectAll("rect")
      .data(inflows)
      .enter().append("rect")
      .attr("x", d => xScale(d.before)!)
      .attr("y", 0)
      .attr("width", xScale.bandwidth())
      .attr("height", d => yScaleBottom(logAdjust(d.value)))
      .attr("fill", d => `#${data.class_color_map[d.before]}`)
      .attr('rx', 5)
      .attr('ry', 5)
  
    // // Log-scaled axes
    // const formatTick = (d: number) => 
    //   d >= 1000 ? `${d/1000}M` : d === 0.1 ? "~0" : d;
  
    // topGroup.append("g")
    //   .call(d3.axisLeft(yScaleTop))
    //   .selectAll(".tick text")
    //   .text(d => formatTick(d));
  
    // bottomGroup.append("g")
    //   .call(d3.axisLeft(yScaleBottom))
    //   .selectAll(".tick text")
    //   .text(d => formatTick(d));

  }, [info]);
  return(
    <>
   <svg ref={svgRef}></svg>
    </>
   
  )
}
export default Insight;
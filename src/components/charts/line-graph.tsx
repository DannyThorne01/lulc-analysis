import React, { useEffect, useRef } from "react";
import * as d3 from "d3";


interface Group {
  area: number; // The area value
  lc: number;   // The land cover type identifier
}

interface Info {
  groups: Group[]; // Array of Group objects
}

interface Props {
  info: Info[]; // Array of Info objects
}

const StackLineGraph = ({ info }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const w = 500;
  const h = 500;
  const m = { top: 40, right: 30, bottom: 100, left: 100 };
  const slinegraphWidth = w - m.left - m.right;
  const slinegraphHeight = h - m.top - m.bottom;

  var mygroups = [52,62,120] // list of group names
  var mygroup = [10,20,22] // list of group names
  console.log(info)

  var stackedData = d3.stack()
    .keys(mygroup)
    .value(function(group,key){
      // console.log(group.groups[key].area)
      return (group.groups[key].area)
    })
   (info)
  console.log(stackedData)
  
   useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();

    const d3svg = d3
        .select(svgRef.current)
        .attr("viewBox", `0 0 ${w} ${h}`)
        .style("background-color", "#d9d9d9");

    const slineGraphArea = d3svg.append("g")
    .attr("class", "chart")
    .attr("transform", `translate(${m.left}, ${m.top})`);

    const slineGraphXAxis = d3svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${m.left}, ${slinegraphHeight + m.top + 10})`);

    const slineGraphYAxis = d3svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${m.left - 10}, ${m.top})`);

    // Scales and colors
    const xScale = d3
      .scaleLinear()
      .range([0, slinegraphWidth])
      .domain([0,22])

    const yScale = d3
      .scaleLinear()
      .range([slinegraphHeight, 0])
      .domain([0,600000])

      // color palette
    var color = d3.scaleOrdinal()
    .domain(mygroup)
    .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])
  
    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    slineGraphXAxis.call(xAxis);
    slineGraphYAxis.call(yAxis);

    slineGraphArea 
    .selectAll("mylayers")
    .data(stackedData)
    .enter()
    .append("path")
    
    .style("fill", (d) => {return color(d.key); })
    .attr("d", d3.area()
      .x((d, i) => xScale(i))
      .y0(function(d) { return yScale(d[0]) })
      .y1(function(d) { return yScale(d[1]); })
    )
    .attr("class", (d) => {return mygroups[d.key]})
        
    

    

   })



  return <svg ref={svgRef}></svg>;
}
export default StackLineGraph
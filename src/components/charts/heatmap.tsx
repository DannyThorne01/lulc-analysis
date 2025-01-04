import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import data from "../../data/lc.json"


interface Props {
  info: {
    uniqueKeys: number[];
    matrix: { [key: string]: number };
  };
}

const HeatMap = ({ info }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const w = 500;
  const h = 500;
  const m = { top: 40, right: 30, bottom: 100, left: 100 };
  const heatmapWidth = w - m.left - m.right;
  const heatmapHeight = h - m.top - m.bottom;
  const uniqueKeys = info.uniqueKeys.map((key) => {return(data.key_map[key.toString()])})
  const transferMatrix = Object.entries(info['transferMatrix']).map(([key, value]) => {
    const [before, after] = key.split("_").map((num) => parseInt(num, 10));
    return { before, after, value };
  });

  

  function findGroups() {
    var groups = {};
    var discovered = new Set();
    uniqueKeys.forEach((key) => {
      if (!discovered.has(key)) {
        discovered.add(key);
        let group = data.reverse_group_map[key];
        if (group) {
          if (!groups[group]) {
            groups[group] = [key];
          } else {
            groups[group].push(key);
          }
        }
      }
    });
    return groups;
    
  }

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
  let reductions = makeReductions();
  console.log(reductions)
  
  let xGroups=findGroups()
  console.log(xGroups)
  let new_keys = Object.values(xGroups).flat();
  console.log(new_keys)

  useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();
    
    const d3svg = d3
    .select(svgRef.current)
    .attr("viewBox", `0 0 ${w} ${h}`)
    .style("background-color", "#d9d9d9");

    // Annotation groups for axes
    const yAnnotations = d3svg
    .append("g")
    .attr("class", "y-group-annotations")
    .attr("transform", `translate(${m.left - 10}, ${m.top})`);

    const heatmapXAxis = d3svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${m.left}, ${heatmapHeight + m.top + 10})`);

    const heatmapYAxis = d3svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${m.left - 10}, ${m.top})`);

    // Scales and colors
    const xScale = d3
      .scaleBand()
      .range([0, heatmapWidth])
      .domain(reductions)
      .padding(.2);

    const yScale = d3
      .scaleBand()
      .range([heatmapHeight, 0])
      .domain(reductions)
      .padding(.2);

    const myColor = d3
      .scaleLinear()
      .range(["white", "#69b3a2"])
      .domain([0, 10])
      .clamp(true)
    
    const domain = Object.keys(data.group_map);
    const colorScale = d3
    .scaleOrdinal()
    .domain(Object.keys(xGroups)) // Use the keys of xGroups as the domain
    .range(["red", "blue", "green", "orange", "purple", "pink", "cyan", "yellow"]);

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    heatmapXAxis.call(xAxis);
    heatmapYAxis.call(yAxis);

    Object.entries(xGroups).forEach((entry: [string, string[]]) => {
      console.log(entry[0]);
    
      const yStart = yScale(data.reductions[entry[1][0]]);
      const yEnd = yScale(data.reductions[entry[1][entry[1].length - 1]]);
      console.log(yStart, yEnd);
    
      // Add line annotation
      yAnnotations
        .append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("class", entry[0])
        .attr("y1", yStart+10)
        .attr("opacity", "0.4")
        .attr("y2", yEnd)
        .attr("stroke", colorScale(entry[0]))
        .attr("stroke-width", 5);
    });
    Object.entries(xGroups).forEach((entry: [string, string[]]) => {
      console.log(entry[0]);
    
      const xStart = xScale(data.reductions[entry[1][0]]);
      const xEnd = xScale(data.reductions[entry[1][entry[1].length - 1]]);
    
      // Add line annotation
      yAnnotations
        .append("line")
        .attr("x1", xStart+10)
        .attr("x2", xEnd)
        .attr("class", entry[0])
        .attr("y1", heatmapHeight +10)
        .attr("opacity", "0.4")
        .attr("y2", heatmapHeight +10)
        .attr("stroke", colorScale(entry[0]))
        .attr("stroke-width", 5);
    });
    
    // Adding Text Labels
    Object.entries(xGroups).forEach((entry: [string, string[]]) => {
      const group = entry[0];
      const yStart = yScale(data.reductions[entry[1][0]]);
      const yEnd = yScale(data.reductions[entry[1][entry[1].length - 1]]);
      if (Math.abs(yStart - yEnd) < 10) {
        return; // Skip this iteration and move to the next
      }
      // // Add text annotation
      // yAnnotations
      // .append("text")
      // .attr("transform", `rotate(-90, 25, ${(yStart + yEnd) / 2})`) // Rotate around the midpoint
      // .attr("x", 25) // Offset text horizontally
      // .attr("y", (yStart + yEnd) / 2) // Position at the midpoint
      // .style("font-size", "10px") // Customize font size
      // .style("fill", "black") // Customize text color
      // .text(group); // Add the group name as text
    });


    // Customize x-axis labels
    heatmapXAxis.selectAll("text")
  .attr("transform", function() {
    // Rotate each text element around its current position
    return `rotate(-90, ${d3.select(this).attr("x") || 0}, ${d3.select(this).attr("y") || 0})`;
  })
  .attr("x", 0) // Adjust to position closer to the tick
  .attr("y", 5)  // Adjust to position away from the axis
  .style("font-size", "10px")
  .style("fill", "#4A4A4A")
  .style("font-family", "Arial, sans-serif")
  .style("font-weight", "bold")
  .style("text-anchor", "end");

    // Customize y-axis labels
    heatmapYAxis.selectAll("text")
    .style("font-size", "10px")
    .style("fill", "#4A4A4A") 
    .style("font-family", "Arial, sans-serif") 
    .style("font-weight", "bold"); 

    // Break labels into multiple lines and adjust spacing
    heatmapYAxis.selectAll("text")
    .each(function () {
      const text = d3.select(this);
      const words = text.text().split(' '); // Split text into words
      const lineHeight = 1.1; // Line height (em units)
      const y = text.attr("y");
      const dy = parseFloat(text.attr("dy")) || 0;

      // Clear original text
      text.text(null);

      // Add each word as a separate line
      words.forEach((word, i) => {
        text.append("tspan")
          .text(word)
          .attr("x", -m.left/10) 
          .attr("y", y) 
          // .attr("dy", `${dy + i * lineHeight}em`) // Position each line
          .style("text-anchor", "end")
      
      });
    });
    
    console.log(transferMatrix)
    // Draw heatmap rectangles
    d3svg
      .selectAll(".tile")
      .data(transferMatrix)
      .enter()
      .append("rect")
      .attr("class", "tile")
      .attr("x", (d) => xScale(data.reductions[data.key_map[d.after.toString()]])! + m.left)
      .attr("y", (d) => yScale(data.reductions[data.key_map[d.before.toString()]])! + m.top)
      .attr("rx", 2) // Set the x-axis corner radius
      .attr("ry", 2) // Set the y-axis corner radius
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", (d) => myColor(d.value));
  }, [info]);

  return <svg ref={svgRef}></svg>;
};

export default HeatMap;

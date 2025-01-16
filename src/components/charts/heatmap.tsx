import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import data from "../../data/lc.json"


interface Props {
  info: {
    uniqueKeys: number[];
    matrix: { [key: string]: number };
  };
}
interface TransitionTotal {
  group: number; // Replace `number` with the actual type of your `group` property if it's different
  transitions: number;
}
interface Transition {
  before: number,
  after: number,
  value:number
}


const HeatMap = ({ info }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const w = 500;
  const h = 500;
  const m = { top: 40, right: 30, bottom: 100, left: 100 };
  const heatmapWidth = w - m.left - m.right;
  const heatmapHeight = h - m.top - m.bottom;
  const uniqueKeys = info.uniqueKeys.map((key) => {return(data.key_map[key.toString()])})
  const transferMatrix= Object.entries(info['transferMatrix']).map(([key, value]) => {
    const [before, after] = key.split("_").map((num) => parseInt(num, 10));
    return { before, after, value };
  });


  function groupTransitions(transitionMatrix) {
    const groups = {};
    transitionMatrix.forEach((entry) => {
      const { before, value } = entry;
      if (!groups[before]) {
        groups[before] = { group: before, transitions: 0 };
      }
      groups[before].transitions += value;
    });
    return Object.values(groups); // Convert to array if needed
  }

  var transition_totals:TransitionTotal[]  = groupTransitions(transferMatrix)

  // this is for the color codes
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


  useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();
    
    const d3svg = d3
    .select(svgRef.current)
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("border-radius", "10px")
    .style("background-color", "#d9d9d9");

    let mouseGroup = d3svg.append("g");
    let xMarker = mouseGroup.append("line")
      .attr("id","xMarker")
      .attr("fill","none")
      .attr("stroke","white")
      .attr("stroke-width",1)
      .attr("y1",h-m.bottom)
      .attr("visibility","hidden")
      .style("z-index",10000)

      let yMarker = mouseGroup.append("line")
      .attr("id","yMarker")
      .attr("fill","none")
      .attr("stroke","white")
      .attr("stroke-width",1)
      .attr("x1",m.left)
      .attr("visibility","hidden")
      .style("z-index",10000)

    const tooltip = d3
    .select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "#333")
    .style("z-index",10000)
    .style("color", "#FFF")
    .style("padding", "5px 10px")
    .style("border-radius", "10px")
    .style("pointer-events", "none");

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
      .range(["white", "#69b3a2"]) // Light teal to dark teal
      .domain([0, .45])
      .clamp(true);
  
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
      const yStart = yScale(data.reductions[entry[1][0]]);
      const yEnd = yScale(data.reductions[entry[1][entry[1].length - 1]]);
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
    });


    // Customize x-axis labels
    heatmapXAxis.selectAll("text")
  .attr("transform", function() {
    // Rotate each text element around its current position
    return `rotate(-90, ${d3.select(this).attr("x") || 0}, ${d3.select(this).attr("y") || 0})`;
  })
  .attr("x", 0) 
  .attr("y", 5)  
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

    // Tooltip event handlers
    const mouseover = function (event, d, percent) {
      tooltip
        .html(`${percent}% of ${data.key_map[d.before]} was converted to ${data.key_map[d.after]}`)
        .style("opacity", 1)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
      xMarker
        .attr("x1", xScale(data.reductions[data.key_map[d.before.toString()]]) + m.left+8)
        .attr("x2", xScale(data.reductions[data.key_map[d.before.toString()]]) + m.left+8)
        .attr("y2",yScale(data.reductions[data.key_map[d.after.toString()]])! + m.top)
        .attr("visibility", "visible");
      yMarker
        .attr("y1", yScale(data.reductions[data.key_map[d.after.toString()]])! + m.top+8)
        .attr("y2",yScale(data.reductions[data.key_map[d.after.toString()]])! + m.top+8)
        .attr("x2", xScale(data.reductions[data.key_map[d.before.toString()]]) + m.left)
        .attr("visibility", "visible");
      d3.select(this).style("stroke", "#FFF").style("opacity", 1);
    };

    const mouseleave = function () {
      tooltip.style("opacity", 0);
      d3.select(this).style("stroke", "none").style("opacity", 0.8);
      xMarker.attr("visibility", "hidden");
      yMarker.attr("visibility", "hidden");
    };

    
    // Draw heatmap rectangles
    d3svg
      .selectAll(".tile")
      .data(transferMatrix)
      .enter()
      .append("rect")
      .attr("class", "tile")
      .attr("rx", 10) 
      .attr("ry", 10)
      .attr("x", (d) => xScale(data.reductions[data.key_map[d.before.toString()]])! + m.left)
      .attr("y", (d) => yScale(data.reductions[data.key_map[d.after.toString()]])! + m.top)
      .attr("rx", 4) 
      .attr("ry", 4) 
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", (d) => {
        // Find the corresponding row for the current `before` group
        const row = transition_totals.find((item) => item.group === d.before);
    
        // Calculate the color using myColor scale
        if (row && row.transitions > 0) {
          return myColor(d.value / row.transitions);
        }
        return myColor(0); // Default color if no transitions found
      })
      .on("mouseover", function(event, d) {
        const row = transition_totals.find((item) => item.group === d.before);
    
        // Calculate and display percentage
        if (row && row.transitions > 0) {
          const percentage = ((d.value / row.transitions) * 100).toFixed(2);
          mouseover.call(this, event, d, percentage); // Pass `this` context
        } else {
          console.log(`No transitions found for ${d.before}`);
        }
      })
      .on("mouseleave", function(event, d) {
        mouseleave.call(this, d); // Pass `this` context
      });
  }, [info]);
 

  return <svg ref={svgRef}></svg>;
};

export default HeatMap;

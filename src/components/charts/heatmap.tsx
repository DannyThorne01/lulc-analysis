import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import data from "../../data/lc.json"
import {Props} from "../../module/global"


interface TransitionTotal {
  group: number;
  transitions: number;
}
interface Transition {
  before: number,
  after: number,
  value:number
}

const HeatMap = ({ uniqueKeys, matrix }: Props) => {

  const svgRef = useRef<SVGSVGElement | null>(null);
  const w = 500;
  const h = 500;
  const m = { top: 40, right: 30, bottom: 100, left: 100 };
  const heatmapWidth = w - m.left - m.right;
  const heatmapHeight = h - m.top - m.bottom;
  const uniqueKeysString = uniqueKeys?.map((key) => {return(data.key_map[key.toString()])})

  /* Creates a dict showing the before and after class and the amount of change between the two classes */
  console.log(matrix)
  console.log(uniqueKeys)
  const transferMatrix :Transition[]= matrix 
  ? Object.entries(matrix).map(([key, value]) => {
      const [before, after] = key.split("_").map((num) => parseInt(num, 10));
      return { before, after, value: Number(value) };
    })
  : [];
  /* Finds the total number of transitions for each before group in the transition Matrix */ 
  function groupTransitions(transitionMatrix: Transition[]): TransitionTotal[] {
    const groups = {};
    transitionMatrix.forEach((entry) => {
      const { before, value } = entry;
      if (!groups[before]) {
        groups[before] = { group: before, transitions: 0 };
      }
      groups[before].transitions += value;
    });
    return Object.values(groups); 
  }
  const transition_totals  = groupTransitions(transferMatrix)

  /* This is for the X and Y axis labels where it takes the original long name and compiles a list of reduced names so it could fit on the heatmap*/ 
  function makeReductions(){
    var reductions: String[] =[]
    var discovered = new Set();
    uniqueKeysString?.forEach((key) => {
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

  const reductions = makeReductions();
 

  
  useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();
    
    const d3svg = d3
    .select(svgRef.current)
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("border-radius", "10px")
    .style("background-color", "#d9d9d9");

    const mouseGroup = d3svg.append("g");
    const xMarker = mouseGroup.append("line")
      .attr("id","xMarker")
      .attr("fill","none")
      .attr("stroke","white")
      .attr("stroke-width",1)
      .attr("y1",h-m.bottom)
      .attr("visibility","hidden")
      .style("z-index",10000)

    const yMarker = mouseGroup.append("line")
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
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "#d9d9d9")
      .style("z-index",10000)
      .style("padding", "8px 12px") 
      .style("border-radius", "12px") 
      .style("font-family", "Arial, sans-serif") 
      .style("font-size", "14px")  
      .style("box-shadow", "0 4px 10px rgba(0, 0, 0, 0.2)") 
      .style("pointer-events", "none"); 
    // Annotation groups for axes
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
  
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    heatmapXAxis.call(xAxis);
    heatmapYAxis.call(yAxis);

    // for x axis I customized the labels to be vertical
    heatmapXAxis.selectAll("text")
      .attr("transform", function() {
        return `rotate(-90, ${d3.select(this).attr("x") || 0}, ${d3.select(this).attr("y") || 0})`;
      })
      .attr("x", 0) 
      .attr("y", 5)  
      .style("font-size", "10px")
      .style("fill", "#4A4A4A")
      .style("font-family", "Arial, sans-serif")
      .style("font-weight", "bold")
      .style("text-anchor", "end");

 
    // for Y axis I customized the labels to break if they are too long
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

    
        text.text(null);
        words.forEach((word, i) => {
          text.append("tspan")
            .text(word)
            .attr("x", -m.left/10) 
            .attr("y", y) 
            // .attr("dy", `${dy + i * lineHeight}em`) // Position each line
            .style("text-anchor", "end")
        
        });
      });

    // Creating my tooltip
    const mouseover = function (event, d, percent) {
      tooltip
      .html(`
        <strong>${percent}%</strong> of 
        <span><strong>${data.key_map[d.before] || 'Unknown'}</strong></span> 
        was converted to 
        <span><strong>${data.key_map[d.after] || 'Unknown'}</strong></span>
      `)
      .style("opacity", 1)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY + 10}px`);
      xMarker
        .attr("x1", xScale(data.reductions[data.key_map[d.before.toString()]]) + m.left+xScale.bandwidth()/2)
        .attr("x2", xScale(data.reductions[data.key_map[d.before.toString()]]) + m.left+xScale.bandwidth()/2)
        .attr("y2",yScale(data.reductions[data.key_map[d.after.toString()]])! + m.top)
        .attr("stroke-dasharray", "4,2")
        .attr("stroke", "black") 
        .attr("visibility", "visible");
      yMarker
        .attr("y1", yScale(data.reductions[data.key_map[d.after.toString()]])! + m.top+yScale.bandwidth()/2)
        .attr("y2",yScale(data.reductions[data.key_map[d.after.toString()]])! + m.top+yScale.bandwidth()/2)
        .attr("x2", xScale(data.reductions[data.key_map[d.before.toString()]]) + m.left)
        .attr("stroke-dasharray", "4,2") 
        .attr("stroke", "black") 
        .attr("visibility", "visible");
      d3.select(this).style("stroke", "black").style("opacity", 1);
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
        if (row && row.transitions > 0) {
          return myColor(d.value / row.transitions);
        }
        return myColor(0); 
      })
      .on("mouseover", function(event, d) {
        const row = transition_totals.find((item) => item.group === d.before);
        if (row && row.transitions > 0) {
          const percentage = ((d.value / row.transitions) * 100).toFixed(2);
          mouseover.call(this, event, d, percentage); 
        } else {
          console.log(`No transitions found for ${d.before}`);
        }
      })
      .on("mouseleave", function(event, d) {
        mouseleave.call(this, d); 
      });
  }, [uniqueKeys, matrix]);
 

  return <svg ref={svgRef}></svg>;
};

export default HeatMap;

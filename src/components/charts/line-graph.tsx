import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import data from "../../data/lc.json";


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
  
  const [mygroup, setMyGroup] = useState([3,16,8,17]);
   // build the index to key mappings 
   const mappings = info[0].groups.reduce((acc, e, index) => {
    acc[index] = e.lc; // Use index as the key and e.lc as the value
    return acc;
  }, {});
  const values= Object.values(mappings);
  console.log(values)
  // handle dropdown click
  const handleDropDownClick = (event) => {
    const selectedValue = Number(event.target.value)
    if(selectedValue && !mygroup.includes(selectedValue)){
      setMyGroup([...mygroup, values.indexOf(selectedValue)]);
    }
  }
  const handleButtonClick = (item) =>{
    console.log(item)
    // const selectedValue = Number(event.target.value)
    // console.log(selectedValue)
    // console.log(values.indexOf(selectedValue))
    setMyGroup(mygroup.filter(value => value !== item));
    // console.log(mygroup)
  }
   useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();
    //For the dropdown
   
    const dropdown = d3.select("#my-dropdown")
        dropdown.selectAll("option")
            .data(values)
            .enter()
            .append("option")
            .text(d => d);
    // add the buttons


    var stackedData = d3.stack()
    .keys(mygroup)
    .value(function(group,key){
      
      return (group.groups[key].area)
    })
   (info)

    const allGroups = info.flatMap(year => year.groups);
    const maxByLandCover = allGroups.reduce((acc, group) => {
      const lc = group.lc;
      const area = group.area; 
      if (acc[lc] !== undefined) {
        acc[lc] = Math.max(acc[lc], area);
      } else {
        acc[lc] = area;
      }
      return acc;
    }, {});

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

    // const slineGraphYAxis = d3svg
    //   .append("g")
    //   .attr("class", "axis")
    //   .attr("transform", `translate(${m.left - 10}, ${m.top})`);

    const xScale = d3
      .scaleLinear()
      .range([0, slinegraphWidth])
      .domain([0,22])

    console.log(mygroup)
    const yScale = d3
    .scaleLinear()
    .range([slinegraphHeight, 0])
    .domain([
      0,
      d3.sum(mygroup, (d) => {
        // console.log("Current group:", d);
        // console.log("Mapping for group:", mappings[d]);
        // console.log("MaxByLandCover value:", maxByLandCover[mappings[d]]);
        return (maxByLandCover[mappings[d]] || 0) * 2;
      }),
    ]);
      // .domain(0,d3.max(mygroup,(d)=>{console.log(d)}))


      // color palette
    var color = d3.scaleOrdinal()
      .domain(mygroup)
      .range([
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
        '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
        '#393b79', '#637939', '#8c6d31', '#843c39'
      ]);

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    console.log(yScale.domain())
    slineGraphXAxis.call(xAxis);
    const slineGraphYAxis = d3svg
      .selectAll(".y-axis")
      .data([null]);
    slineGraphYAxis
      .enter()
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${m.left - 10}, ${m.top})`)
      .merge(slineGraphYAxis)
      .call(yAxis);

    slineGraphArea 
    .selectAll("mylayers")
    .data(stackedData)
    .enter()
    .append("path")
    
    .style("fill", (d) => {return color(d.key); })
    .attr("d", d3.area()
      .x((_, i) => xScale(i))
      .y0((d)=> { return yScale(d[0]) })
      .y1((d)=> {return yScale(d[1]); })
    )
    .attr("class", (d) => {return mappings[d.key]})
   },[info,mygroup])



  return (
    <div className="slinegraph">
      <svg ref={svgRef}></svg>
      <select id="my-dropdown" onChange={handleDropDownClick}></select>
      <div>
        {mygroup.map((item, index) => (
          <button key={index} onClick={() => handleButtonClick(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
export default StackLineGraph
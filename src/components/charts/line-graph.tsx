import React, { JSX, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import data from "../../data/lc.json";
import Dropdown from "../../components/molecules/dropdown"


interface Group {
  area: number; // The area value
  lc: number;   // The land cover type identifier
}

interface Info {
  groups: Group[]; // Array of Group objects
}

interface Props {
  info: Info[]; // Array of Info objects
  vals: string[]
}

const StackLineGraph = ({ info,vals }: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const w = 600;
  const h = 600;
  const m = { top: 40, right: 30, bottom: 100, left: 100 };
  const slinegraphWidth = w - m.left - m.right;
  const slinegraphHeight = h - m.top - m.bottom;
  console.log(vals)
  

  const allGroups = info.flatMap((year) => year.groups);
  // console.log(allGroups)

  // Create mappings with explicit typing
  const mappings: Record<number, number> = info[0].groups.reduce((acc, e, index) => {
    acc[index] = e.lc; // Use index as the key and e.lc as the value
    return acc;
  }, {});

  const values: number[] = Object.values(mappings);
  const [mygroup, setMyGroup] = useState<number[]>(() => {
    return values.sort(() => 0.5 - Math.random()).slice(0, 7); // Random 4
  });
  const [buttons, setButtons] = useState<JSX.Element[]>([]);
  
  
  const handleDropDownClick = (event) => {
    const selectedValue = Number(data.reductions_to_key[event]);
    setMyGroup((prevMyGroup) => {
      if (selectedValue && !prevMyGroup.includes(selectedValue)) {
        return [...prevMyGroup, selectedValue];
      }
      return prevMyGroup;
    });
  }

  const handleButtonClick = (item) =>{
    setMyGroup(mygroup.filter(value => value !== item));
  }

   useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();
    const dropdown = d3.select("#my-dropdown")
        dropdown.selectAll("option")
            .data(values)
            .enter()
            .append("option")
            .text(d => data.reductions[data.key_map[d.toString()]]);

    const stackedData = d3
    .stack()
    .keys(mygroup)
    .value((group, key) => {
      const matchingGroup = group.groups.find((g) => g.lc === key); // Find matching group
      const areaValue = matchingGroup ? matchingGroup.area : 0; // Use area or 0 if not found
      // console.log(`Key: ${key}, Area: ${areaValue}`); // Debugging
      // console.log(areaValue)
      return areaValue;
    })(info);

    // console.log(stackedData)

    
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


    const yScale = d3
    .scaleLinear()
    .range([slinegraphHeight, 0])
    .domain([
      0,
      d3.sum(mygroup, (d) => {
        // console.log("Current group:", d);
        // console.log("Mapping for group:", mappings[values.indexOf(d)]);
        // console.log("MaxByLandCover value:", maxByLandCover[mappings[values.indexOf(d)]]);
        return (maxByLandCover[mappings[values.indexOf(d)]] || 0) * 2;
      }),
    ]);
      // .domain(0,d3.max(mygroup,(d)=>{console.log(d)}))
    // console.log(yScale.domain())


      // color palette
      const color = d3.scaleOrdinal()
      .domain(mygroup)
      .range([
        "#6A4C93", "#1982C4", "#8AC926", "#FFCA3A", "#FF595E", "#4CAF50",
        "#F4A261", "#2A9D8F", "#264653", "#E76F51", "#D4A5A5", "#9B5DE5",
        "#F15BB5", "#00BBF9", "#FEE440", "#AACC00", "#118AB2", "#8D99AE",
        "#FFC300", "#90BE6D", "#6D6875", "#FF7A5C", "#457B9D", "#E9C46A",
        "#E63946", "#A8DADC", "#B5838D", "#CB997E", "#DDBEA9", "#FFC6FF",
        "#D6A2E8", "#B2A4FF", "#85C7F2"
      ]);


    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

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
    
    .style("fill", (d) => {return `#${data.class_color_map[d.key].toUpperCase()}` ; })
    .attr("d", d3.area()
      .x((_, i) => xScale(i))
      .y0((d)=> { return yScale(d[0]) })
      .y1((d)=> {return yScale(d[1]); })
    )
    .attr("class", (d) => {return mappings[d.key]})
    const newButtons = mygroup.map((item, index) => (
      <button
        key={index}
        onClick={() => handleButtonClick(item)}
        style={{
          backgroundColor: `#${data.class_color_map[item].toUpperCase()}`,
          color: "white",
          border: "none",
          borderRadius: "5px",
          padding: "10px 15px",
          fontSize: "14px",
          cursor: "pointer",
          transition: "background-color 0.3s ease, transform 0.2s ease",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        {data.reductions_to_key_inverse[item.toString()]}
      </button>
    ));
    setButtons(newButtons);

   },[info,mygroup])


   return (
    <div
      className="slinegraph"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%'}}></svg>
  
      <Dropdown
        options={vals} 
        // value={data.reductions_to_key_inverse[mygroup[mygroup.length  - 1].toString()]}
        onChange={handleDropDownClick}
        label="Select a Country"
        isEditable={true} 
        style={{
            fontSize: "16px",
            // border: "1px solid #ccc",
            borderRadius: "50px",
            backgroundColor: "white",
            color: "#333",
            cursor: "pointer",
            marginTop: "20px", 
        }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '10px',
          justifyContent: 'center',
        }}
      >
       <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "10px",
        justifyContent: "center",
      }}
    >
      {buttons} {/* Inject precomputed buttons here */}
    </div>
      </div>
    </div>
  );
  
}
export default StackLineGraph
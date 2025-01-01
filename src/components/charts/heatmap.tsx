import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

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
  const m = { top: 40, right: 30, bottom: 50, left: 60 };
  const heatmapWidth = w - m.left - m.right;
  const heatmapHeight = h - m.top - m.bottom;

  useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();

    const d3svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${w} ${h}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .style("background-color", "#ffffff");

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
      .scaleBand<number>()
      .range([0, heatmapWidth])
      .domain(info.uniqueKeys)
      .padding(0.05);

    const yScale = d3
      .scaleBand<number>()
      .range([heatmapHeight, 0])
      .domain(info.uniqueKeys)
      .padding(0.05);

    const myColor = d3
      .scaleLinear<number>()
      .range(["white", "#69b3a2"])
      .domain([0, 1]);

    // Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    heatmapXAxis.call(xAxis);
    heatmapYAxis.call(yAxis);

    // Convert `matrix` data into a usable format
    const transferMatrix = Object.entries(info['transferMatrix']).map(([key, value]) => {
      const [before, after] = key.split("_").map((num) => parseInt(num, 10));
      return { before, after, value };
    });

    // Draw heatmap rectangles
    d3svg
      .selectAll(".tile")
      .data(transferMatrix)
      .enter()
      .append("rect")
      .attr("class", "tile")
      .attr("x", (d) => xScale(d.after)! + m.left)
      .attr("y", (d) => yScale(d.before)! + m.top)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", (d) => myColor(d.value));
  }, [info]);

  return <svg ref={svgRef}></svg>;
};

export default HeatMap;

import React, { useEffect, useState } from "react";
import * as d3 from "d3";

interface CircleData {
  center: { lat: number; lng: number };
  radius: number;
}

interface CircleComponentProps {
  map: any;
  circleData: CircleData;
  onChangeCircleData: (data: CircleData) => void;
}

const CircleComponent: React.FC<CircleComponentProps> = ({ map, circleData, onChangeCircleData }) => {
  const [mouseState, setMouseState] = useState<"down" | "up" | null>(null); // Track mouse state
  const [tempCircleData, setTempCircleData] = useState(circleData); // Track intermediate changes

  useEffect(() => {
    setTempCircleData(circleData);
  }, [circleData]);

  useEffect(() => {
    if (mouseState === "up") {
      onChangeCircleData(tempCircleData);
    }
  }, [mouseState, tempCircleData, onChangeCircleData]);

  useEffect(() => {
    if (!map) return;

    const container = map.getCanvasContainer();
    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0")
      .style("pointer-events", "none");

    const project = (lng: number, lat: number) => {
      const point = map.project([lng, lat]);
      return [point.x, point.y];
    };

    const unproject = (x: number, y: number) => {
      const latlng = map.unproject([x, y]);
      return { lng: latlng.lng, lat: latlng.lat };
    };

    const computePixelRadius = () => {
      const zoom = map.getZoom();
      const metersPerPixel = (40075016.686 * Math.cos(tempCircleData.center.lat * Math.PI / 180)) / (2 ** zoom * 256);
      return tempCircleData.radius / metersPerPixel;
    };

    let [cx, cy] = project(tempCircleData.center.lng, tempCircleData.center.lat);
    let r = computePixelRadius();

    const circle = svg
      .append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", r)
      .attr("fill", "rgba(255, 165, 0, 0.3)")
      .attr("stroke", "#ffa500")
      .attr("stroke-width", 2)
      .style("pointer-events", "all")
      .style("cursor", "move");

    const handle = svg
      .append("circle")
      .attr("cx", cx + r)
      .attr("cy", cy)
      .attr("r", 8)
      .attr("fill", "#ffa500")
      .style("pointer-events", "all")
      .style("cursor", "ew-resize");

    function updateCircleData(px: number, py: number, radius: number) {
      const newCenter = unproject(px, py);
      const newRadiusMeters =
        radius * (40075016.686 * Math.cos(newCenter.lat * Math.PI / 180)) / (2 ** map.getZoom() * 256);

      setTempCircleData({ center: newCenter, radius: newRadiusMeters });
    }

    function rescaleCircle() {
      const [newCx, newCy] = project(tempCircleData.center.lng, tempCircleData.center.lat);
      const newRadius = computePixelRadius();
      circle.attr("cx", newCx).attr("cy", newCy).attr("r", newRadius);
      handle.attr("cx", newCx + newRadius).attr("cy", newCy);
      cx = newCx;
      cy = newCy;
      r = newRadius;
    }

    circle.call(
      d3
        .drag()
        .on("start", () => {
          map.dragPan.disable();
          setMouseState("down");
        })
        .on("drag", (event) => {
          cx = event.x;
          cy = event.y;
          circle.attr("cx", cx).attr("cy", cy);
          handle.attr("cx", cx + r).attr("cy", cy);
          updateCircleData(cx, cy, r);
        })
        .on("end", () => {
          map.dragPan.enable();
          setMouseState("up");
        })
    );

    handle.call(
      d3
        .drag()
        .on("start", () => setMouseState("down"))
        .on("drag", (event) => {
          r = Math.max(20, Math.hypot(event.x - cx, event.y - cy));
          circle.attr("r", r);
          handle
            .attr("cx", cx + r * (event.x - cx) / Math.hypot(event.x - cx, event.y - cy))
            .attr("cy", cy + r * (event.y - cy) / Math.hypot(event.x - cx, event.y - cy));
          updateCircleData(cx, cy, r);
        })
        .on("end", () => setMouseState("up"))
    );

    map.on("zoom", rescaleCircle);
    map.on("move", rescaleCircle);

    return () => {
      svg.remove();
      map.off("zoom", rescaleCircle);
      map.off("move", rescaleCircle);
    };
  }, [map, tempCircleData, mouseState]);

  return null;
};

export default CircleComponent;
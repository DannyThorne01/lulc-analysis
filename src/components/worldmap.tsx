
import { Map, RasterTileSource } from "maplibre-gl";
import { useContext, useEffect, useState } from "react";
import "../../node_modules/maplibre-gl/dist/maplibre-gl.css";
import { analysisLulc, lulcLayer, transferMatrixLulc, centerOfGravity, lulcLayerbyYear } from "../module/ee";
import MapComponent, { NavigationControl } from "react-map-gl/maplibre"; 
import { Context } from '../module/global';
import data from '../data/lc.json';
import * as d3 from "d3";

const MapCanvas = () => {
  // Declare state variables
  const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  const INITIAL_VIEW_STATE = {
    latitude: 0, // Centered on the world
    longitude: 0,
    zoom: 2,
    bearing: 0,
    pitch: 0,
  };
  const context = useContext(Context);

  if (!context) {
    throw new Error('Context must be used within a ContextProvider');
  }

  const { map, setMap, tile, setTile, country,circleData,setCircleData,year, setYear, selectedClass, setSelectedClass,seeInsight} = context;

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  // const [map, setMap] = useState<Map | null>(null); // Explicitly type as Map | null
  //const [tile, setTile] = useState<string | null>(null); // Allow tile to be a string or null
  const [layerAdded, setLayerAdded] = useState(false);
  // const [selectedClass, setSelectedClass] = useState(null);
 
  // Layer ID for the GEE overlay
  const eeLayerId = "gee-layer";
  const calculateZoomLevel = (bounds) => {
    const WORLD_DIM = { width: 256, height: 256 };
    const ZOOM_MAX = 20;

    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;

    const latZoom = Math.log2(WORLD_DIM.height / latDiff);
    const lngZoom = Math.log2(WORLD_DIM.width / lngDiff);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  };

  // Fetch LULC layer
  useEffect(() => {
    async function loadLULCTiles() {
      try {
        console.log("Clearing existing tiles...");
        if (map) {
          if (map.getLayer(eeLayerId)) {
            map.removeLayer(eeLayerId); // Remove the layer if it exists
          }
          if (map.getSource(eeLayerId)) {
            map.removeSource(eeLayerId); // Remove the source if it exists
          }
          console.log("Existing tiles cleared.");
        }

        console.log("retrieving data")
        // const {urlFormat, bounds } = await lulcLayer(country);
        var urlFormat:string|undefined = ""
        if(seeInsight){
            var response = await lulcLayerbyYear(country,2015,selectedClass)
            urlFormat = response.urlFormat
        }else{
            var response = await lulcLayer(country)
            urlFormat = response.urlFormat
        }
        
        setTile(urlFormat); // Store the URL in state'
        // const latitude = (bounds.north + bounds.south) / 2;
        // const longitude = (bounds.east + bounds.west) / 2;
        // const zoom = calculateZoomLevel(bounds);

        // setViewState({
        //   latitude,
        //   longitude,
        //   zoom,
        //   bearing: 0,
        //   pitch: 0,
        // });
      } catch (error) {
        console.error("Error loading LULC tiles:", error);
      }
    }
    if (country) {
      loadLULCTiles();
    }
  }, [country,selectedClass,seeInsight]);

  useEffect(() => {
    if (!map) return;
    if(!seeInsight) return
    console.log(seeInsight)
    // Create an SVG layer on top of the MapLibre map
    const container = map.getCanvasContainer();
    const svg = d3.select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("position", "absolute")
      .style("top", "0")
      .style("left", "0")
      .style("pointer-events", "none");
  
    // Function to convert LatLng to screen coordinates
    const project = (lng, lat) => {
      const point = map.project([lng, lat]);
      return [point.x, point.y];
    };
  
    // Function to convert screen coordinates back to LatLng
    const unproject = (x, y) => {
      const latlng = map.unproject([x, y]);
      return { lng: latlng.lng, lat: latlng.lat };
    };
  
    // Function to compute pixel radius based on meters
    const computePixelRadius = () => {
      const zoom = map.getZoom();
      const metersPerPixel = (40075016.686 * Math.cos(circleData.center.lat * Math.PI / 180)) / (2 ** zoom * 256);
      return circleData.radius / metersPerPixel;
    };
  
    // Get initial screen coordinates for center and radius
    let [cx, cy] = project(circleData.center.lng, circleData.center.lat);
    let r = computePixelRadius();
  
    // Append a draggable & resizable circle
    const circle = svg.append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", r)
      .attr("fill", "rgba(255, 165, 0, 0.3)")
      .attr("stroke", "#ffa500")
      .attr("stroke-width", 2)
      .style("pointer-events", "all")
      .style("cursor", "move");
  
    // Append a resize handle
    const handle = svg.append("circle")
      .attr("cx", cx + r)
      .attr("cy", cy)
      .attr("r", 8)
      .attr("fill", "#ffa500")
      .style("pointer-events", "all")
      .style("cursor", "ew-resize");
  
    // Function to update circle data
    function updateCircleData(px, py, radius) {
      const newCenter = unproject(px, py);
      const newRadiusMeters = radius * (40075016.686 * Math.cos(newCenter.lat * Math.PI / 180)) / (2 ** map.getZoom() * 256);
      setCircleData({ center: newCenter, radius: newRadiusMeters });
    }
  
    // Function to rescale and reposition the circle
    function rescaleCircle() {
      const [newCx, newCy] = project(circleData.center.lng, circleData.center.lat);
      const newRadius = computePixelRadius();
      circle.attr("cx", newCx).attr("cy", newCy).attr("r", newRadius);
      handle.attr("cx", newCx + newRadius).attr("cy", newCy);
      cx = newCx;
      cy = newCy;
      r = newRadius;
    }
  
    // Add drag behavior to the circle
    circle.call(d3.drag()
      .on("start", () => map.dragPan.disable())
      .on("drag", (event) => {
        cx = event.x;
        cy = event.y;
        circle.attr("cx", cx).attr("cy", cy);
        handle.attr("cx", cx + r).attr("cy", cy);
        updateCircleData(cx, cy, r);
      })
      .on("end", () => map.dragPan.enable())
    );
  
    // Add drag behavior to the handle
    handle.call(d3.drag()
      .on("drag", (event) => {
        r = Math.max(20, Math.hypot(event.x - cx, event.y - cy));
        circle.attr("r", r);
        handle.attr("cx", cx + r * (event.x - cx) / Math.hypot(event.x - cx, event.y - cy))
              .attr("cy", cy + r * (event.y - cy) / Math.hypot(event.x - cx, event.y - cy));
        updateCircleData(cx, cy, r);
      })
    );
  
    // Update circle size when zooming
    map.on("zoom", rescaleCircle);
    map.on("move", rescaleCircle);
    // console.log(circleData)
  
    return () => {
      svg.remove();
      map.off("zoom", rescaleCircle);
      map.off("move", rescaleCircle);
    };
  }, [map, circleData,seeInsight]);
  

  // Add LULC tiles to the map when available
  useEffect(() => {
    if (map && tile) {
      try {
        if (map.getSource(eeLayerId)) {
          console.log("Source already exists, skipping addition...");
          return; // Prevent duplicate sources
        }

        console.log("Adding new tiles...");
        map.addSource(eeLayerId, {
          type: "raster",
          tiles: [tile],
          tileSize: 256,
        } as maplibregl.RasterSourceSpecification);

        map.addLayer({
          id: eeLayerId,
          type: "raster",
          source: eeLayerId,
          minzoom: 0,
          maxzoom: 20,
        });

        console.log("Tiles added successfully.");
      } catch (error) {
        console.error("Error adding tiles to map:", error);
      }
    }
  }, [map, tile]);

  // Handle map load
  const handleMapLoad = (event: { target: Map }) => {
    setMap(event.target); // Set the map instance
  };

  return (
    <>
     <MapComponent
      id="map"
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE}
      style={{ width: "100vw", height: "100vh" }}
      onLoad={handleMapLoad}
    >
      <NavigationControl position="top-left" />
    </MapComponent>
    return (
      <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        zIndex: 1000,
        width: "200px",
        fontFamily: "'Poppins', sans-serif",
        fontSize: "11px",
        textAlign: "center",
      }}
    >
      <label
        htmlFor="year-slider"
        style={{
          fontWeight: "bold",
          fontSize: "13px",
          color: "#333",
        }}
      >
        Year: {year}
      </label>
      <input
        id="year-slider"
        type="range"
        min="2000"
        max="2022"
        step="1"
        value={year}
        onChange={(e) => setYear(parseInt(e.target.value))}
        style={{
          width: "100%",
          cursor: "pointer",
          accentColor: "#007bff",
        }}
      />
    </div>
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent background
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 1000,
        maxHeight: "200px",
        overflowY: "auto",
        width: "160px",
        fontFamily: "'Poppins', sans-serif",
        fontSize: "11px",
      }}
    >
      {/* Legend label */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "13px",
          marginBottom: "10px",
          color: "#333",
        }}
      >
        Legend
      </div>

      {/* Legend items */}
      {Object.entries(data.class_color_map).map(([key, color]) => {
        const label = data.reductions_to_key_inverse[key]; // Get label name
        const isSelected = selectedClass === key; // Check if selected
  
        return (
          <div
            key={key}
            onClick={() =>{console.log("key " +key); 
              const index = data.values.indexOf(parseInt(key))+1; 
              // console.log("index " + index)
              setSelectedClass(index)} } // Handle click event
            //setSelectedClass(data.values.indexOf(20))
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              borderRadius: "5px",
              cursor: "pointer",
              border: isSelected ? "2px solid #000" : "1px solid transparent",
              backgroundColor: isSelected ? "rgba(0, 0, 0, 0.1)" : "transparent",
            }}
          >
            <div
              style={{
                width: "15px",
                height: "15px",
                backgroundColor: `#${color}`,
                borderRadius: "3px",
              }}
            ></div>
            <span style={{ color: "#333" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
    </>
   
    
  );
};

export default MapCanvas;
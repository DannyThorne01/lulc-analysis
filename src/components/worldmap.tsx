
import { Map, RasterTileSource } from "maplibre-gl";
import { useCallback, useContext, useEffect, useState } from "react";
import "../../node_modules/maplibre-gl/dist/maplibre-gl.css";
import { lulcLayer } from "../module/ee";
import MapComponent, { NavigationControl } from "react-map-gl/maplibre"; 
import { Context , CircleData} from '../module/global';
import data from '../data/lc.json';
import Slider from "../components/molecules/slider"
import CircleComponent from "../components/molecules/circle"; 

const MapCanvas = () => {
  // Declare state variables
  const MAP_STYLE = "https://demotiles.maplibre.org/style.json"

  const INITIAL_VIEW_STATE = {
    latitude: 0,
    longitude: 0,
    zoom: 2,
    bearing: 0,
    pitch: 0,
  };
  const context = useContext(Context);

  if (!context) {
    throw new Error('Context must be used within a ContextProvider');
  }

  const { map, setMap, tile, setTile, country,circleData,setCircleData,year, setYear, selectedClass, setSelectedClass,showInsights,setShowInsights} = context;

  const sliderValueChanged = useCallback((val: number) => {
    setYear(val);
    }, [setYear]);

  const circleValueChanged = useCallback((val: CircleData) => {
      setCircleData(val);
      }, [setCircleData]);

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

        // const {urlFormat, bounds } = await lulcLayer(country);
        var urlFormat:string|undefined = ""
        
        // if(showInsights && selectedClass){
        //     const response1 = await lulcLayerbyYear(country,year,data.reductions_to_key[selectedClass])
        //     urlFormat = response1.urlFormat
        // }else{
            const response2 = await lulcLayer(country,year)
            urlFormat = response2.urlFormat
        
        
        setTile(urlFormat);
      } catch (error) {
        console.error("Error loading LULC tiles:", error);
      }
    }
    if (country) {
      loadLULCTiles();
    }
  }, [country,selectedClass,year,showInsights]);

  
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

  const sliderProps = {
    id: "slider-lulc",
    type: "range",
    min: 2000, 
    max: 2022, 
    step: 1,    
    value: year, 
    onChange: sliderValueChanged, 
};
  return(
    <>
    <MapComponent
  id="map"
  initialViewState={INITIAL_VIEW_STATE}
  mapStyle={MAP_STYLE}
  style={{ width: "100vw", height: "100vh" }}
  onLoad={handleMapLoad}
>
  <NavigationControl position="top-left" />

  {showInsights && map && (
    <CircleComponent 
      map={map} 
      circleData={circleData} 
      onChangeCircleData={(newData) => {
        circleValueChanged(newData);
      }} 
    />
  )}
</MapComponent>
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
    <Slider {...sliderProps} />
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
  
    </>

  );
};

export default MapCanvas;
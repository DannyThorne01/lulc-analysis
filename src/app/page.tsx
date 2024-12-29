"use client";

// import React, { useEffect, useState } from "react";
// import Map, { NavigationControl } from "react-map-gl/maplibre";
// import "maplibre-gl/dist/maplibre-gl.css";
// import { MapRef } from "react-map-gl";
// import { getLULCMapUrl } from "../module/ee";

// export default function Home() {
//   // Map style
//   const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

//   // Initial view state
//   const INITIAL_VIEW_STATE = {
//     latitude: 4.8604, // Centered on Guyana
//     longitude: -58.9302,
//     zoom: 7,
//     bearing: 0,
//     pitch: 0,
//   };

//   const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
//   const [map, setMap] = useState<MapRef | null>(null);
//   const [layerAdded, setLayerAdded] = useState(false); // Prevent duplicate layers

//   const eeLayerId = "gee-layer"; // Layer ID for the GEE overlay
//   const year = 2020; // Example year

//   // Handle map load event
//   const handleMapLoad = (event: mapboxgl.MapboxEvent) => {
//     setMap(event.target as unknown as MapRef);
//   };

//   // Add the GEE layer to the map
//   useEffect(() => {
//     async function loadLayer() {
//       if (!map || layerAdded) return; // Prevent re-adding the layer

//       try {
//         const { urlFormat } = await getLULCMapUrl(year);
//         console.log(urlFormat)

//         // Add the GEE source
//         map.addSource(eeLayerId, {
//           type: "raster",
//           tiles: [urlFormat],
//           tileSize: 256,
//         });

//         // Add the raster layer
//         map.addLayer({
//           id: eeLayerId,
//           type: "raster",
//           source: eeLayerId,
//           minzoom: 0,
//           maxzoom: 20,
//         });

//         setLayerAdded(true); // Mark layer as added
//       } catch (error) {
//         console.error("Error adding GEE layer:", error);
//       }
//     }

//     loadLayer();
//   }, [map, layerAdded]);

//   return (
//     <Map
//       id="map"
//       initialViewState={INITIAL_VIEW_STATE}
//       mapStyle={MAP_STYLE}
//       style={{ width: "100vw", height: "100vh" }}
//       onLoad={handleMapLoad}
//       onMove={(evt) => setViewState(evt.viewState)}
//     >
//       <NavigationControl position="top-left" />
//     </Map>
//   );
// }
import { Map, RasterTileSource } from "maplibre-gl";
import { useEffect, useState } from "react";
import "../../node_modules/maplibre-gl/dist/maplibre-gl.css";
import { lulcLayer } from "../module/ee";
import MapComponent, { NavigationControl } from "react-map-gl/maplibre"; 

export default function MapCanvas() {
  // Declare state variables
  const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  const INITIAL_VIEW_STATE = {
    latitude: 4.8604, // Centered on Guyana
    longitude: -58.9302,
    zoom: 7,
    bearing: 0,
    pitch: 0,
  };

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [map, setMap] = useState(null);
  const [tile, setTile] = useState(null);
  const [layerAdded, setLayerAdded] = useState(false);

  // Layer ID for the GEE overlay
  const eeLayerId = "gee-layer";

  // Fetch LULC layer
  useEffect(() => {
    async function loadLULCTiles() {
      try {
        const { urlFormat } = await lulcLayer(); // Fetch tile URL
        setTile(urlFormat); // Store the URL in state
      } catch (error) {
        console.error("Error loading LULC tiles:", error);
      }
    }
    loadLULCTiles();
  }, []);

  // Add LULC tiles to the map when available
  useEffect(() => {
    if (map && tile && !layerAdded) {
      try {
        map.addSource(eeLayerId, {
          type: "raster",
          tiles: [tile],
          tileSize: 256,
        });

        map.addLayer({
          id: eeLayerId,
          type: "raster",
          source: eeLayerId,
          minzoom: 0,
          maxzoom: 20,
        });

        setLayerAdded(true); // Ensure the layer is only added once
      } catch (error) {
        console.error("Error adding layer to map:", error);
      }
    }
  }, [map, tile, layerAdded]);

  // Handle map load
  const handleMapLoad = (event) => {
    setMap(event.target);
  };

  return (
    <MapComponent
      id="map"
      initialViewState={viewState}
      mapStyle={MAP_STYLE}
      style={{ width: "100vw", height: "100vh" }}
      onLoad={handleMapLoad}
      onMove={(evt) => setViewState(evt.viewState)}
    >
      <NavigationControl position="top-left" />
    </MapComponent>
  );
}

"use client";

import { Map, RasterTileSource } from "maplibre-gl";
import { useEffect, useState } from "react";
import "../../node_modules/maplibre-gl/dist/maplibre-gl.css";
import { analysisLulc, lulcLayer , transferMatrixLulc} from "../module/ee";
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
        const  evaluatedAreas  = await analysisLulc();
        const  histogramData  = await transferMatrixLulc();
        console.log(histogramData)
        console.log(evaluatedAreas)
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

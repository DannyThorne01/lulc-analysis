
import { Map, RasterTileSource } from "maplibre-gl";
import { useContext, useEffect, useState } from "react";
import "../../node_modules/maplibre-gl/dist/maplibre-gl.css";
import { analysisLulc, lulcLayer, transferMatrixLulc } from "../module/ee";
import MapComponent, { NavigationControl } from "react-map-gl/maplibre"; 
import { Context } from '../module/global';

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

  const { map, setMap, tile, setTile, country,setCountry} = context;

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  // const [map, setMap] = useState<Map | null>(null); // Explicitly type as Map | null
  //const [tile, setTile] = useState<string | null>(null); // Allow tile to be a string or null
  const [layerAdded, setLayerAdded] = useState(false);

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
        const { urlFormat, bounds } = await lulcLayer(country);
        console.log(urlFormat)
        setTile(urlFormat); // Store the URL in state'
        const latitude = (bounds.north + bounds.south) / 2;
        const longitude = (bounds.east + bounds.west) / 2;
        const zoom = calculateZoomLevel(bounds);

        setViewState({
          latitude,
          longitude,
          zoom,
          bearing: 0,
          pitch: 0,
        });
      } catch (error) {
        console.error("Error loading LULC tiles:", error);
      }
    }
    if (country) {
      loadLULCTiles();
    }
  }, [country]);

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
    <MapComponent
      id="map"
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE}
      style={{ width: "100vw", height: "100vh" }}
      onLoad={handleMapLoad}
    >
      <NavigationControl position="top-left" />
    </MapComponent>
  );
};

export default MapCanvas;
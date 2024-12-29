// 'use server';
// import ee from '@google/earthengine';
// import { authenticate, evaluate, getMapId } from './ee-server';

// export async function getLULCMapUrl(year) {
//   try {
//     await authenticate();
//     console.log("Authenticated successfully");

//     // Image collection of Sentinel-2
//     const col = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");

//     // Fetch Guyana boundary from Earth Engine FeatureCollection
//     const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
//     const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', 'Guyana'));
//     console.log(guyana)
//     // Use the geometry of Guyana for clipping
//     const geometry = guyana.geometry();

//     // Range of dates for filtering
//     const start = "2023-05-01";
//     const end = "2023-07-31";

//     // Filter image collection by date and bounds
//     const filtered = col.filterBounds(geometry).filterDate(start, end);

//     // Apply cloud masking
//     const cloudMasked = filtered.map((image) => {
//       const scl = image.select("SCL");
//       const mask = scl
//         .eq(3)
//         .or(scl.gte(7).and(scl.lte(10)))
//         .eq(0);
//       return image.select(["B.*"]).updateMask(mask);
//     });

//     // Create a median composite of the images
//     const median = cloudMasked.median().clip(geometry); // Ensure clipping to Guyana

//     // Visualization parameters
//     const vis = {
//       min: [1000, 500, 250],
//       max: [4000, 3000, 2000],
//       bands: ["B8", "B11", "B12"],
//     };

//     // Get the Map ID URL for visualization
//     const { urlFormat } = await getMapId(median, vis);

//     // Get the geometry of Guyana as GeoJSON
//     const guyanaGeometryGeojson = await evaluate(geometry);

//     // Return the result as a plain object
//     return { urlFormat, geojson: guyanaGeometryGeojson };
//   } catch (error) {
//     console.error("Error fetching LULC Map URL:", error);
//     throw new Error(error.message || "Unknown error occurred");
//   }
// }


'use server';
import ee from '@google/earthengine';
import { authenticate, evaluate, getMapId } from './ee-server';
import lc from '../data/lc.json';

export async function lulcLayer() {

  var year = 2003;
  // Authenticate Earth Engine
  await authenticate();

  // Image collection
  const col: ee.ImageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");

  // Creat image mosaic
  let colBand: ee.ImageCollection;

  // Conditional mosaic based on year
  if (year < 2000) {
    colBand = col.select(`b${(year - 1980) / 5}`);
  } else {
    colBand = col.select(`b${year - 1999}`);
  }

  // Mosaic the image and add visualization
  const image: ee.Image = colBand.mosaic().rename('lulc').set({
    lulc_class_names: lc.names,
    lulc_class_palette: lc.palette,
    lulc_class_values: lc.values,
  });

  // Visualized the image
  const visualized: ee.Image = image.visualize();

  // Get image url
  const { urlFormat } = await getMapId(visualized, {});

  return { urlFormat };
}
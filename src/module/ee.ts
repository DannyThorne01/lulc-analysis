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


'use server'; // code will run on server side

import ee from '@google/earthengine';
import { authenticate, evaluate, getMapId } from './ee-server';
import lc from '../data/lc.json';

export async function lulcLayer() {
  var year = 2022;
  // Authenticate Earth Engine
  await authenticate();

  // Image collection
  const col: ee.ImageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");

  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', 'Guyana'));
  const geometry = guyana.geometry();

  // Create image mosaic
  let colBand: ee.ImageCollection = col.select(`b${year-1999}`);

  // Conditional mosaic based on year

  // if (year < 2000) {
  //   colBand = col.select(`b${(year - 1980) / 5}`);
  // } else {
  //   colBand = col.select(`b${year - 1999}`);
  // }

  // Mosaic the image and add visualization
  const image: ee.Image = colBand.mosaic().rename('lulc').set({
    lulc_class_names: lc.names,
    lulc_class_palette: lc.palette,
    lulc_class_values: lc.values,
  });

  // Clip the image to Guyana's boundaries
  const clippedImage: ee.Image = image.clip(geometry);
  // Visualized the image
  const visualized: ee.Image = clippedImage.visualize();
  // Get image url
  const { urlFormat } = await getMapId(visualized, {});

  return { urlFormat };
}

export async function analysisLulc() {
  await authenticate();
  const years = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
  2020, 2021, 2022];

  // Image collection
  const col: ee.ImageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");

  const area = ee.Image.pixelArea().divide(1e4);
  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', 'Guyana'));
  const geometry = guyana.geometry();

   // Area land cover per year
   var areas = ee.List(
    years.map((year, index)  =>{
      // Image collection
      const clipped_col: ee.ImageCollection = col.filterBounds(geometry);
 
      const image = ee
        .Image(clipped_col.select(`b${index+1}`).mosaic())
        .rename(`lulc_${year}`);

        const areaLc = area
        .addBands(image)
        .clip(geometry)
        .reduceRegion({
          geometry,
          scale: 100,
          maxPixels: 1e13,
          reducer: ee.Reducer.sum().setOutputs(['area']).group(1, 'lc'),
        });

      // const data = await evaluate(areaLc);
      // console.log('The year is ' + year)
      // console.log(data)
      return areaLc;
    })
  );
  // Evaluate the results
  const evaluatedAreas = await evaluate(areas);

  // console.log("LULC Analysis Results:", evaluatedAreas);
  return { data: evaluatedAreas };
}



export async function transferMatrixLulc() {
  await authenticate();
  const imageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual")
  .select('b1')
  .mosaic()
  .rename('y1'); // Year 2000

  const imageCollection2 = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual")
    .select('b23')
    .mosaic()
    .rename('y2'); // Year 2022

// Load Guyana geometry
const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', 'Guyana'));
const geometry = guyana.geometry();

// Combine the two bands into one image
const transitions = imageCollection.addBands(imageCollection2);

// Generate a stratified sample
const stratifiedSamples = transitions.stratifiedSample({
  numPoints: 500, // Total number of points to sample
  classBand: 'y1', // Use Year 2000 classes as the stratification band
  region: geometry, // Region to sample from
  scale: 30, // Scale of the dataset (30m resolution)
  geometries: true, // Include geometry information for each point
  classValues: [0, 10, 11, 51, 52, 61, 62, 71, 72, 81, 82, 91, 120, 130, 150, 181, 182, 183, 185, 186, 187, 190, 200, 210], // Your LULC class values
  classPoints: Array(24).fill(10), // Number of points per class
  });


  var dict = ee.Dictionary({}); // Initialize an empty dictionary
var uniqueList = ee.List([]); // Initialize an empty ee.List

// Use iterate to populate the dictionary
var transitionDict = stratifiedSamples.iterate(function(feature, currentDict) {
  currentDict = ee.Dictionary(currentDict); // Ensure it's a Dictionary

  var y1 = feature.get('y1');
  var y2 = feature.get('y2');

  // Create a key for the transition
  var key = ee.String(y1).cat('_').cat(ee.String(y2));

  // Increment the count for this key
  var count = ee.Number(currentDict.get(key, 0)).add(1);
  return currentDict.set(key, count); // Update the dictionary
}, dict);

// Separate logic for unique values
var allY1Y2 = stratifiedSamples.map(function(feature) {
  var y1 = feature.get('y1');
  var y2 = feature.get('y2');
  return ee.Feature(null, { y1: y1, y2: y2 });
}).reduceColumns({
  reducer: ee.Reducer.toList().repeat(2),
  selectors: ['y1', 'y2']
});

// Extract unique values for y1 and y2
var uniqueY1Y2 = ee.List(allY1Y2.get('list')).flatten().distinct();

// Evaluate the results
transitionDict.evaluate(function(resultDict) {
  console.log('Transition Dictionary:', resultDict);
});

uniqueY1Y2.evaluate(function(resultList) {
  console.log('Unique List:', resultList);
});

  // // Fetch and log the resulting dictionary (asynchronous)
  // transitionDict.evaluate((result: any) => {
  //   console.log('Transition Dictionary:', result);
  // });

  // // Log stratified samples (optional debugging)
  // stratifiedSamples.evaluate((result: any) => {
  //   console.log('Stratified Samples:', result);
  // });

}

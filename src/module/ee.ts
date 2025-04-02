'use server'; // code will run on server side

import ee from '@google/earthengine';
import { authenticate, evaluate, getMapId } from './ee-server';
import lc from '../data/lc.json';
import * as fs from 'fs'; // Import the filesystem module
import * as path from 'path'; 

export async function lulcLayer(input_country,year) {
  if(input_country!=""){
   
  // Authenticate Earth Engine
  await authenticate();

  console.log("INPIUTTTT COUNRYTRY " + input_country)
  // Image collection
  const col: ee.ImageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");

  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', input_country));
  const geometry = guyana.geometry();

  let colBand: ee.ImageCollection = col.select(`b${year-1999}`);
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

  const bounds = geometry.bounds().coordinates().getInfo();
  const [west, south, east, north] = [
    bounds[0][0][0], // west
    bounds[0][0][1], // south
    bounds[0][2][0], // east
    bounds[0][2][1], // north
  ];

  return { urlFormat,bounds };
  }else{
    return {}
  }
}

export async function lulcLayerbyYear(input_country, year,targetClass) {
  if(input_country!=""){
    year = 2020;
    console.log("wjvnrjnrjng3ng" + targetClass)
    targetClass = parseInt(targetClass,10);
  // Authenticate Earth Engine
  await authenticate();
  // Image collection
  const col: ee.ImageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");

  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', input_country));
  const geometry = guyana.geometry();
  let colBand: ee.ImageCollection = col.select(`b${year-1999}`);
  const image: ee.Image = colBand.mosaic().rename('lulc').set({
    lulc_class_names: lc.names,
    lulc_class_palette: lc.palette,
    lulc_class_values: lc.values,
  });

  var recodeClasses = function(image) {
    // Define the class values
    var classes = lc.values;
    var reclassed = image.remap(classes, ee.List.sequence(1, classes.length));
    return reclassed;
  };

  // Create image mosaic
  let image_at_year: ee.ImageCollection = col.mosaic().select(`b${year-1999}`).set({
    lulc_class_names: lc.names,
    lulc_class_palette: lc.palette,
    lulc_class_values: lc.values,
  });;
  var recoded_image_at_year = recodeClasses(image_at_year);
  recoded_image_at_year = recoded_image_at_year.rename('lulc')
  var maskTargetClass = recoded_image_at_year.eq(targetClass);
  var final_image = recoded_image_at_year.updateMask(maskTargetClass)
  // // Clip the image to Guyana's boundaries
  // const clippedImage: ee.Image = image.clip(geometry);
  // console.log("TARGETCLASS" + targetClass)
  // var maskTargetClass = clippedImage.eq(1)
  // var finalImage = clippedImage.updateMask(maskTargetClass)
  // Visualized the image
  const clippedImage: ee.Image = final_image.clip(geometry);
  // Visualized the image
  var visParams = {
    min: 1,  // Since you remapped to start from 1
    max: 34, // Number of LULC classes after remapping
    palette: lc.palette  // Ensure the palette is correctly referenced
  };
  // const visualized: ee.Image = clippedImage.visualize();
  const visualized: ee.Image = clippedImage.visualize(visParams);
  // Get image url
  const { urlFormat } = await getMapId(visualized, {});

  // const bounds = geometry.bounds().coordinates().getInfo();
 
  return { urlFormat};
  }else{
    return {}
  }
}

export async function bruv(input_country,targetClass,year,circleData){
  if(input_country!=""){
    const startTime = Date.now();
    console.log("LOADING INSIGHTS...");
    console.log("Country:",input_country ?? "NULL or UNDEFINED");
    console.log("Selected Class:", targetClass ?? "NULL or UNDEFINED");
    console.log("Year:", year ?? "NULL or UNDEFINED");
    console.log("Circle Data:", circleData ?? "NULL or UNDEFINED");
  let currentYear = year;
  let prevYear = (year == 2000)? 2000: currentYear-1;

  targetClass = parseInt(targetClass,10);
  await authenticate();
  const circleRegion = ee.Geometry.Point([circleData.center.lng, circleData.center.lat])
  .buffer(circleData.radius);
  const col = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");
  let image_at_year1 = col.mosaic().select(`b${currentYear - 1999}`).rename('y1');
  let image_at_year2 = col.mosaic().select(`b${prevYear - 1999}`).rename('y2');

  const area = ee.Image.pixelArea().divide(1e4);
  const transitions = image_at_year1.addBands(image_at_year2).addBands(area);
  const stratifiedSamples = transitions.stratifiedSample({
    numPoints: 200, 
    classBand: 'y1',
    region: circleRegion, 
    scale: 30,
    geometries: true,
    classValues: [0, 10, 11, 51, 52, 61, 62, 71, 72, 81, 82, 91, 120, 130, 150, 181, 182, 183, 185, 186, 187, 190, 200, 210],
    classPoints: Array(24).fill(200),
  });

    var y1Values = stratifiedSamples.aggregate_array('y1');
    var uniqueY1Values = y1Values.distinct();
    const targetValue = uniqueY1Values.get(targetClass);
    console.log("AYYEYEYYEYEE" + await evaluate(targetValue))
    const filteredSamples = stratifiedSamples.filter(
      ee.Filter.or(
        ee.Filter.eq("y1", uniqueY1Values.get(targetClass)),
        ee.Filter.eq("y2", uniqueY1Values.get(targetClass))
      )
    )
    const samplesWithTransition = filteredSamples.map(function(feature) {
      const y1 = ee.Number(feature.get('y1'));
      const y2 = ee.Number(feature.get('y2'));
      const transitionKey = y1.format('%d').cat('_').cat(y2.format('%d'));
      return feature.set('transition', transitionKey);
    });
    const transitionCounts = samplesWithTransition.aggregate_histogram('transition');
    var uniqueClasses = ee.List([
      stratifiedSamples.aggregate_array('y1'), 
      stratifiedSamples.aggregate_array('y2')  
    ]).flatten().distinct();
    var transferMatrix = await evaluate(transitionCounts);
    var uniqueKeys = await evaluate(uniqueClasses);
  
    // Define the output path for the JSON file
    const outputPath = path.resolve('/Users/danielthorne/ee-webmap/src/data', 'insightsfake.json');
  
    // Save the results to a JSON file
    fs.writeFileSync(outputPath, JSON.stringify(transferMatrix, null, 2), 'utf8');
    const runtime = (Date.now() - startTime) / 1000; // Calculate runtime in seconds
    console.log(`Function executed in ${runtime.toFixed(2)} seconds`);
    return {transferMatrix:transferMatrix, uniqueKeys:uniqueKeys}

  }
  
}
export async function insights(input_country,targetClass,year,circleData) {
  if(input_country!=""){
    console.log("LOADING INSIGHTS...");
    console.log("Country:",input_country ?? "NULL or UNDEFINED");
    console.log("Selected Class:", targetClass ?? "NULL or UNDEFINED");
    console.log("Year:", year ?? "NULL or UNDEFINED");
    console.log("Circle Data:", circleData ?? "NULL or UNDEFINED");
  let currentYear = year;
  let prevYear = (year == 2000)? 2000: currentYear-1;

  targetClass = parseInt(targetClass,10);
  console.log("wauhhht")
  await authenticate();
  console.log("wauhhhtewfwf")
  const area = ee.Image.pixelArea().divide(1e4);
  const col = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");

  // Convert circleData to an Earth Engine Geometry (buffer creates a circular region)
  const circleRegion = ee.Geometry.Point([circleData.center.lng, circleData.center.lat])
    .buffer(circleData.radius);
  console.log("WE HEREE223d23dE")
  // Select and rename images for two years
  let image_at_year1 = col.mosaic().select(`b${currentYear - 1999}`).rename('y1');
  let image_at_year2 = col.mosaic().select(`b${prevYear - 1999}`).rename('y2');
  console.log("WE HEREEEd232")
  // Combine bands (transitions)
  const transitions = image_at_year1.addBands(image_at_year2).addBands(area);
  console.log("WE HEREEE2d23d2")
  // Sample data only within the circle bounds
  const stratifiedSamples = transitions.stratifiedSample({
    numPoints: 500, // Increased sample size for better results
    classBand: 'y1',
    region: circleRegion, // Use the circle bounds instead of country boundaries
    scale: 30,
    geometries: true,
    classValues: [0, 10, 11, 51, 52, 61, 62, 71, 72, 81, 82, 91, 120, 130, 150, 181, 182, 183, 185, 186, 187, 190, 200, 210],
    classPoints: Array(24).fill(100),
  });

  var y1Values = stratifiedSamples.aggregate_array('y1');
  var uniqueY1Values = y1Values.distinct();

 
  // Filter samples where y1 or y2 equals the target class
  const filteredSamples = stratifiedSamples.filter(
    ee.Filter.or(
      ee.Filter.eq("y1", uniqueY1Values.get(targetClass)),
      ee.Filter.eq("y2", uniqueY1Values.get(targetClass))
    )
  )

  var dict = ee.Dictionary({}); // Initialize an empty dictionary

  // Use iterate to populate the dictionary
  var transitionDict = filteredSamples.iterate(function(feature, currentDict) {
    currentDict = ee.Dictionary(currentDict); // Ensure it's a Dictionary
    console.log("INSIDEE")
    var y1 = feature.get('y1');
    var y2 = feature.get('y2');

    var key = ee.String(y1).cat('_').cat(ee.String(y2));

    // Increment the count for this key
    var count = ee.Number(currentDict.get(key, 0)).add(1);
    return currentDict.set(key, count); // Update the dictionary
  }, dict);
  console.log("OUTSIDEEE")
  // Separate logic for unique values
  var allY1Y2 = filteredSamples.map(function(feature) {
    var y1 = feature.get('y1');
    var y2 = feature.get('y2');
    return ee.Feature(null, { y1: y1, y2: y2 });
  }).reduceColumns({
    reducer: ee.Reducer.toList().repeat(2),
    selectors: ['y1', 'y2']
  });
  console.log("After All1")
  var uniqueY1Y2 = ee.List(allY1Y2.get('list')).flatten().distinct();
  console.log("After Uniq")
  var transferMatrix = await evaluate(transitionDict);
  console.log("trans")
  var uniqueKeys = await evaluate(uniqueY1Y2);
  console.log("uniqkjnf")
  return {transferMatrix:transferMatrix, uniqueKeys:uniqueKeys}
  }else{
    return {}
  }
}
export async function analysisLulc(input_country) {
  await authenticate();
  const years = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
  2020, 2021, 2022];

  // Image collection
  const col: ee.ImageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");

  const area = ee.Image.pixelArea().divide(1e4);
  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', input_country));
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
        maxPixels: 1e9,
        reducer: ee.Reducer.sum().setOutputs(['area']).group(1, 'lc'),
      });
      return areaLc;
    })
  );
  console.log("Got AREAS")
  
  // Evaluate the results
  const evaluatedAreas =  await evaluate(areas);
  console.log("DONE")
 
  // // Define the output path for the JSON file
  // const outputPath = path.resolve('/Users/danielthorne/ee-webmap/src/data', 'evaluated_areas.json');

  // // Save the results to a JSON file
  // fs.writeFileSync(outputPath, JSON.stringify(evaluatedAreas, null, 2), 'utf8');
  return {evaluatedAreas};
}

export async function transferMatrixLulc(input_country) {
  const startTime = Date.now();
  await authenticate();
  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', input_country));
  const geometry = guyana.geometry().simplify({maxError: 100});
  const transitions = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual")
  .select(['b1', 'b23'])
  .mosaic()
  .rename(['y1', 'y2'])
  .clip(geometry);

  const classValues = [0, 10, 11, 51, 52, 61, 62, 71, 72, 81, 82, 91, 
    120, 130, 150, 181, 182, 183, 185, 186, 187, 190, 200, 210];

  // Breakdown this Stratifying Sampling technique
  const stratifiedSamples = transitions.stratifiedSample({
    numPoints: 500, 
    classBand: 'y1', 
    region: geometry, 
    scale: 23,
    geometries: true, 
    classValues: classValues, 
    classPoints: Array(24).fill(500),
  });
  const samplesWithTransition = stratifiedSamples.map(function(feature) {
    const y1 = ee.Number(feature.get('y1'));
    const y2 = ee.Number(feature.get('y2'));
    const transitionKey = y1.format('%d').cat('_').cat(y2.format('%d'));
    return feature.set('transition', transitionKey);
  });
  const transitionCounts = samplesWithTransition.aggregate_histogram('transition');

  var uniqueClasses = ee.List([
    stratifiedSamples.aggregate_array('y1'), 
    stratifiedSamples.aggregate_array('y2')  
  ]).flatten().distinct();
  var transferMatrix = await evaluate(transitionCounts);
  var uniqueKeys = await evaluate(uniqueClasses);

  // Define the output path for the JSON file
  const outputPath = path.resolve('/Users/danielthorne/ee-webmap/src/data', 'transferfake.json');

  // Save the results to a JSON file
  fs.writeFileSync(outputPath, JSON.stringify(transferMatrix, null, 2), 'utf8');
  const runtime = (Date.now() - startTime) / 1000; // Calculate runtime in seconds
  console.log(`Function executed in ${runtime.toFixed(2)} seconds`);
  return {transferMatrix:transferMatrix, uniqueKeys:uniqueKeys}
}

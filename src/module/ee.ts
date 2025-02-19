'use server'; // code will run on server side

import ee from '@google/earthengine';
import { authenticate, evaluate, getMapId } from './ee-server';
import lc from '../data/lc.json';
import * as fs from 'fs'; // Import the filesystem module
import * as path from 'path'; 

export async function lulcLayer(input_country) {
  if(input_country!=""){
    var year = 2022;
  // Authenticate Earth Engine
  await authenticate();

  console.log("INPIUTTTT COUNRYTRY " + input_country)
  // Image collection
  const col: ee.ImageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");

  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', input_country));
  const geometry = guyana.geometry();

  // Create image mosaic
  let colBand: ee.ImageCollection = col.select(`b${year-1999}`);
  const currentYearBand = `b${year - 1999}`;
  const previousYearBand = `b${year - 2000}`;
  // Mosaic the image and add visualization

  const colBandCurrent: ee.ImageCollection = col.select(currentYearBand);
  const colBandPrevious: ee.ImageCollection = col.select(previousYearBand);
  const imageCurrent: ee.Image = colBandCurrent.mosaic().rename('lulc_current').clip(geometry);
  const imagePrevious: ee.Image = colBandPrevious.mosaic().rename('lulc_previous').clip(geometry);
  const image: ee.Image = colBand.mosaic().rename('lulc').set({
    lulc_class_names: lc.names,
    lulc_class_palette: lc.palette,
    lulc_class_values: lc.values,
  });

  console.log("IMAGE PREVIOUS "+ imagePrevious)



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
  const clippedImage: ee.Image = image.clip(geometry);
  // Visualized the image
  var visParams = {
    min: 1,  // Since you remapped to start from 1
    max: 34, // Number of LULC classes after remapping
    palette: lc.palette  // Ensure the palette is correctly referenced
  };
  // const visualized: ee.Image = clippedImage.visualize();
  const visualized: ee.Image = final_image.visualize(visParams);
  // Get image url
  const { urlFormat } = await getMapId(visualized, {});

  // const bounds = geometry.bounds().coordinates().getInfo();
 
  return { urlFormat};
  }else{
    return {}
  }
}
export async function insights(input_country,targetClass,year,circleData) {
  if(input_country!=""){
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
  var uniqueY1Y2 = ee.List(allY1Y2.get('list')).flatten().distinct();
  var transferMatrix = await evaluate(transitionDict);
  var uniqueKeys = await evaluate(uniqueY1Y2);
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
  await authenticate();
  const area = ee.Image.pixelArea().divide(1e4);
  const imageCollection = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual")
  .select('b1')
  .mosaic()
  .rename('y1'); 

  const imageCollection2 = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual")
    .select('b23')
    .mosaic()
    .rename('y2'); 

// Load Guyana geometry
const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
const guyana = countries.filter(ee.Filter.eq('ADM0_NAME', input_country));
const geometry = guyana.geometry();
// Combine the two bands into one image
const transitions = imageCollection.addBands(imageCollection2).addBands(area);

// Generate a stratified sample
const stratifiedSamples = transitions.stratifiedSample({
  numPoints: 100, // Total number of points to sample
  classBand: 'y1', // Use Year 2000 classes as the stratification band
  region: geometry, // Region to sample from
  scale: 30, // Scale of the dataset (30m resolution)
  geometries: true, // Include geometry information for each point
  classValues: [0, 10, 11, 51, 52, 61, 62, 71, 72, 81, 82, 91, 120, 130, 150, 181, 182, 183, 185, 186, 187, 190, 200, 210], // Your LULC class values
  classPoints: Array(24).fill(100), // Number of points per class
  });


  var dict = ee.Dictionary({}); // Initialize an empty dictionary

  // Use iterate to populate the dictionary
  var transitionDict = stratifiedSamples.iterate(function(feature, currentDict) {
    currentDict = ee.Dictionary(currentDict); // Ensure it's a Dictionary

    var y1 = feature.get('y1');
    var y2 = feature.get('y2');

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
  var uniqueY1Y2 = ee.List(allY1Y2.get('list')).flatten().distinct();
  var transferMatrix = await evaluate(transitionDict);
  var uniqueKeys = await evaluate(uniqueY1Y2);
  return {transferMatrix:transferMatrix, uniqueKeys:uniqueKeys}

}



export async function centerOfGravity(input_country){
  await authenticate();
  var countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  var guyana = countries.filter(ee.Filter.eq('ADM0_NAME', 'Guyana'));
  var geometry = guyana.geometry();
  var years_of_interest = ee.List(['b15', 'b16', 'b17', 'b18', 'b19', 'b20','b21', 'b22']);

 
  var calculateYearlyClassCOG = function(stratifiedSamples, classValue) {
    var filtered = stratifiedSamples.filter(ee.Filter.eq('y1', classValue));
  
    // Add longitude and latitude as properties to the filtered features
    var filteredWithCoords = filtered.map(function(feature) {
      var coords = feature.geometry().coordinates(); // Extract coordinates
      return feature.set({
        longitude: coords.get(0), // Set longitude as a property
        latitude: coords.get(1)  // Set latitude as a property
      });
    });
    // var color = classColorDict.get(classValue);
  
    // Compute the mean of longitude and latitude
    var cogX = filteredWithCoords.aggregate_mean('longitude');
    var cogY = filteredWithCoords.aggregate_mean('latitude');
  
    // Create a Feature representing the COG
    return ee.Feature(ee.Geometry.Point([cogX, cogY]), {class: classValue});
  };
  var cogFeatureCollection =ee.FeatureCollection(years_of_interest.map(function(element) {
  
    var iCol = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual")
    .select(ee.String(element))
    .mosaic()
    .rename('y1')

    var stratSamp = iCol.stratifiedSample({
    numPoints: 100,
    classBand: 'y1',
    region:geometry,
    scale:30,
    geometries:true,
    classValues: [0, 10, 11, 51, 52, 61, 62, 71, 72, 81, 82, 91, 120, 130, 150, 181, 182, 183, 185, 186, 187, 190, 200, 210], 
    classPoints: ee.List.sequence(1, 24).map(function(x) {return 100;}),
    });
    
    var y1Values = stratSamp.aggregate_array('y1');
    var uniqueY1Values = y1Values.distinct();

    
    return calculateYearlyClassCOG(stratSamp,uniqueY1Values.get(1));
    // return calculateClassCOG(uniqueY1Values.get(2))
}))
var tolist = cogFeatureCollection.toList(cogFeatureCollection.size());
tolist = await evaluate(tolist)
var cog_points = await evaluate(cogFeatureCollection)
console.log("HEreeeee are the COGSS" + cog_points)

console.log("ergegegerg" + tolist)
return{cogFeatureCollection:cog_points}

}

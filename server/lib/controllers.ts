'use server';
import ee from '@google/earthengine';
import { authenticate, evaluate, getMapId } from './ee-server';
import lc from '../data/lc.json';

process.env.XMLHTTPREQUEST_TEMP_DIR = '/tmp';

export default async function streamTransitions(input_country:string, y1:string, y2:string){
    // get the country, 
    await authenticate;
    var allCountries = ee.FeatureCollection('FAO/GAUL/2015/level0');
    var countryOfInterest = allCountries.filter(ee.Filter.eq('ADM0_NAME',input_country));
    var geometryOfInterest = countryOfInterest.geometry();

    // get the data 
    var allBands = ee.ImageCollectionn('projects/sat-io/open-datasets/GLC-FCS30D/annual');
    var selectedBands = allBands.select(['b1','b23']);
    var selectedMosaic = selectedBands.mosaic();

    //get the overall bounding box to split into tiles

    geometryOfInterest.bounds().evaluate((boundsGeoJSON:ee.Polygon)=>{
      var ringCoordinates = boundsGeoJSON.coordinates[0];
      var bottomLeft = ringCoordinates[0];
      var topRight = ringCoordinates[2];
      const west = bottomLeft[0];
      const south = bottomLeft[1];
      const east = topRight[0];
      const north = topRight[1];

      const step = 3
      let tiles =[];

      for (var lat = south; lat <= north; lat+=step){
        for (var lon = west; lon <= east ; lon +=step){
          tiles.push([lat,lon, lat+step,lon+step]);
        }
      }
      
    })
    
}
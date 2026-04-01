'use server';

import ee from '@google/earthengine';
import { authenticate, evaluate, getMapId } from './ee-server';
import lc from '../data/lc.json';

process.env.XMLHTTPREQUEST_TEMP_DIR = '/tmp';

/* ─────────────────────────────────────────────────────────────────
   fetchLulcTile
   Returns a smoothed, visualised MapLibre tile URL for a given
   country and year.

   The focal_mode filter eliminates salt-and-pepper speckle by
   replacing each pixel with the most common class value in a
   3-pixel-radius circle neighbourhood.  Running it twice merges
   isolated patches into larger, continuous regions.
───────────────────────────────────────────────────────────────── */
export async function fetchLulcTile(input_country: string, year: number) {
  if (!input_country) return {};

  try {
    await authenticate();

    const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
    const geometry = countries
      .filter(ee.Filter.eq('ADM0_NAME', input_country))
      .geometry();

    // Band index: b1 = year 2000, b23 = year 2022
    const image: ee.Image = ee
      .ImageCollection('projects/sat-io/open-datasets/GLC-FCS30D/annual')
      .select(`b${year - 1999}`)
      .mosaic()
      .rename('lulc')
      .set({
        lulc_class_names: lc.names,
        lulc_class_palette: lc.palette,
        lulc_class_values: lc.values,
      });

    const clippedImage: ee.Image = image.clip(geometry);

    // Remap non-contiguous class codes (10, 11, 51 …) to a contiguous index
    // sequence (0, 1, 2 …) so the palette array maps 1-to-1 onto pixel values.
    const indices = lc.values.map((_, i) => i);
    const remapped: ee.Image = clippedImage.remap(lc.values, indices);

    // Smooth: modal filter replaces each pixel with the most common class in a
    // 3-pixel-radius circle — run twice to merge isolated speckle into patches.
    // Operating on 0-based indices is safe; focal_mode preserves integer values.
    const smoothed: ee.Image = remapped.focal_mode({
      radius: 3,
      kernelType: 'circle',
      units: 'pixels',
      iterations: 2,
    });

    // Visualize with an explicit palette so colors survive the remap.
    // min/max span the full 0 → (numClasses-1) index range.
    const visualized: ee.Image = smoothed.visualize({
      min: 0,
      max: lc.values.length - 1,
      palette: lc.palette,
    });

    const { urlFormat } = await getMapId(visualized, {});
    return { urlFormat };

  } catch (error) {
    console.error('fetchLulcTile error:', error);
    return { error: 'Failed to generate tile' };
  }
}

/* ─────────────────────────────────────────────────────────────────
   analysisLulc
   Computes LULC area (hectares) per class for every year 2000–2022.
   Returns a list of 23 objects, each containing a `groups` array
   of { lc: classId, area: hectares } — used by the stacked area chart.

   filterBounds is hoisted outside the year loop so GEE doesn't
   rebuild the filtered collection on every iteration.
───────────────────────────────────────────────────────────────── */
export async function analysisLulc(input_country: string) {
  await authenticate();

  const years = Array.from({ length: 23 }, (_, i) => 2000 + i); // 2000 … 2022

  const col: ee.ImageCollection = ee.ImageCollection('projects/sat-io/open-datasets/GLC-FCS30D/annual');
  const area = ee.Image.pixelArea().divide(1e4); // m² → hectares

  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const countryFeature = countries.filter(ee.Filter.eq('ADM0_NAME', input_country));
  const geometry = countryFeature.geometry();

  // Filter once — reused across all 23 years
  const filteredCol: ee.ImageCollection = col.filterBounds(geometry);

  const areas = ee.List(
    years.map((year, index) => {
      const image = ee
        .Image(filteredCol.select(`b${index + 1}`).mosaic())
        .rename(`lulc_${year}`);

      // Group summed pixel area by land cover class (band 1 = area, band 2 = lc)
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

  const evaluatedAreas = await evaluate(areas);
  return { evaluatedAreas };
}

/* ─────────────────────────────────────────────────────────────────
   transferMatrixLulc
   Computes the land cover transition matrix between 2000 (b1) and
   2022 (b23) using stratified sampling.  Returns a histogram of
   "y1_y2" transition keys and the list of unique class IDs seen.
   Used by the heatmap chart.

   Geometry is simplified to reduce memory pressure for countries
   with complex coastlines.
───────────────────────────────────────────────────────────────── */
export async function transferMatrixLulc(input_country: string) {
  await authenticate();

  const countries = ee.FeatureCollection('FAO/GAUL/2015/level0');
  const countryFeature = countries.filter(ee.Filter.eq('ADM0_NAME', input_country));

  // Simplify geometry edges to ease memory load on large countries
  const geometry = countryFeature.geometry().simplify({ maxError: 100 });

  // Load year 2000 (b1) and 2022 (b23) in a single mosaic pass
  const transitions = ee
    .ImageCollection('projects/sat-io/open-datasets/GLC-FCS30D/annual')
    .select(['b1', 'b23'])
    .mosaic()
    .rename(['y1', 'y2'])
    .clip(geometry);

  const classValues = [
    0, 10, 11, 51, 52, 61, 62, 71, 72, 81, 82, 91,
    120, 130, 150, 181, 182, 183, 185, 186, 187, 190, 200, 210,
  ];

  // Stratified sample: 500 points per class ensures all classes are represented
  const stratifiedSamples = transitions.stratifiedSample({
    numPoints: 500,
    classBand: 'y1',
    region: geometry,
    scale: 23,
    geometries: true,
    classValues,
    classPoints: Array(24).fill(500),
  });

  // Tag each sample with a "before_after" transition key e.g. "10_51"
  const samplesWithTransition = stratifiedSamples.map(function (feature) {
    const y1 = ee.Number(feature.get('y1'));
    const y2 = ee.Number(feature.get('y2'));
    const transitionKey = y1.format('%d').cat('_').cat(y2.format('%d'));
    return feature.set('transition', transitionKey);
  });

  const transitionCounts = samplesWithTransition.aggregate_histogram('transition');

  // Collect all unique class IDs seen across both years for axis labels
  const uniqueClasses = ee
    .List([
      stratifiedSamples.aggregate_array('y1'),
      stratifiedSamples.aggregate_array('y2'),
    ])
    .flatten()
    .distinct();

  const transferMatrix = await evaluate(transitionCounts);
  const uniqueKeys = await evaluate(uniqueClasses);

  return { matrix: transferMatrix, uniqueKeys };
}

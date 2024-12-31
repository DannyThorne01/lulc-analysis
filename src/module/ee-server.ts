
import 'node-self';
import ee from '@google/earthengine';
import { MapId, VisObject } from './global';
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

/**
 * Function to authenticate and initialize earth engine using google service account private key
 * This function is made so that authentication doesnt have to use callback but with promise (better to read)
 * @param {JSON} key JSON string of the private key
 * @returns {Promise<void>} did not return anything
 */
export function authenticate(): Promise<void> {
  const key = JSON.parse(process.env.service_account_key);
  return new Promise<void>((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      key,
      () =>
        ee.initialize(
          null,
          null,
          () => resolve(),
          (error) => reject(new Error(error))
        ),
      (error) => reject(new Error(error))
    );
  });
}

/**
 * Function to get the image tile url
 * This function is also for no callback
 * @param {ee.Image} image
 * @param {{ min: [number, number, number], max: [number, number, number], bands: [string, string, string]}}
 * @returns {Promise<{urlFormat: string}>} Will return the object with key urlFormat for viewing in web map
 */
export function getMapId(
  data: ee.Image | ee.ImageCollection | ee.FeatureCollection | ee.Geometry,
  vis: VisObject | {}
): Promise<MapId>  {
  return new Promise((resolve, reject) => {
    data.getMapId(vis, (obj, error) =>
      error ? reject(new Error(error)) : resolve(obj)
    );
  });
}

/**
 * Function to get an actual value of an ee object
 * @param {any} obj
 * @returns {any}
 */
export function evaluate(element: any): Promise<any>{
  return new Promise((resolve, reject) =>
    element.evaluate((result, error) =>
      error ? reject(new Error(error)) : resolve(result)
    )
  );
}
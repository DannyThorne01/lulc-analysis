export type VisObject = {
  bands: Array<string>;
  min: Array<number>;
  max: Array<number>;
  palette?: Array<string>;
};

export type MapId = {
  mapid: string;
  urlFormat: string;
  image: Object;
};
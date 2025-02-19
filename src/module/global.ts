
import { Dispatch, ReactNode, SetStateAction, createContext, useState } from 'react';
import { GeoJSON } from 'geojson';
import { Map } from 'maplibre-gl';
import * as d3 from "d3";

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export type GlobalContext = {
  map: Map | undefined;
  setMap: SetState<Map>;
  tile: string | undefined;
  setTile: SetState<string>;
  heatmapData: Props | undefined;
  setHeatMapData: SetState<Props>;
  linegraphData:LineGraphProps | undefined;
  setLineGraphData: SetState<LineGraphProps>;
  country: string
  setCountry: SetState<string>
  circleData: CircleData;
  setCircleData: SetState<CircleData>;
  year: number
  setYear: SetState<number>;
  selectedClass: number;
  setSelectedClass: SetState<number>;
  insightsData: Props | undefined; 
  setInsightsData: SetState<Props>;
  seeInsight: boolean
  setSeeInsight: SetState<boolean>;

  //
};

export type CircleData = {
  center: { lat: number; lng: number };
  radius: number;
};
interface Group {
  area: number; // The area value
  lc: number;   // The land cover type identifier
}

interface Info {
  groups: Group[]; // Array of Group objects
}

export interface LineGraphProps {
  info: Info[]; // Array of Info objects
}

export interface Props {
  info?: {
    uniqueKeys?: number[];
    matrix?: { [key: string]: number };
  };
}

export const Context = createContext<GlobalContext | undefined>(undefined);

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

export const color = d3.scaleOrdinal()
  .domain([Array(34).keys()]) 
  .range([
    "#6A4C93", "#1982C4", "#8AC926", "#FFCA3A", "#FF595E", "#4CAF50",
    "#F4A261", "#2A9D8F", "#264653", "#E76F51", "#D4A5A5", "#9B5DE5",
    "#F15BB5", "#00BBF9", "#FEE440", "#AACC00", "#118AB2", "#8D99AE",
    "#FFC300", "#90BE6D", "#6D6875", "#FF7A5C", "#457B9D", "#E9C46A",
    "#E63946", "#A8DADC", "#B5838D", "#CB997E", "#DDBEA9", "#FFC6FF",
    "#D6A2E8", "#B2A4FF", "#85C7F2",
  ]);


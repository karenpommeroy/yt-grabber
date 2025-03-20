import _groupBy from "lodash/groupBy";
import _indexOf from "lodash/indexOf";
import _keys from "lodash/keys";
import _map from "lodash/map";
import _replace from "lodash/replace";

import TracksMock from "../tests/MultipleMock";
import {TrackInfo, YoutubeInfoResult} from "./Youtube";

export const isDev = () => process.env.NODE_ENV === "development";

export const formatFileSize = (sizeInBytes: number, decimals = 2) => {
    if (sizeInBytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
  
    return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
};

export const mapRange = (x: number, inRange: [number, number], outRange: number[]) => {
    return ((x - inRange[0]) * (outRange[1] - outRange[0])) / (inRange[1] - inRange[0]) + outRange[0];
};

export const escapePathString = (value: string) => {
    return _replace(value, /\//g, "-");
};

export const resolveMockData = (delay = 1000) => {
    const groupped = _groupBy(TracksMock as unknown as TrackInfo[], (item) => item.playlist_id ?? item.id);
    
    return _map(groupped, (v, k, c) => new Promise<YoutubeInfoResult>((resolve) => {
        setTimeout(() => {
            resolve({url: k, value: v});
        }, delay * (_indexOf(_keys(c), k) + 1));
    }));
};

import _replace from "lodash/replace";

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

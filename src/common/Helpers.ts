export const formatFileSize = (sizeInBytes: number, decimals = 2) => {
    if (sizeInBytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
  
    return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
};

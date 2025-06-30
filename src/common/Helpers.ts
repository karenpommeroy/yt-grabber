import _groupBy from "lodash/groupBy";
import _includes from "lodash/includes";
import _indexOf from "lodash/indexOf";
import _isNumber from "lodash/isNumber";
import _keys from "lodash/keys";
import _map from "lodash/map";
import _replace from "lodash/replace";

import {VideoType} from "./Media";
import {TrackInfo, UrlType, YoutubeInfoResult} from "./Youtube";

export const isDev = () => process.env.NODE_ENV === "development";

export const formatFileSize = (sizeInBytes: number, decimals = 2) => {
    if (!_isNumber(sizeInBytes)) return "";
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
    const TracksMock: any[] = [];
    const groupped = _groupBy(TracksMock as unknown as TrackInfo[], (item) => item.playlist_id ?? item.id);
    
    return _map(groupped, (v, k, c) => new Promise<YoutubeInfoResult>((resolve) => {
        setTimeout(() => {
            resolve({url: k, value: v});
        }, delay * (_indexOf(_keys(c), k) + 1));
    }));
};

export const waitFor = (miliseconds: number) => new Promise((resolve) => setTimeout(resolve, miliseconds));

export const getUrlType = (url: string) => {
    const artistRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube\.com\/|youtu\.be\/)?(channel)/;
    const playlistRegex = /^(?:https?:\/\/)?(?:www\.)?(?:music\.)?youtube\.com\/(?:playlist\?list=|watch\?.*?\blist=)([a-zA-Z0-9_-]+)/;
    const trackRegex = /^(?:https?:\/\/)?(?:www\.)?(?:music\.)?youtube\.com\/watch\?.*?\bv=([a-zA-Z0-9_-]+)/;

    const isArtist = artistRegex.test(url);
    const isPlaylist = playlistRegex.test(url);
    const isTrack = trackRegex.test(url);
    
    if (isArtist) {
        return UrlType.Artist;
    } else if (isPlaylist) {
        return UrlType.Playlist;
    } else if (isTrack) {
        return UrlType.Track;
    }

    return UrlType.Other;
};

export const getRealFileExtension = (ext: string) => {
    return _includes([VideoType.Avi, VideoType.Mov, VideoType.Mpeg], ext) ? VideoType.Mkv : ext;
};

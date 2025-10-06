import _groupBy from "lodash/groupBy";
import _includes from "lodash/includes";
import _indexOf from "lodash/indexOf";
import _isNumber from "lodash/isNumber";
import _keys from "lodash/keys";
import _map from "lodash/map";
import _replace from "lodash/replace";

import {VideoType} from "./Media";
import {TrackInfo, UrlType, YoutubeInfoResult} from "./Youtube";

type DataAttributes<T> = {
  [K in keyof T as K extends `data-${string}` ? K : never]: T[K];
};

type NonDataAttributes<T> = Omit<T, keyof DataAttributes<T>>;

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

export const isPlaylist = (url: string) => {
    const playlistRegex = /^(?:https?:\/\/)?(?:www\.)?(?:music\.)?youtube\.com\/(?:playlist\?list=|watch\?.*?\blist=)([a-zA-Z0-9_-]+)/;

    return playlistRegex.test(url);
};

export const isArtist = (url: string) => {
    const artistRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:music\.)?(?:youtube\.com\/|youtu\.be\/)?(channel)/;

    return artistRegex.test(url);
};

export const isTrack = (url: string) => {
    const trackRegex = /^(?:https?:\/\/)?(?:www\.)?(?:music\.)?youtube\.com\/watch\?.*?\bv=([a-zA-Z0-9_-]+)/;

    return trackRegex.test(url);
};

export const getUrlType = (url: string) => {
    if (isArtist(url)) {
        return UrlType.Artist;
    } else if (isPlaylist(url)) {
        return UrlType.Playlist;
    } else if (isTrack(url)) {
        return UrlType.Track;
    }

    return UrlType.Other;
};

export const getRealFileExtension = (ext: string) => {
    return _includes([VideoType.Avi, VideoType.Mov, VideoType.Mpeg, VideoType.Gif], ext) ? VideoType.Mkv : ext;
};

export const getDataAttributes = (props: Record<string, any>) => {
    const dataAttrs: Record<string, any> = {};
    for (const key in props) {
        if (key.startsWith("data-")) {
            dataAttrs[key] = props[key];
        }
    }
    return dataAttrs;
};

export const splitDataAttributes = <T extends Record<string, any>>(props: T) => {
    const dataProps: Partial<DataAttributes<T>> = {};
    const restProps: Partial<NonDataAttributes<T>> = {};

    for (const key in props) {
        if (key.startsWith("data-")) {
            (dataProps as any)[key] = props[key];
        } else {
            (restProps as any)[key] = props[key];
        }
    }

    return [dataProps as DataAttributes<T>, restProps as NonDataAttributes<T>] as const;
};

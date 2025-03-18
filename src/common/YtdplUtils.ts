import _get from "lodash/get";
import _isEmpty from "lodash/isEmpty";
import _map from "lodash/map";
import _template from "lodash/template";
import _toString from "lodash/toString";
import moment from "moment";

import {Format} from "../components/youtube/formatSelector/FormatSelector";
import {isAlbumTrack} from "./Formatters";
import {escapePathString} from "./Helpers";
import {MediaFormat} from "./Media";
import StoreSchema from "./Store";
import {AlbumInfo, TrackInfo} from "./Youtube";

export const useYtdplUtils = () => {
    // const [appOptions, setAppOptions] = useState<ApplicationOptions>(global.store.get("application"));
    // const {playlists, tracks, trackStatus, trackCuts, setPlaylists, setTracks, setTrackStatus, clear} = useDataState();


    const getYtdplRequestParams = (track: TrackInfo, album: AlbumInfo, trackCuts: {[key: string]: number[]}, format: Format) => {
        const paramRetrievers = {
            [MediaFormat.Audio]: getYtdplParamsForAudio,
            [MediaFormat.Video]: getYtdplParamsForVideo,
        };
        const appOptions = global.store.get("application");
        const paramRetriever = paramRetrievers[format.type];
        const commonParams = [
            "--progress",
            ...getCutArgs(track, trackCuts),
            appOptions.alwaysOverwrite ? "--force-overwrite" : "",
            "--postprocessor-args", getPostProcessorArgs(track, album, trackCuts),
            "--output", getOutput(track, album, format)
        ];

        return [...paramRetriever(format), ...commonParams];
    };

    const getYtdplParamsForAudio = (format: Format) => {
        return [
            "--extract-audio",
            "--audio-format", format.extension,
            format.extension !== "wav" ? "--embed-thumbnail" : "", // wav does not support thumbnail embedding
            "--audio-quality", _toString(format.audioQuality),
        ];
    };

    const getYtdplParamsForVideo = (format: Format) => {
        const selected = format.videoQuality;
        const [, height] = _map(selected.match(/\d+/g), Number);
        const ext = format.extension === "mkv" ? "webm" : format.extension;

        return [
            "-f", `bv*[height<=${height}][ext=${ext}]+ba[ext=m4a]/b[height<=${height}][ext=${ext}] / bv*+ba/b`,
            "--embed-thumbnail",
        ];
    };

    const getPostProcessorArgs = (track: TrackInfo, album: AlbumInfo, trackCuts: {[key: string]: number[]}) => {
        if (isAlbumTrack(track)) {
            const title = track.title.replace(/"/g, "\\\"");
            const artist = album.artist.replace(/"/g, "\\\"");
            const albumTitle = album.title.replace(/"/g, "\\\"");
            return getCutsPostProcessorArgs(track, trackCuts) + `-metadata title="${title}" -metadata artist="${artist}" -metadata album="${albumTitle}" -metadata track="${track.playlist_autonumber}" -metadata date="${album.releaseYear}" -metadata release_year="${album.releaseYear}"`;
        }

        return getCutsPostProcessorArgs(track, trackCuts) + `-metadata title="${track.title}"`;
    };

    const getCutsPostProcessorArgs = (track: TrackInfo, trackCuts: {[key: string]: number[]}) => {
        const cuts = trackCuts[track.id];
        if (_isEmpty(cuts)) {
            return "";
        } else {
            const start = moment.duration(cuts[0], "seconds");
            const end = moment.duration(cuts[1], "seconds");
            const length = end.subtract(start);

            const t = length.format("H:m:s");

            return `-ss 0:0:0 -to ${t} `;
        }
    };

    const getCutArgs = (track: TrackInfo,  trackCuts: {[key: string]: number[]}): string[] => {
        const cuts = trackCuts[track.id];

        if (_isEmpty(cuts)) {
            return [];
        } else {
            return ["--download-sections", `*${moment.duration(cuts[0], "seconds").format("HH:mm:ss")}-${moment.duration(cuts[1], "seconds").format("HH:mm:ss")}`, "-S", "proto:https"];
        }
    };

    const getOutput = (track: TrackInfo, album: AlbumInfo, format: Format) => {
        return getOutputFile(track, album, format) + ".%(ext)s";
    };

    const getOutputFilePath = (track: TrackInfo, album: AlbumInfo, format: Format) => {
        return getOutputFile(track, album, format) + "." + format.extension;
    };

    const getOutputFile = (track: TrackInfo, album: AlbumInfo, format: Format) => {
        const appOptions = global.store.get("application");
        const interpolate = /{{([\s\S]+?)}}/g;
        const data = {
            albumTitle: escapePathString(album.title),
            artist: escapePathString(album.artist),
            trackTitle: escapePathString(track.title),
            trackNo: track.playlist_autonumber,
            releaseYear: album.releaseYear
        };

        if (format.type === MediaFormat.Audio) {
            if (!isAlbumTrack(track)) {
                try {
                    const compiled = _template(appOptions.trackOutputTemplate, {interpolate});

                    return `${appOptions.outputDirectory}/${compiled(data)}`;
                } catch {
                    const defaultTrackOutputTemplate = _get(StoreSchema.application, "properties.trackOutputTemplate.default");
                    const compiled = _template(defaultTrackOutputTemplate, {interpolate});

                    return `${appOptions.outputDirectory}/${compiled(data)}`;
                }
            } else {
                try {
                    const compiled = _template(appOptions.albumOutputTemplate, {interpolate});

                    return `${appOptions.outputDirectory}/${compiled(data)}`;
                } catch {
                    const defaultAlbumOutputTemplate = _get(StoreSchema.application, "properties.albumOutputTemplate.default");
                    const compiled = _template(defaultAlbumOutputTemplate, {interpolate});

                    return `${appOptions.outputDirectory}/${compiled(data)}`;
                }
            }
        }

        if (format.type === MediaFormat.Video) {
            if (!isAlbumTrack(track)) {
                try {
                    const compiled = _template(appOptions.videoOutputTemplate, {interpolate});

                    return `${appOptions.outputDirectory}/${compiled(data)}`;
                } catch {
                    const defaultVideoOutputTemplate = _get(StoreSchema.application, "properties.videoOutputTemplate.default");
                    const compiled = _template(defaultVideoOutputTemplate, {interpolate});

                    return `${appOptions.outputDirectory}/${compiled(data)}`;
                }
            } else {
                try {
                    const compiled = _template(appOptions.playlistOutputTemplate, {interpolate});

                    return `${appOptions.outputDirectory}/${compiled(data)}`;
                } catch {
                    const defaultPlaylistOutputTemplate = _get(StoreSchema.application, "properties.playlistOutputTemplate.default");
                    const compiled = _template(defaultPlaylistOutputTemplate, {interpolate});

                    return `${appOptions.outputDirectory}/${compiled(data)}`;
                }
            }
        }
    };

    return {
        getYtdplRequestParams,
        getOutputFilePath
    };
};

export default useYtdplUtils;

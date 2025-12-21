import {spawn} from "child_process";
import fs from "fs-extra";
import {flatten, get, isEmpty, map, padStart, template, times, toString} from "lodash-es";
import moment from "moment";

import {getBinPath} from "./FileSystem";
import {isAlbumTrack, isPlaylistTrack} from "./Formatters";
import {escapePathString, getRealFileExtension, sanitizeFilePath} from "./Helpers";
import {Format, MediaFormat, VideoType} from "./Media";
import StoreSchema from "./Store";
import {AlbumInfo, TrackInfo} from "./Youtube";

export const getYtdplRequestParams = (track: TrackInfo, album: AlbumInfo, trackCuts: {[key: string]: [number, number][]}, format: Format, customYtdlpArgs = "") => {
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
        "--extractor-args", "youtube:player_client=default,web_safari;player_js_version=actual",
        "--postprocessor-args", getPostProcessorArgs(track, album),
        "--output", getOutput(track, album, format, trackCuts)
    ];

    return [...paramRetriever(format), ...commonParams, customYtdlpArgs];
};

export const getOutputFilePath = (track: TrackInfo, album: AlbumInfo, format: Format) => {
    return getOutputFile(track, album, format) + "." + format.extension;
};

export const getOutputFileParts = (track: TrackInfo, album: AlbumInfo, format: Format, parts: number) => {
    return times(parts, (num) => getOutputFile(track, album, format) + " " + padStart(toString(num + 1), 3, "0") + "." + getRealFileExtension(format.extension));
};

const getYtdplParamsForAudio = (format: Format) => {
    return [
        "--extract-audio",
        "--audio-format", format.extension,
        format.extension !== "wav" ? "--embed-thumbnail" : "", // wav does not support thumbnail embedding
        "--audio-quality", toString(10 - format.audioQuality),
    ];
};

const getYtdplParamsForVideo = (format: Format) => {
    const extensionsMapping: {[key: string]: string;} = {
        [VideoType.Mkv]: "webm",
        [VideoType.Mp4]: VideoType.Mp4,
        [VideoType.Mov]: "webm",
        [VideoType.Avi]: "webm",
        [VideoType.Mpeg]: "webm",
        [VideoType.Gif]: "webm",
    };
    const selected = format.videoQuality;
    const [, height] = map(selected.match(/\d+/g), Number);
    const ext = extensionsMapping[format.extension];

    return [
        "-f", `bv*[height<=${height}][ext=${ext}]+ba[ext=m4a]/b[height<=${height}][ext=${ext}] / bv*+ba/b`,
    ];
};

const getPostProcessorArgs = (track: TrackInfo, album: AlbumInfo) => {
    if (isAlbumTrack(track)) {
        const title = track.title.replace(/"/g, "\\\"");
        const artist = album.artist.replace(/"/g, "\\\"");
        const albumTitle = album.title.replace(/"/g, "\\\"");
        return getCutsPostProcessorArgs() + `-metadata title="${title}" -metadata artist="${artist}" -metadata album="${albumTitle}" -metadata track="${track.playlist_autonumber}/${album.tracksNumber}" -metadata date="${album.releaseYear}" -metadata release_year="${album.releaseYear}"`;
    }

    return getCutsPostProcessorArgs() + `-metadata title="${track.title}"`;
};

const getCutsPostProcessorArgs = () => {
    return "";
};

const getCutArgs = (track: TrackInfo,  trackCuts: {[key: string]: [number, number][]}): string[] => {
    const cuts = trackCuts[track.id];

    if (isEmpty(cuts)) {
        return [];
    } else {
        return [...flatten(map(cuts, (cut) => ["--download-sections", `*${moment.duration(cut[0], "seconds").format("HH:mm:ss")}-${moment.duration(cut[1], "seconds").format("HH:mm:ss")}`])), "--force-keyframes-at-cuts", "-S", "proto:https"];
    }
};

const getOutput = (track: TrackInfo, album: AlbumInfo, format: Format, trackCuts: {[key: string]: [number, number][]}) => {
    const cuts = trackCuts[track.id] ?? [];
    return getOutputFile(track, album, format) + (cuts.length > 1 ? " %(autonumber)03d" : "") + ".%(ext)s";
};

export const getOutputFile = (track: TrackInfo, album: AlbumInfo, format: Format) => {
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
        if (isPlaylistTrack(track)) {
            try {
                const compiled = template(appOptions.playlistOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            } catch {
                const defaultPlaylistOutputTemplate = get(StoreSchema.application, "properties.playlistOutputTemplate.default");
                const compiled = template(defaultPlaylistOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            }
        }
        else if (!isAlbumTrack(track)) {
            try {
                const compiled = template(appOptions.trackOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            } catch {
                const defaultTrackOutputTemplate = get(StoreSchema.application, "properties.trackOutputTemplate.default");
                const compiled = template(defaultTrackOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            }
        } else {
            try {
                const compiled = template(appOptions.albumOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            } catch {
                const defaultAlbumOutputTemplate = get(StoreSchema.application, "properties.albumOutputTemplate.default");
                const compiled = template(defaultAlbumOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            }
        }
    }

    if (format.type === MediaFormat.Video) {
        if (!isAlbumTrack(track)) {
            try {
                const compiled = template(appOptions.videoOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            } catch {
                const defaultVideoOutputTemplate = get(StoreSchema.application, "properties.videoOutputTemplate.default");
                const compiled = template(defaultVideoOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            }
        } else {
            try {
                const compiled = template(appOptions.playlistOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            } catch {
                const defaultPlaylistOutputTemplate = get(StoreSchema.application, "properties.playlistOutputTemplate.default");
                const compiled = template(defaultPlaylistOutputTemplate, {interpolate});

                return sanitizeFilePath(`${appOptions.outputDirectory}/${compiled(data)}`);
            }
        }
    }
};

export const mergeOutputFiles = (directory: string, filename: string, extension: string, callback: (error?: Error) => void) => {
    const getCommandArgs = (ext: string) => {
        if (ext === "m4a") {
            return [
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", `${directory}/${filename}.txt`,
                "-i", `${directory}/${filename} 001.${ext}`,
                "-map", "0:a",
                "-map", "1:v",
                "-c:a", "copy",
                "-c:v", "copy",
                "-disposition:v:0", "attached_pic",
                "-map_metadata", "1",
                `${directory}/${filename}.${ext}`,
            ];
        } else if (ext === "mp3" || ext === "flac") {
            return [
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", `${directory}/${filename}.txt`,
                "-i", `${directory}/${filename} 001.${ext}`,
                "-map", "0:a",
                "-map", "1:v",
                "-c", "copy",
                "-map_metadata", "0",
                "-disposition:v:1", "attached_pic",
                `${directory}/${filename}.${ext}`,
            ];
        }

        return [
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", `${directory}/${filename}.txt`,
            "-c", "copy",
            `${directory}/${filename}.${ext}`,
        ];
    };
    const errors: string[] = [];
    const ffmpegPath: string = global.store.get("application.ffmpegExecutablePath") || `${getBinPath()}/ffmpeg.exe`;
    const proc = spawn(ffmpegPath, getCommandArgs(getRealFileExtension(extension)));

    proc.stderr.on("data", (data) => {
        errors.push(`FFmpeg error: ${data}`);
    });

    proc.on("error", (err) => {
        errors.push(`Error: ${err.message}`);
    });

    proc.on("close", (code: number) => {
        if (code === 0) {
            callback();
        } else {
            callback(new Error(`FFmpeg exited with code ${code}. Errors: ${errors.join(", ")}`));
        }
    });
};

export const convertOutputToFormat = (directory: string, filename: string, extension: string, callback: (error?: Error) => void) => {
    const getCommandArgs = (ext: string) => {
        if (ext === "mov") {
            return [
                "-y",
                "-i", `${directory}/${filename}.mkv`,
                "-c:v", "libx264",
                "-c:a", "aac",
                `${directory}/${filename}.${extension}`,
            ];
        } else if (ext === "avi") {
            return [
                "-y",
                "-i", `${directory}/${filename}.mkv`,
                "-c:v", "mpeg4",
                "-vtag", "xvid",
                "-qscale:v", "1",
                "-c:a", "mp3",
                `${directory}/${filename}.${extension}`,
            ];
        } else if (ext === "mpeg") {
            return [
                "-y",
                "-i", `${directory}/${filename}.mkv`,
                "-f", "mpeg",
                "-c:v", "mpeg2video",
                "-q:v", "1",
                "-c:a", "mp2",
                "-b:a", "192k",
                `${directory}/${filename}.${extension}`,
            ];
        } else if (ext === "mp4") {
            return [
                "-y",
                "-i", `${directory}/${filename}.mkv`,
                "-c", "copy",
                `${directory}/${filename}.${extension}`,
            ];
        }
    };

    const errors: string[] = [];
    const cmdArgs = getCommandArgs(extension);

    if (!cmdArgs) {
        return callback();
    }
    const ffmpegPath: string = global.store.get("application.ffmpegExecutablePath") || `${getBinPath()}/ffmpeg.exe`;
    const proc = spawn(ffmpegPath, cmdArgs);

    proc.stderr.on("data", (data) => {
        errors.push(`FFmpeg error: ${data}`);
    });

    proc.on("error", (err) => {
        errors.push(`Error: ${err.message}`);
    });

    proc.on("close", (code: number) => {
        if (code === 0) {
            callback();
        } else {
            callback(new Error(`FFmpeg exited with code ${code}. Errors: ${errors.join(", ")}`));
        }
    });
};

export const generateColorPalette = (directory: string, filename: string, format: Format, extension: string, callback: (error?: Error) => void) => {
    const errors: string[] = [];
    const selected = format.videoQuality;
    const [width] = map(selected.match(/\d+/g), Number);
    const cmdArgs = [
        "-y",
        "-i", `${directory}/${filename}.mkv`,
        "-vf", `fps=15,scale=${width}:-1:flags=lanczos,palettegen`,
        `${directory}/${filename}-palette.png`,
    ];

    const ffmpegPath: string = global.store.get("application.ffmpegExecutablePath") || `${getBinPath()}/ffmpeg.exe`;
    const proc = spawn(ffmpegPath, cmdArgs);

    proc.on("error", (err) => {
        errors.push(`Error: ${err.message}`);
    });

    proc.on("close", (code: number) => {
        if (code === 0) {
            callback();
        } else {
            callback(new Error(`FFmpeg exited with code ${code}. Errors: ${errors.join(", ")}`));
        }
    });
};

export const createGifUsingPalette = (directory: string, filename: string, format: Format, callback: (error?: Error) => void) => {
    const errors: string[] = [];
    const selected = format.videoQuality;
    const [width, height] = map(selected.match(/\d+/g), Number);
    const gifTopTextLength = format.gifTopText ? format.gifTopText.length : 0;
    const gifBottomTextLength = format.gifBottomText ? format.gifBottomText.length : 0;
    const scalingFactor = 1.7;
    const paddingX = width * 0.02;
    const maxFontSize = height * 0.07;
    const fontSize = Math.min(Math.round(((width - paddingX * 2) / Math.max(gifTopTextLength, gifBottomTextLength, 1)) * scalingFactor), maxFontSize);
    const borderSize = Math.max(Math.round(fontSize * 0.04));
    const gifTopText = format.gifTopText ? `,drawtext=fontfile=/path/to/Arial.ttf:text='${format.gifTopText}':x=(w-text_w)/2:y=h*0.05:fontcolor=white:fontsize=${fontSize}:bordercolor=black:borderw=${borderSize}` : "";
    const gifBottomText = format.gifBottomText ? `,drawtext=fontfile=/path/to/Arial.ttf:text='${format.gifBottomText}':x=(w-text_w)/2:y=h*0.95-th:fontcolor=white:fontsize=${fontSize}:bordercolor=black:borderw=${borderSize}` : "";
    const cmdArgs = [
        "-y",
        "-i", `${directory}/${filename}.mkv`,
        "-i", `${directory}/${filename}-palette.png`,
        // "-filter_complex", `fps=15,scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=floyd_steinberg${gifTopText}${gifBottomText}`,
        "-filter_complex", `fps=15,scale=${width}:-1:flags=bilinear[x];[x][1:v]paletteuse=dither=bayer${gifTopText}${gifBottomText}`,
        `${directory}/${filename}.gif`,
    ];

    const ffmpegPath: string = global.store.get("application.ffmpegExecutablePath") || `${getBinPath()}/ffmpeg.exe`;
    const proc = spawn(ffmpegPath, cmdArgs);

    proc.on("error", (err) => {
        errors.push(`Error: ${err.message}`);
    });

    proc.on("close", (code: number) => {
        fs.removeSync(`${directory}/${filename}-palette.png`);

        if (code === 0) {
            callback();
        } else {
            callback(new Error(`FFmpeg exited with code ${code}. Errors: ${errors.join(", ")}`));
        }
    });
};

export const optimizeGif = (directory: string, filename: string, callback: (error?: Error) => void) => {
    const errors: string[] = [];
    const cmdArgs = [
        "--optimize=2",
        "--colors", "256",
        `${directory}/${filename}.gif`,
        "-o", `${directory}/${filename}.gif`,
    ];

    const gifsiclePath: string = global.store.get("application.gifsicleExecutablePath") || `${getBinPath()}/gifsicle.exe`;
    const proc = spawn(gifsiclePath, cmdArgs);
    
    proc.on("error", (err) => {
        errors.push(`Error: ${err.message}`);
    });
    
    proc.on("close", (code: number) => {
        if (code === 0) {
            callback();
        } else {
            callback(new Error(`Gifsicle exited with code ${code}. Errors: ${errors.join(", ")}`));
        }
    });
};

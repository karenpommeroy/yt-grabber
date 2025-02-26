import {ipcRenderer, IpcRendererEvent} from "electron";
import fs from "fs-extra";
import _every from "lodash/every";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _first from "lodash/first";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isArray from "lodash/isArray";
import _isEmpty from "lodash/isEmpty";
import _isNaN from "lodash/isNaN";
import _isNil from "lodash/isNil";
import _map from "lodash/map";
import _min from "lodash/min";
import _pull from "lodash/pull";
import _reduce from "lodash/reduce";
import _replace from "lodash/replace";
import _size from "lodash/size";
import _some from "lodash/some";
import _sumBy from "lodash/sumBy";
import _template from "lodash/template";
import _times from "lodash/times";
import _toString from "lodash/toString";
import moment from "moment";
import path from "path";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";
import YTDlpWrap, {Progress as YtDlpProgress} from "yt-dlp-wrap";

import {Alert, Box, CircularProgress} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {MediaFormat} from "../../common/Media";
import {OpenSystemPathParams} from "../../common/Messaging";
import StoreSchema, {ApplicationOptions} from "../../common/Store";
import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
import FormatSelector, {Format} from "../../components/youtube/formatSelector/FormatSelector";
import InputPanel from "../../components/youtube/inputPanel/InputPanel";
import MediaInfoPanel from "../../components/youtube/mediaInfoPanel/MediaInfoPanel";
import TrackList from "../../components/youtube/trackList/TrackList";
import {useAppContext} from "../../react/contexts/AppContext";
import {useDataState} from "../../react/contexts/DataContext";
import TracksMock from "../../tests/CompleteTracksMock";
import Styles from "./HomeView.styl";

const isDev = process.env.NODE_ENV === "development";
const binPath = _replace(!isDev ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "resources", "bin"), /\\/g, "/");
const ytDlpWrap = new YTDlpWrap(binPath + "/yt-dlp.exe");

const abortControllersRef: {[key: string]: AbortController} = {};

export const HomeView: React.FC = () => {
    const [appOptions, setAppOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const {t} = useTranslation();
    const {album, tracks, trackStatus, trackCuts, setAlbum, setTracks, setTrackStatus, clear} = useDataState();
    const {state, actions} = useAppContext();
    const [error, setError] = useState(false);
    const [downloadStart, setDownloadStart] = useState(false);
    const trackStatusRef = useRef<TrackStatusInfo[]>(trackStatus);
    const queueRef = useRef<string[]>(state.queue);
    const [debouncedAppOptions] = useDebounceValue(appOptions, 500, {leading: true});
    
    const onFormatSelected = (value: Format) => {
        setAppOptions((prev) => ({...prev, format: value}));
    };

    useEffect(() => {
        ipcRenderer.on("open-system-path-completed", onOpenSystemDirectoryCompleted);

        return () => {
            ipcRenderer.off("open-system-path-completed", onOpenSystemDirectoryCompleted);
        };
    }, []);

    useEffect(() => {
        global.store.set("application", debouncedAppOptions);
    }, [debouncedAppOptions]);

    useEffect(() => {
        if (!downloadStart || !appOptions.format) return;
  
        downloadAlbum();
    }, [appOptions.format, downloadStart]);

    useEffect(() => {
        trackStatusRef.current = trackStatus;
    }, [trackStatus]);

    const download = async (url: string) => {
        if (!album) {
            const result = await loadInfo(url);

            if (_some(result, v => _isNil(v))) {
                setError(true);
            } else {
                setDownloadStart(true);
            }
        } else if (_some(album, v => _isNil(v))) {
            setError(true);
        } else {
            setError(false);
            setDownloadStart(true);
        }
    };

    const onOpenSystemDirectoryCompleted = (event: IpcRendererEvent, data: string) => {
        const parsed: OpenSystemPathParams = JSON.parse(data);
        
        return parsed;
    };

    const handleUrlChange = (url: string) => {       
        setAppOptions((prev) => ({...prev, url}));
    }; 

    const onOpenFile = (trackId: string) => {
        const found = _find(trackStatusRef.current, ["trackId", trackId]);

        ipcRenderer.send("open-system-path", {filepath: found.path});
    };

    const onOpenDirectory = () => {
        const found = _find(trackStatusRef.current, "completed");

        ipcRenderer.send("open-system-path", {dirpath: path.dirname(found.path)});
    };

    const onCancel = () => {
        _map(abortControllersRef, (v) => v.abort());
    };
    
    const cancelTrack = (id: string) => {
        const controller = abortControllersRef[id];
        controller.abort();
    };

    const getResolveDataPromise = (url: string): Promise<any> => {
        if (appOptions.debugMode) {
            return new Promise<any>((resolve) => {
                setTimeout(() => resolve(TracksMock), 1000);
            });
        } else {
            return ytDlpWrap.getVideoInfo(url);
        }
    };

    const resolveData = (url: string) => {
        const promise = getResolveDataPromise(url);
        
        promise.finally(() => _pull(state.queue, "resolve-data"));
        queueRef.current.push("resolve-data");
        
        return promise;
    };
    
    const loadInfo = useCallback(async (url: string) => {        
        try {
            clearMedia();
            actions.setLoading(true);
            const info = await resolveData(url);
            const items: TrackInfo[] = _isArray(info) ? info : [info];
            const albumInfo = getAlbumInfo(items);

            setTracks(items);
            setAlbum(albumInfo);
            actions.setLoading(false);

            return albumInfo;
        } catch {
            actions.setLoading(false);
        }
    }, [setTracks, setAlbum]);

    const mapRange = (x: number, inRange: [number, number], outRange: number[]) => {
        return ((x - inRange[0]) * (outRange[1] - outRange[0])) / (inRange[1] - inRange[0]) + outRange[0];
    };

    const isAlbumTrack = (track: TrackInfo) => {
        return !!track.playlist;
    };

    const setProgressPercentage = useCallback((trackId: string, value?: number) => {
        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === trackId) {
                return {...item, percent: _isNaN(value) ? item.percent : value};
            } else {
                return item;
            }
        }));
    }, [trackStatus, setTrackStatus]);
    
    const updateProgress = useCallback((trackId: string, progress: YtDlpProgress, progressMapRange = [0, 100]) => {
        setProgressPercentage(trackId, mapRange(progress.percent, [0, 100], progressMapRange));
    }, [trackStatus, setTrackStatus]);
    
    const updateProgressStatus = useCallback((trackId: string, eventType: string) => {
        let status = "";

        if (eventType === "youtube") {
            status = t("reading");
            setProgressPercentage(trackId, 5);
        } else if (eventType === "info") {
            status = t("startingDownload");
            setProgressPercentage(trackId, 10);
        } else if (eventType === "download") {
            status = t("downloading");
        } else if (eventType === "ExtractAudio") {
            status = t("extractingAudio");
            setProgressPercentage(trackId, 90);
        } else if (eventType === "Merger") {
            status = t("merging");
            setProgressPercentage(trackId, 85);
        } else if (eventType === "convertingThumbnail") {
            setProgressPercentage(trackId, 90);
        } else if (eventType === "embeddingThumbnail") {
            setProgressPercentage(trackId, 95);
        } else {
            status = "";
        }

        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === trackId) {
                return {...item, status};
            } else {
                return item;
            }
        }));
    }, [trackStatus, setTrackStatus]);

    const isQueueCompleted = () => {
        return _every(queueRef.current, (item) => {
            const status = _find(trackStatusRef.current, ["trackId", item]);
            
            return (!status && !abortControllersRef[item]) || (status && (status.completed || status.error || !abortControllersRef[status.trackId]));
        });
    };

    const onProcessEnd = useCallback((result: {trackId: string, error?: string}) => {
        const controller = abortControllersRef[result.trackId];
        const aborted = controller?.signal.aborted;
        const nextTrackToDownload = _find(queueRef.current, (item) => !_find(trackStatusRef.current, (status) => status.trackId === item));

        const track = _find(tracks, ["id", result.trackId]);
        const outputPath = getOutputFilePath(track, album);
        const totalSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        
        if (result.error && _includes(result.error, "[generic] '' is not a valid URL")) {
            result.error = undefined;
        }

        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === result.trackId) {
                return {
                    ...item,
                    status: aborted ? t("cancelled") : result.error ?? t("done"),
                    error: !!result.error,
                    completed: !result.error,
                    percent: 100,
                    totalSize,
                };
            } else {
                return item;
            }
        }));

        delete abortControllersRef[result.trackId];

        if (isQueueCompleted()) {
            queueRef.current = [];
            actions.setQueue([]);
            setDownloadStart(false);

            return;
        }
        if (aborted || !nextTrackToDownload) {
            setDownloadStart(false);
        } else {
            downloadTrack(nextTrackToDownload);
        }
    }, [tracks, trackStatus, trackStatusRef.current, queueRef.current, appOptions]);

    const downloadAlbum = () => {
        setTrackStatus([]);
        setDownloadStart(false);
        queueRef.current = _map(tracks, "id");

        _times(_min([appOptions.concurrency, _size(tracks)]), (num) => {
            const id = tracks[num].id;
            
            trackStatusRef.current = _map(trackStatusRef.current, (item) => ({...item, percent: 0}));
            setTrackStatus((prev) => _map(prev, (item) => ({...item, percent: 0})));
            
            downloadTrack(id);
        });
    };

    const downloadFailed = () => {
        const failedTracks = _filter(trackStatusRef.current, "error");

        queueRef.current = _map(failedTracks, "trackId");
        setTrackStatus((prev) => _filter(prev, (p) => !p.error));
        trackStatusRef.current = _filter(trackStatusRef.current, (p) => !p.error);

        for (const failed of failedTracks) {
            downloadTrack(failed.trackId);
        }
    };

    const clearMedia = () => {
        clear();
        onCancel();
        actions.setQueue([]);
        setDownloadStart(false);
        setAppOptions((prev) => ({...prev, format: {}}));
    };
    
    const handleClear = () => {
        setAppOptions((prev) => ({...prev, url: ""}));
        clearMedia();
    };

    const getYtDplArguments = (track: TrackInfo, album: AlbumInfo) => {
        if (appOptions.format.type === MediaFormat.Audio) {
            return [
                "--extract-audio",
                "--audio-format", appOptions.format.extension,
                appOptions.format.extension !== "wav" ? "--embed-thumbnail" : "", // wav does not support thumbnail embedding
                "--audio-quality", _toString(appOptions.format.audioQuality),
                ...getCutArgs(track),
                "--postprocessor-args", getPostProcessorArgs(track, album),
                appOptions.alwaysOverwrite ? "--force-alwaysOverwrites" : "",
                "--output", getOutput(track, album)
            ];
        }

        if (appOptions.format.type === MediaFormat.Video) {
            const selected = appOptions.format.videoQuality;
            const [, height] = _map(selected.match(/\d+/g), Number);
            const ext = appOptions.format.extension === "mkv" ? "webm" : appOptions.format.extension;
            
            return [
                "-f", `bv*[height<=${height}][ext=${ext}]+ba[ext=m4a]/b[height<=${height}][ext=${ext}] / bv*+ba/b`,
                ...getCutArgs(track),
                "--embed-thumbnail",
                appOptions.alwaysOverwrite ? "--force-alwaysOverwrites" : "",
                "--postprocessor-args", getPostProcessorArgs(track, album),
                "--output", getOutput(track, album)
            ];
        }
    };

    const getCutsPostProcessorArgs = (track: TrackInfo) => {
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
    
    const getPostProcessorArgs = (track: TrackInfo, album: AlbumInfo) => {
        if (isAlbumTrack(track)) {
            const title = track.title.replace(/"/g, "\\\"");
            const artist = album.artist.replace(/"/g, "\\\"");
            const albumTitle = album.title.replace(/"/g, "\\\"");
            return getCutsPostProcessorArgs(track) + `-metadata title="${title}" -metadata artist="${artist}" -metadata album="${albumTitle}" -metadata track="${track.playlist_autonumber}" -metadata date="${album.releaseYear}" -metadata release_year="${album.releaseYear}"`;
        }

        return getCutsPostProcessorArgs(track) + `-metadata title="${track.title}"`;
    };

    const getCutArgs = (track: TrackInfo): string[] => {
        const cuts = trackCuts[track.id];
        
        if (_isEmpty(cuts)) {
            return [];
        } else {
            return ["--download-sections", `*${moment.duration(cuts[0], "seconds").format("HH:mm:ss")}-${moment.duration(cuts[1], "seconds").format("HH:mm:ss")}`, "-S", "proto:https"];
        }
    };

    const getOutput = (track: TrackInfo, album: AlbumInfo) => {
        return getOutputFile(track, album) + ".%(ext)s";
    };

    const getOutputFilePath = (track: TrackInfo, album: AlbumInfo) => {
        return getOutputFile(track, album) + "." + appOptions.format.extension;
    };

    const getOutputFile = (track: TrackInfo, album: AlbumInfo) => {
        const interpolate = /{{([\s\S]+?)}}/g;
        const data = {
            albumTitle: album.title,
            artist: album.artist,
            trackTitle: track.title,
            trackNo: track.playlist_autonumber,
            releaseYear: album.releaseYear
        };

        if (appOptions.format.type === MediaFormat.Audio) {
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

        if (appOptions.format.type === MediaFormat.Video) {
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

    const downloadTrack = (trackId: string) => {
        const track = _find(tracks, ["id", trackId]);
        const controller = new AbortController();
        const newTrackProgressInfo = {
            trackId: track.id,
            percent: 0,
            totalSize: track.filesize_approx,
            path: path.resolve(getOutputFilePath(track, album)),
        };

        setTrackStatus((prev) => [...prev, newTrackProgressInfo]);

        if (!_includes(queueRef.current, trackId)) {
            queueRef.current.push(trackId);
        }
        
        abortControllersRef[trackId] = controller;

        const proc = ytDlpWrap.exec([track.original_url, ...getYtDplArguments(track, album)], {shell: false, windowsHide: false, detached: false}, controller.signal)
            .on("progress", (progress) => updateProgress(track.id, progress, appOptions.format.type === MediaFormat.Audio ? [10, 90] : [10, 85]))
            .on("ytDlpEvent", (eventType) => updateProgressStatus(track.id, eventType))
            .on("error", (error) => onProcessEnd({trackId: track.id, error: error.message}))
            .on("close", () => {
                onProcessEnd({trackId: track.id});
            });
    
        console.log(proc.ytDlpProcess.pid);
    };

    const getAlbumInfo = (items: TrackInfo[]): AlbumInfo => {
        const item = _first(items);

        return {
            artist: _get(item, "creators.0", _get(item, "artist", item.channel)),
            title: isAlbumTrack(item) ? _get(item, "album", _get(item, "playlist_title", _get(item, "playlist"))) : item.title,
            releaseYear: _get(item, "release_year") ?? (new Date(item.timestamp * 1000)).getFullYear(),
            tracksNumber: _get(item, "playlist_count", 1),
            duration: _sumBy(items, "duration"),
            thumbnail: _get(item, "thumbnail", _get(_find(item.thumbnails, ["id", "2"]), "url")),
        };
    };

    const getTotalProgress = () => {
        const total = _size(queueRef.current) * 100;
        const progress = _reduce(queueRef.current, (prev: number, curr: string) => {
            const trackStatus = _find(trackStatusRef.current, ["trackId", curr]);
    
            return trackStatus ? prev + trackStatus.percent : prev;
        }, 0);

        return progress / total * 100;
    };

    return (
        <Box className={Styles.home}>
            <div className={Styles.header}>
                <InputPanel value={appOptions.url} onChange={handleUrlChange} loading={state.loading || !_isEmpty(queueRef.current)} onDownload={download} onDownloadFailed={downloadFailed} onLoadInfo={loadInfo} onClear={handleClear} />
                {!_isEmpty(tracks) && <FormatSelector value={appOptions.format} onSelected={onFormatSelected} />}
            </div>
            <Grid className={Styles.content} container spacing={2} padding={2}>
                {state.loading && <CircularProgress color="primary" thickness={5} size={80} />}
                {!state.loading && tracks && album &&
                    <>
                        {error && <Alert className={Styles.error} severity="error">{t("missingMediaInfoError")}</Alert>}
                        <MediaInfoPanel loading={!_isEmpty(queueRef.current)} progress={getTotalProgress()} onCancel={onCancel} onOpenOutput={onOpenDirectory} />
                        <TrackList queue={queueRef.current} onDownloadTrack={downloadTrack} onCancelTrack={cancelTrack} onOpenFile={onOpenFile}/>
                    </>
                }
            </Grid>
        </Box>
    );
};

export default HomeView;

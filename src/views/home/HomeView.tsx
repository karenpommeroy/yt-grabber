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
import _last from "lodash/last";
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
import _uniq from "lodash/uniq";
import _uniqBy from "lodash/uniqBy";
import _values from "lodash/values";
import moment from "moment";
import path from "path";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";
import YTDlpWrap, {Progress as YtDlpProgress} from "yt-dlp-wrap";

import {Alert, Box, CircularProgress} from "@mui/material";
import Grid from "@mui/material/Grid2";

import StoreSchema, {ApplicationOptions} from "../../common/Store";
import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
import NumberField from "../../components/numberField/NumberField";
import FormatSelector, {Format} from "../../components/youtube/formatSelector/FormatSelector";
import InputPanel from "../../components/youtube/inputPanel/InputPanel";
import MediaInfoPanel from "../../components/youtube/mediaInfoPanel/MediaInfoPanel";
import TrackList from "../../components/youtube/trackList/TrackList";
import {MediaFormat} from "../../enums/MediaFormat";
import {useAppContext} from "../../react/contexts/AppContext";
import {useDataState} from "../../react/contexts/DataContext";
// import CompleteTracksMock from "../../tests/CompleteTracksMock";
import MissingDetailsTracksMock from "../../tests/MissingDetailsTracksMock";
import Styles from "./HomeView.styl";

const isDev = process.env.NODE_ENV === "development";
const binPath = _replace(!isDev ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "resources", "bin"), /\\/g, "/");
const ytDlpWrap = new YTDlpWrap(binPath + "/yt-dlp.exe");

const abortControllersRef: {[key: string]: AbortController} = {};

export const HomeView: React.FC = () => {
    const [appOptions, setAppOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const {t} = useTranslation();
    const {album, tracks, trackStatus, trackCuts, setAlbum, setTracks, setTrackStatus, setTrackCuts, clear} = useDataState();
    const {state, actions} = useAppContext();
    const [error, setError] = useState(false);
    const [format, setFormat] = useState<Format>();
    const [downloadStart, setDownloadStart] = useState(false);
    const trackStatusRef = useRef<TrackStatusInfo[]>(trackStatus);
    const queueRef = useRef<string[]>(state.queue);
    const formatRef = useRef<Format>(null);
    const [debouncedAppOptions] = useDebounceValue(appOptions, 500, {leading: true});

    const onFormatSelected = (value: Format) => {
        setFormat((prev) => Object.assign((prev || {}), value));
    };

    useEffect(() => {
        formatRef.current = format;
    }, [format]);

    useEffect(() => {
        global.store.set("application", debouncedAppOptions);
    }, [debouncedAppOptions]);

    useEffect(() => {
        if (!downloadStart || !formatRef.current) return;
  
        downloadAlbum();
    }, [formatRef.current, format, downloadStart]);

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

    const handleUrlChange = (url: string) => {       
        setAppOptions((prev) => ({...prev, url}));
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
                setTimeout(() => resolve(MissingDetailsTracksMock), 1000);
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

        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === result.trackId) {
                return {
                    ...item,
                    status: aborted ? t("cancelled") : result.error ?? t("done"),
                    error: !!result.error,
                    completed: !result.error,
                    percent: 100,
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
    }, [tracks, trackStatus, trackStatusRef.current, queueRef.current]);

    const downloadAlbum = () => {
        setTrackStatus([]);
        setDownloadStart(false)
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
        for (const failed of failedTracks) {
            setTrackStatus((prev) => _filter(prev, (p) => p.trackId !== failed.trackId));
            trackStatusRef.current = _filter(trackStatusRef.current, (p) => p.trackId !== failed.trackId);
        }

        for (const failed of failedTracks) {
            downloadTrack(failed.trackId);
        }
    };

    const clearMedia = () => {
        clear();
        onCancel();
        actions.setQueue([]);
        setDownloadStart(false);
    };
    
    const handleClear = () => {
        setAppOptions((prev) => ({...prev, url: ""}));
        clearMedia();
    };

    const getYtDplArguments = (track: TrackInfo, album: AlbumInfo) => {
        if (formatRef.current.type === MediaFormat.Audio) {
            return [
                "--extract-audio",
                "--audio-format", formatRef.current.extension,
                formatRef.current.extension !== "wav" ? "--embed-thumbnail" : "", // wav does not support thumbnail embedding
                "--audio-quality", _toString(formatRef.current.audioQuality),
                ...getCutArgs(track),
                "--postprocessor-args", getPostProcessorArgs(track, album),
                appOptions.overwrite ? "--force-overwrites" : "",
                "--output", getOutput(track, album)
            ];
        }

        if (formatRef.current.type === MediaFormat.Video) {
            const selected = formatRef.current.video;

            return [
                "-f", `bv*[height<=${selected.height}][ext=${formatRef.current.extension}]+ba[ext=m4a]/b[height<=${selected.height}][ext=${formatRef.current.extension}] / bv*+ba/b`,
                ...getCutArgs(track),
                "--embed-thumbnail",
                appOptions.overwrite ? "--force-overwrites" : "",
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
            const start = moment.duration(cuts.from);
            const end = moment.duration(cuts.to);
            const length = end.subtract(start);

            const t = length.format("H:m:s");
           
            return `-ss 0:0:0 -to ${t} `;
        }
    }
    
    const getPostProcessorArgs = (track: TrackInfo, album: AlbumInfo) => {
        if (track.playlist) {
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
            return ["--download-sections", `*${cuts.from}-${cuts.to}`, "-S", "proto:https"]
        }
    };

    const getOutput = (track: TrackInfo, album: AlbumInfo) => {
        const interpolate = /{{([\s\S]+?)}}/g;
        const data = {
            albumTitle: album.title,
            artist: album.artist,
            trackTitle: track.title,
            trackNo: track.playlist_autonumber,
            releaseYear: album.releaseYear
        };

        if (formatRef.current.type === MediaFormat.Audio) {
            if (!track.playlist) {
                try {
                    const compiled = _template(appOptions.trackOutputTemplate, {interpolate});
                    
                    return `./${appOptions.outputDirectory}/${compiled(data)}`;
                } catch {
                    const defaultTrackOutputTemplate = _get(StoreSchema.application, "properties.trackOutputTemplate.default");
                    const compiled = _template(defaultTrackOutputTemplate, {interpolate});

                    return `./${appOptions.outputDirectory}/${compiled(data)}`;
                }
            } else {
                try {
                    const compiled = _template(appOptions.albumOutputTemplate, {interpolate});
                    
                    return `./${appOptions.outputDirectory}/${compiled(data)}`;
                } catch {
                    const defaultAlbumOutputTemplate = _get(StoreSchema.application, "properties.albumOutputTemplate.default");
                    const compiled = _template(defaultAlbumOutputTemplate, {interpolate});

                    return `./${appOptions.outputDirectory}/${compiled(data)}`;
                }
            }
        }

        if (formatRef.current.type === MediaFormat.Video) {
            if (!track.playlist) {
                try {
                    const compiled = _template(appOptions.videoOutputTemplate, {interpolate});

                    return `./${appOptions.outputDirectory}/${compiled(data)}`;
                } catch {
                    const defaultVideoOutputTemplate = _get(StoreSchema.application, "properties.videoOutputTemplate.default");
                    const compiled = _template(defaultVideoOutputTemplate, {interpolate});
                
                    return `./${appOptions.outputDirectory}/${compiled(data)}`;
                }
            } else {
                try {
                    const compiled = _template(appOptions.playlistOutputTemplate, {interpolate});

                    return `./${appOptions.outputDirectory}/${compiled(data)}`;
                } catch {
                    const defaultPlaylistOutputTemplate = _get(StoreSchema.application, "properties.playlistOutputTemplate.default");
                    const compiled = _template(defaultPlaylistOutputTemplate, {interpolate});
                
                    return `./${appOptions.outputDirectory}/${compiled(data)}`;
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
        };

        setTrackStatus((prev) => [...prev, newTrackProgressInfo]);

        if (!_includes(queueRef.current, trackId)) {
            queueRef.current.push(trackId);
        }
        
        abortControllersRef[trackId] = controller;

        const proc = ytDlpWrap.exec([track.original_url, ...getYtDplArguments(track, album)], {shell: false, windowsHide: false, detached: false}, controller.signal)
            .on("progress", (progress) => updateProgress(track.id, progress, formatRef.current.type === MediaFormat.Audio ? [10, 90] : [10, 85]))
            .on("ytDlpEvent", (eventType) => updateProgressStatus(track.id, eventType))
            .on("error", (error) => onProcessEnd({trackId: track.id, error: error.message}))
            .on("close", () => {
                onProcessEnd({trackId: track.id});
                
                const outputPath = getOutput(track, album) + "." + formatRef.current.extension;
                
                if (!fs.existsSync(outputPath)) {
                    return;
                };

                const stats = fs.statSync(outputPath);
                
                
                setTrackStatus((prev) => _map(prev, (item) => {
                    if (item.trackId === track.id) {
                        return {...item, totalSize: stats.size };
                    } else {
                        return item;
                    }
                }));
                
                console.log(stats.size);
            });
    
        console.log(proc.ytDlpProcess.pid);
    };

    const getAlbumInfo = (items: TrackInfo[]): AlbumInfo => {
        const item = _first(items);

        return {
            artist: _get(item, "creators.0", _get(item, "artist", item.channel)),
            title: _get(item, "album", item.title),
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
                {/* {appOptions.format !== "custom" && <Typography className={Styles.formatInfo} component="div" variant="caption" gutterBottom>{appOptions.format === "best" ? t("usingBestAvailableFormat") : t(t("usingBestAudioFormat"))}</Typography>} */}
                {!_isEmpty(tracks) && <FormatSelector onSelected={onFormatSelected} />}
            </div>
            <Grid className={Styles.content} container spacing={2} padding={2}>
                {state.loading && <CircularProgress color="primary" thickness={5} size={80} />}
                {!state.loading && tracks && album &&
                    <>
                        {error && <Alert className={Styles.error} severity="error">{t("missingMediaInfoError")}</Alert>}
                        <MediaInfoPanel loading={!_isEmpty(queueRef.current)} progress={getTotalProgress()} onCancel={onCancel} />
                        <TrackList queue={queueRef.current} onDownloadTrack={downloadTrack} onCancelTrack={cancelTrack}/>
                    </>
                }
            </Grid>
        </Box>
    );
};

export default HomeView;

import fs from "fs-extra";
import _difference from "lodash/difference";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _first from "lodash/first";
import _flatten from "lodash/flatten";
import _forEach from "lodash/forEach";
import _get from "lodash/get";
import _groupBy from "lodash/groupBy";
import _includes from "lodash/includes";
import _isArray from "lodash/isArray";
import _isEmpty from "lodash/isEmpty";
import _isNaN from "lodash/isNaN";
import _isNil from "lodash/isNil";
import _map from "lodash/map";
import _min from "lodash/min";
import _pull from "lodash/pull";
import _replace from "lodash/replace";
import _size from "lodash/size";
import _some from "lodash/some";
import _times from "lodash/times";
import path from "path";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";
import YTDlpWrap, {Progress as YtDlpProgress} from "yt-dlp-wrap";

import {Alert, Box, Typography} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {getAlbumInfo} from "../../common/Formatters";
import {mapRange} from "../../common/Helpers";
import {MediaFormat} from "../../common/Media";
import {ApplicationOptions} from "../../common/Store";
import {PlaylistInfo, TrackInfo, TrackStatusInfo, YoutubeInfoResult} from "../../common/Youtube";
import useYtdplUtils from "../../common/YtdplUtils";
import Progress from "../../components/progress/Progress";
import FormatSelector from "../../components/youtube/formatSelector/FormatSelector";
import InputPanel from "../../components/youtube/inputPanel/InputPanel";
import PlaylistTabs from "../../components/youtube/playlistTabs/PlaylistTabs";
import {useAppContext} from "../../react/contexts/AppContext";
import {useDataState} from "../../react/contexts/DataContext";
import TracksMock from "../../tests/MultipleDifferentMock";
import Styles from "./HomeView.styl";

const isDev = process.env.NODE_ENV === "development";
const binPath = _replace(!isDev ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "resources", "bin"), /\\/g, "/");
const ytDlpWrap = new YTDlpWrap(binPath + "/yt-dlp.exe");
const abortControllers: {[key: string]: AbortController} = {};

export const HomeView: React.FC = () => {
    const [appOptions, setAppOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const {playlists, tracks, trackStatus, trackCuts, format, urls, setPlaylists, setTracks, setTrackStatus, clear} = useDataState();
    const {state, actions} = useAppContext();
    const [error, setError] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [downloadStart, setDownloadStart] = useState(false);
    const [abort, setAbort] = useState<string>();
    const trackStatusRef = useRef<TrackStatusInfo[]>(trackStatus);
    const queueRef = useRef<string[]>(state.queue);
    const abortRef = useRef<string>(abort);
    const [debouncedAppOptions] = useDebounceValue(appOptions, 500, {leading: true});
    const {getYtdplRequestParams, getOutputFilePath} = useYtdplUtils();
    const {t} = useTranslation();

    useEffect(() => {
        global.store.set("application", debouncedAppOptions);
    }, [debouncedAppOptions]);

    useEffect(() => {
        if (!downloadStart || !format) return;
  
        downloadAll();
    }, [format, downloadStart]);

    useEffect(() => {
        trackStatusRef.current = trackStatus;
    }, [trackStatus]);

    useEffect(() => {
        abortRef.current = abort;
    }, [abort]);

    const handleUrlChange = (urls: string[]) => {       
        setAppOptions((prev) => ({...prev, urls, url: _first(urls)}));
    };

    // const handleFormatChange = (value: Format) => {
    //     setAppOptions((prev) => ({...prev, format: value}));
    // };

    const loadInfo = useCallback(async (urls: string[]) => {        
        try {
            clearMedia();
            actions.setLoading(true);

            const result = await resolveData(urls);
            const playlists: PlaylistInfo[] = [];
            const failures: YoutubeInfoResult[] = [];
                
            _forEach(result, (item) => {
                if (item.error) {
                    failures.push(item);
                } else {
                    playlists.push({url: item.url, album: getAlbumInfo(item.value, item.url), tracks: item.value});
                }
            }); 

            const tracks = _flatten(_map(playlists, "tracks"));

            setTracks(tracks);
            setPlaylists(playlists);
            actions.setLoading(false);

            return playlists;
        } catch {
            actions.setLoading(false);
        }
    }, [setTracks, appOptions]);

    const download = async (urls: string[]) => {
        const albums = _map(playlists, "album");
        const albumUrls = _map(albums, "url");

        if (_isEmpty(playlists) || !_difference(albumUrls, urls)) {
            const infos = await loadInfo(urls);
            
            if (_isEmpty(infos)) {
                setError(true);
            } else {
                setDownloadStart(true);
            }
        } else if (_some(albums, (album) =>_some(album, v => _isNil(v)))) {
            setError(true);
        } else {
            setError(false);
            setDownloadStart(true);
        }
    };

    const downloadAll = () => {
        setTrackStatus([]);
        trackStatusRef.current = [];
        setDownloadStart(false);
        queueRef.current = _map(tracks, "id");

        _times(_min([appOptions.concurrency, _size(tracks)]), (num) => {
            const id = tracks[num].id;
            
            trackStatusRef.current = _map(trackStatusRef.current, (item) => ({...item, percent: 0}));
            setTrackStatus((prev) => _map(prev, (item) => ({...item, percent: 0})));
            
            downloadTrack(id);
        });
    };

    const downloadAlbum = (id: string) => {
        const playlist = _find(playlists, ["album.id", id]);
        const playlistTracks = _get(playlist, "tracks");
        
        setTrackStatus([]);
        trackStatusRef.current = [];
        setDownloadStart(false);
        queueRef.current = _map(playlistTracks, "id");

        _times(_min([appOptions.concurrency, _size(playlistTracks)]), (num) => {
            const id = playlistTracks[num].id;
            
            trackStatusRef.current = _map(trackStatusRef.current, (item) => ({...item, percent: 0}));
            setTrackStatus((prev) => _map(prev, (item) => ({...item, percent: 0})));
            
            downloadTrack(id);
        });
    };

    const downloadTrack = (trackId: string) => {
        const track = _find(tracks, ["id", trackId]);
        const controller = new AbortController();
        const album = getTrackAlbum(trackId);
        const trackPath = path.resolve(getOutputFilePath(track, album, format));
        const newTrackProgressInfo: TrackStatusInfo = {
            trackId: track.id,
            percent: 0,
            totalSize: track.filesize_approx,
            path: trackPath,
        };

        setTrackStatus((prev) => [...prev, newTrackProgressInfo]);
        trackStatusRef.current = [...trackStatusRef.current, newTrackProgressInfo];
        
        if (!_includes(queueRef.current, trackId)) {
            queueRef.current.push(trackId);
        }

        abortControllers[trackId] = controller;
        new Promise<boolean>((resolve) => {
            if (!appOptions.alwaysOverwrite && fs.existsSync(trackPath)) {
                resolve(true);
            }

            resolve(false);
        }).then((result) => {
            if (result) {
                onProcessEnd({trackId});
            } else {
                const proc = ytDlpWrap.exec([track.original_url, ...getYtdplRequestParams(track, album, trackCuts, format)], {shell: false, windowsHide: false, detached: false}, controller.signal)
                    .on("progress", (progress) => updateProgress(track.id, progress, appOptions.format.type === MediaFormat.Audio ? [10, 90] : [10, 85]))
                    .on("ytDlpEvent", (eventType) => updateProgressStatus(track.id, eventType))
                    .on("error", (error) => onProcessEnd({trackId: track.id, error: error.message}))
                    .on("close", () => onProcessEnd({trackId: track.id}));
    
                console.log(proc.ytDlpProcess.pid);

                // proc.ytDlpProcess.stdout.on("data", (data) => {
                //     console.log(data.toString());
                // });
            }
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

    const cancelAll = () => {       
        setAbort("all");
        _map(abortControllers, (v) => v.abort());
    };
    
    const cancelPlaylist = (id: string) => {       
        const playlist = _find(playlists, ["album.id", id]);
        const playlistTrackIds = _map(_get(playlist, "tracks"), "id");
        
        setAbort(id);
        queueRef.current = _filter(queueRef.current, (item) => !_includes(playlistTrackIds, item));
        actions.setQueue(_filter(state.queue, (item) => !_includes(playlistTrackIds, item)));
        _map(playlistTrackIds, (trackId) => abortControllers[trackId]?.abort());
    };

    const cancelTrack = (id: string) => {       
        setAbort(id);
        queueRef.current = _filter(queueRef.current, (item) => item !== id);
        actions.setQueue(_filter(state.queue, (item) => item !== id));
        abortControllers[id]?.abort();
    };

    const clearMedia = () => {
        clear();
        setLoadingProgress(0);
        actions.setQueue([]);
        setDownloadStart(false);
        setAppOptions((prev) => ({...prev, format: {}}));
    };
    
    const getResolveDataPromise = (urls: string[]) => {
        if (appOptions.debugMode) {
            return new Promise<YoutubeInfoResult[]>((resolve) => {
                setTimeout(() => resolve(
                    _map(
                        _groupBy(TracksMock as TrackInfo[], (item) => item.playlist_id ?? item.id),
                        (v, k) => ({url: k, value: v})
                    )
                ), 1000);
            });
        } else {
            return Promise.all<YoutubeInfoResult>(_map(urls, (url) => new Promise((resolve) => {
                ytDlpWrap.getVideoInfo(url)
                    .then((result) => {
                        setLoadingProgress((prev) => prev + 1);
                        resolve({url, value: _isArray(result) ? result : [result]});
                    })
                    .catch((e) => {
                        const authErrRegex = /ERROR: \[youtube\].*Sign in to confirm your age/gm;
                        setLoadingProgress((prev) => prev + 1);

                        if (authErrRegex.test(e.message)) {
                            return resolve({url, error: "Age restriction detected. Sign in required."}); 
                        }
                        
                        resolve({url, error: e.message}); 
                    });
            })));
        }
    };

    const resolveData = (urls: string[]) => {
        const promise = getResolveDataPromise(urls);

        promise.finally(() => {
            _pull(queueRef.current, "resolve-data");
            _pull(state.queue, "resolve-data");
        });
        queueRef.current.push("resolve-data");
        
        return promise;
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

    const onProcessEnd = useCallback((result: {trackId: string, error?: string}) => {
        const controller = abortControllers[result.trackId];
        const aborted = controller?.signal.aborted;
        const nextTrackToDownload = _find(queueRef.current, (item) => !_find(trackStatusRef.current, (status) => status.trackId === item));
        const track = _find(tracks, ["id", result.trackId]);
        const album = getTrackAlbum(track.id);
        const outputPath = getOutputFilePath(track, album, format);
        const dirPath = path.dirname(outputPath);
        const parsedPath = path.parse(outputPath);
        const totalSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        
        if (result.error && _includes(result.error, "[generic] '' is not a valid URL")) {
            result.error = undefined;
        }

        if (aborted) {
            const files = fs.existsSync(dirPath) ? fs.readdirSync(dirPath, {recursive: false, withFileTypes: true}) : [];
            
            for (const file of files) {
                if (file.name.startsWith(parsedPath.name) && file.isFile()) {
                    fs.removeSync(path.join(file.parentPath, file.name));
                }
            }
        }

        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === result.trackId) {
                return {
                    ...item,
                    status: aborted ? t("cancelled") : result.error ?? t("done"),
                    error: !!result.error || aborted,
                    completed: !result.error && !aborted,
                    percent: 100,
                    totalSize,
                };
            } else {
                return item;
            }
        }));
        
        const trackStatus = _find(trackStatusRef.current, ["trackId", result.trackId]);
        trackStatus.completed = !result.error && !aborted;
        trackStatus.percent = 100;
        trackStatus.totalSize = totalSize;
        trackStatus.status = aborted ? t("cancelled") : result.error ?? t("done");
        trackStatus.error = !!result.error || aborted;

        delete abortControllers[result.trackId];
        queueRef.current = _filter(queueRef.current, (item) => item !== result.trackId);
        actions.setQueue(_filter(state.queue, (item) => item !== result.trackId));

        if (abortRef.current === "all" || queueRef.current.length === 0) {
            queueRef.current = [];
            actions.setQueue([]);
            setDownloadStart(false);
            setAbort(undefined);

            return;
        }

        if (!nextTrackToDownload) {
            setDownloadStart(false);
        } else {
            downloadTrack(nextTrackToDownload);
        }
    }, [abort, abortRef, tracks, trackStatus, trackStatusRef.current, queueRef.current, appOptions]);

    const getTrackAlbum = useCallback((trackId: string) => {
        return _get(_find(playlists, (item) => !!_find(item.tracks, ["id", trackId])), "album");
    }, [playlists]);

    return (
        <Box className={Styles.home}>
            <div className={Styles.header}>
                <InputPanel
                    mode="multi"
                    onChange={handleUrlChange}
                    loading={state.loading || !_isEmpty(queueRef.current)}
                    onDownload={download}
                    onCancel={cancelAll}
                    onDownloadFailed={downloadFailed}
                    onLoadInfo={loadInfo}
                />
                {!_isEmpty(playlists) && !_isEmpty(tracks) && <FormatSelector value={format} />} 
                {/* onSelected={handleFormatChange}  */}
            </div>
            <Grid className={Styles.content} container spacing={2} padding={2}>
                {state.loading && <Progress className={Styles.loader} color="primary" labelScale={1.8} thickness={5} size={80} variant="indeterminate" value={loadingProgress} renderLabel={(v) => <Typography color="primary">{`${v}/${_size(urls)}`}</Typography>} />}
                {!_isEmpty(playlists) && !_isEmpty(tracks) &&
                    <>
                        {error && <Alert className={Styles.error} severity="error">{t("missingMediaInfoError")}</Alert>}
                        <PlaylistTabs
                            // items={playlists}
                            queue={queueRef.current}
                            onDownloadTrack={downloadTrack}
                            onDownloadPlaylist={downloadAlbum}
                            onCancelPlaylist={cancelPlaylist}
                            onCancelTrack={cancelTrack}
                        />
                    </>
                }
            </Grid>
        </Box>
    );
};

export default HomeView;

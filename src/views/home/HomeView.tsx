import {exec} from "child_process";
import {ipcRenderer, IpcRendererEvent} from "electron";
import fs from "fs-extra";
import _difference from "lodash/difference";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _forEach from "lodash/forEach";
import _get from "lodash/get";
import _groupBy from "lodash/groupBy";
import _includes from "lodash/includes";
import _isArray from "lodash/isArray";
import _isEmpty from "lodash/isEmpty";
import _isNaN from "lodash/isNaN";
import _isNil from "lodash/isNil";
import _join from "lodash/join";
import _map from "lodash/map";
import _min from "lodash/min";
import _size from "lodash/size";
import _some from "lodash/some";
import _split from "lodash/split";
import _times from "lodash/times";
import _trim from "lodash/trim";
import _uniq from "lodash/uniq";
import path from "path";
import {LaunchOptions} from "puppeteer";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {useDebounceValue} from "usehooks-ts";
import YTDlpWrap, {Progress as YtDlpProgress} from "yt-dlp-wrap";

import {Alert, Box, Grid} from "@mui/material";

import {getBinPath} from "../../common/FileSystem";
import {getAlbumInfo} from "../../common/Formatters";
import {getUrlType, mapRange, resolveMockData} from "../../common/Helpers";
import {Format, FormatScope, InputMode, MediaFormat} from "../../common/Media";
import {GetYoutubeUrlResult} from "../../common/Messaging";
import {afterEach} from "../../common/Promise";
import {ProgressInfo} from "../../common/Reporter";
import {ApplicationOptions} from "../../common/Store";
import {
    AlbumInfo, PlaylistInfo, TrackInfo, TrackStatusInfo, UrlType, YoutubeInfoResult
} from "../../common/Youtube";
import {
    getOutputFile, getOutputFileParts, getOutputFilePath, getYtdplRequestParams
} from "../../common/YtdplUtils";
import FormatSelector from "../../components/youtube/formatSelector/FormatSelector";
import InfoBar from "../../components/youtube/infoBar/InfoBar";
import InputPanel from "../../components/youtube/inputPanel/InputPanel";
import PlaylistTabs from "../../components/youtube/playlistTabs/PlaylistTabs";
import {useAppContext} from "../../react/contexts/AppContext";
import {useDataState} from "../../react/contexts/DataContext";
import Styles from "./HomeView.styl";

const ytDlpWrap = new YTDlpWrap(getBinPath() + "/yt-dlp.exe");
const abortControllers: {[key: string]: AbortController} = {};

export const HomeView: React.FC = () => {
    const [appOptions, setAppOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const {
        operation,
        playlists,
        tracks,
        trackStatus,
        trackCuts,
        formats,
        autoDownload,
        queue,
        setOperation,
        setPlaylists,
        setTracks,
        setTrackStatus,
        setAutoDownload,
        setQueue,
        setErrors,
        setWarnings,
        clear
    } = useDataState();
    const {state, actions} = useAppContext();
    const [error, setError] = useState(false);
    const [abort, setAbort] = useState<string>();
    const [pendingTabs, setPendingTabs] = useState<string[]>([]);
    const [debouncedAppOptions] = useDebounceValue(appOptions, 500, {leading: true});
    const {t, i18n} = useTranslation();

    const trackStatusRef = useRef<TrackStatusInfo[]>(trackStatus);
    const abortRef = useRef<string>(abort);
    
    useEffect(() => {
        global.store.set("application", debouncedAppOptions);
    }, [debouncedAppOptions]);

    useEffect(() => {
        if (!autoDownload || _isEmpty(formats) || _isEmpty(tracks) || _isEmpty(playlists) || state.loading) return;
  
        downloadAll();
    }, [formats, autoDownload, tracks, playlists, state.loading]);

    useEffect(() => {
        trackStatusRef.current = trackStatus;
    }, [trackStatus]);

    useEffect(() => {
        if (_isEmpty(queue)) return;

        if (operation === "download") {
            setOperation(undefined);
            const unallocated = _filter(queue, (item) => {
                const found = _find(trackStatusRef.current, ["trackId", item]);
                return !found;
            });
            const currentlyRunning = _size(_filter(abortControllers, (a) => !a.signal.aborted));

            if (currentlyRunning >= appOptions.concurrency) {
                return;
            }

            _times(_min([appOptions.concurrency - currentlyRunning, _size(unallocated)]), (num) => {                
                downloadTrack(unallocated[num]);
            });
        }
    }, [operation]);

    useEffect(() => {
        abortRef.current = abort;
    }, [abort]);

    useEffect(() => {
        actions.setLoading(queue.length > 0);
    }, [queue]);


    useEffect(() => {
        ipcRenderer.on("get-youtube-urls-progress", onGetYoutubeUrlsCompleted);
        ipcRenderer.on("get-youtube-artists-progress", onGetYoutubeArtistsCompleted);
        ipcRenderer.on("get-youtube-albums-progress", onGetYoutubeAlbumsCompleted);
        ipcRenderer.on("get-youtube-songs-progress", onGetYoutubeSongsCompleted);

        ipcRenderer.on("get-youtube-urls-cancelled", onGetYoutubeCancelled);
        ipcRenderer.on("get-youtube-artists-cancelled", onGetYoutubeCancelled);
        ipcRenderer.on("get-youtube-albums-cancelled", onGetYoutubeCancelled);
        ipcRenderer.on("get-youtube-songs-cancelled", onGetYoutubeCancelled);

        return () => {
            ipcRenderer.off("get-youtube-urls-progress", onGetYoutubeUrlsCompleted);
            ipcRenderer.off("get-youtube-artists-progress", onGetYoutubeArtistsCompleted);
            ipcRenderer.off("get-youtube-albums-progress", onGetYoutubeAlbumsCompleted);
            ipcRenderer.off("get-youtube-songs-progress", onGetYoutubeSongsCompleted);
            
            ipcRenderer.off("get-youtube-artists-cancelled", onGetYoutubeCancelled);
            ipcRenderer.off("get-youtube-albums-cancelled", onGetYoutubeCancelled);
            ipcRenderer.off("get-youtube-songs-cancelled", onGetYoutubeCancelled);
        };
    }, []);

    const onGetYoutubeUrlsCompleted = (event: IpcRendererEvent, data: ProgressInfo<GetYoutubeUrlResult>) => {
        if (!data.result) return;

        setPendingTabs((prev) => [...prev, ...data.result.urls]);
        
        try {
            const promise = Promise.all(afterEach(getResolveDataPromise(data.result.urls), update))
                .then((result) => {
                    setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
                    
                    return result;
                });

            return promise;
        } catch {
            setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
        }
    };
    
    const onGetYoutubeArtistsCompleted = (event: IpcRendererEvent, data: ProgressInfo<GetYoutubeUrlResult>) => {
        if (!data.result) return;

        setPendingTabs(data.result.urls);
        
        try {
            const promise = Promise.all(afterEach(getResolveDataPromise(data.result.urls), update))
                .then((result) => {
                    setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
                    
                    return result;
                });

            return promise;
        } catch {
            setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
        }
    };

    const onGetYoutubeAlbumsCompleted = (event: IpcRendererEvent, data: ProgressInfo<GetYoutubeUrlResult>) => {
        if (!data.result) return;

        setPendingTabs(data.result.urls);
        
        try {
            const promise = Promise.all(afterEach(getResolveDataPromise(data.result.urls), update))
                .then((result) => {
                    setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
                    
                    return result;
                });

            return promise;
        } catch {
            setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
        }
    };
    
    const onGetYoutubeSongsCompleted = (event: IpcRendererEvent, data: ProgressInfo<GetYoutubeUrlResult>) => {
        if (!data.result) return;

        setPendingTabs(data.result.urls);
        
        try {
            const promise = Promise.all(afterEach(getResolveDataPromise(data.result.urls), update))
                .then((result) => {
                    setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
                    
                    return result;
                });

            return promise;
        } catch {
            setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
        }
    };

    const onGetYoutubeCancelled = () => {
        setPendingTabs([]);
        setQueue((prev) => _filter(prev, (p) => p !== "load-multi"));
    };

    const mergeOutputFiles = (filename: string, extension: string, callback: (error: Error, result: string) => void) => {
        const getCommand = (ext: string) => {
            if (ext === "m4a") {
                return `"${getBinPath()}/ffmpeg.exe" -f concat -safe 0 -i "./output/${filename}.txt" -i "./output/${filename} 001.${extension}" -map 0:a -map 1:v -c:a copy -c:v copy -disposition:v:0 attached_pic -map_metadata 1 "./output/${filename}.${extension}"`;
            } else if (ext === "mp3" || ext === "flac") {
                return `"${getBinPath()}/ffmpeg.exe" -f concat -safe 0 -i "./output/${filename}.txt" -i "./output/${filename} 001.${extension}" -map 0 -map 1:v -c copy -map_metadata 0 -disposition:v:1 attached_pic "./output/${filename}.${extension}"`;
            }

            return `"${getBinPath()}/ffmpeg.exe" -f concat -safe 0 -i "./output/${filename}.txt" -c copy "./output/${filename}.${extension}"`;
        };
        
        exec(getCommand(extension), callback); 
    };

    const handleUrlChange = (urls: string[]) => {
        setAppOptions((prev) => ({...prev, urls}));
    };

    const update = (item: YoutubeInfoResult) => {
        if (!_isEmpty(item.warnings)) {
            setWarnings((prev) => [...prev, {url: item.url, message: _join(item.warnings, "\n")}]);
        }

        if (!_isEmpty(item.errors)) {
            setErrors((prev) => [...prev, {url: item.url, message: _join(item.errors, "\n")}]);
        }

        if (item.value) {
            setTracks((prev) => [...prev, ...item.value]);
            setPlaylists((prev) => [...prev, {url: item.url, album: getAlbumInfo(item.value, item.url), tracks: item.value}]);
        }
    };

    const loadInfo = (urls: string[]) => {        
        clear();
        setPendingTabs(urls);
        const enableInputMode = global.store.get("application.enableInputMode");
        const inputMode = global.store.get("application.inputMode");
        const groups = _groupBy(urls, getUrlType);
        const artists = groups[UrlType.Artist] ?? [];
        const lists = groups[UrlType.Playlist] ?? []; 
        const vids = groups[UrlType.Track] ?? []; 
        const basic = [...lists, ...vids];

        if (enableInputMode) {
            if (inputMode === InputMode.Artists) {
                loadArtists(urls);
                return;
            }

            if (inputMode === InputMode.Albums) {
                loadAlbums(urls);
                return;
            }
        
            if (inputMode === InputMode.Songs) {
                loadSongs(urls);
                return;
            }
        }

        if (appOptions.debugMode) {
            loadMedia(basic);
            return;
        }

        if (basic.length) {
            loadMedia(basic);
        }

        if (artists.length) {
            loadDiscographyInfo(artists);
        }
    };

    const loadMedia = (urls: string[]) => {        
        try {
            Promise.all(afterEach(getResolveDataPromise(urls), update))
                .then((result) => {
                    setQueue((prev) => _filter(prev, (p) => p !== "load-single"));
                    
                    return result;
                });

            setQueue((prev) => [...prev, "load-single"]);
        } catch {
            setQueue((prev) => [...prev, "load-single"]);
        }
    };

    const loadArtists = (artists: string[]) => {
        const options: LaunchOptions = global.store.get("options");
        const params = {
            artists: artists,
            lang: i18n.language,
            url: appOptions.youtubeUrl,
        };
        
        setQueue((prev) => [...prev, "load-multi"]);
        ipcRenderer.send("get-youtube-artists", params, options);
    };

    const loadAlbums = (albums: string[]) => {
        const options: LaunchOptions = global.store.get("options");
        const params = {
            albums,
            lang: i18n.language,
            url: appOptions.youtubeUrl,
        };
        
        setQueue((prev) => [...prev, "load-multi"]);
        ipcRenderer.send("get-youtube-albums", params, options);
    };

    const loadSongs = (songs: string[]) => {
        const options: LaunchOptions = global.store.get("options");
        const params = {
            songs,
            lang: i18n.language,
            url: appOptions.youtubeUrl,
        };
        
        setQueue((prev) => [...prev, "load-multi"]);
        ipcRenderer.send("get-youtube-songs", params, options);
    };

    const loadDiscographyInfo = (artists: string[]) => {
        const options: LaunchOptions = global.store.get("options");
        const params = {
            lang: i18n.language,
            url: appOptions.youtubeUrl,
            artistUrls: artists,
        };
        
        setQueue((prev) => [...prev, "load-multi"]);
        ipcRenderer.send("get-youtube-urls", params, options);
    };

    const getResolveDataPromise = (urls: string[]) => {
        if (appOptions.debugMode) {
            return resolveMockData(300);
        } else {
            return _map(urls, (url) => new Promise<YoutubeInfoResult>((resolve) => {
                ytDlpWrap.execPromise([url, "--dump-json", "--no-check-certificate", "--geo-bypass"])
                    .then((result) => {
                        const parsed = _map(_split(_trim(result), "\n"), (item) => JSON.parse(item));
                        
                        resolve({url, value: _isArray(parsed) ? parsed : [parsed]});
                    })
                    .catch((e) => {
                        const warningRegex = /WARNING:\s([\s\S]*?)(?=ERROR|WARNING|$)/gm;
                        const errorRegex = /ERROR:\s([\s\S]*?)(?=ERROR|WARNING|$)/gm;
                        const warningMatches = e.message.match(warningRegex) ?? [];
                        const errorMatches = e.message.match(errorRegex) ?? [];
                        
                        resolve({url, errors: _uniq(errorMatches), warnings: _uniq(warningMatches)}); 
                    });
            }));
        }
    };

    const download = async (urls: string[]) => {
        const albums = _map(playlists, "album");
        const albumUrls = _map(albums, "url");

        if (_isEmpty(playlists) || !_difference(albumUrls, urls)) {
            loadInfo(urls);
           
            setAutoDownload(true);
        } else if (_some(albums, (album) =>_some(album, v => _isNil(v)))) {
            setError(true);
        } else {
            setError(false);
            setAutoDownload(true);
        }
    };

    const downloadAll = () => {
        setPendingTabs([]);
        setTrackStatus([]);
        trackStatusRef.current = [];
        setAutoDownload(false);
        setQueue(() => _map(tracks, "id"));
        setOperation("download");
    };

    const downloadAlbum = (id: string) => {
        setPendingTabs([]);
        const playlist = _find(playlists, ["album.id", id]);
        const playlistTrackIds = _map(_get(playlist, "tracks"), "id");
        
        setTrackStatus((prev) => _filter(prev, (p) => !_includes(playlistTrackIds, p.trackId)));
        trackStatusRef.current = _filter(trackStatusRef.current, (p) => !_includes(playlistTrackIds, p.trackId));
        setAutoDownload(false);
        setQueue((prev) => _uniq([...prev, ...playlistTrackIds]));
        setOperation("download");
    };

    const downloadTrack = (trackId: string) => {
        const track = _find(tracks, ["id", trackId]);
        const parts = trackCuts[track.id]?.length ?? 0;
        const controller = new AbortController();
        const album = getTrackAlbum(trackId);
        const playlist = getTrackPlaylist(trackId);
        const format = getPlaylistFormat(playlist);
        const trackPath = path.resolve(getOutputFilePath(track, album, format));
        const newTrackProgressInfo: TrackStatusInfo = {
            trackId: track.id,
            percent: 0,
            totalSize: track.filesize_approx,
            path: trackPath,
        };

        setTrackStatus((prev) => [...prev, newTrackProgressInfo]);
        trackStatusRef.current = [...trackStatusRef.current, newTrackProgressInfo];
        
        if (!_includes(queue, trackId)) {
            setQueue((prev) => [...prev, trackId]);
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
                ytDlpWrap.exec([track.original_url, ...getYtdplRequestParams(track, album, trackCuts, format)], {shell: false, windowsHide: false, detached: false}, controller.signal)
                    .on("progress", (progress) => updateProgress(track.id, progress, format.type === MediaFormat.Audio ? [10, 90] : [10, 85]))
                    .on("ytDlpEvent", (eventType) => updateProgressStatus(track.id, eventType))
                    .on("error", (error) => onProcessEnd({trackId: track.id, error: error.message, parts}))
                    .on("close", () => onProcessEnd({trackId: track.id, parts}));
            }
        });    
    };

    const downloadFailed = () => {
        const failedTracks = _filter(trackStatusRef.current, "error");

        setQueue(() => _map(failedTracks, "trackId"));
        setTrackStatus((prev) => _filter(prev, (p) => !p.error));
        trackStatusRef.current = _filter(trackStatusRef.current, (p) => !p.error);

        setOperation("download");
    };

    const cancelAll = () => {       
        setAbort("all");
        _map(abortControllers, (v) => v.abort());
        ipcRenderer.send("get-youtube-urls-cancel");
        ipcRenderer.send("get-youtube-artists-albums-cancel");
        ipcRenderer.send("get-youtube-albums-cancel");
        ipcRenderer.send("get-youtube-songs-cancel");
    };

    const cancelPlaylist = (id: string) => {       
        const playlist = _find(playlists, ["url", id]);
        const playlistTrackIds = _map(_get(playlist, "tracks"), "id");
        
        setAbort(id);
        _forEach(playlistTrackIds, (trackId) => {
            if (!_find(trackStatusRef.current, ["trackId", trackId])) {
                const cancelledProgressInfo: TrackStatusInfo = {
                    trackId,
                    percent: 0,
                    totalSize: 0,
                    skipped: true,
                };

                setTrackStatus((prev) => [...prev, cancelledProgressInfo]);
                trackStatusRef.current = [...trackStatusRef.current, cancelledProgressInfo];
            }
            abortControllers[trackId]?.abort();
        });
        const f = _filter(queue, (item) => !_includes(playlistTrackIds, item));
        setQueue((prev) => _filter(prev, (item) => !_includes(playlistTrackIds, item)));
        
        if (!_isEmpty(f)) {
            setOperation("download");
        }
    };

    const cancelTrack = (id: string) => {
        setAbort(id);
        setQueue((prev) => _filter(prev, (item) => item !== id));

        if (!_find(trackStatusRef.current, ["trackId", id])) {
            const cancelledProgressInfo: TrackStatusInfo = {
                trackId: id,
                percent: 0,
                totalSize: 0,
                skipped: true,
            };

            setTrackStatus((prev) => [...prev, cancelledProgressInfo]);
            trackStatusRef.current = [...trackStatusRef.current, cancelledProgressInfo];
        }
        abortControllers[id]?.abort();
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
    
    const mergeFileParts = (track: TrackInfo, album: AlbumInfo, format: Format, parts: number) => {
        const fileParts = getOutputFileParts(track, album, format, parts);
        const lines = _map(fileParts, (file) => {
            const parsed = path.parse(file);
            
            return `file '${parsed.name}${parsed.ext}'`;
        });
        const listFilePath = getOutputFile(track, album, format) + "." + "txt";

        fs.writeFileSync(listFilePath, _join(lines, "\n"));
        const fileInfo = path.parse(listFilePath);
        
        mergeOutputFiles(fileInfo.name, format.extension, (error) => {
            if (error) {
                setErrors((prev) => [...prev, {url: track.original_url, message: error.message}]);  
            }

            fs.removeSync(listFilePath);
            
            for (const part of fileParts) {
                fs.removeSync(part);
            }
        });
    };

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

    const onProcessEnd = useCallback((result: {trackId: string, error?: string; parts?: number}) => {
        const controller = abortControllers[result.trackId];
        const aborted = controller?.signal.aborted;
        const track = _find(tracks, ["id", result.trackId]);
        const album = getTrackAlbum(track.id);
        const playlist = getTrackPlaylist(result.trackId);
        const format = getPlaylistFormat(playlist);
        const outputPath = getOutputFilePath(track, album, format);
        const dirPath = path.dirname(outputPath);
        const parsedPath = path.parse(outputPath);
        const totalSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;

        if (result.error && _includes(result.error, "[generic] '' is not a valid URL")) {
            result.error = undefined;
        }

        const completed = !result.error && !aborted;

        if (aborted) {
            const files = fs.existsSync(dirPath) ? fs.readdirSync(dirPath, {recursive: false, withFileTypes: true}) : [];
            
            for (const file of files) {
                if (file.name.startsWith(parsedPath.name) && file.isFile()) {
                    fs.removeSync(path.join(file.parentPath, file.name));
                }
            }
        }

        if (completed && result.parts > 1 && global.store.get("application.mergeParts")) {
            console.log(format.extension);
            mergeFileParts(track, album, format, result.parts);
        }

        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === result.trackId) {
                return {
                    ...item,
                    status: aborted ? t("cancelled") : result.error ?? t("done"),
                    error: !!result.error || aborted,
                    completed,
                    percent: 100,
                    totalSize,
                };
            } else {
                return item;
            }
        }));
        
        delete abortControllers[result.trackId];

        setQueue((prev) => _filter(prev, (item) => item !== result.trackId));

        if (abortRef.current === "all") {
            setQueue([]);
            setAutoDownload(false);
            setAbort(undefined);
            return;
        }

        if (abortRef.current) {
            setAutoDownload(false);
            setAbort(undefined);
            
            if (_find(playlists, ["url", abortRef.current])) {
                return;
            }
        }

        const nextTrackToDownload = _find(queue, (item) => !_find(trackStatusRef.current, (status) => status.trackId === item));

        if (!nextTrackToDownload) {
            setAutoDownload(false);
        } else {
            downloadTrack(nextTrackToDownload);
        }
    }, [abort, abortRef, tracks, trackStatus, trackStatusRef.current, formats, queue, appOptions]);

    const getTrackAlbum = useCallback((trackId: string) => {
        return _get(_find(playlists, (item) => !!_find(item.tracks, ["id", trackId])), "album");
    }, [playlists]);
    
    const getTrackPlaylist = useCallback((trackId: string) => {
        return _find(playlists, (item) => !!_find(item.tracks, ["id", trackId]));
    }, [playlists]);

    const getPlaylistFormat = useCallback((playlist: PlaylistInfo) => {
        if (global.store.get("application.formatScope") === FormatScope.Tab) {
            return _get(formats, playlist.url, formats.global);
        }
    
        return formats.global;
    }, [formats]);

    return (
        <Box className={Styles.home}>
            <div className={Styles.header}>
                <InputPanel
                    onChange={handleUrlChange}
                    loading={state.loading}
                    onDownload={download}
                    onCancel={cancelAll}
                    onDownloadFailed={downloadFailed}
                    onLoadInfo={loadInfo}
                />
                <FormatSelector disabled={_isEmpty(playlists) || _isEmpty(tracks)}/>
            </div>
            <Grid className={Styles.content} container spacing={2} padding={2}>
                {error && <Alert className={Styles.error} severity="error">{t("missingMediaInfoError")}</Alert>}
                <PlaylistTabs
                    pending={pendingTabs}
                    queue={queue}
                    onDownloadTrack={downloadTrack}
                    onDownloadPlaylist={downloadAlbum}
                    onCancelPlaylist={cancelPlaylist}
                    onCancelTrack={cancelTrack}
                />
            </Grid>
            <Grid className={Styles.footer} container>
                <InfoBar />
            </Grid>
        </Box>
    );
};

export default HomeView;

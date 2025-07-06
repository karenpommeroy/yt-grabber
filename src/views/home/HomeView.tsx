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
import _partition from "lodash/partition";
import _size from "lodash/size";
import _some from "lodash/some";
import _split from "lodash/split";
import _sum from "lodash/sum";
import _times from "lodash/times";
import _trim from "lodash/trim";
import _uniq from "lodash/uniq";
import path from "path";
import {LaunchOptions} from "puppeteer";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import YTDlpWrap, {Progress as YtDlpProgress} from "yt-dlp-wrap";

import {Alert, Box, Grid} from "@mui/material";

import {getBinPath, removeIncompleteFiles} from "../../common/FileSystem";
import {getAlbumInfo} from "../../common/Formatters";
import {
    getRealFileExtension, getUrlType, isPlaylist, mapRange, resolveMockData
} from "../../common/Helpers";
import {
    Format, FormatScope, InputMode, MediaFormat, QueueKeys, VideoType
} from "../../common/Media";
import {GetYoutubeParams, GetYoutubeResult} from "../../common/Messaging";
import {afterEach} from "../../common/Promise";
import {ProgressInfo} from "../../common/Reporter";
import {ApplicationOptions, IStore} from "../../common/Store";
import {
    AlbumInfo, PlaylistInfo, TrackInfo, TrackStatusInfo, UrlType, YoutubeArtist, YoutubeInfoResult
} from "../../common/Youtube";
import {
    convertOutputToFormat, getOutputFile, getOutputFileParts, getOutputFilePath,
    getYtdplRequestParams, mergeOutputFiles
} from "../../common/YtdplUtils";
import FailuresModal from "../../components/modals/failuresModal/FailuresModal";
import SelectArtistModal from "../../components/modals/selectArtistModal/SelectArtistModal";
import FormatSelector from "../../components/youtube/formatSelector/FormatSelector";
import InfoBar from "../../components/youtube/infoBar/InfoBar";
import InputPanel from "../../components/youtube/inputPanel/InputPanel";
import PlaylistTabs from "../../components/youtube/playlistTabs/PlaylistTabs";
import {Messages} from "../../messaging/Messages";
import {useAppContext} from "../../react/contexts/AppContext";
import {useDataState} from "../../react/contexts/DataContext";
import Styles from "./HomeView.styl";

const abortControllers: {[key: string]: AbortController;} = {};

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
        urls,
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
    const [failuresModalOpen, setFailuresModalOpen] = useState(false);
    const [abort, setAbort] = useState<string>();
    const [matchingArtistsList, setMatchingArtistsList] = useState<YoutubeArtist[]>();
    const {t, i18n} = useTranslation();
    const trackStatusRef = useRef<TrackStatusInfo[]>(trackStatus);
    const abortRef = useRef<string>(abort);

    useEffect(() => {
        const unsubscribe = global.store.onDidAnyChange((store: IStore) => setAppOptions(store.application));

        ipcRenderer.on(Messages.GetYoutubeUrlsCompleted, onGetYoutubeCompleted);
        ipcRenderer.on(Messages.GetYoutubeArtistsCompleted, onGetYoutubeCompleted);
        ipcRenderer.on(Messages.GetYoutubeAlbumsCompleted, onGetYoutubeCompleted);
        ipcRenderer.on(Messages.GetYoutubeTracksCompleted, onGetYoutubeCompleted);
        
        ipcRenderer.on(Messages.GetYoutubeUrlsCanceled, onGetYoutubeCancelled);
        ipcRenderer.on(Messages.GetYoutubeArtistsCanceled, onGetYoutubeCancelled);
        ipcRenderer.on(Messages.GetYoutubeAlbumsCanceled, onGetYoutubeCancelled);
        ipcRenderer.on(Messages.GetYoutubeTracksCanceled, onGetYoutubeCancelled);
        
        ipcRenderer.on(Messages.GetYoutubeArtistsPause, onGetYoutubeArtistsPause);

        return () => {
            unsubscribe();

            ipcRenderer.off(Messages.GetYoutubeUrlsCompleted, onGetYoutubeCompleted);
            ipcRenderer.off(Messages.GetYoutubeArtistsCompleted, onGetYoutubeCompleted);
            ipcRenderer.off(Messages.GetYoutubeAlbumsCompleted, onGetYoutubeCompleted);
            ipcRenderer.off(Messages.GetYoutubeTracksCompleted, onGetYoutubeCompleted);

            ipcRenderer.off(Messages.GetYoutubeUrlsCanceled, onGetYoutubeCancelled);
            ipcRenderer.off(Messages.GetYoutubeArtistsCanceled, onGetYoutubeCancelled);
            ipcRenderer.off(Messages.GetYoutubeAlbumsCanceled, onGetYoutubeCancelled);
            ipcRenderer.off(Messages.GetYoutubeTracksCanceled, onGetYoutubeCancelled);

            ipcRenderer.off(Messages.GetYoutubeArtistsPause, onGetYoutubeArtistsPause);
        };
    },  []);

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
        const hasFailures = !_isEmpty(_filter(trackStatus, "error"));

        if (!state.loading && hasFailures && !_isEmpty(urls)) {
            setFailuresModalOpen(true);
        }
    }, [state.loading]);

    const ytDlpWrap = useMemo<YTDlpWrap>(() => {
        const ytdlpPath: string = global.store.get("application.ytdlpExecutablePath") || `${getBinPath()}/yt-dlp.exe`;
        
        return new YTDlpWrap(ytdlpPath);
    }, []);

    const handleUrlChange = (urls: string[]) => {
        global.store.set("application.urls", urls);
    };

    const onGetYoutubeCompleted = (event: IpcRendererEvent, data: ProgressInfo<GetYoutubeResult>) => {
        if (!data.result) return;

        setPlaylists((prev) => [..._filter(prev, (p) => !_includes(data.result.sources, p.url)), ..._map(data.result.values, (v) => ({url: v, album: {}, tracks: []} as PlaylistInfo))]);
        try {
            const promise = Promise.all(afterEach(getResolveDataPromise(data.result.values), update))
                .then((result) => {
                    setQueue((prev) => _filter(prev, (p) => p !== QueueKeys.LoadMulti));

                    return result;
                });

            return promise;
        } catch {
            setQueue((prev) => _filter(prev, (p) => p !== QueueKeys.LoadMulti));
        }
    };

    const onGetYoutubeArtistsPause = (event: IpcRendererEvent, artists: YoutubeArtist[]) => {
        setMatchingArtistsList(artists);
    };

    const onGetYoutubeCancelled = useCallback(() => {
        setPlaylists((prev) => _filter(prev, (p) => !_isEmpty(p.album)));
        setQueue((prev) => _filter(prev, (p) => p !== QueueKeys.LoadMulti));
    }, [playlists]);

    const update = useCallback((item: YoutubeInfoResult) => {
        if (!_isEmpty(item.warnings)) {
            setWarnings((prev) => [...prev, {url: item.url, message: _join(item.warnings, "\n")}]);
        }

        if (!_isEmpty(item.errors)) {
            setErrors((prev) => [...prev, {url: item.url, message: _join(item.errors, "\n")}]);
        }

        if (item.value) {
            setTracks((prev) => [...prev, ...item.value]);
            setPlaylists((prev) => _map(prev, (p) => {
                if ((p.url === item.url)) {
                    return {
                        url: item.url, album: getAlbumInfo(item.value, item.url), tracks: item.value
                    };
                } else {
                    return p;
                }
            }));
        }
    }, [playlists]);

    const loadInfo = (urls: string[]) => {
        clear();
        setPlaylists(_map(urls, (v) => ({url: v, album: {}, tracks: []} as PlaylistInfo)));
        
        const inputMode = global.store.get("application.inputMode");
        const groups = _groupBy(urls, getUrlType);
        const artists = groups[UrlType.Artist] ?? [];
        const lists = groups[UrlType.Playlist] ?? [];
        const vids = groups[UrlType.Track] ?? [];
        const basic = [...lists, ...vids];

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
            Promise.all(afterEach(getResolveDataPromise(urls, true), update))
                .then((result) => {
                    setQueue((prev) => _filter(prev, (p) => p !== QueueKeys.LoadSingle));

                    return result;
                });

            setQueue((prev) => [...prev, QueueKeys.LoadSingle]);
        } catch {
            setQueue((prev) => [...prev, QueueKeys.LoadSingle]);
        }
    };

    const loadArtists = (artists: string[]) => {
        const options: LaunchOptions = global.store.get("options");
        const params: GetYoutubeParams = {
            values: artists,
            lang: i18n.language,
            url: appOptions.youtubeUrl,
            options: {
                downloadSinglesAndEps: appOptions.downloadSinglesAndEps,
                multiMatchAction: appOptions.multiMatchAction,
            },
        };

        setQueue((prev) => [...prev, QueueKeys.LoadMulti]);
        ipcRenderer.send(Messages.GetYoutubeArtists, params, options);
    };

    const loadAlbums = (albums: string[]) => {
        const options: LaunchOptions = global.store.get("options");
        const params: GetYoutubeParams = {
            values: albums,
            lang: i18n.language,
            url: appOptions.youtubeUrl,
        };

        setQueue((prev) => [...prev, QueueKeys.LoadMulti]);
        ipcRenderer.send(Messages.GetYoutubeAlbums, params, options);
    };

    const loadSongs = (songs: string[]) => {
        const options: LaunchOptions = global.store.get("options");
        const params: GetYoutubeParams = {
            values: songs,
            lang: i18n.language,
            url: appOptions.youtubeUrl,
        };

        setQueue((prev) => [...prev, QueueKeys.LoadMulti]);
        ipcRenderer.send(Messages.GetYoutubeTracks, params, options);
    };

    const loadDiscographyInfo = (artists: string[]) => {
        const options: LaunchOptions = global.store.get("options");
        const params: GetYoutubeParams = {
            values: artists,
            lang: i18n.language,
            url: appOptions.youtubeUrl,
        };

        setQueue((prev) => [...prev, QueueKeys.LoadMulti]);
        ipcRenderer.send(Messages.GetYoutubeUrls, params, options);
    };

    const getResolveDataPromise = (urls: string[], flatPlaylist?: boolean) => {
        if (appOptions.debugMode) {
            return resolveMockData(300);
        } else {
            return _map(urls, (url) => {
                const ytdplArgs = [url, "--dump-json", "--no-check-certificate", "--geo-bypass"];
                const controller = new AbortController();
                abortControllers[url] = controller;

                const promiseCreator = (ytdplArgsToUse: string[], resolve: (params: any) => any) => {
                    ytDlpWrap.execPromise(ytdplArgsToUse, undefined, controller.signal)
                        .then((result) => {
                            const parsed = _map<string, TrackInfo>(_split(_trim(result), "\n"), (item) => JSON.parse(item));
                            const [deletedOrPrivateMedia, validMedia] = _partition(parsed, (item) => !item.duration);

                            resolve({
                                url,
                                value: _isArray(validMedia) ? validMedia : [validMedia],
                                warnings: _isEmpty(deletedOrPrivateMedia) ? [] : [t("foundDeletedOrPrivateMedia")]
                            });
                        })
                        .catch((e) => {
                            const warningRegex = /WARNING:\s([\s\S]*?)(?=ERROR|WARNING|$)/gm;
                            const errorRegex = /ERROR:\s([\s\S]*?)(?=ERROR|WARNING|$)/gm;
                            const warningMatches = e.message.match(warningRegex) ?? [];
                            const errorMatches = e.message.match(errorRegex) ?? [];
                            if (controller.signal.aborted) {
                                return resolve({url, errors: [], warnings: []});
                            }

                            return resolve({url, errors: _uniq(errorMatches), warnings: _uniq(warningMatches)});
                        })
                        .finally(() => {
                            delete abortControllers[url];
                        });
                };
                const playlistValidationPromise = async (currentItem: number): Promise<boolean | null> => {
                    const result = await ytDlpWrap.execPromise([url, "--dump-json", "--no-check-certificate", "--geo-bypass", "--flat-playlist", "--playlist-items", `${currentItem}`], undefined);
                    const playlistCheckItemsCount = global.store.get<string, number>("application.playlistCheckItemsCount");
                    const flatPlaylistCountThreshold = global.store.get<string, number>("application.playlistCountThreshold");
                    const parsed = _map<string, TrackInfo>(_split(_trim(result), "\n"), (item) => JSON.parse(item));
                    const validMedia = _filter(parsed, (item) => !!item.duration);
                    
                    if (!_isEmpty(validMedia)) {
                        return _get(validMedia, "0.playlist_count") > flatPlaylistCountThreshold;
                    } else if (currentItem === playlistCheckItemsCount) {
                        return null;
                    }

                    return playlistValidationPromise(currentItem + 1);
                };

                return new Promise<YoutubeInfoResult>((resolve) => {
                    if (isPlaylist(url) && flatPlaylist) {
                        return playlistValidationPromise(1)
                            .then((result) => {
                                const ytdplArgsToUse = result ? ytdplArgs.concat("--flat-playlist") : ytdplArgs;
                                
                                if (result === null) {
                                    return resolve({url, errors: [t("noValidMediaFoundWhenCheckingPlaylist")]});
                                }

                                return promiseCreator(ytdplArgsToUse, resolve);
                            });
                    } else {
                        return promiseCreator(ytdplArgs, resolve);
                    }
                });
            });
        }
    };

    const download = async (urls: string[]) => {
        const albums = _map(playlists, "album");
        const albumUrls = _map(albums, "url");

        if (_isEmpty(playlists) || !_difference(albumUrls, urls)) {
            loadInfo(urls);
            setAutoDownload(true);
        } else if (_some(albums, (album) => _some(album, v => _isNil(v)))) {
            setError(true);
        } else {
            setError(false);
            setAutoDownload(true);
        }
    };

    const downloadAll = () => {
        setTrackStatus([]);
        trackStatusRef.current = [];
        setAutoDownload(false);
        setQueue(() => _map(tracks, "id"));
        setOperation("download");
    };

    const downloadAlbum = (id: string) => {
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
            resolve(!appOptions.alwaysOverwrite && fs.existsSync(trackPath));
        }).then((result) => {
            if (result) {
                onProcessEnd({trackId});
            } else {
                ytDlpWrap.exec([track.original_url, ...getYtdplRequestParams(track, album, trackCuts, format)], {shell: false, windowsHide: false, detached: false}, controller.signal)
                    .on("progress", (progress) => updateProgress(track.id, progress, format.type === MediaFormat.Audio ? [10, 90] : [10, 85]))
                    .on("ytDlpEvent", (eventType) => updateProgressStatus(track.id, eventType))
                    .on("error", (error) => {
                        let errorMsg: string = undefined;

                        if (error.message && !_includes(error.message, "[generic] '' is not a valid URL")) {
                            errorMsg = error.message;
                        }

                        onMerge({trackId: track.id, error: errorMsg, parts})
                            .then(onConvert)
                            .then(onProcessEnd);
                    })
                    .on("close", () => {
                        onMerge({trackId: track.id, parts})
                            .then(onConvert)
                            .then(onProcessEnd);
                    });
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
        cancelPendingPlaylists();
        ipcRenderer.send(Messages.GetYoutubeUrlsCancel);
        ipcRenderer.send(Messages.GetYoutubeArtistsCancel);
        ipcRenderer.send(Messages.GetYoutubeAlbumsCancel);
        ipcRenderer.send(Messages.GetYoutubeTracksCancel);
    };

    const cancelPendingPlaylists = () => {
        setPlaylists(_filter(playlists, (p) => !_isEmpty(p.album)));
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

    const mergeFileParts = async (track: TrackInfo, album: AlbumInfo, format: Format, parts: number, callback: (filepath: string) => void) => {
        const fileParts = getOutputFileParts(track, album, format, parts);
        const listFile = _join(_map(fileParts, (p) => `file '${path.basename(p)}'`), "\n");
        const listFilePath = getOutputFile(track, album, format) + "." + "txt";
        const listFileInfo = path.parse(listFilePath);

        fs.writeFileSync(listFilePath, listFile);

        await new Promise<void>((resolve) => {
            mergeOutputFiles(listFileInfo.dir, listFileInfo.name, format.extension, (error) => {
                if (error) {
                    setErrors((prev) => [...prev, {url: track.original_url, message: error.message}]);
                }

                fs.removeSync(listFilePath);
                for (const part of fileParts) {
                    fs.removeSync(part);
                }

                resolve();
            });
        });

        callback(`${listFileInfo.dir}/${listFileInfo.name}.${getRealFileExtension(format.extension)}`);
    };

    const convertFiles = async (track: TrackInfo, album: AlbumInfo, format: Format, parts: number, callback: (filepaths: string[]) => void) => {
        const filePaths: string[] = [];

        if (parts <= 1 || global.store.get("application.mergeParts")) {
            filePaths.push(getOutputFile(track, album, format) + "." + getRealFileExtension(format.extension));
        } else {
            filePaths.push(...getOutputFileParts(track, album, format, parts));
        }

        const results = await Promise.all(_map(filePaths, (fp) => new Promise<string>((resolve) => {
            const fileInfo = path.parse(fp);
            convertOutputToFormat(fileInfo.dir, fileInfo.name, format.extension, (error) => {
                if (error) {
                    setErrors((prev) => [...prev, {url: track.original_url, message: error.message}]);
                }

                fs.removeSync(fp);
                resolve(`${fileInfo.dir}/${fileInfo.name}.${format.extension}`);
            });
        })));

        callback(results);
    };


    const updateProgress = useCallback((trackId: string, progress: YtDlpProgress, progressMapRange = [0, 100]) => {
        setProgressPercentage(trackId, mapRange(progress.percent, [0, 100], progressMapRange));
    }, [trackStatus, setTrackStatus]);

    const updateProgressStatus = useCallback((trackId: string, eventType: string) => {
        let status: string = undefined;

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
            status = undefined;
        }

        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === trackId) {
                return {...item, status: status ?? item.status};
            } else {
                return item;
            }
        }));
    }, [trackStatus, setTrackStatus]);

    const onMerge = useCallback((result: {trackId: string, error?: string; parts?: number}) => {
        const controller = abortControllers[result.trackId];
        const aborted = controller?.signal.aborted;
        const track = _find(tracks, ["id", result.trackId]);
        const album = getTrackAlbum(track.id);
        const playlist = getTrackPlaylist(result.trackId);
        const format = getPlaylistFormat(playlist);
        const completed = !result.error && !aborted;
        const shouldMerge = result.parts > 1 && global.store.get("application.mergeParts");

        return new Promise((resolve) => {
            if (!completed) {
                return resolve(result);
            }
            if (!shouldMerge) {
                setTrackStatus((prev) => _map(prev, (item) => item.trackId === result.trackId ? {...item, percent: 90} : item));
                return resolve(result);
            }

            setTrackStatus((prev) => _map(prev, (item) => {
                if (item.trackId === result.trackId) {
                    return {
                        ...item,
                        status: t("mergingParts"),
                        percent: 85,
                    };
                } else {
                    return item;
                }
            }));

            mergeFileParts(track, album, format, result.parts, (filepath) => {
                const totalSize = fs.statSync(filepath).size;

                setTrackStatus((prev) => _map(prev, (item) => item.trackId === result.trackId ? {...item, totalSize, percent: 90} : item));
                resolve(result);
            });
        });
    }, [abort, abortRef, tracks, trackStatus, trackStatusRef.current, formats, queue, appOptions]);

    const onConvert = useCallback((result: {trackId: string, error?: string; parts?: number}) => {
        const controller = abortControllers[result.trackId];
        const aborted = controller?.signal.aborted;
        const track = _find(tracks, ["id", result.trackId]);
        const album = getTrackAlbum(track.id);
        const playlist = getTrackPlaylist(result.trackId);
        const format = getPlaylistFormat(playlist);
        const completed = !result.error && !aborted;
        const shouldConvert = _includes([VideoType.Mov, VideoType.Avi, VideoType.Mpeg], format.extension);

        return new Promise((resolve) => {
            if (!completed) {
                return resolve(result);
            }
            if (!shouldConvert) {
                setTrackStatus((prev) => _map(prev, (item) => item.trackId === result.trackId ? {...item, percent: 95} : item));
                return resolve(result);
            }

            setTrackStatus((prev) => _map(prev, (item) => {
                if (item.trackId === result.trackId) {
                    return {
                        ...item,
                        status: t("convertingOutput"),
                        percent: 90,
                    };
                } else {
                    return item;
                }
            }));
            
            convertFiles(track, album, format, result.parts, (filepaths) => {
                const totalSize = _sum(_map(filepaths, (fp) => fs.statSync(fp).size));

                setTrackStatus((prev) => _map(prev, (item) => item.trackId === result.trackId ? {...item, totalSize, percent: 95} : item));
                resolve(result);
            });
        });
    }, [abort, abortRef, tracks, trackStatus, trackStatusRef.current, formats, queue, appOptions]);

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
        const totalSize = fs.existsSync(outputPath) && fs.statSync(outputPath).size;
        const completed = !result.error && !aborted;

        if (aborted) {
            removeIncompleteFiles({dir: dirPath, name: parsedPath.name, ext: format.extension}, result.parts > 1);
        }

        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === result.trackId) {
                return {
                    ...item,
                    status: aborted ? t("cancelled") : result.error ?? t("done"),
                    error: !!result.error || aborted,
                    completed,
                    percent: 100,
                    totalSize: totalSize ? totalSize : item.totalSize,
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

    const onSelectArtistModalClose = (artist?: YoutubeArtist) => {
        if (!artist) {
            cancelAll();
        } else {
            ipcRenderer.send(Messages.GetYoutubeArtistsResume, artist);
        }

        setMatchingArtistsList(undefined);
    };
    
    const onRetryFailures = () => {
        setFailuresModalOpen(false);
        downloadFailed();
    };
    
    const onCancelFailures = () => {
        setFailuresModalOpen(false);
    };

    return (
        <>
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
                    <FormatSelector disabled={_isEmpty(playlists) || _isEmpty(tracks)} />
                </div>
                <Grid className={Styles.content} container spacing={2} padding={2}>
                    {error && <Alert className={Styles.error} severity="error">{t("missingMediaInfoError")}</Alert>}
                    <PlaylistTabs
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
            <SelectArtistModal
                id="select-artist-modal"
                artists={matchingArtistsList}
                open={!!matchingArtistsList}
                onClose={onSelectArtistModalClose}
            />
            <FailuresModal
                id="failures-modal"
                open={failuresModalOpen}
                onConfirm={onRetryFailures}
                onCancel={onCancelFailures}
            />
        </>
    );
};

export default HomeView;

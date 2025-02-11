import classnames from "classnames";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _first from "lodash/first";
import _get from "lodash/get";
import _isArray from "lodash/isArray";
import _isEmpty from "lodash/isEmpty";
import _isNaN from "lodash/isNaN";
import _isNil from "lodash/isNil";
import _keys from "lodash/keys";
import _last from "lodash/last";
import _map from "lodash/map";
import _min from "lodash/min";
import _pickBy from "lodash/pickBy";
import _remove from "lodash/remove";
import _replace from "lodash/replace";
import _size from "lodash/size";
import _sumBy from "lodash/sumBy";
import _times from "lodash/times";
import _toString from "lodash/toString";
import _uniq from "lodash/uniq";
import _uniqBy from "lodash/uniqBy";
import _values from "lodash/values";
import moment from "moment";
import path from "path";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import YTDlpWrap, {Progress as YtDlpProgress} from "yt-dlp-wrap";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import {
    Avatar, Box, Button, Card, CardContent, CardMedia, CircularProgress, FormControl, IconButton,
    InputLabel, List, ListItem, ListItemAvatar, ListItemText, MenuItem, Select, SelectChangeEvent,
    TextField, Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {formatFileSize} from "../../common/Helpers";
import {AlbumInfo, Format, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
import MissingDetailsModal from "../../components/modals/MissingDetailsModal";
import NumberField from "../../components/numberField/NumberField";
import Progress from "../../components/progress/Progress";
import SplitButton from "../../components/splitButton/SplitButton";
import {MediaFormat} from "../../enums/MediaFormat";
import {useDataState} from "../../react/contexts/DataContext";
import CompleteTracksMock from "../../tests/CompleteTracksMock";
// import TracksMock from "../../tests/MissingDetailsTracksMock";
import Styles from "./HomeView.styl";

const isDev = process.env.NODE_ENV === "development";
const binPath = _replace(!isDev ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "resources", "bin"), /\\/g, "/");
const ytDlpWrap = new YTDlpWrap(binPath + "/yt-dlp.exe");

export type Process = {
    id: string;
    handle: Promise<void>;
};

export const HomeView: React.FC = () => {
    const appOptions = global.store.get("application");
    const {t} = useTranslation();
    const [url, setUrl] = useState("");
    const {album, tracks, trackStatus, setAlbum, setTracks, setTrackStatus, clear} = useDataState();
    const [loading, setLoading] = useState(false);
    const [downloadStart, setDownloadStart] = useState(false);
    const [missingDetailsModalValue, setMissingDetailsModalValue] = useState<string[]>();
    const [missingDetailsModalOpen, setMissingDetailsModalOpen] = useState(false);
    const [allFormats, setAllFormats] = useState<Format[]>();
    const [formats, setFormats] = useState<Format[]>();
    const [extensions, setExtensions] = useState<string[]>();
    const [selectedMediaFormat, setSelectedMediaFormat] = useState<MediaFormat>();
    const [selectedExtension, setSelectedExtension] = useState<string>();
    const [selectedFormat, setSelectedFormat] = useState<string>();
    const [selectedQuality, setSelectedQuality] = useState<number>();
    const trackStatusRef = useRef<TrackStatusInfo[]>(trackStatus);
    const activeProcRef = useRef<Process[]>([]);
    const missingDetailsResolve = useRef<(value: unknown) => void>(undefined);
        
    useEffect(() => {
        if (selectedMediaFormat && selectedExtension && selectedFormat && downloadStart) {
            downloadAlbum();
        }
    }, [selectedMediaFormat, selectedExtension, selectedFormat, downloadStart]);

    useEffect(() => {
        trackStatusRef.current = trackStatus;
    }, [trackStatus]);
    
    useEffect(() => {
        if (_isEmpty(allFormats)) return;
        setSelectedMediaFormat(MediaFormat.Video);
    }, [allFormats]);

    useEffect(() => {
        const nextExtensions = _uniq(_map(_filter(allFormats, ["type", selectedMediaFormat]), "extension"));
        setExtensions(nextExtensions);

    }, [selectedMediaFormat]);

    useEffect(() => {
        setSelectedExtension(_first(extensions));
    }, [extensions]);
    
    useEffect(() => {
        const nextFormats = _uniqBy(_filter(allFormats, (f) => f.type === selectedMediaFormat && f.extension === selectedExtension), "name");
        setFormats(nextFormats);
    }, [selectedExtension]);

    useEffect(() => {
        if (_isEmpty(formats)) return;
        setSelectedFormat(_last(formats).id);
    }, [formats]);

    const onUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
    };

    const onMissingDetailsModalClose = (data: Record<string, string | number>) => {
        if (missingDetailsResolve.current) {
            missingDetailsResolve.current(data);
        }
    };

    const download = async () => {
        await retrieveInfo();
        setDownloadStart(true);
    };

    const handleMediaFormatChange = (event: SelectChangeEvent<MediaFormat>) => {       
        setSelectedMediaFormat(event.target.value as MediaFormat);
    };

    const handleExtensionChange = (event: SelectChangeEvent<string>) => {       
        setSelectedExtension(event.target.value as string);
    };

    const handleFormatChange = (event: SelectChangeEvent<string>) => {       
        setSelectedFormat(event.target.value);
    };
    
    const onQualityChange = (value: number) => {       
        setSelectedQuality(value);
    };

    const resolveData = () => {
        if (appOptions.debugMode) {
            return new Promise((resolve) => {
                setTimeout(() => resolve(CompleteTracksMock), 1000);
            });
        } else {
            return ytDlpWrap.getVideoInfo(url);
        }
    };
    
    const retrieveInfo = useCallback(async () => {
        setLoading(true);
        clearAlbum();

        const info = await resolveData();
        const items: TrackInfo[] = _isArray(info) ? info : [info];
        const albumInfo = getAlbumInfo(items);
        const missingKeys = _keys(_pickBy(albumInfo, _isNil));
        
        if (!!items[0].playlist && !_isEmpty(missingKeys)) {
            setMissingDetailsModalValue(missingKeys);
            setMissingDetailsModalOpen(true);
            
            const result = await new Promise<Record<string, string>>((resolve) => {
                missingDetailsResolve.current = resolve;
            });

            setTracks(items);
            setAlbum({...albumInfo, ...result});
        } else {
            setTracks(items);
            setAlbum(albumInfo);
        }
        setAllFormats(getFormats(_first(items)));
        setLoading(false);
    }, [setTracks, setAlbum, url]);

    const updateProgress = useCallback((trackId: string, progress: YtDlpProgress) => {
        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === trackId) {
                return {...item, percent: _isNaN(progress.percent) ? 0 : progress.percent};
            } else {
                return item;
            }
        }));
    }, [trackStatus, setTrackStatus]);
    
    const updateProgressStatus = useCallback((trackId: string, eventType: string) => {
        let status = "";

        if (eventType === "youtube") {
            status = t("reading");
        } else if (eventType === "info") {
            status = t("starting download");
        } else if (eventType === "download") {
            status = t("downloading");
        } else if (eventType === "ExtractAudio") {
            status = t("extractingAudio");
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

    const finishProgress = useCallback((trackId: string) => {
        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === trackId) {
                return {...item, completed: true, status: ""};
            } else {
                return item;
            }
        }));
        _remove(activeProcRef.current, (proc) => proc.id === trackId);
    }, [trackStatus, setTrackStatus]);

    const finishProgressWithError = useCallback((trackId: string, error: Error) => {
        setTrackStatus((prev) => _map(prev, (item) => {
            if (item.trackId === trackId) {
                return {...item, status: error.message, error: true};
            } else {
                return item;
            }
        }));
        _remove(activeProcRef.current, (proc) => proc.id === trackId);
    }, [trackStatus, setTrackStatus]);

    const onProcessEnd = useCallback(() => {
        const nextTrackToDownload = _find(tracks, (item) => {
            return !_find(trackStatusRef.current, ["trackId", item.id]);
        });

        if (!nextTrackToDownload) {
            setDownloadStart(false);
            return;
        }

        const nextPromise = downloadTrack(nextTrackToDownload.id).then(onProcessEnd);

        activeProcRef.current.push({id: nextTrackToDownload.id, handle: nextPromise});
    }, [tracks, trackStatusRef]);

    const downloadAlbum = () => {
        _times(_min([appOptions.concurrency, _size(tracks)]), (num) => {
            const id = tracks[num].id;
            
            if (!id) return;
            
            activeProcRef.current.push({id, handle: downloadTrack(id).then(onProcessEnd)});
        });
    };

    const retryFailedDownloads = async () => {
        const failedTracks = _filter(trackStatusRef.current, "error");
        for (const failed of failedTracks) {
            const promise = downloadTrack(failed.trackId);
            
            activeProcRef.current.push({id: failed.trackId, handle: promise});
            await promise;
        }
    };

    const clearAlbum = () => {
        clear();
        setDownloadStart(false);
    };
    
    const onDownloadTrackClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");
        setTrackStatus((prev) => _filter(prev, (item) => item.trackId !== trackId));
        downloadTrack(trackId);
    };

    const getYtDplArguments = (track: TrackInfo, album: AlbumInfo) => {
        if (selectedMediaFormat === MediaFormat.Audio) {
            return [
                "--extract-audio",
                "--embed-thumbnail",
                "--audio-format", "mp3",
                "--audio-quality", _toString(selectedQuality),
                "--postprocessor-args", getPostProcessorArgs(track, album),
                "--output", getOutput(track, album)
            ];
        }

        if (selectedMediaFormat === MediaFormat.Video) {
            const selected = _find(allFormats, ["id", selectedFormat]);
            return [
                "-f", `bv*[height<=${selected.height}][ext=${selected.extension}]+ba[ext=m4a]/b[height<=${selected.height}][ext=${selected.extension}] / bv*+ba/b`, // "best"
                "--embed-thumbnail",
                // "--download-sections", "*00:10-02:20", //,*02:15-02:45
                // "--force-keyframes-at-cut"
                // "-S", "proto:https",
                "--output", getOutput(track, album)
            ];
        }
    };

    const getPostProcessorArgs = (track: TrackInfo, album: AlbumInfo) => {
        if (track.playlist) {
            const title = track.title.replace(/"/g, "\\\"");
            const artist = album.artist.replace(/"/g, "\\\"");
            const albumTitle = album.title.replace(/"/g, "\\\"");

            return `-metadata title="${title}" -metadata artist="${artist}" -metadata album="${albumTitle}" -metadata track="${track.playlist_autonumber}" -metadata date="${album.releaseYear}" -metadata release_year="${album.releaseYear}"`;
        }

        return `-metadata title="${track.title}"`;
    };

    const getOutput = (track: TrackInfo, album: AlbumInfo) => {
        if (selectedMediaFormat === MediaFormat.Audio) {
            if (!track.playlist) {
                return `./${appOptions.outputDirectory}/${track.title}.mp3`;
            } else {
                return `./${appOptions.outputDirectory}/${album.artist}/[${album.releaseYear}] ${album.title}/${track.playlist_autonumber} - ${track.title}.mp3`;
            }
        }

        if (selectedMediaFormat === MediaFormat.Video) {
            return `./${appOptions.outputDirectory}/${track.title}`;
        }
    };

    const downloadTrack = async (trackId: string) => {
        const track = _find(tracks, ["id", trackId]);

        if (!track) return;

        const newTrackProgressInfo = {
            trackId: track.id,
            percent: 0,
            totalSize: _toString(track.filesize_approx),
        };
        
        setTrackStatus((prev) => [...prev, newTrackProgressInfo]);
        console.log(album);
        const result = await new Promise<boolean>((resolve, reject) => { 
            const ytDlpEventEmitter = ytDlpWrap
                .exec([
                    track.original_url,
                    ...getYtDplArguments(track, album),
                ])
                .on("progress", (progress) => updateProgress(track.id, progress))
                .on("ytDlpEvent", (eventType) => updateProgressStatus(track.id, eventType))
                .on("error", (error) => {
                    reject(error);
                })
                .on("close", () => {
                    resolve(true);
                });

            console.log(ytDlpEventEmitter.ytDlpProcess.pid);
        }).catch((error => {
            finishProgressWithError(track.id, error);
        }));

        if (result) {
            finishProgress(track.id);
        }
    };

    const getFormats = (item: TrackInfo): Format[] => {
        const formats = _map(item.formats.filter((format) => !!format.resolution && (format.acodec !== "none" || format.vcodec !== "none")), (f) => ({type: f.vcodec !== "none" ? MediaFormat.Video : MediaFormat.Audio, extension: f.vcodec !== "none" ? f.ext : "mp3", protocol: f.protocol, height: f.height, width: f.width, name: f.resolution, id: f.format_id} as Format));
        
        return formats;
    };

    const getAlbumInfo = (items: TrackInfo[]): AlbumInfo => {
        const item = _first(items);

        return {
            artist: _get(item, "creators.0", item.artist),
            title: item.album,
            releaseYear: item.release_year,
            tracksNumber: _get(item, "playlist_count", 1),
            duration: _sumBy(items, "duration"),
            thumbnail: _get(item, "thumbnail", _get(_find(item.thumbnails, ["id", "2"]), "url")),
        };
    };

    const getTrackStatusInfo = useCallback((track: TrackInfo): TrackStatusInfo => {
        const trackStatusInfo = _find(trackStatus, ["trackId", track.id]);

        if (!trackStatusInfo) {
            return;
        }

        return trackStatusInfo;
    }, [trackStatus]);


    return (
        <>
            <Box className={Styles.home}>
                <Grid className={Styles.header} container spacing={2} padding={2}>
                    <Grid size={10}>
                        <TextField fullWidth label={t("youtubeUrl")} variant="outlined" value={url} onChange={onUrlChange} />
                    </Grid>
                    <Grid size={2}>
                        <SplitButton loading={loading || !_isEmpty(activeProcRef.current)} labels={[t("download"), t("load")]} handlers={[download, retrieveInfo]} fullWidth variant="contained" color="secondary" disableElevation />
                    </Grid>
                </Grid>
                {!_isEmpty(allFormats) && <Grid className={Styles.formats} container spacing={2} padding={2}>
                    {selectedMediaFormat && <Grid size={4}>
                        <FormControl fullWidth>
                            <InputLabel id="media-format-label">{t("mediaFormat")}</InputLabel>
                            <Select<MediaFormat>
                                labelId="media-format-label"
                                value={selectedMediaFormat}
                                label={t("mediaFormat")}
                                onChange={handleMediaFormatChange}
                            >
                                {_map(_values(MediaFormat), (f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    }
                    {selectedMediaFormat === MediaFormat.Video && <>
                        {!_isEmpty(extensions) && selectedExtension && <Grid size={4}>
                            <FormControl fullWidth>
                                <InputLabel id="extension-label">{t("extension")}</InputLabel>
                                <Select<string>
                                    labelId="extension-label"
                                    value={selectedExtension}
                                    label={t("extension")}
                                    onChange={handleExtensionChange}
                                >
                                    {_map(extensions, (e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        }
                        {!_isEmpty(formats) && selectedFormat && <Grid size={4}>
                            <FormControl fullWidth>
                                <InputLabel id="format-label">{t("format")}</InputLabel>
                                <Select<string>
                                    labelId="format-label"
                                    value={selectedFormat}
                                    label={t("format")}
                                    onChange={handleFormatChange}
                                >
                                    {_map(formats, (f) => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        }
                    </>}
                    {selectedMediaFormat === MediaFormat.Audio && <>
                        <Grid size={4}>
                            <NumberField
                                fullWidth
                                label={t("quality")}
                                id="quality"
                                variant="outlined"
                                onChange={onQualityChange}
                                value={selectedQuality}
                                decimalScale={0}
                                step={1}
                                min={0}
                                max={10}
                            />
                        </Grid>
                    </>}
                </Grid>}
                <Grid className={Styles.content} container spacing={2} padding={2}>
                    {loading && <CircularProgress color="primary" thickness={5} size={80} />}
                    {!loading && tracks && album &&
                        <>
                            <Grid size={12}>
                                <Card variant="outlined" className={Styles.albumHeader}>
                                    <CardMedia
                                        component="img"
                                        sx={{width: 100}}
                                        image={album.thumbnail}
                                        alt={album.title}
                                    />
                                    <Box className={Styles.albumHeaderContent}>
                                        <CardContent className={Styles.albumHeaderInfo}>
                                            {tracks[0].playlist && <>
                                                <div className={Styles.row}>
                                                    <Typography variant="h6" className={classnames(Styles.label, Styles.bold)}>{album.title}</Typography>
                                                    <Typography variant="h6" sx={{color: "secondary.main"}}>{t("by")} {album.artist}</Typography>
                                                </div>
                                                <div className={Styles.row}>
                                                    <Typography variant="subtitle2" className={Styles.label}>{t("releaseYear")}:</Typography>
                                                    <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{album.releaseYear}</Typography>
                                                </div>
                                            </>
                                            }
                                            {!tracks[0].playlist && <>
                                                <div className={Styles.row}>
                                                    <Typography variant="h6" className={classnames(Styles.label, Styles.bold)}>{tracks[0].title}</Typography>
                                                </div>
                                            </>
                                            }
                                            <div className={Styles.row}>
                                                <Typography variant="subtitle2" className={Styles.label}>{t("duration")}:</Typography>
                                                <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{moment.duration(album.duration, "seconds").format("m:ss")}</Typography>
                                            </div>
                                        </CardContent>
                                        <Box className={Styles.albumHeaderActions} padding={2} gap={1}>
                                            <Button fullWidth variant="contained" color="secondary" disableElevation onClick={clearAlbum}>
                                                {t("clear")}
                                            </Button>
                                            {!_isEmpty(trackStatus) && !_isEmpty(_filter(trackStatus, "error")) &&
                                                <Button fullWidth variant="contained" color="secondary" disableElevation disabled={!_isEmpty(activeProcRef.current)} onClick={retryFailedDownloads}>
                                                    {t("retry")}
                                                </Button>
                                            }
                                            {(_isEmpty(trackStatus) || ((_filter(trackStatus, "completed")).length + (_filter(trackStatus, "error")).length) < tracks.length) &&
                                                <Button fullWidth variant="contained" color="secondary" disableElevation onClick={downloadAlbum} disabled={!_isEmpty(activeProcRef.current)}>
                                                    {t("download")}
                                                </Button>
                                            }
                                        </Box>
                                    </Box>
                                </Card>
                            </Grid>
                            <Grid size={12}>
                                <List className={Styles.trackList} dense>
                                    {_map(tracks, (item) => {
                                        const progressInfo = getTrackStatusInfo(item);

                                        return (<ListItem
                                            divider
                                            dense
                                            key={item.id}
                                            className={Styles.track}
                                            secondaryAction={
                                                <IconButton className={Styles.trackAction} size="large" color="secondary" edge="end" data-id={item.id} onClick={onDownloadTrackClick}>
                                                    <DownloadIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemAvatar color="success">
                                                <Avatar sx={{ backgroundColor: progressInfo?.completed ? "success.main" : progressInfo?.error ? "error.main" : "primary.main"}}>{item.playlist_autonumber}</Avatar>
                                            </ListItemAvatar>
                                            <Grid container direction="row" flexGrow={1}>
                                                <Grid size={4}>
                                                    <ListItemText primary={item.title} secondary={moment.duration(item.duration, "seconds").format("m:ss")} />
                                                </Grid>
                                                {progressInfo && <>
                                                    <Grid size={1} className={Styles.column}>
                                                        {progressInfo.completed ? <CheckIcon className={Styles.completedIcon} color="success" /> : progressInfo.error ? <CloseIcon className={Styles.completedIcon} color="error" /> : <Progress color="primary" value={progressInfo.percent} />}
                                                    </Grid>
                                                    <Grid size={1} className={Styles.column}>
                                                        <Typography variant="body1">{formatFileSize(item.filesize_approx)}</Typography>
                                                    </Grid>
                                                    <Grid size={6} className={Styles.column}>
                                                        <Typography variant="body1">{progressInfo.status}</Typography>
                                                    </Grid>
                                                </>
                                                }
                                            </Grid>
                                        </ListItem>);
                                    })}
                                </List>
                            </Grid>
                        </>
                    }
                </Grid>
                {/* <Grid className={Styles.footer}>
                    <Stack className={Styles.actions} direction="row" spacing={2}>
                        <Button variant="contained" color="secondary" disableElevation onClick={execute}>
                            {t("execute")}
                        </Button>
                    </Stack>
                </Grid> */}
            </Box>
            <MissingDetailsModal
                id="missing-details-modal"
                missingDetails={missingDetailsModalValue}
                open={missingDetailsModalOpen}
                onClose={onMissingDetailsModalClose}
            />
        </>
    );
};

export default HomeView;

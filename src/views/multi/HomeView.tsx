// import classnames from "classnames";
// import _filter from "lodash/filter";
// import _find from "lodash/find";
// import _first from "lodash/first";
// import _get from "lodash/get";
// import _isArray from "lodash/isArray";
// import _isEmpty from "lodash/isEmpty";
// import _isNaN from "lodash/isNaN";
// import _isNil from "lodash/isNil";
// import _keys from "lodash/keys";
// import _map from "lodash/map";
// import _pickBy from "lodash/pickBy";
// import _remove from "lodash/remove";
// import _replace from "lodash/replace";
// import _sumBy from "lodash/sumBy";
// import _times from "lodash/times";
// import _toString from "lodash/toString";
// import moment from "moment";
// import path from "path";
// import React, {useCallback, useEffect, useRef, useState} from "react";
// import {useTranslation} from "react-i18next";
// import YTDlpWrap, {Progress as YtDlpProgress} from "yt-dlp-wrap";

// import AddIcon from "@mui/icons-material/Add";
// import CheckIcon from "@mui/icons-material/Check";
// import CloseIcon from "@mui/icons-material/Close";
// import DownloadIcon from "@mui/icons-material/Download";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import {
//     Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Button, Card, CardContent,
//     CardMedia, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemText, Paper,
//     Stack, TextField, Typography
// } from "@mui/material";
// import Grid from "@mui/material/Grid2";

// import {formatFileSize} from "../../common/Helpers";
// import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
// import Progress from "../../components/progress/Progress";
// import SplitButton from "../../components/splitButton/SplitButton";
// import {useDataState} from "../../react/contexts/DataContext";
// import Styles from "./HomeView.styl";

// const isDev = process.env.NODE_ENV === "development";
// const binPath = _replace(!isDev ? path.join(process.resourcesPath, "bin") : path.join(__dirname, "resources", "bin"), /\\/g, "/");
// const ytDlpWrap = new YTDlpWrap(binPath + "/yt-dlp.exe");

// export type Process = {
//     id: string;
//     handle: Promise<void>;
// };

// export const HomeView: React.FC = () => {
//     const {t} = useTranslation();
//     const [url, setUrl] = useState("");
//     const [urls, setUrls] = useState<string[]>([
//         "https://music.youtube.com/playlist?list=OLAK5uy_nzbNRdBGgntynjoT_RsHWA2KToInapC1o",
//         "https://music.youtube.com/playlist?list=OLAK5uy_kVN_CwrbI9Q4jxktTycrp2NMv8ruVRRCU"
//     ]);
//     const {album, tracks, trackStatus, setAlbum, setTracks, setTrackStatus, clear} = useDataState();
//     const [loading, setLoading] = useState(false);
//     const [downloadStart, setDownloadStart] = useState(false);
//     const [expanded, setExpanded] = React.useState<string | false>(false);
//     const [missingDetailsModalValue, setMissingDetailsModalValue] = useState<string[]>([]);
//     const [missingDetailsModalOpen, setMissingDetailsModalOpen] = useState(false);
//     const trackStatusRef = useRef<TrackStatusInfo[]>(trackStatus);
//     const activeProcRef = useRef<Process[]>([]);
//     const activeProcMultiRef = useRef<Process[]>([]);
//     const appOptions = global.store.get("application");

//     const [multiState, setMultiState] = useState<Record<string, any>>({});

//     // const [album, setAlbum] = useState<AlbumInfo | undefined>();
//     // const [tracks, setTracks] = useState<TrackInfo[]>([]);

//     const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
//         setExpanded(isExpanded ? panel : false);
//     };

//     useEffect(() => {
//         if (!missingDetailsModalOpen && downloadStart) {
//             downloadAlbum();
//         }
//     }, [downloadStart, missingDetailsModalOpen]);

//     useEffect(() => {
//         trackStatusRef.current = trackStatus;
//     }, [trackStatus]);

//     const onUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setUrl(event.target.value);
//     };
    
//     const handleAddUrl = (event: React.MouseEvent<HTMLButtonElement>) => {
//         setUrls((prev) => [...prev, url]);
//     };

//     const handleRemoveUrl = (event: React.MouseEvent<HTMLButtonElement>) => {
//         setUrls((prev) => _remove([...prev], url));
//     };

//     const onMissingDetailsModalClose = (data: Record<string, string | number>) => {
//         setAlbum((prev) => ({...prev, ...data}));
//     };
    
//     const onProcessMultiEnd = (id: string) => {
//         const nextUrlDownload = _find(urls, (item) => {
//             return !_find(activeProcMultiRef.current, ["id", item]);
//         });
        
//         _remove(activeProcMultiRef.current, (proc) => proc.id === id);
        
//         if (!nextUrlDownload) return;

//         const nextPromise = retrieveInfoMulti(nextUrlDownload).then(onProcessMultiEnd);

//         activeProcMultiRef.current.push({id: nextUrlDownload, handle: nextPromise});
//     };
    
//     const handleDownloadAll = async (event: React.MouseEvent<HTMLButtonElement>) => {
//         _times(Math.min(appOptions.concurrency, urls.length), (num) => {
//             const u = urls[num];
            
//             activeProcMultiRef.current.push({id: u, handle: retrieveInfoMulti(u).then(onProcessMultiEnd)});
//         });

//         // for (const item of urls) {
//         //     await retrieveInfoMulti();
//         // }
//     };

//     const download = async () => {
//         await retrieveInfo();
//         setDownloadStart(true);
//     };

//     const resolveData = () => {
//         if (appOptions.debugMode) {
//             return new Promise((resolve) => {
//                 setTimeout(() => resolve(tracksMock), 1000);
//             });
//         } else {
//             return ytDlpWrap.getVideoInfo(url);
//         }
//     };
    
//     const retrieveInfoMulti = async (val: string) => {
//         // setLoading(true);
//         clearAlbum();

//         const info = await ytDlpWrap.getVideoInfo(val);
//         const items: TrackInfo[] = _isArray(info) ? info : [info];
//         const albumInfo = getAlbumInfo(items);

//         setMultiState((prev) => ({
//             ...prev, [val]: {
//                 tracks: items,
//                 album: albumInfo,
//         }}));
        
//         // setTracks(items);
//         // setAlbum(albumInfo);
//         // setLoading(false);
//         return val;
//     };

//     const retrieveInfo = useCallback(async () => {
//         setLoading(true);
//         clearAlbum();

//         const info = await resolveData();
//         const items: TrackInfo[] = _isArray(info) ? info : [info];
//         const albumInfo = getAlbumInfo(items);
//         const missingKeys = _keys(_pickBy(albumInfo, _isNil));
        
//         setTracks(items);
//         setAlbum(albumInfo);
//         setLoading(false);

//         if (!_isEmpty(missingKeys)) {
//             setMissingDetailsModalValue(missingKeys);
//             setMissingDetailsModalOpen(true);
//         }

//     }, [setTracks, setAlbum, url]);

//     const updateProgress = useCallback((trackId: string, progress: YtDlpProgress) => {        
//         setTrackStatus((prev) => _map(prev, (item) => {
//             if (item.trackId === trackId) {
//                 return {...item, percent: _isNaN(progress.percent) ? 0 : progress.percent};
//             } else {
//                 return item;
//             }
//         }));
//     }, [trackStatus, setTrackStatus]);
    
//     const updateProgressStatus = useCallback((trackId: string, eventType: string) => {
//         let status = "";

//         if (eventType === "youtube") {
//             status = t("reading");
//         } else if (eventType === "info") {
//             status = t("starting download");
//         } else if (eventType === "download") {
//             status = t("downloading");
//         } else if (eventType === "ExtractAudio") {
//             status = t("extractingAudio");
//         } else {
//             status = "";
//         }

//         setTrackStatus((prev) => _map(prev, (item) => {
//             if (item.trackId === trackId) {
//                 return {...item, status};
//             } else {
//                 return item;
//             }
//         }));
//     }, [trackStatus, setTrackStatus]);

//     const finishProgress = useCallback((trackId: string) => {
//         setTrackStatus((prev) => _map(prev, (item) => {
//             if (item.trackId === trackId) {
//                 return {...item, completed: true, status: ""};
//             } else {
//                 return item;
//             }
//         }));
//         _remove(activeProcRef.current, (proc) => proc.id === trackId);
//     }, [trackStatus, setTrackStatus]);

//     const finishProgressWithError = useCallback((trackId: string, error: Error) => {
//         setTrackStatus((prev) => _map(prev, (item) => {
//             if (item.trackId === trackId) {
//                 return {...item, status: error.message, error: true};
//             } else {
//                 return item;
//             }
//         }));
//         _remove(activeProcRef.current, (proc) => proc.id === trackId);
//     }, [trackStatus, setTrackStatus]);

//     const onProcessEnd = useCallback(() => {
//         const nextTrackToDownload = _find(tracks, (item) => {
//             return !_find(trackStatusRef.current, ["trackId", item.id]);
//         });

//         if (!nextTrackToDownload) return;

//         const nextPromise = downloadTrack(nextTrackToDownload.id).then(onProcessEnd);

//         activeProcRef.current.push({id: nextTrackToDownload.id, handle: nextPromise});
//     }, [tracks, trackStatusRef]);

//     const downloadAlbum = () => {
//         _times(appOptions.concurrency, (num) => {
//             const id = tracks[num].id;
            
//             if (!id) return;
            
//             activeProcRef.current.push({id, handle: downloadTrack(id).then(onProcessEnd)});
//         });
//     };

//     const retryFailedDownloads = async () => {
//         const failedTracks = _filter(trackStatusRef.current, "error");
//         for (const failed of failedTracks) {
//             const promise = downloadTrack(failed.trackId);
            
//             activeProcRef.current.push({id: failed.trackId, handle: promise});
//             await promise;
//         }
//     };

//     const clearAlbum = () => {
//         clear();
//         setDownloadStart(false);
//     };
    
//     const onDownloadTrackClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
//         const trackId = event.currentTarget.getAttribute("data-id");
//         downloadTrack(trackId);
//     };

//     const downloadTrack = async (trackId: string) => {
//         const track = _find(tracks, ["id", trackId]);

//         if (!track) return;

//         const newTrackProgressInfo = {
//             trackId: track.id,
//             percent: 0,
//             totalSize: _toString(track.filesize_approx),
//         };
        
//         setTrackStatus((prev) => [...prev, newTrackProgressInfo]);

//         const result = await new Promise<boolean>((resolve, reject) => {
//             const title = track.title.replace(/"/g, "\\\"");
//             const artist = album.artist.replace(/"/g, "\\\"");
//             const albumTitle = album.title.replace(/"/g, "\\\"");
 

//             const ytDlpEventEmitter = ytDlpWrap
//                 .exec([
//                     track.original_url,
//                     "--extract-audio",
//                     "--audio-format", "mp3",
//                     "--audio-quality", _toString(appOptions.quality),
//                     "--postprocessor-args", `-metadata title="${title}" -metadata artist="${artist}" -metadata album="${albumTitle}" -metadata track="${track.playlist_autonumber}" -metadata date="${album.releaseYear}" -metadata release_year="${album.releaseYear}"`,
//                     "--output", `./${appOptions.outputDirectory}/${album.artist}/[${album.releaseYear}] ${album.title}/${track.playlist_autonumber} - ${track.title}.mp3`
//                 ])
//                 .on("progress", (progress) => updateProgress(track.id, progress))
//                 .on("ytDlpEvent", (eventType) => updateProgressStatus(track.id, eventType))
//                 .on("error", (error) => {
//                     reject(error);
//                 })
//                 .on("close", () => {
//                     // if ([2,4,7].includes(track.playlist_autonumber)) {
//                     //     return reject(new TypeError("dupa"));
//                     // }
//                     resolve(true);
//                 });

//             console.log(ytDlpEventEmitter.ytDlpProcess.pid);
//         }).catch((error => {
//             finishProgressWithError(track.id, error);
//         }));

//         if (result) {
//             finishProgress(track.id);
//         }
//     };

//     const getAlbumInfo = (items: TrackInfo[]): AlbumInfo => {
//         const item = _first(items);

//         return {
//             artist: _get(item, "creators.0", item.artist),
//             title: item.album,
//             releaseYear: item.release_year,
//             tracksNumber: item.playlist_count,
//             duration: _sumBy(items, "duration"),
//             thumbnail: _get(_find(item.thumbnails, ["id", "2"]), "url", item.thumbnail),
//         };
//     };

//     const getTrackStatusInfo = useCallback((track: TrackInfo): TrackStatusInfo => {
//         const trackStatusInfo = _find(trackStatus, ["trackId", track.id]);

//         if (!trackStatusInfo) {
//             return;
//         }

//         return trackStatusInfo;
//     }, [trackStatus]);


//     return (
//         <>
//             <Box className={Styles.home}>
//                 {/* <Grid className={Styles.header} container spacing={2} padding={2}>
//                     <Grid size={10}>
//                         <TextField fullWidth label={t("youtubeUrl")} variant="outlined" value={url} onChange={onUrlChange} />
//                     </Grid>
//                     <Grid size={2}>
//                         <SplitButton loading={loading || !_isEmpty(activeProcRef.current)} labels={[t("download"), t("load")]} handlers={[download, retrieveInfo]} fullWidth variant="contained" color="secondary" disableElevation />
//                     </Grid>
//                 </Grid> */}
//                 <Grid className={Styles.header} container spacing={2} padding={2}>
//                     <Grid size={10}>
//                         <TextField fullWidth label={t("youtubeUrl")} variant="outlined" value={url} onChange={onUrlChange} />
//                     </Grid>
//                     <Grid size={2}>
//                         <Button loading={loading || !_isEmpty(activeProcRef.current)} onClick={handleAddUrl} fullWidth variant="contained" color="secondary" disableElevation><AddIcon /></Button>
//                     </Grid>
//                 </Grid>
//                 <Grid className={Styles.content} container spacing={2} padding={2}>
//                     {loading && <CircularProgress color="primary" thickness={5} size={80} />}
//                     <Grid size={12} alignSelf="start" spacing={2}>
//                         {_map(urls, (item) =>
//                             <Accordion key={item} expanded={expanded === item} onChange={handleChange(item)} component={Paper} variant="outlined" sx={{backgroundColor: "var(--theme-palette-common-background)"}}>
//                                 <AccordionSummary  expandIcon={<ExpandMoreIcon />}>
//                                     <Typography component="span" >
//                                         {item}
//                                     </Typography>
//                                 </AccordionSummary>
//                                 <AccordionDetails>
//                                 {multiState[item]?.tracks && multiState[item]?.album &&
//                         <>
//                             <Grid size={12}>
//                                 <Card variant="outlined" className={Styles.albumHeader}>
//                                     <CardMedia
//                                         component="img"
//                                         sx={{width: 100}}
//                                         image={multiState[item].album.thumbnail}
//                                         alt={multiState[item].album.title}
//                                     />
//                                     <Box className={Styles.albumHeaderContent}>
//                                         <CardContent className={Styles.albumHeaderInfo}>
//                                             <div className={Styles.row}>
//                                                 <Typography variant="h6" className={classnames(Styles.label, Styles.bold)}>{multiState[item].album.title}</Typography>
//                                                 <Typography variant="h6" sx={{color: "secondary.main"}}>{t("by")} {multiState[item].album.artist}</Typography>
//                                             </div>
//                                             <div className={Styles.row}>
//                                                 <Typography variant="subtitle2" className={Styles.label}>{t("releaseYear")}:</Typography>
//                                                 <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{multiState[item].album.releaseYear}</Typography>
//                                             </div>
//                                             <div className={Styles.row}>
//                                                 <Typography variant="subtitle2" className={Styles.label}>{t("duration")}:</Typography>
//                                                 <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{moment.duration(multiState[item].album.duration, "seconds").format("m:ss")}</Typography>
//                                             </div>
//                                         </CardContent>
//                                         <Box className={Styles.albumHeaderActions} padding={2} gap={1}>
//                                             <Button fullWidth variant="contained" color="secondary" disableElevation onClick={clearAlbum}>
//                                                 {t("clear")}
//                                             </Button>
//                                             {!_isEmpty(trackStatus) && !_isEmpty(_filter(trackStatus, "error")) &&
//                                                 <Button fullWidth variant="contained" color="secondary" disableElevation disabled={!_isEmpty(activeProcRef.current)} onClick={retryFailedDownloads}>
//                                                     {t("retry")}
//                                                 </Button>
//                                             }
//                                             {(_isEmpty(trackStatus) || ((_filter(trackStatus, "completed")).length + (_filter(trackStatus, "error")).length) < tracks.length) &&
//                                                 <Button fullWidth variant="contained" color="secondary" disableElevation onClick={downloadAlbum} disabled={!_isEmpty(activeProcRef.current)}>
//                                                     {t("download")}
//                                                 </Button>
//                                             }
//                                         </Box>
//                                     </Box>
//                                 </Card>
//                             </Grid>
//                             <Grid size={12}>
//                                 <List className={Styles.trackList} dense>
//                                     {_map(multiState[item].tracks, (tr) => {
//                                         const progressInfo = getTrackStatusInfo(tr);

//                                         return (<ListItem
//                                             divider
//                                             dense
//                                             key={tr.id}
//                                             className={Styles.track}
//                                             secondaryAction={
//                                                 <IconButton className={Styles.trackAction} size="large" color="secondary" edge="end" data-id={tr.id} onClick={onDownloadTrackClick}>
//                                                     <DownloadIcon />
//                                                 </IconButton>
//                                             }
//                                         >
//                                             <ListItemAvatar color="success">
//                                                 <Avatar sx={{ backgroundColor: progressInfo?.completed ? "success.main" : progressInfo?.error ? "error.main" : "primary.main"}}>{tr.playlist_autonumber}</Avatar>
//                                             </ListItemAvatar>
//                                             <Grid container direction="row" flexGrow={1}>
//                                                 <Grid size={4}>
//                                                     <ListItemText primary={tr.title} secondary={moment.duration(tr.duration, "seconds").format("m:ss")} />
//                                                 </Grid>
//                                                 {progressInfo && <>
//                                                     <Grid size={1} className={Styles.column}>
//                                                         {progressInfo.completed ? <CheckIcon className={Styles.completedIcon} color="success" /> : progressInfo.error ? <CloseIcon className={Styles.completedIcon} color="error" /> : <Progress color="primary" value={progressInfo.percent} />}
//                                                     </Grid>
//                                                     <Grid size={1} className={Styles.column}>
//                                                         <Typography variant="body1">{formatFileSize(tr.filesize_approx)}</Typography>
//                                                     </Grid>
//                                                     <Grid size={6} className={Styles.column}>
//                                                         <Typography variant="body1">{progressInfo.status}</Typography>
//                                                     </Grid>
//                                                 </>
//                                                 }
//                                             </Grid>
//                                         </ListItem>);
//                                     })}
//                                 </List>
//                             </Grid>
//                         </>
//                     }
//                                 </AccordionDetails>
//                             </Accordion>
//                         )};
//                     </Grid>
//                     {!loading && tracks && album &&
//                         <>
//                             <Grid size={12}>
//                                 <Card variant="outlined" className={Styles.albumHeader}>
//                                     <CardMedia
//                                         component="img"
//                                         sx={{width: 100}}
//                                         image={album.thumbnail}
//                                         alt={album.title}
//                                     />
//                                     <Box className={Styles.albumHeaderContent}>
//                                         <CardContent className={Styles.albumHeaderInfo}>
//                                             <div className={Styles.row}>
//                                                 <Typography variant="h6" className={classnames(Styles.label, Styles.bold)}>{album.title}</Typography>
//                                                 <Typography variant="h6" sx={{color: "secondary.main"}}>{t("by")} {album.artist}</Typography>
//                                             </div>
//                                             <div className={Styles.row}>
//                                                 <Typography variant="subtitle2" className={Styles.label}>{t("releaseYear")}:</Typography>
//                                                 <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{album.releaseYear}</Typography>
//                                             </div>
//                                             <div className={Styles.row}>
//                                                 <Typography variant="subtitle2" className={Styles.label}>{t("duration")}:</Typography>
//                                                 <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{moment.duration(album.duration, "seconds").format("m:ss")}</Typography>
//                                             </div>
//                                         </CardContent>
//                                         <Box className={Styles.albumHeaderActions} padding={2} gap={1}>
//                                             <Button fullWidth variant="contained" color="secondary" disableElevation onClick={clearAlbum}>
//                                                 {t("clear")}
//                                             </Button>
//                                             {!_isEmpty(trackStatus) && !_isEmpty(_filter(trackStatus, "error")) &&
//                                                 <Button fullWidth variant="contained" color="secondary" disableElevation disabled={!_isEmpty(activeProcRef.current)} onClick={retryFailedDownloads}>
//                                                     {t("retry")}
//                                                 </Button>
//                                             }
//                                             {(_isEmpty(trackStatus) || ((_filter(trackStatus, "completed")).length + (_filter(trackStatus, "error")).length) < tracks.length) &&
//                                                 <Button fullWidth variant="contained" color="secondary" disableElevation onClick={downloadAlbum} disabled={!_isEmpty(activeProcRef.current)}>
//                                                     {t("download")}
//                                                 </Button>
//                                             }
//                                         </Box>
//                                     </Box>
//                                 </Card>
//                             </Grid>
//                             <Grid size={12}>
//                                 <List className={Styles.trackList} dense>
//                                     {_map(tracks, (item) => {
//                                         const progressInfo = getTrackStatusInfo(item);

//                                         return (<ListItem
//                                             divider
//                                             dense
//                                             key={item.id}
//                                             className={Styles.track}
//                                             secondaryAction={
//                                                 <IconButton className={Styles.trackAction} size="large" color="secondary" edge="end" data-id={item.id} onClick={onDownloadTrackClick}>
//                                                     <DownloadIcon />
//                                                 </IconButton>
//                                             }
//                                         >
//                                             <ListItemAvatar color="success">
//                                                 <Avatar sx={{ backgroundColor: progressInfo?.completed ? "success.main" : progressInfo?.error ? "error.main" : "primary.main"}}>{item.playlist_autonumber}</Avatar>
//                                             </ListItemAvatar>
//                                             <Grid container direction="row" flexGrow={1}>
//                                                 <Grid size={4}>
//                                                     <ListItemText primary={item.title} secondary={moment.duration(item.duration, "seconds").format("m:ss")} />
//                                                 </Grid>
//                                                 {progressInfo && <>
//                                                     <Grid size={1} className={Styles.column}>
//                                                         {progressInfo.completed ? <CheckIcon className={Styles.completedIcon} color="success" /> : progressInfo.error ? <CloseIcon className={Styles.completedIcon} color="error" /> : <Progress color="primary" value={progressInfo.percent} />}
//                                                     </Grid>
//                                                     <Grid size={1} className={Styles.column}>
//                                                         <Typography variant="body1">{formatFileSize(item.filesize_approx)}</Typography>
//                                                     </Grid>
//                                                     <Grid size={6} className={Styles.column}>
//                                                         <Typography variant="body1">{progressInfo.status}</Typography>
//                                                     </Grid>
//                                                 </>
//                                                 }
//                                             </Grid>
//                                         </ListItem>);
//                                     })}
//                                 </List>
//                             </Grid>
//                         </>
//                     }
//                 </Grid>
//                 <Grid className={Styles.footer}>
//                     <Stack className={Styles.actions} direction="row" spacing={2}>
//                         <Button variant="contained" color="secondary" disableElevation onClick={handleDownloadAll}>
//                             {t("download")}
//                         </Button>
//                     </Stack>
//                 </Grid>
//             </Box>
//         </>
//     );
// };

// export default HomeView;

import _assign from "lodash/assign";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _forEach from "lodash/forEach";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _join from "lodash/join";
import _map from "lodash/map";
import _omit from "lodash/omit";
import _omitBy from "lodash/omitBy";
import _pick from "lodash/pick";
import _pullAt from "lodash/pullAt";
import _split from "lodash/split";
import _sumBy from "lodash/sumBy";
import _toInteger from "lodash/toInteger";
import _toString from "lodash/toString";
import _values from "lodash/values";
import moment from "moment";
import React, {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {NumberFormatBase} from "react-number-format";

import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import LaunchIcon from "@mui/icons-material/Launch";
import YouTubeIcon from "@mui/icons-material/YouTube";
import {
    Avatar, Button, Fade, Grid, List, ListItem, ListItemText, Popover, Slider, Stack, TextField,
    Tooltip, Typography
} from "@mui/material";

import {formatFileSize} from "../../../common/Helpers";
import {TrackInfo, TrackStatusInfo} from "../../../common/Youtube";
import {useDataState} from "../../../react/contexts/DataContext";
import DetailsModal from "../../modals/detailsModal/DetailsModal";
import Progress from "../../progress/Progress";
import Styles from "./TrackList.styl";

export type TrackListProps = {
    items?: TrackInfo[];
    onDownloadTrack?: (id: string) => void;
    onCancelTrack?: (id: string) => void;
    onOpenFile?: (id: string) => void;
    onOpenUrl?: (url: string) => void;
    queue: string[];
};

export const TrackList: React.FC<TrackListProps> = (props: TrackListProps) => {
    const {items, onDownloadTrack, onCancelTrack, onOpenFile, onOpenUrl, queue} = props;
    const {tracks, trackStatus, trackCuts, setTracks, setTrackStatus, setTrackCuts} = useDataState();
    const [cutAnchorEl, setCutAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [cutOpen, setCutOpen] = useState<string>();
    const [value, setValue] = useState(items ?? tracks);
    const [currentTrack, setCurrentTrack] = useState<TrackInfo>();
    const {t} = useTranslation();

    useEffect(() => {
        setValue(items ?? tracks);
    }, [items, tracks]);

    const formatTime = (value: string) => {
        const formatted = moment.duration(value, "seconds").format("HH:mm:ss", {trim: "left"});
        
        if (/^\d{2}$/.test(formatted)) {
            return `00:${formatted}`;
        }

        return formatted;
    };

    const unformatTime = (value: string) => {
        if (/^\d{2}$/.test(value)) {
            return moment.duration(`00:00:${value}`).asSeconds() + "";
        }

        return moment.duration(`00:${value}`).asSeconds() + "";
    };

    const timeStringToNumber = (value: string) => {
        return moment.duration(`00:${value}`).asSeconds();
    };

    const sanitizeTrackCuts = (source: {[key: string]: [number, number][]}) => {
        _forEach(source, (v, k) => {
            const track = _find(value, ["id", k]);
            
            const sanitizedCuts = _values(_omitBy(v, (val) => {
                return val[0] === 0 && val[1] === track.duration;
            }));

            source[k] = sanitizedCuts;
        });

        return source;
    };

    const onDownloadTrackClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");
        setTrackStatus((prev) => _filter(prev, (item) => item.trackId !== trackId));

        if (_isFunction(onDownloadTrack)) {
            onDownloadTrack(trackId);
        }
    };
    
    const onOpenInBrowser = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");
        const track = _find(value, ["id", trackId]);

        if (_isFunction(onOpenUrl)) {
            onOpenUrl(track.original_url);
        }
    };

    const onFindFileInSystem = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");

        if (_isFunction(onOpenFile)) {
            onOpenFile(trackId);
        }
    };
    
    const onEditTrack = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");
        const track = _find(tracks, ["id", trackId]);

        setCurrentTrack(track);
    }, [currentTrack, setCurrentTrack]);
    
    const onTrackDetailsModalClose = (data: TrackInfo) => {
        setTracks((prev) => _map(prev, (item) => {
            if (item.id === currentTrack.id) {
                return _assign(item, data);
            }
            
            return item;
        }));
        setCurrentTrack(null);
    };

    const onOpenTrackCut = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");

        if (_isEmpty(trackCuts[trackId])) {
            const track = _find(value, ["id", trackId]);

            setTrackCuts((prev) => ({...prev, [trackId]: [[0, track.duration]]}));
        }

        setCutAnchorEl(event.currentTarget);
        setCutOpen(trackId);
    };
    
    const onDeleteTrackCut = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");
        const trackCutIndex = _toInteger(event.currentTarget.getAttribute("data-index"));

        setTrackCuts((prev) => {
            const prevTrackCuts = prev[trackId];

            _pullAt(prevTrackCuts, trackCutIndex);
            
            if (_isEmpty(prevTrackCuts)) {
                return _omit(prev, [trackId]);
            }

            return {
                ...prev,
                [trackId]: prevTrackCuts,
            };
        });

        if (trackCuts[trackId].length <= 0) {
            onCloseTrackCut();
        }
    };
    
    const onAddTrackCut = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");
        const track = _find(value, ["id", cutOpen]);

        setTrackCuts((prev) => ({...prev, [trackId]: [...prev[cutOpen], [0, track.duration]]}));;
    };

    const onCloseTrackCut = () => {
        setTrackCuts((prev) => sanitizeTrackCuts(prev));
        setCutAnchorEl(null);
        setCutOpen(null);
    };

    const onCancelTrackClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");

        if (_isFunction(onCancelTrack)) {
            onCancelTrack(trackId);
        }
    };

    const onCutStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const track = _find(value, ["id", cutOpen]);
        const index = _toInteger(e.currentTarget.getAttribute("data-index"));

        setTrackCuts((prev) => {
            const cuts = prev[cutOpen];
            const cut = cuts[index];
            cuts[index] = [timeStringToNumber(e.target.value), _get(cut, "1", track.duration)];
            
            return {...prev, [cutOpen]: cuts};
        });
    };

    const onCutEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const index = _toInteger(e.currentTarget.getAttribute("data-index"));
        
        setTrackCuts((prev) => {
            const cuts = prev[cutOpen];
            const cut = cuts[index];
            cuts[index] = [_get(cut, "0", 0), timeStringToNumber(e.target.value)];
            
            return {...prev, [cutOpen]: cuts};
        });
    };
    
    const onCutTimeChange = (event: Event, newValue: number | number[], activeThumb: number) => {
        if (!Array.isArray(newValue)) {
            return;
        }
        const track = _find(value, ["id", cutOpen]);
        const index = _toInteger((event.target as any).name);

        if (activeThumb === 0) {
            setTrackCuts((prev) => {
                const cuts = prev[cutOpen];
                const cut = cuts[index];
                cuts[index] = [newValue[0], _get(cut, "1", track.duration)];
                
                return {...prev, [cutOpen]: cuts};
            });
        } else {
            setTrackCuts((prev) => {
                const cuts = prev[cutOpen];
                const cut = cuts[index];
                cuts[index] = [_get(cut, "0", 0), newValue[1]];
                
                return {...prev, [cutOpen]: cuts};
            });
        }
    };

    const renderLineBreaks = (value: string) => {
        return _map(_split(value, "\n"), (v, k) => <React.Fragment key={k}>{v}<br /></React.Fragment>);
    };

    const resolveTrackCutsText = (track: TrackInfo) => {
        const cuts = trackCuts[track.id];
        
        if (cuts.length === 0) {
            return "";
        } else if (cuts.length === 1) {
            return `${formatTime(_toString(cuts[0][0]))} - ${formatTime(_toString(cuts[0][1]))}`;
        } else {
            return `${moment.duration(_sumBy(cuts, (cut) => cut[1] - cut[0]), "seconds").format("hh:mm:ss", {trim: "left", stopTrim: "m"})} (${cuts.length})`;
        }
    };
    
    const resolveTrackCutsTooltipText = (track: TrackInfo) => {
        return renderLineBreaks(_join(_map(trackCuts[track.id], (cut) =>
            `${formatTime(_toString(cut[0]))} - ${formatTime(_toString(cut[1]))}`
        ), "\n"));
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
            <Grid size={12} className={Styles.trackList}>
                <List className={Styles.trackList} dense>
                    {_map(value, (item) => {
                        const info = getTrackStatusInfo(item);
                        const open = Boolean(cutAnchorEl) && cutOpen === item.id;
                        const cuts = _get(trackCuts, `${item.id}`, []);

                        return (<ListItem
                            divider
                            dense
                            key={item.id}
                            className={Styles.track}
                            data-help="trackInfo"
                            secondaryAction={
                                <Stack direction="row" spacing={1.25} className={Styles.actions}>
                                    <Tooltip title={t("edit")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                        <Button data-help="editTrack" className={Styles.trackAction} size="small" color="primary" disableElevation variant="contained" data-id={item.id} onClick={onEditTrack}>
                                            <EditIcon />
                                        </Button>
                                    </Tooltip>
                                    {info?.completed &&
                                        <Tooltip title={t("findFileInSystem")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                            <Button data-help="findInFileSystem" className={Styles.trackAction} size="small" color="primary" disableElevation variant="contained" data-id={item.id} onClick={onFindFileInSystem}>
                                                <LaunchIcon />
                                            </Button>
                                        </Tooltip>
                                    }
                                    {!_includes(queue, item.id) &&
                                        <div>
                                            <Tooltip title={t("cut")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                                <Button data-help="cut" size="small" className={Styles.trackAction} color="primary" disableElevation variant="contained" data-id={item.id} onClick={onOpenTrackCut}>
                                                    <ContentCutIcon />
                                                </Button>
                                            </Tooltip>
                                            <Popover
                                                id={item.id}
                                                open={open}
                                                TransitionComponent={Fade}
                                                TransitionProps={{
                                                    unmountOnExit: true,
                                                    mountOnEnter: true,
                                                }}
                                                anchorEl={cutAnchorEl}
                                                onClose={onCloseTrackCut}
                                                anchorOrigin={{
                                                    vertical: "center",
                                                    horizontal: "left",
                                                }}
                                                transformOrigin={{
                                                    vertical: "center",
                                                    horizontal: "right",
                                                }}
                                            >
                                                <Grid container padding={0} spacing={0} className={Styles.trackCutPopup}>
                                                    {_map(cuts, (cut, index) =>
                                                        <Grid container padding={2} paddingBottom={0} spacing={1} key={index}>
                                                            <Grid size={5}>
                                                                <NumberFormatBase
                                                                    size="small"
                                                                    slotProps={{
                                                                        htmlInput: {
                                                                            "data-index": index,
                                                                        }
                                                                    }}
                                                                    value={cut[0] ?? 0}
                                                                    onChange={onCutStartTimeChange}
                                                                    format={formatTime}
                                                                    removeFormatting={unformatTime}
                                                                    customInput={TextField}
                                                                    variant="outlined"
                                                                    label={t("from")}
                                                                />
                                                            </Grid>
                                                            <Grid size={5}>
                                                                <NumberFormatBase
                                                                    size="small"
                                                                    slotProps={{
                                                                        htmlInput: {
                                                                            "data-index": index,
                                                                        }
                                                                    }}
                                                                    value={cut[1] ?? item.duration}
                                                                    onChange={onCutEndTimeChange}
                                                                    format={formatTime}
                                                                    removeFormatting={unformatTime}
                                                                    customInput={TextField}
                                                                    variant="outlined"
                                                                    label={t("to")}
                                                                />
                                                            </Grid>
                                                            <Grid size={2} display="flex">
                                                                <Button className={Styles.deleteCutButton} data-id={item.id} data-index={index} disableElevation variant="contained" fullWidth color="secondary" onClick={onDeleteTrackCut}>
                                                                    <DeleteForeverIcon />
                                                                </Button>
                                                            </Grid>
                                                            <Grid size={12} display="flex" paddingX={2}>
                                                                <Slider
                                                                    name={_toString(index)}
                                                                    data-index={index}
                                                                    value={!_isEmpty(cut) ? cut : [0, item.duration]}
                                                                    onChange={onCutTimeChange}
                                                                    valueLabelDisplay="off"
                                                                    min={0}
                                                                    max={item.duration}
                                                                    step={1}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    )}   
                                                    <Grid size={12} className={Styles.addTrackCutRow} padding={1}>
                                                        <Button data-id={item.id} disableElevation variant="contained" color="primary" onClick={onAddTrackCut}>
                                                            <AddIcon />
                                                        </Button>
                                                    </Grid>
                                                </Grid>
                                            </Popover>
                                        </div>
                                    }
                                    <Tooltip title={t("openInBrowser")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                        <Button data-help="openInBrowser" className={Styles.trackAction} size="small" color="primary" disableElevation variant="contained" data-id={item.id} onClick={onOpenInBrowser}>
                                            <YouTubeIcon />
                                        </Button>
                                    </Tooltip>
                                    {!_includes(queue, item.id) &&
                                        <Tooltip title={t("download")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                            <div>
                                                <Button disabled={_includes(queue, "load-single") || _includes(queue, "load-multi")} data-help="downloadTrack" className={Styles.trackAction} size="small" color="primary" disableElevation variant="contained" data-id={item.id} onClick={onDownloadTrackClick}>
                                                    <DownloadIcon />
                                                </Button>
                                            </div>
                                        </Tooltip>
                                    }
                                    {_includes(queue, item.id) &&
                                        <Tooltip title={t("cancel")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                            <Button data-help="cancelDownloadTrack" size="small" className={Styles.trackAction} color="primary" disableElevation variant="contained" data-id={item.id} onClick={onCancelTrackClick}>
                                                <CloseIcon />
                                            </Button>
                                        </Tooltip>
                                    }
                                </Stack>
                            }
                        >
                            <Grid container direction="row" flexGrow={1}>
                                {item.playlist_autonumber &&
                                    <Grid size={1} className={Styles.numberColumn}>
                                        <Typography className={Styles.number} variant="body1" color="primary.main">{item.playlist_autonumber}</Typography>
                                    </Grid>
                                }
                                <Grid size={1} className={Styles.imageColumn}>
                                    <Avatar className={Styles.image} src={item.thumbnail}>{item.playlist_autonumber}</Avatar>
                                </Grid>
                                <Grid size={3.25}>
                                    <ListItemText primary={item.title} secondary={moment.duration(item.duration, "seconds").format("mm:ss", { trim: false})} />
                                </Grid>
                                <Grid size={2} className={Styles.column}>
                                    {!_isEmpty(trackCuts[item.id]) &&
                                        <Tooltip title={resolveTrackCutsTooltipText(item)} arrow enterDelay={1000} leaveDelay={100} enterNextDelay={250} placement="top">
                                            <div className={Styles.column}>
                                                <ContentCutIcon className={Styles.cutIcon} color="action" />
                                                <Typography variant="caption">{resolveTrackCutsText(item)}</Typography>
                                            </div>
                                        </Tooltip>
                                    }
                                </Grid>
                                {info && !info.skipped && <>
                                    <Grid size={1} className={Styles.column}>
                                        {!info.error && <Typography variant="body1">{formatFileSize(info.totalSize)}</Typography>}
                                    </Grid>
                                    <Grid size={.75} className={Styles.column}>
                                        {info.completed ?
                                            <CheckIcon className={Styles.completedIcon} color="success" />
                                            : info.error ?
                                                <CloseIcon className={Styles.completedIcon} color="error" />
                                                : <Progress color="primary" value={info.percent} />
                                        }
                                    </Grid>
                                    <Grid size={2.75} className={Styles.column}>
                                        <Typography variant="body1">{info.status}</Typography>
                                    </Grid>
                                </>
                                }
                            </Grid>
                        </ListItem>);
                    })}
                </List>
            </Grid>
            <DetailsModal
                id="track-details-modal"
                details={_pick(currentTrack, ["title"])}
                open={!!currentTrack}
                onClose={onTrackDetailsModalClose}
            />
        </>
    );
};

export default TrackList;

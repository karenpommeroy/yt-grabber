import _filter from "lodash/filter";
import _find from "lodash/find";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _map from "lodash/map";
import _omit from "lodash/omit";
import _omitBy from "lodash/omitBy";
import _toString from "lodash/toString";
import moment from "moment";
import React, {useCallback, useState} from "react";
import {useTranslation} from "react-i18next";
import {NumberFormatBase} from "react-number-format";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DownloadIcon from "@mui/icons-material/Download";
import LaunchIcon from "@mui/icons-material/Launch";
import YouTubeIcon from "@mui/icons-material/YouTube";
import {
    Avatar, Button, Fade, List, ListItem, ListItemText, Popover, Slider, Stack, TextField, Tooltip,
    Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {formatFileSize} from "../../../common/Helpers";
import {TrackInfo, TrackStatusInfo} from "../../../common/Youtube";
import {useDataState} from "../../../react/contexts/DataContext";
import Progress from "../../progress/Progress";
import Styles from "./TrackList.styl";

export type TrackListProps = {
    onDownloadTrack?: (id: string) => void;
    onCancelTrack?: (id: string) => void;
    onOpenFile?: (id: string) => void;
    onOpenUrl?: (url: string) => void;
    queue: string[];
};

export const TrackList: React.FC<TrackListProps> = (props: TrackListProps) => {
    const {onDownloadTrack, onCancelTrack, onOpenFile, onOpenUrl, queue} = props;
    const {tracks, trackStatus, trackCuts, setTrackStatus, setTrackCuts} = useDataState();
    const [cutAnchorEl, setCutAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [cutOpen, setCutOpen] = useState<string>();
    const {t} = useTranslation();

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

    const sanitizeTrackCuts = (source: {[key: string]: number[]}) => {
        return _omitBy(source, (v, k) => {
            const track = _find(tracks, ["id", k]);
            
            return v[0] === 0 && v[1] === track.duration;
        });
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
        const track = _find(tracks, ["id", trackId]);

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

    const onOpenTrackCut = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");

        setCutAnchorEl(event.currentTarget);
        setCutOpen(trackId);
    };
    
    const onDeleteTrackCut = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");

        setTrackCuts((prev) => _omit(prev, [trackId]));
        onCloseTrackCut();
    };

    const onCloseTrackCut = () => {
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
        const track = _find(tracks, ["id", cutOpen]);

        setTrackCuts((prev) => sanitizeTrackCuts({...prev, [cutOpen]: [timeStringToNumber(e.target.value), _get(prev, `${cutOpen}.1`, track.duration) as number]}));
    };

    const onCutEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTrackCuts((prev) => sanitizeTrackCuts({...prev, [cutOpen]: [_get(prev, `${cutOpen}.0`, 0) as number, timeStringToNumber(e.target.value)]}));
    };

    const onCutTimeChange = (event: Event, value: number | number[], activeThumb: number) => {
        if (!Array.isArray(value)) {
            return;
        }
        
        const track = _find(tracks, ["id", cutOpen]);

        if (activeThumb === 0) {
            setTrackCuts((prev) => sanitizeTrackCuts({...prev, [cutOpen]: [value[0], _get(prev, `${cutOpen}.1`, track.duration) as number]}));
        } else {
            setTrackCuts((prev) => sanitizeTrackCuts({...prev, [cutOpen]: [_get(prev, `${cutOpen}.0`, 0) as number, value[1]]}));
        }
    };

    const getTrackStatusInfo = useCallback((track: TrackInfo): TrackStatusInfo => {
        const trackStatusInfo = _find(trackStatus, ["trackId", track.id]);

        if (!trackStatusInfo) {
            return;
        }

        return trackStatusInfo;
    }, [trackStatus]);

    return (
        <Grid size={12} className={Styles.trackList}>
            <List className={Styles.trackList} dense>
                {_map(tracks, (item) => {
                    const info = getTrackStatusInfo(item);
                    const open = Boolean(cutAnchorEl) && cutOpen === item.id;

                    return (<ListItem
                        divider
                        dense
                        key={item.id}
                        className={Styles.track}
                        secondaryAction={
                            <Stack direction="row" spacing={1.5} className={Styles.actions}>
                                {info?.completed &&
                                    <Tooltip title={t("findFileInSystem")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                        <Button className={Styles.trackAction} size="small" color="primary" disableElevation variant="contained" data-id={item.id} onClick={onFindFileInSystem}>
                                            <LaunchIcon />
                                        </Button>
                                    </Tooltip>
                                }
                                {!_includes(queue, item.id) &&
                                    <div>
                                        <Tooltip title={t("cut")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                            <Button size="small" className={Styles.trackAction} color="primary" disableElevation variant="contained" data-id={item.id} onClick={onOpenTrackCut}>
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
                                            <Grid container padding={2} spacing={1} className={Styles.trackCutPopup}>
                                                <Grid size={5}>
                                                    <NumberFormatBase
                                                        value={_get(trackCuts, `${item.id}.0`, 0) as number}
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
                                                        value={_get(trackCuts, `${item.id}.1`, item.duration) as number}
                                                        onChange={onCutEndTimeChange}
                                                        format={formatTime}
                                                        removeFormatting={unformatTime}
                                                        customInput={TextField}
                                                        variant="outlined"
                                                        label={t("to")}
                                                    />
                                                </Grid>
                                                <Grid size={2} display="flex">
                                                    <Button data-id={item.id} disableElevation variant="contained" fullWidth color="secondary" onClick={onDeleteTrackCut}>
                                                        <DeleteForeverIcon />
                                                    </Button>
                                                </Grid>
                                                <Grid size={12} display="flex" paddingX={2}>
                                                    <Slider
                                                        value={trackCuts[item.id] ?? [0, item.duration]}
                                                        onChange={onCutTimeChange}
                                                        valueLabelDisplay="off"
                                                        min={0}
                                                        max={item.duration}
                                                        step={1}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Popover>
                                    </div>
                                }
                                <Tooltip title={t("openInBrowser")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                    <Button className={Styles.trackAction} size="small" color="primary" disableElevation variant="contained" data-id={item.id} onClick={onOpenInBrowser}>
                                        <YouTubeIcon />
                                    </Button>
                                </Tooltip>
                                {!_includes(queue, item.id) &&
                                    <Tooltip title={t("download")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                        <Button className={Styles.trackAction} size="small" color="primary" disableElevation variant="contained" data-id={item.id} onClick={onDownloadTrackClick}>
                                            <DownloadIcon />
                                        </Button>
                                    </Tooltip>
                                }
                                {_includes(queue, item.id) &&
                                    <Tooltip title={t("cancel")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                        <Button size="small" className={Styles.trackAction} color="primary" disableElevation variant="contained" data-id={item.id} onClick={onCancelTrackClick}>
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
                            <Grid size={3.5}>
                                <ListItemText primary={item.title} secondary={moment.duration(item.duration, "seconds").format("mm:ss", { trim: false})} />
                            </Grid>
                            <Grid size={2} className={Styles.column}>
                                {!_isEmpty(trackCuts[item.id]) &&
                                    <>
                                        <ContentCutIcon className={Styles.cutIcon} color="action"/>
                                        <Typography variant="caption">
                                            {formatTime(_toString(trackCuts[item.id][0]))} - {formatTime(_toString(trackCuts[item.id][1]))}
                                        </Typography>
                                    </>
                                }
                            </Grid>
                            {info && <>
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
    );
};

export default TrackList;

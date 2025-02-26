import _filter from "lodash/filter";
import _find from "lodash/find";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _map from "lodash/map";
import _omit from "lodash/omit";
import _toInteger from "lodash/toInteger";
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
import {
    Avatar, Button, List, ListItem, ListItemText, Popover, Slider, Stack, TextField, Typography
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
    queue: string[];
};

export const TrackList: React.FC<TrackListProps> = (props: TrackListProps) => {
    const {onDownloadTrack, onCancelTrack, queue} = props;
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

    const onDownloadTrackClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");
        setTrackStatus((prev) => _filter(prev, (item) => item.trackId !== trackId));

        if (_isFunction(onDownloadTrack)) {
            onDownloadTrack(trackId);
        }
    };

    const onOpenTrackCut = (event: React.MouseEvent<HTMLButtonElement>) => {
        const trackId = event.currentTarget.getAttribute("data-id");
        const track = _find(tracks, ["id", trackId]);

        setCutAnchorEl(event.currentTarget);
        setCutOpen(trackId);
        setTrackCuts((prev) => ({...prev, [trackId]: prev[trackId] ?? [0, track.duration]}));
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
        setTrackCuts((prev) => ({...prev, [cutOpen]: [_toInteger(e.target.value), prev[cutOpen][1]]}));
    };

    const onCutEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTrackCuts((prev) => ({...prev, [cutOpen]: [prev[cutOpen][0],_toInteger(e.target.value)]}));
    };

    const onCutTimeChange = (event: Event, value: number | number[], activeThumb: number) => {
        if (!Array.isArray(value)) {
            return;
        }
    
        if (activeThumb === 0) {
            setTrackCuts((prev) => ({...prev, [cutOpen]: [value[0], prev[cutOpen][1]]}));
        } else {
            setTrackCuts((prev) => ({...prev, [cutOpen]: [prev[cutOpen][0], value[1]]}));
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

                    return (<ListItem
                        divider
                        dense
                        key={item.id}
                        className={Styles.track}
                        // disableGutters
                        // sx={{backgroundColor: info?.completed ? "success.main" : info?.error ? "error.main" : "inherit"}}
                        secondaryAction={
                            <Stack direction="row" spacing={2}>
                                {_includes(queue, item.id) &&
                                    <Button size="small" className={Styles.trackAction} color="secondary" disableElevation variant="contained" data-id={item.id} onClick={onCancelTrackClick}>
                                        <CloseIcon />
                                    </Button>
                                }
                                {!_includes(queue, item.id) &&
                                    <div>
                                        <Button size="small" className={Styles.trackAction} color="secondary" disableElevation variant="contained" data-id={item.id} onClick={onOpenTrackCut}>
                                            <ContentCutIcon />
                                        </Button>
                                        <Popover
                                            id={item.id}
                                            open={Boolean(cutAnchorEl) && cutOpen === item.id}
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
                                                        value={_get(trackCuts, `${item.id}.0`, 0) + ""}
                                                        onChange={onCutStartTimeChange}
                                                        format={formatTime}
                                                        customInput={TextField}
                                                        variant="outlined"
                                                        label={t("from")}
                                                    />
                                                </Grid>
                                                <Grid size={5}>
                                                    <NumberFormatBase
                                                        value={_get(trackCuts, `${item.id}.1`, item.duration) + ""}
                                                        onChange={onCutEndTimeChange}
                                                        format={formatTime}
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
                                {!_includes(queue, item.id) &&
                                    <Button className={Styles.trackAction} size="small" color="secondary" disableElevation variant="contained" data-id={item.id} onClick={onDownloadTrackClick}>
                                        <DownloadIcon />
                                    </Button>
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
                            <Grid size={4}>
                                <ListItemText primary={item.title} secondary={moment.duration(item.duration, "seconds").format("m:ss")} />
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
                                    <Typography variant="body1">{formatFileSize(info.totalSize ?? item.filesize_approx)}</Typography>
                                </Grid>
                                <Grid size={1} className={Styles.column}>
                                    {info.completed ?
                                        <CheckIcon className={Styles.completedIcon} color="success" />
                                        : info.error ?
                                            <CloseIcon className={Styles.completedIcon} color="error" />
                                            : <Progress color="primary" value={info.percent} />
                                    }
                                </Grid>
                                <Grid size={2} className={Styles.column}>
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

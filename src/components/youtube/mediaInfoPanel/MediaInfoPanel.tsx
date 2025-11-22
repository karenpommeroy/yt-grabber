import classnames from "classnames";
import {ipcRenderer} from "electron";
import {assign, cloneDeep, forEach, includes, isFunction, last, map, pick, some} from "lodash-es";
import moment from "moment";
import React, {useCallback, useState} from "react";
import {useTranslation} from "react-i18next";

import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LaunchIcon from "@mui/icons-material/Launch";
import YouTubeIcon from "@mui/icons-material/YouTube";
import {
    Box, Button, Card, CardContent, CardMedia, Grid, LinearProgress, Tooltip, Typography
} from "@mui/material";

import {AlbumInfo, PlaylistInfo} from "../../../common/Youtube";
import {Messages} from "../../../messaging/Messages";
import {useDataState} from "../../../react/contexts/DataContext";
import CutModal, {TrackCut} from "../../modals/cutModal/CutModal";
import DetailsModal from "../../modals/detailsModal/DetailsModal";
import ImageModal from "../../modals/imageModal/ImageModal";
import Progress from "../../progress/Progress";
import Styles from "./MediaInfoPanel.styl";

export type MediaInfoPanelProps = {
    item?: AlbumInfo;
    playlist?: PlaylistInfo;
    className?: string;
    loading?: boolean;
    progress?: number;
    onCancel?: () => void;
    onDownload?: (albumId: string) => void;
    onOpenOutput?: () => void;
}

export const MediaInfoPanel: React.FC<MediaInfoPanelProps> = (props: MediaInfoPanelProps) => {
    const {item, playlist, className, onCancel, onDownload, onOpenOutput, loading, progress = 0} = props;
    const {trackStatus, setPlaylists, setTrackCuts, queue} = useDataState();
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [cutTrackModalOpen, setCutTrackModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const {t} = useTranslation();
    const [value, setValue] = useState(item);
    const [tracksSeparated, setTracksSeparated] = useState<boolean>();
    
    const onDetailsModalClose = (data: AlbumInfo) => {
        setValue((prev) => assign(prev, data));
        setDetailsModalOpen(false);
    };

    const onImageModalClose = () => {
        setImageModalOpen(false);
    };
    
    const onCutTrackModalCancel = () => {
        setCutTrackModalOpen(false);
    };

    const onCutTrackModalClose = (cuts: TrackCut[]) => {        
        setPlaylists((prev) => {
            const found = prev.find((p) => p.url === playlist.url);
            const currentTrack = last(found.tracks);

            return map(prev, (p) => {
                if (p.url === playlist.url) {
                    const newTracks = map(cuts, (cutTrack, index) => {
                        const clonedTrack = cloneDeep(currentTrack);
                        
                        return assign({}, clonedTrack, {
                            id: cutTrack.id,
                            title: cutTrack.title,
                            playlist: p.url,
                            playlist_autonumber: index + 1,
                            playlist_count: cuts.length,
                        });
                    });
                    const updated = assign({}, found, {album: assign({}, found.album, {tracksNumber: cuts.length}), tracks: newTracks});

                    return updated;
                }

                return p;
            });
        });

        setTrackCuts((prev) => {
            const newCuts: {[key: string]: [number, number][]} = {};
            
            forEach(cuts, (c) => {
                newCuts[c.id] = [[c.startTime, c.endTime]];

            });

            return {...prev, ...newCuts};
        });

        setTracksSeparated(true);
        setCutTrackModalOpen(false);
    };

    const cancel = () => {
        if (isFunction(onCancel)) {
            onCancel();
        }
    };

    const openOutputFolder = () => {
        if (isFunction(onOpenOutput)) {
            onOpenOutput();
        }
    };

    const onOpenInBrowser = () => {
        ipcRenderer.send(Messages.OpenUrlInBrowser, {url: item.url});
    };

    const editInfo = useCallback(() => {
        setDetailsModalOpen(true);
    }, [cutTrackModalOpen, setCutTrackModalOpen]);

    const cutTrack = useCallback(() => {
        setCutTrackModalOpen(true);
    }, [cutTrackModalOpen, setCutTrackModalOpen]);

    const showCoverImage = useCallback(() => {
        setImageModalOpen(true);
    }, [imageModalOpen, setImageModalOpen]);
    
    const downloadPlaylist = () => {
        if (isFunction(onDownload)) {
            onDownload(value.id);
        }
    };
    
    return (
        <>
            <Grid className={classnames(className, Styles.mediaInfoPanel)} size={12} data-help="mediaInfo">
                <Card variant="outlined" className={Styles.header}>
                    <div className={Styles.imageWrapper} style={{marginRight: 1}}>
                        <CardMedia
                            component="img"
                            className={Styles.imageButton}
                            image={value.thumbnail}
                            alt={value.title}
                            onClick={showCoverImage}
                            data-help="showThumbnail"
                        />
                        <AspectRatioIcon className={Styles.imageViewIcon} />
                    </div>
                    <Box className={Styles.content}>
                        <CardContent className={Styles.info}>
                            <div className={classnames(Styles.row, Styles, Styles.title)}>
                                <Typography variant="subtitle2" className={Styles.label}>{t("title")}:</Typography>
                                <Typography variant="subtitle2" sx={{color: "text.secondary"}} className={classnames(Styles.label, Styles.bold)}>{value.title}</Typography>
                            </div>
                            <div className={classnames(Styles.row, Styles, Styles.artist)}>
                                <Typography variant="body1" className={Styles.label}>{t("artist")}:</Typography>
                                <Typography variant="body1" sx={{color: "text.secondary"}}>{value.artist}</Typography>
                            </div>
                            <div className={Styles.row}>
                                <Typography variant="subtitle2" className={Styles.label}>{t("releaseYear")}:</Typography>
                                <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{value.releaseYear}</Typography>
                            </div>
                            <div className={Styles.row}>
                                <Typography variant="subtitle2" className={Styles.label}>{t("duration")}:</Typography>
                                <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{moment.duration(value.duration, "seconds").format("m:ss")}</Typography>
                            </div>
                        </CardContent>
                        {!loading &&
                            <Box className={Styles.actions} padding={2} gap={2}>
                                <Tooltip title={t("edit")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                    <Button data-help="editInfo" className={Styles.edit} size="large" fullWidth variant="contained" color="primary" disableElevation onClick={editInfo}>
                                        <EditIcon />
                                    </Button>
                                </Tooltip>
                                {(tracksSeparated || playlist.tracks.length === 1) && <Tooltip title={t("cut")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                    <Button data-help="cutTrack" className={Styles.cutTrack} size="large" fullWidth variant="contained" color="primary" disableElevation onClick={cutTrack}>
                                        <FormatListNumberedIcon />
                                    </Button>
                                </Tooltip>}
                                {some(trackStatus, (s) => s.completed) &&
                                    <Tooltip title={t("openOutputDirectory")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                        <Button data-help="openOutputDirectory" className={Styles.openOutput} size="large" fullWidth variant="contained" color="primary" disableElevation onClick={openOutputFolder}>
                                            <LaunchIcon />
                                        </Button>
                                    </Tooltip>
                                }
                                <Tooltip title={t("openInBrowser")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                    <Button data-help="openInBrowser" className={Styles.openInBrowser} size="large" fullWidth disableElevation variant="contained" color="primary" onClick={onOpenInBrowser}>
                                        <YouTubeIcon />
                                    </Button>
                                </Tooltip>
                                <Tooltip title={t("downloadPlaylist")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                    <div>
                                        <Button disabled={includes(queue, "load-single") || includes(queue, "load-multi")} data-help="downloadPlaylist" className={Styles.download} size="large" fullWidth variant="contained" color="secondary" disableElevation onClick={downloadPlaylist}>
                                            <DownloadIcon />
                                        </Button>
                                    </div>
                                </Tooltip>
                            </Box>
                        }
                        {loading &&
                            <Grid container className={Styles.loading}>
                                <Grid>
                                    <Button data-help="cancelDownloadPlaylist" variant="contained" size="large" color="secondary" disableElevation startIcon={<CloseIcon />} onClick={cancel}>{t("cancel")}</Button>
                                </Grid>
                                <Grid>
                                    <Box className={Styles.progressIndicator} padding={2} gap={1}>
                                        <Progress size={60} thickness={6.5} color="primary" value={progress} />
                                    </Box>
                                </Grid>
                            </Grid>
                        }
                        {loading &&
                            <Box className={Styles.progress}>
                                <LinearProgress className={Styles.progressBar} variant="determinate" color="primary" value={progress} />
                            </Box>
                        }
                    </Box>
                </Card>
            </Grid>
            <DetailsModal
                id="details-modal"
                details={pick(value, ["artist", "title", "releaseYear"])}
                open={detailsModalOpen}
                onClose={onDetailsModalClose}
            />
            <ImageModal
                id="media-image-modal"
                imageUrl={value.thumbnail}
                open={imageModalOpen}
                onClose={onImageModalClose}
                title={value.title}
            />
            <CutModal
                id="cut-modal"
                duration={value.duration}
                open={cutTrackModalOpen}
                onClose={onCutTrackModalClose}
                onCancel={onCutTrackModalCancel}
            />
        </>
    );
};

export default MediaInfoPanel;

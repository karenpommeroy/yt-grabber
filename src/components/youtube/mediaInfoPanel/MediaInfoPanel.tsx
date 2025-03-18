import classnames from "classnames";
import _assign from "lodash/assign";
import _isFunction from "lodash/isFunction";
import _pick from "lodash/pick";
import _some from "lodash/some";
import moment from "moment";
import React, {useCallback, useState} from "react";
import {useTranslation} from "react-i18next";

import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import LaunchIcon from "@mui/icons-material/Launch";
import {
    Box, Button, Card, CardContent, CardMedia, LinearProgress, Tooltip, Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {AlbumInfo} from "../../../common/Youtube";
import {useDataState} from "../../../react/contexts/DataContext";
import DetailsModal from "../../modals/DetailsModal";
import Progress from "../../progress/Progress";
import Styles from "./MediaInfoPanel.styl";

export type MediaInfoPanelProps = {
    item?: AlbumInfo;
    className?: string;
    loading?: boolean;
    progress?: number;
    onCancel?: () => void;
    onDownload?: (albumId: string) => void;
    onOpenOutput?: () => void;
}

export const MediaInfoPanel: React.FC<MediaInfoPanelProps> = (props: MediaInfoPanelProps) => {
    const {item, className, onCancel, onDownload, onOpenOutput, loading, progress = 0} = props;
    const {trackStatus} = useDataState();
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const {t} = useTranslation();
    const [value, setValue] = useState(item);
    
    const onDetailsModalClose = (data: AlbumInfo) => {
        setValue((prev) => _assign(prev, data));
        setDetailsModalOpen(false);
    };

    const cancel = () => {
        if (_isFunction(onCancel)) {
            onCancel();
        }
    };

    const openOutputFolder = () => {
        if (_isFunction(onOpenOutput)) {
            onOpenOutput();
        }
    };

    const editInfo = useCallback(() => {
        setDetailsModalOpen(true);
    }, [detailsModalOpen, setDetailsModalOpen]);
    
    const downloadPlaylist = () => {
        if (_isFunction(onDownload)) {
            onDownload(value.id);
        }
    };
    
    return (
        <>
            <Grid className={classnames(className, Styles.mediaInfoPanel)} size={12}>
                <Card variant="outlined" className={Styles.header}>
                    <CardMedia
                        component="img"
                        sx={{width: 100, height: "auto", marginRight: 1}}
                        image={value.thumbnail}
                        alt={value.title}
                    />
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
                                {_some(trackStatus, (s) => s.completed) &&
                                    <Tooltip title={t("openOutputDirectory")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                        <Button className={Styles.openOutput} size="large" fullWidth variant="contained" color="secondary" disableElevation onClick={openOutputFolder}>
                                            <LaunchIcon />
                                        </Button>
                                    </Tooltip>
                                }
                                <Tooltip title={t("edit")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                    <Button className={Styles.edit} size="large" fullWidth variant="contained" color="secondary" disableElevation onClick={editInfo}>
                                        <EditIcon />
                                    </Button>
                                </Tooltip>
                                <Tooltip title={t("downloadPlaylist")} arrow enterDelay={2000} leaveDelay={100} enterNextDelay={500} placement="top">
                                    <Button className={Styles.download} size="large" fullWidth variant="contained" color="secondary" disableElevation onClick={downloadPlaylist}>
                                        <DownloadIcon/>
                                    </Button>
                                </Tooltip>
                            </Box>
                        }
                        {loading &&
                            <Grid container className={Styles.loading}>
                                <Grid>
                                    <Button variant="contained" size="large" color="secondary" disableElevation startIcon={<CloseIcon />} onClick={cancel}>{t("cancel")}</Button>
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
                details={_pick(value, ["artist", "title", "releaseYear"])}
                open={detailsModalOpen}
                onClose={onDetailsModalClose}
            />
        </>
    );
};

export default MediaInfoPanel;

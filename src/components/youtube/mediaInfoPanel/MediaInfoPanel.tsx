import classnames from "classnames";
import _assign from "lodash/assign";
import _isFunction from "lodash/isFunction";
import moment from "moment";
import React, {useCallback, useState} from "react";
import {useTranslation} from "react-i18next";

import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import {Box, Button, Card, CardContent, CardMedia, LinearProgress, Typography} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {AlbumInfo} from "../../../common/Youtube";
import {useDataState} from "../../../react/contexts/DataContext";
import DetailsModal from "../../modals/DetailsModal";
import Progress from "../../progress/Progress";
import Styles from "./MediaInfoPanel.styl";

export type MediaInfoPanelProps = {
    className?: string;
    loading?: boolean;
    progress?: number;
    onCancel?: () => void;
}

export const MediaInfoPanel: React.FC<MediaInfoPanelProps> = (props: MediaInfoPanelProps) => {
    const {className, onCancel, loading, progress = 0} = props;
    const {album, setAlbum} = useDataState();
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const {t} = useTranslation();
    
    const onDetailsModalClose = (data: AlbumInfo) => {
        setAlbum((prev) => _assign(prev, data));
        setDetailsModalOpen(false);
    };

    const cancel = () => {
        if (_isFunction(onCancel)) {
            onCancel();
        }
    };

    const editInfo = useCallback(() => {
        setDetailsModalOpen(true);
    }, [detailsModalOpen, setDetailsModalOpen]);
    
    return (
        <>
            <Grid className={classnames(className, Styles.mediaInfoPanel)} size={12}>
                <Card variant="outlined" className={Styles.header}>
                    <CardMedia
                        component="img"
                        sx={{width: 100, height: "auto", marginRight: 1}}
                        image={album.thumbnail}
                        alt={album.title}
                    />
                    <Box className={Styles.content}>
                        <CardContent className={Styles.info}>
                            <div className={classnames(Styles.row, Styles, Styles.title)}>
                                <Typography variant="subtitle2" className={Styles.label}>{t("title")}:</Typography>
                                <Typography variant="subtitle2" sx={{color: "text.secondary"}} className={classnames(Styles.label, Styles.bold)}>{album.title}</Typography>
                            </div>
                            <div className={classnames(Styles.row, Styles, Styles.artist)}>
                                <Typography variant="body1" className={Styles.label}>{t("artist")}:</Typography>
                                <Typography variant="body1" sx={{color: "text.secondary"}}>{album.artist}</Typography>
                            </div>
                            <div className={Styles.row}>
                                <Typography variant="subtitle2" className={Styles.label}>{t("releaseYear")}:</Typography>
                                <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{album.releaseYear}</Typography>
                            </div>
                            <div className={Styles.row}>
                                <Typography variant="subtitle2" className={Styles.label}>{t("duration")}:</Typography>
                                <Typography variant="subtitle2" sx={{color: "text.secondary"}}>{moment.duration(album.duration, "seconds").format("m:ss")}</Typography>
                            </div>
                        </CardContent>
                        {!loading &&
                            <Box className={Styles.actions} padding={2} gap={1}>
                                <Button className={Styles.edit} title={t("edit")} size="large" fullWidth variant="contained" color="secondary" disableElevation onClick={editInfo}>
                                    <EditIcon />
                                </Button>
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
                details={album}
                open={detailsModalOpen}
                onClose={onDetailsModalClose}
            />
        </>
    );
};

export default MediaInfoPanel;

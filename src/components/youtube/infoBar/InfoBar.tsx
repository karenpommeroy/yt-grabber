import _filter from "lodash/filter";
import _find from "lodash/find";
import _isEmpty from "lodash/isEmpty";
import _reject from "lodash/reject";
import _size from "lodash/size";
import _some from "lodash/some";
import React from "react";
import {useTranslation} from "react-i18next";

import {Box, LinearProgress, Stack, Tooltip, Typography} from "@mui/material";

import {useAppContext} from "../../../react/contexts/AppContext";
import {useDataState} from "../../../react/contexts/DataContext";
import LogMenu from "../logMenu/LogMenu";
import Styles from "./InfoBar.styl";

export type InfoBarProps = {
    hidden?: boolean;
}

export const InfoBar: React.FC<InfoBarProps> = (props) => {
    const {hidden} = props;
    const {tracks, playlists, trackStatus, errors, warnings} = useDataState();
    const {state} = useAppContext();
    const {t} = useTranslation();

    const getGrabbedPlaylists = () => {
        const grabbed = _reject(playlists, (p) => _some(p.tracks, (track) => {
            const found = _find(trackStatus, (s) => s.trackId === track.id);
            
            return !found || !found.completed;
        }));

        return _size(grabbed);
    };

    const getGrabbedTracks = () => {
        const grabbed = _filter(trackStatus, (s) => s.completed);

        return _size(grabbed);
    };

    const getTotalProgress = () => {
        const grabbed = _filter(trackStatus, (s) => s.completed);

        return _size(grabbed) / _size(tracks) * 100;
    };
    
    if (hidden) return null;

    return (
        <Stack className={Styles.infoBar} direction="row" justifyContent="space-between" spacing={1} padding={1.5} data-help="infoBar">
            <Stack direction="row" alignItems="start">
                <LogMenu hidden={_isEmpty(errors) && _isEmpty(warnings)} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography className={Styles.label} variant="body2" color="primary.light">{t("playlists")}:</Typography>
                <Tooltip title={t("totalPlaylistsCount", {num: _size(playlists)})} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                    <Typography data-help="allPlaylists" className={Styles.value} variant="body2">{_size(playlists)}</Typography>
                </Tooltip>
                <Tooltip title={t("downloadedPlaylistsCount", {num: getGrabbedPlaylists()})} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                    <Typography data-help="grabbedPlaylists" className={Styles.value} variant="body2">{`(${getGrabbedPlaylists()})`}</Typography>
                </Tooltip>
                <Typography className={Styles.label} variant="body2" color="primary.light">{t("tracks")}:</Typography>
                <Tooltip title={t("totalTracksCount", {num: _size(tracks)})} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                    <Typography data-help="allTracks" className={Styles.value} variant="body2">{_size(tracks)}</Typography>
                </Tooltip>
                <Tooltip title={t("downloadedTracksCount", {num: getGrabbedTracks()})} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                    <Typography data-help="grabbedTracks" className={Styles.value} variant="body2">{`(${getGrabbedTracks()})`}</Typography>
                </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="end">
            </Stack>
            {state.loading &&
                <Box className={Styles.progress}>
                    <LinearProgress className={Styles.progressBar} variant="determinate" color="primary" value={getTotalProgress()} />
                </Box>
            }
        </Stack>
    );
};

export default InfoBar;

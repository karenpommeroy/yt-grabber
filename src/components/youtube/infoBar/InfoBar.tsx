import {filter, find, isEmpty, reject, size, some} from "lodash-es";
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
        const grabbed = reject(playlists, (p) => some(p.tracks, (track) => {
            const found = find(trackStatus, (s) => s.trackId === track.id);
            
            return !found || !found.completed;
        }));

        return size(grabbed);
    };

    const getGrabbedTracks = () => {
        const grabbed = filter(trackStatus, (s) => s.completed);

        return size(grabbed);
    };

    const getTotalProgress = () => {
        const grabbed = filter(trackStatus, (s) => s.completed);

        return size(grabbed) / size(tracks) * 100;
    };
    
    if (hidden) return null;

    return (
        <Stack className={Styles.infoBar} direction="row" justifyContent="space-between" spacing={1} padding={1.5} data-help="infoBar">
            <Stack direction="row" alignItems="start">
                <LogMenu hidden={isEmpty(errors) && isEmpty(warnings)} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography className={Styles.label} variant="body2" color="primary.light">{t("playlists")}:</Typography>
                <Tooltip title={t("totalPlaylistsCount", {num: size(playlists)})} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                    <Typography data-help="allPlaylists" className={Styles.value} variant="body2">{size(playlists)}</Typography>
                </Tooltip>
                <Tooltip title={t("downloadedPlaylistsCount", {num: getGrabbedPlaylists()})} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                    <Typography data-help="grabbedPlaylists" className={Styles.value} variant="body2">{`(${getGrabbedPlaylists()})`}</Typography>
                </Tooltip>
                <Typography className={Styles.label} variant="body2" color="primary.light">{t("tracks")}:</Typography>
                <Tooltip title={t("totalTracksCount", {num: size(tracks)})} arrow enterDelay={500} leaveDelay={100} enterNextDelay={500}>
                    <Typography data-help="allTracks" className={Styles.value} variant="body2">{size(tracks)}</Typography>
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

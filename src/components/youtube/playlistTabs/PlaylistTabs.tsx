import classnames from "classnames";
import {ipcRenderer, IpcRendererEvent} from "electron";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _first from "lodash/first";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _map from "lodash/map";
import _reduce from "lodash/reduce";
import _size from "lodash/size";
import _some from "lodash/some";
import path from "path";
import React, {useEffect, useState} from "react";

import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import {Avatar, Box, Grid, Skeleton, Stack, Typography} from "@mui/material";
import Tab from "@mui/material/Tab";

import {OpenSystemPathParams} from "../../../common/Messaging";
import {useAppContext} from "../../../react/contexts/AppContext";
import {useDataState} from "../../../react/contexts/DataContext";
import Progress from "../../progress/Progress";
import MediaInfoPanel from "../mediaInfoPanel/MediaInfoPanel";
import TrackList from "../trackList/TrackList";
import Styles from "./PlaylistTabs.styl";

export type PlaylistTabsProps = {
    queue: string[];
    pending?: string[];
    onDownloadTrack?: (id: string) => void;
    onDownloadPlaylist?: (id: string) => void;
    onCancelPlaylist?: (id: string) => void;
    onCancelTrack?: (id: string) => void;
};

export const PlaylistTabs: React.FC<PlaylistTabsProps> = (props: PlaylistTabsProps) => {
    const {queue, pending, onDownloadTrack, onDownloadPlaylist, onCancelPlaylist, onCancelTrack} = props;
    const {trackStatus, playlists, activeTab, setActiveTab} = useDataState();
    const {state} = useAppContext();
    const [pendingTabs, setPendingTabs] = useState([]);
    const tabWidth = window.innerWidth / (pendingTabs.length + playlists.length) - 30; 

    useEffect(() => {
        if (!state.loading && !_find(playlists, ["url", activeTab])) {
            setActiveTab(_get(playlists, "0.url", _first(pendingTabs)));
        }
    }, [playlists, pendingTabs, state.loading]);

    useEffect(() => {
        if (!state.loading) {
            setPendingTabs([]);
            
            return;
        }

        setPendingTabs(_filter(pending, (p) => !_find(playlists, (pl) => pl.url === p)));
    }, [state.loading, playlists, pending]);

    useEffect(() => {
        if (activeTab) return;
        
        setActiveTab(_get(playlists, "0.url", _first(pendingTabs)));
    }, []);


    const isPlaylistLoading = (id: string) => {
        const playlist = _find(playlists, ["album.id", id]);
        const playlistTracks = _map(_get(playlist, "tracks"), "id");

        return _some(playlistTracks, (pt) => _includes(queue, pt));
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
    };

    const handleDownloadTrack = (trackId: string) => {
        if (_isFunction(onDownloadTrack)) {
            onDownloadTrack(trackId);
        }
    };

    const handleDownloadAlbum = (albumId: string) => {
        if (_isFunction(onDownloadPlaylist)) {
            onDownloadPlaylist(albumId);
        }
    };

    const onCancel = () => {
        if (_isFunction(onCancelPlaylist)) {
            onCancelPlaylist(activeTab);
        }
    };

    const onOpenFile = (trackId: string) => {
        const found = _find(trackStatus, ["trackId", trackId]);

        ipcRenderer.send("open-system-path", {filepath: found.path});
    };

    const onOpenDirectory = () => {
        const found = _find(trackStatus, "completed");

        ipcRenderer.send("open-system-path", {dirpath: path.dirname(found.path)});
    };

    const openInBrowser = (url: string) => {
        ipcRenderer.send("open-url-in-browser", {url});
    };

    const getTotalProgress = (albumId: string) => {
        const trackIdsForAlbum = _map(_get(_find(playlists, ["album.id", albumId]), "tracks"), "id");
        const tracksCompletedForAlbum = _filter(trackStatus, (item) => _includes(trackIdsForAlbum, item.trackId) && (item.completed || item.error));
        const tracksPendingForAlbum = _filter(queue, (item) => _includes(trackIdsForAlbum, item));

        const completed = _size(tracksCompletedForAlbum);
        const running = _size(tracksPendingForAlbum);
        const total = completed + running;

        const progress = _reduce(tracksPendingForAlbum, (prev, curr) => {
            const status = _find(trackStatus, ["trackId", curr]);
    
            return status ? prev + status.percent / 100 : prev;
        }, 0);

        return (completed + progress) / total * 100;
    };

    const onOpenSystemDirectoryCompleted = (event: IpcRendererEvent, data: string) => {
        const parsed: OpenSystemPathParams = JSON.parse(data);
        
        return parsed;
    };
    
    const onOpenUrlInBrowserCompleted = (event: IpcRendererEvent, data: string) => {
        const parsed: OpenSystemPathParams = JSON.parse(data);
        
        return parsed;
    };

    const cancelTrack = (id: string) => {
        if (_isFunction(onCancelTrack)) {
            onCancelTrack(id);
        }
    };

    useEffect(() => {
        ipcRenderer.on("open-system-path-completed", onOpenSystemDirectoryCompleted);
        ipcRenderer.on("open-url-in-browser-completed", onOpenUrlInBrowserCompleted);

        return () => {
            ipcRenderer.off("open-system-path-completed", onOpenSystemDirectoryCompleted);
            ipcRenderer.off("open-url-in-browser-completed", onOpenUrlInBrowserCompleted);
        };
    }, []);
    
    if (_isEmpty(playlists) && _isEmpty(pendingTabs)) {
        return null;
    }

    return (
        <Grid className={Styles.playlistTabs} size={12}>
            <TabContext value={activeTab ?? _get(playlists, "0.url", _first(pendingTabs))}>
                <Box borderBottom={1} borderColor="divider">
                    <TabList variant="scrollable" scrollButtons="auto" onChange={handleTabChange} textColor="primary" indicatorColor="secondary" className={Styles.tablist}>
                        {_map(playlists, (playlist) => {
                            const progress = getTotalProgress(playlist.album.id);
                            const loading = !isNaN(progress) && progress !== 100;

                            return <Tab
                                key={playlist.album.id}
                                className={Styles.tab}
                                icon={
                                    <div>
                                        <Avatar className={classnames(Styles.tabIcon, {[Styles.loading]: loading})} src={playlist.album.thumbnail} />
                                        {loading && <Progress variant="indeterminate" className={Styles.tabProgress} thickness={4} color="primary" value={progress} />}
                                    </div>
                                }
                                iconPosition="start"
                                label={<Typography title={playlist.album.title} variant="button" className={Styles.tabTitle} sx={{maxWidth: tabWidth}}>{playlist.album.title}</Typography>}
                                value={playlist.url}
                            />;
                        })}
                        {_map(pendingTabs, (item) => {
                            return <Tab
                                key={item}
                                className={Styles.tab}
                                icon={<Skeleton variant="circular" width={40} height={40} />}
                                iconPosition="start"
                                label={<Skeleton className={Styles.tabTitle} height={30} width={60} />}
                                value={item}
                            />;
                        })}
                    </TabList>
                </Box>
                {_map(playlists, (playlist) =>
                    <TabPanel className={Styles.tabPanel} value={playlist.url} key={playlist.url}>
                        <MediaInfoPanel
                            item={playlist.album}
                            loading={isPlaylistLoading(playlist.album.id)}
                            progress={getTotalProgress(playlist.album.id)}
                            onDownload={handleDownloadAlbum}
                            onCancel={onCancel}
                            onOpenOutput={onOpenDirectory}
                        />
                        <TrackList
                            items={playlist.tracks}
                            queue={queue}
                            onDownloadTrack={handleDownloadTrack}
                            onOpenUrl={openInBrowser}
                            onCancelTrack={cancelTrack}
                            onOpenFile={onOpenFile}
                        />
                    </TabPanel>
                )}
                {_map(pendingTabs, (item) =>
                    <TabPanel className={Styles.tabPanel} value={item} key={item}>
                        <Stack spacing={3}>
                            <Stack spacing={3} direction="row">
                                <Skeleton variant="rounded" width={100} height={80} />
                                <Skeleton variant="rounded" width="100%" height={80} />
                            </Stack>
                            <Skeleton variant="rounded" width="100%" height={50} />
                            <Skeleton variant="rounded" width="100%" height={50} />
                            <Skeleton variant="rounded" width="100%" height={50} />
                        </Stack>
                    </TabPanel>
                )}
            </TabContext>
        </Grid>
    );
};

export default PlaylistTabs;

import classnames from "classnames";
import {ipcRenderer, IpcRendererEvent} from "electron";
import _difference from "lodash/difference";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _get from "lodash/get";
import _includes from "lodash/includes";
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
import {Avatar, Box} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Tab from "@mui/material/Tab";

import {OpenSystemPathParams} from "../../../common/Messaging";
import {useDataState} from "../../../react/contexts/DataContext";
import Progress from "../../progress/Progress";
import MediaInfoPanel from "../mediaInfoPanel/MediaInfoPanel";
import TrackList from "../trackList/TrackList";
import Styles from "./PlaylistTabs.styl";

export type PlaylistTabsProps = {
    // items: PlaylistInfo[];
    queue: string[];
    onDownloadTrack?: (id: string) => void;
    onDownloadPlaylist?: (id: string) => void;
    onCancelPlaylist?: (id: string) => void;
    onCancelTrack?: (id: string) => void;
};

export const PlaylistTabs: React.FC<PlaylistTabsProps> = (props: PlaylistTabsProps) => {
    const {queue, onDownloadTrack, onDownloadPlaylist, onCancelPlaylist, onCancelTrack} = props;
    const {trackStatus, playlists} = useDataState();
    const [selected, setSelected] = useState(_get(playlists, "0.album.id"));
    const onlyOnePlaylist = playlists.length === 1;
    
    const isPlaylistLoading = (id: string) => {
        const playlist = _find(playlists, ["album.id", id]);
        const playlistTracks = _map(_get(playlist, "tracks"), "id");

        return _some(playlistTracks, (pt) => _includes(queue, pt));
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setSelected(newValue);
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
            onCancelPlaylist(selected);
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
        const trackIdsForSelectedTab = _map(_get(_find(playlists, ["album.id", albumId]), "tracks"), "id");
        const filteredQueue = _filter(queue, (item) => _includes(trackIdsForSelectedTab, item));

        const total = _size(trackIdsForSelectedTab) * 100;
        const completed = _size(_difference(trackIdsForSelectedTab, filteredQueue)) * 100;

        const progress = _reduce(filteredQueue, (prev: number, curr: string) => {
            const status = _find(trackStatus, ["trackId", curr]);
    
            return status ? prev + status.percent : prev;
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

    return (
        <Grid className={Styles.playlistTabs} size={12}>
            <TabContext value={selected}>
                {!onlyOnePlaylist && <Box borderBottom={1} borderColor="divider">
                    <TabList scrollButtons="auto" onChange={handleTabChange} textColor="primary" indicatorColor="secondary" className={Styles.tablist}>
                        {_map(playlists, (item) => {
                            const progress = getTotalProgress(item.album.id);
                            const loading = !isNaN(progress) && progress !== 100;

                            return <Tab
                                key={item.album.id}
                                className={Styles.tab}
                                icon={
                                    <div>
                                        <Avatar className={classnames(Styles.tabIcon, {[Styles.loading]: loading})} src={item.album.thumbnail} />
                                        {loading && <Progress variant="indeterminate" className={Styles.tabProgress} thickness={4} color="primary" value={progress} />}
                                    </div>
                                }
                                iconPosition="start"
                                label={<div className={Styles.tabTitle}>{item.album.title}</div>}
                                value={item.album.id}
                            />;
                        })}
                    </TabList>
                </Box>}
                {_map(playlists, (item) =>
                    <TabPanel className={Styles.tabPanel} value={item.album.id} key={item.album.id}>
                        <MediaInfoPanel
                            item={item.album}
                            loading={isPlaylistLoading(item.album.id)}
                            progress={getTotalProgress(selected)}
                            onDownload={handleDownloadAlbum}
                            onCancel={onCancel}
                            onOpenOutput={onOpenDirectory}
                        />
                        <TrackList
                            items={item.tracks}
                            queue={queue}
                            onDownloadTrack={handleDownloadTrack}
                            onOpenUrl={openInBrowser}
                            onCancelTrack={cancelTrack}
                            onOpenFile={onOpenFile}
                        />
                    </TabPanel>
                )}
            </TabContext>
        </Grid>
    );
};

export default PlaylistTabs;

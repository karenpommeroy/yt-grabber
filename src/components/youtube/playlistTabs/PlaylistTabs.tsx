import classnames from "classnames";
import {ipcRenderer, IpcRendererEvent} from "electron";
import {
    filter, find, findIndex, flatMap, get, includes, isEmpty, isFunction, map, orderBy, reduce,
    size, some
} from "lodash-es";
import path from "path";
import React, {MouseEvent, useCallback, useEffect} from "react";

import CloseIcon from "@mui/icons-material/Close";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import {Avatar, Badge, Box, Grid, Skeleton, Stack, Typography} from "@mui/material";
import Tab from "@mui/material/Tab";

import {SortOrder, TabsOrderKey} from "../../../common/Media";
import {OpenSystemPathParams} from "../../../common/Messaging";
import {AlbumInfo} from "../../../common/Youtube";
import {Messages} from "../../../messaging/Messages";
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
    const {queue, onDownloadTrack, onDownloadPlaylist, onCancelPlaylist, onCancelTrack} = props;
    const {trackStatus, playlists, activeTab, setActiveTab, setTrackStatus, setPlaylists, setTracks} = useDataState();
    const {state} = useAppContext();
    const tabWidth = window.innerWidth / (playlists.length + playlists.length) - 30; 

    useEffect(() => {
        if (activeTab && includes(map(playlists, "url"), activeTab)) {
            return;
        }
        setActiveTab(get(playlists, "0.url"));
    }, [JSON.stringify(playlists)]);

    useEffect(() => {
        if (state.loading) return;

        const tabsOrder = global.store.get<string, [TabsOrderKey & keyof AlbumInfo, SortOrder]>("application.tabsOrder");
        const orderedPlaylists = tabsOrder[0] === TabsOrderKey.Default ? playlists : orderBy(playlists, [(p) => p.album[tabsOrder[0]]], [tabsOrder[1]]);
        const orderedTracks = flatMap(orderedPlaylists, (n) => n.tracks);
        
        setPlaylists(orderedPlaylists);
        setTracks(orderedTracks);
    }, [state.loading, JSON.stringify(playlists)]);

    const isPlaylistLoading = (id: string) => {
        const playlist = find(playlists, ["album.id", id]);
        const playlistTracks = map(get(playlist, "tracks"), "id");

        return some(playlistTracks, (pt) => includes(queue, pt));
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
    };

    const handleDownloadTrack = (trackId: string) => {
        if (isFunction(onDownloadTrack)) {
            onDownloadTrack(trackId);
        }
    };

    const handleDownloadAlbum = (albumId: string) => {
        if (isFunction(onDownloadPlaylist)) {
            onDownloadPlaylist(albumId);
        }
    };

    const onCancel = () => {
        if (isFunction(onCancelPlaylist)) {
            onCancelPlaylist(activeTab);
        }
    };

    const onRemove = useCallback((event: MouseEvent<SVGSVGElement>) => {
        event.stopPropagation();
        const currentIndex = findIndex(playlists, (p) => p.url === activeTab);
        const nextIndex = currentIndex === size(playlists) - 1 ? currentIndex - 1 : currentIndex + 1;
        const albumId = event.currentTarget.getAttribute("data-id");
        const trackIdsForAlbum = map(get(find(playlists, ["album.id", albumId]), "tracks"), "id");
        
        setActiveTab(playlists[nextIndex]?.url);
        setTrackStatus((prev) => filter(prev, (p) => !includes(trackIdsForAlbum, p.trackId)));
        setPlaylists((prev) => filter(prev, (p) => p.album.id !== albumId));
        setTracks((prev) => filter(prev, (p) => !includes(trackIdsForAlbum, p.id)));
    }, [playlists, activeTab]);

    const onOpenFile = (trackId: string) => {
        const found = find(trackStatus, ["trackId", trackId]);

        ipcRenderer.send(Messages.OpenSystemPath, {filepath: found.path});
    };

    const onOpenDirectory = () => {
        const found = find(trackStatus, "completed");

        ipcRenderer.send(Messages.OpenSystemPath, {dirpath: path.dirname(found.path)});
    };

    const openInBrowser = (url: string) => {
        ipcRenderer.send(Messages.OpenUrlInBrowser, {url});
    };

    const getTotalProgress = (albumId: string) => {
        const trackIdsForAlbum = map(get(find(playlists, ["album.id", albumId]), "tracks"), "id");
        const tracksCompletedForAlbum = filter(trackStatus, (item) => includes(trackIdsForAlbum, item.trackId) && (item.completed || item.error));
        const tracksPendingForAlbum = filter(queue, (item) => includes(trackIdsForAlbum, item));

        const completed = size(tracksCompletedForAlbum);
        const running = size(tracksPendingForAlbum);
        const total = completed + running;

        const progress = reduce(tracksPendingForAlbum, (prev, curr) => {
            const status = find(trackStatus, ["trackId", curr]);
    
            return status ? prev + status.percent / 100 : prev;
        }, 0);

        return (completed + progress) / total * 100;
    };

    const resolveActiveTab = (): any => {
        if (includes(map(playlists, "url"), activeTab)) {
            return activeTab;
        }
        return false;
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
        if (isFunction(onCancelTrack)) {
            onCancelTrack(id);
        }
    };

    useEffect(() => {
        ipcRenderer.on(Messages.OpenSystemPathCompleted, onOpenSystemDirectoryCompleted);
        ipcRenderer.on(Messages.OpenUrlInBrowserCompleted, onOpenUrlInBrowserCompleted);

        return () => {
            ipcRenderer.off(Messages.OpenSystemPathCompleted, onOpenSystemDirectoryCompleted);
            ipcRenderer.off(Messages.OpenUrlInBrowserCompleted, onOpenUrlInBrowserCompleted);
        };
    }, []);
    
    if (isEmpty(playlists)) {
        return null;
    }

    return (
        <Grid className={Styles.playlistTabs} size={12}>
            <TabContext value={resolveActiveTab()}>
                <Box borderBottom={1} borderColor="divider">
                    <TabList variant="scrollable" scrollButtons="auto" onChange={handleTabChange} textColor="primary" indicatorColor="secondary" className={Styles.tablist}>
                        {map(filter(playlists, (p) => !isEmpty(p.album)), (item) => {
                            const progress = getTotalProgress(item.album.id);
                            const loading = !isNaN(progress) && progress !== 100;

                            return <Tab
                                key={item.album.id}
                                className={Styles.tab}
                                
                                icon={
                                    <Badge
                                        className={Styles.tabRemoveButton}
                                        badgeContent={<CloseIcon data-id={item.album.id} className={Styles.tabRemoveIcon} onClick={onRemove}/>}
                                    />
                                }
                                iconPosition="end"
                                label={
                                    <>
                                        <div>
                                            <Avatar className={classnames(Styles.tabIcon, {[Styles.loading]: loading})} src={item.album.thumbnail} />
                                            {loading && <Progress variant="indeterminate" className={Styles.tabProgress} thickness={4} color="primary" value={progress} />}
                                        </div>
                                        <Typography title={item.album.title} variant="button" className={Styles.tabTitle} sx={{maxWidth: tabWidth}}>{item.album.title}</Typography>
                                    </>
                                }
                                value={item.url}
                            />;
                        })}
                        {map(filter(playlists, (p) => isEmpty(p.album)), (item) => {
                            return <Tab
                                key={item.url}
                                className={Styles.tab}
                                icon={<Skeleton variant="circular" width={40} height={40} />}
                                iconPosition="start"
                                label={<Skeleton className={Styles.tabTitle} height={30} width={60} />}
                                value={item.url}
                            />;
                        })}
                    </TabList>
                </Box>
                {map(filter(playlists, (p) => !isEmpty(p.album)), (item) =>
                    <TabPanel className={Styles.tabPanel} value={item.url} key={item.url}>
                        <MediaInfoPanel
                            playlist={item}
                            item={item.album}
                            loading={isPlaylistLoading(item.album.id)}
                            progress={getTotalProgress(item.album.id)}
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
                {map(filter(playlists, (p) => isEmpty(p.album)), (item) =>
                    <TabPanel className={Styles.tabPanel} value={item.url} key={item.url}>
                        <Stack spacing={3}>
                            <Stack spacing={3} direction="row">
                                <Skeleton variant="rounded" width={100} height={80} />
                                <Skeleton variant="rounded" width="100%" height={80} />
                            </Stack>
                            <Skeleton variant="rounded" width="100%" height={50} />
                            <Skeleton variant="rounded" width="100%" height={50} />
                            <Skeleton variant="rounded" width="100%" height={50} />
                        </Stack>
                        <Progress size={100} thickness={4} variant="indeterminate" label={false} position="absolute"/>
                    </TabPanel>
                )}
            </TabContext>
        </Grid>
    );
};

export default PlaylistTabs;

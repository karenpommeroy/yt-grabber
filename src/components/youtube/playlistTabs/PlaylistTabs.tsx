import classnames from "classnames";
import {ipcRenderer, IpcRendererEvent} from "electron";
import _filter from "lodash/filter";
import _find from "lodash/find";
import _findIndex from "lodash/findIndex";
import _flatMap from "lodash/flatMap";
import _get from "lodash/get";
import _includes from "lodash/includes";
import _isEmpty from "lodash/isEmpty";
import _isFunction from "lodash/isFunction";
import _map from "lodash/map";
import _orderBy from "lodash/orderBy";
import _reduce from "lodash/reduce";
import _size from "lodash/size";
import _some from "lodash/some";
import path from "path";
import React, {MouseEvent, useCallback, useEffect} from "react";
import {useTranslation} from "react-i18next";

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
    const {t} = useTranslation();
    const tabWidth = window.innerWidth / (playlists.length + playlists.length) - 30; 

    useEffect(() => {
        if (activeTab && _includes(_map(playlists, "url"), activeTab)) {
            return;
        }
        setActiveTab(_get(playlists, "0.url"));
    }, [JSON.stringify(playlists)]);

    useEffect(() => {
        if (state.loading) return;

        const tabsOrder = global.store.get<string, [TabsOrderKey & keyof AlbumInfo, SortOrder]>("application.tabsOrder");
        const orderedPlaylists = tabsOrder[0] === TabsOrderKey.Default ? playlists : _orderBy(playlists, [(p) => p.album[tabsOrder[0]]], [tabsOrder[1]]);
        const orderedTracks = _flatMap(orderedPlaylists, (n) => n.tracks);
        
        setPlaylists(orderedPlaylists);
        setTracks(orderedTracks);
    }, [state.loading, JSON.stringify(playlists)]);

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

    const onRemove = useCallback((event: MouseEvent<SVGSVGElement>) => {
        event.stopPropagation();
        const currentIndex = _findIndex(playlists, (p) => p.url === activeTab);
        const nextIndex = currentIndex === _size(playlists) - 1 ? currentIndex - 1 : currentIndex + 1;
        const albumId = event.currentTarget.getAttribute("data-id");
        const trackIdsForAlbum = _map(_get(_find(playlists, ["album.id", albumId]), "tracks"), "id");
        
        setActiveTab(playlists[nextIndex]?.url);
        setTrackStatus((prev) => _filter(prev, (p) => !_includes(trackIdsForAlbum, p.trackId)));
        setPlaylists((prev) => _filter(prev, (p) => p.album.id !== albumId));
        setTracks((prev) => _filter(prev, (p) => !_includes(trackIdsForAlbum, p.id)));
    }, [playlists, activeTab]);

    const onOpenFile = (trackId: string) => {
        const found = _find(trackStatus, ["trackId", trackId]);

        ipcRenderer.send(Messages.OpenSystemPath, {filepath: found.path});
    };

    const onOpenDirectory = () => {
        const found = _find(trackStatus, "completed");

        ipcRenderer.send(Messages.OpenSystemPath, {dirpath: path.dirname(found.path)});
    };

    const openInBrowser = (url: string) => {
        ipcRenderer.send(Messages.OpenUrlInBrowser, {url});
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

    const resolveActiveTab = (): any => {
        if (_includes(_map(playlists, "url"), activeTab)) {
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
        if (_isFunction(onCancelTrack)) {
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
    
    if (_isEmpty(playlists)) {
        return null;
    }

    return (
        <Grid className={Styles.playlistTabs} size={12}>
            <TabContext value={resolveActiveTab()}>
                <Box borderBottom={1} borderColor="divider">
                    <TabList variant="scrollable" scrollButtons="auto" onChange={handleTabChange} textColor="primary" indicatorColor="secondary" className={Styles.tablist}>
                        {_map(_filter(playlists, (p) => !_isEmpty(p.album)), (item) => {
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
                        {_map(_filter(playlists, (p) => _isEmpty(p.album)), (item) => {
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
                {_map(_filter(playlists, (p) => !_isEmpty(p.album)), (item) =>
                    <TabPanel className={Styles.tabPanel} value={item.url} key={item.url}>
                        <MediaInfoPanel
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
                {_map(_filter(playlists, (p) => _isEmpty(p.album)), (item) =>
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

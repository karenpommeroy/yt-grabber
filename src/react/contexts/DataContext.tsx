import React, {createContext, useContext, useState} from "react";

import {AudioType, MediaFormat} from "../../common/Media";
import {ApplicationOptions} from "../../common/Store";
import {PlaylistInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
import {Format} from "../../components/youtube/formatSelector/FormatSelector";

export type Task = {
    id: string;
    error?: any;
    progress?: number;
    state: "starting" | "running" | "completed" | "cancelled";
    event?: string;
    dirty?: boolean;
}

export type DataState = {
    playlists: PlaylistInfo[];
    tracks: TrackInfo[]; 
    trackStatus: TrackStatusInfo[]; 
    trackCuts: {[key: string]: number[];};
    format: Format;
    urls: string[];
    autoDownload: boolean;
    operation: string;
    queue: string[];
    tasks: Task[];

    setPlaylists: React.Dispatch<React.SetStateAction<PlaylistInfo[]>>;
    setTracks: React.Dispatch<React.SetStateAction<TrackInfo[]>>;
    setTrackStatus: React.Dispatch<React.SetStateAction<TrackStatusInfo[]>>;
    setTrackCuts: React.Dispatch<React.SetStateAction<{[key: string]: number[]}>>;
    setFormat: React.Dispatch<React.SetStateAction<Format>>;
    setUrls: React.Dispatch<React.SetStateAction<string[]>>;
    setAutoDownload: React.Dispatch<React.SetStateAction<boolean>>;
    setQueue: React.Dispatch<React.SetStateAction<string[]>>;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    setOperation: React.Dispatch<React.SetStateAction<string>>;
    clear: () => void;
}

const DataContext = createContext<DataState | undefined>(undefined);

export function DataProvider(props: any) {
    const [appOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
    const [tracks, setTracks] = useState<TrackInfo[]>([]);
    const [trackStatus, setTrackStatus] = useState<TrackStatusInfo[]>([]);
    const [trackCuts, setTrackCuts] = useState<{[key: string]: number[]}>({});
    const [format, setFormat] = useState<Format>({type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 0});
    const [urls, setUrls] = useState<string[]>(appOptions.urls);
    const [autoDownload, setAutoDownload] = useState<boolean>(false);
    const [queue, setQueue] = useState<string[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [operation, setOperation] = useState<string>();

    const clear = () => {
        setPlaylists([]);
        setTracks([]);
        setTrackStatus([]);
        setTrackCuts({});
        setAutoDownload(false);
        setQueue([]);
        setTasks([]);
        setOperation(undefined);
    };

    return (
        <DataContext.Provider value={{
            playlists,
            tracks,
            trackStatus,
            trackCuts,
            format,
            urls,
            autoDownload,
            queue,
            operation,
            tasks,
            
            setOperation,
            setPlaylists,
            setAutoDownload,
            setTracks,
            setTrackStatus,
            setTrackCuts,
            setFormat,
            setUrls,
            setQueue,
            setTasks,
            clear
        }}>
            {props.children}
        </DataContext.Provider>
    );
}

export function useDataState() {
    return useContext(DataContext);
}

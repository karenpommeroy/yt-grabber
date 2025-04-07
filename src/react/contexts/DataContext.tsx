import React, {createContext, useContext, useState} from "react";

import {AudioType, Format, MediaFormat} from "../../common/Media";
import {ApplicationOptions} from "../../common/Store";
import {PlaylistInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";

export type Task = {
    id: string;
    error?: any;
    progress?: number;
    state: "starting" | "running" | "completed" | "cancelled";
    event?: string;
    dirty?: boolean;
};

export type LogEntry = {
    url: string;
    message: string;
};

export type DataState = {
    playlists: PlaylistInfo[];
    tracks: TrackInfo[];
    trackStatus: TrackStatusInfo[];
    trackCuts: {[key: string]: number[];};
    formats: Record<string, Format>;
    urls: string[];
    autoDownload: boolean;
    operation: string;
    activeTab: string;
    queue: string[];
    errors: LogEntry[];
    warnings: LogEntry[];

    setPlaylists: React.Dispatch<React.SetStateAction<PlaylistInfo[]>>;
    setTracks: React.Dispatch<React.SetStateAction<TrackInfo[]>>;
    setTrackStatus: React.Dispatch<React.SetStateAction<TrackStatusInfo[]>>;
    setTrackCuts: React.Dispatch<React.SetStateAction<{[key: string]: number[];}>>;
    setFormats: React.Dispatch<React.SetStateAction<Record<string, Format>>>;
    setUrls: React.Dispatch<React.SetStateAction<string[]>>;
    setAutoDownload: React.Dispatch<React.SetStateAction<boolean>>;
    setQueue: React.Dispatch<React.SetStateAction<string[]>>;
    setOperation: React.Dispatch<React.SetStateAction<string>>;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    setErrors: React.Dispatch<React.SetStateAction<LogEntry[]>>;
    setWarnings: React.Dispatch<React.SetStateAction<LogEntry[]>>;
    clear: () => void;
};

const DataContext = createContext<DataState | undefined>(undefined);

export function DataProvider(props: any) {
    const [appOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
    const [tracks, setTracks] = useState<TrackInfo[]>([]);
    const [trackStatus, setTrackStatus] = useState<TrackStatusInfo[]>([]);
    const [trackCuts, setTrackCuts] = useState<{[key: string]: number[]}>({});
    const [formats, setFormats] = useState<Record<string, Format>>({global: {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 0}});
    const [urls, setUrls] = useState<string[]>(appOptions.urls);
    const [autoDownload, setAutoDownload] = useState<boolean>(false);
    const [queue, setQueue] = useState<string[]>([]);
    const [operation, setOperation] = useState<string>();
    const [activeTab, setActiveTab] = useState<string>();
    const [errors, setErrors] = useState<LogEntry[]>([]);
    const [warnings, setWarnings] = useState<LogEntry[]>([]);

    const clear = () => {
        setPlaylists([]);
        setTracks([]);
        setTrackStatus([]);
        setTrackCuts({});
        setAutoDownload(false);
        setQueue([]);
        setFormats({global: {type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 0}});
        setOperation(undefined);
        setErrors([]);
        setWarnings([]);
    };

    return (
        <DataContext.Provider value={{
            playlists,
            tracks,
            trackStatus,
            trackCuts,
            formats,
            urls,
            autoDownload,
            queue,
            operation,
            activeTab,
            errors,
            warnings,

            setOperation,
            setPlaylists,
            setAutoDownload,
            setTracks,
            setTrackStatus,
            setTrackCuts,
            setFormats,
            setUrls,
            setQueue,
            setActiveTab,
            setErrors,
            setWarnings,
            clear
        }}>
            {props.children}
        </DataContext.Provider>
    );
};

export function useDataState() {
    return useContext(DataContext);
};

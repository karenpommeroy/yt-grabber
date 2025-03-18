import React, {createContext, useContext, useState} from "react";

import {AudioType, MediaFormat} from "../../common/Media";
import {ApplicationOptions} from "../../common/Store";
import {PlaylistInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
import {Format} from "../../components/youtube/formatSelector/FormatSelector";

export type DataState = {
    playlists: PlaylistInfo[];
    tracks: TrackInfo[]; 
    trackStatus: TrackStatusInfo[]; 
    trackCuts: {[key: string]: number[];};
    format: Format;
    urls: string[];

    setPlaylists: React.Dispatch<React.SetStateAction<PlaylistInfo[]>>;
    setTracks: React.Dispatch<React.SetStateAction<TrackInfo[]>>;
    setTrackStatus: React.Dispatch<React.SetStateAction<TrackStatusInfo[]>>;
    setTrackCuts: React.Dispatch<React.SetStateAction<{[key: string]: number[]}>>;
    setFormat: React.Dispatch<React.SetStateAction<Format>>;
    setUrls: React.Dispatch<React.SetStateAction<string[]>>;
    clear: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider(props: any) {
    const [appOptions] = useState<ApplicationOptions>(global.store.get("application"));
    const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
    const [tracks, setTracks] = useState<TrackInfo[]>([]);
    const [trackStatus, setTrackStatus] = useState<TrackStatusInfo[]>([]);
    const [trackCuts, setTrackCuts] = useState<{[key: string]: number[]}>({});
    const [format, setFormat] = useState<Format>({type: MediaFormat.Audio, extension: AudioType.Mp3, audioQuality: 0});
    const [urls, setUrls] = useState<string[]>(appOptions.urls);
    
    const clear = () => {
        setPlaylists([]);
        setTracks([]);
        setTrackStatus([]);
        setTrackCuts({});
        // setUrls([]);
    };

    return (
        <DataContext.Provider value={{playlists, tracks, trackStatus, trackCuts, format, urls, setPlaylists, setTracks, setTrackStatus, setTrackCuts, setFormat, setUrls, clear}}>
            {props.children}
        </DataContext.Provider>
    );
}

export function useDataState() {
    return useContext(DataContext);
}

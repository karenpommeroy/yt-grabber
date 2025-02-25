import React, {createContext, useContext, useState} from "react";

import {AlbumInfo, TrackCut, TrackInfo, TrackStatusInfo} from "../../common/Youtube";

export type DataState = {
    album?: AlbumInfo; 
    tracks: TrackInfo[]; 
    trackStatus: TrackStatusInfo[]; 
    trackCuts: {[key: string]: TrackCut};
    setAlbum: React.Dispatch<React.SetStateAction<AlbumInfo>>;
    setTracks: React.Dispatch<React.SetStateAction<TrackInfo[]>>;
    setTrackStatus: React.Dispatch<React.SetStateAction<TrackStatusInfo[]>>;
    setTrackCuts: React.Dispatch<React.SetStateAction<{[key: string]: TrackCut}>>;
    clear: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider(props: any) {
    const [album, setAlbum] = useState<AlbumInfo | undefined>();
    const [tracks, setTracks] = useState<TrackInfo[]>([]);
    const [trackStatus, setTrackStatus] = useState<TrackStatusInfo[]>([]);
    const [trackCuts, setTrackCuts] = useState<{[key: string]: TrackCut}>({});
    
    const clear = () => {
        setAlbum(undefined);
        setTracks([]);
        setTrackStatus([]);
        setTrackCuts({});
    };

    return (
        <DataContext.Provider value={{album, tracks, trackStatus, trackCuts, setAlbum, setTracks, setTrackStatus, setTrackCuts, clear}}>
            {props.children}
        </DataContext.Provider>
    );
}

export function useDataState() {
    return useContext(DataContext);
}

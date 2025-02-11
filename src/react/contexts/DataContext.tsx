import React, {createContext, useContext, useState} from "react";

import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";

export type DataState = {
    album?: AlbumInfo; 
    tracks: TrackInfo[]; 
    trackStatus: TrackStatusInfo[]; 
    setAlbum: React.Dispatch<React.SetStateAction<AlbumInfo>>; //(album?: AlbumInfo) => void;
    setTracks: React.Dispatch<React.SetStateAction<TrackInfo[]>>; // (tracks: TrackInfo[]) => void;
    setTrackStatus: React.Dispatch<React.SetStateAction<TrackStatusInfo[]>>; // (trackStatus: TrackStatusInfo[]) => void;
    clear: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider(props: any) {
    const [album, setAlbum] = useState<AlbumInfo | undefined>();
    const [tracks, setTracks] = useState<TrackInfo[]>([]);
    const [trackStatus, setTrackStatus] = useState<TrackStatusInfo[]>([]);

    const clear = () => {
        setAlbum(undefined);
        setTracks([]);
        setTrackStatus([]);
    };

    return (
        <DataContext.Provider value={{album, tracks, trackStatus, setAlbum, setTracks, setTrackStatus, clear}}>
            {props.children}
        </DataContext.Provider>
    );
}

export function useDataState() {
    return useContext(DataContext);
}

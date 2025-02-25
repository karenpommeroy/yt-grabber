import _includes from "lodash/includes";
import _isNil from "lodash/isNil";
import _merge from "lodash/merge";
import _union from "lodash/union";
import React, {createContext, useContext, useEffect, useRef, useState} from "react";

import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";

export type DataState = {[key: string]: DataStateItem}

export type DataStateItem = {
    album?: AlbumInfo; 
    tracks: TrackInfo[]; 
    trackStatus: TrackStatusInfo[]; 
    // setAlbum: React.Dispatch<React.SetStateAction<AlbumInfo>>;
    // setTracks: React.Dispatch<React.SetStateAction<TrackInfo[]>>;
    // setTrackStatus: React.Dispatch<React.SetStateAction<TrackStatusInfo[]>>;
    // clear: () => void;
}

export type DataContextState = {
    data: DataState;
    setData: React.Dispatch<React.SetStateAction<DataState>>
    getData: (id: string) => DataStateItem;
}

const DataContext = createContext<DataContextState | null>(null);

export function DataProvider(props: any) {
    const [data, setData] = useState<DataState>({});
    const dataRef = useRef<DataState>({});

    const getData = (id: string): DataStateItem => {
        if (id && !_isNil(data[id])) {
            return data[id];
        } else if (id && _isNil(data[id])) {
            _merge(data,
                {
                    [id]: {
                        album: undefined,
                        tracks: [],
                        trackStatus: [],
                    }
                }
            );
            // setData((prev) => {
            //     return {
            //         ...prev,
            //         [id]: {
            //             album: undefined,
            //             tracks: [],
            //             trackStatus: [],
            //         }
            //     };
            // })

            return data[id];  //dataRef.current[id];
        }
    }
    

    useEffect(() => {
        dataRef.current = data;
    }, [data])

    return (
        // <DataContext.Provider value={{album, tracks, trackStatus, setAlbum, setTracks, setTrackStatus, clear}}>
        <DataContext.Provider value={{data, setData, getData}}>
            {props.children}
        </DataContext.Provider>
    );
}

export function useDataState() {
    return useContext(DataContext);
}

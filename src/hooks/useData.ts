

import _assign from "lodash/assign";
import _merge from "lodash/merge";

import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../common/Youtube";

export type useDataType = {
    album?: AlbumInfo; 
    tracks: TrackInfo[]; 
    trackStatus: TrackStatusInfo[]; 
    setAlbum: React.Dispatch<React.SetStateAction<AlbumInfo>>;
    setTracks: React.Dispatch<React.SetStateAction<TrackInfo[]>>;
    setTrackStatus: React.Dispatch<React.SetStateAction<TrackStatusInfo[]>>;
    clear: () => void;
}

const useData = (id?: string): any => {
    // const {data, getData, setData} = useDataState();
    // const state = getData(id);
    
    // const [album, setAlbum] = useState<AlbumInfo>();
    // const [tracks, setTracks] = useState<TrackInfo[]>();
    // const [trackStatus, setTrackStatus] = useState<TrackStatusInfo[]>();
    
    // useEffect(() => {
    //     setData((prev) => {
    //         return {...prev, [id]: _merge({}, prev[id], {album})};
    //     });
    // }, [album]);

    // useEffect(() => {
    //     setData((prev) => {
    //         return {...prev, [id]: _assign({}, prev[id], {tracks})};
    //     });
    // }, [tracks]);

    // useEffect(() => {
    //     setData((prev) => {
    //         return {...prev, [id]: _assign({}, prev[id], {trackStatus})};
    //     });
    // }, [trackStatus]);

    // const clear = () => {
    //     setAlbum(null);
    //     setTracks(null);
    //     setTrackStatus(null);
    // };

    return {
        // album: state.album,
        // tracks: state.tracks,
        // trackStatus: state.trackStatus,
        // setAlbum,
        // setTracks,
        // setTrackStatus,
        // clear
    };
};

export default useData;

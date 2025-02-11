import {ColorMode} from "../../common/Theme";
import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
import {StateCreator} from "./State";

export interface IAppState {
    location?: string;
    theme?: string;
    mode?: ColorMode;
    album?: AlbumInfo;
    tracks?: TrackInfo[];
    trackStatus?: TrackStatusInfo[];
}

export const createDefaultState = () => {
    return StateCreator.create<IAppState>({
        location: "/",
        theme: "purple-rain",
        mode: ColorMode.Light,
        trackStatus: [],
    });
};

import {Dispatch} from "react";

import {ColorMode} from "../../common/Theme";
import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
import {IAction} from "./Action";

export enum AppActions {
    SetLocation = "SET_LOCATION",
    SetTheme = "SET_THEME",
    SetMode = "SET_MODE",
    SetAlbum = "SET_ALBUM",
    SetTracks = "SET_TRACKS",
    UpdateTrackStatus = "UPDATE_TRACK_STATUS",
}

export interface IAppAction extends IAction<AppActions> {
    location?: string;
    theme?: string;
    mode?: ColorMode;
    album?: AlbumInfo;
    tracks?: TrackInfo[];
    trackStatus?: TrackStatusInfo[];
}

export const actions = (dispatch: Dispatch<IAppAction>) => ({
    setLocation: (location: string) => dispatch({ type: AppActions.SetLocation, location }),
    setTheme: (theme: string) => dispatch({ type: AppActions.SetTheme, theme }),
    setMode: (mode: ColorMode) => dispatch({ type: AppActions.SetMode, mode }),
    setAlbum: (album: AlbumInfo) => dispatch({ type: AppActions.SetAlbum, album }),
    setTracks: (tracks: TrackInfo[]) => dispatch({ type: AppActions.SetTracks, tracks }),
    updateTrackStatus: (trackStatus: TrackStatusInfo[]) => dispatch({ type: AppActions.UpdateTrackStatus, trackStatus }),
});

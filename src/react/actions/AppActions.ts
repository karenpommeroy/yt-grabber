import {Dispatch} from "react";

import {ColorMode} from "../../common/Theme";
import {MediaFormat} from "../../enums/Media";
import {IAction} from "./Action";

export enum AppActions {
    SetLocation = "SET_LOCATION",
    SetTheme = "SET_THEME",
    SetMode = "SET_MODE",
    SetUrls = "SET_URLS",
    SetSelectedAction = "SET_SELECTED_ACTION",
    SetFormat = "SET_FORMAT",
    SetLoading = "SET_LOADING",
    SetQueue = "SET_QUEUE",
    SetControllers = "SET_CONTROLLERS",
}

export interface IAppAction extends IAction<AppActions> {
    location?: string;
    theme?: string;
    mode?: ColorMode;
    urls?: string[];
    selectedAction?: string;
    format?: MediaFormat;
    loading?: boolean;
    queue?: string[];
    controllers?: AbortController[];
}

export const actions = (dispatch: Dispatch<IAppAction>) => ({
    setLocation: (location: string) => dispatch({ type: AppActions.SetLocation, location }),
    setTheme: (theme: string) => dispatch({ type: AppActions.SetTheme, theme }),
    setMode: (mode: ColorMode) => dispatch({ type: AppActions.SetMode, mode }),
    setUrls: (urls: string[]) => dispatch({ type: AppActions.SetUrls, urls }),
    setSelectedAction: (selectedAction: string) => dispatch({ type: AppActions.SetSelectedAction, selectedAction }),
    setFormat: (format: MediaFormat) => dispatch({ type: AppActions.SetFormat, format }),
    setLoading: (loading: boolean) => dispatch({ type: AppActions.SetLoading, loading }),
    setQueue: (queue: string[]) => dispatch({ type: AppActions.SetQueue, queue }),
    setControllers: (controllers: AbortController[]) => dispatch({ type: AppActions.SetControllers, controllers }),
});

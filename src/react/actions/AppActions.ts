import {Dispatch} from "react";

import {ColorMode} from "../../common/Theme";

export interface IAction<T> {
    type: T;
}


export enum AppActions {
    SetLocation = "SET_LOCATION",
    SetTheme = "SET_THEME",
    SetMode = "SET_MODE",
    SetLoading = "SET_LOADING",
    SetHelp = "SET_HELP",
}

export interface IAppAction extends IAction<AppActions> {
    location?: string;
    theme?: string;
    mode?: ColorMode;
    loading?: boolean;
    help?: boolean;
}

export const actions = (dispatch: Dispatch<IAppAction>) => ({
    setLocation: (location: string) => dispatch({ type: AppActions.SetLocation, location }),
    setTheme: (theme: string) => dispatch({ type: AppActions.SetTheme, theme }),
    setMode: (mode: ColorMode) => dispatch({ type: AppActions.SetMode, mode }),
    setLoading: (loading: boolean) => dispatch({ type: AppActions.SetLoading, loading }),
    setHelp: (help: boolean) => dispatch({ type: AppActions.SetHelp, help }),
});

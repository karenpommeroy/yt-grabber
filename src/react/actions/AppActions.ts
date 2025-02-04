import {Dispatch} from "react";

import {ColorMode} from "../../common/Theme";
import {IAction} from "./Action";

export enum AppActions {
    SetLocation = "SET_LOCATION",
    SetTheme = "SET_THEME",
    SetMode = "SET_MODE",
}

export interface IAppAction extends IAction<AppActions> {
    location?: string;
    theme?: string;
    mode?: ColorMode;
}

export const actions = (dispatch: Dispatch<IAppAction>) => ({
    setLocation: (location: string) => dispatch({ type: AppActions.SetLocation, location }),
    setTheme: (theme: string) => dispatch({ type: AppActions.SetTheme, theme }),
    setMode: (mode: ColorMode) => dispatch({ type: AppActions.SetMode, mode }),
});

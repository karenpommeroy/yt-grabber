import {ColorMode} from "../../common/Theme";
import {Themes} from "../../theme/Theme";
import {StateCreator} from "./State";

export interface IAppState {
    location?: string;
    theme?: Themes;
    mode?: ColorMode;
    loading?: boolean;
    help?: boolean;
}

export const createDefaultState = () => {
    return StateCreator.create<IAppState>({
        location: "/",
        theme: global.store.get("application.colorTheme") ?? Themes.SunsetSky,
        mode: ColorMode.Dark,
        loading: false,
        help: false,
    });
};

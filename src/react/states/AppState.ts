import {ColorMode} from "../../common/Theme";
import {StateCreator} from "./State";

export interface IAppState {
    location?: string;
    theme?: string;
    mode?: ColorMode;
    loading?: boolean;
    help?: boolean;
}

export const createDefaultState = () => {
    return StateCreator.create<IAppState>({
        location: "/",
        theme: "purple-rain",
        mode: ColorMode.Light,
        loading: false,
        help: false,
    });
};

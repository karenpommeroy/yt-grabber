import {ColorMode} from "../../common/Theme";
import {MediaFormat} from "../../enums/MediaFormat";
import {StateCreator} from "./State";

export interface IAppState {
    location?: string;
    theme?: string;
    mode?: ColorMode;
    urls: string[];
    selectedAction?: string;
    format?: MediaFormat;
    loading?: boolean;
    queue?: string[];
    controllers?: AbortController[];
}

export const createDefaultState = () => {
    return StateCreator.create<IAppState>({
        location: "/",
        theme: "purple-rain",
        mode: ColorMode.Light,
        urls: [],
        selectedAction: undefined,
        format: MediaFormat.Audio,
        loading: false,
        queue: [],
        controllers: [],
    });
};

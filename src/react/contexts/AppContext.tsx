import React, {createContext, FC, ReactNode, useReducer} from "react";

import {ColorMode} from "../../common/Theme";
import {AlbumInfo, TrackInfo, TrackStatusInfo} from "../../common/Youtube";
import {actions} from "../actions/AppActions";
import reducer from "../reducers/AppReducer";
import {createDefaultState, IAppState} from "../states/AppState";

interface IAppContext {
    state: IAppState;
    actions: {
        setLocation: (location: string) => void;
        setTheme: (theme: string) => void;
        setMode: (mode: ColorMode) => void;
        setAlbum: (album: AlbumInfo) => void;
        setTracks: (tracks: TrackInfo[]) => void;
        updateTrackStatus: (track: TrackStatusInfo[]) => void;
    };
}

interface IAppContextProviderProps {
    children: ReactNode;
}

const AppContext = createContext<IAppContext | undefined>(undefined);

export const AppContextProvider: FC<IAppContextProviderProps> = (props: any) => {
    const [reducerState, dispatch] = useReducer(reducer, createDefaultState());
    const reducerActions = actions(dispatch);
    const context: IAppContext = {
        state: { ...reducerState },
        actions: { ...reducerActions },
    };

    return <AppContext.Provider value={context}>{props.children}</AppContext.Provider>;
};

export const useAppContext = (): IAppContext => {
    const context = React.useContext(AppContext);

    if (!context) {
        throw new Error("useAppContext must be used within AppContextProvider");
    }

    return context;
};

export default AppContext;

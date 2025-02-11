import {AppActions, IAppAction} from "../actions/AppActions";
import {IAppState} from "../states/AppState";
import {reduce} from "./Reducer";

const reducer = (state: IAppState, action: IAppAction): IAppState => {
    if (action.type === AppActions.SetLocation) {
        return reduce(state, { location: action.location });
    }

    if (action.type === AppActions.SetTheme) {
        return reduce(state, { theme: action.theme });
    }

    if (action.type === AppActions.SetMode) {
        return reduce(state, { mode: action.mode });
    }

    if (action.type === AppActions.SetAlbum) {
        return reduce(state, { album: action.album });
    }

    if (action.type === AppActions.SetTracks) {
        return reduce(state, { tracks: action.tracks });
    }
    
    if (action.type === AppActions.UpdateTrackStatus) {
        return reduce(state, { trackStatus: action.trackStatus });
    }

    throw new Error();
};

export default reducer;

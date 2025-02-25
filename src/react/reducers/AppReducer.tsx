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

    if (action.type === AppActions.SetUrls) {
        return reduce(state, { urls: action.urls });
    }

    if (action.type === AppActions.SetSelectedAction) {
        return reduce(state, { selectedAction: action.selectedAction });
    }

    if (action.type === AppActions.SetFormat) {
        return reduce(state, { format: action.format });
    }

    if (action.type === AppActions.SetLoading) {
        return reduce(state, { loading: action.loading });
    }

    if (action.type === AppActions.SetQueue) {
        return reduce(state, { queue: action.queue });
    }

    if (action.type === AppActions.SetControllers) {
        return reduce(state, { controllers: action.controllers });
    }

    throw new Error();
};

export default reducer;

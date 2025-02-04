import {AgressoActions, IAgressoAction} from "../actions/AgressoActions";
import {IAgressoState} from "../states/AgressoState";
import {reduce} from "./Reducer";

const reducer = (state: IAgressoState, action: IAgressoAction): IAgressoState => {
    if (action.type === AgressoActions.SetActiveMode) {
        return reduce(state, { activeMode: action.activeMode });
    }
    if (action.type === AgressoActions.SetTimeMode) {
        return reduce(state, { timeMode: action.timeMode });
    }
    if (action.type === AgressoActions.ChangeEntries) {
        return reduce(state, { entries: action.entries });
    }
    if (action.type === AgressoActions.ChangePeriod) {
        return reduce(state, { period: action.period });
    }
    if (action.type === AgressoActions.ChangeInvoice) {
        return reduce(state, { invoice: action.invoice });
    }
    if (action.type === AgressoActions.ChangeInvoiceTemplate) {
        return reduce(state, { template: action.template });
    }
    if (action.type === AgressoActions.ChangeExtraItems) {
        return reduce(state, { items: action.items });
    }
    if (action.type === AgressoActions.ChangeDueDays) {
        return reduce(state, { dueDays: action.dueDays });
    }

    throw new Error();
};

export default reducer;

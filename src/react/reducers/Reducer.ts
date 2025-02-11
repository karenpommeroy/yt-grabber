import $_ from "lodash";

import {StateCreator} from "../states/State";

export const reduce = <TState extends object>(state = StateCreator.create<TState>(), stateChange: Partial<TState>) => {
    return $_.assign({}, state, stateChange);
};
